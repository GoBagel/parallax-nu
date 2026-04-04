# Scripts Cheat Sheet

This folder contains development and build helpers for **Parallax-Nu**.

---

## Overview

- `build-userscript.sh`  
  Builds the **production userscript** into `dist/parallax-nu.user.js` by concatenating source modules in the configured load order.

- `build-dev-loader.sh`  
  Builds the **development loader userscript** into `dist/parallax-nu-dev.user.js`.  
  This loader uses `@require` to fetch individual source files from a local dev server, enabling rapid iteration without rebuilding.

- `dev-serve.sh`  
  Starts a local HTTP server for the repository root with CORS enabled.  
  Required for the dev loader so Tampermonkey can fetch local source files.

- `watch-build.sh`  
  Watches the `src/` directory for changes and automatically rebuilds the production userscript.

---

## Library Helpers

Located in `scripts/lib/`.

- `config.sh`  
  Central project metadata and userscript metadata:
  - name, title, namespace
  - description, author
  - homepage URL
  - version (optionally overridden)

- `lib.sh`  
  Shared shell utilities:
  - locate project root
  - load `.env.local`
  - validate required commands

- `modules.sh`  
  Defines the **authoritative ordered list of source modules** used by:
  - production build
  - dev loader

  ⚠️ This file controls load order — treat it as the single source of truth.

---

## Typical Development Workflow

### 1. Start the local dev server
```bash
./scripts/dev-serve.sh
```

### 2. Build the dev loader (install this in Tampermonkey)
```bash
./scripts/build-dev-loader.sh
```

➡️ After installing the dev loader:
- Edits to files in `src/` are picked up immediately
- No rebuild required

---

### 3. Build the production userscript
```bash
./scripts/build-userscript.sh
```

---

### 4. Optional: auto-rebuild production on changes
```bash
./scripts/watch-build.sh
```

---

## Development vs Production

### Dev Loader
- Loads files individually via `@require`
- Requires `dev-serve.sh`
- Fast iteration
- Best for active development

### Production Build
- Single bundled file
- No local server required
- Suitable for distribution

---

## Optional Environment Overrides

Some scripts read values from `.env.local` in the repository root.

Example:

```bash
PORT=8000
VERSION=0.8.0
```

Notes:
- `.env.local` is **not committed**
- Useful for local overrides (ports, version tagging, etc.)

---

## Output Files

Generated files are written to `dist/`.

- `dist/parallax-nu.user.js`  
  Production build

- `dist/parallax-nu-dev.user.js`  
  Development loader

---

## Module System (Important)

All builds depend on:

```bash
scripts/lib/modules.sh
```

This file defines:

- exact file list
- load order
- dependency sequencing

### When modifying source:

If you:
- add a new module
- remove a module
- reorder dependencies

➡️ You **must update `modules.sh`**

---

## Dev Server Behavior

`dev-serve.sh` serves the **repository root**.

This means:
- `/src/...` paths map directly to files
- `@require` URLs in the dev loader mirror repo structure

Example:
```
http://127.0.0.1:8000/src/core/utils.js
```

---

## Notes & Best Practices

- Keep modules small and focused (core vs features separation is good 👍)
- Avoid implicit load order dependencies — document them in `modules.sh`
- Use the dev loader for UI-heavy work (like menu + modal changes)
- Use production build to verify final bundling integrity

---

## Future Enhancements (Planned)

- Version injection from git tags
- Changelog / patch notes integration
- Optional minification step
- Hot-reload dev server (instead of manual refresh)
- Module validation (detect missing files or duplicates)

---

## Quick Reference

```bash
# Start dev server
./scripts/dev-serve.sh

# Build dev loader
./scripts/build-dev-loader.sh

# Build production
./scripts/build-userscript.sh

# Watch + rebuild
./scripts/watch-build.sh
```
