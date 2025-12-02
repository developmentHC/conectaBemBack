export const validatePhotoUpload = (req, res, next) => {
  if (!req.body.userId) {
    return res.status(400).json({ error: "userId é obrigatório" });
  }

  if (!req.file) {
    return res.status(400).json({ error: "Nenhuma foto enviada" });
  }

  next();
};
