import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.mjs";
import { createApiError } from "../utils/ApiError.mjs";

class AuthService {
  static async loginWithOtp(email, otp) {
    const user = await User.findOne({ email });
    if (!user) {
      throw createApiError("Usuário não encontrado.", 404);
    }

    const isTestBypassActive =
      process.env.NODE_ENV !== "production" &&
      process.env.TEST_OTP_ENABLED === "true" &&
      email.endsWith("@test.conectabem.com") &&
      otp === "0000";

    if (!isTestBypassActive) {
      const isOtpValid = await bcrypt.compare(otp, user.hashedOTP);
      if (!isOtpValid) {
        throw createApiError("Código OTP está incorreto!", 401);
      }
    }

    const accessToken = jwt.sign({ userId: user._id }, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: "1h",
    });

    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { $unset: { hashedOTP: "" } },
      { new: true, select: "-hashedOTP -__v" },
    );

    return {
      message: "Autenticação bem sucedida!",
      token: accessToken,
      user: updatedUser,
    };
  }

  const isOtpValid = await bcrypt.compare(otp, user.hashedOTP);
  if (!isOtpValid) {
    throw createApiError("Código OTP está incorreto!", 401);
  }

  const accessToken = jwt.sign({ userId: user._id }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "1h",
  });

  const updatedUser = await User.findByIdAndUpdate(
    user._id,
    { $unset: { hashedOTP: "" } },
    { new: true, select: "-hashedOTP -__v" },
  );

  return {
    message: "Autenticação bem sucedida!",
    token: accessToken,
    user: updatedUser,
  };
}

export async function verifyRegistrationOtp(email, otp) {
  const user = await User.findOne({ email });
  if (!user) {
    throw createApiError("Usuário não encontrado.", 404);
  }
    const isTestBypassActive =
      process.env.NODE_ENV !== "production" &&
      process.env.TEST_OTP_ENABLED === "true" &&
      email.endsWith("@test.conectabem.com") &&
      otp === "0000";

    if (!isTestBypassActive) {
      const isOtpValid = await bcrypt.compare(otp, user.hashedOTP);
      if (!isOtpValid) {
        throw createApiError("Código OTP está incorreto!", 401);
      }
    }

  if (user.status !== "pending") {
    throw createApiError("Esta conta não está mais pendente de verificação.", 400);
  }

  const isOtpValid = await bcrypt.compare(otp, user.hashedOTP);
  if (!isOtpValid) {
    throw createApiError("Código OTP está incorreto!", 401);
  }

  await User.updateOne(
    { _id: user._id },
    { $set: { status: "verified" }, $unset: { hashedOTP: "" } },
  );

  return;
}
