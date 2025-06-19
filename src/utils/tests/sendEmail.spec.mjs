import { describe, it, expect, vi, beforeEach } from "vitest";
import { sendEmail } from "../sendEmail.mjs";
import sgMail from "@sendgrid/mail";

vi.mock("@sendgrid/mail");

describe("sendEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should send an email with the correct parameters", async () => {
    const to = "gustavomottacardoso1@gmail.com";
    const OTP = generateOTP();

    sgMail.send.mockResolvedValue({});

    await sendEmail(to, OTP);

    expect(sgMail.send).toHaveBeenCalledTimes(1);
    expect(sgMail.send).toHaveBeenCalledWith({
      to,
      from: "contatoprojsj@gmail.com",
      subject: "Seu código de verificação",
      text: "Seu código OTP está logo abaixo: 123456",
      html: "<strong>Seu código OTP está logo abaixo: 123456</strong>",
    });
  });

  it("should not be able to send the email", async () => {
    const to = "gustavomottacardoso1@gmail.com";
    const OTP = generateOTP();

    const errorMessage = "Erro ao enviar email";

    sgMail.send.mockRejectedValue(new Error(errorMessage));

    await expect(sendEmail(to, OTP)).rejects.toThrow(errorMessage);
  });
});
