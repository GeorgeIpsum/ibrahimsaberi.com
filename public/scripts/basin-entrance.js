(() => {
  try {
    const el = document.currentScript.parentElement;
    if (!el) return;

    const key = `basin-entrance:${location.pathname}`;
    if (sessionStorage.getItem(key)) {
      el.setAttribute("data-seen", "");
    } else {
      sessionStorage.setItem(key, "1");
    }
  } catch {
    /* sessionStorage unavailable — let the animation play */
  }
})();
