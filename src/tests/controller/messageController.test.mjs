import { jest } from "@jest/globals";
import mongoose from "mongoose";

jest.unstable_mockModule("../../models/Conversation.mjs", () => ({
  __esModule: true,
  default: { updateOne: jest.fn() },
}));

jest.unstable_mockModule("../../models/InboxMessage.mjs", () => ({
  __esModule: true,
  default: { create: jest.fn() },
}));

jest.unstable_mockModule("../../models/ConversationMember.mjs", () => ({
  __esModule: true,
  default: { updateOne: jest.fn() },
}));

const Conversation = (await import("../../models/Conversation.mjs")).default;
const InboxMessage = (await import("../../models/InboxMessage.mjs")).default;
const ConversationMember = (await import("../../models/ConversationMember.mjs")).default;

const makeRes = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
});

const makeReq = (overrides = {}) => ({
  userId: "user123",
  body: {},
  ...overrides,
});

const expectError = (res, status, error) => {
  expect(res.status).toHaveBeenCalledWith(status);
  expect(res.json).toHaveBeenCalledWith(error);
};

afterEach(() => {
  jest.clearAllMocks();
  jest.restoreAllMocks();
});

describe("createMessage", () => {
  let createMessage;

  beforeAll(async () => {
    ({ createMessage } = await import("../../controller/messageController/index.mjs"));
  });

  beforeEach(() => {
    Conversation.updateOne.mockResolvedValue({});
    InboxMessage.create.mockResolvedValue({ _id: "msg123", createdAt: new Date() });
    ConversationMember.updateOne.mockResolvedValue({ matchedCount: 1 });

    jest.spyOn(mongoose.Types, "ObjectId").mockImplementation((id) => ({
      toString: () => id,
    }));
  });

  it("401 se não houver userId", async () => {
    const req = makeReq({ userId: null, body: { content: "Olá mundo" } });
    const res = makeRes();

    await createMessage(req, res);

    expectError(res, 401, { error: "Não autenticado" });
  });

  it("400 se content não for enviado", async () => {
    const req = makeReq({ body: { participants: ["p1", "p2"] } });
    const res = makeRes();

    await createMessage(req, res);

    expectError(res, 400, { error: "content é obrigatório" });
  });

  it("400 se não houver participants quando não há conversation", async () => {
    const req = makeReq({ body: { content: "Olá mundo" } });
    const res = makeRes();

    await createMessage(req, res);

    expectError(res, 400, {
      error: "participants é obrigatório quando não há conversation",
    });
  });

  it("201 se criar mensagem com sucesso", async () => {
    const req = makeReq({
      body: {
        conversation: "conv123",
        content: "Olá, tudo bem?",
        participants: ["user123", "user456"],
      },
    });
    const res = makeRes();

    await createMessage(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      messageId: "msg123",
      conversation: "conv123",
    });
  });

  it("500 se ocorrer erro no banco ao criar mensagem", async () => {
    InboxMessage.create.mockRejectedValueOnce(new Error("DB error"));

    const req = makeReq({
      body: {
        conversation: "conv123",
        content: "Oi",
        participants: ["user123", "user456"],
      },
    });
    const res = makeRes();

    await createMessage(req, res);

    expectError(res, 500, { error: "Erro interno" });
  });

  it("adiciona o userId nos participants caso não esteja presente", async () => {
    const req = makeReq({
      userId: "user999",
      body: {
        conversation: "conv456",
        content: "Oi de novo",
        participants: ["user456"],
      },
    });
    const res = makeRes();

    await createMessage(req, res);

    expect(Conversation.updateOne).toHaveBeenNthCalledWith(
      1,
      { conversation: "conv456" },
      expect.objectContaining({
        $setOnInsert: expect.objectContaining({
          participants: expect.arrayContaining([
            expect.objectContaining({ toString: expect.any(Function) }),
          ]),
        }),
      }),
      { upsert: true }
    );

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      messageId: "msg123",
      conversation: "conv456",
    });
  });
});
