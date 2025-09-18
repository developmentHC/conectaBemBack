import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import AuthService from "../../services/authService.mjs";
import { User } from "../../models/index.mjs";
import { generateOTP } from "../../utils/generateOTP.mjs";
import { sendEmail } from "../../utils/sendEmail.mjs";
import { testEmailSyntax } from "../../utils/testEmailSyntax.mjs";
import { gridFSBucket } from "../../lib/gridFs.mjs";
import { UserValidationService, ValidationError } from "../../services/validationService.mjs";
import mongoose from "mongoose";

const saltRounds = 10;

export const checkUserEmailSendOTP = async (req, res) => {
  /*
  #swagger.tags = ['Authentication']
  #swagger.summary = 'Envia código OTP para o e-mail informado'
  #swagger.description = 'Fluxo de registro/login: envia um código OTP para o e-mail passado no body da requisição.'

  #swagger.parameters['body'] = {
    in: 'body',
    description: 'E-mail do usuário para envio do OTP',
    required: true,
    schema: {
      email: "usuario@teste.com"
    }
  }

  #swagger.responses[200] = {
    description: 'Usuário já existente, OTP atualizado e enviado por e-mail',
    schema: {
      id: "64f1b2c3d4e5f6a7b8c9",
      email: {
        address: "usuario@teste.com",
        exists: true,
        status: "pending"
      },
      message: "User OTP updated and sent"
    }
  }

  #swagger.responses[201] = {
    description: 'Usuário criado com sucesso e OTP enviado por e-mail',
    schema: {
      id: "64f1b2c3d4e5f6a7b8c9",
      email: {
        address: "usuario@teste.com",
        exists: false,
        status: "pending"
      },
      role: null,
      message: "User created and OTP sent through email"
    }
  }

  #swagger.responses[422] = {
    description: 'Parâmetros inválidos ou não enviados',
    schema: { message: "Um e-mail é exigido" }
  }

  #swagger.responses[500] = {
    description: 'Erro interno no servidor',
    schema: { message: "Server error" }
  }
*/

  const { email } = req.body;

  if (!email || testEmailSyntax(email) === false) {
    return res.status(422).json({ message: "Um e-mail é exigido" });
  }

  try {
    const OTP = generateOTP();
    const sendgridResult = await sendEmail(email, OTP);

    const salt = await bcrypt.genSalt(saltRounds);
    const hashedOTP = await bcrypt.hash(String(OTP), salt);

    const userExists = await User.findOne({ email: email });
    if (!userExists) {
      const result = await User.create({
        email: email,
        hashedOTP: hashedOTP,
        status: "pending",
      });

      return res.status(201).json({
        id: result._id,
        email: {
          address: result.email,
          exists: false,
          status: "pending",
        },
        role: undefined,
        message: "User created and OTP sent through email",
      });
    } else {
      await User.updateOne({ email }, { hashedOTP });
      return res.status(200).json({
        id: userExists._id,
        email: {
          address: email,
          exists: true,
          status: userExists.status,
        },
        message: "User OTP updated and sent",
        sendgridStatus: sendgridResult?.statusCode || null
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const checkOTP = async (req, res) => {
  /*
  #swagger.tags = ['Authentication']
  #swagger.summary = 'Checa se OTP coincide e realiza login/registro'
  #swagger.description = 'Verifica se o OTP enviado no body corresponde ao OTP encriptado no backend. Se coincidir: se o usuário já existir, é logado; caso contrário, fica liberado para registro.'

  #swagger.parameters['body'] = {
    in: 'body',
    description: 'E-mail do usuário e OTP recebido',
    required: true,
    schema: {
      email: "usuario@teste.com",
      OTP: "<código enviado por e-mail>"
    }
  }

  #swagger.responses[200] = {
    description: 'Códigos OTP coincidem e login/registro autorizado',
    schema: {
      id: "64f1b2c3d4e5f6a7b8c9",
      email: "usuario@teste.com",
      status: "active",
      token: "eyJhbGciOiJIUzI1NiIsInR..."
    }
  }

  #swagger.responses[401] = {
    description: 'Códigos OTP não coincidem',
    schema: { message: "OTP inválido ou expirado" }
  }

  #swagger.responses[422] = {
    description: 'Parâmetros obrigatórios não enviados',
    schema: { message: "Email e OTP são obrigatórios." }
  }

  #swagger.responses[500] = {
    description: 'Erro interno no servidor',
    schema: { message: "Ocorreu um erro no servidor." }
  }
*/

  const { email, OTP } = req.body;

  if (!email || !OTP || testEmailSyntax(email) === false) {
    return res.status(422).json({ message: "Email e OTP são obrigatórios." });
  }

  try {
    const result = await AuthService.loginWithOtp(email, OTP);

    return res.status(200).json(result);
  } catch (error) {
    console.error(`Falha no login com OTP para ${email}:`, error.message);
    return res
      .status(error.statusCode || 500)
      .json({ message: error.message || "Ocorreu um erro no servidor." });
  }
};

export const completeSignUpPatient = async (req, res) => {
  /*
  #swagger.tags = ['Authentication']
  #swagger.summary = 'Completa o cadastro do usuário paciente'
  #swagger.description = 'Este endpoint finaliza o cadastro do paciente após o fluxo de sendOTP e checkOTP. É necessário já existir um usuário pendente antes da chamada.'

  #swagger.parameters['body'] = {
    in: 'body',
    description: 'Dados obrigatórios para completar o cadastro do paciente. Necessário ter passado antes por sendOTP e checkOTP.',
    required: true,
    schema: { $ref: '#/definitions/AddUserPatient' }
  }

  #swagger.responses[201] = {
    description: 'Usuário encontrado e cadastro completado com sucesso',
    schema: {
      msg: "Registro bem-sucedido!",
      token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }

  #swagger.responses[200] = {
    description: 'Usuário encontrado, mas nenhuma alteração realizada',
    schema: {
      msg: "Nenhuma alteração realizada"
    }
  }

  #swagger.responses[422] = {
    description: 'Parâmetros obrigatórios não enviados ou inválidos',
    schema: { error: "Campo 'name' é obrigatório" }
  }

  #swagger.responses[404] = {
    description: 'Usuário não encontrado',
    schema: { error: "Usuário não existe ou não foi cadastrado" }
  }

  #swagger.responses[500] = {
    description: 'Erro interno no servidor',
    schema: { error: "Bad request" }
  }
*/

  const {
    userId,
    name,
    birthdayDate,
    residentialAddress,
    userSpecialties,
    userServicePreferences,
    userAcessibilityPreferences,
    profilePhoto,
  } = req.body;

  try {
    UserValidationService.validatePatientData(req.body);
    UserValidationService.validateProfilePhoto(profilePhoto);
    UserValidationService.validateUserExists(userId);
  } catch (error) {
    if (error instanceof ValidationError) {
      return res.status(error.statusCode).json({
        error: error.message,
      });
    }
  }

  const update = {
    name,
    birthdayDate,
    address: [
      {
        cep: residentialAddress.cep,
        address: residentialAddress.address,
        neighborhood: residentialAddress.neighborhood,
        city: residentialAddress.city,
        state: residentialAddress.state,
        active: true,
      },
    ],
    userSpecialties,
    userServicePreferences,
    userType: ["patient"],
    status: "completed",
  };

  if (userAcessibilityPreferences !== undefined) {
    update.userAcessibilityPreferences = userAcessibilityPreferences;
  }

  if (profilePhoto && typeof profilePhoto === "string") {
    const [header, data] = profilePhoto.split(";base64,");
    const mimeType = header.split(":")[1];
    const buffer = Buffer.from(data, "base64");

    const uploadStream = gridFSBucket.openUploadStream(`profile-${userId}`, {
      metadata: { userId },
      contentType: mimeType,
    });

    const fileId = await new Promise((resolve, reject) => {
      uploadStream.end(buffer);
      uploadStream.on("finish", () => {
        resolve(uploadStream.id);
      });
      uploadStream.on("error", (err) => {
        console.error("Erro durante upload:", err);
        reject(err);
      });
    });

    update.profileImage = fileId;
  }

  const result = await User.updateOne({ _id: userId }, { $set: update });

  try {
    if (result.modifiedCount > 0) {
      const accessToken = jwt.sign({ userId: userId }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "12h",
      });

      return res.status(201).json({ msg: "Registro bem-sucedido!", token: accessToken });
    } else {
      return res.status(200).json({ msg: "Nenhuma alteração realizada" });
    }
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);
    return res.status(500).json({ error: "Bad request" });
  }
};

export const completeSignUpProfessional = async (req, res) => {
  /*
  #swagger.tags = ['Authentication']
  #swagger.summary = 'Completa o cadastro do usuário profissional'
  #swagger.description = 'Finaliza o cadastro do profissional após os passos de sendOTP e checkOTP. É necessário que o usuário já exista como pendente antes de chamar este endpoint.'

  #swagger.parameters['body'] = {
    in: 'body',
    description: 'Dados obrigatórios para completar o cadastro do profissional. Necessário ter passado antes por sendOTP e checkOTP.',
    required: true,
    schema: { $ref: '#/definitions/AddUserProfessional' }
  }

  #swagger.responses[201] = {
    description: 'Usuário encontrado e cadastro completado com sucesso',
    schema: {
      msg: "Registro bem-sucedido",
      token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }

  #swagger.responses[200] = {
    description: 'Usuário encontrado, mas nenhuma alteração realizada',
    schema: { error: "Nenhuma alteração realizada" }
  }

  #swagger.responses[422] = {
    description: 'Parâmetros obrigatórios não enviados ou inválidos',
    schema: { error: "Campo 'clinic' é obrigatório" }
  }

  #swagger.responses[404] = {
    description: 'Usuário não encontrado',
    schema: { error: "Usuário não encontrado" }
  }

  #swagger.responses[500] = {
    description: 'Erro interno no servidor',
    schema: { error: "Mensagem de erro interno do servidor" }
  }
*/

  const {
    userId,
    name,
    birthdayDate,
    clinic,
    residentialAddress,
    CNPJCPFProfissional,
    professionalSpecialties,
    otherProfessionalSpecialties = [],
    professionalServicePreferences,
    profilePhoto = undefined,
  } = req.body;

  try {
    UserValidationService.validateProfessionalData(req.body);
    UserValidationService.validateProfilePhoto(profilePhoto);
    UserValidationService.validateUserExists(userId);
  } catch (error) {
    if (error instanceof ValidationError) {
      return res.status(error.statusCode).json({
        error: error.message,
      });
    }
  }

  const update = {
    name,
    birthdayDate,
    CNPJCPFProfissional,
    address: [
      {
        cep: residentialAddress.cep,
        address: residentialAddress.address,
        neighborhood: residentialAddress.neighborhood,
        city: residentialAddress.city,
        state: residentialAddress.state,
        active: true,
      },
    ],
    clinic: {
      name: clinic.name,
      cep: clinic.cep,
      address: clinic.address,
      neighborhood: clinic.neighborhood,
      number: clinic.number,
      city: clinic.city,
      state: clinic.state,
      addition: clinic.addition,
    },
    professionalSpecialties,
    professionalServicePreferences,
    otherProfessionalSpecialties,
    userType: ["professional"],
    status: "completed",
  };

  try {
    if (profilePhoto && typeof profilePhoto === "string") {
      const [header, data] = profilePhoto.split(";base64,");
      const mimeType = header.split(":")[1];
      const buffer = Buffer.from(data, "base64");

      const uploadStream = gridFSBucket.openUploadStream(`profile-${userId}`, {
        metadata: { userId },
        contentType: mimeType,
      });

      const fileId = await new Promise((resolve, reject) => {
        uploadStream.end(buffer);
        uploadStream.on("finish", () => {
          resolve(uploadStream.id);
        });
        uploadStream.on("error", (err) => {
          console.error("Erro durante upload:", err);
          reject(err);
        });
      });

      update.profileImage = fileId;
    }

    const result = await User.updateOne({ _id: userId }, { $set: update });

    if (result.modifiedCount > 0) {
      const updatedUser = await User.findOne({ _id: userId }, { hashedOTP: 0 });

      if (!updatedUser) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      const accessToken = jwt.sign({ userId: userId }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });

      return res.status(201).json({ msg: "Registro bem-sucedido", token: accessToken });
    } else {
      return res.status(200).json({ error: "Nenhuma alteração realizada" });
    }
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);
    return res.status(500).json({ error: error.message });
  }
};

export const userInfo = async (req, res) => {
  /*
  #swagger.tags = ['User']
  #swagger.summary = 'Retorna todas as informações do usuário logado'
  #swagger.description = 'Endpoint protegido que retorna todos os dados do usuário autenticado, exceto campos sensíveis (hashedOTP, __v). Caso exista imagem de perfil, retorna também em formato base64.'

  #swagger.parameters['authToken'] = {
    in: 'cookie',
    description: 'JWT de autenticação do usuário',
    required: true,
    type: 'string'
  }

  #swagger.responses[200] = { 
    description: 'Usuário encontrado, dados retornados com sucesso',
    schema: {
      _id: "64f1b2c3d4e5f6a7b8c9",
      name: "João da Silva",
      email: "usuario@teste.com",
      status: "active",
      userType: ["patient"],
      profilePhoto: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg...",
      residentialAddress: {
        cep: "12345678",
        address: "Rua Exemplo, 123",
        neighborhood: "Centro",
        city: "São Paulo",
        state: "SP"
      }
    }
  }

  #swagger.responses[401] = { 
    description: 'Cookie de autenticação não encontrado ou inválido',
    schema: { error: "Cookie não encontrado" }
  }

  #swagger.responses[404] = { 
    description: 'Usuário não encontrado',
    schema: { error: "Usuário não encontrado" }
  }

  #swagger.responses[422] = {
    description: 'Parâmetros inválidos durante a validação',
    schema: { error: "Mensagem de validação" }
  }

  #swagger.responses[500] = { 
    description: 'Erro interno ao buscar informações do usuário',
    schema: { error: "Bad request" }
  }
*/

  try {
    const userId = req.userId;

    const userExists = await User.findOne(
      { _id: userId },
      {
        hashedOTP: 0,
        __v: 0,
      }
    ).lean();

    if (!userExists) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    if (userExists.profileImage) {
      try {
        const downloadStream = gridFSBucket.openDownloadStream(userExists.profileImage);

        const chunks = [];
        await new Promise((resolve, reject) => {
          downloadStream.on("data", (chunk) => chunks.push(chunk));
          downloadStream.on("end", () => resolve());
          downloadStream.on("error", reject);
        });

        const buffer = Buffer.concat(chunks);

        const file = await mongoose.connection.db
          .collection("fs.files")
          .findOne({ _id: userExists.profileImage });

        const base64 = buffer.toString("base64");
        const dataUri = `data:${file.contentType};base64,${base64}`;

        userExists.profilePhoto = dataUri;
      } catch (error) {
        console.error("Erro ao buscar imagem:", error);
        userExists.profilePhoto = null;
      }
    }

    return res.status(200).json(userExists);
  } catch (error) {
    if (error instanceof ValidationError) {
      return res.status(error.statusCode).json({
        error: error.message,
      });
    }
    console.error("Erro ao trazer informações do usuário:", error);
    return res.status(500).json({ error: "Bad request" });
  }
};
