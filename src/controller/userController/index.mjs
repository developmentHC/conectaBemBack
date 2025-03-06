import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User } from "../../models/index.mjs";
import { generateOTP } from "../../utils/generateOTP.mjs";
import { sendEmail } from "../../utils/sendEmail.mjs";
import { testEmailSyntax } from "../../utils/testEmailSyntax.mjs";
import config from "../../config/config.mjs";
import { parseDateString } from "../../utils/parseDateString.mjs";

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

  console.log("Email válido recebido:", email);

  try {
    const OTP = generateOTP();
    sendEmail(email, OTP);

    const salt = await bcrypt.genSalt(saltRounds);
    const hashedOTP = await bcrypt.hash(String(OTP), salt);

    console.log(`OTP gerado: ${OTP}, hashed OTP: ${hashedOTP}`);

    const userExists = await User.findOne({ email: email });
    console.log("Usuário existente:", userExists);
    if (!userExists) {
      const result = await User.create({
        email: email,
        hashedOTP: hashedOTP,
        status: "pending",
      });
      console.log("Usuário criado:", result);
      console.log(result);

      return res.status(201).json({
        id: result._id,
        email: {
          adress: result.email,
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
          adress: email,
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
  if (!email || !OTP || testEmailSyntax(email) === false) {
    return res.status(422).json({
      msg: "Parâmetros exigidos não estão sendo enviados ou não estão sendo enviados de forma correta no body",
    });
  }
  try {
    const userExists = await User.findOne({ email: email });
    if (!userExists) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    const resultComparation = await bcrypt.compare(OTP, userExists.hashedOTP);
    console.log(`Comparação entre os OTPs: ${resultComparation}`);
    if (resultComparation) {
      const message = {
        id: userExists._id,
        email: {
          address: userExists.email,
          exists: false,
        },
        otp: {
          isConfirmed: true,
        },
      };
      if (userExists.status === "completed") {
        const accessToken = jwt.sign(userExists._id, config.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
        res.cookie('jwt', accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'Strict',
          maxAge: 3600000
        });

        return res.status(200).json({ msg: "Login bem-sucedido!" });
      } else if (userExists.status === "pending") {
        return res.status(200).json({ message });
      } else {
        return res.status(401).json({ msg: "Parâmetro 'status' inválido!" });
      }
    } else {
      return res.status(401).json({ msg: "Código OTP está incorreto!" });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const completeSignUpPatient = async (req, res) => {
  /*
    #swagger.tags = ['Authentication']
    #swagger.summary = 'Completa o cadastro do paciente'
    #swagger.responses[201] = { description: 'Usuário encontrado, cadastro completado com sucesso' } 
    #swagger.responses[200] = { description: 'Usuário encontardo, mas nenhuma alteração realizada no seu cadastro' } 
    #swagger.responses[422] = { description: 'Parâmetros exigidos não estão sendo enviados no body' } 
    #swagger.responses[404] = { description: 'Usuário não encontrado' } 
    #swagger.responses[500] = { description: 'Erro no servidor' }
    #swagger.parameters['body'] = {
            in: 'body',
            description: 'Criar novo paciente.',
            schema: { $ref: '#/definitions/AddUserPaciente' }
    }
  */

  const {
    userId,
    name,
    birthdayDate,
    userSpecialities,
    userServicePreferences,
    userAcessibilityPreferences,
    profilePhoto,
  } = req.body;

  if (!userId || !name || !birthdayDate || !userSpecialities || !userServicePreferences) {
    return res.status(422).json({
      msg: "Existem alguns parâmetros faltando para completar o cadastro do paciente",
    });
  }

  const userExists = await User.findOne({ _id: userId });
  if (!userExists) {
    return res.status(404).json({ error: "Usuário não encontrado" });
  }
  console.log(`Usuário encontrado com sucesso: ${userExists}`);

  const parsedDate = parseDateString(birthdayDate);
  if (parsedDate.error) {
    console.log(parsedDate.error);
    return res.status(400).json({ error: parsedDate.error });
  }

  const update = {
    name,
    birthdayDate: parsedDate.result,
    userSpecialities,
    userServicePreferences,
    userType: "patient",
  };

  if (userAcessibilityPreferences !== undefined) {
    update.userAcessibilityPreferences = userAcessibilityPreferences;
  }

  if (profilePhoto !== undefined) {
    update.profilePhoto = profilePhoto;
  }

  try {
    const result = await User.updateOne({ _id: userId }, { $set: update });
    console.log("Resultado da atualização:", result);

    if (result.modifiedCount > 0) {
      console.log("Payload para JWT:", userId);
      const accessToken = jwt.sign({ userId }, config.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
      res.cookie('jwt', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Strict',
        maxAge: 3600000
      });

      return res.status(201).json({ msg: "Registro bem-sucedido!" });
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
    #swagger.summary = 'Completa o cadastro do profissional'
    #swagger.responses[201] = { description: 'Usuário encontrado, cadastro completado com sucesso' } 
    #swagger.responses[200] = { description: 'Usuário encontardo, mas nenhuma alteração realizada no seu cadastro' } 
    #swagger.responses[422] = { description: 'Parâmetros exigidos não estão sendo enviados no body' } 
    #swagger.responses[404] = { description: 'Usuário não encontrado' } 
    #swagger.responses[500] = { description: 'Erro no servidor' }
    #swagger.parameters['body'] = {
            in: 'body',
            description: 'Criar novo paciente.',
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
    profissionalSpecialities,
    otherProfessionalSpecialities,
    profissionalServicePreferences,
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
    !profissionalSpecialities ||
    !profissionalServicePreferences
  ) {
    return res.status(422).json({
      msg: "Existem alguns parâmetros faltando para completar o cadastro do profissional",
    });
  }

  const userExists = await User.findOne({ _id: userId });
  console.log(`Usuário encontrado com sucesso: ${userExists}`);
  if (!userExists) {
    return res.status(404).json({ error: "Usuário não encontrado" });
  }

  const parsedDate = parseDateString(birthdayDate);
  if (parsedDate.error) {
    console.log(parsedDate.error);
    return res.status(400).json({ error: parsedDate.error });
  }

  const update = {
    name,
    birthdayDate: parsedDate.result,
    cepResidencial,
    nomeClinica,
    CNPJCPFProfissional,
    cepClinica,
    enderecoClinica,
    profissionalSpecialities,
    profissionalServicePreferences,
    userType: "professional",
  };

  if (complementoClinica !== undefined) {
    update.complementoClinica = complementoClinica;
  }

  if (otherProfessionalSpecialities !== undefined) {
    update.otherProfessionalSpecialities = otherProfessionalSpecialities;
  }

  if (profilePhoto !== undefined) {
    update.profilePhoto = profilePhoto;
  }

  try {
    const result = await User.updateOne({ _id: userId }, { $set: update });
    console.log("Resultado da atualização:", result);
    if (result.modifiedCount > 0) {
      console.log(typeof userId);

      const updatedUser = await User.findOne({ _id: userId }, { hashedOTP: 0 });

      if (updatedUser.length === 0) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      const accessToken = jwt.sign({ userId }, config.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
      res.cookie('jwt', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Strict',
        maxAge: 3600000
      });

      return res.status(201).json({ msg: "Registro bem-sucedido!" });
    } else {
      return res.status(403).json({ error: "Usuário já está cadastrado no banco de dados" });
    }
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);
    return res.status(500).json({ error: error.message });
  }
};

