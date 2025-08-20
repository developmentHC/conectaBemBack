import { User } from "../../models/index.mjs";

export const searchProfessionalsHighlightsWeek = async (req, res) => {
  /*
    #swagger.tags = ['Search']
    #swagger.summary = 'Pesquisa os profissionais destaques da semana'
    #swagger.responses[200] = { description: 'Profissionais encontrados, retorna um range de 10 profissionais' } 
    #swagger.responses[500] = { description: 'Erro no servidor' }
  */

  try {
    let page = parseInt(req.params.page) || 1;

    if (isNaN(page)) {
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
      }
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
    #swagger.summary = 'Pesquisa um range de 10 profissionais de uma especialidade específica'
    #swagger.responses[200] = { description: 'Profissional encontrado, retorna um range de 10 profissionais' } 
    #swagger.responses[500] = { description: 'Erro no servidor' }
  */
  const speciality = req.params.speciality;

  if (!speciality) {
    return res.status(400).json({ error: "Especialidade é obrigatória" });
  }

  try {
    let page = parseInt(req.params.page) || 1;

    if (isNaN(page)) {
      return res.status(400).json({ error: "Página inválida" });
    }

    let limit = 10;

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
      }
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
    #swagger.summary = 'Barra de pesquisa'
    #swagger.responses[200] = { description: 'Profissionais encontrados, retorna um range de 10 profissionais' } 
    #swagger.responses[500] = { description: 'Erro no servidor' }
  */

  const terms = req.params.terms;
  const limit = 10;

  try {
    let page = parseInt(req.params.page) || 1;

    if (!terms) {
      return res.status(400).json({ error: "Parâmetros são obrigatórios para realizar a busca" });
    }

    if (isNaN(page)) {
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
      }
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
