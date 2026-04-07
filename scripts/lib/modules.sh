#!/usr/bin/env bash

get_userscript_modules() {
  local project_root="$1"

  cat <<EOF
$project_root/src/core/globals.js
$project_root/src/core/utils.js
$project_root/src/core/vcr-data.js
$project_root/src/core/panel.js
$project_root/src/core/sim.js
$project_root/src/core/assets.js
$project_root/src/config/plugin-config-store.js
$project_root/src/ui/main-menu-branding.js
$project_root/src/core/scene-compiler/led.js
$project_root/src/core/scene-compiler/bundle.js
$project_root/src/core/scene-compiler/viewer-model.js
$project_root/src/core/scene-compiler/entry-modes.js
$project_root/src/core/scene-compiler/beats.js
$project_root/src/core/scene-compiler/phases.js
$project_root/src/core/scene-compiler/summary.js
$project_root/src/core/scene-compiler/export.js
$project_root/src/core/scene-compiler/debug.js
$project_root/src/core/scene-compiler/index.js
$project_root/src/features/text-vcr.js
$project_root/src/features/cinematics-text.js
$project_root/src/features/render-3d.js
$project_root/src/features/menu.js
$project_root/src/generated/build-info.js
$project_root/src/main.js
EOF
}