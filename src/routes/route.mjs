import express from "express";
import cors from "cors";
import {
  checkUserEmailSendOTP,
  checkOTP,
  completeSignUpPatient,
  completeSignUpProfessional,
} from "./../controller/userController/index.mjs";
import { searchProfessionalsHighlightsWeek, searchProfessionalBySpeciality } from "./../controller/searchController/index.mjs"

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
router.post("/search/highlightsWeek", searchProfessionalsHighlightsWeek);
router.post("/search/professionalBySpeciality/:speciality", searchProfessionalBySpeciality);

router.get("/teste", (req, res) => {
  /*
    #swagger.tags = ['Test']
    #swagger.summary = 'Teste para verificar se API está funcionando'
  */
  console.log("API is working!");
  return res.status(200).json({ message: "API is working" });
});

export default router;
