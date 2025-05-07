import express from "express";
import cors from "cors";
import {
  checkUserEmailSendOTP,
  checkOTP,
  completeSignUpPatient,
  completeSignUpProfessional,
  userInfo,
} from "../controller/userController/index.mjs";
import {
  searchProfessionalsHighlightsWeek,
  searchProfessionalBySpeciality,
  searchBar,
} from "../controller/searchController/index.mjs";
import { changeAddress } from "../controller/addressController/index.mjs";

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

router.get("/search/highlightsWeek", searchProfessionalsHighlightsWeek);
router.get("/search/professionalBySpeciality/:speciality", searchProfessionalBySpeciality);
router.get("/search/searchBar/:terms", searchBar);

router.put("/address", changeAddress);

router.get("/user", userInfo);

router.get("/teste", (req, res) => {
  /*
    #swagger.tags = ['Test']
    #swagger.summary = 'Teste para verificar se API está funcionando'
  */
  console.log("API is working!");
  return res.status(200).json({ message: "API is working" });
});

export default router;
