export default function errorHandler(err, _req, res, _next) {
  console.error(err.stack);

  const status = err.statusCode || 500;

  res.status(status).json({
    error: status === 500 ? "Erro Interno do Servidor" : err.message,
  });
}
