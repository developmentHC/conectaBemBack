import mongoose from "mongoose";
import { randomUUID } from "node:crypto";
import InboxMessage from "../../models/InboxMessage.mjs";
import Conversation from "../../models/Conversation.mjs";
import ConversationMember from "../../models/ConversationMember.mjs";
import User from "../../models/User.mjs";

export async function createMessage(req, res) {
  /*
  #swagger.tags = ['Messages']
  #swagger.summary = 'Enviar mensagem em uma conversa'
  #swagger.description = 'Cria uma nova mensagem em uma conversa existente ou inicia uma nova conversa caso não seja informado um ID. Atualiza o lastMessage e incrementa o unreadCount dos participantes.'
  #swagger.security = [{ "bearerAuth": [] }]

  #swagger.parameters['authorization'] = {
    in: 'header',
    required: true,
    type: 'string',
    description: 'Token JWT — formato: Bearer <token>',
    example: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  }

  #swagger.parameters['body'] = {
    in: 'body',
    required: true,
    description: 'Dados da mensagem a ser enviada',
    schema: {
      type: 'object',
      required: ['content'],
      properties: {
        conversation: { 
          type: 'string', 
          example: 'a7b3c1d4-5e6f-7g8h-9i0j-1234567890ab', 
          description: 'Identificador único da conversa. Opcional — se não enviado, será criado automaticamente.'
        },
        content: { 
          type: 'string', 
          example: 'Olá, tudo bem?', 
          description: 'Conteúdo da mensagem enviada'
        },
        participants: {
          type: 'array',
          items: { type: 'string' },
          example: ['66b9f4e2f4a5a7d6f4b9c123', '66b9f4e2f4a5a7d6f4b9c456'],
          description: 'Lista de participantes da conversa. Obrigatório se conversation não for informado.'
        }
      }
    }
  }

  #swagger.responses[201] = {
    description: 'Mensagem criada com sucesso',
    schema: { 
      success: true,
      messageId: "66b9f4e2f4a5a7d6f4b9c789",
      conversation: "a7b3c1d4-5e6f-7g8h-9i0j-1234567890ab"
    }
  }

  #swagger.responses[400] = { 
    description: 'Parâmetros obrigatórios ausentes ou inválidos',
    schema: { error: "content é obrigatório" }
  }

  #swagger.responses[401] = { 
    description: 'Usuário não autenticado (JWT ausente ou inválido)',
    schema: { error: "Não autenticado" }
  }

  #swagger.responses[500] = {
    description: 'Erro interno no servidor',
    schema: { error: "Erro interno" }
  }
*/

  try {
    const userId = req.user?.id ?? req.userId;
    let { conversation, content, participants } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "Não autenticado" });
    }
    if (!content) {
      return res.status(400).json({ error: "content é obrigatório" });
    }

    if (!conversation) {
      if (!participants || participants.length === 0) {
        return res
          .status(400)
          .json({ error: "participants é obrigatório quando não há conversation" });
      }
      conversation = randomUUID();
    }

    if (!participants?.includes(userId)) {
      participants = [...(participants || []), userId];
    }

    const participantsObjIds = participants.map((id) => new mongoose.Types.ObjectId(id));
    const userObjId = new mongoose.Types.ObjectId(userId);

    await Conversation.updateOne(
      { conversation },
      {
        $setOnInsert: {
          conversation,
          participants: participantsObjIds,
        },
      },
      { upsert: true }
    );

    const msg = await InboxMessage.create({
      conversation,
      sender: userObjId,
      content,
    });

    await Conversation.updateOne(
      { conversation },
      { $set: { lastMessage: { content, sender: userObjId, createdAt: msg.createdAt } } }
    );

    for (const memberId of participants) {
      const isSelf = String(memberId) === String(userId);

      if (isSelf) {
        await ConversationMember.updateOne(
          { conversation, user: new mongoose.Types.ObjectId(memberId) },
          { $setOnInsert: { unreadCount: 0 } },
          { upsert: true }
        );
      } else {
        const res = await ConversationMember.updateOne(
          { conversation, user: new mongoose.Types.ObjectId(memberId) },
          { $inc: { unreadCount: 1 } },
          { upsert: false }
        );

        if (res.matchedCount === 0) {
          await ConversationMember.updateOne(
            { conversation, user: new mongoose.Types.ObjectId(memberId) },
            { $setOnInsert: { unreadCount: 1 } },
            { upsert: true }
          );
        }
      }
    }

    return res.status(201).json({
      success: true,
      messageId: msg._id,
      conversation,
    });
  } catch (err) {
    console.error("Erro ao criar mensagem:", err);
    return res.status(500).json({ error: "Erro interno" });
  }
}

