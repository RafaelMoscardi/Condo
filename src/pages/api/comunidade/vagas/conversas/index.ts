import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const INCLUDE_MSG = {
  autor: { select: { id: true, name: true } },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ erro: "Não autorizado" });

  const userId = session.user.id;

  // GET ?vagaId=xxx — interessado busca sua conversa; dono lista todas
  if (req.method === "GET") {
    const { vagaId } = req.query as { vagaId: string };
    if (!vagaId) return res.status(400).json({ erro: "vagaId obrigatório" });

    const vaga = await prisma.vagaGaragem.findUnique({ where: { id: vagaId } });
    if (!vaga) return res.status(404).json({ erro: "Vaga não encontrada" });

    // Dono: retorna todas as conversas da vaga
    if (vaga.moradorId === userId) {
      const conversas = await prisma.conversaVaga.findMany({
        where: { vagaId },
        include: {
          interessado: { select: { id: true, name: true, apartamento: true, bloco: true } },
          mensagens: { orderBy: { criadaEm: "desc" }, take: 1, include: INCLUDE_MSG },
        },
        orderBy: { criadaEm: "desc" },
      });
      return res.json(conversas);
    }

    // Interessado: retorna sua conversa (ou null se ainda não existe)
    const conversa = await prisma.conversaVaga.findUnique({
      where: { vagaId_interessadoId: { vagaId, interessadoId: userId } },
      include: { mensagens: { orderBy: { criadaEm: "asc" }, include: INCLUDE_MSG } },
    });
    return res.json(conversa ?? null);
  }

  // POST — interessado inicia/continua conversa com primeira mensagem
  if (req.method === "POST") {
    const { vagaId, conteudo } = req.body;
    if (!vagaId || !conteudo?.trim()) return res.status(400).json({ erro: "vagaId e conteudo obrigatórios" });

    const vaga = await prisma.vagaGaragem.findUnique({ where: { id: vagaId } });
    if (!vaga) return res.status(404).json({ erro: "Vaga não encontrada" });
    if (vaga.moradorId === userId) return res.status(400).json({ erro: "Não pode abrir conversa com sua própria vaga" });

    const conversa = await prisma.conversaVaga.upsert({
      where: { vagaId_interessadoId: { vagaId, interessadoId: userId } },
      create: { vagaId, interessadoId: userId, donoId: vaga.moradorId },
      update: {},
    });

    const msg = await prisma.mensagemConversaVaga.create({
      data: { conversaId: conversa.id, autorId: userId, conteudo: conteudo.trim() },
      include: INCLUDE_MSG,
    });

    return res.status(201).json({ conversa, msg });
  }

  return res.status(405).end();
}
