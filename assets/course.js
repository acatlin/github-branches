// @ts-check
/**
 * Course chrome: light/dark theme toggle (remembered per browser) and
 * persistent checkboxes for real-world step lists.
 *
 * Markup: <button class="theme-toggle" type="button">Theme</button>
 *         <ol class="steps" data-key="lesson3"><li><label><input type="checkbox"> …</label></li></ol>
 */
(function () {
  const root = document.documentElement;

  /** @param {string} key @returns {string | null} */
  function load(key) {
    try { return localStorage.getItem(key); } catch { return null; }
  }
  /** @param {string} key @param {string} value */
  function save(key, value) {
    try { localStorage.setItem(key, value); } catch { /* storage unavailable */ }
  }

  const stored = load("gb-theme");
  if (stored === "light" || stored === "dark") root.dataset.theme = stored;

  document.querySelectorAll(".theme-toggle").forEach((btn) => {
    btn.addEventListener("click", () => {
      const dark = root.dataset.theme
        ? root.dataset.theme === "dark"
        : window.matchMedia("(prefers-color-scheme: dark)").matches;
      root.dataset.theme = dark ? "light" : "dark";
      save("gb-theme", root.dataset.theme);
    });
  });

  document.querySelectorAll("ol.steps[data-key]").forEach((list) => {
    const key = "gb-steps-" + /** @type {HTMLElement} */ (list).dataset.key;
    const boxes = Array.from(list.querySelectorAll('input[type="checkbox"]'));
    const state = (load(key) || "").split("");
    boxes.forEach((box, i) => {
      const cb = /** @type {HTMLInputElement} */ (box);
      cb.checked = state[i] === "1";
      cb.addEventListener("change", () => {
        save(key, boxes.map((b) => (/** @type {HTMLInputElement} */ (b).checked ? "1" : "0")).join(""));
      });
    });
  });
})();
