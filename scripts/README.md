# Scripts Cheat Sheet

This folder contains development and build helpers for **Parallax-Nu**.

## Overview

- `build-userscript.sh`  
  Builds the production userscript into `dist/parallax-nu.user.js` by concatenating the source modules in the configured load order.

- `build-dev-loader.sh`  
  Builds the development loader userscript into `dist/parallax-nu-dev.user.js`. This loader pulls source files individually from the local dev server using `@require`.

- `dev-serve.sh`  
  Starts a local HTTP server for the repository root with CORS enabled. Used by the dev loader so Tampermonkey can fetch local source files.

- `watch-build.sh`  
  Watches the `src/` tree for file changes and rebuilds the production userscript automatically.

## Library Helpers

These live in `scripts/lib/`.

- `config.sh`  
  Central project metadata and userscript metadata values, such as project name, title, namespace, description, author, and homepage URL.

- `lib.sh`  
  Shared shell helper functions used by the other scripts, such as locating the project root, loading `.env.local`, and checking required commands.

- `modules.sh`  
  Defines the authoritative ordered list of source modules included in both the production userscript build and the dev loader.

## Typical Development Workflow

### Start the local dev server
```bash
./scripts/dev-serve.sh
```

### Build the dev loader
```bash
./scripts/build-dev-loader.sh
```

### Build the production userscript
```bash
./scripts/build-userscript.sh
```

### Watch for source changes and auto-rebuild production output
```bash
./scripts/watch-build.sh
```

## Optional Environment Overrides

Some scripts read values from `.env.local` in the repository root.

Example:

```bash
PORT=8000
VERSION=0.8.0
```

This file is intended for local machine settings and should not be committed.

## Output Files

Generated files are written to `dist/`.

- `dist/parallax-nu.user.js`  
  Production build

- `dist/parallax-nu-dev.user.js`  
  Development loader build

## Notes

- The production build and dev loader both depend on the module order defined in `scripts/lib/modules.sh`.
- If you add, remove, or reorder source modules, update `modules.sh`.
- `dev-serve.sh` serves the repository root, so `@require` paths in the dev loader map directly to repository-relative source files.
