import Appointment from "../../models/Appointment.mjs";
import mongoose from 'mongoose';

export const createAppointment = async (req, res) => {
/*
  #swagger.tags = ['Agendamentos']
  #swagger.summary = 'Criar solicitação de agendamento (paciente)'
  #swagger.description = 'Paciente cria uma solicitação para um profissional em data/hora escolhidas.'
  #swagger.security = [{ "bearerAuth": [] }]
  #swagger.parameters['authorization'] = {
    in: 'header', required: true, type: 'string',
    description: 'Token JWT do paciente — formato: Bearer <token>'
  }
  #swagger.parameters['body'] = {
    in: 'body',
    required: true,
    schema: {
      type: 'object',
      required: ['professionalId','dateTime','address'],
      properties: {
        professionalId: { type: 'string', example: '6876317147871e2d7f74dd90' },
        notes: { type: 'string', example: 'Trazer exames anteriores' },
        dateTime: { type: 'string', format: 'date-time', example: '2025-09-10T10:00:00Z' },
        address: {
          type: 'object',
          required: ['clinicId'],
          properties: {
            clinicId: { type: 'string', example: '688d1507f086e02085acf44c' }
          }
        }
      }
    }
  }
*/

  try {
    const patientId = req.userId;
    if (!patientId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { professionalId, dateTime, address, notes } = req.body || {};
    if (!professionalId || !dateTime || !address) {
      return res.status(400).json({ error: 'Campos professionalId, dateTime e address são obrigatórios.' });
    }

    const hasClinicId = typeof address?.clinicId === 'string' && address.clinicId.trim() !== '';
    if (!hasClinicId) {
      return res.status(400).json({ error: 'É obrigatório informar clinicId no address.' });
    }

    const dt = new Date(dateTime);
    if (Number.isNaN(dt.getTime())) {
      return res.status(400).json({ error: 'dateTime inválido. Use ISO 8601.' });
    }
    if (dt.getTime() <= Date.now()) {
      return res.status(422).json({ error: 'Não é possível agendar no passado.' });
    }

    if (String(patientId) === String(professionalId)) {
      return res.status(422).json({ error: 'Não é possível se agendar como seu próprio paciente.' });
    }

    const conflict = await Appointment.exists({
      professional: professionalId,
      status: { $in: ['pending', 'confirmed'] },
      dateTime: dt
    });
    if (conflict) {
      return res.status(409).json({ error: 'Este horário já está agendado.' });
    }

    const appt = await Appointment.create({
      patient: patientId,
      professional: professionalId,
      dateTime: dt,
      status: 'pending',
      address,
      notes: notes ?? undefined
    });

    res.setHeader('Location', `/appointments/${appt._id}`);
    return res.status(201).json({
      message: 'Solicitação enviada.',
      data: { id: appt._id, status: appt.status, dateTime: appt.dateTime }
    });
  } catch (error) {
    console.error('Error creating appointment:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

export const actOnAppointment = async (req, res) => {
  /*
    #swagger.tags = ['Agendamentos']
    #swagger.summary = 'Executa uma ação no agendamento'
    #swagger.description = 'Permite confirmar, cancelar, remarcar ou completar um agendamento.'
    #swagger.security = [{ "bearerAuth": [] }]
    #swagger.parameters['authorization'] = {
      in: 'header', required: true, type: 'string',
      description: 'Token JWT do paciente ou profissional (Bearer <token>)'
    }
    #swagger.parameters['id'] = { in: 'path', required: true, type: 'string', description: 'ID do agendamento' }
    #swagger.parameters['body'] = {
      in: 'body', required: true,
      schema: {
        type: 'object',
        required: ['action'],
        properties: {
          action: { type: 'string', enum: ['confirm', 'cancel', 'reschedule', 'complete'] },
          payload: {
            type: 'object',
            properties: {
              reason:  { type: 'string', description: 'Motivo do cancelamento (opcional)' },
              dateTime:{ type: 'string', format: 'date-time', description: 'Nova data/hora (ISO 8601) para remarcar' }
            }
          }
        }
      }
    }
    #swagger.responses[200] = { description: 'Ação executada com sucesso' }
    #swagger.responses[400] = { description: 'Ação inválida ou payload ausente' }
    #swagger.responses[401] = { description: 'Não autenticado' }
    #swagger.responses[403] = { description: 'Sem permissão para executar a ação' }
    #swagger.responses[404] = { description: 'Agendamento não encontrado' }
    #swagger.responses[409] = { description: 'Conflito de agenda' }
    #swagger.responses[422] = { description: 'Transição de status inválida' }
    #swagger.responses[500] = { description: 'Erro interno' }
  */
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ code: 'UNAUTHORIZED', error: 'Unauthorized' });

    const { id } = req.params;
    const { action, payload = {} } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ code: 'VALIDATION_ERROR', error: 'ID inválido.' });
    }
    if (!action) {
      return res.status(400).json({ code: 'VALIDATION_ERROR', error: 'Campo "action" é obrigatório.' });
    }

    const appt = await Appointment.findById(id);
    if (!appt) return res.status(404).json({ code: 'NOT_FOUND', error: 'Agendamento não encontrado.' });

    const isProfessional = String(appt.professional) === String(userId);
    const isPatient     = String(appt.patient) === String(userId);
    const isTerminal    = appt.status === 'canceled' || appt.status === 'completed';

    switch (action) {
      case 'confirm': {
        if (!isProfessional) return res.status(403).json({ code: 'FORBIDDEN', error: 'Somente o profissional pode confirmar.' });
        if (isTerminal)      return res.status(422).json({ code: 'INVALID_TRANSITION', error: `Não é possível confirmar um agendamento ${appt.status}.` });
        if (appt.status !== 'pending') {
          return res.status(422).json({ code: 'INVALID_TRANSITION', error: `Transição inválida: ${appt.status} -> confirmed.` });
        }

        // conflito: mesmo profissional, mesmo horário
        const conflict = await Appointment.exists({
          _id: { $ne: appt._id },
          professional: appt.professional,
          status: { $in: ['pending', 'confirmed'] },
          dateTime: appt.dateTime
        });
        if (conflict) return res.status(409).json({ code: 'SCHEDULE_CONFLICT', error: 'Conflito de agenda para este horário.' });

        appt.status = 'confirmed';
        appt.updatedAt = new Date();
        await appt.save();

        return res.status(200).json({
          message: 'Agendamento confirmado.',
          data: { id: String(appt._id), status: appt.status, dateTime: appt.dateTime }
        });
      }

      case 'cancel': {
        if (!isProfessional && !isPatient) return res.status(403).json({ code: 'FORBIDDEN', error: 'Sem permissão para cancelar.' });
        if (isTerminal) return res.status(422).json({ code: 'INVALID_TRANSITION', error: `Não é possível cancelar um agendamento ${appt.status}.` });

        appt.status = 'canceled';
        appt.cancellationReason = payload.reason || null;
        appt.updatedAt = new Date();
        await appt.save();

        return res.status(200).json({
          message: 'Agendamento cancelado.',
          data: { id: String(appt._id), status: appt.status, reason: appt.cancellationReason }
        });
      }

      case 'reschedule': {
        if (!isProfessional) return res.status(403).json({ code: 'FORBIDDEN', error: 'Somente o profissional pode remarcar.' });
        if (isTerminal)      return res.status(422).json({ code: 'INVALID_TRANSITION', error: `Não é possível remarcar um agendamento ${appt.status}.` });

        const { dateTime } = payload || {};
        if (!dateTime) return res.status(400).json({ code: 'VALIDATION_ERROR', error: 'Payload inválido: "dateTime" é obrigatório.' });

        const newDt = new Date(dateTime);
        if (Number.isNaN(newDt.getTime())) {
          return res.status(400).json({ code: 'VALIDATION_ERROR', error: 'dateTime inválido (use ISO 8601).' });
        }

        // conflito no novo horário
        const conflict = await Appointment.exists({
          _id: { $ne: appt._id },
          professional: appt.professional,
          status: { $in: ['pending', 'confirmed'] },
          dateTime: newDt
        });
        if (conflict) return res.status(409).json({ code: 'SCHEDULE_CONFLICT', error: 'Conflito de agenda para a nova data/hora.' });

        appt.dateTime = newDt;
        appt.updatedAt = new Date();
        await appt.save();

        return res.status(200).json({
          message: 'Agendamento remarcado.',
          data: { id: String(appt._id), status: appt.status, dateTime: appt.dateTime }
        });
      }

      case 'complete': {
        if (!isProfessional) return res.status(403).json({ code: 'FORBIDDEN', error: 'Somente o profissional pode completar.' });
        if (isTerminal)      return res.status(422).json({ code: 'INVALID_TRANSITION', error: `Não é possível completar um agendamento ${appt.status}.` });
        if (appt.status !== 'confirmed') {
          return res.status(422).json({ code: 'INVALID_TRANSITION', error: `Transição inválida: ${appt.status} -> completed.` });
        }

        appt.status = 'completed';
        appt.updatedAt = new Date();
        await appt.save();

        return res.status(200).json({
          message: 'Agendamento concluído.',
          data: { id: String(appt._id), status: appt.status }
        });
      }

      default:
        return res.status(400).json({ code: 'UNKNOWN_ACTION', error: 'Ação desconhecida.' });
    }
  } catch (error) {
    console.error('Error acting on appointment:', error);
    return res.status(500).json({ code: 'INTERNAL_ERROR', error: 'Internal server error.' });
  }
};

