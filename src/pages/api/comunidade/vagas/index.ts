import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ erro: "Não autorizado" });

  const { condoId, id: userId } = session.user;
  if (!condoId || !userId) return res.status(401).json({ erro: "Sessão inválida" });

  if (req.method === "GET") {
    const vagas = await prisma.vagaGaragem.findMany({
      where: { condoId },
      include: {
        morador: { select: { id: true, name: true, apartamento: true, bloco: true } },
      },
      orderBy: [{ disponivel: "desc" }, { criadaEm: "desc" }],
    });
    return res.json(vagas);
  }

  if (req.method === "POST") {
    const PERFIS_PERMITIDOS = ["MORADOR", "SINDICO"];
    if (!PERFIS_PERMITIDOS.includes(session.user.perfil)) return res.status(403).json({ erro: "Sem permissão" });

    const { titulo, descricao, valor, tipo, periodoAluguel, bloco, numeroApto } = req.body;
    const valorNum = parseFloat(valor);
    if (!titulo || valor == null || isNaN(valorNum)) return res.status(400).json({ erro: "Título e valor são obrigatórios" });
    const vaga = await prisma.vagaGaragem.create({
      data: {
        titulo,
        descricao: descricao || null,
        valor: valorNum,
        tipo: tipo || "ALUGUEL",
        periodoAluguel: periodoAluguel || "MENSAL",
        bloco: bloco || null,
        numeroApto: numeroApto || null,
        condo: { connect: { id: condoId } },
        morador: { connect: { id: userId } },
      },
    });
    return res.status(201).json(vaga);
  }

  return res.status(405).end();
}
