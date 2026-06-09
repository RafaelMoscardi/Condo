import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const STATUS_VALIDOS = ["ABERTA", "EM_ANALISE", "RESOLVIDA", "ENCERRADA"];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ erro: "Não autorizado" });

  const { id } = req.query as { id: string };
  const ocorrencia = await prisma.ocorrencia.findUnique({
    where: { id },
    include: { morador: { select: { name: true, apartamento: true, bloco: true } } },
  });

  if (!ocorrencia || ocorrencia.condoId !== session.user.condoId) {
    return res.status(404).json({ erro: "Ocorrência não encontrada" });
  }

  if (req.method === "GET") {
    return res.json(ocorrencia);
  }

  if (req.method === "PATCH") {
    if (session.user.perfil !== "SINDICO") {
      return res.status(403).json({ erro: "Apenas o síndico pode atualizar o status" });
    }
    const { status, observacoes } = req.body;
    if (status && !STATUS_VALIDOS.includes(status)) {
      return res.status(400).json({ erro: "Status inválido" });
    }
    const atualizada = await prisma.ocorrencia.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(observacoes !== undefined && { observacoes }),
      },
    });
    return res.json(atualizada);
  }

  return res.status(405).json({ erro: "Método não permitido" });
}
