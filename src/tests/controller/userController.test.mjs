import { jest } from "@jest/globals";

let mockLoginWithOtp;

jest.unstable_mockModule("bcrypt", () => ({
  __esModule: true,
  default: {
    genSalt: jest.fn(),
    hash: jest.fn(),
    compare: jest.fn(),
  },
}));
jest.unstable_mockModule("../../models/User.mjs", () => ({
  __esModule: true,
  default: {
    findOne: jest.fn(),
    create: jest.fn(),
    updateOne: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  },
}));
jest.unstable_mockModule("../../utils/sendEmail.mjs", () => ({
  __esModule: true,
  sendEmail: jest.fn(),
}));
jest.unstable_mockModule("../../utils/generateOTP.mjs", () => ({
  __esModule: true,
  generateOTP: jest.fn(),
}));
jest.unstable_mockModule("../../utils/testEmailSyntax.mjs", () => ({
  __esModule: true,
  testEmailSyntax: jest.fn(),
}));
jest.unstable_mockModule("../../services/AuthService.mjs", () => {
  mockLoginWithOtp = jest.fn();
  return {
    __esModule: true,
    default: { loginWithOtp: mockLoginWithOtp },
  };
});
jest.unstable_mockModule("../../services/validationService.mjs", () => ({
  __esModule: true,
  UserValidationService: {
    validatePatientData: jest.fn(),
    validateProfessionalData: jest.fn(),
    validateProfilePhoto: jest.fn(),
    validateUserExists: jest.fn(),
  },
  ValidationError: class ValidationError extends Error {
    constructor(message, statusCode = 422) {
      super(message);
      this.statusCode = statusCode;
    }
  },
}));
jest.unstable_mockModule("jsonwebtoken", () => ({
  __esModule: true,
  default: { sign: jest.fn() },
}));
jest.unstable_mockModule("../../lib/gridFs.mjs", () => ({
  __esModule: true,
  gridFSBucket: {
    openUploadStream: jest.fn().mockReturnValue({
      write: jest.fn(),
      end: jest.fn(),
      on: jest.fn(),
    }),
  },
}));

const { testEmailSyntax } = await import("../../utils/testEmailSyntax.mjs");
const { generateOTP } = await import("../../utils/generateOTP.mjs");
const User = (await import("../../models/User.mjs")).default;
const bcrypt = (await import("bcrypt")).default;
const AuthService = (await import("../../services/AuthService.mjs")).default;
const { checkUserEmailSendOTP, checkOTP, completeSignUpPatient, completeSignUpProfessional } =
  await import("../../controller/userController/index.mjs");
const { UserValidationService, ValidationError } = await import(
  "../../services/validationService.mjs"
);
const jwt = (await import("jsonwebtoken")).default;
const { gridFSBucket } = await import("../../lib/gridFs.mjs");

const makeRes = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
});

const makePatientReq = (overrides = {}) => ({
  body: {
    userId: "user123",
    name: "Teste",
    birthdayDate: "2000-01-01",
    residentialAddress: {
      cep: "12345-678",
      address: "Rua X",
      neighborhood: "Centro",
      city: "Cidade",
      state: "SP",
    },
    userSpecialties: ["spec1"],
    userServicePreferences: ["pref1"],
    ...overrides,
  },
});

const makeProfessionalReq = (overrides = {}) => ({
  body: {
    userId: "user123",
    name: "Dr. House",
    birthdayDate: "1980-01-01",
    clinic: {
      name: "Clínica XPTO",
      cep: "12345678",
      address: "Rua A",
      neighborhood: "Centro",
      number: "100",
      city: "SP",
      state: "SP",
      addition: "Sala 2",
    },
    residentialAddress: {
      cep: "12345678",
      address: "Rua B",
      neighborhood: "Bairro",
      city: "SP",
      state: "SP",
    },
    CNPJCPFProfissional: "12345678900",
    professionalSpecialties: ["Cardiologia"],
    professionalServicePreferences: ["Presencial"],
    otherProfessionalSpecialties: [],
    ...overrides,
  },
});

const mockValidPatient = () => {
  UserValidationService.validatePatientData.mockReturnValue(true);
  UserValidationService.validateProfilePhoto.mockReturnValue(true);
  UserValidationService.validateUserExists.mockReturnValue(true);
};

