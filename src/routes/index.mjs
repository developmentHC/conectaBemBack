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
import { authenticateToken } from "../middleware/authMiddleware.mjs";
import {
  changeActiveAddress,
  changeAddress,
  getAddresses,
} from "../controller/addressController/index.mjs";

const allowedOrigins = [
  "http://localhost:3000",
  "https://conecta-bem-front.vercel.app",
  /https:\/\/conecta-bem-front-.*-conectabems-projects\.vercel\.app/,
  /https:\/\/conecta-bem-front-git-[a-zA-Z0-9-]+-conectabems-projects\.vercel\.app/,
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    const isAllowed = allowedOrigins.some((allowedOrigin) => {
      if (typeof allowedOrigin === "string") {
        return origin === allowedOrigin;
      } else if (allowedOrigin instanceof RegExp) {
        return allowedOrigin.test(origin);
      }
      return false;
    });

    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error("Acesso bloqueado pelo CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

const router = express.Router();

router.use(cors(corsOptions));
router.use(express.json());

router.post("/auth/sendOTP", checkUserEmailSendOTP);
router.post("/auth/checkOTP", checkOTP);
router.post("/auth/createPatient", completeSignUpPatient);
router.post("/auth/createProfessional", completeSignUpProfessional);

router.get("/search/highlightsWeek", searchProfessionalsHighlightsWeek);
router.get(
  "/search/professionalBySpeciality/:speciality",
  searchProfessionalBySpeciality,
);
router.get("/search/searchBar/:terms", searchBar);

router.put("/address", changeAddress);
router.get("/address", getAddresses);
router.put("/active-address", changeActiveAddress);

router.get("/user", authenticateToken, userInfo);

router.get("/teste", (req, res) => {
  /*
    #swagger.tags = ['Test']
    #swagger.summary = 'Teste para verificar se API está funcionando'
  */
  console.log("API is working!");
  return res.status(200).json({ message: "API is working" });
});

export default router;
