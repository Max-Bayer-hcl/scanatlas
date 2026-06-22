"""Read-only SQLite FTS5 search over the pre-built document index."""

from __future__ import annotations

import sqlite3
import threading
from typing import Any

from backend.config import INDEX_DB_PATH

_conn: sqlite3.Connection | None = None
_conn_lock = threading.Lock()


def _get_conn() -> sqlite3.Connection | None:
    """Lazily open a read-only connection to the FTS5 index.

    Returns None if the index file does not exist yet (server can still boot
    before build_index.py has been run).
    """
    global _conn
    if _conn is not None:
        return _conn
    with _conn_lock:
        if _conn is not None:
            return _conn
        if not INDEX_DB_PATH.exists():
            return None
        uri = f"file:{INDEX_DB_PATH}?mode=ro"
        _conn = sqlite3.connect(uri, uri=True, check_same_thread=False)
        _conn.row_factory = sqlite3.Row
    return _conn


def _sanitize_query(q: str) -> str:
    """Make user input safe for FTS5 MATCH by quoting each token.

    FTS5 treats characters like `"` `:` `(` `)` `-` `*` as operators; wrapping
    each whitespace-separated token in double quotes turns them into a
    conjunctive phrase query that won't raise OperationalError on typical
    free-text input.
    """
    tokens = [t.replace('"', "") for t in q.split() if t.strip()]
    tokens = [t for t in tokens if t]
    if not tokens:
        return ""
    return " ".join(f'"{t}"' for t in tokens)


def search(q: str, limit: int = 50) -> list[dict[str, Any]]:
    q = (q or "").strip()
    if not q:
        return []

    conn = _get_conn()
    if conn is None:
        return []

    fts_query = _sanitize_query(q)
    if not fts_query:
        return []

    sql = """
        SELECT study_id,
               source_dir,
               filename,
               snippet(documents, 3, '<mark>', '</mark>', '…', 12) AS snippet,
               bm25(documents) AS rank
        FROM documents
        WHERE documents MATCH ?
        ORDER BY rank
        LIMIT ?
    """
    try:
        rows = conn.execute(sql, (fts_query, max(1, min(int(limit), 200)))).fetchall()
    except sqlite3.OperationalError:
        return []

    return [
        {
            "study_id": r["study_id"],
            "source_dir": r["source_dir"],
            "filename": r["filename"],
            "snippet": r["snippet"],
        }
        for r in rows
    ]
