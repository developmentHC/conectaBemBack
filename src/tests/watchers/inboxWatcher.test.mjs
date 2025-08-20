import { jest } from "@jest/globals";
import { EventEmitter } from "events";

jest.unstable_mockModule("../../models/InboxMessage.mjs", () => ({
  __esModule: true,
  default: { watch: jest.fn() },
}));

jest.unstable_mockModule("../../lib/webhook.mjs", () => ({
  __esModule: true,
  sendWebhook: jest.fn(),
}));

const InboxMessage = (await import("../../models/InboxMessage.mjs")).default;
const { sendWebhook } = await import("../../lib/webhook.mjs");
const { startInboxMessageWatcher } = await import("../../watchers/inboxMessageWatcher.mjs");

const makeStream = () => {
  const emitter = new EventEmitter();

  return {
    on: (event, handler) => {
      emitter.on(event, handler);
    },
    emit: (event, payload) => {
      emitter.emit(event, payload);
    },
  };
};

describe("startInboxMessageWatcher", () => {
  let stream;

  beforeEach(() => {
    jest.clearAllMocks();
    stream = makeStream();
    InboxMessage.watch.mockReturnValue(stream);
  });

  it("deve iniciar o watcher sem erro", () => {
    startInboxMessageWatcher();
    expect(InboxMessage.watch).toHaveBeenCalledWith([{ $match: { operationType: "insert" } }]);
  });

  it("deve gerar payload correto e chamar sendWebhook", async () => {
    sendWebhook.mockResolvedValueOnce();

    startInboxMessageWatcher();

    const fakeDoc = {
      _id: "msg1",
      conversation: "conv1",
      sender: "user1",
      senderName: "Pedro",
      content: "Olá",
      createdAt: new Date().toISOString(),
    };

    stream.emit("change", { fullDocument: fakeDoc });

    await new Promise((r) => setTimeout(r, 0));

    expect(sendWebhook).toHaveBeenCalledWith(
      expect.objectContaining({
        url: process.env.FRONT_WEBHOOK_URL,
        secret: process.env.WEBHOOK_SECRET,
        payload: expect.objectContaining({
          type: "message.created",
          data: expect.objectContaining({
            messageId: "msg1",
            conversation: "conv1",
            sender: "user1",
            content: "Olá",
          }),
        }),
      })
    );
  });

  it("deve logar erro se sendWebhook falhar", async () => {
    const spyError = jest.spyOn(console, "error").mockImplementation(() => {});
    sendWebhook.mockRejectedValueOnce(new Error("Falha de rede"));

    startInboxMessageWatcher();

    stream.emit("change", {
      fullDocument: {
        _id: "msg2",
        conversation: "conv1",
        sender: "userX",
        content: "teste",
        createdAt: new Date().toISOString(),
      },
    });

    await new Promise((r) => setTimeout(r, 0));

    expect(spyError).toHaveBeenCalledWith(
      expect.stringContaining("Webhook erro:"),
      "Falha de rede"
    );
    spyError.mockRestore();
  });

  it("deve reiniciar watcher em caso de erro no stream", () => {
    const spyError = jest.spyOn(console, "error").mockImplementation(() => {});
    const spySetTimeout = jest.spyOn(global, "setTimeout").mockImplementation(() => {});

    startInboxMessageWatcher();

    stream.emit("error", new Error("ChangeStream caiu"));

    expect(spyError).toHaveBeenCalledWith(
      expect.stringContaining("ChangeStream erro:"),
      "ChangeStream caiu"
    );
    expect(spySetTimeout).toHaveBeenCalled();

    spyError.mockRestore();
    spySetTimeout.mockRestore();
  });
});
