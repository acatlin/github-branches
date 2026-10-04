// @ts-check
/**
 * Command drill — retrieval practice for git / gh commands.
 *
 * Markup:
 *   <div class="drill" data-accept="git switch -c clean-dates || git checkout -b clean-dates">
 *     <p class="prompt">Create and switch to a branch called <code>clean-dates</code>.</p>
 *   </div>
 *
 * `data-accept` holds acceptable answers separated by "||". Matching ignores
 * repeated whitespace, quote style, and a leading "$ ". After two misses the
 * learner can reveal the first accepted answer.
 */
(function () {
  /** @param {string} s */
  function normalise(s) {
    return s
      .trim()
      .replace(/^\$\s*/, "")
      .replace(/[‘’“”]/g, '"')
      .replace(/'/g, '"')
      .replace(/\s+/g, " ");
  }

  /** @param {HTMLElement} el */
  function mount(el) {
    const accepted = (el.dataset.accept || "").split("||").map(normalise).filter(Boolean);
    if (accepted.length === 0) return;
    let misses = 0;

    const form = document.createElement("form");
    const input = document.createElement("input");
    input.type = "text";
    input.autocomplete = "off";
    input.spellcheck = false;
    input.setAttribute("autocapitalize", "off");
    input.setAttribute("aria-label", "Type the command");
    input.placeholder = "$ type the command";
    const check = document.createElement("button");
    check.type = "submit";
    check.textContent = "Check";
    const reveal = document.createElement("button");
    reveal.type = "button";
    reveal.className = "secondary";
    reveal.textContent = "Show answer";
    reveal.hidden = true;
    const feedback = document.createElement("p");
    feedback.className = "feedback";
    feedback.setAttribute("aria-live", "polite");

    form.append(input, check, reveal);
    el.append(form, feedback);

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const guess = normalise(input.value);
      if (!guess) return;
      if (accepted.includes(guess)) {
        feedback.textContent = "✓ Exactly right.";
        feedback.className = "feedback ok";
        input.disabled = true;
        check.disabled = true;
        reveal.hidden = true;
      } else {
        misses++;
        feedback.textContent = misses === 1 ? "Not quite — try again from memory." : "Still not it. Peek if you need to, then retype it.";
        feedback.className = "feedback bad";
        if (misses >= 2) reveal.hidden = false;
      }
    });

    reveal.addEventListener("click", () => {
      feedback.innerHTML = "";
      const code = document.createElement("code");
      code.textContent = (el.dataset.accept || "").split("||")[0].trim();
      feedback.append("Answer: ", code, " — now type it yourself.");
      feedback.className = "feedback";
      input.value = "";
      input.focus();
    });
  }

  document.querySelectorAll(".drill").forEach((d) => mount(/** @type {HTMLElement} */ (d)));
})();
