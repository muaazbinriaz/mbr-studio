import { extractText, getDocumentProxy } from "unpdf";

const MIN_CHARS_PER_PAGE = 20;

export interface PdfExtractionResult {
  text: string;
  pageCount: number;
  looksScanned: boolean;
}

/**
 * Pure WASM PDF text extraction via `unpdf` — no native binary, chosen
 * specifically because this project already had a production incident
 * with @xenova/transformers' native dependencies breaking on Vercel's
 * serverless runtime.
 */
export async function extractPdfText(
  buffer: ArrayBuffer,
): Promise<PdfExtractionResult> {
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const { text, totalPages } = await extractText(pdf, { mergePages: true });

  const trimmed = (text ?? "").replace(/\s+/g, " ").trim();
  const looksScanned =
    trimmed.length < MIN_CHARS_PER_PAGE * Math.max(totalPages, 1);

  return { text: trimmed, pageCount: totalPages, looksScanned };
}
