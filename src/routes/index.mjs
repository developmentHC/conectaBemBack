import express from "express";
import cors from "cors";
import authMiddleware from "../utils/authMiddleware.mjs";
import {
  checkUserEmailSendOTP,
  checkOTP,
  completeSignUpPatient,
  completeSignUpProfessional,
  userInfo,
} from "../controller/userController/index.mjs";
import { 
  createAppointment, 
  getMyAppointments,
  getAppointmentById,
  cancelAppointment
} from "../controller/appointmentController/index.mjs";
import {
  createInteraction,
  getInteractionsByAppointment,
} from "../controller/interactionController/index.mjs";
import {
  searchProfessionalsHighlightsWeek,
  searchProfessionalBySpeciality,
  searchBar,
} from "../controller/searchController/index.mjs";

const router = express.Router();
const corsOptions = {
  optionsSuccessStatus: 200,
  credentials: true,
};

router.use(cors(corsOptions));
router.use(express.json());

router.post("/auth/sendOTP", checkUserEmailSendOTP);
router.post("/auth/checkOTP", checkOTP);
router.post("/auth/createPatient", completeSignUpPatient);
router.post("/auth/createProfessional", completeSignUpProfessional);

router.get("/user", userInfo);

router.post("/appointments", authMiddleware, createAppointment);
router.get("/appointments/me", authMiddleware, getMyAppointments);
router.get("/appointments/:id", authMiddleware, getAppointmentById);
router.delete("/appointments/:id", authMiddleware, cancelAppointment);


router.get("/interactions/:appointmentId", authMiddleware, getInteractionsByAppointment);
router.post("/interactions", authMiddleware, createInteraction);

router.get("/search/highlightsWeek", searchProfessionalsHighlightsWeek);
router.get("/search/professionalBySpeciality/:speciality", searchProfessionalBySpeciality);
router.get("/search/searchBar/:terms", searchBar);

router.get("/teste", (req, res) => {
  /*
    #swagger.tags = ['Test']
    #swagger.summary = 'Teste para verificar se API está funcionando'
  */
  console.log("API is working!");
  return res.status(200).json({ message: "API is working" });
});

export default router;
