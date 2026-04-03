vi.mock("bcrypt", () => ({
  __esModule: true,
  default: { compare: vi.fn(), genSalt: vi.fn(), hash: vi.fn() },
}));
vi.mock("../../models/User.mjs", () => ({
  __esModule: true,
  default: { findOne: vi.fn(), findByIdAndUpdate: vi.fn(), updateOne: vi.fn() },
}));
vi.mock("jsonwebtoken", () => ({
  __esModule: true,
  default: { sign: vi.fn().mockReturnValue("fake-token") },
}));
vi.mock("../../utils/ApiError.mjs", () => ({
  __esModule: true,
  createApiError: vi.fn((msg, code) => {
    const e = new Error(msg);
    e.statusCode = code;
    return e;
  }),
}));

import { loginWithOtp, verifyRegistrationOtp } from "../../services/authService.mjs";

const bcrypt = (await import("bcrypt")).default;
const User = (await import("../../models/User.mjs")).default;

const mockUser = (overrides = {}) => ({
  _id: "user123",
  email: "patient@test.conectabem.com",
  hashedOTP: "hashed-real-otp",
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("bypass ativo (NODE_ENV=test, TEST_OTP_ENABLED=true)", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv, NODE_ENV: "test", TEST_OTP_ENABLED: "true" };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("deve autenticar patient@test.conectabem.com com OTP 0000 sem chamar bcrypt.compare", async () => {
    const user = mockUser();
    User.findOne.mockResolvedValue(user);
    User.findByIdAndUpdate.mockResolvedValue(user);

    const result = await loginWithOtp("patient@test.conectabem.com", "0000");

    expect(result).toMatchObject({ message: expect.any(String), token: expect.any(String) });
    expect(bcrypt.compare).not.toHaveBeenCalled();
  });

  it("deve autenticar professional@test.conectabem.com com OTP 0000", async () => {
    const user = mockUser({ email: "professional@test.conectabem.com" });
    User.findOne.mockResolvedValue(user);
    User.findByIdAndUpdate.mockResolvedValue(user);

    const result = await loginWithOtp("professional@test.conectabem.com", "0000");

    expect(result).toMatchObject({ message: expect.any(String), token: expect.any(String) });
    expect(bcrypt.compare).not.toHaveBeenCalled();
  });

  it("deve rejeitar OTP errado para @test.conectabem.com (chama bcrypt.compare)", async () => {
    const user = mockUser();
    User.findOne.mockResolvedValue(user);
    bcrypt.compare.mockResolvedValue(false);

    await expect(loginWithOtp("patient@test.conectabem.com", "1234")).rejects.toMatchObject({
      statusCode: 401,
    });
  });

  it("deve rejeitar OTP 0000 para domínio não-teste", async () => {
    const user = mockUser({ email: "user@normal.com" });
    User.findOne.mockResolvedValue(user);
    bcrypt.compare.mockResolvedValue(false);

    await expect(loginWithOtp("user@normal.com", "0000")).rejects.toMatchObject({
      statusCode: 401,
    });
  });
});

describe("bypass desabilitado — NODE_ENV=production", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv, NODE_ENV: "production", TEST_OTP_ENABLED: "true" };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("deve rejeitar OTP 0000 para @test.conectabem.com em produção", async () => {
    const user = mockUser();
    User.findOne.mockResolvedValue(user);
    bcrypt.compare.mockResolvedValue(false);

    await expect(loginWithOtp("patient@test.conectabem.com", "0000")).rejects.toMatchObject({
      statusCode: 401,
    });
  });
});

describe("bypass desabilitado — TEST_OTP_ENABLED não definido ou inválido", () => {
  const originalEnv = process.env;

  afterEach(() => {
    process.env = originalEnv;
  });

  it("deve rejeitar OTP 0000 quando TEST_OTP_ENABLED não está definido", async () => {
    process.env = { ...originalEnv, NODE_ENV: "test" };
    delete process.env.TEST_OTP_ENABLED;

    const user = mockUser();
    User.findOne.mockResolvedValue(user);
    bcrypt.compare.mockResolvedValue(false);

    await expect(loginWithOtp("patient@test.conectabem.com", "0000")).rejects.toMatchObject({
      statusCode: 401,
    });
  });

  it("deve rejeitar OTP 0000 quando TEST_OTP_ENABLED=false", async () => {
    process.env = { ...originalEnv, NODE_ENV: "test", TEST_OTP_ENABLED: "false" };

    const user = mockUser();
    User.findOne.mockResolvedValue(user);
    bcrypt.compare.mockResolvedValue(false);

    await expect(loginWithOtp("patient@test.conectabem.com", "0000")).rejects.toMatchObject({
      statusCode: 401,
    });
  });
});

