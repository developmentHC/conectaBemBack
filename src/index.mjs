import express from 'express';
import mongoose from 'mongoose';
import swaggerUI from 'swagger-ui-express';
import router from '../routes/route.mjs'; // Ajuste o caminho conforme necessário
import config from '../config/config.mjs';
import cookieParser from 'cookie-parser';
import { createServerlessHandler } from '@vercel/node';

const app = express();
app.use(cookieParser());
app.use(express.json());

// Swagger
app.use("/docs", swaggerUI.serve, swaggerUI.setup(await import("../swagger-output.json", { assert: { type: "json" } })));

// Rotas
app.get("/", (req, res) => {
  res.redirect('/docs');
});
app.use("/", router);

// Conectar ao MongoDB apenas uma vez
const connectDB = async () => {
  if (!mongoose.connection.readyState) {
    await mongoose.connect(
      `mongodb+srv://${config.DB_USER}:${config.DB_PASSWORD}@cluster0.rczok.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`
    );
    console.log("Conectado ao banco com sucesso");
  }
};
await connectDB();

// Exportar o handler para a Vercel
export default createServerlessHandler(app);
