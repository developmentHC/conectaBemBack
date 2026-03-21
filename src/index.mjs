import path from "node:path";
import { fileURLToPath } from "node:url";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { connectDB } from "./lib/db.mjs";
import router, { corsOptions } from "./routes/index.mjs";
import { startInboxMessageWatcher } from "./watchers/inboxMessageWatcher.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(cookieParser());
app.use(express.json());

app.use(express.static(path.join(__dirname, "..")));

app.get("/swagger-output.json", (_req, res) => {
  res.sendFile(path.join(__dirname, "..", "swagger-output.json"));
});

app.get("/favicon.ico", (_req, res) => {
  res.redirect("https://unpkg.com/swagger-ui-dist/favicon-32x32.png");
});

app.get("/docs", (_req, res) => {
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

app.get("/", (_req, res) => res.redirect("/docs"));

app.use("/", router);

connectDB()
  .then(() => {
    const env = process.env.NODE_ENV || "development";
    const port = process.env.PORT || 3000;
    console.log(`[ENV] Ambiente: ${env}`);
    console.log(`[SERVER] Inicializando aplicação...`);
    console.log(`[DB] MongoDB conectado com sucesso`);

    startInboxMessageWatcher();
    console.log(`[WATCHER] InboxMessage watcher iniciado`);

    app.listen(port, () => {
      console.log(`[DOCS] Swagger disponível em: http://localhost:${port}/docs`);
      console.log(`[SERVER] Servidor rodando em http://localhost:${port}`);
    });
  })
  .catch((error) => console.log(error));
