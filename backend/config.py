import os
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = PROJECT_ROOT / "data"

DOCS_ROOT = Path(os.getenv("DOCS_ROOT", str(DATA_DIR / "documents"))).resolve()
DICOM_ROOT = Path(os.getenv("DICOM_ROOT", str(DATA_DIR / "dicom"))).resolve()
INDEX_DB_PATH = Path(os.getenv("INDEX_DB_PATH", str(DATA_DIR / "index.db"))).resolve()

# Orthanc REST endpoint. Auth is disabled in our local config; if the user turns
# it back on, set ORTHANC_USERNAME / ORTHANC_PASSWORD via env.
ORTHANC_URL = os.getenv("ORTHANC_URL", "http://127.0.0.1:8042").rstrip("/")
ORTHANC_USERNAME = os.getenv("ORTHANC_USERNAME") or None
ORTHANC_PASSWORD = os.getenv("ORTHANC_PASSWORD") or None
ORTHANC_TIMEOUT = float(os.getenv("ORTHANC_TIMEOUT", "10"))

# Matches study IDs as they appear on charter / transmittal title pages, e.g.
#   "Image Review Charter for Study 22403"
#   "for Study No. 21140"
#   "in Study ASK-PD5-CS201"
#   "in Studies 21466 and 21467" (captures the first ID)
#   "Study ID: ABC-123" (legacy explicit form)
# The character class restricts the captured token to alphanumerics plus '-' and
# '_' so trailing punctuation or newlines are not absorbed.
STUDY_ID_REGEX = os.getenv(
    "STUDY_ID_REGEX",
    r"(?:Study\s*ID[:\s]+|(?:for|in)\s+Stud(?:y|ies)(?:\s+No\.?)?\s+)"
    r"([A-Za-z0-9][A-Za-z0-9_\-]*)",
)
