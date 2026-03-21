import crypto from "node:crypto";

export const generateOTP = () => {
  return crypto.randomInt(1000, 9999);
};
