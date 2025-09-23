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

initializeGridFS();
