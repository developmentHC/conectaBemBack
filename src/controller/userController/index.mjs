import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import cloudinary from "../../config/cloudinary.mjs";
import { checkOtpLimiter, sendOtpLimiter } from "../../lib/rateLimit.mjs";
import { User } from "../../models/index.mjs";
import { loginWithOtp } from "../../services/authService.mjs";
import {
  ValidationError,
  validatePatientData,
  validateProfessionalData,
  validateUserExists,
} from "../../services/validationService.mjs";
import { generateOTP } from "../../utils/generateOTP.mjs";
import { sendEmail } from "../../utils/sendEmail.mjs";
import { testEmailSyntax } from "../../utils/testEmailSyntax.mjs";

const saltRounds = 10;

export const checkUserEmailSendOTP = async (req, res) => {
  /*
  #swagger.tags = ['Authentication']
  #swagger.summary = 'Envia código OTP para o e-mail informado'
  #swagger.description = 'Fluxo de registro/login: envia um código OTP para o e-mail passado no body da requisição.'

  #swagger.requestBody = {
    required: true,
    description: 'E-mail do usuário para envio do OTP',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          required: ['email'],
          properties: {
            email: { type: 'string', example: 'usuario@teste.com' }
          }
        }
      }
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

  #swagger.responses[429] = {
    description: 'Muitas tentativas. Tente novamente em 15 minutos.',
    schema: { message: "Muitas tentativas. Tente novamente em 15 minutos." }
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

  const key = `${req.ip}-${email.toLowerCase()}`;
  const { success } = await sendOtpLimiter.limit(key);
  if (!success) {
    return res.status(429).json({
      message: "Muitas tentativas. Tente novamente em 15 minutos.",
    });
  }

  try {
    const isTestBypassActive =
      process.env.NODE_ENV !== "production" &&
      process.env.TEST_OTP_ENABLED === "true" &&
      email.endsWith("@test.conectabem.com");

    const salt = await bcrypt.genSalt(saltRounds);
    let hashedOTP;

    if (isTestBypassActive) {
      hashedOTP = await bcrypt.hash("0000", salt);
    } else {
      const OTP = generateOTP();
      await sendEmail(email, OTP);
      hashedOTP = await bcrypt.hash(String(OTP), salt);
    }

    const userExists = await User.findOne({ email: email });
    if (!userExists) {
      const result = await User.create({
        email: email,
        hashedOTP: hashedOTP,
        status: "pending",
        otpCreatedAt: new Date(),
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
      await User.updateOne({ email }, { hashedOTP, otpCreatedAt: new Date() });
      return res.status(200).json({
        id: userExists._id,
        email: {
          address: email,
          exists: true,
          status: userExists.status,
        },
        message: "User OTP updated and sent",
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

  #swagger.requestBody = {
    required: true,
    description: 'E-mail do usuário e OTP recebido',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          required: ['email', 'OTP'],
          properties: {
            email: { type: 'string', example: 'usuario@teste.com' },
            OTP: { type: 'string', example: '1234' }
          }
        }
      }
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

  #swagger.responses[429] = {
    description: 'Muitas tentativas. Tente novamente em 15 minutos.',
    schema: { message: "Muitas tentativas. Tente novamente em 15 minutos." }
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

  const key = `${req.ip}-${email.toLowerCase()}`;
  const { success } = await checkOtpLimiter.limit(key);
  if (!success) {
    return res.status(429).json({
      message: "Muitas tentativas. Tente novamente em 15 minutos.",
    });
  }

  try {
    const result = await loginWithOtp(email, OTP);

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

  #swagger.requestBody = {
    required: true,
    description: 'Dados obrigatórios para completar o cadastro do paciente. Necessário ter passado antes por sendOTP e checkOTP.',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/AddUserPatient' }
      }
    }
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

  try {
    const userId = req.userId;
    const {
      name,
      birthdayDate,
      residentialAddress,
      userSpecialties,
      userServicePreferences,
      accessibility,
    } = req.body;

    validatePatientData(req.body);
    await validateUserExists(userId);

    const update = {
      name,
      birthdayDate,
      address: [
        {
          cep: residentialAddress.cep,
          endereco: residentialAddress.endereco,
          bairro: residentialAddress.bairro,
          numero: residentialAddress.numero,
          cidade: residentialAddress.cidade,
          estado: residentialAddress.estado,
          complemento: residentialAddress.complemento,
          name: residentialAddress.name,
          type: residentialAddress.type,
          active: true,
        },
      ],
      userSpecialties,
      userServicePreferences,
      userType: ["patient"],
      status: "completed",
      profilePhoto: req.body.profilePhoto,
    };

    if (accessibility !== undefined) {
      update.accessibility = accessibility;
    }

    const result = await User.updateOne(
      { _id: userId },
      {
        $set: update,
        $unset: {
          CNPJCPFProfissional: "",
          clinic: "",
          professionalSpecialties: "",
          otherProfessionalSpecialties: "",
          professionalServicePreferences: "",
        },
      },
    );

    if (result.modifiedCount > 0) {
      const accessToken = jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "12h",
      });

      return res.status(201).json({
        msg: "Registro bem-sucedido!",
        token: accessToken,
      });
    }

    return res.status(200).json({ msg: "Nenhuma alteração realizada" });
  } catch (error) {
    console.error("Erro ao completar cadastro do paciente:", error);

    if (error instanceof ValidationError) {
      return res.status(error.statusCode).json({ error: error.message });
    }

    return res.status(500).json({ error: "Erro interno ao completar cadastro do paciente" });
  }
};

export const completeSignUpProfessional = async (req, res) => {
  /*
  #swagger.tags = ['Authentication']
  #swagger.summary = 'Completa o cadastro do usuário profissional'
  #swagger.description = 'Finaliza o cadastro do profissional após os passos de sendOTP e checkOTP. É necessário que o usuário já exista como pendente antes de chamar este endpoint.'

  #swagger.requestBody = {
    required: true,
    description: 'Dados obrigatórios para completar o cadastro do profissional. Necessário ter passado antes por sendOTP e checkOTP.',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/AddUserProfessional' }
      }
    }
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

  try {
    const userId = req.userId;
    const {
      name,
      birthdayDate,
      CNPJCPFProfissional,
      clinic,
      residentialAddress,
      professionalSpecialties,
      professionalServicePreferences,
      otherProfessionalSpecialties,
      accessibility,
    } = req.body;

    validateProfessionalData(req.body);
    await validateUserExists(userId);

    const update = {
      name,
      birthdayDate,
      CNPJCPFProfissional,
      clinic,
      address: residentialAddress
        ? [
            {
              cep: residentialAddress.cep,
              endereco: residentialAddress.endereco,
              bairro: residentialAddress.bairro,
              numero: residentialAddress.numero,
              cidade: residentialAddress.cidade,
              estado: residentialAddress.estado,
              complemento: residentialAddress.complemento,
              name: residentialAddress.name,
              type: residentialAddress.type,
              active: true,
            },
          ]
        : undefined,
      professionalSpecialties,
      professionalServicePreferences,
      otherProfessionalSpecialties,
      userType: ["professional"],
      status: "completed",
      profilePhoto: req.body.profilePhoto,
    };

    if (accessibility !== undefined) {
      update.accessibility = accessibility;
    }

    const result = await User.updateOne({ _id: userId }, { $set: update });

    if (result.modifiedCount > 0) {
      const accessToken = jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "12h",
      });

      return res.status(201).json({
        msg: "Registro bem-sucedido!",
        token: accessToken,
      });
    }

    return res.status(200).json({ msg: "Nenhuma alteração realizada" });
  } catch (error) {
    console.error("Erro ao completar cadastro profissional:", error);

    if (error instanceof ValidationError) {
      return res.status(error.statusCode).json({ error: error.message });
    }

    return res.status(500).json({ error: "Erro interno ao completar cadastro profissional" });
  }
};

export const uploadProfilePhoto = async (req, res) => {
  /*
  #swagger.tags = ['Authentication']
  #swagger.summary = 'Upload de foto de perfil'
  #swagger.description = 'Recebe uma imagem via multipart/form-data e atualiza o campo imageUrl do usuário no banco.'

  #swagger.consumes = ['multipart/form-data']
  #swagger.security = [{}]
  #swagger.ignore = ['body']

  #swagger.parameters['profilePhoto'] = {
    in: 'formData',
    type: 'file',
    required: true,
    description: 'Imagem JPG, PNG ou WEBP'
  }

  #swagger.responses[201] = {
    description: 'Foto enviada com sucesso',
    schema: {
      msg: "Foto enviada com sucesso",
      imageUrl: "https://res.cloudinary.com/dlyiydlve/image/upload/v123/conectabem/exemplo.png"
    }
  }

  #swagger.responses[400] = {
    description: 'Requisição inválida',
    schema: { error: "Nenhuma imagem enviada." }
  }

  #swagger.responses[422] = {
    description: 'Erro de validação',
    schema: { error: "Tipo de imagem inválido. Use JPG, PNG ou WEBP." }
  }

  #swagger.responses[500] = {
    description: 'Erro interno ao enviar imagem',
    schema: { error: "Erro interno ao enviar imagem." }
  }
  */

  try {
    if (!req.file) {
      return res.status(400).json({ error: "Nenhuma imagem enviada." });
    }

    const mimeType = req.file.mimetype;
    const buffer = req.file.buffer;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(mimeType)) {
      return res.status(422).json({ error: "Tipo de imagem inválido. Use JPG, PNG ou WEBP." });
    }

    const maxSize = 2 * 1024 * 1024;
    if (buffer.length > maxSize) {
      return res.status(422).json({ error: "Imagem muito grande. Máximo 2MB." });
    }

    const base64Image = `data:${mimeType};base64,${buffer.toString("base64")}`;

    const upload = await cloudinary.uploader.upload(base64Image, {
      folder: "conectabem",
      resource_type: "image",
    });

    return res.status(201).json({
      msg: "Upload realizado com sucesso",
      imageUrl: upload.secure_url,
    });
  } catch (error) {
    console.error("Erro ao enviar foto:", error);
    return res.status(500).json({ error: "Erro interno ao enviar imagem." });
  }
};

