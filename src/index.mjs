import express from 'express';
import mongoose from 'mongoose';
import swaggerUI from 'swagger-ui-express';
import router from '../routes/route.mjs';
import config from '../config/config.mjs';
import cookieParser from 'cookie-parser';
import { createServerlessHandler } from '@vercel/node';

const app = express();
app.use(cookieParser());
app.use(express.json());

app.use("/docs", swaggerUI.serve, swaggerUI.setup(await import("../swagger-output.json", { assert: { type: "json" } })));

app.get("/", (req, res) => {
  res.redirect('/docs');
});
app.use("/", router);

const connectDB = async () => {
  if (!mongoose.connection.readyState) {
    await mongoose.connect(
      `mongodb+srv://${config.DB_USER}:${config.DB_PASSWORD}@cluster0.rczok.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`
    );
    console.log("Conectado ao banco com sucesso");
  }
};
await connectDB();

export default createServerlessHandler(app);
