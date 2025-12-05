export const validatePhotoUpload = (req, res, next) => {

  if (!req.file) {
    return res.status(400).json({ error: "Nenhuma foto enviada" });
  }

  next();
};
