/* Big-Piece-001 — D3 scene renderers. SCENES[n](svg, data, step, reduced) fully redraws that
   scene for `step`. Time axes run RIGHT→LEFT (earliest right, latest LEFT). Numbers come only
   from `data` (data.json). Text/axis contrast: grey #6E6E6E, orange text #B25E00; fills keep
   house colors (#5E35B1 / #E58606 / #B0B0B0). */
(function () {
  "use strict";
  const C = { purple: "#5E35B1", orange: "#E58606", grey: "#B0B0B0" };
  const T = { grey: "#6E6E6E", orange: "#B25E00", ink: "#1a1523" };   // TEXT/axis (contrast)
  const W = 620, H = 380, M = { t: 30, r: 48, b: 46, l: 52 };
  const FS = { axis: 16, label: 17, small: 14 };                       // ≥12px effective on mobile
  const parseT = (s) => { const [y, m] = String(s).split("-"); return m ? +y + (+m - 1) / 12 : +y; };
  const isNarrow = () => (typeof window !== "undefined" && window.innerWidth < 600);

  function frame(svg) { svg.selectAll("*").remove(); return svg.append("g"); }
  function xTime(dom) { return d3.scaleLinear().domain(dom).range([W - M.r, M.l]); } // earliest→right, latest→left
  function yLin(dom) { return d3.scaleLinear().domain(dom).range([H - M.b, M.t]); }

  function yAxis(g, y, ticks) {
    const ax = g.append("g");
    ticks.forEach((t) => {
      ax.append("line").attr("stroke", "#ece7f4").attr("x1", M.l).attr("x2", W - M.r).attr("y1", y(t)).attr("y2", y(t));
      ax.append("text").attr("x", W - M.r + 7).attr("y", y(t) + 5).attr("text-anchor", "start")
        .attr("fill", T.grey).attr("font-size", FS.axis).text(t);
    });
  }
  function xTicks(g, x, vals, fmt) {
    vals.forEach((v) => g.append("text").attr("x", x(v)).attr("y", H - M.b + 22)
      .attr("text-anchor", "middle").attr("fill", T.grey).attr("font-size", FS.axis).text(fmt ? fmt(v) : v));
  }

  /* ---- scene 1: step ladder (classification first, two segments never spliced) ---- */
  function scene1(svg, data, step, reduced) {
    const s = data.scene1; if (reduced) step = 3;
    const g = frame(svg);
    const x = xTime([2016, 2026.6]), y = yLin([0, 130]);
    yAxis(g, y, [0, 40, 80, 120]);
    xTicks(g, x, [2016, 2019, 2022, 2024, 2026]);
    if (step >= 2) {
      const bx = x(2024);
      g.append("line").attr("x1", bx).attr("x2", bx).attr("y1", M.t).attr("y2", H - M.b)
        .attr("stroke", C.orange).attr("stroke-width", 2).attr("stroke-dasharray", "3 3");
      g.append("text").attr("x", bx).attr("y", M.t - 10).attr("text-anchor", "middle")
        .attr("fill", T.orange).attr("font-size", FS.small).attr("font-weight", 700).text(s.breakLabel);
    }
    if (step >= 1) {
      const dec = s.decade.filter((d) => step >= 2 || d.year <= 2019);
      const stepLine = d3.line().x((d) => x(d.year)).y((d) => y(d.ticket)).curve(d3.curveStepAfter);
      g.append("path").datum(dec).attr("fill", "none").attr("stroke", C.grey)
        .attr("stroke-width", 2.5).attr("stroke-dasharray", "5 4").attr("d", stepLine);
      g.selectAll("circle.d").data(dec).join("circle").attr("cx", (d) => x(d.year)).attr("cy", (d) => y(d.ticket))
        .attr("r", 3.5).attr("fill", C.grey);
      g.append("text").attr("x", x(2016)).attr("y", y(s.decade[0].ticket) - 10).attr("text-anchor", "middle")
        .attr("fill", T.grey).attr("font-weight", 700).attr("font-size", FS.label).text(s.decade[0].ticket);
    }
    if (step >= 3) {
      const mon = s.monthly.map((d) => ({ t: parseT(d.month), v: d.ticket }));
      g.append("path").datum(mon).attr("fill", "none").attr("stroke", C.purple).attr("stroke-width", 3)
        .attr("d", d3.line().x((d) => x(d.t)).y((d) => y(d.v)));
      const last = mon[mon.length - 1];
      g.append("circle").attr("cx", x(last.t)).attr("cy", y(last.v)).attr("r", 4.5).attr("fill", C.purple);
      g.append("text").attr("x", x(last.t) - 6).attr("y", y(last.v) - 10).attr("text-anchor", "end")
        .attr("fill", C.purple).attr("font-weight", 800).attr("font-size", FS.label).text(s.monthlyLatest);
    }
  }

  /* ---- scene 2: two racing counters + count endpoints ---- */
  function scene2(svg, data, step, reduced) {
    const s = data.scene2; if (reduced) step = 4;
    const g = frame(svg);
    const y = d3.scaleLinear().domain([0, Math.max(s.countMult, 10)]).range([H - M.b, M.t]);
    const cx1 = W * 0.66, cx2 = W * 0.34, bw = 104;
    const bar = (cx, mult, show, color, title, sub) => {
      const h = show ? (H - M.b) - y(mult) : 0;
      g.append("rect").attr("x", cx - bw / 2).attr("y", (H - M.b) - h).attr("width", bw).attr("height", h)
        .attr("rx", 8).attr("fill", color);
      if (show) g.append("text").attr("x", cx).attr("y", (H - M.b) - h - 12).attr("text-anchor", "middle")
        .attr("fill", color === C.orange ? T.orange : C.purple).attr("font-weight", 800).attr("font-size", 30)
        .text("×" + mult);
      g.append("text").attr("x", cx).attr("y", H - M.b + 22).attr("text-anchor", "middle")
        .attr("fill", T.grey).attr("font-size", FS.small + 1).text(title);
      if (sub && show) g.append("text").attr("x", cx).attr("y", H - M.b + 40).attr("text-anchor", "middle")
        .attr("fill", T.grey).attr("font-size", FS.small).text(sub);
    };
    g.append("line").attr("x1", M.l).attr("x2", W - M.r).attr("y1", H - M.b).attr("y2", H - M.b).attr("stroke", "#d9d2e6");
    bar(cx1, s.valueMult, step >= 1, C.purple, "قيمة الإنفاق", step >= 1 ? s.valueEndBillionSar + " مليار ريال" : "");
    bar(cx2, s.countMult, step >= 2, C.orange, "عدد العمليات", step >= 2 ? "~" + s.countEndBillion + " مليار عملية" : "");
    if (step >= 2) g.append("text").attr("x", W / 2).attr("y", M.t).attr("text-anchor", "middle")
      .attr("fill", T.grey).attr("font-size", FS.small).text("العمليات تسبق القيمة بفارق كبير");
  }

  /* ---- scene 3: ratio odometer + parity ---- */
  function scene3(svg, data, step, reduced) {
    const s = data.scene3; if (reduced) step = 3;
    const g = frame(svg);
    const x = xTime([2016, 2023]), y = yLin([0, 110]);
    yAxis(g, y, [0, 50, 100]);
    xTicks(g, x, [2016, 2019, 2022]);
    g.append("line").attr("x1", M.l).attr("x2", W - M.r).attr("y1", y(100)).attr("y2", y(100))
      .attr("stroke", C.orange).attr("stroke-width", 1.5).attr("stroke-dasharray", "4 4");
    g.append("text").attr("x", M.l).attr("y", y(100) - 8).attr("fill", T.orange).attr("font-size", FS.small).text("خط التعادل (100)");
    const upto = step === 0 ? 2016 : step === 1 ? 2022 : 2023;
    const pts = s.annual.filter((d) => d.year <= upto);
    g.append("path").datum(pts).attr("fill", C.purple).attr("opacity", 0.12)
      .attr("d", d3.area().x((d) => x(d.year)).y0(y(0)).y1((d) => y(d.ratio)));
    g.append("path").datum(pts).attr("fill", "none").attr("stroke", C.purple).attr("stroke-width", 3)
      .attr("d", d3.line().x((d) => x(d.year)).y((d) => y(d.ratio)));
    const cur = pts[pts.length - 1];
    g.append("circle").attr("cx", x(cur.year)).attr("cy", y(cur.ratio)).attr("r", 4.5).attr("fill", C.purple);
    g.append("text").attr("x", W / 2).attr("y", M.t + 44).attr("text-anchor", "middle")
      .attr("fill", C.purple).attr("font-size", 62).attr("font-weight", 800).text(step >= 2 ? cur.ratio : Math.round(cur.ratio));
    g.append("text").attr("x", W / 2).attr("y", M.t + 66).attr("text-anchor", "middle")
      .attr("fill", T.grey).attr("font-size", FS.small).text("ريال مطاعم لكل 100 ريال بقالة (" + cur.year + ")");
    if (step >= 2) g.append("text").attr("x", W / 2).attr("y", M.t + 88).attr("text-anchor", "middle")
      .attr("fill", T.orange).attr("font-size", FS.small).attr("font-weight", 700).text("توقّف دون التعادل");
  }

  /* ---- scene 4: two CPI lines + gap flip ---- */
  function scene4(svg, data, step, reduced) {
    const s = data.scene4; if (reduced) step = 4;
    const g = frame(svg);
    const x = xTime([2013, 2026.6]), y = yLin([65, 112]);
    yAxis(g, y, [70, 80, 90, 100, 110]);
    xTicks(g, x, [2013, 2016, 2019, 2022, 2026]);
    const maxT = step === 0 ? 2014 : 2026.5;
    const pts = s.cpi.map((d) => ({ t: parseT(d.month), food: d.food, rest: d.rest })).filter((d) => d.t <= maxT);
    g.append("path").datum(pts).attr("fill", C.orange).attr("opacity", 0.14)
      .attr("d", d3.area().x((d) => x(d.t)).y0((d) => y(d.food)).y1((d) => y(d.rest)));
    g.append("path").datum(pts).attr("fill", "none").attr("stroke", C.grey).attr("stroke-width", 2.5)
      .attr("d", d3.line().x((d) => x(d.t)).y((d) => y(d.food)));
    g.append("path").datum(pts).attr("fill", "none").attr("stroke", C.purple).attr("stroke-width", 3)
      .attr("d", d3.line().x((d) => x(d.t)).y((d) => y(d.rest)));
    g.append("text").attr("x", x(2013)).attr("y", y(s.cpi[0].food) - 10).attr("text-anchor", "middle").attr("fill", T.grey).attr("font-size", FS.small).text("أغذية البيت");
    g.append("text").attr("x", x(2013)).attr("y", y(s.cpi[0].rest) + 18).attr("text-anchor", "middle").attr("fill", C.purple).attr("font-size", FS.small).text("المطاعم");
    if (step >= 1) g.append("text").attr("x", x(2020)).attr("y", M.t).attr("text-anchor", "middle").attr("fill", C.purple).attr("font-size", FS.small).attr("font-weight", 700).text("المطاعم +" + s.growthRestSince2013 + "% · البيت +" + s.growthFoodSince2013 + "%");
    if (step >= 2) { const ct = parseT(s.crossover); g.append("circle").attr("cx", x(ct)).attr("cy", y(100)).attr("r", 5.5).attr("fill", C.orange); g.append("text").attr("x", x(ct)).attr("y", y(100) + 24).attr("text-anchor", "middle").attr("fill", T.orange).attr("font-size", FS.small).attr("font-weight", 700).text("أول عبور 2018"); }
    if (step >= 3) { const e = s.cpi[s.cpi.length - 1]; g.append("text").attr("x", x(2026.5) + 2).attr("y", y(e.rest)).attr("text-anchor", "start").attr("fill", C.purple).attr("font-size", FS.small).text(e.rest); }
  }

  /* ---- scene 5: Ramadan week-role strip (grouped by year, Eid highlighted) ---- */
  function scene5(svg, data, step, reduced) {
    const s = data.scene5; if (reduced) step = 2;
    const g = frame(svg);
    const roles = s.roleOrder;
    const years = Array.from(new Set(s.weeks.map((w) => w.year))).sort();
    const y = yLin([0, 150]);
    yAxis(g, y, [0, 50, 100, 150]);
    g.append("line").attr("x1", M.l).attr("x2", W - M.r).attr("y1", y(100)).attr("y2", y(100))
      .attr("stroke", C.orange).attr("stroke-width", 1.5).attr("stroke-dasharray", "4 4");
    g.append("text").attr("x", W - M.r).attr("y", y(100) - 7).attr("text-anchor", "end").attr("fill", T.orange).attr("font-size", 12).text("تعادل");
    const gw = (W - M.l - M.r) / years.length;
    const bw = Math.min(12, (gw - 10) / roles.length);
    years.forEach((yr, gi) => {
      const gx = (W - M.r) - (gi + 1) * gw + 5;             // RTL: earliest year on the right
      const yw = s.weeks.filter((w) => w.year === yr);
      roles.forEach((role, ri) => {
        const wk = yw.find((w) => w.role === role); if (!wk || wk.ratio == null) return;
        const isEid = role === "eid_week";
        const show = step >= 1 || (role !== "late_ramadan" && role !== "eid_week");
        if (!show) return;
        const bx = gx + ri * bw;
        g.append("rect").attr("x", bx).attr("y", y(wk.ratio)).attr("width", bw - 1)
          .attr("height", (H - M.b) - y(wk.ratio))
          .attr("fill", isEid ? C.orange : (wk.ratio >= 100 ? C.purple : C.grey))
          .attr("opacity", isEid ? 1 : 0.72);
      });
      g.append("text").attr("x", gx + (roles.length * bw) / 2).attr("y", H - M.b + 20)
        .attr("text-anchor", "middle").attr("fill", T.grey).attr("font-size", 13).attr("font-weight", 600).text(yr);
    });
    if (step >= 1 && s.eid2025Ratio) g.append("text").attr("x", W / 2).attr("y", M.t - 2).attr("text-anchor", "middle")
      .attr("fill", T.orange).attr("font-weight", 800).attr("font-size", 16).text("عيد 2025: " + Math.round(s.eid2025Ratio) + " لكل 100");
  }

  /* ---- scene 6: field price grid (chain × item); stacked cards on narrow ---- */
  function scene6(svg, data, step, reduced) {
    const s = data.scene6;
    const g = frame(svg);
    const items = s.items, chains = s.grid;
    const labelW = 74, gx0 = M.l, gyH = M.t + 44;
    const gridRight = W - M.r - labelW, cw = (gridRight - gx0) / items.length;
    const gy = gyH, rh = (H - M.b - 24 - gy) / chains.length;
    const colX = (i) => gridRight - (i + 0.5) * cw;
    items.forEach((it, i) => g.append("text").attr("x", colX(i)).attr("y", gy - 9)
      .attr("text-anchor", "middle").attr("fill", T.grey).attr("font-size", 14).text(it));
    g.append("text").attr("x", W - M.r).attr("y", M.t + 6).attr("text-anchor", "end")
      .attr("fill", T.orange).attr("font-weight", 700).attr("font-size", FS.small).text("الفاتورة المتوسطة ≈ " + s.avgBill + " ريالًا");
    chains.forEach((ch, r) => {
      const cy = gy + r * rh;
      g.append("text").attr("x", W - M.r).attr("y", cy + rh / 2 + 4).attr("text-anchor", "end")
        .attr("fill", T.ink).attr("font-size", FS.small).attr("font-weight", 700)
        .text(ch.chain + (ch.deliveryOnly ? " ⚡" : ""));
      items.forEach((it, i) => {
        const val = ch.items[it];
        const estimated = ch.city !== "الرياض" && val != null;   // non-Riyadh = مقدَّرة
        g.append("rect").attr("x", colX(i) - cw / 2 + 2).attr("y", cy + 2).attr("width", cw - 4).attr("height", rh - 4)
          .attr("rx", 5).attr("fill", val == null ? "#faf7ff" : "#fff")
          .attr("stroke", estimated ? "#d9c7f0" : "#e6dff2").attr("stroke-dasharray", estimated ? "3 2" : null);
        g.append("text").attr("x", colX(i)).attr("y", cy + rh / 2 + 5).attr("text-anchor", "middle")
          .attr("fill", val == null ? "#c9b8e6" : C.purple).attr("font-size", FS.small).attr("font-weight", val == null ? 400 : 700)
          .text(val == null ? "·" : val);
      });
    });
    g.append("text").attr("x", gx0).attr("y", M.t + 6).attr("text-anchor", "start")
      .attr("fill", T.grey).attr("font-size", 11).text("⚡ توصيل فقط · الخط المتقطّع = مقدَّرة");
    g.append("text").attr("x", W / 2).attr("y", H - 6).attr("text-anchor", "middle")
      .attr("fill", "#9a8fb5").attr("font-size", 12).text("لا سعر مقهى على الويب المفتوح: " + s.appOnly.join(" · "));
  }

  /* ---- scene 7: personal counter (revealed at step 0 = closing) ---- */
  function scene7(svg, data, step, reduced) {
    const s = data.scene7;
    const g = frame(svg);
    const millions = (n) => (n / 1e6).toLocaleString("en", { maximumFractionDigits: 1 });
    g.append("text").attr("x", W / 2).attr("y", H * 0.42).attr("text-anchor", "middle")
      .attr("fill", C.purple).attr("font-size", 96).attr("font-weight", 800).text(s.perAdultMonth);
    g.append("text").attr("x", W / 2).attr("y", H * 0.42 + 36).attr("text-anchor", "middle")
      .attr("fill", T.grey).attr("font-size", 16).text("عملية مطعم شهريًا لكل مقيم بعمر 15 سنة فأكثر");
    g.append("text").attr("x", W / 2).attr("y", H * 0.42 + 62).attr("text-anchor", "middle")
      .attr("fill", "#9a93a8").attr("font-size", 13)
      .text("≈ " + millions(s.numeratorThousand * 1000) + " مليون عملية ÷ " + millions(s.population15plus) + " مليون مقيم (15+)");
  }

  window.SCENES = { 1: scene1, 2: scene2, 3: scene3, 4: scene4, 5: scene5, 6: scene6, 7: scene7 };
})();
