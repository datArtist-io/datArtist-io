// Shared helpers: fonts as outlines (so every SVG looks identical everywhere), palettes, small shapes.
import opentype from "opentype.js";
import fs from "node:fs";

const F = (p) => opentype.parse(fs.readFileSync(new URL(`./node_modules/@fontsource/${p}`, import.meta.url)).buffer);
export const fonts = {
  display: F("unbounded/files/unbounded-latin-600-normal.woff"),
  displayBold: F("unbounded/files/unbounded-latin-700-normal.woff"),
  displayMed: F("unbounded/files/unbounded-latin-500-normal.woff"),
  body: F("hanken-grotesk/files/hanken-grotesk-latin-400-normal.woff"),
  bodyMed: F("hanken-grotesk/files/hanken-grotesk-latin-500-normal.woff"),
  bodySemi: F("hanken-grotesk/files/hanken-grotesk-latin-600-normal.woff"),
  bodyBold: F("hanken-grotesk/files/hanken-grotesk-latin-700-normal.woff"),
  mono: F("jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff"),
  monoMed: F("jetbrains-mono/files/jetbrains-mono-latin-500-normal.woff"),
};

/** Width of a string at a size, with tracking in em. */
export function width(str, font, size, track = 0) {
  return font.getAdvanceWidth(str, size, { kerning: true }) + Math.max(0, [...str].length - 1) * track * size;
}

/** A string as one outlined path. anchor: start | middle | end. */
export function text(str, { font = fonts.body, size = 16, x = 0, y = 0, anchor = "start", track = 0, fill = "currentColor", attrs = "" } = {}) {
  const w = width(str, font, size, track);
  let x0 = anchor === "middle" ? x - w / 2 : anchor === "end" ? x - w : x;
  let d = "";
  if (!track) d = font.getPath(str, x0, y, size, { kerning: true }).toPathData(2);
  else {
    for (const ch of [...str]) {
      d += font.getPath(ch, x0, y, size).toPathData(2);
      x0 += font.getAdvanceWidth(ch, size) + track * size;
    }
  }
  return `<path d="${d}" fill="${fill}" ${attrs}/>`;
}

/** Greedy word wrap into lines no wider than max. */
export function wrap(str, font, size, max) {
  const out = [];
  let line = "";
  for (const w of str.split(" ")) {
    const t = line ? `${line} ${w}` : w;
    if (width(t, font, size) > max && line) {
      out.push(line);
      line = w;
    } else line = t;
  }
  if (line) out.push(line);
  return out;
}

/** Seeded random, so assets are stable between builds. */
export function rng(seed = 7) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

export const brand = {
  pink: "#ff4fa3",
  violet: "#7b5cff",
  cyan: "#38d3ff",
  gold: "#f2c14e",
  green: "#3ddc97",
};

export const themes = {
  dark: {
    name: "dark",
    bg: "#07081a",
    bg2: "#0d1030",
    ink: "#f4f5ff",
    soft: "#b9bdd9",
    faint: "#6d7298",
    line: "rgba(160,170,255,0.16)",
    glass: "rgba(255,255,255,0.06)",
    glassLine: "rgba(255,255,255,0.14)",
    star: "#ffffff",
    ocean: ["#1a2160", "#0a0d2a"],
    land: "#2c3a8f",
    landLine: "rgba(140,160,255,0.35)",
    rim: "#8fa2ff",
  },
  light: {
    name: "light",
    bg: "#eef1f8",
    bg2: "#ffffff",
    ink: "#10132b",
    soft: "#454a6b",
    faint: "#7a7fa3",
    line: "rgba(16,19,43,0.12)",
    glass: "rgba(255,255,255,0.72)",
    glassLine: "rgba(16,19,43,0.10)",
    star: "#7b5cff",
    ocean: ["#25307e", "#0c1030"],
    land: "#3a4bb0",
    landLine: "rgba(170,185,255,0.4)",
    rim: "#7b5cff",
  },
};

/** The Backline mark: three gel bars. */
export function mark(x, y, s = 1, id = "gel") {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <defs><linearGradient id="${id}" x1="8" y1="6" x2="58" y2="60" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#ff4fa3"/><stop offset=".5" stop-color="#7b5cff"/><stop offset="1" stop-color="#38d3ff"/></linearGradient></defs>
    <rect x="5" y="9" width="30" height="12" rx="6" fill="url(#${id})"/><rect x="5" y="26" width="42" height="12" rx="6" fill="url(#${id})"/><rect x="5" y="43" width="54" height="12" rx="6" fill="url(#${id})"/></g>`;
}

/** Brand gradient with a slow moving sheen (for headline text). */
export function sheen(id, dur = 6, light = false) {
  return `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="0" gradientUnits="objectBoundingBox">
    <stop offset="0" stop-color="#ff4fa3"/><stop offset=".45" stop-color="#a58bff"/><stop offset=".55" stop-color="${light ? "#c04bd6" : "#ffffff"}" stop-opacity=".95"/><stop offset=".62" stop-color="#7b5cff"/><stop offset="1" stop-color="#38d3ff"/>
    <animateTransform attributeName="gradientTransform" type="translate" values="-0.6 0; 0.6 0; -0.6 0" dur="${dur}s" repeatCount="indefinite" calcMode="spline" keySplines=".45 0 .55 1; .45 0 .55 1"/>
  </linearGradient>`;
}

export function stars(n, w, h, seed, color, avoid = null) {
  const r = rng(seed);
  let s = "";
  for (let i = 0; i < n; i++) {
    const x = r() * w, y = r() * h;
    if (avoid && avoid(x, y)) continue;
    const size = r() < 0.12 ? 1.6 : r() < 0.5 ? 1 : 0.6;
    const delay = (r() * 6).toFixed(2), dur = (3 + r() * 4).toFixed(2);
    s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${size}" fill="${color}" class="tw" style="animation-duration:${dur}s;animation-delay:-${delay}s"/>`;
  }
  return s;
}

export const twinkleCss = `.tw{animation:tw 4s ease-in-out infinite}@keyframes tw{0%,100%{opacity:.15}50%{opacity:.9}}`;
export const reduced = `@media (prefers-reduced-motion: reduce){*{animation:none!important}}`;

export function svg(w, h, body, { title = "", css = "" } = {}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" fill="none" role="img" aria-label="${title.replace(/"/g, "")}"><title>${title}</title><style>${css}${reduced}</style>${body}</svg>`;
}

export function write(path, content) {
  fs.mkdirSync(path.replace(/\/[^/]+$/, ""), { recursive: true });
  fs.writeFileSync(path, content);
  return `${path} ${(content.length / 1024).toFixed(1)} KB`;
}
