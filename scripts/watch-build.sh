#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"

# shellcheck source=./lib/lib.sh
source "$SCRIPT_DIR/lib/lib.sh"

PROJECT_ROOT="$(get_project_root)"
load_local_env "$PROJECT_ROOT"

SRC_DIR="${SRC_DIR:-$PROJECT_ROOT/src}"
BUILD_SCRIPT="${BUILD_SCRIPT:-$PROJECT_ROOT/scripts/build-userscript.sh}"

require_command "inotifywait" "Install with: sudo apt install inotify-tools"

if [[ ! -d "$SRC_DIR" ]]; then
  echo "Error: source directory not found: $SRC_DIR" >&2
  exit 1
fi

if [[ ! -x "$BUILD_SCRIPT" ]]; then
  echo "Error: build script is not executable: $BUILD_SCRIPT" >&2
  exit 1
fi

echo "Watching for changes in $SRC_DIR..."
echo "Press Ctrl+C to stop."

while true; do
  inotifywait -r -e modify,create,delete "$SRC_DIR"
  echo "Change detected — rebuilding..."
  "$BUILD_SCRIPT"
  echo "Build complete."
  echo
done