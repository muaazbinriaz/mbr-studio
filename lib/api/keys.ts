import crypto from "crypto";

const KEY_PREFIX = "sk_live_";

export function generateApiKey(): {
  rawKey: string;
  keyHash: string;
  keyPrefix: string;
} {
  const raw = KEY_PREFIX + crypto.randomBytes(32).toString("hex");
  const keyHash = hashApiKey(raw);
  const keyPrefix = raw.slice(0, KEY_PREFIX.length + 6);
  return { rawKey: raw, keyHash, keyPrefix };
}

export function hashApiKey(rawKey: string): string {
  return crypto.createHash("sha256").update(rawKey).digest("hex");
}

export function maskApiKey(keyPrefix: string): string {
  return `${keyPrefix}••••••••••••••••••••••••`;
}
