#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd -- "$SCRIPT_DIR/.." && pwd)"
CHANGELOG_PATH="$PROJECT_ROOT/CHANGELOG.md"
GENERATED_DIR="$PROJECT_ROOT/src/generated"
BUILD_INFO_PATH="$GENERATED_DIR/build-info.js"

fail() {
  echo "[update_version] $1" >&2
  exit 1
}

read_file() {
  local file="$1"
  [[ -f "$file" ]] || fail "Missing file: $file"
  cat "$file"
}

write_file() {
  local file="$1"
  mkdir -p "$(dirname "$file")"
  cat > "$file"
}

today_utc() {
  date -u +%F
}

parse_semver() {
  local version="$1"
  [[ "$version" =~ ^([0-9]+)\.([0-9]+)\.([0-9]+)$ ]] || fail "Invalid semver: $version"
  SEMVER_MAJOR="${BASH_REMATCH[1]}"
  SEMVER_MINOR="${BASH_REMATCH[2]}"
  SEMVER_PATCH="${BASH_REMATCH[3]}"
}

bump_version() {
  local version="$1"
  local kind="$2"
  parse_semver "$version"

  case "$kind" in
    patch) echo "${SEMVER_MAJOR}.${SEMVER_MINOR}.$((SEMVER_PATCH + 1))" ;;
    minor) echo "${SEMVER_MAJOR}.$((SEMVER_MINOR + 1)).0" ;;
    major) echo "$((SEMVER_MAJOR + 1)).0.0" ;;
    *) fail "Unknown bump kind: $kind" ;;
  esac
}

find_current_version() {
  local changelog="$1"
  local version
  version="$(printf '%s\n' "$changelog" | sed -nE 's/^## \[([0-9]+\.[0-9]+\.[0-9]+)\] - [0-9]{4}-[0-9]{2}-[0-9]{2}$/\1/p' | head -n 1)"
  [[ -n "$version" ]] || fail "Could not find a released version in CHANGELOG.md"
  echo "$version"
}

extract_unreleased_body() {
  local changelog="$1"
  awk '
    BEGIN { capture=0 }
    /^## \[Unreleased\]$/ { capture=1; next }
    /^## \[/ && capture==1 { exit }
    capture==1 { print }
  ' <<< "$changelog" | sed '${/^$/d;}'
}

trim_blank_edges() {
  sed -e :a -e '/^\n*$/{$d;N;ba' -e '}' -e '1{/^$/d;}'
}

replace_unreleased_section() {
  local changelog="$1"
  local replacement_file="$2"

  awk -v repl="$replacement_file" '
    BEGIN {
      in_unreleased=0
      replaced=0
      while ((getline line < repl) > 0) {
        replacement = replacement line "\n"
      }
      close(repl)
    }
    /^## \[Unreleased\]$/ && replaced==0 {
      printf "%s", replacement
      in_unreleased=1
      replaced=1
      next
    }
    /^## \[/ && in_unreleased==1 {
      in_unreleased=0
    }
    in_unreleased==0 {
      print
    }
  ' <<< "$changelog"
}

has_meaningful_unreleased_content() {
  local unreleased="$1"
  [[ -n "$(printf '%s' "$unreleased" | tr -d '[:space:]')" ]]
}

json_escape() {
  python3 - <<'PY' "$1"
import json, sys
print(json.dumps(sys.argv[1]))
PY
}

build_info_js() {
  local version="$1"
  local build_date="$2"
  local notes_json="$3"

  cat <<EOF
(function () {
  window.ParallaxNuBuildInfo = {
    version: $(json_escape "$version"),
    buildDate: $(json_escape "$build_date"),
    releaseNotes: $notes_json
  };
})();
EOF
}

