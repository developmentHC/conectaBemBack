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
  tags: [
    {
      name: "Authentication",
      description: "Endpoints relacionados a autenticação do usuário",
    },
    {
      name: "Address",
      description: "Endpoints relacionados aos endereços do usuário",
    },
    {
      name: "User",
      description: "Endpoints relacionados ao usuário",
    },
    {
      name: "Search",
      description: "Endpoints relacionados a busca de dados",
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
        "name",
        "birthdayDate",
        "address",
        "userSpecialties",
        "userServicePreferences",
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
        },
      },
    },
  },
};

const outputFile = "./../swagger-output.json";
const routes = ["./routes/*.mjs"];

swaggerAutogen({ language: "pt-BR" })(outputFile, routes, doc);
