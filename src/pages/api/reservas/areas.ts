import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ erro: "Não autorizado" });

  if (req.method === "GET") {
    const areas = await prisma.areaComum.findMany({
      where: { condoId: session.user.condoId, ativa: true },
      orderBy: { nome: "asc" },
    });
    return res.json(areas);
  }

  return res.status(405).json({ erro: "Método não permitido" });
}
