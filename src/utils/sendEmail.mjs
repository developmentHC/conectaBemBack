import config from "./../config/config.mjs";
import sgMail from "@sendgrid/mail";

sgMail.setApiKey(config.SENDGRID_API_KEY);

export async function sendEmail(to, OTP) {
  const msg = {
    to,
    from: "conectabem.auth@gmail.com",  
    subject: "Seu código de verificação",
    text: `Seu código de verificação é: ${OTP}`,
    html: `<p>Seu código de verificação é:</p><h2>${OTP}</h2>`,
  };

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const [response] = await sgMail.send(msg);

      if (response.statusCode === 202) {
        console.log(`✅ OTP enviado para ${to}`);
      }

      return {
        statusCode: response.statusCode,
        headers: response.headers
      };
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
