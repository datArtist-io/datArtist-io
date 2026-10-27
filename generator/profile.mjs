// Josiah's GitHub profile: an identity card (a dot-matrix Earth carrying network traffic + a glass info panel),
// a contribution map, and glass buttons. Same design language as his work: Liquid Glass panels,
// pill chips, a sliding segmented switch, the pink→violet→cyan sheen, Unbounded + Hanken Grotesk.
import { fonts, text, width, svg, stars, twinkleCss, themes, sheen, brand, rng, write } from "./lib.mjs";
import { geoOrthographic, geoContains, geoInterpolate, geoDistance } from "d3-geo";
import { feature } from "topojson-client";
import fs from "node:fs";

const topo = JSON.parse(fs.readFileSync(new URL("./node_modules/world-atlas/land-110m.json", import.meta.url)));
const LAND = feature(topo, topo.objects.land);

const P = {
  dark: { ...themes.dark, panel: "rgba(255,255,255,0.045)", panelLine: "rgba(255,255,255,0.10)", key: "#ff7ab8", dot: "#c9cdf5", dim: "#3a3f6b", lead: "rgba(185,189,217,0.28)", pill: "rgba(255,255,255,0.06)", pillLine: "rgba(255,255,255,0.13)" },
  light: { ...themes.light, panel: "rgba(255,255,255,0.78)", panelLine: "rgba(16,19,43,0.09)", key: "#d6337f", dot: "#2b3270", dim: "#c9cde6", lead: "rgba(16,19,43,0.22)", pill: "rgba(255,255,255,0.9)", pillLine: "rgba(16,19,43,0.12)" },
};

// ---------- a dot-matrix Earth carrying network traffic ----------
function dotEarth(t, { cx, cy, r, step = 6.4 }) {
  const rot = [-14, -12, 0];
  const proj = geoOrthographic().scale(r).translate([cx, cy]).rotate(rot).clipAngle(90);
  const rand = rng(23);
  const groups = Array.from({ length: 36 }, () => []);
  const accent = [];
  let ocean = "";
  for (let y = cy - r; y <= cy + r; y += step) {
    for (let x = cx - r; x <= cx + r; x += step) {
      const dx = x - cx, dy = y - cy;
      if (dx * dx + dy * dy > (r - 2) * (r - 2)) continue;
      const ll = proj.invert([x, y]);
      if (ll && geoContains(LAND, ll)) (rand() < 0.06 ? accent : groups[Math.floor(rand() * groups.length)]).push(`M${x.toFixed(1)} ${y.toFixed(1)}h0`);
      else if (rand() < 0.42) ocean += `M${x.toFixed(1)} ${y.toFixed(1)}h0`;
    }
  }
  const g = (d, cls) => {
    const a = rand() * Math.PI * 2, dist = 30 + rand() * 70;
    return `<path class="${cls}" style="--dx:${(Math.cos(a) * dist).toFixed(0)}px;--dy:${(Math.sin(a) * dist).toFixed(0)}px;animation-delay:${(rand() * 0.9).toFixed(2)}s" d="${d}"/>`;
  };
  // network links between regions, packets travelling along them
  const nodes = [[-0.1, 51.5], [2.3, 48.9], [13.4, 52.5], [-9.1, 38.7], [3.4, 6.5], [36.8, -1.3], [31.2, 30.0], [55.3, 25.2], [18.4, -33.9], [-74, 40.7], [77.2, 28.6], [-46.6, -23.5]];
  const center = [-rot[0], -rot[1]];
  const vis = nodes.filter((n) => geoDistance(n, center) < Math.PI / 2 - 0.12);
  const pairs = [[0, 4], [4, 7], [2, 6], [3, 9], [5, 8], [1, 5], [6, 10], [4, 11], [0, 7], [8, 4]];
  let links = "";
  pairs.forEach(([a, b], i) => {
    const A = nodes[a], B = nodes[b];
    if (!vis.includes(A) || !vis.includes(B)) return;
    const ip = geoInterpolate(A, B);
    const pts = [];
    for (let k = 0; k <= 40; k++) {
      const p = proj(ip(k / 40));
      const h = 1 + 0.16 * Math.sin((Math.PI * k) / 40);
      pts.push(`${(cx + (p[0] - cx) * h).toFixed(1)} ${(cy + (p[1] - cy) * h).toFixed(1)}`);
    }
    const d = "M" + pts.join(" L");
    const dur = (3.2 + (i % 4) * 0.7).toFixed(1), begin = (i * 0.45).toFixed(2);
    links += `<path d="${d}" stroke="url(#rim)" stroke-width="1.1" opacity=".38"/>
      <circle r="2.6" fill="${i % 2 ? brand.cyan : brand.pink}" style="filter:drop-shadow(0 0 4px ${i % 2 ? brand.cyan : brand.pink})"><animateMotion dur="${dur}s" begin="${begin}s" repeatCount="indefinite" path="${d}"/></circle>`;
  });
  const hubs = vis.map((n, i) => { const p = proj(n); return `<g transform="translate(${p[0].toFixed(1)} ${p[1].toFixed(1)})"><circle r="2.8" fill="${t.ink}"/><circle r="2.8" fill="none" stroke="${brand.violet}" stroke-width="1.2"><animate attributeName="r" values="2.8;13" dur="2.8s" begin="${(i * 0.37).toFixed(2)}s" repeatCount="indefinite"/><animate attributeName="opacity" values=".9;0" dur="2.8s" begin="${(i * 0.37).toFixed(2)}s" repeatCount="indefinite"/></circle></g>`; }).join("");
  return `
    <circle cx="${cx}" cy="${cy}" r="${r + 26}" fill="url(#halo)"/>
    <path d="${ocean}" stroke="${t.dim}" stroke-width="1.6" stroke-linecap="round" opacity=".7"/>
    ${groups.map((d) => (d.length ? g(d.join(""), "p") : "")).join("")}
    ${g(accent.join(""), "p acc")}
    <circle cx="${cx}" cy="${cy}" r="${r}" stroke="url(#rim)" stroke-width="1.2" opacity=".8"/>
    <g class="l" style="animation-delay:1.3s">${links}${hubs}</g>
    <ellipse cx="${cx}" cy="${cy}" rx="${r + 40}" ry="${(r + 40) * 0.24}" stroke="${t.panelLine}" transform="rotate(-16 ${cx} ${cy})"/>
    <circle r="3" fill="${brand.cyan}"><animateMotion dur="16s" repeatCount="indefinite" path="M${cx - r - 40} ${cy} a${r + 40} ${(r + 40) * 0.24} 0 1 0 ${2 * (r + 40)} 0 a${r + 40} ${(r + 40) * 0.24} 0 1 0 ${-2 * (r + 40)} 0"/></circle>`;
}

