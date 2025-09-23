import { clearDatabase } from "../../services/cleanup.service.mjs";

export async function cleanupController(req, res) {
  /*
    #swagger.tags = ['Cleanup']
    #swagger.summary = 'Limpar dados de teste'
    #swagger.description = 'Remove todos os documentos das coleções. **Disponível apenas em dev/teste.**'

    #swagger.responses[200] = {
      description: 'Banco de dados limpo com sucesso',
      schema: { message: "Banco de dados limpo com sucesso!" }
    }

    #swagger.responses[403] = {
      description: 'Operação não permitida em produção ou com flag desativada',
      schema: { error: "Operação não permitida" }
    }

    #swagger.responses[500] = {
      description: 'Erro interno ao limpar banco de dados',
      schema: { error: "Erro ao limpar banco de dados", details: "Mensagem de erro" }
    }
  */

  try {
    if (process.env.NODE_ENV === "production" || process.env.ENABLE_CLEANUP !== "true") {
      return res.status(403).json({ error: "Operação não permitida" });
    }

    await clearDatabase();
    return res.json({ message: "Banco de dados limpo com sucesso!" });
  } catch (error) {
    return res.status(500).json({
      error: "Erro ao limpar banco de dados",
      details: error.message
    });
  }
}