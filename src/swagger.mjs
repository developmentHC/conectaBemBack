import swaggerAutogen from "swagger-autogen";

const isProduction = process.env.VERCEL == 1;
const vercelUrl = process.env.VERCEL_URL;

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
    AddUserPaciente: {
      $userId: "63a8cdac35345692997edf32",
      $name: "Thiago Cabral",
      $birthdayDate: 1745940325251,
      $userSpecialties: ["Acumputura", "Aromaterapia"],
      $userServicePreferences: ["LGBTQIA+ Friendly", "Pet Friendly"],
      userAcessibilityPreferences: ["Atendimento em Libras", "Audiodescrição"],
      profilePhoto: "https://www.url/path",
    },
    AddUserProfessional: {
      $userId: "63a8cdac35345692997edf32",
      $name: "Ronaldinho Gaúcho",
      $birthdayDate: 1745940325251,
      $cepResidencial: "12345-678",
      $nomeClinica: "Clinica do seu José",
      $CNPJCPFProfissional: "123.456.789-10",
      $cepClinica: "12345-678",
      $enderecoClinica: "Rua Perto da Qui",
      complementoClinica: "Casa",
      $professionalSpecialties: ["Acumputura", "Aromaterapia"],
      otherProfessionalSpecialties: ["Yoga na água", "Corrente russa"],
      $professionalServicePreferences: ["LGBTQIA+ Friendly", "Pet Friendly"],
      profilePhoto: "https://www.url/path",
    },
  },
};

const outputFile = "./../swagger-output.json";
const routes = ["./routes/*.mjs"];

swaggerAutogen({ language: "pt-BR" })(outputFile, routes, doc);