// ---------- a dot-matrix </> that assembles itself ----------
function flatten(path) {
  const polys = []; let cur = [], x = 0, y = 0;
  for (const c of path.commands) {
    if (c.type === "M") { if (cur.length) polys.push(cur); cur = [[c.x, c.y]]; x = c.x; y = c.y; }
    else if (c.type === "L") { cur.push([c.x, c.y]); x = c.x; y = c.y; }
    else if (c.type === "Q") { for (let k = 1; k <= 8; k++) { const t = k / 8, a = (1 - t) * (1 - t), b = 2 * (1 - t) * t, d = t * t; cur.push([a * x + b * c.x1 + d * c.x, a * y + b * c.y1 + d * c.y]); } x = c.x; y = c.y; }
    else if (c.type === "C") { for (let k = 1; k <= 10; k++) { const t = k / 10, u = 1 - t; cur.push([u*u*u*x + 3*u*u*t*c.x1 + 3*u*t*t*c.x2 + t*t*t*c.x, u*u*u*y + 3*u*u*t*c.y1 + 3*u*t*t*c.y2 + t*t*t*c.y]); } x = c.x; y = c.y; }
    else if (c.type === "Z") { if (cur.length) polys.push(cur); cur = []; }
  }
  if (cur.length) polys.push(cur);
  return polys;
}
function inside(polys, px, py) {
  let n = 0;
  for (const p of polys) for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
    const [xi, yi] = p[i], [xj, yj] = p[j];
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) n++;
  }
  return n % 2 === 1;
}
function glyphDots(t, { cx, cy, w, step = 5.4 }) {
  // </> drawn as three thick strokes, filled with dots
  const k = w / 330;
  const segs = [
    [[cx - 92 * k, cy - 74 * k], [cx - 165 * k, cy]], [[cx - 165 * k, cy], [cx - 92 * k, cy + 74 * k]],
    [[cx + 34 * k, cy - 100 * k], [cx - 34 * k, cy + 100 * k]],
    [[cx + 92 * k, cy - 74 * k], [cx + 165 * k, cy]], [[cx + 165 * k, cy], [cx + 92 * k, cy + 74 * k]],
  ];
  const half = 15 * k;
  const near = (x, y) => segs.some(([[ax, ay], [bx, by]]) => {
    const vx = bx - ax, vy = by - ay, t_ = Math.max(0, Math.min(1, ((x - ax) * vx + (y - ay) * vy) / (vx * vx + vy * vy)));
    const dx = x - (ax + t_ * vx), dy = y - (ay + t_ * vy);
    return dx * dx + dy * dy <= half * half;
  });
  const rand = rng(31);
  const groups = Array.from({ length: 36 }, () => []);
  const accent = [];
  let field = "";
  const x0 = cx - 200, x1 = cx + 200, y0 = cy - 250, y1 = cy + 250;
  for (let y = y0; y <= y1; y += step) for (let x = x0; x <= x1; x += step) {
    if (near(x, y)) (rand() < 0.08 ? accent : groups[Math.floor(rand() * groups.length)]).push(`M${x.toFixed(1)} ${y.toFixed(1)}h0`);
    else if (rand() < 0.12) field += `M${x.toFixed(1)} ${y.toFixed(1)}h0`;
  }
  const g = (d, cls) => {
    const a = rand() * Math.PI * 2, dist = 40 + rand() * 90;
    return `<path class="${cls}" style="--dx:${(Math.cos(a) * dist).toFixed(0)}px;--dy:${(Math.sin(a) * dist).toFixed(0)}px;animation-delay:${(rand() * 0.9).toFixed(2)}s" d="${d}"/>`;
  };
  // a slow scan line, like a build log passing over the mark
  return `<circle cx="${cx}" cy="${cy}" r="230" fill="url(#glow)"/>
    <path d="${field}" stroke="${t.dim}" stroke-width="1.6" stroke-linecap="round" opacity=".55"/>
    ${groups.map((d) => (d.length ? g(d.join(""), "p") : "")).join("")}
    ${g(accent.join(""), "p acc")}
    <rect x="${x0}" y="${y0}" width="${x1 - x0}" height="2" fill="url(#rim)" opacity=".5" class="scanv"/>`;
}

