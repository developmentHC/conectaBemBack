import "dotenv/config";

export default {
  DB_USER: process.env.DB_USER,
  DB_PASSWORD: process.env.DP_PASSWORD,
  PORT: process.env.PORT || 3000,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET,
  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET,
};
