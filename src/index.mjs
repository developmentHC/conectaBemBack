import express from 'express';
import mongoose from 'mongoose';
import router from './routes/index.mjs';
import swaggerUi from 'swagger-ui-express';
import swaggerFile from './../swagger-output.json' with {type: 'json'};
import config from './config/config.mjs';
import cookieParser from 'cookie-parser';

const app = express();
app.use(cookieParser());
app.use(express.json());

app.use(
  '/docs',
  swaggerUi.serve,
  (req, res, next) => {
    swaggerUi.setup(swaggerFile, {
      customSiteTitle: "API Docs",
      customCssUrl: 'https://unpkg.com/swagger-ui-dist@4.18.1/swagger-ui.css',
      customJs: [
        'https://unpkg.com/swagger-ui-dist@4.18.1/swagger-ui-bundle.js',
        'https://unpkg.com/swagger-ui-dist@4.18.1/swagger-ui-standalone-preset.js'
      ]
    })(req, res, next);
  }
);

app.get("/", (req, res) => { res.redirect('/docs'); });
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