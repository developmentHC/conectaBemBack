import User from "../models/User.mjs";
import jwt from "jsonwebtoken";
import config from "../config/config.mjs";

export class UserValidationService {
  static async validateUserExists(userId) {
    const user = await User.findOne({ _id: userId });

    if (!user) {
      throw new ValidationError("Usuário não encontrado. Usuário ", 404);
    }

    return user;
  }

  static validatePatientData(data) {
    const requiredFields = [
      "userId",
      "name",
      "birthdayDate",
      "residentialAddress",
      "userSpecialties",
      "userServicePreferences",
      "userAcessibilityPreferences",
      "profilePhoto",
    ];

    const missingFields = requiredFields.filter((field) => !data[field]);

    if (missingFields.length > 0) {
      throw new ValidationError(`Campos obrigatórios ausentes: ${missingFields.join(", ")}`, 422);
    }

    this.validateAddressData(data.residentialAddress);
    this.validateBirthDate(data.birthdayDate);
  }

  static validateProfessionalData(data) {
    const requiredFields = [
      "userId",
      "name",
      "birthdayDate",
      "CNPJCPFProfissional",
      "residentialAddress",
      "clinic",
      "professionalSpecialties",
      "professionalServicePreferences",
      "profilePhoto",
    ];

    const missingFields = requiredFields.filter((field) => !data[field]);

    if (missingFields.length > 0) {
      throw new ValidationError(`Campos obrigatórios ausentes: ${missingFields.join(", ")}`, 422);
    }

    this.validateAddressData(data.residentialAddress);
    this.validateClinicData(data.clinic);
    this.validateBirthDate(data.birthdayDate);
  }

  static validateBirthDate(birthdayDate) {
    if (typeof birthdayDate !== "number") {
      throw new ValidationError("O campo 'birthdayDate' deve ser um número (timestamp)", 400);
    }

    if (isNaN(birthdayDate) || !isFinite(birthdayDate) || birthdayDate <= 0 || birthdayDate > Date.now()) {
      throw new ValidationError("Timestamp inválido. Envie um timestamp correto", 400);
    }
  }

  static validateAddressData(residentialAddress) {
    const requiredFields = ["cep", "address", "neighborhood", "city", "state"];

    const missingFields = requiredFields.filter((field) => !residentialAddress[field]);

    if (missingFields.length > 0) {
      throw new ValidationError(`Dados do endereço residencial imcompletos: ${missingFields.join(", ")}`, 422);
    }
  }

  static validateClinicData(clinic) {
    const requiredFields = ["name", "cep", "address", "neighborhood", "number", "city", "state", "addition"];

    const missingFields = requiredFields.filter((field) => !clinic[field]);

    if (missingFields.length > 0) {
      throw new ValidationError(`Dados da clínica incompletos: ${missingFields.join(", ")}`, 422);
    }
  }

  static validateProfilePhoto() {
    /* if (profilePhoto && !profilePhoto.startsWith("data:image")) {
      throw new ValidationError("String Base64 inválida para foto do perfil", 400);
    } */
  }

  static validateToken(token) {
    try {
      if (!token) {
        throw new ValidationError("Não autorizado, cookie não encontrado", 422);
      }

      const decoded = jwt.verify(token, config.ACCESS_TOKEN_SECRET);

      if (!decoded || !decoded.id) {
        throw new ValidationError("Token inválido", 401);
      }

      return decoded;
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new ValidationError("Token inválido ou expirado", 401);
      }
      if (error instanceof ValidationError) {
        throw error;
      }
      console.error(error);
      throw new ValidationError("Erro na validação do token", 500);
    }
  }
}

export class ValidationError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.name = "ValidationError";
    this.statusCode = statusCode;
  }
}
