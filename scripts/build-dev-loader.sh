#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"

# shellcheck source=./lib/config.sh
source "$SCRIPT_DIR/lib/config.sh"
# shellcheck source=./lib/lib.sh
source "$SCRIPT_DIR/lib/lib.sh"
# shellcheck source=./lib/modules.sh
source "$SCRIPT_DIR/lib/modules.sh"

PROJECT_ROOT="$(get_project_root)"
load_local_env "$PROJECT_ROOT"

DIST_DIR="${DIST_DIR:-$PROJECT_ROOT/dist}"
OUT_FILE="$DIST_DIR/${PROJECT_NAME}-dev.user.js"
PORT="${1:-${PORT:-8000}}"
STAMP="$(date +%s)"
VERSION="${VERSION:-0.8.0-dev.${STAMP}}"

mkdir -p "$DIST_DIR"

{
  cat <<EOF
// ==UserScript==
// @name         ${USER_SCRIPT_TITLE} (Dev Loader)
// @namespace    ${PROJECT_NAMESPACE}
// @version      ${VERSION}
// @description  Development loader for local Parallax-Nu modules
// @author       ${PROJECT_AUTHOR}
// @homepageURL  ${PROJECT_HOMEPAGE_URL}
// @match        https://planets.nu/*
// @match        https://play.planets.nu/*
// @match        http://planets.nu/*
// @match        http://play.planets.nu/*
// @grant        none
EOF

  while IFS= read -r file; do
    rel_path="${file#$PROJECT_ROOT/}"
    echo "// @require      http://127.0.0.1:${PORT}/${rel_path}?v=${STAMP}"
  done < <(get_userscript_modules "$PROJECT_ROOT")

  echo "// ==/UserScript=="
} > "$OUT_FILE"

echo "Built dev loader: $OUT_FILE"