export const getSpecialties = async (req, res) => {
  /*
  #swagger.tags = ['Specialties']
  #swagger.summary = 'Lista todas as especialidades'
  #swagger.description = 'Retorna a lista canônica de especialidades disponíveis no sistema. Essa lista é utilizada como fonte única (single source of truth) para cadastro e filtros.'

  #swagger.responses[200] = {
    description: 'Lista de especialidades retornada com sucesso',
    schema: [
      { id: "reiki", name: "Reiki" },
      { id: "acupuntura", name: "Acupuntura" },
      { id: "aromaterapia", name: "Aromaterapia" },
      { id: "massoterapia", name: "Massoterapia" },
      { id: "meditacao", name: "Meditação" },
      { id: "yoga", name: "Yoga" },
    ]
  }

  #swagger.responses[500] = {
    description: 'Erro interno no servidor',
    schema: { error: "Erro interno" }
  }
  */

  try {
    const specialties = [
      { id: "reiki", name: "Reiki" },
      { id: "acupuntura", name: "Acupuntura" },
      { id: "aromaterapia", name: "Aromaterapia" },
      { id: "massoterapia", name: "Massoterapia" },
      { id: "meditacao", name: "Meditação" },
      { id: "yoga", name: "Yoga" },
    ];

    return res.status(200).json(specialties);
  } catch (error) {
    return res.status(500).json({ error: error });
  }
};
