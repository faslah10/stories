/* Big-Piece-001 · D3 scene renderers. SCENES[n](svg, data, step, reduced) fully redraws that
   scene for `step`. RESPONSIVE viewBox: each render measures the SVG's rendered pixel width and
   sets the viewBox to match (1:1 scale), so SVG text renders at its exact px size (≥12px effective
   on phones). Time axes run RIGHT→LEFT (earliest right, latest LEFT). Numbers come only from data.
   Text/axis contrast: grey #6E6E6E, orange text #B25E00; fills keep house colors. */
(function () {
  "use strict";
  const C = { purple: "#5E35B1", orange: "#E58606", grey: "#B0B0B0" };
  const T = { grey: "#6E6E6E", orange: "#B25E00", ink: "#1a1523" };
  const H = 380, W0 = 620, M = { t: 30, r: 48, b: 46, l: 52 };
  const FS = { axis: 14, label: 16, small: 13, big: 60 };   // px; 1:1 viewBox ⇒ effective px
  const parseT = (s) => { const [y, m] = String(s).split("-"); return m ? +y + (+m - 1) / 12 : +y; };
  const isNarrow = () => (typeof window !== "undefined" && window.innerWidth < 600);

  // measure rendered width, set matching viewBox (1:1), return the width in viewBox units
  function viewport(svg) {
    const node = svg.node();
    let w = node ? Math.round(node.getBoundingClientRect().width) : W0;
    if (!w || w < 220) w = W0;
    svg.attr("viewBox", `0 0 ${w} ${H}`).attr("preserveAspectRatio", "xMidYMid meet");
    return w;
  }
  function frame(svg) { svg.selectAll("*").remove(); return svg.append("g"); }
  function xTime(W, dom) { return d3.scaleLinear().domain(dom).range([W - M.r, M.l]); }
  function yLin(dom) { return d3.scaleLinear().domain(dom).range([H - M.b, M.t]); }
  function yAxis(g, W, y, ticks) {
    ticks.forEach((t) => {
      g.append("line").attr("stroke", "#ece7f4").attr("x1", M.l).attr("x2", W - M.r).attr("y1", y(t)).attr("y2", y(t));
      g.append("text").attr("x", W - M.r + 7).attr("y", y(t) + 5).attr("text-anchor", "start").attr("fill", T.grey).attr("font-size", FS.axis).text(t);
    });
  }
  function xTicks(g, x, vals) {
    vals.forEach((v) => g.append("text").attr("x", x(v)).attr("y", H - M.b + 22).attr("text-anchor", "middle").attr("fill", T.grey).attr("font-size", FS.axis).text(v));
  }

  function scene1(svg, data, step, reduced) {
    const s = data.scene1; if (reduced) step = 3;
    const W = viewport(svg), g = frame(svg);
    const x = xTime(W, [2016, 2026.6]), y = yLin([0, 130]);
    yAxis(g, W, y, [0, 40, 80, 120]); xTicks(g, x, [2016, 2019, 2022, 2024, 2026]);
    if (step >= 2) {
      const bx = x(2024);
      g.append("line").attr("x1", bx).attr("x2", bx).attr("y1", M.t).attr("y2", H - M.b).attr("stroke", C.orange).attr("stroke-width", 2).attr("stroke-dasharray", "3 3");
      g.append("text").attr("x", bx).attr("y", M.t - 10).attr("text-anchor", "middle").attr("fill", T.orange).attr("font-size", FS.small).attr("font-weight", 700).text(s.breakLabel);
    }
    if (step >= 1) {
      const dec = s.decade.filter((d) => step >= 2 || d.year <= 2019);
      g.append("path").datum(dec).attr("fill", "none").attr("stroke", C.grey).attr("stroke-width", 2.5).attr("stroke-dasharray", "5 4")
        .attr("d", d3.line().x((d) => x(d.year)).y((d) => y(d.ticket)).curve(d3.curveStepAfter));
      g.selectAll("circle.d").data(dec).join("circle").attr("cx", (d) => x(d.year)).attr("cy", (d) => y(d.ticket)).attr("r", 3.5).attr("fill", C.grey);
      g.append("text").attr("x", x(2016)).attr("y", y(s.decade[0].ticket) - 10).attr("text-anchor", "middle").attr("fill", T.grey).attr("font-weight", 700).attr("font-size", FS.label).text(s.decade[0].ticket);
    }
    if (step >= 3) {
      const mon = s.monthly.map((d) => ({ t: parseT(d.month), v: d.ticket }));
      g.append("path").datum(mon).attr("fill", "none").attr("stroke", C.purple).attr("stroke-width", 3).attr("d", d3.line().x((d) => x(d.t)).y((d) => y(d.v)));
      const last = mon[mon.length - 1];
      g.append("circle").attr("cx", x(last.t)).attr("cy", y(last.v)).attr("r", 4.5).attr("fill", C.purple);
      g.append("text").attr("x", x(last.t) - 6).attr("y", y(last.v) - 10).attr("text-anchor", "end").attr("fill", C.purple).attr("font-weight", 800).attr("font-size", FS.label).text(s.monthlyLatest);
    }
  }

  function scene2(svg, data, step, reduced) {
    const s = data.scene2; if (reduced) step = 4;
    const W = viewport(svg), g = frame(svg);
    const y = d3.scaleLinear().domain([0, Math.max(s.countMult, 10)]).range([H - M.b, M.t]);
    const cx1 = W * 0.66, cx2 = W * 0.34, bw = Math.min(104, W * 0.24);
    const bar = (cx, mult, show, color, tcolor, title, sub) => {
      const h = show ? (H - M.b) - y(mult) : 0;
      g.append("rect").attr("x", cx - bw / 2).attr("y", (H - M.b) - h).attr("width", bw).attr("height", h).attr("rx", 8).attr("fill", color);
      if (show) g.append("text").attr("x", cx).attr("y", (H - M.b) - h - 12).attr("text-anchor", "middle").attr("fill", tcolor).attr("font-weight", 800).attr("font-size", 28).text("×" + mult);
      g.append("text").attr("x", cx).attr("y", H - M.b + 22).attr("text-anchor", "middle").attr("fill", T.grey).attr("font-size", FS.small + 1).text(title);
      if (sub && show) g.append("text").attr("x", cx).attr("y", H - M.b + 40).attr("text-anchor", "middle").attr("fill", T.grey).attr("font-size", FS.small).text(sub);
    };
    g.append("line").attr("x1", M.l).attr("x2", W - M.r).attr("y1", H - M.b).attr("y2", H - M.b).attr("stroke", "#d9d2e6");
    bar(cx1, s.valueMult, step >= 1, C.purple, C.purple, "قيمة الإنفاق", step >= 1 ? s.valueEndBillionSar + " مليار ريال" : "");
    bar(cx2, s.countMult, step >= 2, C.orange, T.orange, "عدد العمليات", step >= 2 ? "~" + s.countEndBillion + " مليار عملية" : "");
    if (step >= 2) g.append("text").attr("x", W / 2).attr("y", M.t).attr("text-anchor", "middle").attr("fill", T.grey).attr("font-size", FS.small).text("العمليات تسبق القيمة بفارق كبير");
  }

  function scene3(svg, data, step, reduced) {
    const s = data.scene3; if (reduced) step = 3;
    const W = viewport(svg), g = frame(svg);
    const x = xTime(W, [2016, 2023]), y = yLin([0, 110]);
    yAxis(g, W, y, [0, 50, 100]); xTicks(g, x, [2016, 2019, 2022]);
    g.append("line").attr("x1", M.l).attr("x2", W - M.r).attr("y1", y(100)).attr("y2", y(100)).attr("stroke", C.orange).attr("stroke-width", 1.5).attr("stroke-dasharray", "4 4");
    g.append("text").attr("x", M.l).attr("y", y(100) - 8).attr("fill", T.orange).attr("font-size", FS.small).text("خط التساوي مع البقالة (100)");
    const upto = step === 0 ? 2016 : step === 1 ? 2022 : 2023;
    const pts = s.annual.filter((d) => d.year <= upto);
    g.append("path").datum(pts).attr("fill", C.purple).attr("opacity", 0.12).attr("d", d3.area().x((d) => x(d.year)).y0(y(0)).y1((d) => y(d.ratio)));
    g.append("path").datum(pts).attr("fill", "none").attr("stroke", C.purple).attr("stroke-width", 3).attr("d", d3.line().x((d) => x(d.year)).y((d) => y(d.ratio)));
    const cur = pts[pts.length - 1];
    g.append("circle").attr("cx", x(cur.year)).attr("cy", y(cur.ratio)).attr("r", 4.5).attr("fill", C.purple);
    g.append("text").attr("x", W / 2).attr("y", M.t + 42).attr("text-anchor", "middle").attr("fill", C.purple).attr("font-size", FS.big).attr("font-weight", 800).text(step >= 2 ? cur.ratio : Math.round(cur.ratio));
    g.append("text").attr("x", W / 2).attr("y", M.t + 64).attr("text-anchor", "middle").attr("fill", T.grey).attr("font-size", FS.small).text("ريال مطاعم لكل 100 ريال بقالة (" + cur.year + ")");
    if (step >= 2) g.append("text").attr("x", W / 2).attr("y", M.t + 86).attr("text-anchor", "middle").attr("fill", T.orange).attr("font-size", FS.small).attr("font-weight", 700).text("توقّف دون التساوي");
  }

  function scene4(svg, data, step, reduced) {
    const s = data.scene4; if (reduced) step = 4;
    const W = viewport(svg), g = frame(svg);
    const x = xTime(W, [2013, 2026.6]), y = yLin([65, 112]);
    yAxis(g, W, y, [70, 80, 90, 100, 110]); xTicks(g, x, [2013, 2016, 2019, 2022, 2026]);
    const maxT = step === 0 ? 2014 : 2026.5;
    const pts = s.cpi.map((d) => ({ t: parseT(d.month), food: d.food, rest: d.rest })).filter((d) => d.t <= maxT);
    g.append("path").datum(pts).attr("fill", C.orange).attr("opacity", 0.14).attr("d", d3.area().x((d) => x(d.t)).y0((d) => y(d.food)).y1((d) => y(d.rest)));
    g.append("path").datum(pts).attr("fill", "none").attr("stroke", C.grey).attr("stroke-width", 2.5).attr("d", d3.line().x((d) => x(d.t)).y((d) => y(d.food)));
    g.append("path").datum(pts).attr("fill", "none").attr("stroke", C.purple).attr("stroke-width", 3).attr("d", d3.line().x((d) => x(d.t)).y((d) => y(d.rest)));
    g.append("text").attr("x", x(2013)).attr("y", y(s.cpi[0].food) - 10).attr("text-anchor", "middle").attr("fill", T.grey).attr("font-size", FS.small).text("أغذية البيت");
    g.append("text").attr("x", x(2013)).attr("y", y(s.cpi[0].rest) + 18).attr("text-anchor", "middle").attr("fill", C.purple).attr("font-size", FS.small).text("المطاعم");
    if (step >= 1) g.append("text").attr("x", x(2020)).attr("y", M.t).attr("text-anchor", "middle").attr("fill", C.purple).attr("font-size", FS.small).attr("font-weight", 700).text("المطاعم +" + s.growthRestSince2013 + "% · البيت +" + s.growthFoodSince2013 + "%");
    if (step >= 2) { const ct = parseT(s.crossover); g.append("circle").attr("cx", x(ct)).attr("cy", y(100)).attr("r", 5.5).attr("fill", C.orange); g.append("text").attr("x", x(ct)).attr("y", y(100) + 24).attr("text-anchor", "middle").attr("fill", T.orange).attr("font-size", FS.small).attr("font-weight", 700).text("أول عبور 2018"); }
    if (step >= 3) { const e = s.cpi[s.cpi.length - 1]; g.append("text").attr("x", x(2026.5) + 2).attr("y", y(e.rest)).attr("text-anchor", "start").attr("fill", C.purple).attr("font-size", FS.small).text(e.rest); }
  }

  function scene5(svg, data, step, reduced) {
    const s = data.scene5; if (reduced) step = 2;
    const W = viewport(svg), g = frame(svg);
    const roles = s.roleOrder, years = Array.from(new Set(s.weeks.map((w) => w.year))).sort();
    const y = yLin([0, 150]);
    yAxis(g, W, y, [0, 50, 100, 150]);
    g.append("line").attr("x1", M.l).attr("x2", W - M.r).attr("y1", y(100)).attr("y2", y(100)).attr("stroke", C.orange).attr("stroke-width", 1.5).attr("stroke-dasharray", "4 4");
    g.append("text").attr("x", W - M.r).attr("y", y(100) - 7).attr("text-anchor", "end").attr("fill", T.orange).attr("font-size", 12).text("تساوٍ (100)");
    const gw = (W - M.l - M.r) / years.length, bw = Math.min(12, (gw - 8) / roles.length);
    years.forEach((yr, gi) => {
      const gx = (W - M.r) - (gi + 1) * gw + 4;
      const yw = s.weeks.filter((w) => w.year === yr);
      roles.forEach((role, ri) => {
        const wk = yw.find((w) => w.role === role); if (!wk || wk.ratio == null) return;
        const isEid = role === "eid_week";
        if (!(step >= 1 || (role !== "late_ramadan" && role !== "eid_week"))) return;
        g.append("rect").attr("x", gx + ri * bw).attr("y", y(wk.ratio)).attr("width", bw - 1).attr("height", (H - M.b) - y(wk.ratio))
          .attr("fill", isEid ? C.orange : (wk.ratio >= 100 ? C.purple : C.grey)).attr("opacity", isEid ? 1 : 0.72);
      });
      g.append("text").attr("x", gx + (roles.length * bw) / 2).attr("y", H - M.b + 20).attr("text-anchor", "middle").attr("fill", T.grey).attr("font-size", 13).attr("font-weight", 600).text(yr);
    });
    if (step >= 1 && s.eid2025Ratio) g.append("text").attr("x", W / 2).attr("y", M.t - 2).attr("text-anchor", "middle").attr("fill", T.orange).attr("font-weight", 800).attr("font-size", 16).text("عيد 2025: " + Math.round(s.eid2025Ratio) + " لكل 100");
  }

  // scene 6: item-first price-tag cards (one card per item, only observed prices · no empty cells).
  // Rendered as HTML for all widths; the SVG stays hidden. The 30.6 average line anchors above.
  const ITEM_LABEL = { "وجبة برغر": "وجبة اقتصادية", "شاي كرك": "كرك", "عصير برتقال": "عصير" };
  function scene6(svg, data, step, reduced) {
    const node = svg.node(), cards = document.getElementById("grid6");
    if (node) node.style.display = "none";
    if (cards) { cards.hidden = false; cards.innerHTML = scene6cards(data.scene6); }
  }
  function scene6cards(s) {
    const cardsHtml = s.items.map((it) => {
      const tags = s.grid.filter((ch) => ch.items[it] != null).map((ch) =>
        `<span class="ic-tag"><span class="ic-price">${ch.items[it]}<i>ريال</i></span><span class="ic-chain">${ch.chain}</span></span>`
      ).join("");
      return `<div class="ic"><div class="ic-name">${ITEM_LABEL[it] || it}</div><div class="ic-tags">${tags}</div></div>`;
    }).join("");
    return `<div class="ic-anchor">متوسط العملية ≈ ${s.avgBill} ريالًا</div>
      <div class="ic-grid">${cardsHtml}</div>
      <div class="ic-foot">سلاسل أخرى كبرى تنشر أسعارها داخل تطبيقاتها فقط</div>`;
  }

  function scene7(svg, data, step, reduced) {
    const s = data.scene7;
    const W = viewport(svg), g = frame(svg);
    const millions = (n) => (n / 1e6).toLocaleString("en", { maximumFractionDigits: 1 });
    g.append("text").attr("x", W / 2).attr("y", H * 0.42).attr("text-anchor", "middle").attr("fill", C.purple).attr("font-size", 84).attr("font-weight", 800).text(s.perAdultMonth);
    g.append("text").attr("x", W / 2).attr("y", H * 0.42 + 34).attr("text-anchor", "middle").attr("fill", T.grey).attr("font-size", 15).text("عملية مطعم شهريًا لكل مقيم بعمر 15 سنة فأكثر");
    g.append("text").attr("x", W / 2).attr("y", H * 0.42 + 58).attr("text-anchor", "middle").attr("fill", "#9a93a8").attr("font-size", 13).text("≈ " + millions(s.numeratorThousand * 1000) + " مليون عملية ÷ " + millions(s.population15plus) + " مليون مقيم (15+)");
  }

  window.SCENES = { 1: scene1, 2: scene2, 3: scene3, 4: scene4, 5: scene5, 6: scene6, 7: scene7 };
})();
