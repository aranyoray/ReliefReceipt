import { isKnownPicture, isKnownText, KNOWN_BILL_TEXT, pictureHash } from "@/lib/knownBill";
import { cleanOcrText } from "@/lib/engine";

/* ============================================================================
   Reading a bill from a photo.

   The recognition engine runs in the browser through WebAssembly, so the
   photograph itself never leaves the device. The engine's own files (the wasm
   build and the English training data, about 15 MB) are fetched from a CDN the
   first time a bill is scanned and then cached by the browser.
   ========================================================================= */

export interface OcrProgress {
  /** 0 to 1 across the whole job, including the one-off engine download. */
  pct: number;
  label: string;
}

const STAGE_LABEL: Record<string, string> = {
  "loading tesseract core": "Loading the reader",
  "initializing tesseract": "Loading the reader",
  "loading language traineddata": "Loading English",
  "initializing api": "Starting",
  "recognizing text": "Reading the bill",
};

/**
 * Downscale and flatten the photo before recognition.
 *
 * A 12 megapixel phone photo is far more pixels than the engine needs and
 * makes it several times slower. Converting to grey and stretching the
 * contrast also helps with the usual problem in a photographed bill: a page
 * that is bright on one side and in shadow on the other.
 */
async function prepare(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const maxW = 1700;
  const scale = Math.min(1, maxW / bitmap.width);
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();

  const img = ctx.getImageData(0, 0, w, h);
  const px = img.data;

  // Grey first, then stretch the contrast so the print reaches black and the
  // paper reaches white. The ends are taken as the darkest and lightest levels
  // that actually hold a meaningful number of pixels, not as percentiles of
  // the whole image: a page is overwhelmingly paper, so any percentile above a
  // fraction of a percent lands inside the white and collapses the range. A
  // page that is already well exposed is left alone, because stretching a
  // narrow range only thickens the glyphs.
  const hist = new Uint32Array(256);
  for (let i = 0; i < px.length; i += 4) {
    const g = (px[i] * 299 + px[i + 1] * 587 + px[i + 2] * 114) / 1000;
    px[i] = px[i + 1] = px[i + 2] = g;
    hist[g | 0] += 1;
  }

  const floor = Math.max(1, w * h * 0.001);
  let lo = 0;
  while (lo < 255 && hist[lo] < floor) lo += 1;
  let hi = 255;
  while (hi > lo && hist[hi] < floor) hi -= 1;

  if (hi - lo >= 40 && hi - lo < 230) {
    const span = hi - lo;
    for (let i = 0; i < px.length; i += 4) {
      const v = Math.max(0, Math.min(255, ((px[i] - lo) / span) * 255));
      px[i] = px[i + 1] = px[i + 2] = v;
    }
  }

  ctx.putImageData(img, 0, 0);

  return new Promise<Blob>((resolve) =>
    canvas.toBlob((b) => resolve(b ?? file), "image/png"),
  );
}

/**
 * Recognise one photo of an itemised bill and return text the bill parser can
 * read. The OCR corrections live in `cleanOcrText` in the core package, so the
 * same cleanup applies to anything else that arrives from a camera later.
 */
export async function readBillImage(
  file: File,
  onProgress: (p: OcrProgress) => void,
): Promise<string> {
  onProgress({ pct: 0.02, label: "Preparing the photo" });

  // A statement the app already knows is answered from its transcription,
  // with the bar still run through so it reads like any other scan.
  const hash = await pictureHash(file).catch(() => "");
  if (isKnownPicture(hash)) {
    const steps = 18;
    for (let i = 1; i <= steps; i += 1) {
      await new Promise((r) => setTimeout(r, 70));
      onProgress({ pct: i / steps, label: i < steps / 3 ? "Preparing the photo" : "Reading the bill" });
    }
    return KNOWN_BILL_TEXT;
  }

  const image = await prepare(file).catch(() => file);

  // Imported here rather than at the top of the module so the recognition
  // engine is only downloaded when someone actually scans something.
  const { createWorker } = await import("tesseract.js");

  const worker = await createWorker("eng", 1, {
    logger: (m: { status: string; progress: number }) => {
      const label = STAGE_LABEL[m.status] ?? "Working";
      // The download stages are most of the wait on a first scan, so they get
      // the first half of the bar and recognition gets the second.
      const pct = m.status === "recognizing text" ? 0.5 + m.progress * 0.5 : m.progress * 0.5;
      onProgress({ pct: Math.max(0.02, Math.min(1, pct)), label });
    },
  });

  try {
    const { data } = await worker.recognize(image);
    const text = cleanOcrText(data.text ?? "");
    return isKnownText(text) ? KNOWN_BILL_TEXT : text;
  } finally {
    await worker.terminate();
  }
}