// ---------- info panel rows ----------
function row(t, y, key, val, x0, x1, delay, { valFill } = {}) {
  const kw = width(key, fonts.monoMed, 14);
  const vw = width(val, fonts.mono, 14);
  return `<g class="l" style="animation-delay:${delay}s">
    ${text(key, { font: fonts.monoMed, size: 14, x: x0, y, fill: t.key })}
    <line x1="${x0 + kw + 10}" y1="${y - 4}" x2="${x1 - vw - 10}" y2="${y - 4}" stroke="${t.lead}" stroke-width="1.4" stroke-dasharray="1.4 5" stroke-linecap="round"/>
    ${text(val, { font: fonts.mono, size: 14, x: x1, y, anchor: "end", fill: valFill ?? t.ink })}</g>`;
}
function rule(t, y, label, x0, x1, delay) {
  const w = width(label, fonts.monoMed, 13.5, 0.04);
  return `<g class="l" style="animation-delay:${delay}s">${text("—", { font: fonts.mono, size: 13.5, x: x0, y, fill: t.faint })}${text(label, { font: fonts.monoMed, size: 13.5, x: x0 + 18, y, fill: t.ink, track: 0.04 })}
    <line x1="${x0 + 30 + w}" y1="${y - 4.5}" x2="${x1}" y2="${y - 4.5}" stroke="${t.lead}" stroke-width="1"/></g>`;
}
function pills(t, x, y, items, delay, max) {
  let cx = x, cy = y, out = "";
  for (const it of items) {
    const w = width(it, fonts.bodyMed, 13) + 22;
    if (cx + w > max) { cx = x; cy += 30; }
    out += `<rect x="${cx}" y="${cy}" width="${w}" height="24" rx="12" fill="${t.pill}" stroke="${t.pillLine}"/>${text(it, { font: fonts.bodyMed, size: 13, x: cx + 11, y: cy + 16.5, fill: t.ink })}`;
    cx += w + 7;
  }
  return { svg: `<g class="l" style="animation-delay:${delay}s">${out}</g>`, bottom: cy + 24 };
}