describe("fluxo normal inalterado (emails fora do domínio de teste)", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv, NODE_ENV: "test", TEST_OTP_ENABLED: "true" };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("deve autenticar usuário normal com OTP correto", async () => {
    const user = mockUser({ email: "user@conectabem.com" });
    User.findOne.mockResolvedValue(user);
    bcrypt.compare.mockResolvedValue(true);
    User.findByIdAndUpdate.mockResolvedValue(user);

    const result = await loginWithOtp("user@conectabem.com", "1234");

    expect(result).toMatchObject({ message: expect.any(String), token: expect.any(String) });
    expect(bcrypt.compare).toHaveBeenCalled();
  });

  it("deve rejeitar usuário normal com OTP errado", async () => {
    const user = mockUser({ email: "user@conectabem.com" });
    User.findOne.mockResolvedValue(user);
    bcrypt.compare.mockResolvedValue(false);

    await expect(loginWithOtp("user@conectabem.com", "wrong")).rejects.toMatchObject({
      statusCode: 401,
    });
  });

  it("deve rejeitar usuário não encontrado", async () => {
    User.findOne.mockResolvedValue(null);

    await expect(loginWithOtp("email@inexistente.com", "1234")).rejects.toMatchObject({
      statusCode: 404,
    });
  });
});

describe("verifyRegistrationOtp — bypass ativo", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv, NODE_ENV: "test", TEST_OTP_ENABLED: "true" };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("deve verificar @test.conectabem.com com OTP '0000' sem chamar bcrypt.compare", async () => {
    const user = mockUser({ status: "pending" });
    User.findOne.mockResolvedValue(user);
    User.updateOne.mockResolvedValue({});

    await verifyRegistrationOtp("patient@test.conectabem.com", "0000");

    expect(bcrypt.compare).not.toHaveBeenCalled();
    expect(User.updateOne).toHaveBeenCalledWith(
      { _id: user._id },
      { $set: { status: "verified" }, $unset: { hashedOTP: "" } },
    );
  });

  it("deve rejeitar bypass em NODE_ENV=production", async () => {
    process.env = { ...originalEnv, NODE_ENV: "production", TEST_OTP_ENABLED: "true" };
    const user = mockUser({ status: "pending" });
    User.findOne.mockResolvedValue(user);
    bcrypt.compare.mockResolvedValue(false);

    await expect(
      verifyRegistrationOtp("patient@test.conectabem.com", "0000"),
    ).rejects.toMatchObject({ statusCode: 401 });

    expect(bcrypt.compare).toHaveBeenCalled();
  });

  it("deve rejeitar bypass sem TEST_OTP_ENABLED=true", async () => {
    process.env = { ...originalEnv, NODE_ENV: "test" };
    delete process.env.TEST_OTP_ENABLED;
    const user = mockUser({ status: "pending" });
    User.findOne.mockResolvedValue(user);
    bcrypt.compare.mockResolvedValue(false);

    await expect(
      verifyRegistrationOtp("patient@test.conectabem.com", "0000"),
    ).rejects.toMatchObject({ statusCode: 401 });

    expect(bcrypt.compare).toHaveBeenCalled();
  });

  it("deve usar bcrypt.compare para domínio normal", async () => {
    const user = mockUser({ email: "user@conectabem.com", status: "pending" });
    User.findOne.mockResolvedValue(user);
    bcrypt.compare.mockResolvedValue(true);
    User.updateOne.mockResolvedValue({});

    await verifyRegistrationOtp("user@conectabem.com", "0000");

    expect(bcrypt.compare).toHaveBeenCalled();
  });

  it("deve rejeitar usuário não encontrado", async () => {
    User.findOne.mockResolvedValue(null);

    await expect(
      verifyRegistrationOtp("naoexiste@test.conectabem.com", "0000"),
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it("deve rejeitar usuário com status diferente de pending", async () => {
    const user = mockUser({ status: "verified" });
    User.findOne.mockResolvedValue(user);

    await expect(
      verifyRegistrationOtp("patient@test.conectabem.com", "0000"),
    ).rejects.toMatchObject({ statusCode: 400 });
  });
});
