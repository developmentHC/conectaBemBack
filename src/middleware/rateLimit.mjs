import rateLimit from "express-rate-limit";

export const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    error: "Muitas tentativas. Tente novamente em 15 minutos.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
