import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ erro: "Não autorizado" });

  const { condoId, id: userId } = session.user;
  if (!condoId || !userId) return res.status(401).json({ erro: "Sessão inválida" });

  if (req.method === "GET") {
    const mensagens = await prisma.mensagemChat.findMany({
      where: { condoId },
      include: {
        autor: { select: { id: true, name: true, apartamento: true, bloco: true } },
      },
      orderBy: { criadaEm: "desc" },
      take: 100,
    });
    return res.json(mensagens.reverse());
  }

  if (req.method === "POST") {
    const { conteudo } = req.body;
    if (!conteudo?.trim()) return res.status(400).json({ erro: "Mensagem vazia" });
    const msg = await prisma.mensagemChat.create({
      data: {
        conteudo: conteudo.trim(),
        condo: { connect: { id: condoId } },
        autor: { connect: { id: session.user.id } },
      },
      include: {
        autor: { select: { id: true, name: true, apartamento: true, bloco: true } },
      },
    });
    return res.status(201).json(msg);
  }

  return res.status(405).end();
}
