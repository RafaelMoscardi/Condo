import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ erro: "Não autorizado" });

  const { id } = req.query as { id: string };

  const vaga = await prisma.vagaGaragem.findUnique({ where: { id } });
  if (!vaga) return res.status(404).json({ erro: "Vaga não encontrada" });
  if (vaga.moradorId !== session.user.id) return res.status(403).json({ erro: "Sem permissão" });

  if (req.method === "PATCH") {
    const { disponivel } = req.body;
    if (typeof disponivel !== "boolean") return res.status(400).json({ erro: "disponivel deve ser boolean" });
    const updated = await prisma.vagaGaragem.update({
      where: { id },
      data: { disponivel },
    });
    return res.json(updated);
  }

  if (req.method === "DELETE") {
    await prisma.vagaGaragem.delete({ where: { id } });
    return res.status(204).end();
  }

  return res.status(405).end();
}
