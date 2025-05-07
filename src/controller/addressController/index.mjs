import User from "../../models/User.mjs";
import jwt from "jsonwebtoken";
import config from "../../config/config.mjs";

export const changeAddress = async (req, res) => {
  /*
    #swagger.tags = ['Address']
    #swagger.summary = 'Atualizar endereço do usuário'
    #swagger.responses[200] = { description: 'Endereço atualizado com sucesso' } 
    #swagger.responses[304] = { description: 'Endereço está idêntico ao banco de dados' } 
    #swagger.responses[422] = { description: 'Parâmetros exigidos não estão sendo enviados no body' } 
    #swagger.responses[500] = { description: 'Erro no servidor' }
    #swagger.parameters['body'] = {
            in: 'body',
            description: 'Dados do endereço atualizado',
            schema: {
            addressId: {
                type: 'string',
                example: '507f1f77bcf86cd799439011',
                description: 'ID do endereço a ser atualizado'
            },
            cep: {
                type: 'string',
                example: '12345678',
                description: 'CEP do endereço'
            },
            name: {
                type: 'string',
                example: 'Casa',
                description: 'Nome do local'
            },
            endereco: {
                type: 'string',
                example: 'Rua Example, 123',
                description: 'Logradouro'
            },
            bairro: {
                type: 'string',
                example: 'Centro',
                description: 'Bairro'
            },
            estado: {
                type: 'string',
                example: 'SP',
                description: 'Estado'
            },
            complemento: {
                type: 'string',
                example: 'Apto 123',
                description: 'Complemento do endereço'
            },
            principal: {
                type: 'boolean',
                example: false,
                description: 'Indica se é o endereço principal'
            }
        }
      }
    }
  */

  const { addressId, name, cep, endereco, bairro, estado, complemento, principal } = req.body;

  const token = req.cookies.jwt;

  if (!token) {
    return res.status(401).json({ message: "Não autorizado, cookie não encontrado" });
  }

  const decoded = jwt.verify(token, config.ACCESS_TOKEN_SECRET);

  if (!addressId || !cep || !endereco || !bairro || !estado || !complemento) {
    return res.status(422).json({
      error: "Existem alguns parâmetros faltando para completar o cadastro do profissional",
    });
  }

  const update = {
    cep,
    endereco,
    bairro,
    estado,
    complemento,
    principal: principal ?? false,
  };

  if (name !== undefined) {
    update.name = name;
  }

  try {
    const result = await User.updateOne(
      { _id: decoded.userId, "addresses._id": addressId },
      {
        $set: {
          "addresses.$": update,
        },
      }
    );

    console.log("Resultado da atualização de endereço: ", result);

    if (result.modifiedCount > 0) {
      return res.status(200).json({ msg: "Atualização bem sucedida!" });
    } else {
      return res.status(304).json({ msg: "Não há nada para atualizar no endereço" });
    }
  } catch (error) {
    console.error("Erro ao atualizar endereço de usuário:", error);
    return res.status(500).json({ error: "Erro no servidor" });
  }
};
