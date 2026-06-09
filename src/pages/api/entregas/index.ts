import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ erro: "Não autorizado" });

  const { perfil, condoId, id: userId } = session.user;

  if (req.method === "GET") {
    const entregas = await prisma.entrega.findMany({
      where: {
        ...(perfil === "MORADOR"
          ? { moradorId: userId }
          : { porteiro: { condoId } }),
      },
      include: {
        morador: { select: { name: true, apartamento: true, bloco: true } },
        porteiro: { select: { name: true } },
      },
      orderBy: { recebidaEm: "desc" },
    });
    return res.json(entregas);
  }

  if (req.method === "POST") {
    if (perfil !== "PORTEIRO") {
      return res.status(403).json({ erro: "Apenas porteiros podem registrar entregas" });
    }
    const { moradorId, remetente, descricao, observacoes } = req.body;
    if (!moradorId || !descricao) {
      return res.status(400).json({ erro: "Campos obrigatórios: moradorId, descricao" });
    }
    const morador = await prisma.user.findFirst({
      where: { id: moradorId, condoId, perfil: "MORADOR" },
    });
    if (!morador) return res.status(404).json({ erro: "Morador não encontrado" });

    const entrega = await prisma.entrega.create({
      data: {
        moradorId,
        porteiroId: userId,
        remetente: remetente ?? null,
        descricao,
        observacoes: observacoes ?? null,
      },
    });
    return res.status(201).json(entrega);
  }

  return res.status(405).json({ erro: "Método não permitido" });
}
