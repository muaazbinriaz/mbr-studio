import crypto from "crypto";

/**
 * AES-256-GCM encryption for channel access tokens at rest.
 * CHANNEL_TOKEN_ENCRYPTION_KEY must be a 64-char hex string (32 bytes).
 *
 * Stored format: "<iv_hex>:<authTag_hex>:<ciphertext_hex>"
 * All three parts are needed to decrypt — losing the key means the
 * stored tokens become permanently unrecoverable (by design).
 */

const ALGORITHM = "aes-256-gcm";

function getKey(): Buffer {
  const hex = process.env.CHANNEL_TOKEN_ENCRYPTION_KEY;
  if (!hex) {
    throw new Error(
      "CHANNEL_TOKEN_ENCRYPTION_KEY is not set. Generate one with: " +
        `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`,
    );
  }
  const key = Buffer.from(hex, "hex");
  if (key.length !== 32) {
    throw new Error(
      "CHANNEL_TOKEN_ENCRYPTION_KEY must decode to exactly 32 bytes (64 hex chars).",
    );
  }
  return key;
}

export function encryptToken(plaintext: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(12); // 96-bit IV recommended for GCM
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
}

export function decryptToken(stored: string): string {
  const key = getKey();
  const [ivHex, authTagHex, dataHex] = stored.split(":");
  if (!ivHex || !authTagHex || !dataHex) {
    throw new Error("Malformed encrypted token value.");
  }

  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    key,
    Buffer.from(ivHex, "hex"),
  );
  decipher.setAuthTag(Buffer.from(authTagHex, "hex"));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(dataHex, "hex")),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}

/** For masked display in the dashboard UI (e.g. "••••1234") */
export function maskToken(plaintext: string): string {
  if (plaintext.length <= 4) return "••••";
  return `••••${plaintext.slice(-4)}`;
}
