import "dotenv/config";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

export async function sendEmail(to, OTP) {
  const mailOptions = {
    from: `"ConectaBem" <${process.env.GMAIL_USER}>`,
    to,
    subject: "Seu código de verificação",
    html: `
      <p>Seu código de verificação é:</p>
      <h2>${OTP}</h2>
      <p>Este código expira em 10 minutos.</p>
    `,
  };

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const info = await transporter.sendMail(mailOptions);

      console.log(`✅ OTP enviado para ${to}`);
      return { status: "sent", id: info.messageId };

    } catch (err) {
      console.error(
        `❌ Erro ao enviar OTP para ${to} (tentativa ${attempt}):`,
        err.message
      );

      if (attempt < 3) {
        await new Promise((res) => setTimeout(res, 1000));
      } else {
        throw err;
      }
    }
  }
}