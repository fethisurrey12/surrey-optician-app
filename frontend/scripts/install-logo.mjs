// Put the practice's own logo artwork into the app.
//
//     npm i -D playwright-core     # once, if it is not already installed
//     node scripts/install-logo.mjs ~/Downloads/"Surrey Opticians Logo-01.png"
//
// One file in, every logo out: the in-app logo, the store icon, the Android
// adaptive icon, the favicon, the splash image and the Apple Wallet pass logos
// are all rendered from it. Nothing else needs editing — src/ui/LogoMark.tsx
// reads assets/images/logo-mark.png, which this writes.
//
// PNG, JPEG or SVG. Options:
//   --ground <colour>   the square behind the icon and favicon (default the
//                       brand turquoise; pass "white" for artwork that already
//                       carries its own light ground)
//   --pad <percent>     breathing room around the artwork (default 12)
//   --no-trim           keep the artwork's own margins instead of cropping to
//                       the ink, which is what centres it in a square icon
//   --device <file>     separate artwork for the square icons (store icon,
//                       adaptive icon, favicon). A brand usually has both a
//                       lockup and a device; a wide lockup squeezed into a
//                       square icon reads as a stripe across an empty tile.
import { chromium } from "playwright-core";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const frontend = path.join(here, "..");
const repo = path.join(frontend, "..");
const images = path.join(frontend, "assets", "images");
const wallet = path.join(repo, "backend", "wallet_assets");

const argv = process.argv.slice(2);
const options = { ground: "#009DB1", pad: "12", trim: true, device: null };
let source = null;
for (let i = 0; i < argv.length; i += 1) {
  const arg = argv[i];
  if (arg === "--ground" || arg === "--pad" || arg === "--device") {
    options[arg.slice(2)] = argv[i + 1];
    i += 1;
  } else if (arg === "--no-trim") {
    options.trim = false;
  } else if (!arg.startsWith("--")) {
    source = arg;
  }
}
const ground = options.ground;
const pad = Number(options.pad);

if (!source) {
  console.error(
    "Usage: node scripts/install-logo.mjs <artwork.png|.jpg|.svg> [--device <file>] [--ground <colour>] [--pad <percent>] [--no-trim]",
  );
  process.exit(1);
}
for (const file of [source, options.device]) {
  if (file && !fs.existsSync(file)) {
    console.error(`No such file: ${file}`);
    process.exit(1);
  }
}

const TYPES = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".svg": "image/svg+xml" };

function load(file) {
  const ext = path.extname(file).toLowerCase();
  const mime = TYPES[ext];
  if (!mime) {
    console.error(`Unsupported file type ${ext}. Use PNG, JPEG or SVG.`);
    process.exit(1);
  }
  return { uri: `data:${mime};base64,${fs.readFileSync(file).toString("base64")}`, vector: ext === ".svg" };
}

const lockup = load(source);
const device = options.device ? load(options.device) : null;

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const tab = await browser.newPage({ viewport: { width: 1400, height: 1400 } });
await tab.setContent("<body style='margin:0'>");

