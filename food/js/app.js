/* Big-Piece-001 · orchestration. Loads data.json, injects scene-7 honesty cards after the
   closing, drives each scene's step via IntersectionObserver, and runs a scroll-progress bar.
   Reduced-motion → static final states. */
(function () {
  "use strict";
  const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const svg = (n) => d3.select("#svg" + n);
  const active = {};

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
      if (src && s && s.source) src.textContent = "المصدر: " + s.source;
    });
  }

  function injectScene7Cards(data) {
    const wrap = document.getElementById("scene7steps");
    data.scene7.cards.forEach((c, i) => {
      const step = document.createElement("div");
      step.className = "step"; step.dataset.scene = "7"; step.dataset.step = String(i + 2);
      step.innerHTML = `<div class="honesty"><h3>${c.title}</h3><p>${c.body}</p></div>`;
      wrap.appendChild(step);   // AFTER the closing (step 0) + summary (step 1)
    });
  }

  function setupObserver(data) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        render(+e.target.dataset.scene, +e.target.dataset.step, data);
      });
    }, { root: null, rootMargin: "-45% 0px -45% 0px", threshold: 0 });
    document.querySelectorAll(".step").forEach((el) => io.observe(el));
  }

  // re-render every drawn scene at its current step on resize/rotate: the responsive viewBox
  // is measured at render time, and scene 6 swaps SVG↔HTML cards at the 600px breakpoint.
  function onResize(data) {
    let t = null;
    window.addEventListener("resize", () => {
      clearTimeout(t);
      t = setTimeout(() => {
        Object.keys(active).forEach((scene) => {
          const step = active[scene];
          const fn = window.SCENES[scene];
          if (fn) fn(svg(scene), data, step, REDUCED);   // force redraw (bypass render() guard)
        });
      }, 160);
    });
  }

  function progressBar() {
    const bar = document.getElementById("progress");
    if (!bar) return;
    const upd = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      bar.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + "%";
    };
    window.addEventListener("scroll", upd, { passive: true });
    window.addEventListener("resize", upd);
    upd();
  }

  fetch("data/data.json")
    .then((r) => r.json())
    .then((data) => {
      fillFooters(data);
      injectScene7Cards(data);
      for (let n = 1; n <= 7; n++) render(n, REDUCED ? 99 : 0, data);
      progressBar();
      onResize(data);
      if (!REDUCED) setupObserver(data);
    })
    .catch((err) => {
      document.body.insertAdjacentHTML("afterbegin",
        `<p style="padding:1rem;color:#b00">تعذّر تحميل البيانات (data/data.json). شغّل عبر خادم محلي. (${err})</p>`);
    });
})();
