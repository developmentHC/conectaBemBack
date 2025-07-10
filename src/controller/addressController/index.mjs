import User from "../../models/User.mjs";
import { UserValidationService } from "../../services/validationService.mjs";

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
            active: {
                type: 'boolean',
                example: false,
                description: 'Indica se é o endereço ativo'
            }
        }
      }
    }
  */

  const {
    addressId,
    name,
    cep,
    endereco,
    bairro,
    estado,
    complemento,
    active,
  } = req.body;

  const decoded = UserValidationService.validateToken(req.cookies.jwt);

  if (!addressId || !cep || !endereco || !bairro || !estado || !complemento) {
    return res.status(422).json({
      error:
        "Existem alguns parâmetros faltando para completar o cadastro do profissional",
    });
  }

  const update = {
    cep,
    endereco,
    bairro,
    estado,
    complemento,
    active: active ?? false,
  };

  if (name !== undefined) {
    update.name = name;
  }

  try {
    const result = await User.updateOne(
      { _id: decoded.userId, "address._id": addressId },
      {
        $set: {
          "address.$": update,
        },
      },
    );

    console.log("Resultado da atualização de endereço: ", result);

    if (result.modifiedCount > 0) {
      return res.status(200).json({ msg: "Atualização bem sucedida!" });
    } else {
      return res
        .status(304)
        .json({ msg: "Não há nada para atualizar no endereço" });
    }
  } catch (error) {
    console.error("Erro ao atualizar endereço de usuário:", error);
    return res.status(500).json({ error: "Erro no servidor" });
  }
};

export const getAddresses = async (req, res) => {
  /*
    #swagger.tags = ['Address']
    #swagger.summary = 'Retorna todos os endereços do usuário'
    #swagger.responses[200] = { 
      description: 'Endereços encontrados',
      schema: {
        address: [
          {
            _id: '507f1f77bcf86cd799439011',
            cep: '12345678',
            address: 'Rua Example, 123',
            neighborhood: 'Centro',
            city: 'São Paulo',
            state: 'SP',
            active: true
          }
        ]
      }
    }
    #swagger.responses[401] = { description: 'Não autorizado' }
    #swagger.responses[404] = { description: 'Usuário não encontrado' }
    #swagger.responses[500] = { description: 'Erro no servidor' }
  */

  const decoded = UserValidationService.validateToken(req.cookies.jwt);
  try {
    const user = await User.findOne(
      { _id: decoded.userId },
      { address: 1, _id: 0 },
    ).lean();

    if (!user) {
      return res.status(404).json({
        error: "Usuário não encontrado",
      });
    }

    return res.status(200).json({
      addresses: user.address || [],
    });
  } catch (error) {
    console.error("Erro ao buscar endereços:", error);
    return res.status(500).json({
      error: "Erro ao buscar endereços",
    });
  }
};

export const changeActiveAddress = async (req, res) => {
  /*
  #swagger.tags = ['Address']
  #swagger.summary = 'Alterar endereço principal do usuário'
  #swagger.responses[200] = { description: 'Endereço principal atualizado com sucesso' }
  #swagger.responses[404] = { description: 'Endereço não encontrado' }
  #swagger.responses[422] = { description: 'ID do endereço não fornecido' }
  #swagger.responses[500] = { description: 'Erro no servidor' }
  #swagger.parameters['body'] = {
    in: 'body',
    description: 'ID do endereço que será definido como principal',
    required: true,
    schema: {
        type: 'object',
        required: ['addressId'],
        properties: {
          addressId: {
            type: 'string',
            example: '507f1f77bcf86cd799439011'
          }
        }
      }
  }
*/
  const { addressId } = req.body;

  if (!addressId) {
    return res.status(422).json({
      error: "ID do endereço é obrigatório",
    });
  }

  try {
    const decoded = UserValidationService.validateToken(req.cookies.jwt);

    const user = await User.findOne({
      _id: decoded.userId,
    });

    console.log(
      "Available addresses:",
      user?.address.map((a) => a._id.toString()),
    );

    if (!user) {
      return res.status(404).json({
        error: "Endereço não encontrado para este usuário",
      });
    }

    const resultUpdate = await User.updateOne(
      { "address._id": addressId },
      { $set: { "address.$[].active": false } },
    );
    console.log(resultUpdate);

    const result = await User.updateOne(
      {
        "address._id": addressId,
      },
      {
        $set: { "address.$.active": true },
      },
    );

    if (result.modifiedCount > 0) {
      return res.status(200).json({
        msg: "Endereço principal atualizado com sucesso!",
      });
    }

    return res.status(304).json({
      msg: "Não houve alteração no endereço principal",
    });
  } catch (error) {
    console.error("Erro ao atualizar endereço principal:", error);
    return res.status(500).json({ error: "Erro no servidor" });
  }
};
