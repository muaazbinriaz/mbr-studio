/**
 * One send function per channel, all via Meta Graph API. Includes a
 * small retry (2-3 attempts, short backoff) since a dropped reply on
 * a client's live WhatsApp number is far more visible than a dropped
 * website widget message.
 */

const GRAPH_API_VERSION = "v21.0";
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 800;

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function postWithRetry(url: string, body: unknown): Promise<boolean> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) return true;

      const errorBody = await res.text();
      console.error(
        `[channels/send] Attempt ${attempt} failed (${res.status}): ${errorBody}`,
      );
    } catch (err) {
      console.error(`[channels/send] Attempt ${attempt} threw:`, err);
    }

    if (attempt < MAX_RETRIES) await sleep(RETRY_DELAY_MS * attempt);
  }
  return false;
}

export async function sendWhatsAppMessage(
  phoneNumberId: string,
  accessToken: string,
  to: string,
  text: string,
): Promise<boolean> {
  const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${phoneNumberId}/messages?access_token=${accessToken}`;
  return postWithRetry(url, {
    messaging_product: "whatsapp",
    to,
    type: "text",
    text: { body: text },
  });
}

export async function sendMessengerMessage(
  pageAccessToken: string,
  recipientPsid: string,
  text: string,
): Promise<boolean> {
  const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/me/messages?access_token=${pageAccessToken}`;
  return postWithRetry(url, {
    recipient: { id: recipientPsid },
    message: { text },
  });
}

export async function sendInstagramMessage(
  igAccessToken: string,
  recipientId: string,
  text: string,
): Promise<boolean> {
  const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/me/messages?access_token=${igAccessToken}`;
  return postWithRetry(url, {
    recipient: { id: recipientId },
    message: { text },
  });
}
