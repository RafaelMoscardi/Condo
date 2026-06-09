import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { enviarEmailResetSenha } from "@/lib/email";
import { randomBytes } from "crypto";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const { email } = req.body as { email: string };
  if (!email) return res.status(400).json({ erro: "E-mail obrigatório" });

  // Always return 200 to avoid user enumeration
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (!user) return res.status(200).json({ ok: true });

  // Delete existing tokens for this email
  await prisma.passwordResetToken.deleteMany({ where: { email: user.email } });

  const token = randomBytes(32).toString("hex");
  const expiraEm = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.passwordResetToken.create({
    data: { token, email: user.email, expiraEm },
  });

  await enviarEmailResetSenha(user.email, token);

  return res.status(200).json({ ok: true });
}
