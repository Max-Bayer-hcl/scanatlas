import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import re
import sqlite3

import fitz  # PyMuPDF
from backend.config import DOCS_ROOT, INDEX_DB_PATH, STUDY_ID_REGEX
from docx import Document


def extract_text_pdf(path: str) -> str:
    doc = fitz.open(path)
    return "\n".join(page.get_text() for page in doc)


def extract_text_docx(path: str) -> str:
    doc = Document(path)
    return "\n".join(p.text for p in doc.paragraphs)


def extract_study_id(text: str) -> str | None:
    match = re.search(STUDY_ID_REGEX, text, re.IGNORECASE)
    return match.group(1) if match else None


def build_index():
    os.makedirs(os.path.dirname(INDEX_DB_PATH), exist_ok=True)
    conn = sqlite3.connect(INDEX_DB_PATH)
    cur = conn.cursor()

    cur.execute("DROP TABLE IF EXISTS documents")
    cur.execute("""
        CREATE VIRTUAL TABLE documents USING fts5(
            study_id,
            source_dir,
            filename,
            content
        )
    """)

    for study_dir in os.scandir(DOCS_ROOT):
        if not study_dir.is_dir():
            continue
        for entry in os.scandir(study_dir.path):
            if entry.name.endswith(".pdf"):
                text = extract_text_pdf(entry.path)
            elif entry.name.endswith(".docx"):
                text = extract_text_docx(entry.path)
            else:
                continue

            study_id = extract_study_id(text) or study_dir.name
            cur.execute(
                "INSERT INTO documents VALUES (?, ?, ?, ?)",
                (study_id, study_dir.name, entry.name, text),
            )
            print(f"Indexed: {study_dir.name}/{entry.name}  →  study_id={study_id}")

    conn.commit()
    conn.close()
    print("Index built at", INDEX_DB_PATH)


if __name__ == "__main__":
    build_index()
