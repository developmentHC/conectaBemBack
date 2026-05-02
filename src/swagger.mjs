import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import glob from "glob";
import swaggerAutogen from "swagger-autogen";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
const vercelUrl = process.env.VERCEL_URL;

const _host = isProduction ? vercelUrl : `localhost:${process.env.PORT || 3000}`;
const _schemes = isProduction ? ["https"] : ["http"];

export const sharedProperties = {
  userId: {
    type: "string",
    example: "689dd16cfc1851d20da42b55",
  },
  name: {
    type: "string",
    example: "João Silva",
  },
  birthdayDate: {
    type: "number",
    example: 1632824400000,
  },
};

const baseUrl = isProduction
  ? `https://${vercelUrl || "localhost:3000"}`
  : `http://localhost:${process.env.PORT || 3000}`;

const doc = {
  info: {
    version: "1.0.0",
    title: "ConectaBem APIs",
    description: "APIs para o projeto ConectaBem",
  },
  servers: [{ url: baseUrl }],
  tags: [
    {
      name: "Authentication",
      description: "Endpoints relacionados a autenticação do usuário",
    },
    {
      name: "User",
      description: "Endpoints relacionados ao usuário",
    },
    {
      name: "Address",
      description: "Endpoints relacionados aos endereços do usuário",
    },
    {
      name: "Search",
      description: "Endpoints relacionados a busca de dados",
    },
    {
      name: "Specialties",
      description: "Endpoints relacionados a especialidades",
    },
    { name: "Agendamentos", description: "Endpoints relacionados a agendamentos de consultas" },
    {
      name: "Messages",
      description: "Endpoints relacionados a mensagens entre usuários",
    },
    {
      name: "Test",
      description: "Endpoints de teste",
    },
    { name: "Webhooks", description: "Eventos enviados pelo servidor (documentação)" },
    ...(isProduction
      ? []
      : [{ name: "Cleanup", description: "Endpoints para limpar dados de teste" }]),
  ],
  components: {
    schemas: {
      AddUserPatient: {
        type: "object",
        required: [
          "userId",
          "name",
          "birthdayDate",
          "residentialAddress",
          "userSpecialties",
          "userServicePreferences",
        ],
        properties: {
          ...sharedProperties,
          residentialAddress: {
            type: "object",
            required: ["cep", "endereco", "bairro", "numero", "cidade", "estado"],
            properties: {
              cep: { type: "string", example: "13295-000" },
              endereco: { type: "string", example: "Rua das Orquídeas" },
              bairro: { type: "string", example: "Centro" },
              numero: { type: "string", example: "123" },
              cidade: { type: "string", example: "Itupeva" },
              estado: { type: "string", example: "SP" },
              complemento: { type: "string", example: "Apto 101" },
              name: { type: "string", example: "Minha casa" },
              type: {
                type: "string",
                enum: ["Casa", "Trabalho", "Outros"],
                example: "Casa",
              },
            },
          },
          userSpecialties: {
            type: "array",
            items: { type: "string" },
            example: ["Cardiologia", "Clínica Geral"],
          },
          userServicePreferences: {
            type: "array",
            items: { type: "string" },
            example: ["Consulta", "Exame"],
          },
          accessibility: {
            type: "array",
            items: { type: "string" },
            example: ["Cadeira de rodas", "Deficiência visual"],
            description: "Preferências de acessibilidade do paciente (opcional)",
          },
          profilePhoto: {
            type: "string",
            example: "https://res.cloudinary.com/.../foto.png",
            description: "URL da foto enviada anteriormente no upload",
          },
        },
      },
      AddUserProfessional: {
        type: "object",
        required: [
          "userId",
          "name",
          "birthdayDate",
          "CNPJCPFProfissional",
          "residentialAddress",
          "clinic",
          "professionalSpecialties",
          "professionalServicePreferences",
        ],
        properties: {
          ...sharedProperties,
          CNPJCPFProfissional: {
            type: "string",
            example: "123.456.789-00",
          },
          residentialAddress: {
            type: "object",
            required: ["cep", "endereco", "bairro", "numero", "cidade", "estado"],
            properties: {
              cep: { type: "string", example: "12345-678" },
              endereco: { type: "string", example: "Avenida Paulista" },
              bairro: { type: "string", example: "Bela Vista" },
              numero: { type: "string", example: "1000", description: "Opcional" },
              cidade: { type: "string", example: "São Paulo" },
              estado: { type: "string", example: "SP" },
              complemento: { type: "string", example: "Sala 42" },
              name: { type: "string", example: "Minha casa" },
              type: {
                type: "string",
                enum: ["Casa", "Trabalho", "Outros"],
                example: "Casa",
              },
            },
          },
          clinic: {
            type: "object",
            required: ["name", "cep", "address", "neighborhood", "number", "city", "state"],
            properties: {
              name: { type: "string", example: "Clínica Saúde Total" },
              cep: { type: "string", example: "12345-678" },
              address: { type: "string", example: "Avenida Paulista" },
              neighborhood: { type: "string", example: "Bela Vista" },
              number: { type: "string", example: "1000" },
              city: { type: "string", example: "São Paulo" },
              state: { type: "string", example: "SP" },
              addition: { type: "string", example: "Sala 123" },
            },
          },
          professionalSpecialties: {
            type: "array",
            items: { type: "string" },
            example: ["Cardiologia", "Clínica Geral"],
          },
          professionalServicePreferences: {
            type: "array",
            items: { type: "string" },
            example: ["Consulta", "Exame"],
          },
          otherProfessionalSpecialties: {
            type: "array",
            items: { type: "string" },
            example: ["Acupuntura"],
            description: "Opcional",
          },
          accessibility: {
            type: "array",
            items: { type: "string" },
            example: ["Rampa de acesso", "Banheiro adaptado"],
            description: "Preferências de acessibilidade do profissional (opcional)",
          },
          profilePhoto: {
            type: "string",
            example: "https://res.cloudinary.com/.../foto.png",
            description: "URL da foto enviada anteriormente no upload",
          },
        },
      },
      Appointment: {
        type: "object",
        properties: {
          _id: { type: "string", example: "64fae32bd00141c1a2eaa321" },
          patient: { type: "string", example: "64fae24ad00141c1a2eaa320" },
          professional: { type: "string", example: "64fae109d00141c1a2eaa31f" },
          dateTime: { type: "string", format: "date-time", example: "2025-08-01T14:00:00.000Z" },
          status: { type: "string", example: "confirmed" },
        },
      },
      WebhookMessageCreated: {
        type: "object",
        properties: {
          eventId: { type: "string", example: "e5ae2396-ff2c-4a6b-8906-73a4459d42cc" },
          type: { type: "string", example: "message.created" },
          occurredAt: { type: "string", format: "date-time", example: "2025-08-05T22:48:13.781Z" },
          data: {
            type: "object",
            properties: {
              messageId: { type: "string", example: "68928a2d6acdb8a8dd58cc63" },
              conversation: { type: "string", example: "conv_teste_123" },
              sender: { type: "string", example: "68928a2d6acdb8a8dd58cc62" },
              senderName: { type: "string", example: "Testador" },
              content: { type: "string", example: "Mensagem teste webhook" },
              createdAt: {
                type: "string",
                format: "date-time",
                example: "2025-08-05T22:48:13.592Z",
              },
            },
          },
        },
      },
    },
  },
};