export async function listMyContacts(req, res) {
  /*
  #swagger.tags = ['Messages']
  #swagger.summary = 'Listar contatos do usuário'
  #swagger.description = 'Lista todos os contatos (pacientes ou profissionais) do usuário autenticado, incluindo último envio e quantidade de mensagens não lidas.'
  #swagger.security = [{ "bearerAuth": [] }]

  #swagger.parameters['authorization'] = {
    in: 'header',
    required: true,
    type: 'string',
    description: 'Token JWT — formato: Bearer <token>',
    example: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  }

  #swagger.responses[200] = {
    description: 'Contatos listados com sucesso',
    schema: {
      items: [
        {
          conversation: "a7b3c1d4-5e6f-7g8h-9i0j-1234567890ab",
          contactId: "66b9f4e2f4a5a7d6f4b9c123",
          contactName: "Maria Souza",
          contactAvatar: "https://api.seusistema.com/uploads/66b9f4e2f4a5a7d6f4b9c999",
          userType: "patient",
          lastMessage: {
            content: "Olá, tudo bem?",
            sender: "66b9f4e2f4a5a7d6f4b9c123",
            createdAt: "2025-09-10T14:00:00Z"
          },
          unreadCount: 2
        }
      ]
    }
  }

  #swagger.responses[401] = {
    description: 'Usuário não autenticado',
    schema: { error: "Não autenticado" }
  }

  #swagger.responses[500] = {
    description: 'Erro interno no servidor',
    schema: { error: "Erro interno" }
  }
*/

  try {
    const userId = req.user?.id ?? req.userId;
    if (!userId) return res.status(401).json({ error: "Não autenticado" });

    const myConvMembers = await ConversationMember.find({
      user: new mongoose.Types.ObjectId(userId),
    })
      .select({ conversation: 1, unreadCount: 1, _id: 0 })
      .lean();

    const convIds = myConvMembers.map((c) => c.conversation);
    if (convIds.length === 0) {
      return res.status(200).json({ items: [] });
    }

    const unreadByConv = new Map(myConvMembers.map((c) => [c.conversation, c.unreadCount]));

    const conversations = await Conversation.find({ conversation: { $in: convIds } })
      .sort({ "lastMessage.createdAt": -1 })
      .lean();

    const me = String(userId);
    const otherIds = [];
    const otherByConv = new Map();

    for (const c of conversations) {
      const others = (c.participants ?? []).map(String).filter((p) => p !== me);
      const otherId = others[0];
      if (otherId) {
        otherByConv.set(c.conversation, otherId);
        otherIds.push(otherId);
      }
    }

    const users = await User.find({ _id: { $in: otherIds } })
      .select("name profileImage userType")
      .lean();

    const userMap = new Map(users.map((u) => [String(u._id), u]));

    const buildAvatarUrl = (profileImageId) => {
      if (!profileImageId) return null;
      return `${process.env.BASE_URL}/uploads/${profileImageId}`;
    };

    const items = conversations.map((c) => {
      const otherId = otherByConv.get(c.conversation);
      const u = userMap.get(otherId);

      return {
        conversation: c.conversation,
        contactId: otherId,
        contactName: u?.name || "Usuário",
        contactAvatar: buildAvatarUrl(u?.profileImage),
        userType: u?.userType?.[0] || null,
        lastMessage: c.lastMessage ?? null,
        unreadCount: unreadByConv.get(c.conversation) ?? 0,
      };
    });

    return res.status(200).json({ items });
  } catch (err) {
    console.error("Erro ao listar contatos:", err);
    return res.status(500).json({ error: "Erro interno" });
  }
}

