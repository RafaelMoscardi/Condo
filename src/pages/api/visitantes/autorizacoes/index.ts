import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ erro: "Não autorizado" });

  const { perfil, condoId, id: userId } = session.user;

  if (req.method === "GET") {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const amanha = new Date(hoje);
    amanha.setDate(amanha.getDate() + 1);

    const autorizacoes = await prisma.autorizacaoVisitante.findMany({
      where: {
        ativa: true,
        ...(perfil === "PORTEIRO"
          ? { dataValida: { gte: hoje, lt: amanha }, morador: { condoId } }
          : { moradorId: userId }),
      },
      include: { morador: { select: { name: true, apartamento: true, bloco: true } } },
      orderBy: { dataValida: "asc" },
    });
    return res.json(autorizacoes);
  }

  if (req.method === "POST") {
    if (perfil !== "MORADOR") {
      return res.status(403).json({ erro: "Apenas moradores podem criar autorizações" });
    }
    const { nomeVisitante, documento, dataValida, observacoes } = req.body;
    if (!nomeVisitante || !dataValida) {
      return res.status(400).json({ erro: "Campos obrigatórios: nomeVisitante, dataValida" });
    }
    const autorizacao = await prisma.autorizacaoVisitante.create({
      data: {
        nomeVisitante,
        documento: documento ?? null,
        dataValida: new Date(dataValida + "T00:00:00.000Z"),
        observacoes: observacoes ?? null,
        moradorId: userId,
      },
    });
    return res.status(201).json(autorizacao);
  }

  return res.status(405).json({ erro: "Método não permitido" });
}
