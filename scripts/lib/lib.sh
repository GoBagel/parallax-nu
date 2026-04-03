#!/usr/bin/env bash

get_script_dir() {
  cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd
}

get_project_root() {
  local script_dir
  script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
  cd -- "$script_dir/.." && pwd
}

load_local_env() {
  local project_root="$1"
  if [[ -f "$project_root/.env.local" ]]; then
    # shellcheck disable=SC1090
    source "$project_root/.env.local"
  fi
}

require_command() {
  local cmd="$1"
  local hint="${2:-}"

  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "Error: required command not found: $cmd" >&2
    [[ -n "$hint" ]] && echo "$hint" >&2
    exit 1
  fi
}