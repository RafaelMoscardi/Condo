import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const STATUS_VALIDOS = ["APROVADA", "REJEITADA", "CANCELADA"];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ erro: "Não autorizado" });

  const { id } = req.query as { id: string };
  const reserva = await prisma.reserva.findUnique({
    where: { id },
    include: { area: true },
  });

  if (!reserva || reserva.area.condoId !== session.user.condoId) {
    return res.status(404).json({ erro: "Reserva não encontrada" });
  }

  if (req.method === "GET") {
    return res.json(reserva);
  }

  if (req.method === "PATCH") {
    const { status } = req.body;

    // Morador pode cancelar as próprias reservas
    if (status === "CANCELADA" && reserva.moradorId === session.user.id) {
      const atualizada = await prisma.reserva.update({ where: { id }, data: { status: "CANCELADA" } });
      return res.json(atualizada);
    }

    // Sindico aprova ou rejeita
    if (session.user.perfil !== "SINDICO") {
      return res.status(403).json({ erro: "Apenas o síndico pode aprovar ou rejeitar reservas" });
    }
    if (!STATUS_VALIDOS.includes(status)) {
      return res.status(400).json({ erro: "Status inválido" });
    }
    const atualizada = await prisma.reserva.update({ where: { id }, data: { status } });
    return res.json(atualizada);
  }

  return res.status(405).json({ erro: "Método não permitido" });
}
