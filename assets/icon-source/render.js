/* eslint-env node */
/* eslint-disable @typescript-eslint/no-require-imports */
// Regenerates the app icon, Android adaptive icon, splash and favicon in
// assets/images from the sprout mark in mark.js.
// Run from the repo root: node assets/icon-source/render.js
// Needs Playwright; set PLAYWRIGHT_MODULE / CHROMIUM_PATH if not on the default path.
const path = require("path");

const { chromium } = require(process.env.PLAYWRIGHT_MODULE ?? "playwright");
const mark = require("./mark.js");
const OUT = path.join(__dirname, "..", "images");
const bg = `<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4C8058"/><stop offset="1" stop-color="#2E5537"/></linearGradient></defs><rect width="1024" height="1024" fill="url(#g)"/>`;
const svg = (body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">${body}</svg>`;
const jobs = [
  ["icon.png", 1024, svg(bg + mark(1.12)), false],
  // Android crops the adaptive foreground to a circle/squircle; keep the mark in the inner ~60%.
  ["adaptive-icon.png", 1024, svg(mark(0.92)), true],
  // Splash: dark-green mark on the app background colour (transparent PNG).
  ["splash.png", 1024, svg(mark(0.9, "dark")), true],
  ["favicon.png", 48, svg(bg + mark(1.2)), false],
];
(async () => {
  const b = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH,
  });
  for (const [name, size, s, transparent] of jobs) {
    const p = await b.newPage({ viewport: { width: size, height: size } });
    await p.setContent(
      `<html><body style="margin:0;background:transparent">${s.replace('width="1024" height="1024"', `width="${size}" height="${size}"`)}</body></html>`
    );
    await p.screenshot({
      path: path.join(OUT, name),
      omitBackground: transparent,
    });
    await p.close();
  }
  await b.close();
})();