export async function markConversationAsRead(req, res) {
  /*
  #swagger.tags = ['Messages']
  #swagger.summary = 'Marcar conversa como lida'
  #swagger.description = 'Zera o campo unreadCount do usuário autenticado nessa conversa.'
  #swagger.security = [{ "bearerAuth": [] }]

  #swagger.parameters['authorization'] = {
    in: 'header',
    required: true,
    type: 'string',
    description: 'Token JWT — formato: Bearer <token>',
    example: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  }

  #swagger.parameters['conversationId'] = {
    in: 'path',
    required: true,
    type: 'string',
    description: 'Identificador único da conversa',
    example: 'a7b3c1d4-5e6f-7g8h-9i0j-1234567890ab'
  }

  #swagger.responses[204] = {
    description: 'Conversa marcada como lida (sem conteúdo de resposta)'
  }

  #swagger.responses[401] = {
    description: 'Usuário não autenticado',
    schema: { error: "Não autenticado" }
  }

  #swagger.responses[403] = {
    description: 'Usuário não participa da conversa',
    schema: { error: "Você não tem acesso a esta conversa" }
  }

  #swagger.responses[404] = {
    description: 'Conversa não encontrada',
    schema: { error: "Conversa não encontrada" }
  }

  #swagger.responses[500] = {
    description: 'Erro interno no servidor',
    schema: { error: "Erro interno" }
  }
*/

  try {
    const userId = req.user?.id ?? req.userId;
    const { conversationId } = req.params;

    if (!userId) return res.status(401).json({ error: "Não autenticado" });

    const conv = await Conversation.findOne({ conversation: conversationId }).lean();
    if (!conv) return res.status(404).json({ error: "Conversa não encontrada" });

    const isParticipant = (conv.participants ?? []).some((p) => String(p) === String(userId));
    if (!isParticipant)
      return res.status(403).json({ error: "Você não tem acesso a esta conversa" });

    await ConversationMember.updateOne(
      { conversation: conversationId, user: new mongoose.Types.ObjectId(userId) },
      { $set: { unreadCount: 0 } },
      { upsert: true }
    );

    return res.status(204).send();
  } catch (err) {
    console.error("Erro ao marcar conversa como lida:", err);
    return res.status(500).json({ error: "Erro interno" });
  }
}

export async function listUnreadConversations(req, res) {
  /*
  #swagger.tags = ['Messages']
  #swagger.summary = 'Listar conversas com mensagens não lidas'
  #swagger.description = 'Retorna apenas as conversas onde o usuário logado possui mensagens não lidas (unreadCount > 0).'
  #swagger.security = [{ "bearerAuth": [] }]

  #swagger.parameters['authorization'] = {
    in: 'header',
    required: true,
    type: 'string',
    description: 'Token JWT — formato: Bearer <token>',
    example: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  }

  #swagger.responses[200] = {
    description: 'Lista de conversas com mensagens não lidas retornada com sucesso',
    schema: {
      items: [
        {
          conversation: "a7b3c1d4-5e6f-7g8h-9i0j-1234567890ab",
          otherId: "66b9f4e2f4a5a7d6f4b9c123",
          otherName: "Maria Souza",
          otherAvatar: "https://api.seusistema.com/uploads/avatar123.png",
          lastMessage: {
            content: "Oi, tudo bem?",
            sender: "66b9f4e2f4a5a7d6f4b9c123",
            createdAt: "2025-09-10T14:00:00Z"
          },
          unreadCount: 3
        }
      ]
    }
  }

  #swagger.responses[401] = {
    description: 'Usuário não autenticado',
    schema: { error: "Não autenticado" }
  }

  #swagger.responses[500] = {
    description: 'Erro interno no servidor',
    schema: { error: "Erro interno" }
  }
*/

  try {
    const userId = req.user?.id ?? req.userId;
    if (!userId) return res.status(401).json({ error: "Não autenticado" });

    const unreadConvMembers = await ConversationMember.find({
      user: new mongoose.Types.ObjectId(userId),
      unreadCount: { $gt: 0 },
    })
      .select({ conversation: 1, unreadCount: 1, _id: 0 })
      .lean();

    if (unreadConvMembers.length === 0) {
      return res.status(200).json({ items: [] });
    }

    const unreadByConv = new Map(unreadConvMembers.map((c) => [c.conversation, c.unreadCount]));

    const convIds = unreadConvMembers.map((c) => c.conversation);

    const conversations = await Conversation.find({ conversation: { $in: convIds } })
      .sort({ "lastMessage.createdAt": -1 })
      .lean();

    const items = [];
    for (const c of conversations) {
      const participants = (c.participants ?? []).map(String);
      const otherId = participants.find((p) => p !== String(userId));

      const otherUser = await User.findById(otherId).select("name avatar").lean();

      items.push({
        conversation: c.conversation,
        otherId,
        otherName: otherUser?.name || "Usuário",
        otherAvatar: otherUser?.avatar || null,
        lastMessage: c.lastMessage ?? null,
        unreadCount: unreadByConv.get(c.conversation) ?? 0,
      });
    }

    return res.status(200).json({ items });
  } catch (err) {
    console.error("Erro ao listar não lidas:", err);
    return res.status(500).json({ error: "Erro interno" });
  }
}
