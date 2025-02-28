import express from 'express';
import mongoose from 'mongoose';
import router from './routes/route.mjs';
import swaggerUI from 'swagger-ui-express';
import swaggerFile from './../swagger-output.json' with {type: 'json'};
import config from './config/config.mjs';
import cookieParser from 'cookie-parser';

const isProduction = process.env.NODE_ENV === "production";
const app = express();
app.use(cookieParser());
app.use(express.json());

app.use("/docs", swaggerUI.serve, swaggerUI.setup(swaggerFile));
app.get("/", (req, res) => { res.redirect('/docs'); });
app.use("/", router);

mongoose
  .connect(
    `mongodb+srv://${config.DB_USER}:${config.DB_PASSWORD}@cluster0.rczok.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`
  )
  .then(() => {
    !isProduction && app.listen(3000);
    console.log("Conectou ao banco com sucesso");
  })
  .catch((error) => console.log(error));
