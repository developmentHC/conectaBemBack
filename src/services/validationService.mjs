import User from "../models/User.mjs";

export async function validateUserExists(userId) {
  const user = await User.findOne({ _id: userId });
  if (!user) {
    throw new ValidationError("Usuário não encontrado. Usuário ", 404);
  }
  return user;
}

export function validatePatientData(data) {
  const requiredFields = [
    "name",
    "birthdayDate",
    "residentialAddress",
    "userSpecialties",
    "userServicePreferences",
  ];
  const missingFields = requiredFields.filter((field) => !data[field]);
  if (missingFields.length > 0) {
    throw new ValidationError(`Campos obrigatórios ausentes: ${missingFields.join(", ")}`, 422);
  }
  validateAddressData(data.residentialAddress);
  validateBirthDate(data.birthdayDate);
}

export function validateProfessionalData(data) {
  const requiredFields = [
    "name",
    "birthdayDate",
    "CNPJCPFProfissional",
    "residentialAddress",
    "clinic",
    "professionalSpecialties",
    "professionalServicePreferences",
  ];
  const missingFields = requiredFields.filter((field) => !data[field]);
  if (missingFields.length > 0) {
    throw new ValidationError(`Campos obrigatórios ausentes: ${missingFields.join(", ")}`, 422);
  }
  validateAddressData(data.residentialAddress);
  validateClinicData(data.clinic);
  validateBirthDate(data.birthdayDate);
}

export function validateBirthDate(birthdayDate) {
  if (typeof birthdayDate !== "number") {
    throw new ValidationError("O campo 'birthdayDate' deve ser um número (timestamp)", 400);
  }
  if (
    Number.isNaN(birthdayDate) ||
    !Number.isFinite(birthdayDate) ||
    birthdayDate <= 0 ||
    birthdayDate > Date.now()
  ) {
    throw new ValidationError("Timestamp inválido. Envie um timestamp correto", 400);
  }
}

export const ADDRESS_TYPES = ["Casa", "Trabalho", "Outros"];

export function validateAddressData(residentialAddress) {
  if (!residentialAddress || typeof residentialAddress !== "object") {
    throw new ValidationError("Dados do endereço residencial inválidos", 422);
  }
  const requiredFields = ["cep", "endereco", "bairro", "cidade", "estado"];
  const missingFields = requiredFields.filter((field) => !residentialAddress[field]);
  if (missingFields.length > 0) {
    throw new ValidationError(
      `Dados do endereço residencial incompletos: ${missingFields.join(", ")}`,
      422,
    );
  }
  if (
    residentialAddress.numero !== undefined &&
    residentialAddress.numero !== null &&
    typeof residentialAddress.numero !== "string"
  ) {
    throw new ValidationError("O campo 'numero' do endereço residencial deve ser uma string", 422);
  }
  if (
    residentialAddress.type !== undefined &&
    residentialAddress.type !== null &&
    !ADDRESS_TYPES.includes(residentialAddress.type)
  ) {
    throw new ValidationError(
      `O campo 'type' do endereço residencial deve ser um dos valores: ${ADDRESS_TYPES.join(", ")}`,
      422,
    );
  }
}

export function validateClinicData(clinic) {
  const requiredFields = ["name", "cep", "address", "neighborhood", "number", "city", "state"];
  const missingFields = requiredFields.filter((field) => !clinic[field]);
  if (missingFields.length > 0) {
    throw new ValidationError(`Dados da clínica incompletos: ${missingFields.join(", ")}`, 422);
  }
}

export function validateProfilePhoto(profilePhoto) {
  if (!profilePhoto.startsWith("data:image")) {
    throw new ValidationError("String Base64 inválida para foto do perfil", 400);
  }
}

export class ValidationError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.name = "ValidationError";
    this.statusCode = statusCode;
  }
}
