import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

const PERFIS_VALIDOS = ["MORADOR", "PORTEIRO", "ADMINISTRADORA"];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ erro: "Não autorizado" });
  if (session.user.perfil !== "SINDICO") return res.status(403).json({ erro: "Apenas o síndico pode gerenciar usuários" });

  const { condoId } = session.user;

  if (req.method === "GET") {
    const usuarios = await prisma.user.findMany({
      where: { condoId },
      select: { id: true, name: true, email: true, perfil: true, apartamento: true, bloco: true, ativo: true, createdAt: true },
      orderBy: [{ perfil: "asc" }, { bloco: "asc" }, { apartamento: "asc" }],
    });
    return res.json(usuarios);
  }

  if (req.method === "POST") {
    const { name, email, password, perfil, apartamento, bloco } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ erro: "Campos obrigatórios: nome, e-mail e senha" });
    }
    if (password.length < 6) {
      return res.status(400).json({ erro: "A senha deve ter no mínimo 6 caracteres" });
    }
    if (perfil && !PERFIS_VALIDOS.includes(perfil)) {
      return res.status(400).json({ erro: "Perfil inválido" });
    }

    const existente = await prisma.user.findUnique({ where: { email } });
    if (existente) {
      return res.status(409).json({ erro: "E-mail já cadastrado no sistema" });
    }

    const hash = await bcrypt.hash(password, 10);

    const usuario = await prisma.user.create({
      data: {
        name,
        email,
        password: hash,
        perfil: perfil ?? "MORADOR",
        apartamento: apartamento || null,
        bloco: bloco || null,
        condoId,
      },
      select: { id: true, name: true, email: true, perfil: true, apartamento: true, bloco: true, ativo: true, createdAt: true },
    });

    return res.status(201).json(usuario);
  }

  return res.status(405).json({ erro: "Método não permitido" });
}
