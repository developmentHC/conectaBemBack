import multer from "multer";
import { ValidationError } from "../services/validationService.mjs";

const storage = multer.memoryStorage();

export const uploadPhoto = multer({
  storage,
  limits: {
    fileSize: 3 * 1024 * 1024,
  },
  fileFilter: (req, file, callback) => {
    if (!file.mimetype.startsWith("image/")) {
      return callback(
        new ValidationError("A foto enviada não é uma imagem válida."),
        false
      );
    }
    callback(null, true);
  },
}).single("profilePhoto");

