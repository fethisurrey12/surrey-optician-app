// Render the app icon, splash and favicon from the logo artwork.
//
// The source of truth is scripts/brand-assets.html, which holds the same SO
// monogram paths as assets/logo-mark.svg and src/ui/LogoMark.tsx. Edit the
// paths there and re-run this to regenerate every PNG at once:
//
//     npx playwright-core --version   # or: npm i -D playwright-core
//     node scripts/render-brand-assets.mjs
//
// Replacing these with the practice's own artwork needs no code change — drop
// the files into assets/images under the same names.
import { chromium } from "playwright-core";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(here, "..", "assets", "images");
const page = "file://" + path.join(here, "brand-assets.html");

// [selector, file, transparent background]
const jobs = [
  ["#icon", "icon.png", false],
  ["#adaptive", "adaptive-icon.png", true],
  ["#favicon", "favicon.png", false],
  ["#mark", "logo-mark.png", false],
  ["#splash", "splash-image.png", true],
];

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const tab = await browser.newPage({ viewport: { width: 1200, height: 1200 } });
await tab.goto(page, { waitUntil: "load" });
await tab.waitForTimeout(400);

for (const [selector, file, transparent] of jobs) {
  await tab.locator(selector).screenshot({
    path: path.join(out, file),
    omitBackground: transparent,
  });
  console.log("  " + file);
}
await browser.close();
