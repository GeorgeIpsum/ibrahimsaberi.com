(() => {
  try {
    const s = document.createElement("style");
    s.appendChild(
      document.createTextNode(
        "*,*::before,*::after{transition:none!important;animation-duration:0s!important}",
      ),
    );
    document.head.appendChild(s);

    const m = document.cookie.match(/(?:^|; )theme=([^;]+)/);
    const v = m && decodeURIComponent(m[1]);
    let theme;
    if (v === "light" || v === "dark") {
      theme = v;
    } else {
      theme = matchMedia("(prefers-color-scheme: dark)").matches
        ? "system-dark"
        : "system-light";
    }
    document.documentElement.dataset.theme = theme;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        s.remove();
      });
    });
  } catch (e) {
    console.error("Error during theme bootstrap:", e);
  }
})();
