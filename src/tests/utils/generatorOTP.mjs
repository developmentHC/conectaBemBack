import { jest } from "@jest/globals";
import generatorOTP from "../../utils/generatorOTP.mjs";

describe("generatorOTP", () => {
  it("gera uma string com 6 dígitos", () => {
    const otp = generatorOTP();
    expect(otp).toHaveLength(6);
    expect(/^\d{6}$/.test(otp)).toBe(true);
  });

  it("gera OTPs diferentes em chamadas consecutivas", () => {
    const otp1 = generatorOTP();
    const otp2 = generatorOTP();
    expect(otp1).not.toEqual(otp2);
  });
});
