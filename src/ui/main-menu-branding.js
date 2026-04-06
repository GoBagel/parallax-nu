(function () {
  'use strict';

  const TOPBAR_LOGO_ID = "parallax-nu-topbar-logo";
  const STYLE_ID = "parallax-nu-main-menu-style";
  const MODAL_ID = "parallax-nu-config-modal";

  let isInitialized = false;
  let menuObserver = null;

  const originalConsoleLog =
    typeof console !== "undefined" && typeof console.log === "function"
      ? console.log.bind(console)
      : () => {};

  function log(...args) {
    try {
      originalConsoleLog("[Parallax Nu]", ...args);
    } catch {}
  }

  function ensureStyles() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      #${TOPBAR_LOGO_ID} {
        float: left;
        height: 60px;
        display: flex;
        align-items: center;
        margin-left: 8px;
        padding-top: 2px;
        box-sizing: border-box;
      }

      #${TOPBAR_LOGO_ID} .pn-topbar-logo-link {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 60px;
        text-decoration: none;
        cursor: pointer;
      }

      #${TOPBAR_LOGO_ID} .pn-topbar-logo {
        width: 140px;
        line-height: 0;
        opacity: 0.96;
        transform-origin: left center;
      }

      #${TOPBAR_LOGO_ID} .pn-topbar-logo svg {
        display: block;
        width: 100%;
        height: auto;
      }

      #${TOPBAR_LOGO_ID}:hover .pn-topbar-logo {
        opacity: 1;
        filter: brightness(1.06);
      }

      #etopbar.parallax-nu-topbar-ready #elogo {
        margin-right: 6px;
      }

      .parallax-nu-nav-link {
        cursor: pointer;
      }

      #${MODAL_ID} button {
        padding: 8px 12px;
        border-radius: 8px;
        border: 1px solid rgba(120, 180, 255, 0.3);
        background: rgba(36, 63, 102, 0.35);
        color: #dbf4ff;
        cursor: pointer;
      }

      #${MODAL_ID} button:hover {
        background: rgba(52, 94, 148, 0.45);
        border-color: rgba(140, 210, 255, 0.55);
      }

      #${MODAL_ID} {
        position: fixed;
        inset: 0;
        z-index: 999999;
        display: none;
        align-items: flex-start;
        justify-content: center;
        padding: 18px 16px 24px;
        box-sizing: border-box;
        overflow-y: auto;
        background: rgba(0, 0, 0, 0.7);
      }

      #${MODAL_ID}.is-open {
        display: flex;
      }

      #${MODAL_ID} .pn-modal-card {
        width: min(860px, calc(100vw - 32px));
        max-height: calc(100vh - 36px);
        overflow: auto;
        border-radius: 14px;
        background: #0b1320;
        color: #e7f5ff;
        border: 1px solid rgba(150, 195, 255, 0.24);
        box-shadow: 0 18px 60px rgba(0,0,0,0.45);
        transform-origin: top center;
        transition:
          height 140ms ease,
          max-width 140ms ease,
          max-height 140ms ease,
          transform 140ms ease,
          opacity 140ms ease;
      }

      #${MODAL_ID} .pn-modal-card {
        transform: translateY(0);
        opacity: 1;
      }

      #${MODAL_ID}:not(.is-open) .pn-modal-card {
        transform: translateY(-6px);
        opacity: 0;
      }

      #${MODAL_ID} .pn-modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 18px;
        border-bottom: 1px solid rgba(255,255,255,0.08);
      }

      #${MODAL_ID} .pn-modal-body {
        padding: 18px;
        display: grid;
        gap: 18px;
      }

      #${MODAL_ID} .pn-section {
        border: 1px solid rgba(255,255,255,0.08);
        border-radius: 12px;
        padding: 14px;
        background: rgba(255,255,255,0.02);
      }

      #${MODAL_ID} .pn-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 12px;
      }

      #${MODAL_ID} h2,
      #${MODAL_ID} h3 {
        margin: 0 0 10px;
      }

      #${MODAL_ID} label {
        display: grid;
        gap: 6px;
        font-size: 13px;
        color: #c7daeb;
      }

      #${MODAL_ID} input[type="text"],
      #${MODAL_ID} input[type="url"],
      #${MODAL_ID} input[type="number"] {
        border: 1px solid rgba(255,255,255,0.14);
        background: #111b2a;
        color: #eef8ff;
        border-radius: 8px;
        padding: 9px 10px;
      }

      #${MODAL_ID} .pn-checkbox {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      #${MODAL_ID} .pn-modal-footer {
        display: flex;
        gap: 8px;
        justify-content: flex-end;
        padding: 0 18px 18px;
      }

      #${MODAL_ID} .pn-note {
        font-size: 12px;
        color: #93aeca;
        line-height: 1.4;
      }

      #${MODAL_ID} .pn-tabs {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-bottom: 16px;
        padding-bottom: 12px;
        border-bottom: 1px solid rgba(255,255,255,0.08);
      }

      #${MODAL_ID} .pn-tab {
        appearance: none;
        border: 1px solid rgba(120, 180, 255, 0.22);
        background: rgba(255,255,255,0.03);
        color: #cfe6f7;
        border-radius: 999px;
        padding: 8px 12px;
        font-size: 13px;
        line-height: 1;
        cursor: pointer;
      }

      #${MODAL_ID} .pn-tab:hover {
        background: rgba(52, 94, 148, 0.25);
        border-color: rgba(140, 210, 255, 0.4);
      }

      #${MODAL_ID} .pn-tab.is-active {
        background: rgba(70, 120, 190, 0.32);
        border-color: rgba(150, 210, 255, 0.6);
        color: #ffffff;
      }

      #${MODAL_ID} .pn-tab-panel {
        display: none;
        opacity: 0;
        transform: translateY(4px);
      }

      #${MODAL_ID} .pn-tab-panel.is-active {
        display: block;
        opacity: 1;
        transform: translateY(0);
        transition: opacity 120ms ease, transform 120ms ease;
      }

      #${MODAL_ID} .pn-about-logo svg {
        display: block;
        width: 100%;
        height: auto;
      }

      #${MODAL_ID} .pn-about-header {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 16px;
        align-items: start;
      }

      #${MODAL_ID} .pn-about-grid {
        display: grid;
        grid-template-columns: 140px 1fr;
        gap: 6px 12px;
        font-size: 13px;
      }

      #${MODAL_ID} .pn-about-grid b {
        color: #e7f5ff;
        font-weight: 600;
      }

      #${MODAL_ID} .pn-about-logo {
        width: 400px;
        max-width: 28vw;
        line-height: 0;
        opacity: 0.95;
        position: absolute;
        top: -100px;
        right: 0;
      }

      #${MODAL_ID} .pn-about-logo svg {
        display: block;
        width: 100%;
        height: auto;
      }

      #${MODAL_ID} .pn-about-box {
        border: 1px solid rgba(255,255,255,0.08);
        border-radius: 10px;
        padding: 12px;
        background: rgba(255,255,255,0.02);
      }

      #${MODAL_ID} .pn-about-list {
        margin: 8px 0 0;
        padding-left: 18px;
        color: #c7daeb;
      }

      #${MODAL_ID} .pn-about-list li + li {
        margin-top: 6px;
      }

      #${MODAL_ID} .pn-release-header {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        gap: 12px;
        margin-bottom: 8px;
      }

      #${MODAL_ID} .pn-release-header strong {
        color: #e7f5ff;
      }
    `;
    document.head.appendChild(style);
  }

  function createTopbarLogoSvg() {
    return createLogoSvg();
  }

  function createLogoSvg() {
    return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" aria-hidden="true">
  <defs>
    <linearGradient id="parallaxNuMetal" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#ddd"/>
      <stop offset="38%" stop-color="#d7dbe3"/>
      <stop offset="72%" stop-color="#9ea5b2"/>
      <stop offset="100%" stop-color="#666666"/>
    </linearGradient>

    <mask id="parallaxNuRingClearanceMask" maskUnits="userSpaceOnUse">
      <rect x="0" y="0" width="512" height="512" fill="white"/>
      <g transform="translate(-18,-20) rotate(5, 256, 256)">
        <path d="M 347 165
                 A 34 190 45 1,1 165 347
                 L 172 352
                 A 24 160 45 1,0 356 172
                 Z"
              fill="black"
              stroke="black"
              stroke-width="10"
              stroke-linejoin="round"/>
      </g>
    </mask>
  </defs>

  <g transform="translate(-77,-90) scale(1.3,1.3)">
    <g mask="url(#parallaxNuRingClearanceMask)">
      <circle cx="256" cy="256" r="118"
              fill="none"
              stroke="url(#parallaxNuMetal)"
              stroke-width="12"/>

      <circle cx="256" cy="256" r="92"
              fill="none"
              stroke="#f0f2f6"
              stroke-width="5"
              stroke-linecap="round"
              stroke-dasharray="1.5 10.5"/>

      <path d="M 348 256 A 92 92 0 0 1 256 348"
            fill="none"
            stroke="url(#parallaxNuMetal)"
            stroke-width="5"
            stroke-linecap="round"/>
    </g>

    <g transform="translate(-18,-20) rotate(5, 256, 256)">
      <path d="M 347 165
               A 34 190 45 1,1 165 347
               L 172 352
               A 24 160 45 1,0 356 172
               Z"
            fill="url(#parallaxNuMetal)"
            stroke="url(#parallaxNuMetal)"
            stroke-width="0"/>
    </g>

    <g transform="translate(-50,60) scale(1.2,0.75)">
      <text x="256" y="274"
            text-anchor="middle"
            font-family="Orbitron, Rajdhani, Exo 2, sans-serif"
            font-size="42"
            letter-spacing="3"
            fill="white"
            stroke="white"
            stroke-width="8.5"
            paint-order="stroke fill">
        PARALLAX-NU
      </text>
      <text x="256" y="274"
            text-anchor="middle"
            font-family="Orbitron, Rajdhani, Exo 2, sans-serif"
            font-size="42"
            letter-spacing="3"
            fill="black"
            stroke="white"
            stroke-width="0.5"
            paint-order="stroke fill">
        PARALLAX-NU
      </text>
    </g>
  </g>
</svg>
    `;
  }

  function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function setByPath(obj, path, value) {
    const parts = path.split(".");
    const last = parts.pop();
    let ref = obj;

    for (let i = 0; i < parts.length; i += 1) {
      const part = parts[i];
      if (!ref[part] || typeof ref[part] !== "object") ref[part] = {};
      ref = ref[part];
    }

    ref[last] = value;
  }

  function getConfig() {
    if (window.ParallaxNu && typeof window.ParallaxNu.getPluginConfig === "function") {
      return window.ParallaxNu.getPluginConfig();
    }
    return {
      general: { enabled: true, debug: false },
      social: {
        blueskyHandle: "",
        mastodonHandle: "",
        youtubeChannel: "",
        twitterHandle: "",
        autoPostEnabled: false
      },
      audio: {
        soundfontUrl: "",
        motifPackUrl: "",
        musicEnabled: true,
        sfxEnabled: true,
        masterVolume: 0.8
      },
      rendering: {
        commanderVoiceEnabled: false,
        useLocalAssetsFirst: true,
        preferredModelBaseUrl: ""
      }
    };
  }

  function saveConfig(nextConfig) {
    if (window.ParallaxNu && typeof window.ParallaxNu.savePluginConfig === "function") {
      return window.ParallaxNu.savePluginConfig(nextConfig);
    }
    return nextConfig;
  }

  function resetConfig() {
    if (window.ParallaxNu && typeof window.ParallaxNu.resetPluginConfig === "function") {
      return window.ParallaxNu.resetPluginConfig();
    }
    return getConfig();
  }

  function collectFormConfig(modalEl) {
    const next = deepClone(getConfig());
    const inputs = modalEl.querySelectorAll("input[name]");

    inputs.forEach((input) => {
      let value;
      if (input.type === "checkbox") {
        value = input.checked;
      } else if (input.type === "number") {
        value = Number(input.value);
      } else {
        value = input.value.trim();
      }
      setByPath(next, input.name, value);
    });

    return next;
  }

  function getVersionInfo() {
    const buildInfo = window.ParallaxNuBuildInfo || {};

    return {
      pluginVersion: buildInfo.version || "dev",
      buildDate: buildInfo.buildDate || null,
      releaseNotes: Array.isArray(buildInfo.releaseNotes) ? buildInfo.releaseNotes : [],
      userscriptName: "Parallax-Nu",
      buildMode:
        window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost"
          ? "development"
          : "production",
      planetsHost: window.location.host || "",
      patchNotesLocation:
        "Recent notes are embedded from generated build metadata. Full history should live in CHANGELOG.md."
    };
  }

  function wireModalTabs(modal) {
    const tabs = Array.from(modal.querySelectorAll("[data-pn-tab]"));
    const panels = Array.from(modal.querySelectorAll("[data-pn-tab-panel]"));
    const card = modal.querySelector(".pn-modal-card");

    function activateTab(tabName) {
      if (!card) return;

      const startHeight = card.offsetHeight;

      tabs.forEach((tab) => {
        tab.classList.toggle("is-active", tab.getAttribute("data-pn-tab") === tabName);
      });

      panels.forEach((panel) => {
        panel.classList.toggle("is-active", panel.getAttribute("data-pn-tab-panel") === tabName);
      });

      const endHeight = card.scrollHeight;

      card.style.height = startHeight + "px";
      card.offsetHeight;
      card.style.transition = "height 140ms ease, max-width 140ms ease, max-height 140ms ease, transform 140ms ease, opacity 140ms ease";
      card.style.height = endHeight + "px";

      window.setTimeout(function () {
        card.style.height = "";
      }, 160);
    }

    tabs.forEach((tab) => {
      tab.addEventListener("click", function () {
        activateTab(tab.getAttribute("data-pn-tab"));
      });
    });

    if (tabs.length) {
      activateTab(tabs[0].getAttribute("data-pn-tab"));
    }
  }

  function renderReleaseNotes(releaseNotes) {
    if (!Array.isArray(releaseNotes) || !releaseNotes.length) {
      return `
        <div class="pn-about-box">
          <p class="pn-note" style="margin: 0;">
            No release notes are available yet. Run the version update script to generate build metadata.
          </p>
        </div>
      `;
    }

    return releaseNotes.map((entry) => {
      const versionLabel = escapeHtml(entry.version || "Unknown");
      const dateLabel = entry.date ? escapeHtml(entry.date) : "Unreleased";
      const items = Array.isArray(entry.items) ? entry.items : [];

      return `
        <div class="pn-about-box">
          <div class="pn-release-header">
            <strong>${versionLabel}</strong>
            <span class="pn-note">${dateLabel}</span>
          </div>
          ${
            items.length
              ? `<ul class="pn-about-list">
                  ${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
                </ul>`
              : `<p class="pn-note" style="margin: 8px 0 0;">No summarized items for this release.</p>`
          }
        </div>
      `;
    }).join("");
  }

  function buildModalHtml(config) {
    const versionInfo = getVersionInfo();

    return `
      <div class="pn-modal-card" role="dialog" aria-modal="true" aria-labelledby="pn-config-title">
        <div class="pn-modal-header">
          <h2 id="pn-config-title">Parallax Nu Configuration</h2>
          <button type="button" data-pn-close>Close</button>
        </div>

        <div class="pn-modal-body">
          <div class="pn-tabs" role="tablist" aria-label="Parallax Nu settings tabs">
            <button type="button" class="pn-tab" data-pn-tab="general">General</button>
            <button type="button" class="pn-tab" data-pn-tab="social">Social</button>
            <button type="button" class="pn-tab" data-pn-tab="audio">Audio</button>
            <button type="button" class="pn-tab" data-pn-tab="rendering">Rendering</button>
            <button type="button" class="pn-tab" data-pn-tab="about">About</button>
          </div>

          <div class="pn-tab-panel" data-pn-tab-panel="general">
            <section class="pn-section">
              <h3>General</h3>
              <div class="pn-grid">
                <label class="pn-checkbox">
                  <input type="checkbox" name="general.enabled" ${config.general.enabled ? "checked" : ""}>
                  <span>Plugin enabled</span>
                </label>

                <label class="pn-checkbox">
                  <input type="checkbox" name="general.debug" ${config.general.debug ? "checked" : ""}>
                  <span>Debug logging</span>
                </label>
              </div>
            </section>
          </div>

          <div class="pn-tab-panel" data-pn-tab-panel="social">
            <section class="pn-section">
              <h3>Social media</h3>
              <div class="pn-grid">
                <label>
                  Bluesky handle
                  <input type="text" name="social.blueskyHandle" value="${escapeHtml(config.social.blueskyHandle)}" placeholder="@yourhandle.bsky.social">
                </label>

                <label>
                  Mastodon handle
                  <input type="text" name="social.mastodonHandle" value="${escapeHtml(config.social.mastodonHandle)}" placeholder="@yourname@instance.social">
                </label>

                <label>
                  YouTube channel
                  <input type="text" name="social.youtubeChannel" value="${escapeHtml(config.social.youtubeChannel)}" placeholder="Channel ID or URL">
                </label>

                <label>
                  X / Twitter handle
                  <input type="text" name="social.twitterHandle" value="${escapeHtml(config.social.twitterHandle)}" placeholder="@yourhandle">
                </label>
              </div>

              <div style="margin-top: 12px;">
                <label class="pn-checkbox">
                  <input type="checkbox" name="social.autoPostEnabled" ${config.social.autoPostEnabled ? "checked" : ""}>
                  <span>Enable future auto-post integrations (stub)</span>
                </label>
              </div>

              <p class="pn-note">
                Placeholder fields for future social sharing and external connection workflows.
              </p>
            </section>
          </div>

          <div class="pn-tab-panel" data-pn-tab-panel="audio">
            <section class="pn-section">
              <h3>Audio</h3>
              <div class="pn-grid">
                <label>
                  Soundfont URL
                  <input type="url" name="audio.soundfontUrl" value="${escapeHtml(config.audio.soundfontUrl)}" placeholder="https://example.com/soundfont.sf2">
                </label>

                <label>
                  MIDI motif pack URL
                  <input type="url" name="audio.motifPackUrl" value="${escapeHtml(config.audio.motifPackUrl)}" placeholder="https://example.com/motifs.json">
                </label>

                <label>
                  Master volume
                  <input type="number" name="audio.masterVolume" min="0" max="1" step="0.05" value="${escapeHtml(String(config.audio.masterVolume))}">
                </label>
              </div>

              <div class="pn-grid" style="margin-top: 12px;">
                <label class="pn-checkbox">
                  <input type="checkbox" name="audio.musicEnabled" ${config.audio.musicEnabled ? "checked" : ""}>
                  <span>Music enabled</span>
                </label>

                <label class="pn-checkbox">
                  <input type="checkbox" name="audio.sfxEnabled" ${config.audio.sfxEnabled ? "checked" : ""}>
                  <span>SFX enabled</span>
                </label>
              </div>
            </section>
          </div>

          <div class="pn-tab-panel" data-pn-tab-panel="rendering">
            <section class="pn-section">
              <h3>Rendering / Assets</h3>
              <div class="pn-grid">
                <label>
                  Preferred model base URL
                  <input type="url" name="rendering.preferredModelBaseUrl" value="${escapeHtml(config.rendering.preferredModelBaseUrl)}" placeholder="https://cdn.example.com/parallax-nu-assets/">
                </label>
              </div>

              <div class="pn-grid" style="margin-top: 12px;">
                <label class="pn-checkbox">
                  <input type="checkbox" name="rendering.useLocalAssetsFirst" ${config.rendering.useLocalAssetsFirst ? "checked" : ""}>
                  <span>Prefer local/custom assets first</span>
                </label>

                <label class="pn-checkbox">
                  <input type="checkbox" name="rendering.commanderVoiceEnabled" ${config.rendering.commanderVoiceEnabled ? "checked" : ""}>
                  <span>Commander voice synthesis (stub)</span>
                </label>
              </div>
            </section>
          </div>

          <div class="pn-tab-panel" data-pn-tab-panel="about">
            <section class="pn-section">
              <h3>About Parallax Nu</h3>

              <div class="pn-about-header">
                <div class="pn-about-grid">
                  <b>Plugin</b><span>${escapeHtml(versionInfo.userscriptName)}</span>
                  <b>Version</b><span>${escapeHtml(versionInfo.pluginVersion)}</span>
                  <b>Mode</b><span>${escapeHtml(versionInfo.buildMode)}</span>
                  <b>Host</b><span>${escapeHtml(versionInfo.planetsHost)}</span>
                  <b>Build Date</b><span>${escapeHtml(versionInfo.buildDate || "Not available")}</span>
                </div>

                <div class="pn-about-logo">
                  ${createLogoSvg()}
                </div>
              </div>
            </section>

            <section class="pn-section">
              <h3>Recent Patch Notes</h3>
              <p class="pn-note">
                ${escapeHtml(versionInfo.patchNotesLocation)}
              </p>
              ${renderReleaseNotes(versionInfo.releaseNotes)}
            </section>

            <section class="pn-section">
              <h3>Planned Sections</h3>
              <div class="pn-about-box">
                <ul class="pn-about-list">
                  <li>Battle presentation and VCR enhancements</li>
                  <li>Audio packs, soundfonts, and motif presets</li>
                  <li>Rendering and asset source preferences</li>
                  <li>Social/export integrations</li>
                </ul>
              </div>
            </section>
          </div>
        </div>

        <div class="pn-modal-footer">
          <button type="button" data-pn-reset>Reset defaults</button>
          <button type="button" data-pn-save>Save</button>
        </div>
      </div>
    `;
  }

  function ensureModal() {
    let modal = document.getElementById(MODAL_ID);
    if (modal) return modal;

    modal = document.createElement("div");
    modal.id = MODAL_ID;
    document.body.appendChild(modal);

    modal.addEventListener("click", function (event) {
      if (event.target === modal || event.target.hasAttribute("data-pn-close")) {
        closeConfigModal();
      }
    });

    return modal;
  }

  function renderModal() {
    const modal = ensureModal();
    modal.innerHTML = buildModalHtml(getConfig());
    wireModalTabs(modal);

    const saveBtn = modal.querySelector("[data-pn-save]");
    const resetBtn = modal.querySelector("[data-pn-reset]");

    if (saveBtn) {
      saveBtn.addEventListener("click", function () {
        const nextConfig = collectFormConfig(modal);
        saveConfig(nextConfig);
        closeConfigModal();
        log("Config saved", nextConfig);
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener("click", function () {
        resetConfig();
        renderModal();
      });
    }
  }

  function openConfigModal() {
    renderModal();
    ensureModal().classList.add("is-open");
  }

  function closeConfigModal() {
    const modal = document.getElementById(MODAL_ID);
    if (modal) modal.classList.remove("is-open");
  }

  function injectTopbarLogo() {
    if (document.getElementById(TOPBAR_LOGO_ID)) return;

    const topbar = document.getElementById("etopbar");
    const nativeLogo = document.getElementById("elogo");

    if (!topbar || !nativeLogo || !nativeLogo.parentNode) return;

    const wrapper = document.createElement("div");
    wrapper.id = TOPBAR_LOGO_ID;
    wrapper.innerHTML = `
      <a href="javascript:void(0)" class="pn-topbar-logo-link" title="Open Parallax Nu settings">
        <div class="pn-topbar-logo">${createTopbarLogoSvg()}</div>
      </a>
    `;

    nativeLogo.insertAdjacentElement("afterend", wrapper);
    topbar.classList.add("parallax-nu-topbar-ready");

    wrapper.querySelector(".pn-topbar-logo-link")?.addEventListener("click", function (event) {
      event.preventDefault();
      openConfigModal();
    });

    log("topbar logo injected");
  }

  function injectAccountNavLink() {
    const navs = Array.from(document.querySelectorAll("section > nav"));
    if (!navs.length) return;

    const targetNav = navs.find((nav) => {
      const accountLink = Array.from(nav.querySelectorAll("a")).find((a) => {
        return a.textContent.trim() === "Account";
      });
      return !!accountLink;
    });

    if (!targetNav) return;
    if (targetNav.querySelector('[data-parallax-nu-nav-link="true"]')) return;

    const accountLink = Array.from(targetNav.querySelectorAll("a")).find((a) => {
      return a.textContent.trim() === "Account";
    });

    if (!accountLink) return;

    const parallaxLink = document.createElement("a");
    parallaxLink.href = "javascript:void(0)";
    parallaxLink.textContent = "Parallax";
    parallaxLink.className = "parallax-nu-nav-link";
    parallaxLink.setAttribute("data-parallax-nu-nav-link", "true");
    parallaxLink.title = "Open Parallax Nu settings";

    parallaxLink.addEventListener("click", function (event) {
      event.preventDefault();
      openConfigModal();
    });

    targetNav.insertBefore(parallaxLink, accountLink);

    log("account nav link injected");
  }

  function initParallaxNuMainMenuModule() {
    ensureStyles();
    injectTopbarLogo();
    injectAccountNavLink();

    if (isInitialized) return;
    isInitialized = true;

    menuObserver = new MutationObserver(function () {
      if (!document.getElementById(TOPBAR_LOGO_ID)) {
        injectTopbarLogo();
      }
      injectAccountNavLink();
    });

    menuObserver.observe(document.body, {
      childList: true,
      subtree: true
    });

    log("main menu module initialized");
  }

  window.ParallaxNu = window.ParallaxNu || {};
  window.ParallaxNu.openConfigModal = openConfigModal;
  window.ParallaxNu.initParallaxNuMainMenuModule = initParallaxNuMainMenuModule;

  log("main-menu-branding loaded");
})();