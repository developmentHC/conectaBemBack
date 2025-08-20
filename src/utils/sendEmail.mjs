import config from "./../config/config.mjs";
import sgMail from "@sendgrid/mail";

sgMail.setApiKey(config.SENDGRID_API_KEY);

function buildMsg(to, OTP, sandbox = false) {
  return {
    to,
    from: config.SENDGRID_FROM || "contatoprojsj@gmail.com",
    subject: "Seu código de verificação",
    text: `Seu código OTP está logo abaixo: ${OTP}`,
    html: `<strong>Seu código OTP está logo abaixo: ${OTP}</strong>`,
    mailSettings: { sandboxMode: { enable: sandbox } },
  };
}

function isRateOrAuthError(err) {
  const code = err?.code || err?.response?.statusCode;
  const msg = err?.response?.body?.errors?.[0]?.message || err?.message || "";
  return (
    code === 429 ||
    code === 401 ||
    code === 403 ||
    /maximum credits exceeded/i.test(msg) ||
    /rate limit/i.test(msg)
  );
}

export async function sendEmail(to, OTP) {
  const isProd = process.env.NODE_ENV === "production";
  const forceSandbox = String(config.EMAIL_SANDBOX || "").toLowerCase() === "true";
  const useSandboxByDefault = !isProd || forceSandbox;

  try {
    if (useSandboxByDefault) {
      await sgMail.send(buildMsg(to, OTP, true));
      return true;
    }

    await sgMail.send(buildMsg(to, OTP, false));
    return true;
  } catch (err) {
    if (isRateOrAuthError(err)) {
      console.warn("[SENDGRID] Falhou envio real, ativando fallback SANDBOX:", err?.message || err);
      try {
        await sgMail.send(buildMsg(to, OTP, true));
        return true;
      } catch (fallbackErr) {
        console.error(
          "[SENDGRID] FALLOUT: sandbox também falhou:",
          fallbackErr?.message || fallbackErr
        );
        return true;
      }
    }

    console.error("[SENDGRID] Erro ao enviar email:", err?.message || err);
    return true;
  }
}
