vi.mock("jsonwebtoken", () => ({
  __esModule: true,
  default: { verify: vi.fn() },
}));
vi.mock("../../models/User.mjs", () => ({
  __esModule: true,
  default: { findOne: vi.fn() },
}));
vi.mock("../../config/config.mjs", () => ({
  __esModule: true,
  default: { ACCESS_TOKEN_SECRET: "test-secret" },
}));

import {
  ValidationError,
  validatePatientData,
  validateProfessionalData,
} from "../../services/validationService.mjs";

const makeValidPatientData = (overrides = {}) => ({
  name: "Paciente Teste",
  birthdayDate: 946684800000,
  residentialAddress: {
    cep: "12345-678",
    endereco: "Rua X",
    bairro: "Centro",
    cidade: "Cidade",
    estado: "SP",
  },
  userSpecialties: ["acupuntura"],
  userServicePreferences: ["presencial"],
  ...overrides,
});

const makeValidProfessionalData = (overrides = {}) => ({
  name: "Dr. House",
  birthdayDate: 315532800000,
  CNPJCPFProfissional: "12345678900",
  residentialAddress: {
    cep: "12345-678",
    endereco: "Rua X",
    bairro: "Centro",
    cidade: "Cidade",
    estado: "SP",
  },
  clinic: {
    name: "Clínica XPTO",
    cep: "12345678",
    address: "Rua A",
    neighborhood: "Centro",
    number: "100",
    city: "SP",
    state: "SP",
  },
  professionalSpecialties: ["Cardiologia"],
  professionalServicePreferences: ["Presencial"],
  ...overrides,
});

describe("validatePatientData", () => {
  it("não deve lançar erro quando dados válidos são enviados sem userId", () => {
    const data = makeValidPatientData();
    expect(() => validatePatientData(data)).not.toThrow();
  });

  it("não deve lançar erro quando userId é enviado (userId é ignorado na validação)", () => {
    const data = makeValidPatientData({ userId: "user123" });
    expect(() => validatePatientData(data)).not.toThrow();
  });

  it("deve lançar ValidationError 422 quando name está ausente", () => {
    const data = makeValidPatientData({ name: undefined });
    expect(() => validatePatientData(data)).toThrow(ValidationError);
    try {
      validatePatientData(data);
    } catch (e) {
      expect(e.statusCode).toBe(422);
      expect(e.message).toContain("name");
    }
  });

  it("deve lançar ValidationError 422 quando birthdayDate está ausente", () => {
    const data = makeValidPatientData({ birthdayDate: undefined });
    expect(() => validatePatientData(data)).toThrow(ValidationError);
  });

  it("deve lançar ValidationError 422 quando userSpecialties está ausente", () => {
    const data = makeValidPatientData({ userSpecialties: undefined });
    expect(() => validatePatientData(data)).toThrow(ValidationError);
  });
});

describe("validateProfessionalData", () => {
  it("não deve lançar erro quando dados válidos são enviados sem userId", () => {
    const data = makeValidProfessionalData();
    expect(() => validateProfessionalData(data)).not.toThrow();
  });

  it("não deve lançar erro quando userId é enviado (userId é ignorado na validação)", () => {
    const data = makeValidProfessionalData({ userId: "user123" });
    expect(() => validateProfessionalData(data)).not.toThrow();
  });

  it("deve lançar ValidationError 422 quando name está ausente", () => {
    const data = makeValidProfessionalData({ name: undefined });
    expect(() => validateProfessionalData(data)).toThrow(ValidationError);
    try {
      validateProfessionalData(data);
    } catch (e) {
      expect(e.statusCode).toBe(422);
    }
  });

  it("deve lançar ValidationError 422 quando CNPJCPFProfissional está ausente", () => {
    const data = makeValidProfessionalData({ CNPJCPFProfissional: undefined });
    expect(() => validateProfessionalData(data)).toThrow(ValidationError);
  });

  it("deve lançar ValidationError 422 quando professionalSpecialties está ausente", () => {
    const data = makeValidProfessionalData({ professionalSpecialties: undefined });
    expect(() => validateProfessionalData(data)).toThrow(ValidationError);
  });
});
