vi.mock("mongoose", () => ({
  __esModule: true,
  default: {
    connect: vi.fn().mockResolvedValue(undefined),
    disconnect: vi.fn().mockResolvedValue(undefined),
  },
}));
vi.mock("bcrypt", () => ({
  __esModule: true,
  default: {
    hash: vi.fn().mockResolvedValue("hashed-000000"),
  },
}));
vi.mock("../../../models/User.mjs", () => ({
  __esModule: true,
  default: {
    updateOne: vi.fn().mockResolvedValue({ upsertedCount: 1 }),
  },
}));

const { main } = await import("../../../../scripts/seedTestUsers.mjs");
const User = (await import("../../../models/User.mjs")).default;
const bcrypt = (await import("bcrypt")).default;
const mongoose = (await import("mongoose")).default;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("seedTestUsers", () => {
  it("deve chamar User.updateOne para patient@test.conectabem.com com campos corretos", async () => {
    await main();

    expect(User.updateOne).toHaveBeenCalledWith(
      { email: "patient@test.conectabem.com" },
      {
        $set: expect.objectContaining({
          status: "completed",
          userType: ["patient"],
          hashedOTP: "hashed-000000",
        }),
      },
      { upsert: true },
    );
  });

  it("deve chamar User.updateOne para professional@test.conectabem.com com campos corretos", async () => {
    await main();

    expect(User.updateOne).toHaveBeenCalledWith(
      { email: "professional@test.conectabem.com" },
      {
        $set: expect.objectContaining({
          status: "completed",
          userType: ["professional"],
          professionalSpecialties: ["Acupuntura"],
          CNPJCPFProfissional: "000.000.000-00",
          hashedOTP: "hashed-000000",
        }),
      },
      { upsert: true },
    );
  });

  it("deve chamar User.updateOne exatamente 2 vezes por execução (idempotência)", async () => {
    await main();
    await main();

    expect(User.updateOne).toHaveBeenCalledTimes(4);
  });

  it("deve chamar bcrypt.hash com '000000' e saltRounds 10", async () => {
    await main();

    expect(bcrypt.hash).toHaveBeenCalledWith("000000", 10);
    expect(bcrypt.hash).toHaveBeenCalledTimes(1);
  });

  it("deve chamar mongoose.disconnect no finally mesmo se connect lançar erro", async () => {
    mongoose.connect.mockRejectedValueOnce(new Error("connection failed"));

    await expect(main()).rejects.toThrow("connection failed");

    expect(mongoose.disconnect).toHaveBeenCalledTimes(1);
  });
});