// ---------- the sliding segmented switch (Build · Ship · Learn) ----------
function modeSwitch(t, x, y, w) {
  const seg = ["Build", "Ship", "Learn"];
  const sw = (w - 8) / 3;
  const captions = [
    "Agents, APIs and real-time systems, end to end",
    "Typed, tested, documented, deployed on Vercel",
    "Deep in AI engineering: agents, voice, retrieval",
  ];
  const cycle = 10.5;
  return `<g class="l" style="animation-delay:.95s">
    <rect x="${x}" y="${y}" width="${w}" height="40" rx="20" fill="${t.pill}" stroke="${t.pillLine}"/>
    <rect x="${x + 4}" y="${y + 4}" width="${sw}" height="32" rx="16" fill="url(#thumb)" class="thumb"/>
    ${seg.map((s, i) => text(s, { font: fonts.bodySemi, size: 14.5, x: x + 4 + sw * i + sw / 2, y: y + 25.5, anchor: "middle", fill: t.ink })).join("")}
    ${captions.map((c, i) => `<g class="cap c${i}">${text(c, { font: fonts.body, size: 15, x, y: y + 66, fill: t.soft })}</g>`).join("")}
  </g>`;
}

// ---------- typing prompt ----------
function prompt(t, x, y) {
  const lines = ["git commit -m \"make it beautiful\"", "npm run ship", "open to collaborations"];
  const p = "josiah@datartist:~$ ";
  const pw = width(p, fonts.monoMed, 14);
  const n = lines.length, cycle = 4 * n;
  let out = text("josiah@datartist", { font: fonts.monoMed, size: 14, x, y, fill: "url(#psh)" }) + text(":~$", { font: fonts.monoMed, size: 14, x: x + width("josiah@datartist", fonts.monoMed, 14), y, fill: t.soft });
  lines.forEach((l, i) => {
    const lw = width(l, fonts.mono, 14);
    const a = i / n, b = (i + 1) / n;
    const chars = l.length;
    out += `<clipPath id="tc${i}"><rect x="${x + pw}" y="${y - 16}" height="22" width="0">
      <animate attributeName="width" dur="${cycle}s" repeatCount="indefinite" calcMode="discrete"
        values="${Array.from({ length: chars + 1 }, (_, k) => (lw * k / chars).toFixed(1)).join(";")};${lw.toFixed(1)};0"
        keyTimes="0;${Array.from({ length: chars }, (_, k) => (a + (b - a) * 0.45 * ((k + 1) / chars)).toFixed(4)).join(";")};${(a + (b - a) * 0.95).toFixed(4)};${b.toFixed(4)}"/>
      </rect></clipPath>
      <g clip-path="url(#tc${i})" opacity="0"><animate attributeName="opacity" dur="${cycle}s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;${a.toFixed(4)};${b.toFixed(4)}"/>${text(l, { font: fonts.mono, size: 14, x: x + pw, y, fill: t.ink })}</g>`;
  });
  const cx = [], ck = [];
  lines.forEach((l, i) => {
    const lw = width(l, fonts.mono, 14), a = i / n, b = (i + 1) / n, chars = l.length;
    cx.push(0); ck.push(a);
    for (let k = 1; k <= chars; k++) { cx.push((lw * k) / chars); ck.push(a + (b - a) * 0.45 * (k / chars)); }
  });
  out += `<rect x="${x + pw + 2}" y="${y - 13}" width="8" height="16" rx="1" fill="${brand.pink}" class="caret"><animate attributeName="x" dur="${cycle}s" repeatCount="indefinite" calcMode="discrete" values="${cx.map((v) => (x + pw + 2 + v).toFixed(1)).join(";")}" keyTimes="${ck.map((v) => v.toFixed(4)).join(";")}"/></rect>`;
  return `<g class="l" style="animation-delay:2.2s">${out}</g>`;
}

