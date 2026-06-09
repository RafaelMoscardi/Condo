import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ erro: "Não autorizado" });

  const userId = session.user.id;
  const { conversaId } = req.query as { conversaId: string };

  const conversa = await prisma.conversaLoja.findUnique({ where: { id: conversaId } });
  if (!conversa) return res.status(404).json({ erro: "Conversa não encontrada" });

  const isParticipante = conversa.compradorId === userId || conversa.vendedorId === userId;
  if (!isParticipante) return res.status(403).json({ erro: "Sem permissão" });

  // GET — busca todas as mensagens da conversa
  if (req.method === "GET") {
    const mensagens = await prisma.mensagemConversaLoja.findMany({
      where: { conversaId },
      include: { autor: { select: { id: true, name: true } } },
      orderBy: { criadaEm: "asc" },
    });
    return res.json(mensagens);
  }

  // POST — envia nova mensagem
  if (req.method === "POST") {
    const { conteudo } = req.body;
    if (!conteudo?.trim()) return res.status(400).json({ erro: "Mensagem vazia" });

    const msg = await prisma.mensagemConversaLoja.create({
      data: {
        conversaId,
        autorId: userId,
        conteudo: conteudo.trim(),
      },
      include: { autor: { select: { id: true, name: true } } },
    });
    return res.status(201).json(msg);
  }

  return res.status(405).end();
}
