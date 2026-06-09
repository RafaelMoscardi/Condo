import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import formidable from "formidable";
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";

export const config = { api: { bodyParser: false } };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "PATCH") return res.status(405).end();

  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ erro: "Não autenticado" });

  const uploadDir = path.join(process.cwd(), "public", "uploads", "avatars");
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

  const form = formidable({ uploadDir, keepExtensions: true, maxFileSize: 5 * 1024 * 1024 });
  const [fields, files] = await form.parse(req);

  const get = (f: string) => {
    const v = fields[f];
    return Array.isArray(v) ? v[0] : (v ?? "");
  };

  const name = get("name").trim();
  const apartamento = get("apartamento").trim() || null;
  const bloco = get("bloco").trim() || null;
  const cpf = get("cpf").trim() || null;
  const telefone = get("telefone").trim() || null;
  const senhaAtual = get("senhaAtual");
  const novaSenha = get("novaSenha");

  if (!name) return res.status(400).json({ erro: "Nome é obrigatório" });

  const usuario = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!usuario) return res.status(404).json({ erro: "Usuário não encontrado" });

  // Handle password change
  let passwordHash: string | undefined;
  if (novaSenha) {
    if (!senhaAtual) {
      return res.status(400).json({ erro: "Informe a senha atual para alterar a senha" });
    }
    const senhaValida = await bcrypt.compare(senhaAtual, usuario.password);
    if (!senhaValida) return res.status(400).json({ erro: "Senha atual incorreta" });
    if (novaSenha.length < 6) return res.status(400).json({ erro: "Nova senha deve ter no mínimo 6 caracteres" });
    passwordHash = await bcrypt.hash(novaSenha, 10);
  }

  // Handle photo upload
  let fotoUrl: string | undefined;
  const fotoFile = Array.isArray(files.foto) ? files.foto[0] : files.foto;
  if (fotoFile && fotoFile.size > 0) {
    // Delete old photo
    if (usuario.fotoUrl) {
      const oldPath = path.join(process.cwd(), "public", usuario.fotoUrl);
      try { fs.unlinkSync(oldPath); } catch {}
    }
    const ext = path.extname(fotoFile.originalFilename ?? ".jpg");
    const novoNome = `${randomUUID()}${ext}`;
    const novoCaminho = path.join(uploadDir, novoNome);
    fs.renameSync(fotoFile.filepath, novoCaminho);
    fotoUrl = `/uploads/avatars/${novoNome}`;
  } else if (fotoFile?.filepath) {
    try { fs.unlinkSync(fotoFile.filepath); } catch {}
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name,
      apartamento,
      bloco,
      cpf,
      telefone,
      ...(fotoUrl !== undefined && { fotoUrl }),
      ...(passwordHash !== undefined && { password: passwordHash }),
    },
  });

  return res.status(200).json({ ok: true });
}
