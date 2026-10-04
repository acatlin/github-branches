// @ts-check
/**
 * Quiz component — immediate-feedback multiple choice.
 *
 * Markup:
 *   <div class="quiz">
 *     <p class="q">Question?</p>
 *     <ul class="opts">
 *       <li data-correct>Right answer</li>
 *       <li>Distractor</li>
 *     </ul>
 *     <p class="why">Explanation shown after answering.</p>
 *   </div>
 *   <p class="score" data-quiz-score></p>   (optional running tally)
 *
 * Options are shuffled on load so position never gives the answer away.
 */
(function () {
  /** @template T @param {T[]} arr @returns {T[]} */
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  let answered = 0;
  let correct = 0;

  function updateScore() {
    const total = document.querySelectorAll(".quiz").length;
    document.querySelectorAll("[data-quiz-score]").forEach((el) => {
      el.textContent = answered === 0 ? "" : `${correct} of ${answered} correct · ${total - answered} to go`;
    });
  }

  /** @param {HTMLElement} quiz */
  function mount(quiz) {
    const list = quiz.querySelector(".opts");
    if (!list) return;
    const items = shuffle(Array.from(list.querySelectorAll("li")));
    list.innerHTML = "";
    const why = quiz.querySelector(".why");
    const verdict = document.createElement("span");
    verdict.className = "verdict";
    if (why) why.prepend(verdict);

    /** @type {HTMLButtonElement[]} */
    const buttons = [];
    for (const item of items) {
      const isCorrect = item.hasAttribute("data-correct");
      const li = document.createElement("li");
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "opt";
      btn.innerHTML = item.innerHTML;
      btn.dataset.correct = isCorrect ? "1" : "0";
      btn.addEventListener("click", () => {
        if (quiz.classList.contains("answered")) return;
        quiz.classList.add("answered");
        answered++;
        if (isCorrect) correct++;
        for (const b of buttons) {
          b.disabled = true;
          if (b.dataset.correct === "1") b.classList.add("correct");
        }
        if (!isCorrect) btn.classList.add("wrong");
        verdict.textContent = isCorrect ? "Correct. " : "Not quite. ";
        verdict.className = "verdict " + (isCorrect ? "ok" : "bad");
        updateScore();
      });
      buttons.push(btn);
      li.appendChild(btn);
      list.appendChild(li);
    }
  }

  document.querySelectorAll(".quiz").forEach((q) => mount(/** @type {HTMLElement} */ (q)));
})();
