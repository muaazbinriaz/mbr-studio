# MBR Studio Platform API Reference

Version: v1

## Authentication

Every request to `/api/v1/*` requires a Bearer token:

```
Authorization: Bearer <YOUR_STRIPE_SECRET_KEY>
```

Generate a key at `/dashboard/settings/api-keys`. **The raw key is shown only once at creation time** — copy it immediately. Only its hash is stored, so it cannot be recovered later; if lost, revoke it and generate a new one.

All endpoints are automatically scoped to your organization — you never need to (and cannot) specify an organization ID.

## Rate limits

100 requests/minute per API key. Response headers on every request:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 97
X-RateLimit-Reset: 1751702400
```

Exceeding the limit returns `429` with `{ "error": { "code": "rate_limited", ... } }`.

## Error shape

Every error follows the same shape:

```json
{
  "error": {
    "code": "invalid_api_key",
    "message": "Invalid or revoked API key."
  }
}
```

## Endpoints

### `GET /api/v1/conversations`

List conversations, paginated.

**Query params:** `page` (default 1), `limit` (default 20, max 100), `channel`, `status`, `since` (ISO date)

```bash
curl https://your-domain.com/api/v1/conversations?limit=10 \
  -H "Authorization: Bearer <YOUR_STRIPE_SECRET_KEY>"
```

```json
{
  "data": [
    {
      "id": "...",
      "channel": "website",
      "status": "resolved",
      "started_at": "...",
      "last_message_at": "..."
    }
  ],
  "meta": { "page": 1, "limit": 10, "total": 42 }
}
```

### `GET /api/v1/conversations/:id`

Full thread for one conversation, including messages.

### `GET /api/v1/conversations/:id/messages`

Just the messages for a conversation, paginated.

### `GET /api/v1/leads`

List captured leads, paginated.

**Query params:** `page`, `limit`, `since`

```json
{
  "data": [
    {
      "id": "...",
      "visitor_name": "Jane Doe",
      "visitor_email": "jane@example.com",
      "captured_at": "..."
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 5 }
}
```

### `GET /api/v1/agents`

List your organization's agents.

```json
{
  "data": [
    {
      "id": "...",
      "name": "Main Agent",
      "agent_type": "general",
      "is_active": true
    }
  ]
}
```

## Webhooks

Subscribe to real-time events at `/dashboard/settings/webhooks`. Available event types:

- `lead.captured`
- `message.received`
- `conversation.started`
- `conversation.resolved`

### Payload shape

```json
{
  "event_type": "lead.captured",
  "created_at": "2026-07-05T12:00:00Z",
  "data": { "name": "Jane Doe", "email": "jane@example.com", "phone": null }
}
```

### Verifying the signature

Every webhook POST includes an `X-Webhook-Signature` header: `HMAC-SHA256(raw_request_body, your_endpoint_secret)`, hex-encoded.

**Node.js:**

```javascript
const crypto = require("crypto");

function verifySignature(rawBody, signature, secret) {
  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody, "utf8")
    .digest("hex");
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

// In your webhook receiver (e.g. Express):
app.post("/webhook", express.raw({ type: "application/json" }), (req, res) => {
  const signature = req.headers["x-webhook-signature"];
  const isValid = verifySignature(
    req.body.toString(),
    signature,
    process.env.MBR_WEBHOOK_SECRET,
  );
  if (!isValid) return res.status(401).send("Invalid signature");

  const event = JSON.parse(req.body.toString());
  console.log("Received:", event.event_type, event.data);
  res.status(200).send("ok");
});
```

### Delivery guarantee

Webhooks are delivered **at least once**, not exactly once. Retries happen up to 5 times with increasing backoff (1min, 5min, 15min, 60min) if your endpoint doesn't return a 2xx response. Design your receiver to be idempotent (e.g. dedupe on `data.conversation_id` + `event_type` + `created_at`) if duplicate delivery would cause problems.

### Sending leads to Zapier / Google Sheets

1. Create a Zapier "Webhooks by Zapier" trigger → "Catch Hook" → copy the generated URL.
2. Paste that URL as your endpoint's Target URL in `/dashboard/settings/webhooks`, subscribe to `lead.captured`.
3. Copy the signing secret shown once at creation (optional — only needed if you want to verify authenticity in a Zapier "Code" step).
4. In Zapier, add a step to append a row to Google Sheets using `data.name`, `data.email`, `data.phone` from the webhook payload.

### curl test (throwaway endpoint)

Use [webhook.site](https://webhook.site) to get a temporary URL, paste it as your target URL, then trigger a real lead capture or wait for the next chat message — the cron dispatcher runs every minute.
