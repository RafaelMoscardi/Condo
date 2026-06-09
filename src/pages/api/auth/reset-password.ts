import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const { token, senha } = req.body as { token: string; senha: string };
  if (!token || !senha) return res.status(400).json({ erro: "Dados inválidos" });
  if (senha.length < 6) return res.status(400).json({ erro: "Senha deve ter no mínimo 6 caracteres" });

  const registro = await prisma.passwordResetToken.findUnique({ where: { token } });
  if (!registro) return res.status(400).json({ erro: "Link inválido ou já utilizado" });
  if (registro.expiraEm < new Date()) {
    await prisma.passwordResetToken.delete({ where: { token } });
    return res.status(400).json({ erro: "Link expirado. Solicite um novo." });
  }

  const hash = await bcrypt.hash(senha, 10);
  await prisma.user.update({
    where: { email: registro.email },
    data: { password: hash },
  });

  await prisma.passwordResetToken.delete({ where: { token } });

  return res.status(200).json({ ok: true });
}
