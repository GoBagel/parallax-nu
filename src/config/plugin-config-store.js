(function () {
  const STORAGE_KEY = "parallax-nu:config";

  const DEFAULT_CONFIG = {
    general: {
      enabled: true,
      debug: false,
    },
    social: {
      blueskyHandle: "",
      mastodonHandle: "",
      youtubeChannel: "",
      twitterHandle: "",
      autoPostEnabled: false,
    },
    audio: {
      soundfontUrl: "",
      motifPackUrl: "",
      musicEnabled: true,
      sfxEnabled: true,
      masterVolume: 0.8,
    },
    rendering: {
      commanderVoiceEnabled: false,
      useLocalAssetsFirst: true,
      preferredModelBaseUrl: "",
    },
  };

  function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function deepMerge(target, source) {
    const out = Array.isArray(target) ? target.slice() : { ...target };
    Object.keys(source || {}).forEach((key) => {
      const sv = source[key];
      const tv = out[key];
      if (
        sv &&
        typeof sv === "object" &&
        !Array.isArray(sv) &&
        tv &&
        typeof tv === "object" &&
        !Array.isArray(tv)
      ) {
        out[key] = deepMerge(tv, sv);
      } else {
        out[key] = sv;
      }
    });
    return out;
  }

  function getPluginConfig() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return deepClone(DEFAULT_CONFIG);
      return deepMerge(deepClone(DEFAULT_CONFIG), JSON.parse(raw));
    } catch (err) {
      console.warn("[Parallax Nu] config load failed", err);
      return deepClone(DEFAULT_CONFIG);
    }
  }

  function savePluginConfig(nextConfig) {
    const merged = deepMerge(getPluginConfig(), nextConfig || {});
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    return merged;
  }

  function resetPluginConfig() {
    const clean = deepClone(DEFAULT_CONFIG);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
    return clean;
  }

  window.ParallaxNu = window.ParallaxNu || {};
  window.ParallaxNu.getPluginConfig = getPluginConfig;
  window.ParallaxNu.savePluginConfig = savePluginConfig;
  window.ParallaxNu.resetPluginConfig = resetPluginConfig;
})();