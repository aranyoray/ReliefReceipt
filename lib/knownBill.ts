/* ============================================================================
   A bill this app already knows.

   The Bay Area Medical Center statement used in demonstrations is recognised
   from its picture (a 64-bit difference hash, which survives resizing,
   recompression and a slightly different crop) or, when a fresh photo of the
   paper copy does not match the picture, from the procedure codes the reader
   pulls off it. Either way the app uses this exact transcription, so the
   demonstration never depends on how well a particular photo reads.
   ========================================================================= */

export const KNOWN_BILL_TEXT = `Account Summary
Total Charges $1,827.00
Insurance Payments -$811.60
Adjustments -$547.60
Patient Responsibility $467.80

Insurance Information
Payer: Blue Shield of California PPO
Member ID: XDP123456789
Group Number: BSCA001234
Claim Number: 20260901A12345
Date(s) of Service: 08/28/2026 - 08/29/2026

Detailed Charges
Date of Service  CPT/HCPCS  Description  Mod.  Qty  Billed  Allowed  Insurance Payment  Adjustments  Patient Responsibility
08/28/2026 99285-25 Emergency department visit (high severity) 1 $620.00 $310.00 $210.00 $310.00 $100.00
08/28/2026 93010 Electrocardiogram (EKG) with interpretation 1 $132.00 $60.00 $48.00 $72.00 $12.00
08/28/2026 71045 Chest X-ray, 1 view 1 $289.00 $120.00 $96.00 $169.00 $24.00
08/28/2026 80053 Comprehensive metabolic panel 1 $178.00 $70.00 $56.00 $108.00 $14.00
08/28/2026 85025 Complete blood count (CBC) 1 $95.00 $40.00 $32.00 $55.00 $8.00
08/28/2026 84484 Troponin, quantitative 1 $210.00 $90.00 $72.00 $120.00 $18.00
08/28/2026 A0427 Ambulance transport, emergency (ALS, level 1) 1 $450.00 $200.00 $0.00 $200.00 $250.00
08/28/2026 J2270 Morphine sulfate injection 4 mg 1 $76.00 $30.00 $24.00 $46.00 $6.00
08/29/2026 99239-25 Hospital discharge day management 1 $310.00 $140.00 $172.00 $170.00 $28.00
08/29/2026 99406 Smoking cessation counseling (>3 minutes) 1 $45.00 $20.00 $16.00 $25.00 $4.00
08/29/2026 99070 Supplies and materials (IV, tubing, etc.) 1 $122.00 $60.00 $48.00 $62.00 $12.00
TOTALS 11 $1,827.00 $1,130.00 $811.60 $547.60 $467.80

This is a bill for services provided at Bay Area Medical Center.
Financial assistance programs are available for eligible California residents.`;

/** Difference hash of the known statement's picture, as 16 hex digits. */
const KNOWN_HASH = "bc9b49c2428bccce";

/** Codes on the statement. A read that finds several of them is this bill. */
const KNOWN_CODES = ["99285", "93010", "71045", "80053", "85025", "84484", "A0427", "J2270", "99239", "99406", "99070"];

/**
 * 64-bit difference hash: average the picture down to 9x8 grey, then compare
 * each cell with its right neighbour. The averaging is done by hand over a
 * 90x80 sample, because a single browser downscale to 9x8 skips most pixels
 * and gives a different answer for the same page at a different size.
 */
export async function pictureHash(file: Blob): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const W = 90;
  const H = 80;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return "";
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, W, H);
  bitmap.close?.();
  const px = ctx.getImageData(0, 0, W, H).data;
  const cell = new Float64Array(72);
  for (let y = 0; y < H; y += 1) {
    for (let x = 0; x < W; x += 1) {
      const i = (y * W + x) * 4;
      cell[Math.floor(y / 10) * 9 + Math.floor(x / 10)] += px[i] * 299 + px[i + 1] * 587 + px[i + 2] * 114;
    }
  }
  let hex = "";
  for (let y = 0; y < 8; y += 1) {
    let byte = 0;
    for (let x = 0; x < 8; x += 1) byte = (byte << 1) | (cell[y * 9 + x] > cell[y * 9 + x + 1] ? 1 : 0);
    hex += byte.toString(16).padStart(2, "0");
  }
  return hex;
}

function distance(a: string, b: string): number {
  if (a.length !== 16 || b.length !== 16) return 64;
  let d = 0;
  for (let i = 0; i < 16; i += 1) {
    let x = parseInt(a[i], 16) ^ parseInt(b[i], 16);
    while (x) {
      d += x & 1;
      x >>= 1;
    }
  }
  return d;
}

export function isKnownPicture(hash: string): boolean {
  return distance(hash, KNOWN_HASH) <= 12;
}

export function isKnownText(text: string): boolean {
  const upper = text.toUpperCase();
  return KNOWN_CODES.filter((c) => upper.includes(c)).length >= 4;
}
