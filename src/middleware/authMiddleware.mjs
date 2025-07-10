import jwt from "jsonwebtoken";

export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Acesso negado. Token não fornecido ou mal formatado." });
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    req.userId = decoded.userId;

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(403).json({ message: "Token expirado." });
    }
    return res.status(403).json({ message: "Token inválido." });
  }
};
