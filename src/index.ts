import express from 'express';
import mongoose from 'mongoose';
import swaggerUI from 'swagger-ui-express';
import router from './routes/route.ts';
import config from './config/config.ts';
import cookieParser from 'cookie-parser';
import swaggerFile from './../swagger-output.json' assert { type: "json" };;
const app = express();
app.use(cookieParser());
app.use(express.json());

app.use("/docs", swaggerUI.serve, swaggerUI.setup(swaggerFile));
app.get("/", (req, res) => {
  res.redirect('/docs');
});
app.use("/", router);

mongoose
  .connect(
    `mongodb+srv://${config.DB_USER}:${config.DB_PASSWORD}@cluster0.rczok.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`
  )
  .then(() => {
    app.listen(3000);
    console.log("Conectou ao banco com sucesso");
  })
  .catch((error) => console.log(error));


export default (req: any, res: any) => {
  app(req, res);
};