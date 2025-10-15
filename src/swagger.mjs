import swaggerAutogen from "swagger-autogen";
import path from "path";
import { fileURLToPath } from "url";
import glob from "glob";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
const vercelUrl = process.env.VERCEL_URL;

const host = isProduction ? vercelUrl : `localhost:${process.env.PORT || 3000}`;
const schemes = isProduction ? ["https"] : ["http"];

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

const doc = {
  info: {
    version: "1.0.0",
    title: "ConectaBem APIs",
    description: "APIs para o projeto ConectaBem",
  },
  host: isProduction ? vercelUrl : "localhost:3000",
  basePath: "/",
  schemes: isProduction ? ["https"] : ["http"],
  securityDefinitions: {
    bearerAuth: {
      type: "http",
      scheme: "bearer",
      bearerFormat: "JWT",
    },
  },
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
  ...(isProduction ? [] : [
    { name: "Cleanup", description: "Endpoints para limpar dados de teste" }
  ])
  ],
  definitions: {
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
          required: ["cep", "address", "neighborhood", "city", "state"],
          properties: {
            cep: { type: "string", example: "13295-000" },
            address: { type: "string", example: "Rua das Orquídeas" },
            neighborhood: { type: "string", example: "Centro" },
            city: { type: "string", example: "Itupeva" },
            state: { type: "string", example: "SP" },
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
        userAcessibilityPreferences: {
          type: "array",
          items: { type: "string" },
          example: ["Cadeira de rodas", "Deficiência visual"],
          description: "Opcional",
        },
        profilePhoto: {
          type: "string",
          description: "Base64 Data URL da foto de perfil",
          example: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg...",
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
          required: ["cep", "address", "neighborhood", "city", "state"],
          properties: {
            cep: { type: "string", example: "12345-678" },
            address: { type: "string", example: "Avenida Paulista" },
            neighborhood: { type: "string", example: "Bela Vista" },
            city: { type: "string", example: "São Paulo" },
            state: { type: "string", example: "SP" },
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
        profilePhoto: {
          type: "string",
          description: "Base64 Data URL da foto de perfil",
          example: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg...",
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
            createdAt: { type: "string", format: "date-time", example: "2025-08-05T22:48:13.592Z" },
          },
        },
      },
    },
  },
};

const options = {
  language: "pt-BR",
  ...(isProduction && { ignore: ["/cleanup"] }),
};

const outputFile = "../swagger-output.json";
let routes = [
  ...glob.sync(path.resolve(__dirname, "./routes/*.mjs")),        
  ...glob.sync(path.resolve(__dirname, "../routes/*.mjs"), {     
    ignore: isProduction ? [path.resolve(__dirname, "../routes/cleanup.mjs")] : []
  }),
  path.resolve(__dirname, "./controllers/**/*.mjs"),              
  path.resolve(__dirname, "../controllers/**/*.mjs")              
];
  
if (isProduction) {
  routes = routes.filter(route => !route.includes("cleanup.mjs"));
}

routes.forEach(routeGlob => {
  try {
    const fullPath = path.resolve(__dirname, routeGlob);
  } catch (err) {
  }
});

swaggerAutogen(options)(outputFile, routes, doc);
