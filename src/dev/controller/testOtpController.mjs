import { generateOTP } from "../../modules/auth/service/otpService.mjs";

export const generateTestOTP = async (req, res) => {
  try {
    const otp = await generateOTP();

    console.log("🔐 OTP de teste gerado:", otp);
    
    return res.status(200).json({
      message: "OTP gerado com sucesso para teste",
    });
  } catch (error) {
    console.error("Erro ao gerar OTP de teste:", error);
    return res.status(500).json({
      message: "Erro ao gerar OTP de teste",
    });
  }
};
