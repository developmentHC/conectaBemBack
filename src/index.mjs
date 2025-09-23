import express from "express";
import cors from "cors";
import { corsOptions } from "./routes/index.mjs";
import router from "./routes/index.mjs";
import swaggerUi from "swagger-ui-express";
import swaggerFile from "./../swagger-output.json" with { type: "json" };
import cookieParser from "cookie-parser";
import { connectDB } from "./lib/db.mjs";
import { initializeGridFS } from "./lib/gridFs.mjs";
import { startInboxMessageWatcher } from "./watchers/inboxMessageWatcher.mjs";

const app = express();

app.use(cors(corsOptions));   
app.options("*", cors(corsOptions))
app.use(cookieParser());
app.use(express.json());

app.use(
  "/docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerFile, {
    customSiteTitle: "API Docs",
    customCssUrl: "https://unpkg.com/swagger-ui-dist@4.18.1/swagger-ui.css",
  })
);

app.get("/", (req, res) => res.redirect("/docs"));
app.use("/", router);

connectDB()
  .then(() => {
    startInboxMessageWatcher();
    app.listen(3000);
    console.log("Conectou ao banco com sucesso");
  })
  .catch((error) => console.log(error));

initializeGridFS();
