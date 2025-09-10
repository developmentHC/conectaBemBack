import User from "../../models/User.mjs";
import { UserValidationService } from "../../services/validationService.mjs";

export const changeAddress = async (req, res) => {
  /*
  #swagger.tags = ['Address']
  #swagger.summary = 'Atualiza um endereço do usuário'
  #swagger.description = 'Endpoint protegido que atualiza um endereço existente de um usuário logado. É necessário fornecer o ID do endereço e os novos dados no corpo da requisição.'

  #swagger.parameters['body'] = {
    in: 'body',
    description: 'Dados do endereço a ser atualizado',
    required: true,
    schema: {
      type: 'object',
      required: ['addressId', 'cep', 'endereco', 'bairro', 'estado', 'complemento'],
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

  #swagger.responses[200] = { 
    description: 'Endereço atualizado com sucesso',
    schema: { msg: "Atualização bem sucedida!" }
  }

  #swagger.responses[304] = { 
    description: 'Endereço está idêntico ao banco de dados (nenhuma modificação realizada)',
    schema: { msg: "Não há nada para atualizar no endereço" }
  }

  #swagger.responses[422] = { 
    description: 'Parâmetros obrigatórios não enviados no body',
    schema: { error: "Existem alguns parâmetros faltando para completar o cadastro do profissional" }
  }

  #swagger.responses[500] = {
    description: 'Erro interno no servidor',
    schema: { error: "Erro no servidor" }
  }
*/

  const { addressId, name, cep, endereco, bairro, estado, complemento, active } = req.body;

  const decoded = UserValidationService.validateToken(req.cookies.jwt);

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
    active: active ?? false,
  };

  if (name !== undefined) {
    update.name = name;
  }

  try {
    const result = await User.updateOne(
      { _id: decoded.userId, "address._id": addressId },
      { $set: { "address.$": update } }
    );

    if (result.modifiedCount > 0) {
      return res.status(200).json({ msg: "Atualização bem sucedida!" });
    } else {
      return res.status(304).json({ msg: "Não há nada para atualizar no endereço" });
    }
  } catch {
    return res.status(500).json({ error: "Erro no servidor" });
  }
};

export const getAddresses = async (req, res) => {
  /*
  #swagger.tags = ['Address']
  #swagger.summary = 'Retorna todos os endereços do usuário'
  #swagger.description = 'Endpoint protegido que retorna todos os endereços cadastrados do usuário logado.'

  #swagger.responses[200] = { 
    description: 'Endereços encontrados com sucesso',
    schema: {
      addresses: [
        {
          _id: "507f1f77bcf86cd799439011",
          cep: "12345678",
          endereco: "Rua Example, 123",
          bairro: "Centro",
          estado: "SP",
          complemento: "Apto 123",
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
    schema: { error: "Erro ao buscar endereços" }
  }
*/

  const decoded = UserValidationService.validateToken(req.cookies.jwt);
  try {
    const user = await User.findOne({ _id: decoded.userId }, { address: 1, _id: 0 }).lean();

    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    return res.status(200).json({ addresses: user.address || [] });
  } catch {
    return res.status(500).json({ error: "Erro ao buscar endereços" });
  }
};

export const changeActiveAddress = async (req, res) => {
  /*
  #swagger.tags = ['Address']
  #swagger.summary = 'Alterar endereço principal do usuário'
  #swagger.description = 'Endpoint protegido que define um endereço como principal (ativo) para o usuário logado. O campo `addressId` é obrigatório.'

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
          example: '507f1f77bcf86cd799439011',
          description: 'ID do endereço a ser definido como principal'
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
    description: 'Usuário ou endereço não encontrado',
    schema: { error: "Endereço não encontrado para este usuário" }
  }

  #swagger.responses[422] = { 
    description: 'ID do endereço não fornecido',
    schema: { error: "ID do endereço é obrigatório" }
  }

  #swagger.responses[500] = {
    description: 'Erro interno no servidor',
    schema: { error: "Erro no servidor" }
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

    const user = await User.findOne({ _id: decoded.userId });

    if (!user) {
      return res.status(404).json({ error: "Endereço não encontrado para este usuário" });
    }

    await User.updateOne({ "address._id": addressId }, { $set: { "address.$[].active": false } });

    const result = await User.updateOne(
      { "address._id": addressId },
      { $set: { "address.$.active": true } }
    );

    if (result.modifiedCount > 0) {
      return res.status(200).json({ msg: "Endereço principal atualizado com sucesso!" });
    }

    return res.status(304).json({ msg: "Não houve alteração no endereço principal" });
  } catch {
    return res.status(500).json({ error: "Erro no servidor" });
  }
};
