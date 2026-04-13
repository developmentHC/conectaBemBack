export const getSpecialties = async (_req, res) => {
  /*
  #swagger.tags = ['Specialties']
  #swagger.summary = 'Lista todas as especialidades'
  #swagger.description = 'Retorna a lista canônica de especialidades disponíveis no sistema. Essa lista é utilizada como fonte única (single source of truth) para cadastro e filtros.'

  #swagger.responses[200] = {
    description: 'Lista de especialidades retornada com sucesso',
    schema: [
        { id: "acupuntura", name: "Acupuntura" },
        { id: "aromaterapia", name: "Aromaterapia" },
        { id: "arteterapia", name: "Arteterapia" },
        { id: "biodanca", name: "Biodança" },
        { id: "cardiologia", name: "Cardiologia" },
        { id: "cromoterapia", name: "Cromoterapia" },
        { id: "dermatologia", name: "Dermatologia" },
        { id: "fisioterapia", name: "Fisioterapia" },
        { id: "fitoterapia", name: "Fitoterapia" },
        { id: "hipnoterapia", name: "Hipnoterapia" },
        { id: "homeopatia", name: "Homeopatia" },
        { id: "massoterapia", name: "Massoterapia" },
        { id: "meditacao", name: "Meditação" },
        { id: "musicoterapia", name: "Musicoterapia" },
        { id: "osteopatia", name: "Osteopatia" },
        { id: "pilates", name: "Pilates" },
        { id: "quiropraxia", name: "Quiropraxia" },
        { id: "reflexoterapia", name: "Reflexoterapia" },
        { id: "reiki", name: "Reiki" },
        { id: "yoga", name: "Yoga" }
    ]
  }

  #swagger.responses[500] = {
    description: 'Erro interno no servidor',
    schema: { error: "Erro interno no Servidor" }
  }
  */
  const specialties = [
    { id: "acupuntura", name: "Acupuntura" },
    { id: "aromaterapia", name: "Aromaterapia" },
    { id: "arteterapia", name: "Arteterapia" },
    { id: "biodanca", name: "Biodança" },
    { id: "cardiologia", name: "Cardiologia" },
    { id: "cromoterapia", name: "Cromoterapia" },
    { id: "dermatologia", name: "Dermatologia" },
    { id: "fisioterapia", name: "Fisioterapia" },
    { id: "fitoterapia", name: "Fitoterapia" },
    { id: "hipnoterapia", name: "Hipnoterapia" },
    { id: "homeopatia", name: "Homeopatia" },
    { id: "massoterapia", name: "Massoterapia" },
    { id: "meditacao", name: "Meditação" },
    { id: "musicoterapia", name: "Musicoterapia" },
    { id: "osteopatia", name: "Osteopatia" },
    { id: "pilates", name: "Pilates" },
    { id: "quiropraxia", name: "Quiropraxia" },
    { id: "reflexoterapia", name: "Reflexoterapia" },
    { id: "reiki", name: "Reiki" },
    { id: "yoga", name: "Yoga" },
  ];

  res.set("Cache-Control", "public, max-age=86400");

  return res.status(200).json(specialties);
};
