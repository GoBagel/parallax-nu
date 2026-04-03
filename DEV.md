# Parallax-Nu Development Guide

## Overview

Parallax-Nu uses a **live development workflow** that lets you:

- edit source files directly
- refresh Planets.nu
- see changes instantly

No rebuild step is required during normal development when using the dev loader.

---

## 🧱 Development Model

### Development Mode

- Tampermonkey installs a **generated dev loader**
- The dev loader uses `@require` to load source modules individually from a local server
- Cache is bypassed using timestamp query parameters added during loader generation

Flow:

```text
Tampermonkey → parallax-nu-dev.user.js → http://127.0.0.1:8000 → src/*
```

### Production Mode

- Source files are bundled into a single `.user.js` file
- The production build is installed in Tampermonkey like a normal userscript

---

## 🚀 Getting Started

### 1. Start the dev server

```bash
./scripts/dev-serve.sh
```

Default local URL:

```text
http://127.0.0.1:8000
```

---

### 2. Build the dev loader

```bash
./scripts/build-dev-loader.sh
```

Output:

```text
dist/parallax-nu-dev.user.js
```

Install that file in Tampermonkey.

---

### 3. Develop

- Edit files in `src/`
- Refresh Planets.nu
- Changes apply immediately

No production rebuild is needed for this loop.

---

## 🔥 Key Development Benefits

- automatic cache busting for dev-loaded modules
- no production rebuild required during normal iteration
- modular multi-file development
- same module ordering shared by dev and production builds
- local server includes CORS headers for reliable loading

---

## 📁 Project Structure

```text
parallax-nu/
├── src/
│   ├── core/
│   │   ├── globals.js
│   │   ├── utils.js
│   │   ├── vcr-data.js
│   │   ├── sim.js
│   │   ├── panel.js
│   │   └── assets.js
│   ├── features/
│   │   ├── text-vcr.js
│   │   ├── menu.js
│   │   └── render-3d.js
│   └── main.js
├── scripts/
│   ├── build-dev-loader.sh
│   ├── build-userscript.sh
│   ├── dev-serve.sh
│   ├── watch-build.sh
│   ├── README.md
│   └── lib/
│       ├── config.sh
│       ├── lib.sh
│       └── modules.sh
├── dist/
│   ├── parallax-nu.user.js
│   └── parallax-nu-dev.user.js
└── README.md
```

---

## 📦 Production Build

To generate the production userscript:

```bash
./scripts/build-userscript.sh
```

Output:

```text
dist/parallax-nu.user.js
```

Install that file in Tampermonkey for release or packaged testing.

---

## 👀 Optional Auto-Rebuild Workflow

If you want production output rebuilt automatically while working:

```bash
./scripts/watch-build.sh
```

This watches `src/` and rebuilds the production userscript when source files change.

---

## ⚠️ Notes

- Only enable one Tampermonkey script at a time: dev or production
- The dev loader depends on the local dev server being running
- Default dev port is `8000`
- Shared module ordering is defined in `scripts/lib/modules.sh`
- Local machine overrides can be placed in `.env.local`
- The dev loader should be rebuilt when module paths or ordering change

---

## 🧠 Workflow Summary

| Task | Command |
|------|---------|
| Start dev server | `./scripts/dev-serve.sh` |
| Build dev loader | `./scripts/build-dev-loader.sh` |
| Edit code | Modify `src/*` |
| Test changes | Refresh browser |
| Build production | `./scripts/build-userscript.sh` |
| Auto-build production | `./scripts/watch-build.sh` |

---

## Near-Term Development Focus

- expand the 3D renderer in `render-3d.js`
- connect VCR data more deeply into the simulation and visualization pipeline
- add playback controls, camera behavior, and cinematic presentation
- continue evolving Parallax-Nu toward a broader enhancement platform