// Crop the artwork down to its ink. Exported artwork usually carries a wide
// margin, and a logo fitted with its margins sits small and off-centre in a
// square icon; cropping first is what makes every size below look deliberate.
const crop = (file) =>
  tab.evaluate(
  async ([uri, doTrim, vector]) => {
    const img = new Image();
    img.src = uri;
    await img.decode();
    // An SVG has no true pixel size: drawn at its nominal one it would be
    // rasterised small and then scaled up into a blurred icon, so redraw it
    // large enough for the biggest size below. A photograph or PNG is left at
    // its own resolution, since enlarging it would invent detail it lacks.
    const nominal = Math.max(img.naturalWidth, img.naturalHeight) || 1;
    const scale = vector ? Math.max(1, Math.round(2400 / nominal)) : 1;
    const w = Math.round(img.naturalWidth * scale);
    const h = Math.round(img.naturalHeight * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, w, h);
    if (!doTrim) return { uri, width: w, height: h, trimmed: false, ground: null };

    const { data } = ctx.getImageData(0, 0, w, h);
    const at = (x, y) => {
      const i = (y * w + x) * 4;
      return [data[i], data[i + 1], data[i + 2], data[i + 3]];
    };
    // The corner tells us what "empty" looks like: transparent for a cut-out
    // logo, the tile colour for one on a solid ground.
    const bg = at(0, 0);
    const ground = bg[3] >= 8 ? `rgb(${bg[0]},${bg[1]},${bg[2]})` : null;
    const empty = (p) => {
      if (bg[3] < 8) return p[3] < 8;
      return (
        p[3] > 8 &&
        Math.abs(p[0] - bg[0]) < 12 &&
        Math.abs(p[1] - bg[1]) < 12 &&
        Math.abs(p[2] - bg[2]) < 12
      );
    };

    let top = h, left = w, right = -1, bottom = -1;
    for (let y = 0; y < h; y += 1) {
      for (let x = 0; x < w; x += 1) {
        if (empty(at(x, y))) continue;
        if (y < top) top = y;
        if (y > bottom) bottom = y;
        if (x < left) left = x;
        if (x > right) right = x;
      }
    }
    if (right < 0) return { uri, width: w, height: h, trimmed: false, ground };

    const cw = right - left + 1;
    const ch = bottom - top + 1;
    const out = document.createElement("canvas");
    out.width = cw;
    out.height = ch;
    // Keep the ground the artwork came on, so a logo drawn on its own tile
    // stays on it and a cut-out one stays cut out.
    if (bg[3] >= 8) {
      const c = out.getContext("2d");
      c.fillStyle = `rgb(${bg[0]},${bg[1]},${bg[2]})`;
      c.fillRect(0, 0, cw, ch);
    }
    out.getContext("2d").drawImage(canvas, left, top, cw, ch, 0, 0, cw, ch);
    return {
      uri: out.toDataURL("image/png"),
      width: cw,
      height: ch,
      trimmed: cw !== w || ch !== h,
      ground,
    };
  },
    [file.uri, options.trim, file.vector],
  );

const art = await crop(lockup);
const mark = device ? await crop(device) : art;

// The in-app logo keeps the artwork's own proportions, with a margin around it
// so the mark is not jammed against the edge of its own tile. Cropping to the
// ink took the artwork's margin away; this puts a measured one back.
const MARK_FIT = 72;
const markWidth = Math.round(Math.min(1600, Math.max(600, art.width)) / (MARK_FIT / 100));
const markHeight = Math.round((markWidth * art.height) / art.width);

// The square icons take the device where there is one; everything that has room
// for the full lockup takes that.
const jobs = [
  {
    file: path.join(images, "logo-mark.png"),
    from: art,
    w: markWidth,
    h: markHeight,
    // Whatever the artwork sat on, it keeps sitting on.
    bg: art.ground,
    fit: MARK_FIT,
  },
  { file: path.join(images, "icon.png"), from: mark, w: 1024, h: 1024, bg: ground, fit: 100 - pad * 2 },
  { file: path.join(images, "adaptive-icon.png"), from: mark, w: 1024, h: 1024, bg: null, fit: 62 },
  { file: path.join(images, "favicon.png"), from: mark, w: 196, h: 196, bg: ground, fit: 100 - pad * 2 },
  { file: path.join(images, "splash-image.png"), from: art, w: 900, h: 900, bg: null, fit: 76 },
  { file: path.join(wallet, "logo.png"), from: art, w: 160, h: 50, bg: null, fit: 100 },
  { file: path.join(wallet, "logo@2x.png"), from: art, w: 320, h: 100, bg: null, fit: 100 },
  { file: path.join(wallet, "logo@3x.png"), from: art, w: 480, h: 150, bg: null, fit: 100 },
];

console.log(`Logo: ${path.basename(source)} (${art.width}×${art.height}${art.trimmed ? ", cropped to the artwork" : ""})`);
if (device) console.log(`Device: ${path.basename(options.device)} (${mark.width}×${mark.height}) — square icons only`);
for (const job of jobs) {
  await tab.setContent(
    `<style>
        html,body{margin:0;background:transparent}
        #box{width:${job.w}px;height:${job.h}px;display:flex;align-items:center;justify-content:center;
             ${job.bg ? `background:${job.bg};` : ""}}
        img{width:${job.fit}%;height:${job.fit}%;object-fit:contain;display:block}
      </style>
      <div id="box"><img src="${job.from.uri}"></div>`,
    { waitUntil: "load" },
  );
  await tab.waitForTimeout(120);
  await tab.locator("#box").screenshot({ path: job.file, omitBackground: !job.bg });
  console.log(`  ${path.relative(repo, job.file)}  ${job.w}×${job.h}`);
}
await browser.close();
console.log("\nDone. Look them over, then commit.");
