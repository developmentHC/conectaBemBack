import Appointment from "../../models/Appointment.mjs";

export const createAppointment = async (req, res) => {

  /*
  #swagger.tags = ['Agendamentos']
  #swagger.summary = 'Cria um novo agendamento'
  #swagger.description = 'Cria um agendamento entre o profissional autenticado e um paciente para uma data e hora específica.'
  #swagger.parameters['body'] = {
    in: 'body',
    required: true,
    schema: {
      patient: '6657df0f2980adf19a8d9bd0',
      dateTime: '2025-06-20T14:00:00.000Z'
    }
  }
  #swagger.responses[201] = {
    description: 'Agendamento criado com sucesso'
  }
  #swagger.responses[400] = {
    description: 'Patient e dateTime são obrigatórios'
  }
  #swagger.responses[401] = {
    description: 'Não autenticado'
  }
  #swagger.responses[409] = {
    description: 'Este horário já está agendado'
  }
  #swagger.responses[500] = {
    description: 'Erro no servidor'
  }
*/


  try {
    const professionalId = req.user?.id;
    const { patient, dateTime } = req.body;

    if (!professionalId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!patient || !dateTime) {
      return res.status(400).json({ error: "Patient and dateTime are required." });
    }

    const conflict = await Appointment.findOne({ professional: professionalId, dateTime });
    if (conflict) {
      return res.status(409).json({ error: "Este horário já está agendado." });
    }

    const newAppointment = new Appointment({
      patient,
      professional: professionalId,
      dateTime,
    });

    await newAppointment.save();

    res.status(201).json({
      message: "Agendamento criado com sucesso!",
      appointment: newAppointment,
    });
  } catch (error) {
    console.error("Error creating appointment:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};

export const getMyAppointments = async (req, res) => {

  /*
  #swagger.tags = ['Agendamentos']
  #swagger.summary = 'Listar agendamentos do usuário autenticado'
  #swagger.description = 'Retorna todos os agendamentos onde o usuário autenticado é paciente ou profissional.'
  #swagger.responses[200] = {
    description: 'Lista de agendamentos retornada com sucesso'
  }
  #swagger.responses[401] = {
    description: 'Usuário não autenticado'
  }
  #swagger.responses[500] = {
    description: 'Erro interno no servidor'
  }
*/

  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const appointments = await Appointment.find({
      $or: [{ patient: userId }, { professional: userId }],
    }).populate("patient professional");

    res.status(200).json(appointments);
  } catch (error) {
    console.error("Error fetching appointments:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getAppointmentById = async (req, res) => {

  /*
  #swagger.tags = ['Agendamentos']
  #swagger.summary = 'Buscar detalhes de um agendamento'
  #swagger.description = 'Retorna informações detalhadas de um agendamento específico, incluindo paciente, profissional, data e status.'
  #swagger.parameters['id'] = {
    in: 'path',
    required: true,
    type: 'string',
    description: 'ID do agendamento'
  }
  #swagger.responses[200] = {
    description: 'Agendamento retornado com sucesso.'
  }
  #swagger.responses[404] = {
    description: 'Agendamento não encontrado.'
  }
  #swagger.responses[500] = {
    description: 'Erro interno no servidor.'
  }
*/


  try {
    const { id } = req.params;

    const appointment = await Appointment.findById(id)
      .populate("patient")
      .populate("professional");

    if (!appointment) {
      return res.status(404).json({ error: "Agendamento não encontrado." });
    }

    res.status(200).json(appointment);
  } catch (error) {
    console.error("Erro ao buscar agendamento:", error);
    res.status(500).json({ error: "Erro interno no servidor." });
  }
};

export const cancelAppointment = async (req, res) => {

  /*
  #swagger.tags = ['Agendamentos']
  #swagger.summary = 'Cancelar um agendamento'
  #swagger.description = 'Atualiza o status de um agendamento para cancelado, desde que o profissional autenticado seja o responsável.'
  #swagger.parameters['id'] = {
    in: 'path',
    required: true,
    type: 'string',
    description: 'ID do agendamento'
  }
  #swagger.responses[200] = {
    description: 'Agendamento cancelado com sucesso.'
  }
  #swagger.responses[403] = {
    description: 'Acesso negado.'
  }
  #swagger.responses[404] = {
    description: 'Agendamento não encontrado.'
  }
  #swagger.responses[500] = {
    description: 'Erro interno no servidor.'
  }
*/


  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const appointment = await Appointment.findById(id);

    if (!appointment) {
      return res.status(404).json({ error: "Agendamento não encontrado." });
    }

    if (appointment.professional.toString() !== userId) {
      return res.status(403).json({ error: "Acesso negado." });
    }

    appointment.status = "cancelado";
    await appointment.save();

    res.status(200).json({ message: "Agendamento cancelado com sucesso." });
  } catch (error) {
    console.error("Erro ao cancelar agendamento:", error);
    res.status(500).json({ error: "Erro interno no servidor." });
  }
};