import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ erro: "Não autorizado" });

  const { id } = req.query as { id: string };
  const aviso = await prisma.aviso.findUnique({ where: { id } });
  if (!aviso || aviso.condoId !== session.user.condoId) {
    return res.status(404).json({ erro: "Aviso não encontrado" });
  }

  if (req.method === "GET") {
    return res.json(aviso);
  }

  if (req.method === "PATCH" || req.method === "DELETE") {
    if (session.user.perfil !== "SINDICO") {
      return res.status(403).json({ erro: "Apenas o síndico pode editar avisos" });
    }

    if (req.method === "DELETE") {
      await prisma.aviso.update({ where: { id }, data: { ativo: false } });
      return res.json({ ok: true });
    }

    const { titulo, descricao, categoria, urgente, ativo } = req.body;
    const atualizado = await prisma.aviso.update({
      where: { id },
      data: {
        ...(titulo !== undefined && { titulo }),
        ...(descricao !== undefined && { descricao }),
        ...(categoria !== undefined && { categoria }),
        ...(urgente !== undefined && { urgente }),
        ...(ativo !== undefined && { ativo }),
      },
    });
    return res.json(atualizado);
  }

  return res.status(405).json({ erro: "Método não permitido" });
}
