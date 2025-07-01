import bcrypt from "bcrypt";
import mongoose from "mongoose";
import { User } from "../../models/index.mjs";
import { generateOTP } from "../../utils/generateOTP.mjs";
import { sendEmail } from "../../utils/sendEmail.mjs";
import { testEmailSyntax } from "../../utils/testEmailSyntax.mjs";
import { gridFSBucket } from "../../lib/gridFs.mjs";
import {
  UserValidationService,
  ValidationError,
} from "../../services/validationService.mjs";
import jwt from "jsonwebtoken";

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
    if (!userExists) {
      const result = await User.create({
        email: email,
        hashedOTP: hashedOTP,
        status: "pending",
      });

      console.log("Usuário criado:", result, OTP);

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
      console.log("Usuário existente:", userExists, OTP);
      await User.updateOne({ email }, { hashedOTP });
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
      error:
        "Parâmetros exigidos não estão sendo enviados ou não estão sendo enviados de forma correta no body",
    });
  }
  try {
    const userExists = await User.findOne({ email: email });
    if (!userExists) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }
    console.log(userExists);
    const resultComparation = await bcrypt.compare(OTP, userExists.hashedOTP);

    const accessToken = jwt.sign(
      { userId: userExists._id },
      process.env.ACCESS_TOKEN_SECRET,
      {
        expiresIn: "1h",
      },
    );

    if (resultComparation) {
      const response = {
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
        await User.updateOne(
          { _id: userExists._id },
          { $unset: { hashedOTP: "" } },
        );
        return res
          .status(200)
          .json({ msg: "Login bem-sucedido!", token: accessToken });
      } else if (userExists.status === "pending") {
        return res.status(201).json({ response });
      } else {
        return res.status(401).json({ msg: "Parâmetro 'status' inválido!" });
      }
    } else {
      return res.status(401).json({ error: "Código OTP está incorreto!" });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error" });
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
            schema: { $ref: '#/definitions/AddUserPatient' }
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
    userType: "patient",
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
        console.log("Upload concluído com ID:", uploadStream.id);
        resolve(uploadStream.id);
      });
      uploadStream.on("error", (err) => {
        console.error("Erro durante upload:", err);
        reject(err);
      });
    });

    console.log(fileId);

    update.profileImage = fileId;
  }

  console.log(update);

  const result = await User.updateOne({ _id: userId }, { $set: update });

  try {
    console.log("Resultado da atualização:", result);

    if (result.modifiedCount > 0) {
      console.log("Payload para JWT:", userId);

      const accessToken = jwt.sign(
        { userId: userId },
        process.env.ACCESS_TOKEN_SECRET,
        {
          expiresIn: "1h",
        },
      );

      return res
        .status(201)
        .json({ msg: "Registro bem-sucedido!", token: accessToken });
    } else {
      return res
        .status(500)
        .json({ error: "Usuário já está cadastrado no banco de dados" });
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
    userType: "professional",
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
          console.log("Upload concluído com ID:", uploadStream.id);
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
    console.log("Resultado da atualização:", result);
    if (result.modifiedCount > 0) {
      const updatedUser = await User.findOne({ _id: userId }, { hashedOTP: 0 });

      if (updatedUser.length === 0) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      const accessToken = jwt.sign(
        { userId: userId },
        process.env.ACCESS_TOKEN_SECRET,
        {
          expiresIn: "1h",
        },
      );

      return res
        .status(201)
        .json({ msg: "Registro bem-sucedido", token: accessToken });
    } else {
      return res
        .status(403)
        .json({ error: "Usuário já está cadastrado no banco de dados" });
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
    const decoded = UserValidationService.validateToken(req.cookies.jwt);

    const userExists = await User.findOne(
      { _id: decoded.userId },
      {
        hashedOTP: 0,
        __v: 0,
      },
    ).lean();

    if (!userExists) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    if (userExists.profileImage) {
      try {
        const downloadStream = gridFSBucket.openDownloadStream(
          userExists.profileImage,
        );

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