const mockValidProfessional = () => {
  UserValidationService.validateProfessionalData.mockReturnValue(true);
  UserValidationService.validateProfilePhoto.mockReturnValue(true);
  UserValidationService.validateUserExists.mockReturnValue(true);
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe("checkUserEmailSendOTP", () => {
  let req, res;

  beforeEach(() => {
    req = { body: { email: "teste@exemplo.com.br" } };
    res = makeRes();
  });

  it("deve retornar 422 se o email for inválido", async () => {
    testEmailSyntax.mockReturnValue(false);

    await checkUserEmailSendOTP(req, res);

    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith({ message: "Um e-mail é exigido" });
  });

  it("deve criar um novo usuário se não existir", async () => {
    testEmailSyntax.mockReturnValue(true);
    generateOTP.mockReturnValue("1234");
    bcrypt.genSalt.mockResolvedValue("salt");
    bcrypt.hash.mockResolvedValue("hashedOTP");
    User.findOne.mockResolvedValue(null);
    User.create.mockResolvedValue({ _id: "newUserId", email: req.body.email });

    await checkUserEmailSendOTP(req, res);

    expect(User.create).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it("deve atualizar OTP se usuário já existir", async () => {
    testEmailSyntax.mockReturnValue(true);
    generateOTP.mockReturnValue("5678");
    bcrypt.genSalt.mockResolvedValue("salt");
    bcrypt.hash.mockResolvedValue("hashedOTP2");
    User.findOne.mockResolvedValue({ _id: "existingUserId", email: req.body.email });

    await checkUserEmailSendOTP(req, res);

    expect(User.updateOne).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("deve retornar 500 se ocorrer um erro inesperado", async () => {
    testEmailSyntax.mockReturnValue(true);
    User.findOne.mockRejectedValue(new Error("DB error"));

    await checkUserEmailSendOTP(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: "Server error" });
  });
});

describe("checkOTP", () => {
  let req, res;

  beforeEach(() => {
    req = { body: { email: "teste@exemplo.com", OTP: "1234" } };
    res = makeRes();
  });

  it("deve retornar 422 se email ou OTP não forem enviados ou inválidos", async () => {
    testEmailSyntax.mockReturnValue(false);
    req.body = { email: "", OTP: "" };

    await checkOTP(req, res);

    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith({ message: "Email e OTP são obrigatórios." });
  });

  it("deve retornar 401 se o OTP for inválido", async () => {
    testEmailSyntax.mockReturnValue(true);
    User.findOne.mockResolvedValue({
      _id: "user123",
      email: req.body.email,
      hashedOTP: "hashedOTP",
    });
    bcrypt.compare.mockResolvedValue(false);

    const otpError = new Error("Código OTP está incorreto!");
    otpError.statusCode = 401;
    mockLoginWithOtp.mockRejectedValue(otpError);

    await checkOTP(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Código OTP está incorreto!" });
  });

  it("deve retornar 200 se o OTP for válido", async () => {
    testEmailSyntax.mockReturnValue(true);
    User.findOne.mockResolvedValue({
      _id: "user123",
      email: req.body.email,
      hashedOTP: "hashedOTP",
    });
    bcrypt.compare.mockResolvedValue(true);
    User.findByIdAndUpdate.mockResolvedValue({
      _id: "user123",
      email: req.body.email,
      status: "active",
    });

    mockLoginWithOtp.mockResolvedValue({
      message: "Autenticação bem sucedida!",
      token: "fakeToken",
      user: { _id: "user123", email: req.body.email, status: "active" },
    });

    await checkOTP(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: "Autenticação bem sucedida!",
      user: { _id: "user123", email: req.body.email, status: "active" },
    });
  });

  it("deve retornar 500 se ocorrer erro inesperado", async () => {
    testEmailSyntax.mockReturnValue(true);
    mockLoginWithOtp.mockRejectedValue(new Error("Falha interna"));

    await checkOTP(req, res);

    expect(res.status).toHaveBeenCalledWith(expect.any(Number));
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.any(String),
      })
    );
  });
});

describe("completeSignUpPatient", () => {
  let req, res;

  beforeEach(() => {
    req = makePatientReq();
    res = makeRes();
  });

  it("deve retornar 422 se a validação falhar", async () => {
    UserValidationService.validatePatientData.mockImplementation(() => {
      throw new ValidationError("Dados inválidos", 422);
    });

    await completeSignUpPatient(req, res);

    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith({ error: "Dados inválidos" });
  });

  it("deve retornar 201 se o cadastro for completado", async () => {
    mockValidPatient();
    User.updateOne.mockResolvedValue({ modifiedCount: 1 });
    jwt.sign.mockReturnValue("fake-jwt-token");

    await completeSignUpPatient(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      msg: "Registro bem-sucedido!",
      token: "fake-jwt-token",
    });
  });

  it("deve retornar 200 se nenhuma alteração for feita", async () => {
    mockValidPatient();
    User.updateOne.mockResolvedValue({ modifiedCount: 0 });

    await completeSignUpPatient(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ msg: "Nenhuma alteração realizada" });
  });

  it("deve retornar 422 se a foto de perfil for inválida", async () => {
    const error = new ValidationError("Foto inválida", 422);
    UserValidationService.validateProfilePhoto.mockImplementation(() => {
      throw error;
    });

    await completeSignUpPatient({ body: { userId: "id123", profilePhoto: "foto_invalida" } }, res);

    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith({ error: "Foto inválida" });
  });
});

describe("completeSignUpProfessional", () => {
  let req, res;

  beforeEach(() => {
    req = makeProfessionalReq();
    res = makeRes();
  });

  it("deve retornar 422 se a validação falhar", async () => {
    UserValidationService.validateProfessionalData.mockImplementation(() => {
      throw new ValidationError("Dados inválidos", 422);
    });

    await completeSignUpProfessional(req, res);

    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith({ error: "Dados inválidos" });
  });

  it("deve retornar 201 se o cadastro profissional for completado", async () => {
    mockValidProfessional();
    User.updateOne.mockResolvedValue({ modifiedCount: 1 });
    User.findOne.mockResolvedValue({ _id: "user123", name: "Dr. House" });
    jwt.sign.mockReturnValue("fake-token");

    await completeSignUpProfessional(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      msg: "Registro bem-sucedido",
      token: "fake-token",
    });
  });

  it("deve retornar 200 se nenhuma alteração for realizada", async () => {
    mockValidProfessional();
    User.updateOne.mockResolvedValue({ modifiedCount: 0 });

    await completeSignUpProfessional(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ error: "Nenhuma alteração realizada" });
  });

  it("deve retornar 404 se usuário não for encontrado após update", async () => {
    mockValidProfessional();
    User.updateOne.mockResolvedValue({ modifiedCount: 1 });
    User.findOne.mockResolvedValue(null);

    await completeSignUpProfessional(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "Usuário não encontrado" });
  });
});
