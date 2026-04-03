# Parallax-Nu

Cinematic VCR and visual enhancement engine for Planets.nu.

Parallax-Nu is a modular Tampermonkey userscript that enhances the Planets.nu VCR (Visual Combat Recorder) with improved analysis tools and an in-progress real-time 3D battle renderer.

---

## 🚀 Features

- 📊 Enhanced VCR summaries based on actual combat data
- ⚠️ Accurate handling of destroyed ships (VCR is source of truth)
- 🧠 Multi-battle awareness (ships may appear in multiple combats per turn)
- 🎬 Cinematic and experimental 3D battle visualization (in progress)
- 🧩 Modular architecture for rapid feature development and extension

---

## 🧱 Architecture

```
src/
├── core/
│   ├── globals.js
│   ├── utils.js
│   ├── vcr-data.js
│   ├── sim.js
│   ├── panel.js
│   └── assets.js
├── features/
│   ├── text-vcr.js
│   ├── menu.js
│   └── render-3d.js
└── main.js
```

### Key Principle

> Always trust **VCR data over live game state**

- Ship IDs may become invalid after destruction
- A ship can appear in multiple battles in one turn
- Never rely on `vgap.getShip()` for authoritative combat results

---

## 🛠️ Development Setup

### 1. Start Local Dev Server

```bash
./scripts/dev-serve.sh
```

Serves files at:

```
http://127.0.0.1:8000
```

---

### 2. Build Dev Loader

```bash
./scripts/build-dev-loader.sh
```

Output:

```
dist/parallax-nu-dev.user.js
```

Install this file in Tampermonkey.

---

### 3. Develop

- Edit files in `src/`
- Refresh Planets.nu
- Changes apply instantly (no rebuild required)

---

## ⚡ Development Workflow

| Step | Action |
|------|--------|
| Start dev server | `./scripts/dev-serve.sh` |
| Build dev loader | `./scripts/build-dev-loader.sh` |
| Edit code | Modify files in `src/` |
| Test | Refresh browser |
| Iterate | Repeat instantly |

---

## 📦 Production Build

To create a deployable userscript:

```bash
./scripts/build-userscript.sh
```

Output:

```
dist/parallax-nu.user.js
```

Install this file in Tampermonkey for production use.

---

## 🔥 3D Renderer (Work in Progress)

The `render-3d.js` module is being developed to:

- Render ships in a WebGL scene
- Animate beams, torpedoes, and fighters
- Replay VCR battles with time control
- Provide camera controls and cinematic playback

---

## ⚠️ Notes

- Only enable one script (dev or prod) at a time in Tampermonkey
- Dev loader requires local server to be running
- Module load order is defined in `scripts/lib/modules.sh`
- Machine-specific overrides can be placed in `.env.local`

---

## 🧠 Future Direction

Parallax-Nu is evolving toward a broader platform:

- Full battle playback system
- Timeline scrubbing and replay controls
- Plugin/mod extension system
- AI-assisted analysis and visualization
- Shareable battle reconstructions

---

## 📜 License

MIT

---

## 🙌 Attribution

Created by **bagelman** (Planets.nu) / **GoBagel** (GitHub)

---

## 🤝 Contributions

This is an experimental project focused on deep game analysis, visualization, and extensibility.

Contributions, ideas, and feedback are welcome.
