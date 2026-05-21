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
    document.documentElement.dataset.themeSet = "1";

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        s.remove();
      });
    });
  } catch (e) {
    console.error("Error during theme bootstrap:", e);
  }
})();
