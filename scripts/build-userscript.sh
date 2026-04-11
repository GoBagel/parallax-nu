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
OUT_FILE="$DIST_DIR/${PROJECT_NAME}.user.js"
VERSION="${1:-${VERSION:-0.8.0}}"

mkdir -p "$DIST_DIR"

TMP_FILE="$(mktemp)"

cat > "$TMP_FILE" <<EOF
// ==UserScript==
// @name         ${USER_SCRIPT_TITLE}
// @namespace    ${PROJECT_NAMESPACE}
// @version      ${VERSION}
// @description  ${PROJECT_DESCRIPTION}
// @author       ${PROJECT_AUTHOR}
// @homepageURL  ${PROJECT_HOMEPAGE_URL}
// @match        https://planets.nu/*
// @match        https://play.planets.nu/*
// @match        http://planets.nu/*
// @match        http://play.planets.nu/*
// @grant        GM_xmlhttpRequest
// @connect      api.planets.nu
// ==/UserScript==

EOF

while IFS= read -r file; do
  if [[ ! -f "$file" ]]; then
    echo "Missing source file: $file" >&2
    rm -f "$TMP_FILE"
    exit 1
  fi

  {
    echo ""
    echo "// ----- BEGIN: ${file#$PROJECT_ROOT/} -----"
    cat "$file"
    echo ""
    echo "// ----- END: ${file#$PROJECT_ROOT/} -----"
    echo ""
  } >> "$TMP_FILE"
done < <(get_userscript_modules "$PROJECT_ROOT")

mv "$TMP_FILE" "$OUT_FILE"

echo "Built userscript:"
echo "  $OUT_FILE"