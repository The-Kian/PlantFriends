/* eslint-env node */
/* eslint-disable @typescript-eslint/no-require-imports */
// Renders the Google Play listing graphics into assets/store:
//   play-icon-512.png       512×512 app icon (Play requires this size)
//   feature-graphic.png     1024×500 banner shown at the top of the listing
// Run from the repo root: node assets/icon-source/store.js
// Same Playwright/Chromium env vars as render.js.
const fs = require("fs");
const path = require("path");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE ?? "playwright");

const mark = require("./mark.js");

const OUT = path.join(__dirname, "..", "store");
const font = (file) =>
  fs.readFileSync(path.join(__dirname, "fonts", file)).toString("base64");

const fonts = `
  @font-face { font-family: Nunito; font-weight: 800; src: url(data:font/ttf;base64,${font("Nunito-ExtraBold.ttf")}); }
  @font-face { font-family: Nunito; font-weight: 600; src: url(data:font/ttf;base64,${font("Nunito-SemiBold.ttf")}); }`;
const gradient = `<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4C8058"/><stop offset="1" stop-color="#2E5537"/></linearGradient></defs>`;

const icon = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 1024 1024">${gradient}<rect width="1024" height="1024" fill="url(#g)"/>${mark(1.12)}</svg>`;

const feature = `
<div style="width:1024px;height:500px;position:relative;overflow:hidden;background:linear-gradient(160deg,#4C8058,#2E5537);font-family:Nunito,sans-serif;color:#F6F4EE">
  <svg style="position:absolute;left:40px;top:10px" width="480" height="480" viewBox="0 0 1024 1024">${mark(1.05)}</svg>
  <div style="position:absolute;left:520px;top:0;bottom:0;right:48px;display:flex;flex-direction:column;justify-content:center">
    <div style="font-weight:800;font-size:76px;line-height:1">Plant Friends</div>
    <div style="font-weight:600;font-size:30px;line-height:1.35;margin-top:22px;color:#DDE9DA">Watering reminders for every plant in your home.</div>
  </div>
</div>`;

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH,
  });
  const shots = [
    ["play-icon-512.png", 512, 512, icon],
    ["feature-graphic.png", 1024, 500, feature],
  ];
  for (const [name, width, height, body] of shots) {
    const page = await browser.newPage({ viewport: { width, height } });
    await page.setContent(
      `<html><head><style>${fonts} body{margin:0}</style></head><body>${body}</body></html>`
    );
    // Runs in the page, where `document` exists.
    // eslint-disable-next-line no-undef
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: path.join(OUT, name) });
    await page.close();
  }
  await browser.close();
})();
