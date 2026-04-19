import User from "../../models/User.mjs";

const ADDRESS_TYPES = ["Casa", "Trabalho", "Outros"];

export const changeAddress = async (req, res, next) => {
  /*
  #swagger.tags = ['Address']
  #swagger.summary = 'Atualiza um endereço do usuário'
  #swagger.description = 'Endpoint protegido que atualiza um endereço existente de um usuário logado. É necessário fornecer o ID do endereço e os novos dados no corpo da requisição.'
  #swagger.security = [{ "bearerAuth": [] }]

  #swagger.requestBody = {
    required: true,
    description: 'Dados do endereço a ser atualizado',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          required: ['addressId', 'cep', 'endereco', 'bairro', 'cidade', 'estado'],
          properties: {
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
              example: 'Minha casa',
              description: 'Apelido opcional do endereço'
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
            numero: {
              type: 'string',
              example: '123',
              description: 'Número do imóvel (opcional)'
            },
            cidade: {
              type: 'string',
              example: 'São Paulo',
              description: 'Cidade'
            },
            estado: {
              type: 'string',
              example: 'SP',
              description: 'Estado'
            },
            complemento: {
              type: 'string',
              example: 'Apto 123',
              description: 'Complemento do endereço (opcional)'
            },
            type: {
              type: 'string',
              enum: ['Casa', 'Trabalho', 'Outros'],
              example: 'Casa',
              description: 'Categoria do endereço'
            },
            active: {
              type: 'boolean',
              example: false,
              description: 'Indica se é o endereço ativo'
            }
          }
        }
      }
    }
  }

  #swagger.responses[200] = {
    description: 'Endereço atualizado com sucesso',
    schema: { msg: "Atualização bem sucedida!" }
  }

  #swagger.responses[304] = {
    description: 'Endereço está idêntico ao banco de dados (nenhuma modificação realizada)',
    schema: { msg: "Não há nada para atualizar no endereço" }
  }

  #swagger.responses[422] = {
    description: 'Parâmetros obrigatórios ausentes ou inválidos no body',
    schema: { error: "Existem alguns parâmetros faltando para atualizar o endereço" }
  }

  #swagger.responses[500] = {
    description: 'Erro interno no servidor',
    schema: { error: "Erro interno no servidor" }
  }
*/

  const {
    addressId,
    name,
    cep,
    endereco,
    bairro,
    numero,
    cidade,
    estado,
    complemento,
    type,
    active,
  } = req.body;

  if (!addressId || !cep || !endereco || !bairro || !cidade || !estado) {
    return res.status(422).json({
      error: "Existem alguns parâmetros faltando para atualizar o endereço",
    });
  }

  if (type !== undefined && type !== null && !ADDRESS_TYPES.includes(type)) {
    return res.status(422).json({
      error: `O campo 'type' deve ser um dos valores: ${ADDRESS_TYPES.join(", ")}`,
    });
  }

  const update = {
    cep,
    endereco,
    bairro,
    cidade,
    estado,
    active: active ?? false,
  };

  if (numero !== undefined) update.numero = numero;
  if (complemento !== undefined) update.complemento = complemento;
  if (name !== undefined) update.name = name;
  if (type !== undefined) update.type = type;

  try {
    const result = await User.updateOne(
      { _id: req.userId, "address._id": addressId },
      { $set: { "address.$": update } },
    );

    if (result.modifiedCount > 0) {
      return res.status(200).json({ msg: "Atualização bem sucedida!" });
    } else {
      return res.status(304).json({ msg: "Não há nada para atualizar no endereço" });
    }
  } catch (error) {
    next(error);
  }
};

export const getAddresses = async (req, res, next) => {
  /*
  #swagger.tags = ['Address']
  #swagger.summary = 'Retorna todos os endereços do usuário'
  #swagger.description = 'Endpoint protegido que retorna todos os endereços cadastrados do usuário logado.'
  #swagger.security = [{ "bearerAuth": [] }]

  #swagger.responses[200] = {
    description: 'Endereços encontrados com sucesso',
    schema: {
      addresses: [
        {
          _id: "507f1f77bcf86cd799439011",
          cep: "12345678",
          endereco: "Rua Example, 123",
          bairro: "Centro",
          numero: "123",
          cidade: "São Paulo",
          estado: "SP",
          complemento: "Apto 123",
          name: "Minha casa",
          type: "Casa",
          active: true
        }
      ]
    }
  }

  #swagger.responses[401] = {
    description: 'Não autorizado (token inválido ou ausente)',
    schema: { error: "Não autorizado" }
  }

  #swagger.responses[404] = {
    description: 'Usuário não encontrado',
    schema: { error: "Usuário não encontrado" }
  }

  #swagger.responses[500] = {
    description: 'Erro interno no servidor',
    schema: { error: "Erro Interno do Servidor" }
  }
*/

  try {
    const user = await User.findOne({ _id: req.userId }, { address: 1, _id: 0 }).lean();

    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    return res.status(200).json({ addresses: user.address || [] });
  } catch (error) {
    next(error);
  }
};

export const changeActiveAddress = async (req, res, next) => {
  /*
  #swagger.tags = ['Address']
  #swagger.summary = 'Alterar endereço principal do usuário'
  #swagger.description = 'Endpoint protegido que define um endereço como principal (ativo) para o usuário logado. O campo `addressId` é obrigatório.'
  #swagger.security = [{ "bearerAuth": [] }]

  #swagger.requestBody = {
    required: true,
    description: 'ID do endereço que será definido como principal',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          required: ['addressId'],
          properties: {
            addressId: {
              type: 'string',
              example: '507f1f77bcf86cd799439011',
              description: 'ID do endereço a ser definido como principal'
            }
          }
        }
      }
    }
  }

  #swagger.responses[200] = {
    description: 'Endereço principal atualizado com sucesso',
    schema: { msg: "Endereço principal atualizado com sucesso!" }
  }

  #swagger.responses[304] = {
    description: 'Não houve alteração no endereço principal',
    schema: { msg: "Não houve alteração no endereço principal" }
  }

  #swagger.responses[404] = {
    description: 'Usuário não encontrado',
    schema: { error: "Usuário não encontrado" }
  }

  #swagger.responses[422] = {
    description: 'ID do endereço não fornecido',
    schema: { error: "ID do endereço é obrigatório" }
  }

  #swagger.responses[500] = {
    description: 'Erro interno no servidor',
    schema: { error: "Erro interno no servidor" }
  }
*/

  const { addressId } = req.body;

  if (!addressId) {
    return res.status(422).json({
      error: "ID do endereço é obrigatório",
    });
  }

  try {
    const user = await User.findOne({ _id: req.userId });

    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    await User.updateOne({ "address._id": addressId }, { $set: { "address.$[].active": false } });

    const result = await User.updateOne(
      { "address._id": addressId },
      { $set: { "address.$.active": true } },
    );

    if (result.modifiedCount > 0) {
      return res.status(200).json({ msg: "Endereço principal atualizado com sucesso!" });
    }

    return res.status(304).json({ msg: "Não houve alteração no endereço principal" });
  } catch (error) {
    next(error);
  }
};
