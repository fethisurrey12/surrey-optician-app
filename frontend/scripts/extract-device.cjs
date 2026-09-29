// Cuts the SO device out of the practice's logo artwork.
// Temporary helper — removed once the icon set is generated.
const fs = require("fs");
const { PNG } = require("pngjs");

const src = PNG.sync.read(fs.readFileSync("assets/brand/surrey-opticians-logo-01.png"));
const at = (x, y) => {
  const i = (src.width * y + x) << 2;
  return [src.data[i], src.data[i + 1], src.data[i + 2], src.data[i + 3]];
};

// The teal block, and the white device inside it.
const BX0 = 72; // block left
const BY0 = 69; // block top
const BY1 = 551; // block bottom
const DX1 = 692; // device right edge
const cw = DX1 - BX0 + 1;
const ch = BY1 - BY0 + 1;

// (a) the mark as the artwork draws it: white device on its own teal ground,
//     cropped at the two block edges it bleeds off.
const tile = new PNG({ width: cw, height: ch });
for (let y = 0; y < ch; y += 1) {
  for (let x = 0; x < cw; x += 1) {
    const [r, g, b, al] = at(BX0 + x, BY0 + y);
    const i = (cw * y + x) << 2;
    tile.data[i] = al < 40 ? 0 : r;
    tile.data[i + 1] = al < 40 ? 157 : g;
    tile.data[i + 2] = al < 40 ? 178 : b;
    tile.data[i + 3] = 255;
  }
}
fs.writeFileSync("assets/brand/so-device-tile.png", PNG.sync.write(tile));

// (b) the device alone, white on transparent, for a ground painted underneath.
const alone = new PNG({ width: cw, height: ch });
for (let y = 0; y < ch; y += 1) {
  for (let x = 0; x < cw; x += 1) {
    const [r, g, b, al] = at(BX0 + x, BY0 + y);
    const i = (cw * y + x) << 2;
    const white = al > 60 && r > 150 && g > 150 && b > 150;
    // keep the artwork's own anti-aliasing: alpha follows how white the pixel is
    const k = white ? Math.min(255, Math.round((r + g + b) / 3)) : 0;
    alone.data[i] = 255;
    alone.data[i + 1] = 255;
    alone.data[i + 2] = 255;
    alone.data[i + 3] = k;
  }
}
fs.writeFileSync("assets/brand/so-device.png", PNG.sync.write(alone));

console.log("wrote " + cw + "x" + ch);