const options = {
  openapi: "3.0.0",
  language: "pt-BR",
  autoBody: false,
  ...(isProduction && { ignore: ["/cleanup"] }),
};

const outputFile = "../swagger-output.json";
let routes = [
  ...glob.sync(path.resolve(__dirname, "./routes/*.mjs")),
  ...glob.sync(path.resolve(__dirname, "../routes/*.mjs"), {
    ignore: isProduction ? [path.resolve(__dirname, "../routes/cleanup.mjs")] : [],
  }),
  path.resolve(__dirname, "./controllers/**/*.mjs"),
  path.resolve(__dirname, "../controllers/**/*.mjs"),
];

if (isProduction) {
  routes = routes.filter((route) => !route.includes("cleanup.mjs"));
}

routes.forEach((routeGlob) => {
  try {
    const _fullPath = path.resolve(__dirname, routeGlob);
  } catch (_err) {}
});

// swagger-autogen treats every value passed to `components.schemas` as a
// "sample object" and re-runs its type-inference pass on it. When we hand
// it a real OpenAPI schema (`{ type: "object", required: [...], properties: {...} }`),
// the inference pass converts every property of the schema itself
// (`type`, `required`, `properties`) into JSON Schema metadata, producing
// nonsense like `properties.type.example = "object"`. The generated
// frontend client (Kubb) then receives a useless type and the consumer
// has to fall back to `any`.
//
// Workaround: after the autogen finishes, overwrite the affected schemas
// in `swagger-output.json` with the literal definitions we wrote in `doc`.
// Deep clone so the autogen pass does not mutate the original literal
// schema definitions before we re-apply them.
const RAW_SCHEMAS = JSON.parse(JSON.stringify(doc.components.schemas));
const outputPath = path.resolve(__dirname, outputFile);

await swaggerAutogen(options)(outputFile, routes, doc);

if (fs.existsSync(outputPath)) {
  const generated = JSON.parse(fs.readFileSync(outputPath, "utf8"));
  generated.components = generated.components ?? {};
  generated.components.schemas = {
    ...generated.components.schemas,
    ...RAW_SCHEMAS,
  };
  fs.writeFileSync(outputPath, `${JSON.stringify(generated, null, 2)}\n`);
}
