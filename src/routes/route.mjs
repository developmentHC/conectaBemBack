import express from "express";
import cors from "cors";
import {
  checkUserEmailSendOTP,
  checkOTP,
  completeSignUpPatient,
  completeSignUpProfessional,
} from "./../controller/userController/index.mjs";
import { searchProfessionalsHighlightsWeek, searchProfessionalBySpeciality } from "./../controller/searchController/index.mjs"
import authMiddleware from "../utils/authMiddleware.mjs";

const router = express.Router();

const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      "http://localhost:3000",
      "https://conecta-bem-visu.vercel.app/",
    ];

    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  optionsSuccessStatus: 200,
  credentials: true,
};

router.use(cors(corsOptions));
router.use(express.json());

router.post("/auth/sendOTP", checkUserEmailSendOTP);
router.post("/auth/checkOTP", checkOTP);
router.post("/auth/createPatient", completeSignUpPatient);
router.post("/auth/createProfessional", completeSignUpProfessional);
router.post("/search/highlightsWeek", authMiddleware, searchProfessionalsHighlightsWeek);
router.post("/search/professionalBySpeciality/:speciality", authMiddleware, searchProfessionalBySpeciality);

router.get("/teste", (req, res) => {
  /*
    #swagger.tags = ['Test']
    #swagger.summary = 'Teste para verificar se API está funcionando'
  */
  console.log("API is working!");
  return res.status(200).json({ message: "API is working" });
});

export default router;
