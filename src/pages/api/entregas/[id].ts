import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ erro: "Não autorizado" });

  const { id } = req.query as { id: string };
  const entrega = await prisma.entrega.findUnique({
    where: { id },
    include: { porteiro: { select: { condoId: true } } },
  });

  if (!entrega || entrega.porteiro.condoId !== session.user.condoId) {
    return res.status(404).json({ erro: "Entrega não encontrada" });
  }

  if (req.method === "PATCH") {
    const isMoradorDono = session.user.perfil === "MORADOR" && entrega.moradorId === session.user.id;
    const isPorteiro = session.user.perfil === "PORTEIRO";

    if (!isMoradorDono && !isPorteiro) {
      return res.status(403).json({ erro: "Sem permissão" });
    }

    const atualizada = await prisma.entrega.update({
      where: { id },
      data: {
        status: "RETIRADA",
        retiradaEm: new Date(),
      },
    });
    return res.json(atualizada);
  }

  return res.status(405).json({ erro: "Método não permitido" });
}
