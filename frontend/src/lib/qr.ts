// Placeholder QR generator. Produces a deterministic module matrix from a hash
// of the voucher code so every code renders a stable, QR-like pattern with the
// three finder squares. It is NOT a scannable QR.
//
// BUILD-TIME SWAP: replace `codeMatrix` with a real encoder (e.g. `qrcode`)
// and feed the encoded modules into <QRCode/> unchanged.

// cyrb53 — small, fast string hash.
function cyrb53(str: string, seed = 0): number {
  let h1 = 0xdeadbeef ^ seed;
  let h2 = 0x41c6ce57 ^ seed;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

// Mulberry32 PRNG seeded from the hash.
function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SIZE = 25;

function stampFinder(grid: boolean[][], row: number, col: number) {
  for (let r = 0; r < 7; r++) {
    for (let c = 0; c < 7; c++) {
      const edge = r === 0 || r === 6 || c === 0 || c === 6;
      const core = r >= 2 && r <= 4 && c >= 2 && c <= 4;
      grid[row + r][col + c] = edge || core;
    }
  }
}

// Returns a SIZE×SIZE boolean matrix. Stable for a given code.
export function codeMatrix(code: string): boolean[][] {
  const rand = mulberry32(cyrb53(code));
  const grid: boolean[][] = Array.from({ length: SIZE }, () =>
    Array.from({ length: SIZE }, () => false),
  );

  const inFinder = (r: number, c: number) => {
    const zones = [
      [0, 0],
      [0, SIZE - 7],
      [SIZE - 7, 0],
    ];
    return zones.some(([fr, fc]) => r >= fr && r < fr + 8 && c >= fc && c < fc + 8);
  };

  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (inFinder(r, c)) continue;
      grid[r][c] = rand() > 0.5;
    }
  }

  stampFinder(grid, 0, 0);
  stampFinder(grid, 0, SIZE - 7);
  stampFinder(grid, SIZE - 7, 0);

  return grid;
}

export const QR_SIZE = SIZE;
