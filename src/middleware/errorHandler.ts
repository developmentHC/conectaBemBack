// middleware/errorHandler.js
export default function errorHandler(err  : any, req: any, res: any, next: any) {
  console.error(err.stack);
  res.status(err.httpStatus || 500).json({ error: err.message || "Erro Interno do Servidor" });
}
