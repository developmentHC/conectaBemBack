import { Resend } from "resend";
import config from "./../config/config.mjs";

const resend = new Resend(config.RESEND_API_KEY);

export async function sendEmail(to, OTP) {
  const msg = {
    from: "ConectaBem <onboarding@resend.dev>",
    to,
    subject: "Seu código de verificação",
    html: `<strong>Seu código OTP está logo abaixo: ${OTP}</strong>`,
    text: `Seu código OTP está logo abaixo: ${OTP}`,
  };

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await resend.emails.send(msg);

      if (!response.error) {
        console.log(`✅ OTP enviado para ${to} usando Resend`);
        return {
          statusCode: 200,
          message: "Email enviado com sucesso",
        };
      }

      throw response.error;

    } catch (err) {
      console.error(
        `❌ Erro ao enviar OTP para ${to} (tentativa ${attempt}):`,
        err?.message || err
      );

      if (attempt < 3) {
        await new Promise((res) => setTimeout(res, 1000));
      } else {
        throw err;
      }
    }
  }
}
