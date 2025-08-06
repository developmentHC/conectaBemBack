import crypto from "crypto";

export async function sendWebhook({ url, secret, payload }) {
  const body = JSON.stringify(payload);
  const headers = { "Content-Type": "application/json" };

  if (secret) {
    const sig = crypto.createHmac("sha256", secret).update(body).digest("hex");
    headers["X-Signature-SHA256"] = sig;
  }
  headers["X-Event-Type"] = payload.type;
  headers["X-Event-Id"] = payload.eventId;

  const res = await fetch(url, { method: "POST", headers, body });
  if (!res.ok) throw new Error(`Webhook ${res.status}`);
}
