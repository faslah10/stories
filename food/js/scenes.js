/* Big-Piece-001 — D3 scene renderers. Each SCENES[n](svg, data, step, reduced) fully
   redraws that scene to the state for `step`. Time axes run RIGHT→LEFT (RTL), like our
   published charts. Numbers come only from `data` (data.json) — nothing hardcoded here. */
(function () {
  "use strict";
  const C = { purple: "#5E35B1", orange: "#E58606", grey: "#B0B0B0" };
  const W = 620, H = 380, M = { t: 26, r: 42, b: 40, l: 46 };
  const parseT = (s) => { const [y, m] = String(s).split("-"); return m ? +y + (+m - 1) / 12 : +y; };

  function frame(svg) { svg.selectAll("*").remove(); return svg.append("g"); }
  function xTime(dom) { return d3.scaleLinear().domain(dom).range([W - M.r, M.l]); } // earliest→right
  function yLin(dom) { return d3.scaleLinear().domain(dom).range([H - M.b, M.t]); }

  function yAxis(g, y, ticks) {
    const ax = g.append("g").attr("class", "axis");
    ticks.forEach((t) => {
      ax.append("line").attr("class", "gridline").attr("x1", M.l).attr("x2", W - M.r)
        .attr("y1", y(t)).attr("y2", y(t));
      ax.append("text").attr("x", W - M.r + 6).attr("y", y(t) + 4).attr("text-anchor", "start").text(t);
    });
  }
  function xTicks(g, x, vals, fmt) {
    const ax = g.append("g").attr("class", "axis");
    vals.forEach((v) => ax.append("text").attr("x", x(v)).attr("y", H - M.b + 18)
      .attr("text-anchor", "middle").text(fmt ? fmt(v) : v));
  }

  /* ---- scene 1: step ladder, two segments never spliced ---- */
  function scene1(svg, data, step, reduced) {
    const s = data.scene1; if (reduced) step = 4;
    const g = frame(svg);
    const x = xTime([2016, 2026.6]), y = yLin([0, 130]);
    yAxis(g, y, [0, 40, 80, 120]);
    xTicks(g, x, [2016, 2019, 2022, 2024, 2026]);
    // decade grey step line
    const dec = s.decade.filter((d) => step >= 1 || d.year <= 2019);
    const stepLine = d3.line().x((d) => x(d.year)).y((d) => y(d.ticket)).curve(d3.curveStepAfter);
    g.append("path").datum(dec).attr("fill", "none").attr("stroke", C.grey)
      .attr("stroke-width", 2.5).attr("stroke-dasharray", "5 4").attr("d", stepLine);
    g.selectAll("circle.d").data(dec).join("circle").attr("class", "d")
      .attr("cx", (d) => x(d.year)).attr("cy", (d) => y(d.ticket)).attr("r", 3).attr("fill", C.grey);
    // 2016 & latest labels
    g.append("text").attr("class", "label").attr("x", x(2016)).attr("y", y(s.decade[0].ticket) - 8)
      .attr("text-anchor", "middle").attr("fill", C.grey).attr("font-weight", 700).text(s.decade[0].ticket);
    // break marker
    if (step >= 2) {
      const bx = x(2024);
      g.append("line").attr("x1", bx).attr("x2", bx).attr("y1", M.t).attr("y2", H - M.b)
        .attr("stroke", C.orange).attr("stroke-width", 2).attr("stroke-dasharray", "3 3");
      g.append("text").attr("class", "label").attr("x", bx).attr("y", M.t - 8)
        .attr("text-anchor", "middle").attr("fill", C.orange).attr("font-size", 11).attr("font-weight", 700)
        .text(s.breakLabel);
    }
    // monthly purple segment
    if (step >= 3) {
      const mon = s.monthly.map((d) => ({ t: parseT(d.month), v: d.ticket }));
      const ml = d3.line().x((d) => x(d.t)).y((d) => y(d.v));
      g.append("path").datum(mon).attr("fill", "none").attr("stroke", C.purple)
        .attr("stroke-width", 3).attr("d", ml);
      const last = mon[mon.length - 1];
      g.append("circle").attr("cx", x(last.t)).attr("cy", y(last.v)).attr("r", 4).attr("fill", C.purple);
      g.append("text").attr("class", "label num").attr("x", x(last.t) - 4).attr("y", y(last.v) - 8)
        .attr("text-anchor", "end").attr("fill", C.purple).attr("font-weight", 800).text(s.monthlyLatest);
    }
    if (step >= 4) {
      g.append("text").attr("class", "label").attr("x", (W) / 2).attr("y", H - 4)
        .attr("text-anchor", "middle").attr("fill", C.purple).attr("font-size", 12)
        .text("الغذاء = " + s.hiesFoodShare + "% من إنفاق الأسرة");
    }
  }

  /* ---- scene 2: two racing counters (bars) ---- */
  function scene2(svg, data, step, reduced) {
    const s = data.scene2; if (reduced) step = 2;
    const g = frame(svg);
    const y = d3.scaleLinear().domain([0, Math.max(s.countMult, 10)]).range([H - M.b, M.t]);
    const cx1 = W * 0.66, cx2 = W * 0.34, bw = 96;
    const bar = (cx, mult, show, color, title) => {
      const h = show ? (H - M.b) - y(mult) : 0;
      g.append("rect").attr("x", cx - bw / 2).attr("y", (H - M.b) - h).attr("width", bw).attr("height", h)
        .attr("rx", 8).attr("fill", color);
      g.append("text").attr("x", cx).attr("y", show ? (H - M.b) - h - 10 : H - M.b - 10)
        .attr("text-anchor", "middle").attr("fill", color).attr("font-weight", 800).attr("font-size", 26)
        .attr("class", "num").text(show ? "×" + mult : "");
      g.append("text").attr("x", cx).attr("y", H - M.b + 20).attr("text-anchor", "middle")
        .attr("fill", "#6b6577").attr("font-size", 13).text(title);
    };
    g.append("line").attr("x1", M.l).attr("x2", W - M.r).attr("y1", H - M.b).attr("y2", H - M.b).attr("stroke", "#d9d2e6");
    bar(cx1, s.valueMult, step >= 0, C.purple, "قيمة الإنفاق");
    bar(cx2, s.countMult, step >= 1, C.orange, "عدد العمليات");
    if (step >= 2) { // gap bracket
      g.append("text").attr("x", W / 2).attr("y", M.t + 6).attr("text-anchor", "middle")
        .attr("fill", "#6b6577").attr("font-size", 12).text("العمليات تسبق القيمة بفارق كبير");
    }
  }

  /* ---- scene 3: ratio odometer + 100 line ---- */
  function scene3(svg, data, step, reduced) {
    const s = data.scene3; if (reduced) step = 3;
    const g = frame(svg);
    const x = xTime([2016, 2023]), y = yLin([0, 110]);
    yAxis(g, y, [0, 50, 100]);
    xTicks(g, x, [2016, 2019, 2022]);
    // parity line
    g.append("line").attr("class", "parity").attr("x1", M.l).attr("x2", W - M.r).attr("y1", y(100)).attr("y2", y(100));
    g.append("text").attr("x", M.l).attr("y", y(100) - 6).attr("fill", C.orange).attr("font-size", 11).text("خط التعادل (100)");
    const upto = step === 0 ? 2016 : step === 1 ? 2022 : 2023;
    const pts = s.annual.filter((d) => d.year <= upto);
    const area = d3.area().x((d) => x(d.year)).y0(y(0)).y1((d) => y(d.ratio));
    const line = d3.line().x((d) => x(d.year)).y((d) => y(d.ratio));
    g.append("path").datum(pts).attr("fill", C.purple).attr("opacity", 0.12).attr("d", area);
    g.append("path").datum(pts).attr("fill", "none").attr("stroke", C.purple).attr("stroke-width", 3).attr("d", line);
    const cur = pts[pts.length - 1];
    g.append("circle").attr("cx", x(cur.year)).attr("cy", y(cur.ratio)).attr("r", 4).attr("fill", C.purple);
    // odometer number
    g.append("text").attr("x", W / 2).attr("y", M.t + 40).attr("text-anchor", "middle")
      .attr("fill", C.purple).attr("font-size", 60).attr("font-weight", 800).attr("class", "num")
      .text(Math.round(cur.ratio));
    g.append("text").attr("x", W / 2).attr("y", M.t + 62).attr("text-anchor", "middle")
      .attr("fill", "#6b6577").attr("font-size", 13).text("ريال مطاعم لكل 100 بقالة (" + cur.year + ")");
    if (step >= 2) g.append("text").attr("x", W / 2).attr("y", M.t + 84).attr("text-anchor", "middle")
      .attr("fill", C.orange).attr("font-size", 12).attr("font-weight", 700).text("تجمّد عند 93، لم يعبر البوابة");
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
    // shaded gap
    const gap = d3.area().x((d) => x(d.t)).y0((d) => y(d.food)).y1((d) => y(d.rest));
    g.append("path").datum(pts).attr("fill", C.orange).attr("opacity", 0.14).attr("d", gap);
    const lf = d3.line().x((d) => x(d.t)).y((d) => y(d.food));
    const lr = d3.line().x((d) => x(d.t)).y((d) => y(d.rest));
    g.append("path").datum(pts).attr("fill", "none").attr("stroke", C.grey).attr("stroke-width", 2.5).attr("d", lf);
    g.append("path").datum(pts).attr("fill", "none").attr("stroke", C.purple).attr("stroke-width", 3).attr("d", lr);
    // legend
    g.append("text").attr("x", x(2013)).attr("y", y(s.cpi[0].food) - 8).attr("text-anchor", "middle").attr("fill", C.grey).attr("font-size", 11).text("أغذية البيت");
    g.append("text").attr("x", x(2013)).attr("y", y(s.cpi[0].rest) + 16).attr("text-anchor", "middle").attr("fill", C.purple).attr("font-size", 11).text("المطاعم");
    if (step >= 1) g.append("text").attr("x", x(2020)).attr("y", M.t + 6).attr("text-anchor", "middle").attr("fill", C.purple).attr("font-size", 12).attr("font-weight", 700).text("المطاعم +" + s.growthRestSince2013 + "% · البيت +" + s.growthFoodSince2013 + "%");
    if (step >= 2) { const cp = s.cpi.find((p) => p.month === s.crossover) || s.cpi[0]; const ct = parseT(s.crossover), cyv = y((cp.food + cp.rest) / 2); g.append("circle").attr("cx", x(ct)).attr("cy", cyv).attr("r", 5).attr("fill", C.orange); g.append("text").attr("x", x(ct)).attr("y", cyv - 12).attr("text-anchor", "middle").attr("fill", C.orange).attr("font-size", 11).attr("font-weight", 700).text("أول عبور 2018"); }
    if (step >= 3) { const e = s.cpi[s.cpi.length - 1]; g.append("text").attr("x", x(2026.5) + 2).attr("y", y(e.rest)).attr("text-anchor", "start").attr("fill", C.purple).attr("font-size", 11).attr("class", "num").text(e.rest); }
  }

  /* ---- scene 5: Ramadan week-role strip (grouped by year) ---- */
  function scene5(svg, data, step, reduced) {
    const s = data.scene5; if (reduced) step = 2;
    const g = frame(svg);
    const roles = s.roleOrder;
    const years = Array.from(new Set(s.weeks.map((w) => w.year))).sort();
    const y = yLin([0, 150]);
    yAxis(g, y, [0, 50, 100]);
    g.append("line").attr("class", "parity").attr("x1", M.l).attr("x2", W - M.r).attr("y1", y(100)).attr("y2", y(100));
    const gw = (W - M.l - M.r) / years.length;
    const bw = Math.min(11, (gw - 8) / roles.length);
    years.forEach((yr, gi) => {
      const gx = (W - M.r) - (gi + 1) * gw + 4; // RTL: earliest year on the right
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
          .attr("opacity", (step >= 2 && isEid) ? 1 : (isEid ? 0.9 : 0.75));
      });
      g.append("text").attr("x", gx + (roles.length * bw) / 2).attr("y", H - M.b + 16)
        .attr("text-anchor", "middle").attr("fill", "#6b6577").attr("font-size", 11).text(yr);
    });
    if (step >= 1 && s.eid2025Ratio) {
      g.append("text").attr("x", W / 2).attr("y", M.t + 4).attr("text-anchor", "middle")
        .attr("fill", C.orange).attr("font-weight", 800).attr("font-size", 15).attr("class", "num")
        .text("عيد 2025: " + Math.round(s.eid2025Ratio) + " لكل 100");
    }
    g.append("text").attr("x", W - M.r).attr("y", y(100) - 6).attr("text-anchor", "end").attr("fill", C.orange).attr("font-size", 10).text("تعادل");
  }

  /* ---- scene 6: field price grid (chain × item; UNVERIFIED table-only) ---- */
  function scene6(svg, data, step, reduced) {
    const s = data.scene6; if (reduced) step = 3;
    const g = frame(svg);
    const items = s.items, chains = s.grid;             // 6 items × 5 web chains
    const labelW = 66, gx0 = M.l, gyH = M.t + 46;
    const gridRight = W - M.r - labelW, cw = (gridRight - gx0) / items.length;
    const gy = gyH, rh = (H - M.b - 22 - gy) / chains.length;
    const colX = (i) => gridRight - (i + 0.5) * cw;      // RTL: first item on the right
    // item headers (rotated for fit)
    items.forEach((it, i) => g.append("text").attr("x", colX(i)).attr("y", gy - 8)
      .attr("text-anchor", "middle").attr("fill", "#6b6577").attr("font-size", 10.5).text(it));
    // avg-bill reference
    g.append("text").attr("x", W - M.r).attr("y", M.t + 10).attr("text-anchor", "end")
      .attr("fill", C.orange).attr("font-weight", 700).attr("font-size", 12).attr("class", "num")
      .text("الفاتورة المتوسطة ≈ " + s.avgBill + " ريالًا");
    const coffee = ["لاتيه", "شاي كرك", "كرواسون"];
    chains.forEach((ch, r) => {
      const cy = gy + r * rh;
      g.append("text").attr("x", W - M.r).attr("y", cy + rh / 2 + 4).attr("text-anchor", "end")
        .attr("fill", "#1a1523").attr("font-size", 12).attr("font-weight", 700)
        .text(ch.chain + (ch.deliveryOnly ? " ⚡" : ""));
      items.forEach((it, i) => {
        const val = ch.items[it];
        const hiCoffee = step >= 1 && coffee.includes(it) && (ch.chain === "دانكن" || ch.chain === "كيان") && val != null;
        g.append("rect").attr("x", colX(i) - cw / 2 + 2).attr("y", cy + 2).attr("width", cw - 4).attr("height", rh - 4)
          .attr("rx", 5).attr("fill", hiCoffee ? "#fff3e0" : "#fff")
          .attr("stroke", hiCoffee ? C.orange : "#e6dff2");
        g.append("text").attr("x", colX(i)).attr("y", cy + rh / 2 + 5).attr("text-anchor", "middle")
          .attr("fill", val == null ? "#c9b8e6" : C.purple).attr("font-size", 13).attr("font-weight", val == null ? 400 : 700)
          .attr("class", "num").text(val == null ? "·" : val);
      });
    });
    // delivery-only note + web-unavailable chains
    g.append("text").attr("x", gx0).attr("y", M.t + 10).attr("text-anchor", "start")
      .attr("fill", "#9a93a8").attr("font-size", 10).text("⚡ توصيل فقط");
    g.append("text").attr("x", W / 2).attr("y", H - 6).attr("text-anchor", "middle")
      .attr("fill", "#b0a8c0").attr("font-size", 11)
      .text("لا سعر مقهى على الويب المفتوح: " + s.appOnly.join(" · "));
  }

  /* ---- scene 7: closing personal counter ---- */
  function scene7(svg, data, step, reduced) {
    const s = data.scene7; if (reduced) step = 5;
    const g = frame(svg);
    const revealed = step >= 5;
    const millions = (n) => (n / 1e6).toLocaleString("en", { maximumFractionDigits: 1 });
    g.append("text").attr("x", W / 2).attr("y", H * 0.42).attr("text-anchor", "middle")
      .attr("fill", C.purple).attr("font-size", 92).attr("font-weight", 800).attr("class", "num")
      .attr("opacity", revealed ? 1 : 0.18).text(revealed ? s.perAdultMonth : "؟");
    g.append("text").attr("x", W / 2).attr("y", H * 0.42 + 34).attr("text-anchor", "middle")
      .attr("fill", "#6b6577").attr("font-size", 15).text("عملية مطعم شهريًا لكل بالغ");
    if (revealed) {
      g.append("text").attr("x", W / 2).attr("y", H * 0.42 + 66).attr("text-anchor", "middle")
        .attr("fill", "#9a93a8").attr("font-size", 12).attr("class", "num")
        .text("≈ " + millions(s.numeratorThousand * 1000) + " مليون عملية ÷ " + millions(s.population15plus) + " مليون بالغ");
    }
  }

  window.SCENES = { 1: scene1, 2: scene2, 3: scene3, 4: scene4, 5: scene5, 6: scene6, 7: scene7 };
})();
