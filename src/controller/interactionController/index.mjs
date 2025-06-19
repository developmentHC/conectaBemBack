import AppointmentInteraction from "../../models/AppointmentInteraction.mjs";

export const createInteraction = async (req, res) => {

/*
  #swagger.tags = ['Interações']
  #swagger.summary = 'Cria uma nova interação'
  #swagger.description = 'Registra uma nova observação associada a um agendamento.'
  #swagger.parameters['body'] = {
    in: 'body',
    required: true,
    schema: {
      appointment: '6852f8b1d59186c2f377c0dc',
      type: 'observação',
      content: 'Paciente relatou dores lombares após a sessão.'
    }
  }
  #swagger.responses[201] = {
    description: 'Interação criada com sucesso.'
  }
  #swagger.responses[400] = {
    description: 'Parâmetros obrigatórios ausentes.'
  }
  #swagger.responses[401] = {
    description: 'Usuário não autenticado.'
  }
  #swagger.responses[500] = {
    description: 'Erro interno no servidor.'
  }
*/



  try {
    const userId = req.user?.id;
    const { appointment, type, content } = req.body;

    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    if (!appointment || !type || !content) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const newInteraction = await AppointmentInteraction.create({
      appointment,
      user: userId,
      type,
      content,
    });

    res.status(201).json(newInteraction);
  } catch (error) {
    console.error("Error creating interaction:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getInteractionsByAppointment = async (req, res) => {

/*
  #swagger.tags = ['Interações']
  #swagger.summary = 'Lista interações de um agendamento'
  #swagger.description = 'Retorna todas as interações vinculadas a um agendamento específico.'
  #swagger.parameters['appointmentId'] = {
    in: 'query',
    required: true,
    type: 'string',
    description: 'ID do agendamento'
  }
  #swagger.responses[200] = {
    description: 'Lista de interações retornada com sucesso.'
  }
  #swagger.responses[400] = {
    description: 'appointmentId ausente.'
  }
  #swagger.responses[500] = {
    description: 'Erro interno no servidor.'
  }
*/

  try {
    const { appointmentId } = req.params;

    const interactions = await AppointmentInteraction.find({ appointment: appointmentId })
      .populate("user", "name email")
      .sort({ createdAt: 1 });

    res.json(interactions);
  } catch (error) {
    console.error("Error fetching interactions:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
