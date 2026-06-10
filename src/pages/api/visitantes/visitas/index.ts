import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ erro: "Não autorizado" });

  if (req.method === "POST") {
    if (session.user.perfil !== "PORTEIRO") {
      return res.status(403).json({ erro: "Apenas porteiros podem registrar visitas" });
    }
    const { autorizacaoId, observacoes } = req.body;
    if (!autorizacaoId) {
      return res.status(400).json({ erro: "autorizacaoId é obrigatório" });
    }
    const autorizacao = await prisma.autorizacaoVisitante.findUnique({
      where: { id: autorizacaoId },
      include: { morador: true },
    });
    if (!autorizacao || autorizacao.morador.condoId !== session.user.condoId) {
      return res.status(404).json({ erro: "Autorização não encontrada" });
    }
    const [visita] = await prisma.$transaction([
      prisma.visitaRegistrada.create({
        data: {
          autorizacaoId,
          porteiroId: session.user.id,
          observacoes: observacoes ?? null,
        },
      }),
      prisma.autorizacaoVisitante.update({
        where: { id: autorizacaoId },
        data: { ativa: false },
      }),
    ]);
    return res.status(201).json(visita);
  }

  return res.status(405).json({ erro: "Método não permitido" });
}
