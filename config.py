import os

DOCS_ROOT = os.getenv("DOCS_ROOT", "../data/documents")
DICOM_ROOT = os.getenv("DICOM_ROOT", "../data/dicom")
INDEX_DB_PATH = os.getenv("INDEX_DB_PATH", "../data/index.db")

# Adjust this regex to match the study ID format in your documents
STUDY_ID_REGEX = r"Study\s*ID[:\s]+(\S+)"