extract_release_notes_json() {
  local changelog="$1"
  python3 - <<'PY' "$changelog"
import json
import re
import sys

changelog = sys.argv[1]
pattern = re.compile(r'^## \[(.+?)\](?: - (\d{4}-\d{2}-\d{2}))?\n\n([\s\S]*?)(?=^## \[|\Z)', re.M)
matches = list(pattern.finditer(changelog))

sections = []
for m in matches[:4]:
    version = m.group(1)
    date = m.group(2)
    body = m.group(3).strip()
    items = []
    for line in body.splitlines():
        line = line.strip()
        if line.startswith("- "):
            item = line[2:].strip()
            if item:
                items.append(item)
        if len(items) >= 8:
            break
    sections.append({
        "version": version,
        "date": date,
        "items": items,
    })

print(json.dumps(sections, indent=2))
PY
}

prompt_choice() {
  local current_version="$1"
  local next_patch next_minor next_major
  local choice custom confirm next_version

  next_patch="$(bump_version "$current_version" patch)"
  next_minor="$(bump_version "$current_version" minor)"
  next_major="$(bump_version "$current_version" major)"

  {
    echo
    echo "=== Parallax-Nu Version Update ==="
    echo
    echo "This will:"
    echo "  - promote [Unreleased] into a new release in CHANGELOG.md"
    echo "  - generate src/generated/build-info.js"
    echo "  - prepare release metadata for the plugin"
    echo
    echo "Current version: $current_version"
    echo
    echo "Select version increment:"
    echo
    echo "  1) patch  -> $next_patch   (bug fixes, small tweaks)"
    echo "  2) minor  -> $next_minor   (new features, backwards compatible)"
    echo "  3) major  -> $next_major   (breaking changes / big milestones)"
    echo "  4) custom version"
    echo
    echo "Press Enter for default: patch ($next_patch)"
    echo
  } >&2

  read -r -p "Choice [1-4]: " choice
  choice="${choice:-1}"

  case "$choice" in
    1) next_version="$next_patch" ;;
    2) next_version="$next_minor" ;;
    3) next_version="$next_major" ;;
    4)
      read -r -p "Enter version (e.g. 0.8.2): " custom
      parse_semver "$custom"
      next_version="$custom"
      ;;
    *)
      fail "Invalid choice."
      ;;
  esac

  echo >&2
  read -r -p "Release version $next_version? [Y/n]: " confirm
  confirm="${confirm:-Y}"

  if [[ "$confirm" =~ ^[Nn]$ ]]; then
    echo "Aborted." >&2
    exit 0
  fi

  printf '%s\n' "$next_version"
}

main() {
  local changelog current_version unreleased_body next_version today
  local tmp_replacement tmp_changelog notes_json

  changelog="$(read_file "$CHANGELOG_PATH")"
  current_version="$(find_current_version "$changelog")"
  unreleased_body="$(extract_unreleased_body "$changelog")"
  next_version="$(prompt_choice "$current_version")"
  today="$(today_utc)"

  if has_meaningful_unreleased_content "$unreleased_body"; then
    tmp_replacement="$(mktemp)"
    cat > "$tmp_replacement" <<EOF
## [Unreleased]

### Planned
- 

## [$next_version] - $today

$unreleased_body

EOF
    tmp_changelog="$(replace_unreleased_section "$changelog" "$tmp_replacement")"
    printf '%s\n' "$tmp_changelog" > "$CHANGELOG_PATH"
    rm -f "$tmp_replacement"
    changelog="$tmp_changelog"
    echo "Updated CHANGELOG.md with release $next_version."
  else
    echo "No meaningful [Unreleased] content found; CHANGELOG.md not changed."
  fi

  notes_json="$(extract_release_notes_json "$changelog")"
  build_info_js "$next_version" "$today" "$notes_json" > "$BUILD_INFO_PATH"
  echo "Wrote ${BUILD_INFO_PATH#$PROJECT_ROOT/}."

  echo
  echo "Next suggested steps:"
  echo "  1. Review CHANGELOG.md"
  echo "  2. Ensure src/generated/build-info.js is in .gitignore if desired"
  echo "  3. Build with version $next_version"
  echo "     ./scripts/build-userscript.sh $next_version"
  echo "     ./scripts/build-dev-loader.sh"
}

main "$@"
