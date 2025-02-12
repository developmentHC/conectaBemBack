  import config from "./../config/config.mjs";
  import sgMail from "@sendgrid/mail";

  sgMail.setApiKey(config.SENDGRID_API_KEY);

  export async function sendEmail(to, OTP) {
    const msg = {
      to: to,
      from: "contatoprojsj@gmail.com",
      subject: "Seu código de verificação",
      text: `Seu código OTP está logo abaixo: ${OTP}`,
      html: `<strong>Seu código OTP está logo abaixo: ${OTP}</strong>`,
    };
    try {
      await sgMail.send(msg).then(() => {
        console.log("Email sent");
      });
      return true;
    } catch (err) {
      console.error(err);
      throw err;
    }
  }
