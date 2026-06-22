"""Backend-side bridge to the local Orthanc DICOM server.

All Orthanc traffic is server-to-server (uvicorn -> Orthanc on localhost) so the
browser never has to deal with Orthanc CORS / auth directly.
"""

from __future__ import annotations

import base64
import json
import urllib.error
import urllib.request
from typing import Any

from backend.config import (
    ORTHANC_PASSWORD,
    ORTHANC_TIMEOUT,
    ORTHANC_URL,
    ORTHANC_USERNAME,
)


class OrthancUnavailableError(RuntimeError):
    """Raised when the Orthanc REST endpoint can't be reached."""


def _auth_header() -> dict[str, str]:
    if ORTHANC_USERNAME and ORTHANC_PASSWORD:
        token = base64.b64encode(
            f"{ORTHANC_USERNAME}:{ORTHANC_PASSWORD}".encode()
        ).decode()
        return {"Authorization": f"Basic {token}"}
    return {}


def _request(
    path: str,
    method: str = "GET",
    body: bytes | None = None,
    headers: dict[str, str] | None = None,
) -> tuple[int, bytes, dict[str, str]]:
    url = f"{ORTHANC_URL}{path}"
    req = urllib.request.Request(url, data=body, method=method)
    for k, v in (_auth_header() | (headers or {})).items():
        req.add_header(k, v)
    try:
        with urllib.request.urlopen(req, timeout=ORTHANC_TIMEOUT) as resp:
            return resp.status, resp.read(), dict(resp.headers)
    except urllib.error.HTTPError as e:
        return e.code, e.read(), dict(e.headers or {})
    except (urllib.error.URLError, TimeoutError) as e:
        raise OrthancUnavailableError(f"orthanc unreachable at {ORTHANC_URL}: {e}")


def _get_json(path: str) -> Any:
    status, payload, _ = _request(path)
    if status >= 400:
        raise OrthancUnavailableError(f"orthanc {path} -> {status}")
    return json.loads(payload)


def _post_json(path: str, body: dict) -> Any:
    status, payload, _ = _request(
        path,
        method="POST",
        body=json.dumps(body).encode(),
        headers={"Content-Type": "application/json"},
    )
    if status >= 400:
        raise OrthancUnavailableError(
            f"orthanc {path} -> {status}: {payload[:200]!r}"
        )
    return json.loads(payload)


def _find_study_id_by_tag(tag: str, value: str) -> str | None:
    """Returns the Orthanc internal study UUID, or None if no match."""
    if not value:
        return None
    try:
        hits = _post_json(
            "/tools/find",
            {"Level": "Study", "Query": {tag: value}, "Expand": False},
        )
        if hits:
            return hits[0]
    except OrthancUnavailableError:
        return None
    return None


def find_study(*candidates: str) -> dict | None:
    """Resolve a free-form study identifier to an Orthanc study.

    Tries multiple candidate strings against StudyID, AccessionNumber and
    PatientID in turn, returning the first hit expanded with its series.
    """
    seen: set[str] = set()
    for candidate in candidates:
        if not candidate:
            continue
        if candidate in seen:
            continue
        seen.add(candidate)

        for tag in ("StudyID", "AccessionNumber", "PatientID"):
            orthanc_id = _find_study_id_by_tag(tag, candidate)
            if orthanc_id:
                return _hydrate_study(orthanc_id)

    return None


def _hydrate_study(orthanc_study_id: str) -> dict:
    study = _get_json(f"/studies/{orthanc_study_id}")
    main = study.get("MainDicomTags", {})
    patient = study.get("PatientMainDicomTags", {})

    series_payload: list[dict] = []
    for series_id in study.get("Series", []):
        try:
            series = _get_json(f"/series/{series_id}")
        except OrthancUnavailableError:
            continue
        s_tags = series.get("MainDicomTags", {})
        instance_ids = series.get("Instances", [])
        series_payload.append(
            {
                "orthanc_series_id": series_id,
                "series_instance_uid": s_tags.get("SeriesInstanceUID", ""),
                "modality": s_tags.get("Modality", ""),
                "description": s_tags.get("SeriesDescription", ""),
                "series_number": s_tags.get("SeriesNumber", ""),
                "instance_count": len(instance_ids),
                "preview_instance_id": instance_ids[len(instance_ids) // 2]
                if instance_ids
                else None,
                "instance_ids": instance_ids,
            }
        )

    return {
        "orthanc_study_id": orthanc_study_id,
        "study_id": main.get("StudyID", ""),
        "study_instance_uid": main.get("StudyInstanceUID", ""),
        "accession_number": main.get("AccessionNumber", ""),
        "study_description": main.get("StudyDescription", ""),
        "study_date": main.get("StudyDate", ""),
        "patient_id": patient.get("PatientID", ""),
        "patient_name": patient.get("PatientName", ""),
        "series": series_payload,
    }


def get_instance_bytes(instance_id: str) -> tuple[bytes, str]:
    """Return raw DICOM bytes for an instance UUID."""
    status, payload, headers = _request(f"/instances/{instance_id}/file")
    if status == 404:
        raise FileNotFoundError(instance_id)
    if status >= 400:
        raise OrthancUnavailableError(f"orthanc instance fetch -> {status}")
    return payload, headers.get("Content-Type", "application/dicom")


def get_instance_preview(instance_id: str) -> tuple[bytes, str]:
    """Return a PNG preview rendered by Orthanc for the given instance."""
    status, payload, headers = _request(f"/instances/{instance_id}/preview")
    if status == 404:
        raise FileNotFoundError(instance_id)
    if status >= 400:
        raise OrthancUnavailableError(f"orthanc preview -> {status}")
    return payload, headers.get("Content-Type", "image/png")
