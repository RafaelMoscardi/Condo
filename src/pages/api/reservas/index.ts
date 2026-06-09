import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function horariosConflitam(ini1: string, fim1: string, ini2: string, fim2: string): boolean {
  // Strings "HH:MM" — comparação lexicográfica funciona para 24h
  return ini1 < fim2 && fim1 > ini2;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ erro: "Não autorizado" });

  const { perfil, condoId, id: userId } = session.user;

  if (req.method === "GET") {
    const reservas = await prisma.reserva.findMany({
      where: {
        area: { condoId },
        ...(perfil === "MORADOR" ? { moradorId: userId } : {}),
      },
      include: {
        area: { select: { nome: true } },
        morador: { select: { name: true, apartamento: true, bloco: true } },
      },
      orderBy: [{ status: "asc" }, { data: "desc" }],
    });
    return res.json(reservas);
  }

  if (req.method === "POST") {
    if (perfil !== "MORADOR") {
      return res.status(403).json({ erro: "Apenas moradores podem fazer reservas" });
    }
    const { areaId, data, horaInicio, horaFim, observacoes } = req.body;
    if (!areaId || !data || !horaInicio || !horaFim) {
      return res.status(400).json({ erro: "Campos obrigatórios: areaId, data, horaInicio, horaFim" });
    }
    if (horaInicio >= horaFim) {
      return res.status(400).json({ erro: "O horário de início deve ser antes do fim" });
    }

    const area = await prisma.areaComum.findFirst({ where: { id: areaId, condoId, ativa: true } });
    if (!area) return res.status(404).json({ erro: "Área não encontrada" });

    const dataReserva = new Date(data + "T00:00:00.000Z");

    // Verificar conflito
    const reservasExistentes = await prisma.reserva.findMany({
      where: {
        areaId,
        data: dataReserva,
        status: "APROVADA",
      },
    });

    const conflito = reservasExistentes.some((r) =>
      horariosConflitam(horaInicio, horaFim, r.horaInicio, r.horaFim)
    );

    if (conflito) {
      return res.status(409).json({ erro: "Horário indisponível: já existe uma reserva aprovada neste período." });
    }

    const reserva = await prisma.reserva.create({
      data: {
        areaId,
        moradorId: userId,
        data: dataReserva,
        horaInicio,
        horaFim,
        observacoes: observacoes ?? null,
      },
    });
    return res.status(201).json(reserva);
  }

  return res.status(405).json({ erro: "Método não permitido" });
}
