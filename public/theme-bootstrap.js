(() => {
  try {
    const s = document.createElement("style");
    s.appendChild(
      document.createTextNode(
        "*,*::before,*::after{transition:none!important;animation-duration:0s!important}",
      ),
    );
    document.head.appendChild(s);

    const v = localStorage.theme;
    let theme;
    if (v === "light" || v === "dark") {
      theme = v;
    } else {
      theme = matchMedia("(prefers-color-scheme: dark)").matches
        ? "system-dark"
        : "system-light";
    }
    document.documentElement.dataset.theme = theme;

    const c = localStorage.contrast;
    let contrast;
    if (c === "normal" || c === "high") {
      contrast = c;
    } else {
      contrast = matchMedia("(prefers-contrast: more)").matches
        ? "system-high"
        : "system-normal";
    }
    document.documentElement.dataset.contrast = contrast;
    document.documentElement.dataset.themeSet = "1";

    // Control panel: reveal a restored-open panel before first paint (mirrors
    // the theme approach above) so it never pops in after hydration.
    document.documentElement.dataset.panel =
      localStorage.panelVisible === "true" ? "open" : "closed";

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        s.remove();
      });
    });
  } catch (e) {
    console.error("Error during theme bootstrap:", e);
  }
})();