export const userInfo = async (req, res) => {
  /*
  #swagger.tags = ['User']
  #swagger.summary = 'Retorna todas as informações do usuário logado'
  #swagger.description = 'Endpoint protegido que retorna todos os dados do usuário autenticado, exceto campos sensíveis (hashedOTP, __v). Retorna a URL da imagem de perfil armazenada no Cloudinary, quando existir.'
  #swagger.security = [{ "bearerAuth": [] }]

  #swagger.parameters['authorization'] = {
    in: 'header',
    required: true,
    type: 'string',
    description: 'Token JWT do paciente ou profissional (Bearer <token>)',
    example: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  }

  #swagger.responses[200] = { 
    description: 'Usuário encontrado, dados retornados com sucesso',
    schema: {
      _id: "64f1b2c3d4e5f6a7b8c9",
      name: "João da Silva",
      email: "usuario@teste.com",
      status: "completed",
      userType: ["patient"],
      imageUrl: "https://res.cloudinary.com/seu-cloud-name/image/upload/v123/abc123.jpg",
      residentialAddress: {
        cep: "12345678",
        endereco: "Rua Exemplo, 123",
        bairro: "Centro",
        cidade: "São Paulo",
        estado: "SP",
        type: "Casa"
      }
    }
  }
*/

  try {
    const userId = req.userId;

    const user = await User.findOne({ _id: userId }, { hashedOTP: 0, __v: 0 }).lean();

    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    return res.status(200).json({
      ...user,
      imageUrl: user.imageUrl || null,
    });
  } catch (error) {
    console.error("Erro ao trazer informações do usuário:", error);
    return res.status(500).json({ error: "Bad request" });
  }
};
