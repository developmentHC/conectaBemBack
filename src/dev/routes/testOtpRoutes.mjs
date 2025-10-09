import express from "express";
import crypto from "crypto";

const router = express.Router();

/**
 * Endpoint de teste para gerar OTP (sem envio por e-mail).
 * Mostra o código diretamente no console.
 */
router.post("/auth/otp/test", async (req, res) => {
  try {
    const otp = crypto.randomInt(100000, 999999).toString();

    console.log(`🔐 OTP de teste gerado para ${req.body.email || "teste"}: ${otp}`);

    return res.status(200).json({
      message: "OTP gerado com sucesso para teste",
    });
  } catch (error) {
    console.error("Erro ao gerar OTP de teste:", error);
    return res.status(500).json({
      message: "Erro ao gerar OTP de teste",
    });
  }
});

export default router;