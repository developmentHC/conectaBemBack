import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import AuthService from "../../services/authService.mjs";
import { User } from "../../models/index.mjs";
import { generateOTP } from "../../utils/generateOTP.mjs";
import { sendEmail } from "../../utils/sendEmail.mjs";
import { testEmailSyntax } from "../../utils/testEmailSyntax.mjs";

const saltRounds = 10;

export const checkUserEmailSendOTP = async (req, res) => {
  /*
    #swagger.tags = ['Authentication']
    #swagger.summary = 'Envia o código OTP para o e-mail enviado pelo body'
    #swagger.description = 'Envia o código OTP para registro/login da conta no e-mail enviado no body'
    #swagger.responses[200] = { description: 'Usuário já existente, código OTP enviado por e-mail' }
    #swagger.responses[201] = { description: 'Usuário criado com sucesso e código OTP enviado por e-mail' }
    #swagger.responses[201] = { description: 'Usuário criado com sucesso e código OTP enviado por e-mail' }
    #swagger.responses[422] = { description: 'Parâmetros exigidos não estão sendo enviados no body' }
    #swagger.responses[500] = { description: 'Erro no servidor' }
  */
  const { email } = req.body;

  if (!email || testEmailSyntax(email) === false) {
    return res.status(422).json({ message: "Um e-mail é exigido" });
  }

  try {
    const OTP = generateOTP();
    sendEmail(email, OTP);

    const salt = await bcrypt.genSalt(saltRounds);
    const hashedOTP = await bcrypt.hash(String(OTP), salt);

    const userExists = await User.findOne({ email: email });
    console.log("Usuário existente:", userExists);
    if (!userExists) {
      const result = await User.create({
        email: email,
        hashedOTP: hashedOTP,
        status: "pending",
      });
      console.log("Usuário criado:", result);
      console.log(`OTP gerado: ${OTP}`);

      return res.status(201).json({
        id: result._id,
        email: {
          address: result.email,
          exists: false,
        },
        role: undefined,
        message: "User created and OTP sent through email",
      });
    } else {
      await User.updateOne({ email }, { hashedOTP });
      console.log("OTP do usuário atualizado");
      return res.status(200).json({
        id: userExists._id,
        email: {
          address: email,
          exists: true,
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
    #swagger.summary = 'Checa se OTPs coincidem, e parte para o login/registro do usuário'
    #swagger.description = 'Checa se o OTP enviado no body é o mesmo OTP encriptado no backend. Se for o mesmo, será checado se o usuário já está cadastrado no backend, se estiver, o usuário é logado, se não estiver, o usuário está liberado para o registro'
    #swagger.responses[200] = { description: 'Còdigos OTP coincidem' }
    #swagger.responses[401] = { description: 'Códigos OTP não coincidem' }
    #swagger.responses[422] = { description: 'Parâmetros exigidos não estão sendo enviados no body' }
    #swagger.responses[500] = { description: 'Erro no servidor' }
  */
  const { email, OTP } = req.body;

  if (!email || !OTP) {
    return res.status(422).json({ message: "Email e OTP são obrigatórios." });
  }

  try {
    const result = await AuthService.loginWithOtp(email, OTP);

    return res.status(200).json(result);
  } catch (error) {
    console.error(`Falha no login com OTP para ${email}:`, error.message);
    return res.status(error.statusCode || 500).json({ message: error.message || "Ocorreu um erro no servidor." });
  }
};

export const completeSignUpPatient = async (req, res) => {
  /*
    #swagger.tags = ['Authentication']
    #swagger.summary = 'Completa o cadastro do usuário paciente'
    #swagger.responses[201] = { description: 'Usuário encontrado, cadastro completado com sucesso' } 
    #swagger.responses[200] = { description: 'Usuário encontardo, mas nenhuma alteração realizada no seu cadastro' } 
    #swagger.responses[422] = { description: 'Parâmetros exigidos não estão sendo enviados no body' } 
    #swagger.responses[404] = { description: 'Usuário não encontrado' } 
    #swagger.responses[500] = { description: 'Erro no servidor' }
    #swagger.parameters['body'] = {
            in: 'body',
            description: 'É necessário já ter feito o cadastro anterior do usuário nos endpoints de sendOTP e checkOTP para conseguir utilizar este endpoint',
            schema: { $ref: '#/definitions/AddUserPaciente' }
    }
  */

  const {
    userId,
    name,
    birthdayDate,
    userSpecialties,
    userServicePreferences,
    userAcessibilityPreferences,
    profilePhoto,
  } = req.body;

  if (!userId || !name || !birthdayDate || !userSpecialties || !userServicePreferences) {
    return res.status(422).json({
      msg: "Existem alguns parâmetros faltando para completar o cadastro do paciente",
    });
  }

  try {
    const userExists = await User.findOne({ _id: userId });
    if (!userExists) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }
    console.log(`Usuário encontrado com sucesso: ${userExists}`);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Erro ao encontrar usuário, o id certo está sendo enviado?" });
  }

  if (typeof birthdayDate !== "number") {
    return res.status(400).json({
      error: "O campo 'birthdayDate' deve ser um número (timestamp em milissegundos).",
    });
  }

  if (isNaN(birthdayDate) || !isFinite(birthdayDate) || birthdayDate <= 0 || birthdayDate > Date.now()) {
    return res.status(400).json({
      error:
        "Timestamp inválido. Envie um número positivo de milissegundos desde 1970-01-01 (UTC). Exemplo: 1672531200000.",
    });
  }

  const update = {
    name,
    birthdayDate,
    userSpecialties,
    userServicePreferences,
    userType: "patient",
    status: "completed",
  };

  if (userAcessibilityPreferences !== undefined) {
    update.userAcessibilityPreferences = userAcessibilityPreferences;
  }

  /* if (profilePhoto !== undefined) {
    update.profilePhoto = profilePhoto;
  } */

  try {
    const result = await User.updateOne({ _id: userId }, { $set: update });
    console.log("Resultado da atualização:", result);

    if (result.modifiedCount > 0) {
      console.log("Payload para JWT:", userId);

      const accessToken = jwt.sign({ userId: userId }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });

      return res.status(201).json({ msg: "Registro bem-sucedido!", token: accessToken });
    } else {
      return res.status(500).json({ error: "Usuário já está cadastrado no banco de dados" });
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
    #swagger.responses[201] = { description: 'Usuário encontrado, cadastro completado com sucesso' } 
    #swagger.responses[200] = { description: 'Usuário encontardo, mas nenhuma alteração realizada no seu cadastro' } 
    #swagger.responses[422] = { description: 'Parâmetros exigidos não estão sendo enviados no body' } 
    #swagger.responses[404] = { description: 'Usuário não encontrado' } 
    #swagger.responses[500] = { description: 'Erro no servidor' }
    #swagger.parameters['body'] = {
            in: 'body',
            description: 'É necessário já ter feito o cadastro anterior do usuário nos endpoints de sendOTP e checkOTP para conseguir utilizar este endpoint',
            schema: { $ref: '#/definitions/AddUserProfessional' }
    }
  */

  const {
    userId,
    name,
    birthdayDate,
    cepResidencial,
    nomeClinica,
    CNPJCPFProfissional,
    cepClinica,
    enderecoClinica,
    complementoClinica,
    professionalSpecialties,
    otherProfessionalSpecialties,
    professionalServicePreferences,
    profilePhoto,
  } = req.body;

  if (
    !userId ||
    !name ||
    !birthdayDate ||
    !cepResidencial ||
    !nomeClinica ||
    !CNPJCPFProfissional ||
    !cepClinica ||
    !enderecoClinica ||
    !professionalSpecialties ||
    !professionalServicePreferences
  ) {
    return res.status(422).json({
      msg: "Existem alguns parâmetros faltando para completar o cadastro do profissional",
    });
  }

  if (profilePhoto && !profilePhoto.startsWith("data:image")) {
    return res.status(400).json({ error: "String Base64 inválida." });
  }

  /* const [header, data] = profilePhoto.split(";base64,");
  const mimeType = header.split(":")[1];

  const buffer = Buffer.from(data, "base64");

   const uploadStream = gridFSBucket.openUploadStream(`profile-${userId}`, {
    metadata: { userId },
    contentType: mimeType,
  });

  uploadStream.end(buffer);

  uploadStream.on("finish", async () => {
    await User.findByIdAndUpdate(userId, {
      profileImageId: uploadStream.id,
    });

    res.json({
      success: true,
      fileId: uploadStream.id,
    });
  }); */

  try {
    const userExists = await User.findOne({ _id: userId });
    console.log(`Usuário encontrado com sucesso: ${userExists}`);
    if (!userExists) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Erro ao encontrar usuário, o id certo está sendo enviado?" });
  }

  if (typeof birthdayDate !== "number") {
    return res.status(400).json({
      error: "O campo 'birthdayDate' deve ser um número (timestamp em milissegundos).",
    });
  }

  if (isNaN(birthdayDate) || !isFinite(birthdayDate) || birthdayDate <= 0 || birthdayDate > Date.now()) {
    return res.status(400).json({
      error:
        "Timestamp inválido. Envie um número positivo de milissegundos desde 1970-01-01 (UTC). Exemplo: 1672531200000.",
    });
  }

  const update = {
    name,
    birthdayDate,
    cepResidencial,
    nomeClinica,
    CNPJCPFProfissional,
    cepClinica,
    enderecoClinica,
    professionalSpecialties,
    professionalServicePreferences,
    userType: "professional",
    status: "completed",
  };

  if (complementoClinica !== undefined) {
    update.complementoClinica = complementoClinica;
  }

  if (otherProfessionalSpecialties !== undefined) {
    update.otherProfessionalSpecialties = otherProfessionalSpecialties;
  }

  /* if (profilePhoto !== undefined) {
    update.profilePhoto = profilePhoto;
  } */

  try {
    const result = await User.updateOne({ _id: userId }, { $set: update });
    console.log("Resultado da atualização:", result);
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
      return res.status(403).json({ error: "Usuário já está cadastrado no banco de dados" });
    }
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);
    return res.status(500).json({ error: error.message });
  }
};

export const userInfo = async (req, res) => {
  /*
    #swagger.tags = ['User']
    #swagger.summary = 'Retorna todas as informações do usuário'
    #swagger.responses[200] = { description: 'Usuário encontrado, dados retornados' } 
    #swagger.responses[401] = { description: 'Cookie não encontrado' } 
    #swagger.responses[500] = { description: 'Bad request' } 
  */
  try {
    const userId = req.userId;

    const userExists = await User.findOne(
      { _id: userId },
      {
        hashedOTP: 0,
        status: 0,
        __v: 0,
      }
    );

    return res.status(200).json(userExists);
  } catch (error) {
    console.error("Erro ao trazer informações do usuário:", error);
    return res.status(500).json({ error: "Bad request" });
  }
};