export const getAppointmentById = async (req, res) => {
  /*
    #swagger.tags = ['Agendamentos']
    #swagger.summary = 'Buscar detalhes de um agendamento'
    #swagger.description = 'Retorna informações detalhadas de um agendamento específico. O agendamento não pode estar cancelado.'
    #swagger.security = [{ "bearerAuth": [] }]
    #swagger.parameters['authorization'] = {
      in: 'header',
      required: true,
      type: 'string',
      description: 'Token JWT do paciente ou profissional (Bearer <token>)'
}
#swagger.parameters['id'] = {
  in: 'path',
  required: true,
  type: 'string',
  description: 'ID do agendamento'
}

  */
  try {
    if (!req.userId) {
      return res.status(401).json({ code: 'UNAUTHORIZED', error: 'Unauthorized' });
    }

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ code: 'VALIDATION_ERROR', error: 'ID inválido.' });
    }

    const appt = await Appointment.findOne(
      { _id: id, status: { $ne: 'canceled' } },
      { status: 1, dateTime: 1, notes: 1, patient: 1, professional: 1 }
    )
      .populate('patient', '_id')
      .populate('professional', '_id name profileImage professionalSpecialties clinic')
      .lean();

    if (!appt) {
      return res.status(404).json({ code: 'NOT_FOUND', error: 'Agendamento não encontrado.' });
    }

    const uid = String(req.userId);
    const isPatient = String(appt.patient?._id) === uid;
    const isProfessional = String(appt.professional?._id) === uid;

    if (!isPatient && !isProfessional) {
      return res.status(403).json({ code: 'FORBIDDEN', error: 'Sem permissão para acessar este agendamento.' });
    }

    const host = req.get('host');
    const protocol = req.secure ? 'https' : (req.protocol || 'http');
    const baseUrl = `${protocol}://${host}`;

    const photoUrl = appt.professional?.profileImage
      ? `${baseUrl}/files/${appt.professional.profileImage}`
      : null;

    const clinic = appt.professional?.clinic || {};
    const part1 = [clinic.address, clinic.number].filter(Boolean).join(', ');
    const part2 = [clinic.neighborhood, clinic.city && `${clinic.city} - ${clinic.state}`]
      .filter(Boolean)
      .join(' • ');
    const selectedAddress = [part1, part2].filter(Boolean).join(' • ') || null;

    const data = {
      id: String(appt._id),
      status: appt.status,
      dateTime: appt.dateTime ? new Date(appt.dateTime).toISOString() : null,
      professional: {
        id: appt.professional ? String(appt.professional._id) : null,
        photoUrl,
        name: appt.professional?.name ?? null,
        distanceKm: null,
        specialties: appt.professional?.professionalSpecialties ?? []
      },
      yourObservation: appt.notes ?? null,
      selectedAddress
    };

    return res.status(200).json({ data });
  } catch (error) {
    console.error('Erro ao buscar agendamento:', error);
    return res.status(500).json({ code: 'INTERNAL_ERROR', error: 'Erro interno no servidor.' });
  }
};

