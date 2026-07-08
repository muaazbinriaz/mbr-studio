/**
 * Verifies a WhatsApp/Messenger/Instagram credential against Meta's Graph
 * API BEFORE we ever save a channel_connections row as "connected". Without
 * this, a typo'd ID or expired token gets silently marked "Connected" in the
 * dashboard and the client has no way to know their bot has gone silent.
 */

const GRAPH_API_VERSION = "v21.0";

export async function verifyMetaCredential(
  resourceId: string,
  accessToken: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${resourceId}?fields=id&access_token=${accessToken}`;
    const res = await fetch(url, { method: "GET" });

    if (res.ok) {
      return { ok: true };
    }

    const body = await res.json().catch(() => null);
    const metaMessage = body?.error?.message as string | undefined;

    return {
      ok: false,
      error: metaMessage
        ? `Meta rejected these credentials: ${metaMessage}`
        : "Meta rejected these credentials. Double-check the ID and access token.",
    };
  } catch {
    return {
      ok: false,
      error:
        "Couldn't reach Meta to verify these credentials. Please try again.",
    };
  }
}
