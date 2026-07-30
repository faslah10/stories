/* Big-Piece-001 — orchestration. Loads data.json, injects scene-7 honesty cards, and drives
   each scene's step state via IntersectionObserver. Reduced-motion → static final states. */
(function () {
  "use strict";
  const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const svg = (n) => d3.select("#svg" + n);
  const active = {}; // scene -> last rendered step (avoid redundant redraws)

  function render(scene, step, data) {
    if (active[scene] === step) return;
    active[scene] = step;
    const fn = window.SCENES[scene];
    if (fn) fn(svg(scene), data, step, REDUCED);
    document.querySelectorAll(`.step[data-scene="${scene}"]`).forEach((el) => {
      el.setAttribute("data-active", String(+el.dataset.step === step));
    });
  }

  function fillFooters(data) {
    document.querySelectorAll(".scene").forEach((sec) => {
      const s = data["scene" + sec.dataset.scene];
      const src = sec.querySelector(".scene-footer .src");
      if (src && s && s.source) src.textContent = "مصدر: " + s.source;
    });
  }

  function injectScene7Cards(data) {
    const wrap = document.getElementById("scene7steps");
    const closing = wrap.querySelector('[data-step="5"]');
    data.scene7.cards.forEach((c, i) => {
      const step = document.createElement("div");
      step.className = "step"; step.dataset.scene = "7"; step.dataset.step = String(i);
      step.innerHTML = `<div class="flip"><div class="front"><h3>${c.title}</h3><p>${c.body}</p></div></div>`;
      wrap.insertBefore(step, closing);
    });
  }

  function setupObserver(data) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const scene = +e.target.dataset.scene, step = +e.target.dataset.step;
        render(scene, step, data);
      });
    }, { root: null, rootMargin: "-45% 0px -45% 0px", threshold: 0 });
    document.querySelectorAll(".step").forEach((el) => io.observe(el));
  }

  fetch("data/data.json")
    .then((r) => r.json())
    .then((data) => {
      fillFooters(data);
      injectScene7Cards(data);
      // initial paint so no SVG is blank before first scroll (reduced-motion → final state)
      for (let n = 1; n <= 7; n++) render(n, REDUCED ? 99 : 0, data);
      if (!REDUCED) setupObserver(data);
    })
    .catch((err) => {
      document.body.insertAdjacentHTML("afterbegin",
        `<p style="padding:1rem;color:#b00">تعذّر تحميل البيانات (data/data.json). شغّل عبر خادم محلي. (${err})</p>`);
    });
})();
