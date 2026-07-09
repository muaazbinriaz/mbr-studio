import crypto from "crypto";

/**
 * Signing scheme (documented for clients in docs/api-reference.md):
 * X-Webhook-Signature: HMAC-SHA256(rawBody, endpoint.secret), hex-encoded.
 */
export function signWebhookPayload(rawBody: string, secret: string): string {
  return crypto
    .createHmac("sha256", secret)
    .update(rawBody, "utf8")
    .digest("hex");
}

export function generateWebhookSecret(): string {
  return "whsec_" + crypto.randomBytes(24).toString("hex");
}