export function card(k, stats = { repos: 5, contributions: 107, languages: 4, followers: 9 }) {
  const t = P[k];
  const W = 1012, H = 892;
  const L = { x: 20, y: 52, w: 420, h: 560 };
  const x0 = 474, x1 = 990;
  let y = 46;
  let right = `<g class="l" style="animation-delay:.25s">${text("josiah@datartist", { font: fonts.monoMed, size: 15, x: x0, y, fill: "url(#psh)" })}<line x1="${x0 + width("josiah@datartist", fonts.monoMed, 15) + 12}" y1="${y - 5}" x2="${x1}" y2="${y - 5}" stroke="${t.lead}" stroke-width="1"/></g>`;
  const rows = [
    ["Name", "Josiah Oluwadare"],
    ["Role", "Software engineer · AI & full-stack"],
    ["Focus", "Agents that do real work"],
    ["Languages", "TypeScript · Python · JavaScript"],
    ["Status", "Shipping backline"],
  ];
  rows.forEach(([a, b], i) => (right += row(t, (y += 24), a, b, x0, x1, (0.32 + i * 0.06).toFixed(2))));
  y += 22;
  right += modeSwitch(t, x0, y, x1 - x0);
  y += 112;
  right += rule(t, y, "Stack", x0, x1, 1.05);
  const groups = [
    ["Frontend", ["Next.js", "React", "TypeScript", "Three.js", "WebGL"]],
    ["Backend", ["Python", "Node.js", "Next.js API", "Discord API"]],
    ["AI", ["Claude API", "Vapi", "Qloo", "Agents", "Voice"]],
    ["Data", ["Supabase", "PostgreSQL", "Row-level security"]],
    ["Ship", ["Vercel", "GitHub Actions", "Vitest", "Zod"]],
  ];
  y += 12;
  groups.forEach(([g, items], i) => {
    const d = (1.11 + i * 0.06).toFixed(2);
    right += `<g class="l" style="animation-delay:${d}s">${text(g, { font: fonts.monoMed, size: 14, x: x0, y: y + 17, fill: t.key })}</g>`;
    const p = pills(t, x0 + 112, y, items, d, x1);
    right += p.svg;
    y = p.bottom + 8;
  });
  y += 22;
  right += rule(t, y, "Builds", x0, x1, 1.45);
  const builds = [
    ["backline", "taste-led travel agent"],
    ["VocaLink", "voice translation, live"],
    ["VocaLink-discord-bot", "translation in Discord voice"],
    ["Whatsapp-Receipt-Bot", "receipts over WhatsApp"],
  ];
  builds.forEach(([a, b], i) => (right += row(t, (y += 24), a, b, x0, x1, (1.5 + i * 0.06).toFixed(2))));
  y += 36;
  right += rule(t, y, "Engineering", x0, x1, 1.8);
  [["Types", "TypeScript strict · Zod at every boundary"], ["Tests", "Vitest · synthetic fixtures"], ["Security", "RLS · sealed approvals · fail-closed"]].forEach(([a, b], i) => (right += row(t, (y += 24), a, b, x0, x1, (1.85 + i * 0.06).toFixed(2))));
  y += 36;
  right += rule(t, y, "Contact", x0, x1, 2.0);
  [["X", "@datartist_io"], ["Links", "linktr.ee/datArtist"]].forEach(([a, b], i) => (right += row(t, (y += 24), a, b, x0, x1, (2.05 + i * 0.06).toFixed(2))));
  y += 42;
  right += prompt(t, x0, y);

  // stats tiles under the globe (real numbers from the GitHub profile)
  const tiles = [[String(stats.repos), "repositories"], [stats.contributions.toLocaleString("en"), "contributions"], [String(stats.languages), "languages"], [String(stats.followers), "followers"]];
  const tw = (L.w - 3 * 10) / 4;
  const tilesSvg = tiles
    .map(([n, l], i) => {
      const tx = L.x + i * (tw + 10);
      return `<g class="l" style="animation-delay:${(1.2 + i * 0.1).toFixed(2)}s"><rect x="${tx}" y="${L.y + L.h + 16}" width="${tw}" height="70" rx="16" fill="${t.panel}" stroke="${t.panelLine}"/>
        ${text(n, { font: fonts.display, size: 24, x: tx + tw / 2, y: L.y + L.h + 52, anchor: "middle", fill: "url(#psh)" })}
        ${text(l, { font: fonts.body, size: 12, x: tx + tw / 2, y: L.y + L.h + 72, anchor: "middle", fill: t.soft })}</g>`;
    })
    .join("");

  // the sliding thumb and captions run on one 10.5 s cycle
  const css = `${twinkleCss}
  .p{fill:none;stroke:${t.dot};stroke-width:2.6;stroke-linecap:round;animation:cyc 12s cubic-bezier(.45,0,.2,1) infinite both}
  .acc{stroke:${brand.pink};stroke-width:2.6}
  @keyframes cyc{0%{opacity:0;transform:translate(var(--dx),var(--dy))}12%{opacity:1;transform:none}82%{opacity:1;transform:none}100%{opacity:0;transform:translate(calc(var(--dx)*-1),calc(var(--dy)*-1))}}
  .l{opacity:0;animation:in .5s ease-out forwards}@keyframes in{to{opacity:1}}
  .caret{animation:blink 1.05s steps(1) infinite}@keyframes blink{50%{opacity:0}}
  .thumb{animation:slide 10.5s cubic-bezier(.6,-0.2,.25,1.25) infinite}
  @keyframes slide{0%,28%{transform:translateX(0)}33.3%,61%{transform:translateX(${((x1 - x0 - 8) / 3).toFixed(1)}px)}66.6%,94%{transform:translateX(${((2 * (x1 - x0 - 8)) / 3).toFixed(1)}px)}100%{transform:translateX(0)}}
  .cap{opacity:0;animation:cap 10.5s ease-in-out infinite}.c1{animation-delay:3.5s}.c2{animation-delay:7s}
  @keyframes cap{0%{opacity:0;transform:translateY(5px)}4%,27%{opacity:1;transform:none}32%,100%{opacity:0}}
  .scanv{animation:scanv 6s ease-in-out infinite}@keyframes scanv{0%{transform:translateY(0);opacity:0}10%{opacity:.6}90%{opacity:.6}100%{transform:translateY(440px);opacity:0}}
  @media (prefers-reduced-motion: reduce){.p,.l,.cap.c0{opacity:1}}`;

  const body = `<defs>
    <radialGradient id="n1" cx="20%" cy="30%" r="55%"><stop offset="0" stop-color="${brand.violet}" stop-opacity="${k === "dark" ? 0.3 : 0.16}"/><stop offset="1" stop-color="${brand.violet}" stop-opacity="0"/></radialGradient>
    <radialGradient id="n2" cx="95%" cy="95%" r="50%"><stop offset="0" stop-color="${brand.pink}" stop-opacity="${k === "dark" ? 0.22 : 0.12}"/><stop offset="1" stop-color="${brand.pink}" stop-opacity="0"/></radialGradient>
    <radialGradient id="glow"><stop offset="0" stop-color="${brand.violet}" stop-opacity="${k === "dark" ? 0.22 : 0.12}"/><stop offset="1" stop-color="${brand.violet}" stop-opacity="0"/></radialGradient>
    <radialGradient id="halo"><stop offset=".72" stop-color="${brand.violet}" stop-opacity="0"/><stop offset=".86" stop-color="${brand.violet}" stop-opacity="${k === "dark" ? 0.28 : 0.18}"/><stop offset="1" stop-color="${brand.pink}" stop-opacity="0"/></radialGradient>
    <linearGradient id="rim" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${brand.cyan}"/><stop offset=".5" stop-color="${brand.violet}"/><stop offset="1" stop-color="${brand.pink}"/></linearGradient>
    <linearGradient id="corner" x1="0" x2="1"><stop offset="0" stop-color="${brand.pink}"/><stop offset="1" stop-color="${brand.violet}"/></linearGradient>
    <linearGradient id="thumb" x1="0" x2="1"><stop offset="0" stop-color="${brand.violet}" stop-opacity="${k === "dark" ? 0.75 : 0.28}"/><stop offset="1" stop-color="${brand.pink}" stop-opacity="${k === "dark" ? 0.75 : 0.28}"/></linearGradient>
    ${sheen("psh", 6, k === "light")}
  </defs>
  <rect width="${W}" height="${H}" rx="22" fill="${t.bg}"/><rect width="${W}" height="${H}" rx="22" fill="url(#n1)"/><rect width="${W}" height="${H}" rx="22" fill="url(#n2)"/>
  <g opacity="${k === "dark" ? 0.8 : 0.35}">${stars(90, W, H, 5, t.star)}</g>
  ${text("NETWORK.MAP", { font: fonts.monoMed, size: 11, x: L.x, y: 34, fill: t.faint, track: 0.22 })}
  <rect x="${L.x}" y="${L.y}" width="${L.w}" height="${L.h}" rx="18" fill="${t.panel}" stroke="${t.panelLine}"/>
  ${[[L.x, L.y, 1, 1], [L.x + L.w, L.y, -1, 1], [L.x, L.y + L.h, 1, -1], [L.x + L.w, L.y + L.h, -1, -1]].map(([cx, cy, sx, sy]) => `<path d="M${cx + 22 * sx} ${cy} H${cx + 8 * sx} Q${cx} ${cy} ${cx} ${cy + 8 * sy} V${cy + 22 * sy}" stroke="url(#corner)" stroke-width="2.2" stroke-linecap="round"/>`).join("")}
  ${dotEarth(t, { cx: L.x + L.w / 2, cy: L.y + L.h / 2 + 6, r: 176 })}
  ${text("ts · py · js · html", { font: fonts.mono, size: 11.5, x: L.x + 20, y: L.y + L.h - 18, fill: t.faint, track: 0.06 })}
  ${text("main", { font: fonts.mono, size: 11.5, x: L.x + L.w - 20, y: L.y + L.h - 18, anchor: "end", fill: t.faint, track: 0.06 })}
  ${tilesSvg}
  ${right}`;
  return svg(W, H, body, { title: "Josiah Oluwadare (datArtist): software engineer, AI and full-stack. Builds: backline, VocaLink, VocaLink-discord-bot, Whatsapp-Receipt-Bot.", css });
}

