// Real QR encoding via the `qrcode` package (pure JS — `create` needs no canvas).
// Error-correction level M gives comfortable tolerance for handheld till
// scanners while keeping the symbol small (21×21 for an SO-XXXX-XXXX code).
import QR from "qrcode";

const cache = new Map<string, boolean[][]>();

// Returns the module matrix (true = dark) for a voucher code. Memoised: the
// same code is drawn on the card, the sheet and the wallet pass preview.
export function codeMatrix(code: string): boolean[][] {
  const hit = cache.get(code);
  if (hit) return hit;
  const { modules } = QR.create(code, { errorCorrectionLevel: "M" });
  const n = modules.size;
  const grid: boolean[][] = [];
  for (let r = 0; r < n; r++) {
    const row: boolean[] = [];
    for (let c = 0; c < n; c++) row.push(modules.get(r, c) === 1);
    grid.push(row);
  }
  cache.set(code, grid);
  return grid;
}
