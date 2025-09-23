import { Router } from "express";
import { cleanupController } from "../controller/cleanupController/index.mjs";

const router = Router();

router.delete("/cleanup", cleanupController);

export default router;
