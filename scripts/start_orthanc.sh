#!/usr/bin/env bash
# Launches the bundled Orthanc binary with our project config.
# Orthanc HTTP:  http://127.0.0.1:8042  (UI: Orthanc Explorer 2)
# Orthanc DICOM: localhost:4242         (AET: ORTHANC)
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ORTHANC_DIR="$REPO_ROOT/vendor/Orthanc-MacOS-26.4.2-stable"
ORTHANC_BIN="$ORTHANC_DIR/Orthanc"
CONFIG="$REPO_ROOT/orthanc/orthanc.json"

if [[ ! -x "$ORTHANC_BIN" ]]; then
  echo "Orthanc binary not found or not executable: $ORTHANC_BIN" >&2
  echo "Re-run the download step or check vendor/." >&2
  exit 1
fi

mkdir -p "$REPO_ROOT/data/orthanc/storage" "$REPO_ROOT/data/orthanc/index"

# macOS Gatekeeper marks downloaded executables as quarantined; lift it so the
# binary can launch without manual right-click-open.
if command -v xattr >/dev/null 2>&1; then
  xattr -dr com.apple.quarantine "$ORTHANC_DIR" 2>/dev/null || true
fi

cd "$ORTHANC_DIR"
exec "$ORTHANC_BIN" "$CONFIG"
