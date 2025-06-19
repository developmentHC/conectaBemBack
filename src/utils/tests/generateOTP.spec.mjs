import { expect, it } from "vitest";
import { generateOTP } from "../generateOTP.mjs";

describe("generateOTP", () => {
  it("deve retornar um número", () => {
    const OTP = generateOTP();

    expect(typeof otp).toBe("number");
  });

  it("deve retornar um número de quatro dígitos", () => {
    const OTP = generateOTP();

    expect(otp).toBeGreaterThanOrEqual(1000);
    expect(otp).toBeLessThanOrEqual(9999);
  });

  it("deve gerar diferentes OTPs em chamadas subsequentes", () => {
    const otp1 = generateOTP();
    const otp2 = generateOTP();
    expect(otp1).not.toEqual(otp2);
  });

  it("deve retornar um número dentro do intervalo esperado", () => {
    const OTP = generateOTP();

    expect(otp).toBeGreaterThanOrEqual(1000);
    expect(otp).toBeLessThanOrEqual(9999);
  });

  it("não deve retornar valores undefined ou null", () => {
    const OTP = generateOTP();

    expect(otp).not.toBeUndefined();
    expect(otp).not.toBeNull();
  });

  it("não deve retornar valores negativos", () => {
    const OTP = generateOTP();

    expect(otp).toBeGreaterThanOrEqual(0);
  });
});
