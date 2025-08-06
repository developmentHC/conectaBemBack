import { randomUUID } from "crypto";
import InboxMessage from "../models/InboxMessage.mjs";
import { sendWebhook } from "../lib/webhook.mjs";

export function startInboxMessageWatcher() {
  const stream = InboxMessage.watch([{ $match: { operationType: "insert" } }]);

  stream.on("change", async (chg) => {
    const d = chg.fullDocument;

    const payload = {
      eventId: randomUUID(),
      type: "message.created",
      occurredAt: new Date().toISOString(),
      data: {
        messageId: String(d._id),
        conversation: String(d.conversation),
        sender: String(d.sender),
        senderName: d.senderName || null,
        content: d.content,
        createdAt: d.createdAt
      }
    };

    try {
      await sendWebhook({
        url: process.env.FRONT_WEBHOOK_URL,
        secret: process.env.WEBHOOK_SECRET,
        payload
      });
      console.log(" Webhook enviado:", payload.data.messageId);
    } catch (e) {
      console.error(" Webhook erro:", e.message);
    }
  });

  stream.on("error", (e) => {
    console.error(" ChangeStream erro:", e.message);
    setTimeout(startInboxMessageWatcher, 5000);
  });

  console.log(" Watcher de InboxMessage iniciado");
}
