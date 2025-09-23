import express from "express";
import cors from "cors";
import { authenticateToken } from "../middleware/authMiddleware.mjs";
import {
  checkUserEmailSendOTP,
  checkOTP,
  completeSignUpPatient,
  completeSignUpProfessional,
  userInfo,
} from "../controller/userController/index.mjs";
import {
  changeActiveAddress,
  changeAddress,
  getAddresses,
} from "../controller/addressController/index.mjs";
import {
  createAppointment,
  actOnAppointment,
  getAppointmentById,
  getMyAppointments,
} from "../controller/appointmentController/index.mjs";
import {
  searchProfessionalsHighlightsWeek,
  searchProfessionalBySpeciality,
  searchBar,
} from "../controller/searchController/index.mjs";
import {
  createMessage,
  listMyContacts,
  markConversationAsRead,
  listUnreadConversations,
} from "../controller/messageController/index.mjs";

const allowedOrigins = [
  "http://localhost:3000",
  "https://conecta-bem-front.vercel.app",
  "https://conecta-bem-back.vercel.app",
  /https:\/\/conecta-bem-front-.*-conectabems-projects\.vercel\.app/, 
  /https:\/\/conecta-bem-front-git-[a-zA-Z0-9-]+-conectabems-projects\.vercel\.app/,
  /https:\/\/conecta-bem-back-.*-conectabems-projects\.vercel\.app/,
  /https:\/\/conecta-bem-back-git-[a-zA-Z0-9-]+-conectabems-projects\.vercel\.app/,
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

// -------------------
// 🔹 Rotas principais
// -------------------
router.post("/auth/sendOTP", checkUserEmailSendOTP);
router.post("/auth/checkOTP", checkOTP);
router.post("/auth/createPatient", completeSignUpPatient);
router.post("/auth/createProfessional", completeSignUpProfessional);

router.get("/user", authenticateToken, userInfo);

router.put("/address", changeAddress);
router.get("/address", getAddresses);
router.put("/active-address", changeActiveAddress);

router.get("/search/highlightsWeek", searchProfessionalsHighlightsWeek);
router.get("/search/professionalBySpeciality/:speciality", searchProfessionalBySpeciality);
router.get("/search/searchBar/:terms", searchBar);

router.post("/appointments", authenticateToken, createAppointment);
router.post("/appointments/:id/actions", authenticateToken, actOnAppointment);
router.get("/appointments/:id", authenticateToken, getAppointmentById);
router.get("/appointments/me", authenticateToken, getMyAppointments);

router.post("/messages", authenticateToken, createMessage);
router.get("/messages/contacts", authenticateToken, listMyContacts);
router.patch("/conversations/:conversationId/read", authenticateToken, markConversationAsRead);
router.get("/messages/unread", authenticateToken, listUnreadConversations);

router.get("/teste", (req, res) => {
  /*
    #swagger.tags = ['Test']
    #swagger.summary = 'Teste para verificar se API está funcionando'
  */
  return res.status(200).json({ message: "API is working" });
});

router.post("/webhooks/message-created", (req, res) => {
  /*
    #swagger.tags = ['Webhooks']
    #swagger.summary = 'Evento enviado quando uma nova mensagem é criada'
    #swagger.consumes = ['application/json']
    #swagger.produces = ['application/json']
    #swagger.parameters['X-Event-Type'] = {
      in: 'header',
      required: true,
      type: 'string',
      example: 'message.created',
      description: 'Tipo do evento'
    }
    #swagger.parameters['X-Event-Id'] = {
      in: 'header',
      required: true,
      type: 'string',
      example: 'e5ae2396-ff2c-4a6b-8906-73a4459d42cc',
      description: 'UUID único do evento'
    }
    #swagger.parameters['X-Signature-SHA256'] = {
      in: 'header',
      required: true,
      type: 'string',
      example: 'a8bcf7e31c9d8d...',
      description: 'Assinatura HMAC SHA-256 do corpo com WEBHOOK_SECRET'
    }
    #swagger.parameters['body'] = {
      in: 'body',
      required: true,
      schema: { $ref: '#/definitions/WebhookMessageCreated' }
    }
    #swagger.responses[200] = {
      description: 'Exemplo de payload recebido pelo webhook',
      schema: {
        eventId: "e5ae2396-ff2c-4a6b-8906-73a4459d42cc",
        type: "message.created",
        occurredAt: "2025-08-05T22:48:13.781Z",
        data: {
          messageId: "68928a2d6acdb8a8dd58cc63",
          conversation: "conv_teste_123",
          sender: "68928a2d6acdb8a8dd58cc62",
          senderName: "Testador",
          content: "Mensagem teste webhook",
          createdAt: "2025-08-05T22:48:13.592Z"
          }
        }
      }
      #swagger.responses[401] = {
        description: 'Assinatura inválida'
      }
  */
  return res.status(200).json({ received: true });
});

// 🔹 Cleanup só em dev/test
if (process.env.NODE_ENV !== "production") {
  const cleanupRoutes = await import("./cleanup.mjs");
  router.use("/", cleanupRoutes.default);
}

export default router;

