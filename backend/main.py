"""FastAPI entry point for the Scanatlas backend."""

from __future__ import annotations

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response

from backend import dicom_service, search
from backend.dicom_service import OrthancUnavailableError

app = FastAPI(title="Scanatlas", version="0.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=False,
    allow_methods=["GET"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/search")
def api_search(
    q: str = Query("", description="free-text query"),
    limit: int = Query(50, ge=1, le=200),
) -> list[dict]:
    return search.search(q, limit=limit)


@app.get("/api/study/{study_query}/dicoms")
def api_study_dicoms(
    study_query: str,
    alt: str | None = Query(
        None,
        description=(
            "Alternate identifier to try if the primary lookup misses "
            "(e.g. pass source_dir when study_query is the protocol code)."
        ),
    ),
) -> dict:
    """Resolve `study_query` (and optional `alt`) against Orthanc.

    Tries StudyID -> AccessionNumber -> PatientID for each candidate, returning
    the first matching study with its series.
    """
    try:
        result = dicom_service.find_study(study_query, alt or "")
    except OrthancUnavailableError as e:
        raise HTTPException(status_code=503, detail=f"orthanc unavailable: {e}")
    if result is None:
        raise HTTPException(
            status_code=404,
            detail=f"no Orthanc study matched {study_query!r}"
            + (f" or {alt!r}" if alt else ""),
        )
    return result


@app.get("/api/dicom/instance/{instance_id}")
def api_dicom_instance(instance_id: str) -> Response:
    """Stream the raw DICOM file bytes for an Orthanc instance UUID."""
    try:
        payload, content_type = dicom_service.get_instance_bytes(instance_id)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="instance not found")
    except OrthancUnavailableError as e:
        raise HTTPException(status_code=503, detail=str(e))
    return Response(
        content=payload,
        media_type=content_type or "application/dicom",
        headers={"Content-Disposition": f'inline; filename="{instance_id}.dcm"'},
    )


@app.get("/api/dicom/preview/{instance_id}")
def api_dicom_preview(instance_id: str) -> Response:
    """Return Orthanc's rendered PNG preview for an instance (server-side proxy)."""
    try:
        payload, content_type = dicom_service.get_instance_preview(instance_id)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="instance not found")
    except OrthancUnavailableError as e:
        raise HTTPException(status_code=503, detail=str(e))
    return Response(
        content=payload,
        media_type=content_type or "image/png",
        headers={"Cache-Control": "public, max-age=300"},
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)
