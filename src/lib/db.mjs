import mongoose from "mongoose";
import config from "../config/config.mjs";

export const connectDB = async () => {
  try {
    await mongoose.connect(config.MONGODB_URI);
  } catch (error) {
    console.error("Erro ao conectar ao MongoDB:", error.message);
    process.exit(1);
  }
};
