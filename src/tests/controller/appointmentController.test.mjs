import { jest } from "@jest/globals";
import mongoose from "mongoose";

jest.unstable_mockModule("../../models/Appointment.mjs", () => ({
  __esModule: true,
  default: {
    exists: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
  },
}));
const Appointment = (await import("../../models/Appointment.mjs")).default;
const makeRes = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
  setHeader: jest.fn(),
});
const makeReq = (overrides = {}) => ({
  userId: "user123",
  params: {},
  body: {},
  ...overrides,
});
const mockValidObjectId = (valid = true) =>
  jest.spyOn(mongoose.Types.ObjectId, "isValid").mockReturnValue(valid);

const expectError = (res, status, errorObj) => {
  expect(res.status).toHaveBeenCalledWith(status);
  expect(res.json).toHaveBeenCalledWith(errorObj);
};

afterEach(() => {
  jest.clearAllMocks();
  jest.restoreAllMocks();
});
let createAppointment;
let actOnAppointment;

beforeAll(async () => {
  const controller = await import("../../controller/appointmentController/index.mjs");
  createAppointment = controller.createAppointment;
  actOnAppointment = controller.actOnAppointment;
});

describe("createAppointment", () => {
  it("401 se não houver userId", async () => {
    const req = makeReq({ userId: null });
    const res = makeRes();

    await createAppointment(req, res);

    expectError(res, 401, { error: "Unauthorized" });
  });

  it("400 se faltar professionalId/dateTime/address", async () => {
    const req = makeReq({
      body: { professionalId: "", dateTime: "", address: null },
    });
    const res = makeRes();

    await createAppointment(req, res);

    expectError(res, 400, {
      error: "Campos professionalId, dateTime e address são obrigatórios.",
    });
  });

  it("400 se clinicId não informado", async () => {
    const req = makeReq({
      body: {
        professionalId: "prof123",
        dateTime: "2099-09-10T10:00:00Z",
        address: {},
      },
    });
    const res = makeRes();

    await createAppointment(req, res);

    expectError(res, 400, { error: "É obrigatório informar clinicId no address." });
  });

  it("400 se dateTime inválido", async () => {
    const req = makeReq({
      body: {
        professionalId: "prof123",
        dateTime: "data-invalida",
        address: { clinicId: "clinic123" },
      },
    });
    const res = makeRes();

    await createAppointment(req, res);

    expectError(res, 400, { error: "dateTime inválido. Use ISO 8601." });
  });

  it("422 se dateTime no passado", async () => {
    const req = makeReq({
      body: {
        professionalId: "prof123",
        dateTime: new Date(Date.now() - 3600_000).toISOString(),
        address: { clinicId: "clinic123" },
      },
    });
    const res = makeRes();

    await createAppointment(req, res);

    expectError(res, 422, { error: "Não é possível agendar no passado." });
  });

  it("422 se paciente == profissional", async () => {
    const sameId = "same123";
    const req = makeReq({
      userId: sameId,
      body: {
        professionalId: sameId,
        dateTime: new Date(Date.now() + 3600_000).toISOString(),
        address: { clinicId: "clinic123" },
      },
    });
    const res = makeRes();

    await createAppointment(req, res);

    expectError(res, 422, {
      error: "Não é possível se agendar como seu próprio paciente.",
    });
  });

  it("409 se já existir agendamento no horário", async () => {
    Appointment.exists.mockResolvedValue(true);

    const req = makeReq({
      body: {
        professionalId: "prof456",
        dateTime: new Date(Date.now() + 3600_000).toISOString(),
        address: { clinicId: "clinic123" },
      },
    });
    const res = makeRes();

    await createAppointment(req, res);

    expect(Appointment.exists).toHaveBeenCalled();
    expectError(res, 409, { error: "Este horário já está agendado." });
  });

  it("201 se criar com sucesso", async () => {
    Appointment.exists.mockResolvedValue(false);
    Appointment.create.mockResolvedValue({
      _id: "appt123",
      status: "pending",
      dateTime: new Date("2099-09-10T10:00:00Z"),
    });

    const req = makeReq({
      userId: "patient123",
      body: {
        professionalId: "prof123",
        dateTime: "2099-09-10T10:00:00Z",
        address: { clinicId: "clinic123" },
        notes: "Trazer exames",
      },
    });
    const res = makeRes();

    await createAppointment(req, res);

    expect(res.setHeader).toHaveBeenCalledWith("Location", "/appointments/appt123");
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Solicitação enviada.",
        data: expect.objectContaining({
          id: "appt123",
          status: "pending",
        }),
      })
    );
  });

  it("500 em erro inesperado", async () => {
    Appointment.exists.mockResolvedValue(false);
    Appointment.create.mockRejectedValue(new Error("DB error"));

    const req = makeReq({
      userId: "patient123",
      body: {
        professionalId: "prof123",
        dateTime: "2099-09-10T10:00:00Z",
        address: { clinicId: "clinic123" },
      },
    });
    const res = makeRes();

    await createAppointment(req, res);

    expectError(res, 500, { error: "Internal server error." });
  });
});