export const getMyAppointments = async (req, res) => {
  /*
    #swagger.tags = ['Agendamentos']
    #swagger.summary = 'Meus agendamentos (Paciente ou Profissional)'
    #swagger.description = 'Lista agendamentos do usuário autenticado (paciente ou profissional).'
    #swagger.security = [{ "bearerAuth": [] }]

    // Força o Swagger a ignorar todos os detectados automaticamente
    #swagger.ignore = ['status', 'from', 'to', 'page', 'limit', 'sort', 'id', 'x-forwarded-proto', 'host']

    // Adiciona manualmente só o Authorization
    #swagger.parameters['authorization'] = {
      in: 'header',
      required: true,
      type: 'string',
      description: 'Token JWT do paciente ou profissional (Bearer <token>)'
    }
  */
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ code: 'UNAUTHORIZED', error: 'Unauthorized' });

    const {
      status, from, to,
      page = '1', limit = '20', sort = 'asc'
    } = req.query || {};

    const pageNum  = Math.max(parseInt(page, 10)  || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
    const skip     = (pageNum - 1) * limitNum;
    const sortDir  = sort === 'desc' ? -1 : 1;

    const role = req.userRole;
    const filter = {};
    if (role === 'professional') {
      filter.professional = userId;
    } else if (role === 'patient') {
      filter.patient = userId;
    } else {
      filter.$or = [{ patient: userId }, { professional: userId }];
    }

    if (status && status !== 'all') {
      filter.status = status;
    } else if (!status) {
      filter.status = { $ne: 'canceled' };
    }

    if (from || to) {
      filter.dateTime = {};
      if (from) {
        const d = new Date(from);
        if (!Number.isNaN(d.getTime())) filter.dateTime.$gte = d;
      }
      if (to) {
        const d = new Date(to);
        if (!Number.isNaN(d.getTime())) filter.dateTime.$lte = d;
      }
      if (Object.keys(filter.dateTime).length === 0) delete filter.dateTime;
    }

    const [items, total] = await Promise.all([
      Appointment.find(filter)
        .sort({ dateTime: sortDir })
        .skip(skip)
        .limit(limitNum)
        .populate({ path: 'professional', select: 'name profileImage' })
        .populate({ path: 'patient',     select: 'name' })
        .lean(),
      Appointment.countDocuments(filter)
    ]);

    const host = req.get('host');
    const protocol = req.secure ? 'https' : (req.protocol || 'http');
    const baseUrl = `${protocol}://${host}`;
    const fileUrl = (fileId) => (fileId ? `${baseUrl}/files/${fileId}` : null);

    const nowTs = Date.now();
    const data = items.map((a) => {
      const dtIso = a.dateTime ? new Date(a.dateTime).toISOString() : null;
      const isCompleted = a.status === 'confirmed' && a.dateTime && new Date(a.dateTime).getTime() < nowTs;

      return {
        id: String(a._id),
        status: a.status,
        derivedStatus: isCompleted ? 'completed' : undefined,
        dateTime: dtIso,
        professional: a.professional && {
          id: String(a.professional._id),
          name: a.professional.name || null,
          profileImageUrl: fileUrl(a.professional.profileImage)
        },
        patient: a.patient && {
          id: String(a.patient._id),
          name: a.patient.name || null
        }
      };
    });

    return res.status(200).json({
      meta: { page: pageNum, limit: limitNum, total, hasNextPage: skip + data.length < total },
      data
    });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return res.status(500).json({ code: 'INTERNAL_ERROR', error: 'Internal server error' });
  }
};
