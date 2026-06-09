import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ erro: "Não autorizado" });

  if (req.method === "GET") {
    const moradores = await prisma.user.findMany({
      where: { condoId: session.user.condoId, perfil: "MORADOR", ativo: true },
      select: { id: true, name: true, apartamento: true, bloco: true },
      orderBy: [{ bloco: "asc" }, { apartamento: "asc" }],
    });
    return res.json(moradores);
  }

  return res.status(405).json({ erro: "Método não permitido" });
}
