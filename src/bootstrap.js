// src/bootstrap.js

import { initParallaxNuMainMenuModule } from "./ui/main-menu-branding.js";

function boot() {
  initParallaxNuMainMenuModule();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot, { once: true });
} else {
  boot();
}