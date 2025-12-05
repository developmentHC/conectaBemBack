import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import { corsOptions } from "./routes/index.mjs";
import router from "./routes/index.mjs";
import cookieParser from "cookie-parser";
import { connectDB } from "./lib/db.mjs";
import { startInboxMessageWatcher } from "./watchers/inboxMessageWatcher.mjs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(cookieParser());
app.use(express.json());

app.use(express.static(path.join(__dirname, "..")));

app.get("/swagger-output.json", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "swagger-output.json"));
});

app.get("/favicon.ico", (req, res) => {
  res.redirect("https://unpkg.com/swagger-ui-dist/favicon-32x32.png");
});

app.get("/docs", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>API Docs</title>
        <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist/swagger-ui.css" />
        <link rel="icon" type="image/png" href="https://unpkg.com/swagger-ui-dist/favicon-32x32.png" />
      </head>
      <body>
        <div id="swagger-ui"></div>
        <script src="https://unpkg.com/swagger-ui-dist/swagger-ui-bundle.js"></script>
        <script src="https://unpkg.com/swagger-ui-dist/swagger-ui-standalone-preset.js"></script>
        <script>
          window.onload = () => {
            SwaggerUIBundle({
              url: '/swagger-output.json',
              dom_id: '#swagger-ui',
              presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
              layout: "BaseLayout"
            });
          };
        </script>
      </body>
    </html>
  `);
});

app.get("/", (req, res) => res.redirect("/docs"));

app.use("/", router);

connectDB()
  .then(() => {
    startInboxMessageWatcher();
    app.listen(3000);
    console.log("Conectou ao banco com sucesso");
  })
  .catch((error) => console.log(error));

