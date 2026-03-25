import { User } from "../../models/index.mjs";
import { escapeRegex } from "../../utils/escapeRegex";

export const searchProfessionalsHighlightsWeek = async (req, res) => {
  /*
  #swagger.tags = ['Search']
  #swagger.summary = 'Pesquisa os profissionais destaques da semana'
  #swagger.description = 'Retorna uma lista paginada de até 10 profissionais que são destaques da semana. A paginação é controlada pelo parâmetro `page` na rota.'

  #swagger.parameters['page'] = {
    in: 'path',
    description: 'Número da página para paginação (cada página retorna até 10 profissionais)',
    required: false,
    type: 'integer',
    example: 1
  }

  #swagger.responses[200] = { 
    description: 'Profissionais encontrados com sucesso',
    schema: {
      professionals: [
        {
          _id: "66d98e1f7c19f5f7a0f4c1d3",
          name: "Pedro Henrique",
          birthdayDate: "1995-05-12",
          clinic: "Clínica XYZ",
          residentialAddress: "Rua Exemplo, 123",
          phoneNumber: "+55 11 91234-5678",
          profilePhoto: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg..."
        }
      ],
      page: 1,
      pageCount: 5
    }
  }

  #swagger.responses[400] = {
    description: 'Página inválida',
    schema: { error: "Página inválida" }
  }

  #swagger.responses[500] = {
    description: 'Erro interno no servidor',
    schema: { error: "Erro interno" }
  }
*/

  try {
    let page = parseInt(req.params.page, 10) || 1;

    if (Number.isNaN(page)) {
      return res.status(400).json({ error: "Página inválida" });
    }

    const limit = 10;

    const totalProfessionals = await User.countDocuments({
      userType: "professional",
    });

    const pageCount = Math.ceil(totalProfessionals / limit);

    if (page > pageCount && pageCount > 0) {
      page = pageCount;
    }

    const professionals = await User.find(
      { userType: "professional" },
      {
        hashedOTP: 0,
        email: 0,
        status: 0,
        userSpecialties: 0,
        userServicePreferences: 0,
        userAcessibilityPreferences: 0,
        __v: 0,
        userType: 0,
      },
    )
      .skip((page - 1) * limit)
      .limit(limit);

    return res.status(200).json({
      professionals: professionals,
      page: page,
      pageCount: pageCount,
    });
  } catch (error) {
    return res.status(500).json({
      error: error,
    });
  }
};

export const searchProfessionalBySpeciality = async (req, res) => {
  /*
  #swagger.tags = ['Search']
  #swagger.summary = 'Pesquisa profissionais por especialidade'
  #swagger.description = 'Retorna uma lista paginada de até 10 profissionais de uma especialidade específica. A especialidade deve ser informada como parâmetro de rota.'

  #swagger.parameters['speciality'] = {
    in: 'path',
    description: 'Especialidade a ser pesquisada',
    required: true,
    type: 'string',
    example: 'Cardiologia'
  }

  #swagger.parameters['page'] = {
    in: 'path',
    description: 'Número da página para paginação (cada página retorna até 10 profissionais)',
    required: false,
    type: 'integer',
    example: 1
  }

  #swagger.responses[200] = { 
    description: 'Profissionais encontrados com sucesso',
    schema: {
      professionals: [
        {
          _id: "66d98e1f7c19f5f7a0f4c1d3",
          name: "Maria Silva",
          birthdayDate: "1988-11-20",
          clinic: "Clínica Coração Saudável",
          residentialAddress: "Rua das Flores, 456",
          phoneNumber: "+55 21 99876-5432",
          professionalSpecialties: ["Cardiologia"],
          profilePhoto: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg..."
        }
      ],
      page: 1,
      pageCount: 3
    }
  }

  #swagger.responses[400] = { 
    description: 'Requisição inválida (falta de parâmetros ou página inválida)',
    schema: { error: "Especialidade é obrigatória" }
  }

  #swagger.responses[500] = {
    description: 'Erro interno no servidor',
    schema: { error: "Erro interno" }
  }
*/

  const speciality = req.params.speciality;

  if (!speciality) {
    return res.status(400).json({ error: "Especialidade é obrigatória" });
  }

  try {
    let page = parseInt(req.params.page, 10) || 1;

    if (Number.isNaN(page)) {
      return res.status(400).json({ error: "Página inválida" });
    }

    const limit = 10;

    const totalProfessionals = await User.countDocuments({
      professionalSpecialties: { $in: [speciality] },
    });

    const pageCount = Math.ceil(totalProfessionals / limit);

    if (page > pageCount && pageCount > 0) {
      page = pageCount;
    }

    const professionals = await User.find(
      { professionalSpecialties: { $in: [speciality] } },
      {
        hashedOTP: 0,
        email: 0,
        status: 0,
        userSpecialties: 0,
        userServicePreferences: 0,
        userAcessibilityPreferences: 0,
        __v: 0,
        userType: 0,
      },
    )
      .skip((page - 1) * limit)
      .limit(limit);

    return res.status(200).json({
      professionals: professionals,
      page: page,
      pageCount: pageCount,
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message,
    });
  }
};

