import { jest } from "@jest/globals";

jest.unstable_mockModule("../../models/User.mjs", () => ({
  __esModule: true,
  default: {
    findOne: jest.fn(),
    updateOne: jest.fn(),
  },
}));

jest.unstable_mockModule("../../services/validationService.mjs", () => ({
  __esModule: true,
  UserValidationService: {
    validateToken: jest.fn(),
  },
  ValidationError: class ValidationError extends Error {
    constructor(message, statusCode = 422) {
      super(message);
      this.statusCode = statusCode;
    }
  },
}));

const User = (await import("../../models/User.mjs")).default;
const { UserValidationService } = await import("../../services/validationService.mjs");

const makeRes = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
});

const makeReq = (overrides = {}) => ({
  body: {},
  cookies: {},
  ...overrides,
});

const expectError = (res, status, error) => {
  expect(res.status).toHaveBeenCalledWith(status);
  expect(res.json).toHaveBeenCalledWith({ error });
};

const expectMsg = (res, status, msg) => {
  expect(res.status).toHaveBeenCalledWith(status);
  expect(res.json).toHaveBeenCalledWith({ msg });
};

afterEach(() => {
  jest.clearAllMocks();
  jest.restoreAllMocks();
});

let changeActiveAddress;

beforeAll(async () => {
  ({ changeActiveAddress } = await import("../../controller/addressController/index.mjs"));
});

describe("changeActiveAddress", () => {
  it("422 se addressId não for enviado", async () => {
    const req = makeReq();
    const res = makeRes();

    await changeActiveAddress(req, res);

    expectError(res, 422, "ID do endereço é obrigatório");
  });

  it("404 se usuário não encontrado", async () => {
    const req = makeReq({
      body: { addressId: "507f1f77bcf86cd799439011" },
      cookies: { jwt: "fake-token" },
    });
    const res = makeRes();

    UserValidationService.validateToken.mockReturnValue({ userId: "user123" });
    User.findOne.mockResolvedValue(null);

    await changeActiveAddress(req, res);

    expectError(res, 404, "Endereço não encontrado para este usuário");
  });

  it("200 se atualizado com sucesso", async () => {
    const req = makeReq({
      body: { addressId: "507f1f77bcf86cd799439011" },
      cookies: { jwt: "fakeToken" },
    });
    const res = makeRes();

    UserValidationService.validateToken.mockReturnValue({ userId: "user123" });
    User.findOne.mockResolvedValue({
      _id: "user123",
      address: [{ _id: "507f1f77bcf86cd799439011" }],
    });
    User.updateOne
      .mockResolvedValueOnce({ modifiedCount: 1 })
      .mockResolvedValueOnce({ modifiedCount: 1 });
    await changeActiveAddress(req, res);

    expectMsg(res, 200, "Endereço principal atualizado com sucesso!");
  });

  it("304 se não houver alteração", async () => {
    const req = makeReq({
      body: { addressId: "507f1f77bcf86cd799439011" },
      cookies: { jwt: "fakeToken" },
    });
    const res = makeRes();

    UserValidationService.validateToken.mockReturnValue({ userId: "user123" });
    User.findOne.mockResolvedValue({
      _id: "user123",
      address: [{ _id: "507f1f77bcf86cd799439011" }],
    });
    User.updateOne
      .mockResolvedValueOnce({ modifiedCount: 1 })
      .mockResolvedValueOnce({ modifiedCount: 0 });

    await changeActiveAddress(req, res);

    expectMsg(res, 304, "Não houve alteração no endereço principal");
  });

  it("500 em erro inesperado", async () => {
    const req = makeReq({
      body: { addressId: "507f1f77bcf86cd799439011" },
      cookies: { jwt: "fakeToken" },
    });
    const res = makeRes();

    UserValidationService.validateToken.mockReturnValue({ userId: "user123" });
    User.findOne.mockRejectedValue(new Error("DB error"));

    await changeActiveAddress(req, res);

    expectError(res, 500, "Erro no servidor");
  });
});
