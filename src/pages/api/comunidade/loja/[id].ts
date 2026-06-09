import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ erro: "Não autorizado" });

  const { id } = req.query as { id: string };

  if (req.method === "GET") {
    const anuncio = await prisma.anuncioLoja.findUnique({
      where: { id },
      include: { morador: { select: { id: true, name: true, apartamento: true, bloco: true } } },
    });
    if (!anuncio) return res.status(404).json({ erro: "Anúncio não encontrado" });
    return res.json(anuncio);
  }

  const anuncio = await prisma.anuncioLoja.findUnique({ where: { id } });
  if (!anuncio) return res.status(404).json({ erro: "Anúncio não encontrado" });
  if (anuncio.moradorId !== session.user.id) return res.status(403).json({ erro: "Sem permissão" });

  if (req.method === "PATCH") {
    const { status } = req.body;
    const VALID_STATUS = ["DISPONIVEL", "RESERVADO", "VENDIDO"];
    if (!VALID_STATUS.includes(status)) return res.status(400).json({ erro: "Status inválido" });
    const updated = await prisma.anuncioLoja.update({ where: { id }, data: { status } });
    return res.json(updated);
  }

  if (req.method === "DELETE") {
    await prisma.anuncioLoja.delete({ where: { id } });
    return res.status(204).end();
  }

  return res.status(405).end();
}