describe("actOnAppointment", () => {
  it("401 se não houver userId", async () => {
    const req = makeReq({
      userId: null,
      params: { id: new mongoose.Types.ObjectId().toString() },
      body: { action: "confirm" },
    });
    const res = makeRes();

    await actOnAppointment(req, res);

    expectError(res, 401, { code: "UNAUTHORIZED", error: "Unauthorized" });
  });

  it("400 se id inválido", async () => {
    mockValidObjectId(false);

    const req = makeReq({
      params: { id: "id-invalido" },
      body: { action: "confirm" },
    });
    const res = makeRes();

    await actOnAppointment(req, res);

    expectError(res, 400, {
      code: "VALIDATION_ERROR",
      error: "ID inválido.",
    });
  });

  it("400 se action não enviado", async () => {
    mockValidObjectId(true);

    const req = makeReq({
      params: { id: new mongoose.Types.ObjectId().toString() },
      body: {},
    });
    const res = makeRes();

    await actOnAppointment(req, res);

    expectError(res, 400, {
      code: "VALIDATION_ERROR",
      error: 'Campo "action" é obrigatório.',
    });
  });

  it("404 se agendamento não encontrado", async () => {
    mockValidObjectId(true);
    Appointment.findById.mockResolvedValue(null);

    const req = makeReq({
      params: { id: new mongoose.Types.ObjectId().toString() },
      body: { action: "confirm" },
    });
    const res = makeRes();

    await actOnAppointment(req, res);

    expectError(res, 404, {
      code: "NOT_FOUND",
      error: "Agendamento não encontrado.",
    });
  });

  it("403 se usuário não for o profissional ao confirmar", async () => {
    mockValidObjectId(true);
    Appointment.findById.mockResolvedValue({
      professional: "outroPro",
      patient: "paciente123",
      status: "pending",
    });

    const req = makeReq({
      userId: "paciente123",
      params: { id: new mongoose.Types.ObjectId().toString() },
      body: { action: "confirm" },
    });
    const res = makeRes();

    await actOnAppointment(req, res);

    expectError(res, 403, {
      code: "FORBIDDEN",
      error: "Somente o profissional pode confirmar.",
    });
  });

  it("422 se confirmar agendamento já cancelado", async () => {
    mockValidObjectId(true);
    Appointment.findById.mockResolvedValue({
      professional: "pro123",
      status: "canceled",
    });

    const req = makeReq({
      userId: "pro123",
      params: { id: new mongoose.Types.ObjectId().toString() },
      body: { action: "confirm" },
    });
    const res = makeRes();

    await actOnAppointment(req, res);

    expectError(res, 422, {
      code: "INVALID_TRANSITION",
      error: "Não é possível confirmar um agendamento canceled.",
    });
  });

  it("422 se cancelar agendamento já completo", async () => {
    mockValidObjectId(true);
    Appointment.findById.mockResolvedValue({
      professional: "pro123",
      patient: "pac123",
      status: "completed",
    });

    const req = makeReq({
      userId: "pac123",
      params: { id: new mongoose.Types.ObjectId().toString() },
      body: { action: "cancel" },
    });
    const res = makeRes();

    await actOnAppointment(req, res);

    expectError(res, 422, {
      code: "INVALID_TRANSITION",
      error: "Não é possível cancelar um agendamento completed.",
    });
  });

  it("409 se conflito ao confirmar", async () => {
    mockValidObjectId(true);
    Appointment.findById.mockResolvedValue({
      _id: "appt1",
      professional: "pro123",
      status: "pending",
      dateTime: new Date(),
    });
    Appointment.exists.mockResolvedValue(true);

    const req = makeReq({
      userId: "pro123",
      params: { id: new mongoose.Types.ObjectId().toString() },
      body: { action: "confirm" },
    });
    const res = makeRes();

    await actOnAppointment(req, res);

    expectError(res, 409, {
      code: "SCHEDULE_CONFLICT",
      error: "Conflito de agenda para este horário.",
    });
  });

  it("409 se conflito ao remarcar", async () => {
    mockValidObjectId(true);
    Appointment.findById.mockResolvedValue({
      _id: "appt2",
      professional: "pro123",
      status: "pending",
      dateTime: new Date(),
    });
    Appointment.exists.mockResolvedValue(true);

    const req = makeReq({
      userId: "pro123",
      params: { id: new mongoose.Types.ObjectId().toString() },
      body: {
        action: "reschedule",
        payload: { dateTime: new Date().toISOString() },
      },
    });
    const res = makeRes();

    await actOnAppointment(req, res);

    expectError(res, 409, {
      code: "SCHEDULE_CONFLICT",
      error: "Conflito de agenda para a nova data/hora.",
    });
  });

  it("200 ao confirmar com sucesso", async () => {
    mockValidObjectId(true);
    const fakeAppt = {
      _id: "appt1",
      professional: "pro123",
      status: "pending",
      dateTime: new Date(),
      save: jest.fn(),
    };
    Appointment.findById.mockResolvedValue(fakeAppt);
    Appointment.exists.mockResolvedValue(false);

    const req = makeReq({
      userId: "pro123",
      params: { id: new mongoose.Types.ObjectId().toString() },
      body: { action: "confirm" },
    });
    const res = makeRes();

    await actOnAppointment(req, res);

    expect(fakeAppt.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Agendamento confirmado.",
        data: expect.objectContaining({ status: "confirmed" }),
      })
    );
  });

  it("200 ao cancelar com sucesso", async () => {
    mockValidObjectId(true);
    const fakeAppt = {
      _id: "appt2",
      professional: "pro123",
      patient: "pac123",
      status: "pending",
      save: jest.fn(),
    };
    Appointment.findById.mockResolvedValue(fakeAppt);

    const req = makeReq({
      userId: "pac123",
      params: { id: new mongoose.Types.ObjectId().toString() },
      body: {
        action: "cancel",
        payload: { reason: "Indisponibilidade" },
      },
    });
    const res = makeRes();

    await actOnAppointment(req, res);

    expect(fakeAppt.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Agendamento cancelado.",
        data: expect.objectContaining({
          status: "canceled",
          reason: "Indisponibilidade",
        }),
      })
    );
  });
});
