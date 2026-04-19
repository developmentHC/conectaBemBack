vi.mock("../../models/User.mjs", () => ({
  __esModule: true,
  default: {
    updateOne: vi.fn(),
    findOne: vi.fn(),
  },
}));

const User = (await import("../../models/User.mjs")).default;

const makeRes = () => ({
  status: vi.fn().mockReturnThis(),
  json: vi.fn(),
});

const makeReq = (overrides = {}) => ({
  userId: "user123",
  body: {},
  ...overrides,
});

const makeNext = () => vi.fn();

const expectError = (res, status, error) => {
  expect(res.status).toHaveBeenCalledWith(status);
  expect(res.json).toHaveBeenCalledWith(error);
};

afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

let changeAddress;
let getAddresses;
let changeActiveAddress;

beforeAll(async () => {
  const controller = await import("../../controller/addressController/index.mjs");
  changeAddress = controller.changeAddress;
  getAddresses = controller.getAddresses;
  changeActiveAddress = controller.changeActiveAddress;
});

const validAddressBody = {
  addressId: "507f1f77bcf86cd799439011",
  cep: "12345678",
  endereco: "Rua Example, 123",
  bairro: "Centro",
  cidade: "São Paulo",
  estado: "SP",
};

describe("changeAddress", () => {
  it("422 quando faltam parâmetros obrigatórios", async () => {
    const req = makeReq({ body: { addressId: "id" } });
    const res = makeRes();

    await changeAddress(req, res, makeNext());

    expectError(res, 422, {
      error: "Existem alguns parâmetros faltando para atualizar o endereço",
    });
  });

  it("422 quando type é inválido", async () => {
    const req = makeReq({ body: { ...validAddressBody, type: "Invalido" } });
    const res = makeRes();

    await changeAddress(req, res, makeNext());

    expect(res.status).toHaveBeenCalledWith(422);
  });

  it("200 quando endereço é atualizado usando req.userId", async () => {
    User.updateOne.mockResolvedValue({ modifiedCount: 1 });

    const req = makeReq({ body: validAddressBody });
    const res = makeRes();

    await changeAddress(req, res, makeNext());

    expect(User.updateOne).toHaveBeenCalledWith(
      { _id: "user123", "address._id": validAddressBody.addressId },
      expect.any(Object),
    );
    expectError(res, 200, { msg: "Atualização bem sucedida!" });
  });

  it("304 quando não há modificações", async () => {
    User.updateOne.mockResolvedValue({ modifiedCount: 0 });

    const req = makeReq({ body: validAddressBody });
    const res = makeRes();

    await changeAddress(req, res, makeNext());

    expectError(res, 304, { msg: "Não há nada para atualizar no endereço" });
  });

  it("propaga erro via next quando updateOne falha", async () => {
    const err = new Error("db down");
    User.updateOne.mockRejectedValue(err);

    const req = makeReq({ body: validAddressBody });
    const res = makeRes();
    const next = makeNext();

    await changeAddress(req, res, next);

    expect(next).toHaveBeenCalledWith(err);
  });
});

describe("getAddresses", () => {
  it("200 com lista de endereços usando req.userId", async () => {
    const addresses = [{ _id: "a1", cep: "12345678" }];
    User.findOne.mockReturnValue({ lean: vi.fn().mockResolvedValue({ address: addresses }) });

    const req = makeReq();
    const res = makeRes();

    await getAddresses(req, res, makeNext());

    expect(User.findOne).toHaveBeenCalledWith({ _id: "user123" }, { address: 1, _id: 0 });
    expectError(res, 200, { addresses });
  });

  it("200 com lista vazia quando usuário não tem endereços", async () => {
    User.findOne.mockReturnValue({ lean: vi.fn().mockResolvedValue({}) });

    const req = makeReq();
    const res = makeRes();

    await getAddresses(req, res, makeNext());

    expectError(res, 200, { addresses: [] });
  });

  it("404 quando usuário não é encontrado", async () => {
    User.findOne.mockReturnValue({ lean: vi.fn().mockResolvedValue(null) });

    const req = makeReq();
    const res = makeRes();

    await getAddresses(req, res, makeNext());

    expectError(res, 404, { error: "Usuário não encontrado" });
  });

  it("propaga erro via next quando findOne falha", async () => {
    const err = new Error("db down");
    User.findOne.mockReturnValue({ lean: vi.fn().mockRejectedValue(err) });

    const req = makeReq();
    const res = makeRes();
    const next = makeNext();

    await getAddresses(req, res, next);

    expect(next).toHaveBeenCalledWith(err);
  });
});

describe("changeActiveAddress", () => {
  it("422 quando addressId está ausente", async () => {
    const req = makeReq({ body: {} });
    const res = makeRes();

    await changeActiveAddress(req, res, makeNext());

    expectError(res, 422, { error: "ID do endereço é obrigatório" });
  });

  it("404 quando usuário não é encontrado", async () => {
    User.findOne.mockResolvedValue(null);

    const req = makeReq({ body: { addressId: "a1" } });
    const res = makeRes();

    await changeActiveAddress(req, res, makeNext());

    expectError(res, 404, { error: "Usuário não encontrado" });
  });

  it("200 quando endereço principal é atualizado", async () => {
    User.findOne.mockResolvedValue({ _id: "user123" });
    User.updateOne
      .mockResolvedValueOnce({ modifiedCount: 1 })
      .mockResolvedValueOnce({ modifiedCount: 1 });

    const req = makeReq({ body: { addressId: "a1" } });
    const res = makeRes();

    await changeActiveAddress(req, res, makeNext());

    expect(User.findOne).toHaveBeenCalledWith({ _id: "user123" });
    expectError(res, 200, { msg: "Endereço principal atualizado com sucesso!" });
  });

  it("304 quando nada muda", async () => {
    User.findOne.mockResolvedValue({ _id: "user123" });
    User.updateOne
      .mockResolvedValueOnce({ modifiedCount: 0 })
      .mockResolvedValueOnce({ modifiedCount: 0 });

    const req = makeReq({ body: { addressId: "a1" } });
    const res = makeRes();

    await changeActiveAddress(req, res, makeNext());

    expectError(res, 304, { msg: "Não houve alteração no endereço principal" });
  });

  it("propaga erro via next quando findOne falha", async () => {
    const err = new Error("db down");
    User.findOne.mockRejectedValue(err);

    const req = makeReq({ body: { addressId: "a1" } });
    const res = makeRes();
    const next = makeNext();

    await changeActiveAddress(req, res, next);

    expect(next).toHaveBeenCalledWith(err);
  });
});
