export const professionalsSample = [
  {
    id: "prof_001",
    name: "Dra. Ana Souza",
    email: "ana.souza@example.com",
    CNPJCPFProfissional: "123.456.789-00",

    specialties: ["Cardiologia", "Clínica Geral"],
    accessibility: ["Cadeirante", "Baixa visão"],
    careTypes: ["Consulta Presencial", "Telemedicina"],
    services: [
      { id: "srv_001", name: "Consulta Clínica Geral" },
      { id: "srv_002", name: "Consulta Cardiológica" }
    ]
  },
  {
    id: "prof_002",
    name: "Dr. João Lima",
    email: "joao.lima@example.com",
    CNPJCPFProfissional: "987.654.321-00",

    specialties: ["Ortopedia"],
    accessibility: ["Libras"],
    careTypes: ["Consulta Domiciliar"],
    services: [
      { id: "srv_003", name: "Consulta Ortopédica" },
      { id: "srv_004", name: "Aplicação de Gesso" }
    ]
  }
];
