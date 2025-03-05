import swaggerAutogen from "swagger-autogen";

const isProduction = process.env.NODE_ENV === "production";
const host = isProduction
  ? "conecta-bem-back.vercel.app"
  : "conecta-bem-back.vercel.app";

const schemes = isProduction ? ["https"] : ["http"];

const doc = {
  info: {
    version: "1.0.0",
    title: "ConectaBem APIs",
    description: "APIs para o projeto ConectaBem",
  },
  host: host,
  basePath: "/",
  schemes: schemes,
  tags: [
    {
      name: "Authentication",
      description: "Endpoints relacionados a autenticação do usuário",
    },
    {
      name: "Search",
      description: "Endpoints relacionados a busca de dados do usuário",
    },
    {
      name: "Test",
      description: "Endpoints de teste",
    },
  ],
  definitions: {
    AddUserPaciente: {
      $userId: "1234",
      $name: "Thiago Cabral",
      $birthdayDate: "20/12/2003",
      $userSpecialities: ["Acumputura", "Aromaterapia"],
      $userServicePreferences: ["LGBTQIA+ Friendly", "Pet Friendly"],
      userAcessibilityPreferences: ["Atendimento em Libras", "Audiodescrição"],
      profilePhoto: "https://www.url/path",
    },
    AddUserProfessional: {
      $userId: "1234",
      $name: "Ronaldinho Gaúcho",
      $birthdayDate: "20/12/2003",
      $cepResidencial: "12345-678",
      $nomeClinica: "Clinica do seu José",
      $CNPJCPFProfissional: "123.456.789-10",
      $cepClinica: "12345-678",
      $enderecoClinica: "Rua Perto da Qui",
      complementoClinica: "Casa",
      $professionalSpecialities: ["Acumputura", "Aromaterapia"],
      otherProfessionalSpecialities: ["Yoga na água", "Corrente russa"],
      $professionalServicePreferences: ["LGBTQIA+ Friendly", "Pet Friendly"],
      profilePhoto: "https://www.url/path",
    },
  },
};

const outputFile = "./../swagger-output.json";
const routes = ["./routes/*.mjs"];

swaggerAutogen({ language: "pt-BR" })(outputFile, routes, doc);
