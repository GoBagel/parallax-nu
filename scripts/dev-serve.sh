#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"

# shellcheck source=./lib/lib.sh
source "$SCRIPT_DIR/lib/lib.sh"

PROJECT_ROOT="$(get_project_root)"
load_local_env "$PROJECT_ROOT"

PORT="${1:-${PORT:-8000}}"

require_command "python3" "Install it and ensure it is in PATH."

cd "$PROJECT_ROOT"

echo "Serving $PROJECT_ROOT at http://127.0.0.1:${PORT}/ with CORS enabled"
echo "Press Ctrl+C to stop."

VCR_DEV_ROOT="$PROJECT_ROOT" VCR_DEV_PORT="$PORT" exec python3 - <<'PY'
import os
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler

PORT = int(os.environ.get("VCR_DEV_PORT", "8000"))
ROOT = os.environ.get("VCR_DEV_ROOT", ".")

class CORSRequestHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "*")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

os.chdir(ROOT)
ThreadingHTTPServer(("127.0.0.1", PORT), CORSRequestHandler).serve_forever()
PY