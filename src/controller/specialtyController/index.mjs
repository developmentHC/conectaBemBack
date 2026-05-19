export const SPECIALTIES = [
  { id: "acupuntura", name: "Acupuntura", featured: true },
  { id: "aromaterapia", name: "Aromaterapia", featured: true },
  { id: "arteterapia", name: "Arteterapia", featured: false },
  { id: "biodanca", name: "Biodança", featured: false },
  { id: "cardiologia", name: "Cardiologia", featured: false },
  { id: "cromoterapia", name: "Cromoterapia", featured: false },
  { id: "dermatologia", name: "Dermatologia", featured: false },
  { id: "fisioterapia", name: "Fisioterapia", featured: false },
  { id: "fitoterapia", name: "Fitoterapia", featured: false },
  { id: "hipnoterapia", name: "Hipnoterapia", featured: false },
  { id: "homeopatia", name: "Homeopatia", featured: false },
  { id: "massoterapia", name: "Massoterapia", featured: false },
  { id: "meditacao", name: "Meditação", featured: true },
  { id: "musicoterapia", name: "Musicoterapia", featured: false },
  { id: "osteopatia", name: "Osteopatia", featured: false },
  { id: "pilates", name: "Pilates", featured: false },
  { id: "quiropraxia", name: "Quiropraxia", featured: false },
  { id: "reflexoterapia", name: "Reflexoterapia", featured: false },
  { id: "reiki", name: "Reiki", featured: true },
  { id: "yoga", name: "Yoga", featured: true },
];

export const getSpecialties = (req, res) => {
  /*
  #swagger.tags = ['Specialties']
  #swagger.summary = 'Lista especialidades (paginada, com filtro de destaque)'
  #swagger.description = 'Retorna a lista canônica de especialidades disponíveis no sistema. Essa lista é utilizada como fonte única (single source of truth) para cadastro e filtros. A paginação é controlada pelo query param `page` (cada página retorna até 10 itens). Use `featured=true` para restringir aos destaques exibidos na Home.'

  #swagger.parameters['page'] = {
    in: 'query',
    description: 'Número da página para paginação (cada página retorna até 10 especialidades)',
    required: false,
    type: 'integer',
    example: 1
  }

  #swagger.parameters['featured'] = {
    in: 'query',
    description: 'Quando true, retorna apenas as especialidades marcadas como destaque',
    required: false,
    type: 'boolean',
    example: false
  }

  #swagger.responses[200] = {
    description: 'Lista de especialidades retornada com sucesso',
    schema: {
      specialties: [
        { id: "acupuntura", name: "Acupuntura", featured: true },
        { id: "reiki", name: "Reiki", featured: true },
        { id: "yoga", name: "Yoga", featured: true }
      ],
      page: 1,
      pageCount: 1
    }
  }

  #swagger.responses[400] = {
    description: 'Página inválida',
    schema: { error: "Página inválida" }
  }

  #swagger.responses[500] = {
    description: 'Erro interno no servidor',
    schema: { error: "Erro interno no Servidor" }
  }
  */
  res.set("Cache-Control", "public, max-age=86400");

  let page = parseInt(req.query.page, 10) || 1;

  if (Number.isNaN(page) || page < 1) {
    return res.status(400).json({ error: "Página inválida" });
  }

  const limit = 10;
  const featuredOnly = req.query.featured === "true";

  const source = featuredOnly ? SPECIALTIES.filter((s) => s.featured) : SPECIALTIES;

  const total = source.length;
  const pageCount = Math.max(1, Math.ceil(total / limit));

  if (page > pageCount) {
    page = pageCount;
  }

  const start = (page - 1) * limit;
  const specialties = source.slice(start, start + limit);

  return res.status(200).json({
    specialties,
    page,
    pageCount,
  });
};
