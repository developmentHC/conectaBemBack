import { jest } from "@jest/globals";

jest.unstable_mockModule("jsonwebtoken", () => ({
  __esModule: true,
  default: {
    verify: jest.fn(),
  },
  verify: jest.fn(),
}));

const jwt = (await import("jsonwebtoken")).default;
const { authenticateToken } = await import("../../middleware/authmiddleware.mjs");

const makeRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};
const makeReq = (headers = {}) => ({ headers });
const makeNext = () => jest.fn();

afterEach(() => {
  jest.clearAllMocks();
});

describe("authenticateToken middleware", () => {
  it("401 se não houver header Authorization", async () => {
    const req = makeReq({});
    const res = makeRes();
    const next = makeNext();

    await authenticateToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: "Acesso negado. Token não fornecido ou mal formatado.",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("401 se Authorization não começar com Bearer", async () => {
    const req = makeReq({ authorization: "Token abc123" });
    const res = makeRes();
    const next = makeNext();

    await authenticateToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: "Acesso negado. Token não fornecido ou mal formatado.",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("403 se token expirado", async () => {
    jwt.verify.mockImplementation(() => {
      const err = new Error("jwt expired");
      err.name = "TokenExpiredError";
      throw err;
    });

    const req = makeReq({ authorization: "Bearer expiredtoken" });
    const res = makeRes();
    const next = makeNext();

    await authenticateToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: "Token expirado." });
    expect(next).not.toHaveBeenCalled();
  });

  it("403 se token inválido", async () => {
    jwt.verify.mockImplementation(() => {
      throw new Error("invalid token");
    });

    const req = makeReq({ authorization: "Bearer invalidtoken" });
    const res = makeRes();
    const next = makeNext();

    await authenticateToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: "Token inválido." });
    expect(next).not.toHaveBeenCalled();
  });

  it("passa adiante se token válido", async () => {
    jwt.verify.mockReturnValue({ userId: "user123" });

    const req = makeReq({ authorization: "Bearer validtoken" });
    const res = makeRes();
    const next = makeNext();

    await authenticateToken(req, res, next);

    expect(req.userId).toBe("user123");
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});
