import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ erro: "Não autorizado" });

  const { condoId } = session.user;

  if (req.method === "GET") {
    const avisos = await prisma.aviso.findMany({
      where: { condoId, ativo: true },
      include: { autor: { select: { name: true } } },
      orderBy: [{ urgente: "desc" }, { publicadoEm: "desc" }],
    });
    return res.json(avisos);
  }

  if (req.method === "POST") {
    if (session.user.perfil !== "SINDICO") {
      return res.status(403).json({ erro: "Apenas o síndico pode publicar avisos" });
    }
    const { titulo, descricao, categoria, urgente, expiradoEm } = req.body;
    if (!titulo || !descricao || !categoria) {
      return res.status(400).json({ erro: "Campos obrigatórios: titulo, descricao, categoria" });
    }
    const aviso = await prisma.aviso.create({
      data: {
        titulo,
        descricao,
        categoria,
        urgente: !!urgente,
        expiradoEm: expiradoEm ? new Date(expiradoEm) : null,
        condoId,
        autorId: session.user.id,
      },
    });
    return res.status(201).json(aviso);
  }

  return res.status(405).json({ erro: "Método não permitido" });
}
