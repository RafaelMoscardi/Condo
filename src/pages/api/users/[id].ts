import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ erro: "Não autorizado" });
  if (session.user.perfil !== "SINDICO") return res.status(403).json({ erro: "Apenas o síndico" });

  const { id } = req.query as { id: string };

  const alvo = await prisma.user.findUnique({ where: { id } });
  if (!alvo || alvo.condoId !== session.user.condoId) {
    return res.status(404).json({ erro: "Usuário não encontrado" });
  }
  if (alvo.id === session.user.id) {
    return res.status(400).json({ erro: "Não é possível alterar sua própria conta aqui" });
  }

  if (req.method === "PATCH") {
    const { ativo, perfil } = req.body;
    const data: Record<string, unknown> = {};
    if (typeof ativo === "boolean") data.ativo = ativo;
    if (perfil) data.perfil = perfil;

    const atualizado = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, name: true, ativo: true, perfil: true },
    });
    return res.json(atualizado);
  }

  if (req.method === "DELETE") {
    await prisma.user.delete({ where: { id } });
    return res.status(204).end();
  }

  return res.status(405).end();
}
