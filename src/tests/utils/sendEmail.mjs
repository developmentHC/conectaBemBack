import { jest } from "@jest/globals";

jest.unstable_mockModule("nodemailer", () => ({
  __esModule: true,
  default: {
    createTransport: jest.fn(() => ({
      sendMail: jest.fn().mockResolvedValue({ messageId: "123" }),
    })),
  },
}));

const { default: sendEmail } = await import("../../utils/sendEmail.mjs");
import nodemailer from "nodemailer";

describe("sendEmail", () => {
  it("envia e-mail com sucesso", async () => {
    const result = await sendEmail({
      to: "user@example.com",
      subject: "Teste",
      text: "Olá!",
    });

    expect(nodemailer.createTransport).toHaveBeenCalled();
    expect(result).toEqual({ messageId: "123" });
  });

  it("lança erro se envio falhar", async () => {
    nodemailer.createTransport.mockReturnValueOnce({
      sendMail: jest.fn().mockRejectedValue(new Error("SMTP error")),
    });

    await expect(
      sendEmail({ to: "fail@example.com", subject: "Fail", text: "Erro" })
    ).rejects.toThrow("SMTP error");
  });
});