export const searchBar = async (req, res) => {
  /*
  #swagger.tags = ['Search']
  #swagger.summary = 'Busca de profissionais pela barra de pesquisa'
  #swagger.description = 'Retorna até 10 profissionais por página, pesquisando pelo nome ou pela especialidade. A busca é case-insensitive e suporta paginação.'

  #swagger.parameters['terms'] = {
    in: 'path',
    description: 'Termo de busca (nome ou especialidade do profissional)',
    required: true,
    type: 'string',
    example: 'Cardiologia'
  }

  #swagger.parameters['page'] = {
    in: 'path',
    description: 'Número da página para paginação (cada página retorna até 10 profissionais)',
    required: false,
    type: 'integer',
    example: 1
  }

  #swagger.responses[200] = { 
    description: 'Profissionais encontrados com sucesso',
    schema: {
      professionals: [
        {
          _id: "66d98e1f7c19f5f7a0f4c1d3",
          name: "Ana Paula",
          birthdayDate: "1990-03-10",
          clinic: "Clínica Bem Estar",
          residentialAddress: "Av. Central, 789",
          phoneNumber: "+55 31 91234-9876",
          professionalSpecialties: ["Nutrição"],
          profilePhoto: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg..."
        }
      ],
      page: 1,
      pageCount: 4
    }
  }

  #swagger.responses[400] = { 
    description: 'Requisição inválida (parâmetros ausentes ou página inválida)',
    schema: { error: "Parâmetros são obrigatórios para realizar a busca" }
  }

  #swagger.responses[500] = {
    description: 'Erro interno no servidor',
    schema: { error: "Erro interno" }
  }
*/

  const terms = req.params.terms;
  const limit = 10;

  try {
    let page = parseInt(req.params.page, 10) || 1;

    if (!terms) {
      return res.status(400).json({ error: "Parâmetros são obrigatórios para realizar a busca" });
    }

    if (Number.isNaN(page)) {
      return res.status(400).json({ error: "Página inválida" });
    }

    const totalTerms = await User.countDocuments({
      $or: [
        { name: { $regex: terms, $options: "i" } },
        { professionalSpecialties: { $regex: terms, $options: "i" } },
      ],
    });

    const pageCount = Math.ceil(totalTerms / limit);

    if (page > pageCount && pageCount > 0) {
      page = pageCount;
    }

    const professionals = await User.find(
      {
        $or: [
          { name: { $regex: terms, $options: "i" } },
          { professionalSpecialties: { $regex: terms, $options: "i" } },
        ],
      },
      {
        hashedOTP: 0,
        email: 0,
        status: 0,
        userSpecialties: 0,
        userServicePreferences: 0,
        userAcessibilityPreferences: 0,
        __v: 0,
        userType: 0,
      },
    )
      .skip((page - 1) * limit)
      .limit(limit);

    return res.status(200).json({
      professionals: professionals,
      page: page,
      pageCount: pageCount,
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message,
    });
  }
};

export const getProfessionals = async (req, res) => {
  /*
  #swagger.tags = ['Search']
  #swagger.summary = 'Lista profissionais com filtros combinados'
  #swagger.description = 'Retorna profissionais com filtros opcionais de especialidade, acessibilidade e tipo de serviço. Os filtros podem ser combinados (AND).'

  #swagger.parameters['specialty'] = {
    in: 'query',
    description: 'Especialidade do profissional',
    required: false,
    type: 'string',
    example: 'Reiki'
  }

  #swagger.parameters['accessibility'] = {
    in: 'query',
    description: 'Preferência de acessibilidade',
    required: false,
    type: 'string',
    example: 'Libras'
  }

  #swagger.parameters['service'] = {
    in: 'query',
    description: 'Tipo de serviço oferecido',
    required: false,
    type: 'string',
    example: 'Pet Friendly'
  }

  #swagger.parameters['page'] = {
    in: 'query',
    description: 'Número da página',
    required: false,
    type: 'integer',
    example: 1
  }

  #swagger.responses[200] = {
    description: 'Profissionais encontrados com sucesso'
  }

  #swagger.responses[500] = {
    description: 'Erro interno no servidor'
  }
  */

  try {
    let { specialty, accessibility, service, page = 1 } = req.query;
    page = Math.max(1, parseInt(page, 10) || 1);
    const limit = 10;

    const filters = { userType: "professional" };

    if (specialty) {
      filters.professionalSpecialties = {
        $elemMatch: { $regex: `^${escapeRegex(specialty)}$`, $options: "i" },
      };
    }

    if (service) {
      filters.professionalServicePreferences = {
        $elemMatch: { $regex: `^${escapeRegex(service)}$`, $options: "i" },
      };
    }

    const totalProfessionals = await User.countDocuments(filters);
    const pageCount = Math.ceil(totalProfessionals / limit) || 1;

    const currentPage = page > pageCount ? pageCount : page;

    const professionals = await User.find(filters)
      .select(
        "-hashedOTP -email -status -userSpecialties -userServicePreferences -userAcessibilityPreferences -__v -userType",
      )
      .sort({ name: 1 })
      .skip((currentPage - 1) * limit)
      .limit(limit);

    return res.status(200).json({
      professionals,
      page: currentPage,
      pageCount,
      total: totalProfessionals,
      hasMore: currentPage < pageCount,
    });
  } catch (error) {
    return res.status(500).json({ error: "Erro ao buscar profissionais" });
  }
};
