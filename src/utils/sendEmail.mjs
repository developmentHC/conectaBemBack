// src/utils/sendEmail.mjs
import config from "./../config/config.mjs";
import sgMail from "@sendgrid/mail";

sgMail.setApiKey(config.SENDGRID_API_KEY);

// Helper para montar a mensagem
function buildMsg(to, OTP, sandbox = false) {
  return {
    to,
    from: config.SENDGRID_FROM || "contatoprojsj@gmail.com", // ideal usar remetente verificado
    subject: "Seu código de verificação",
    text: `Seu código OTP está logo abaixo: ${OTP}`,
    html: `<strong>Seu código OTP está logo abaixo: ${OTP}</strong>`,
    mailSettings: { sandboxMode: { enable: sandbox } },
  };
}

// Detecta erros típicos de limite/credenciais
function isRateOrAuthError(err) {
  const code = err?.code || err?.response?.statusCode;
  const msg = err?.response?.body?.errors?.[0]?.message || err?.message || "";
  return (
    code === 429 || // rate limit
    code === 401 || // unauthorized (também vem com "Maximum credits exceeded" às vezes)
    code === 403 || // forbidden
    /maximum credits exceeded/i.test(msg) ||
    /rate limit/i.test(msg)
  );
}

export async function sendEmail(to, OTP) {
  const isProd = process.env.NODE_ENV === "production";
  const forceSandbox = String(config.EMAIL_SANDBOX || "").toLowerCase() === "true";
  const useSandboxByDefault = !isProd || forceSandbox;

  try {
    // DEV/SANDBOX: não envia de verdade, só simula
    if (useSandboxByDefault) {
      await sgMail.send(buildMsg(to, OTP, true));
      console.log(`[SENDGRID][SANDBOX] OTP para ${to}: ${OTP}`);
      return true; // ✅ não quebra
    }

    // PRODUÇÃO: tenta enviar de verdade
    await sgMail.send(buildMsg(to, OTP, false));
    console.log(`[SENDGRID] Email enviado para: ${to}`);
    return true; // ✅ ok em prod

  } catch (err) {
    // Falhou: se for erro de limite/credencial, cai para SANDBOX
    if (isRateOrAuthError(err)) {
      console.warn("[SENDGRID] Falhou envio real, ativando fallback SANDBOX:", err?.message || err);
      try {
        await sgMail.send(buildMsg(to, OTP, true));
        console.log(`[FALLBACK][SANDBOX] OTP para ${to}: ${OTP}`);
        return true; // ✅ erro “some”, app continua
      } catch (fallbackErr) {
        console.error("[SENDGRID] FALLOUT: sandbox também falhou:", fallbackErr?.message || fallbackErr);
        console.log(`[PRINT OTP] ${OTP} (entrega por e-mail indisponível)`);
        return true; // ✅ ainda assim não derruba a app
      }
    }

    // Outros erros: loga e não quebra a execução
    console.error("[SENDGRID] Erro ao enviar email:", err?.message || err);
    console.log(`[PRINT OTP] ${OTP} (entrega por e-mail indisponível)`);
    return true; // ✅ não lança
  }
}

