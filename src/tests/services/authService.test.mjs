vi.mock("bcrypt", () => ({
  __esModule: true,
  default: { compare: vi.fn(), genSalt: vi.fn(), hash: vi.fn() },
}));
vi.mock("../../models/User.mjs", () => ({
  __esModule: true,
  default: { findOne: vi.fn(), findByIdAndUpdate: vi.fn() },
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

const AuthService = (await import("../../services/authService.mjs")).default;
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

  it("deve autenticar patient@test.conectabem.com com OTP 000000 sem chamar bcrypt.compare", async () => {
    const user = mockUser();
    User.findOne.mockResolvedValue(user);
    User.findByIdAndUpdate.mockResolvedValue(user);

    const result = await AuthService.loginWithOtp("patient@test.conectabem.com", "000000");

    expect(result).toMatchObject({ message: expect.any(String), token: expect.any(String) });
    expect(bcrypt.compare).not.toHaveBeenCalled();
  });

  it("deve autenticar professional@test.conectabem.com com OTP 000000", async () => {
    const user = mockUser({ email: "professional@test.conectabem.com" });
    User.findOne.mockResolvedValue(user);
    User.findByIdAndUpdate.mockResolvedValue(user);

    const result = await AuthService.loginWithOtp("professional@test.conectabem.com", "000000");

    expect(result).toMatchObject({ message: expect.any(String), token: expect.any(String) });
    expect(bcrypt.compare).not.toHaveBeenCalled();
  });

  it("deve rejeitar OTP errado para @test.conectabem.com (chama bcrypt.compare)", async () => {
    const user = mockUser();
    User.findOne.mockResolvedValue(user);
    bcrypt.compare.mockResolvedValue(false);

    await expect(
      AuthService.loginWithOtp("patient@test.conectabem.com", "1234"),
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  it("deve rejeitar OTP 000000 para domínio não-teste", async () => {
    const user = mockUser({ email: "user@normal.com" });
    User.findOne.mockResolvedValue(user);
    bcrypt.compare.mockResolvedValue(false);

    await expect(AuthService.loginWithOtp("user@normal.com", "000000")).rejects.toMatchObject({
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

  it("deve rejeitar OTP 000000 para @test.conectabem.com em produção", async () => {
    const user = mockUser();
    User.findOne.mockResolvedValue(user);
    bcrypt.compare.mockResolvedValue(false);

    await expect(
      AuthService.loginWithOtp("patient@test.conectabem.com", "000000"),
    ).rejects.toMatchObject({ statusCode: 401 });
  });
});

describe("bypass desabilitado — TEST_OTP_ENABLED não definido ou inválido", () => {
  const originalEnv = process.env;

  afterEach(() => {
    process.env = originalEnv;
  });

  it("deve rejeitar OTP 000000 quando TEST_OTP_ENABLED não está definido", async () => {
    process.env = { ...originalEnv, NODE_ENV: "test" };
    delete process.env.TEST_OTP_ENABLED;

    const user = mockUser();
    User.findOne.mockResolvedValue(user);
    bcrypt.compare.mockResolvedValue(false);

    await expect(
      AuthService.loginWithOtp("patient@test.conectabem.com", "000000"),
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  it("deve rejeitar OTP 000000 quando TEST_OTP_ENABLED=false", async () => {
    process.env = { ...originalEnv, NODE_ENV: "test", TEST_OTP_ENABLED: "false" };

    const user = mockUser();
    User.findOne.mockResolvedValue(user);
    bcrypt.compare.mockResolvedValue(false);

    await expect(
      AuthService.loginWithOtp("patient@test.conectabem.com", "000000"),
    ).rejects.toMatchObject({ statusCode: 401 });
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

    const result = await AuthService.loginWithOtp("user@conectabem.com", "1234");

    expect(result).toMatchObject({ message: expect.any(String), token: expect.any(String) });
    expect(bcrypt.compare).toHaveBeenCalled();
  });

  it("deve rejeitar usuário normal com OTP errado", async () => {
    const user = mockUser({ email: "user@conectabem.com" });
    User.findOne.mockResolvedValue(user);
    bcrypt.compare.mockResolvedValue(false);

    await expect(AuthService.loginWithOtp("user@conectabem.com", "wrong")).rejects.toMatchObject({
      statusCode: 401,
    });
  });

  it("deve rejeitar usuário não encontrado", async () => {
    User.findOne.mockResolvedValue(null);

    await expect(AuthService.loginWithOtp("email@inexistente.com", "1234")).rejects.toMatchObject({
      statusCode: 404,
    });
  });
});
