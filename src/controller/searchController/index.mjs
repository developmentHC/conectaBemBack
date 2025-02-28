import { User } from "../../models/index.mjs";

export const searchProfessionalsHighlightsWeek = async (req, res) => {
  /*
    #swagger.tags = ['Search']
    #swagger.summary = 'Pesquisa os destaques da semana'
    #swagger.responses[200] = { description: 'Profissionais encontrados, retorna um range de 10 profissionais' } 
    #swagger.responses[500] = { description: 'Erro no servidor' }
    #swagger.parameters['body'] = {
            in: 'body',
            description: 'Pesquisar pelos profissionais destaques da semana.',
            schema: {
              'page' : '1'
            }
    }
  */

  try {
    let page = parseInt(req.body.page) || 1;
    const limit = 10;

    const totalProfessionals = await User.countDocuments({ userType: "professional" }, { hashedOTP: 0 });

    const pageCount = Math.ceil(totalProfessionals / limit);

    if (page > pageCount && pageCount > 0) {
      page = pageCount;
    }

    const professionals = await User.find({ userType: "professional" }, { hashedOTP: 0 })
      .skip((page - 1) * limit)
      .limit(limit);
    console.log(professionals);

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
    #swagger.parameters['body'] = {
            in: 'body',
            description: 'Pesquisar pelos profissionais destaques da semana.',
            schema: {
              'page' : '1'
            }
    }
  */
  const speciality = req.params.speciality;
  try {
    let page = parseInt(req.body.page) || 1;
    let limit = 10;

    const totalProfessionals = await User.countDocuments(
      { professionalSpecialities: { $in: [speciality] } },
      { hashedOTP: 0 }
    );

    const pageCount = Math.ceil(totalProfessionals / limit);

    if (page > pageCount && pageCount > 0) {
      page = pageCount;
    }

    const professionals = await User.find({ professionalSpecialities: { $in: [speciality] } }, { hashedOTP: 0 })
      .skip((page - 1) * limit)
      .limit(limit);
    console.log(professionals);

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
