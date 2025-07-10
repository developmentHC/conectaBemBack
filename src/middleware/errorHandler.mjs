export default function errorHandler(err, req, res) {
  console.error(err.stack);
  res
    .status(err.httpStatus || 500)
    .json({ error: err.message || "Erro Interno do Servidor" });
}
