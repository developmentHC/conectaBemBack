import swaggerAutogen from "swagger-autogen";

const isProduction = process.env.VERCEL == 1;
const vercelUrl = process.env.VERCEL_URL;

export const sharedProperties = {
  name: {
    type: "string",
    example: "João Silva",
  },
  birthdayDate: {
    type: "number",
    example: 1632824400000,
  },
  address: {
    type: "array",
    items: {
      type: "object",
      properties: {
        cep: {
          type: "string",
          example: "12345-678",
        },
        address: {
          type: "string",
          example: "Rua das Flores",
        },
        neighborhood: {
          type: "string",
          example: "Centro",
        },
        city: {
          type: "string",
          example: "São Paulo",
        },
        state: {
          type: "string",
          example: "SP",
        },
        active: {
          type: "boolean",
          example: true,
        },
      },
    },
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
      { name: "Agendamentos", 
        description: "Endpoints relacionados a agendamentos de consultas" 
    },
    {
      name: "Test",
      description: "Endpoints de teste",
    },
  ],
  definitions: {
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
        "otherProfessionalSpecialties"
      ],
      properties: {
        ...sharedProperties,
        CNPJCPFProfissional: {
          type: "string",
          example: "123.456.789-00",
        },
        clinic: {
          type: "object",
          properties: {
            name: {
              type: "string",
              example: "Clínica Saúde Total",
            },
            cep: {
              type: "string",
              example: "12345-678",
            },
            address: {
              type: "string",
              example: "Avenida Paulista",
            },
            neighborhood: {
              type: "string",
              example: "Bela Vista",
            },
            number: {
              type: "string",
              example: "1000",
            },
            city: {
              type: "string",
              example: "São Paulo",
            },
            state: {
              type: "string",
              example: "SP",
            },
            addition: {
              type: "string",
              example: "Sala 123",
            },
          },
        },
        professionalSpecialties: {
          type: "array",
          items: {
            type: "string",
          },
          example: ["Cardiologia", "Clínica Geral"],
        },
        professionalServicePreferences: {
          type: "array",
          items: {
            type: "string",
          },
          example: ["Consulta", "Exame"],
        },
        otherProfessionalSpecialties: {
          type: "array",
          items: {
            type: "string",
          },
          example: ["Acupuntura"],
        },
      },
    },
    AddUserPatient: {
      type: "object",
      required: [
        "userId",
        "name",
        "birthdayDate",
        "address",
        "userSpecialties",
        "userServicePreferences",
        "userAcessibilityPreferences",
      ],
      properties: {
        ...sharedProperties,
        userSpecialties: {
          type: "array",
          items: {
            type: "string",
          },
          example: ["Cardiologia", "Clínica Geral"],
        },
        userServicePreferences: {
          type: "array",
          items: {
            type: "string",
          },
          example: ["Consulta", "Exame"],
        userAcessibilityPreferences: {
          type: "array",
          items: {
            type: "string",
          },
          example: ["Cadeira de rodas", "Deficiência visual"],
          },

        },
      },
    },
    Appointment: {
      type: "object",
      properties: {
        _id: {
          type: "string",
          example: "64fae32bd00141c1a2eaa321",
        },
        patient: {
          type: "string",
          example: "64fae24ad00141c1a2eaa320",
        },
        professional: {
          type: "string",
          example: "64fae109d00141c1a2eaa31f",
        },
        dateTime: {
          type: "string",
          format: "date-time",
          example: "2025-08-01T14:00:00.000Z",
        },
        status: {
          type: "string",
          example: "confirmed",
      },
     },
    },
  },
};

const outputFile = "./../swagger-output.json";
const routes = ["./routes/*.mjs"];

swaggerAutogen({ language: "pt-BR" })(outputFile, routes, doc);
