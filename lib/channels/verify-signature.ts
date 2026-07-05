import crypto from "crypto";

/**
 * Verifies Meta's X-Hub-Signature-256 header against the raw request
 * body using the app secret (META_APP_SECRET). This must be checked
 * on every inbound webhook POST — an unsigned/invalid request must be
 * rejected outright (spec Section 8, rule #1).
 *
 * IMPORTANT: must be computed against the RAW request body string,
 * not a parsed/re-serialized JSON object — re-serializing can change
 * whitespace/key order and break the signature match.
 */
export function verifyMetaSignature(
  rawBody: string,
  signatureHeader: string | null,
): boolean {
  const appSecret = process.env.META_APP_SECRET;
  if (!appSecret) {
    console.error("[verifyMetaSignature] META_APP_SECRET is not set.");
    return false;
  }
  if (!signatureHeader || !signatureHeader.startsWith("sha256=")) {
    return false;
  }

  const expectedSignature = signatureHeader.slice("sha256=".length);
  const computedSignature = crypto
    .createHmac("sha256", appSecret)
    .update(rawBody, "utf8")
    .digest("hex");

  // Use timing-safe comparison to avoid leaking info via timing attacks.
  const expectedBuf = Buffer.from(expectedSignature, "hex");
  const computedBuf = Buffer.from(computedSignature, "hex");

  if (expectedBuf.length !== computedBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, computedBuf);
}