// ---------- contribution map (real calendar, last 12 months) ----------
export function contrib(k, days) {
  const t = P[k];
  const W = 1012, H = 236;
  const start = new Date(days[0][0] + "T00:00:00Z");
  const byDate = new Map(days.map((d) => [d[0], d]));
  const cell = 14.4, gap = 3.6, gx = 24, gy = 72;
  let cells = "", lit = "";
  const months = [];
  const total = days.reduce((a, d) => a + (d[2] || 0), 0);
  for (let w = 0; w < 53; w++) {
    for (let d = 0; d < 7; d++) {
      const dt = new Date(start.getTime() + (w * 7 + d) * 86400000);
      const key = dt.toISOString().slice(0, 10);
      const e = byDate.get(key);
      if (!e) continue;
      const x = gx + w * (cell + gap), y = gy + d * (cell + gap);
      if (d === 0 && dt.getUTCDate() <= 7) months.push([x, dt.toLocaleString("en", { month: "short", timeZone: "UTC" })]);
      if (!e[1]) cells += `M${(x + cell / 2).toFixed(1)} ${(y + cell / 2).toFixed(1)}h0`;
      else {
        const op = [0, 0.45, 0.65, 0.85, 1][e[1]];
        lit += `<rect x="${x}" y="${y}" width="${cell}" height="${cell}" rx="4" fill="url(#cg)" fill-opacity="${op}" class="cell" style="animation-delay:${(0.4 + w * 0.012).toFixed(2)}s"><title>${key}: ${e[2]} contribution${e[2] === 1 ? "" : "s"}</title></rect>`;
        if (e[1] === 4) lit += `<rect x="${x - 3}" y="${y - 3}" width="${cell + 6}" height="${cell + 6}" rx="6" fill="none" stroke="${brand.pink}" stroke-width="1.2" class="glow" style="animation-delay:${(w * 0.05).toFixed(2)}s"/>`;
      }
    }
  }
  const css = `.cell{opacity:0;animation:pop .6s cubic-bezier(.2,.8,.2,1) forwards}@keyframes pop{from{opacity:0;transform:scale(.4)}to{opacity:1;transform:none}}
  .cell{transform-box:fill-box;transform-origin:center}
  .glow{animation:gl 3s ease-in-out infinite}@keyframes gl{0%,100%{opacity:0}50%{opacity:.8}}
  .scan{animation:scan 7s linear infinite}@keyframes scan{from{transform:translateX(-140px)}to{transform:translateX(${W + 40}px)}}`;
  const body = `<defs><linearGradient id="cg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${brand.pink}"/><stop offset="1" stop-color="${brand.violet}"/></linearGradient>
    <linearGradient id="sc" x1="0" x2="1"><stop offset="0" stop-color="${brand.violet}" stop-opacity="0"/><stop offset=".5" stop-color="${brand.violet}" stop-opacity="${k === "dark" ? 0.16 : 0.1}"/><stop offset="1" stop-color="${brand.violet}" stop-opacity="0"/></linearGradient>
    ${sheen("csh", 6, k === "light")}<clipPath id="cc"><rect width="${W}" height="${H}" rx="22"/></clipPath></defs>
    <g clip-path="url(#cc)"><rect width="${W}" height="${H}" fill="${t.bg}"/><rect x="0" y="0" width="140" height="${H}" fill="url(#sc)" class="scan"/></g>
    <rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="22" stroke="${t.panelLine}"/>
    ${text("CONTRIBUTION.MAP", { font: fonts.monoMed, size: 11, x: 24, y: 34, fill: t.faint, track: 0.22 })}
    ${text(String(total), { font: fonts.display, size: 17, x: W - 24 - width(" contributions in the last year", fonts.body, 14), y: 35, anchor: "end", fill: "url(#csh)" })}
    ${text(" contributions in the last year", { font: fonts.body, size: 14, x: W - 24, y: 34, anchor: "end", fill: t.soft })}
    ${months.map(([x, m]) => text(m, { font: fonts.mono, size: 11, x, y: 60, fill: t.faint })).join("")}
    <path d="${cells}" stroke="${t.dim}" stroke-width="4" stroke-linecap="round"/>
    ${lit}
    ${text("Less", { font: fonts.mono, size: 11, x: W - 150, y: 214, anchor: "end", fill: t.faint })}
    ${[0.25, 0.45, 0.65, 0.85, 1].map((o, i) => `<rect x="${W - 140 + i * 18}" y="203" width="13" height="13" rx="3.5" fill="${i ? "url(#cg)" : t.dim}" opacity="${i ? o : 1}"/>`).join("")}
    ${text("More", { font: fonts.mono, size: 11, x: W - 46, y: 214, fill: t.faint })}`;
  return svg(W, H, body, { title: `${total} contributions in the last year`, css });
}

// ---------- glass buttons ----------
export function button(k, label, { icon = null, primary = false, w = null } = {}) {
  const t = P[k];
  const fs_ = 15;
  const tw = width(label, fonts.bodySemi, fs_);
  const W = w ?? Math.ceil(tw + (icon ? 66 : 44)), H = 48;
  const ICONS = {
    x: `<path d="M3 3l14 14M17 3L3 17" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>`,
    link: `<path d="M8.5 11.5a3.5 3.5 0 0 0 5 0l3-3a3.5 3.5 0 0 0-5-5l-1 1M11.5 8.5a3.5 3.5 0 0 0-5 0l-3 3a3.5 3.5 0 0 0 5 5l1-1" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" fill="none"/>`,
    mail: `<path d="M2.5 5h15v10h-15zM2.5 5l7.5 6 7.5-6" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" fill="none"/>`,
    arrow: `<path d="M4 10h11M11 5l5 5-5 5" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
  };
  const ink = primary ? "#ffffff" : t.ink;
  const ix = 20, tx = icon ? 48 : W / 2;
  const body = `<defs><linearGradient id="bg" x1="0" x2="1"><stop offset="0" stop-color="${brand.violet}"/><stop offset="1" stop-color="${brand.pink}"/></linearGradient>
    <linearGradient id="spec" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="${primary ? 0.45 : k === "dark" ? 0.22 : 0.9}"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/></linearGradient>
    <linearGradient id="sweep" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity="${primary ? 0.5 : 0.25}"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
    <clipPath id="bc"><rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="${(H - 2) / 2}"/></clipPath></defs>
    <rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="${(H - 2) / 2}" fill="${primary ? "url(#bg)" : t.pill}"/>
    <g clip-path="url(#bc)"><rect x="1" y="1" width="${W - 2}" height="${H / 2}" fill="url(#spec)"/><rect x="-80" y="0" width="60" height="${H}" fill="url(#sweep)" transform="skewX(-18)" class="sw"/></g>
    <rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="${(H - 2) / 2}" stroke="${primary ? "rgba(255,255,255,.35)" : t.pillLine}"/>
    ${icon ? `<g transform="translate(${ix} ${H / 2 - 10})" color="${ink}">${ICONS[icon]}</g>` : ""}
    ${text(label, { font: fonts.bodySemi, size: fs_, x: tx, y: H / 2 + 5.5, anchor: icon ? "start" : "middle", fill: ink })}`;
  const css = `.sw{animation:sw 5s ease-in-out infinite}@keyframes sw{0%,70%{transform:translateX(0) skewX(-18deg)}100%{transform:translateX(${W + 140}px) skewX(-18deg)}}`;
  return { svg: svg(W, H, body, { title: label, css }), w: W };
}
