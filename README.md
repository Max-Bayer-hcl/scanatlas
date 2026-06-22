# Scanatlas

Medical study search + DICOM browser. FastAPI backend with SQLite FTS5 over PDF/DOCX charters; React + Vite + Tailwind frontend; Orthanc as the local DICOM store.

## Local setup

### 1. Backend (FastAPI on `:8000`)

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt

# (One-off) build the FTS5 index from data/documents/
python scripts/build_index.py

# Start the API
uvicorn backend.main:app --reload --port 8000
```

API endpoints: `GET /api/health`, `GET /api/search?q=...`, `GET /api/study/{study_id}/dicoms`, `GET /api/dicom/{study_id}/{subject}/{filename}`.

### 2. Frontend (Vite on `:5173`)

```bash
cd frontend
npm install
npm run dev
```

Then open <http://127.0.0.1:5173>.

### 3. Orthanc (DICOM server on `:8042`)

The macOS universal Orthanc bundle is fetched into `vendor/` (gitignored). The launcher starts it with [orthanc/orthanc.json](orthanc/orthanc.json), which keeps the SQLite index + raw DICOM blobs under `data/orthanc/` and enables the `dicom-web`, `stone-webviewer`, `web-viewer`, `volview`, and `orthanc-explorer-2` plugins.

```bash
# First time only — download the official macOS package (~320 MB, gitignored)
mkdir -p vendor
curl -L --fail -o vendor/orthanc-macos.zip \
  https://orthanc.uclouvain.be/downloads/macos/packages/universal/Orthanc-macOS-26.4.2.zip
unzip -q vendor/orthanc-macos.zip -d vendor/

# Every time — launch Orthanc with our config
./scripts/start_orthanc.sh
```

Once it logs `Orthanc has started`:

| URL | Purpose |
|---|---|
| <http://127.0.0.1:8042/ui/app/> | Orthanc Explorer 2 (modern web UI, also the default at `/`) |
| <http://127.0.0.1:8042/system> | REST sanity check |
| <http://127.0.0.1:8042/dicom-web/studies> | DICOMweb QIDO-RS |
| <http://127.0.0.1:8042/studies> | Native Orthanc REST |
| `localhost:4242` (AET `ORTHANC`) | DICOM C-STORE SCP port |

Authentication is disabled in the bundled config for hackathon speed — do not expose `:8042` off-host.

### Uploading DICOM data into Orthanc

**Web UI** — open <http://127.0.0.1:8042/ui/app/>, go to the upload page, drop a `.dcm` file, a folder, or a ZIP of DICOMs.

**REST (single file)**

```bash
curl -X POST http://127.0.0.1:8042/instances --data-binary @path/to/file.dcm
```

**REST (folder of DICOMs)**

```bash
find path/to/folder -name '*.dcm' -exec \
  curl -s -X POST http://127.0.0.1:8042/instances --data-binary @{} \;
```

**Bulk via DICOMweb STOW-RS** (preferred for large studies)

```bash
curl -X POST http://127.0.0.1:8042/dicom-web/studies \
  -H 'Content-Type: application/dicom' \
  --data-binary @path/to/file.dcm
```

**DICOM C-STORE SCU** — point any DICOM modality / workstation at `localhost:4242` with called AET `ORTHANC`.

## Study-ID mapping

The document indexer extracts study IDs out of the charter text (regex in [backend/config.py](backend/config.py)) and also records the source folder name. When the backend later resolves DICOMs from Orthanc, it should look up by **DICOM StudyID tag `(0020,0010)`** first (which matches the document folder name in our sample data — e.g. folder `22572/` ↔ Orthanc `StudyID="22572"`), then fall back to `AccessionNumber` / `PatientID` as needed.

## Project layout

```
scanatlas/
├── backend/                  FastAPI app (search + DICOM passthrough)
├── frontend/                 React + Vite + Tailwind
├── scripts/
│   ├── build_index.py        Build SQLite FTS5 index from data/documents/
│   └── start_orthanc.sh      Launch the bundled Orthanc with our config
├── orthanc/orthanc.json      Orthanc runtime config
├── vendor/                   Downloaded Orthanc binaries (gitignored)
└── data/                     Index DB, document corpus, Orthanc storage (gitignored)
```
