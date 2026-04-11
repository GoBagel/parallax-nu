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
DEV_LOADER_FILE="$PROJECT_ROOT/dev-loader.js"
PORT="${1:-${PORT:-8000}}"
STAMP="$(date +%s)"

DEFAULT_DEV_VERSION="0.8.0-dev.${STAMP}"

if [[ -f "$PROJECT_ROOT/src/generated/build-info.js" ]]; then
  GENERATED_VERSION="$(sed -nE "s/.*version: \"([^\"]+)\".*/\1/p" "$PROJECT_ROOT/src/generated/build-info.js" | head -n 1)"
else
  GENERATED_VERSION=""
fi

VERSION="${VERSION:-${GENERATED_VERSION:-$DEFAULT_DEV_VERSION}}"

mkdir -p "$DIST_DIR"

build_dev_loader_js() {
  {
    cat <<EOF
(function () {
  'use strict';

  const ROOT = 'http://127.0.0.1:${PORT}';
  const modules = [
EOF

    local first=1
    while IFS= read -r file; do
      rel_path="${file#$PROJECT_ROOT/}"
      if [[ $first -eq 1 ]]; then
        first=0
      else
        echo ","
      fi
      printf "    '/%s'" "$rel_path"
    done < <(get_userscript_modules "$PROJECT_ROOT")

    cat <<EOF

  ];

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const el = document.createElement('script');
      el.src = ROOT + src + '?t=' + Date.now();
      el.onload = () => resolve(src);
      el.onerror = () => reject(new Error('Failed to load ' + src));
      document.head.appendChild(el);
    });
  }

  async function boot() {
    console.log('[Parallax Nu] dev-loader active');
    for (const mod of modules) {
      console.log('[Parallax Nu] loading', mod);
      await loadScript(mod);
    }
    console.log('[Parallax Nu] all modules loaded');
  }

  boot().catch((err) => {
    console.error('[Parallax Nu] dev-loader failed', err);
  });
})();
EOF
  } > "$DEV_LOADER_FILE"
}

build_dev_loader_js

cat > "$OUT_FILE" <<EOF
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
// @grant        GM_xmlhttpRequest
// @connect      api.planets.nu
// @require      http://127.0.0.1:${PORT}/dev-loader.js?v=${STAMP}
// ==/UserScript==
EOF

echo "Built dev loader JS:"
echo "  $DEV_LOADER_FILE"
echo "Built dev userscript:"
echo "  $OUT_FILE"