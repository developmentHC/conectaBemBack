import { jest } from "@jest/globals";
import crypto from "crypto";
import { sendWebhook } from "../../lib/webhook.mjs";

global.fetch = jest.fn();

afterEach(() => {
  jest.clearAllMocks();
});

describe("sendWebhook", () => {
  const url = "http://localhost/webhook";
  const payload = { type: "TEST_EVENT", eventId: "123", data: { ok: true } };
  const body = JSON.stringify(payload);

  it("deve enviar webhook sem secret", async () => {
    fetch.mockResolvedValue({ ok: true });

    await sendWebhook({ url, payload });

    expect(fetch).toHaveBeenCalledWith(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Event-Type": "TEST_EVENT",
        "X-Event-Id": "123",
      },
      body,
    });
  });

  it("deve enviar webhook com secret", async () => {
    fetch.mockResolvedValue({ ok: true });
    const secret = "minha-chave";
    const sig = crypto.createHmac("sha256", secret).update(body).digest("hex");

    await sendWebhook({ url, payload, secret });

    expect(fetch).toHaveBeenCalledWith(url, {
      method: "POST",
      headers: expect.objectContaining({
        "X-Signature-SHA256": sig,
      }),
      body,
    });
  });

  it("deve enviar o payload corretamente", async () => {
    fetch.mockResolvedValue({ ok: true });

    await sendWebhook({ url, payload });

    const call = fetch.mock.calls[0][1];
    expect(call.body).toBe(body);
  });

  it("não deve lançar erro se res.ok = true", async () => {
    fetch.mockResolvedValue({ ok: true });

    await expect(sendWebhook({ url, payload })).resolves.not.toThrow();
  });

  it("deve lançar erro se res.ok = false", async () => {
    fetch.mockResolvedValue({ ok: false, status: 500 });

    await expect(sendWebhook({ url, payload })).rejects.toThrow("Webhook 500");
  });
});
