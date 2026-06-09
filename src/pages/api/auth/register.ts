import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import formidable from "formidable";
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";

export const config = { api: { bodyParser: false } };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const uploadDir = path.join(process.cwd(), "public", "uploads", "avatars");
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

  const form = formidable({ uploadDir, keepExtensions: true, maxFileSize: 5 * 1024 * 1024 });
  const [fields, files] = await form.parse(req);

  const get = (f: string) => {
    const v = fields[f];
    return Array.isArray(v) ? v[0] : (v ?? "");
  };

  const name = get("name").trim();
  const email = get("email").trim().toLowerCase();
  const password = get("password");
  const apartamento = get("apartamento").trim() || null;
  const bloco = get("bloco").trim() || null;
  const cpf = get("cpf").trim() || null;
  const telefone = get("telefone").trim() || null;

  if (!name || !email || !password) {
    return res.status(400).json({ erro: "Nome, e-mail e senha são obrigatórios" });
  }
  if (password.length < 6) {
    return res.status(400).json({ erro: "Senha deve ter no mínimo 6 caracteres" });
  }
  if (cpf) {
    const d = cpf.replace(/\D/g, "");
    let cpfValido = d.length === 11 && !/^(\d)\1{10}$/.test(d);
    if (cpfValido) {
      let sum = 0;
      for (let i = 0; i < 9; i++) sum += parseInt(d[i]) * (10 - i);
      let r = (sum * 10) % 11; if (r >= 10) r = 0;
      cpfValido = r === parseInt(d[9]);
      if (cpfValido) {
        sum = 0;
        for (let i = 0; i < 10; i++) sum += parseInt(d[i]) * (11 - i);
        r = (sum * 10) % 11; if (r >= 10) r = 0;
        cpfValido = r === parseInt(d[10]);
      }
    }
    if (!cpfValido) return res.status(400).json({ erro: "CPF inválido" });
  }

  const existente = await prisma.user.findUnique({ where: { email } });
  if (existente) {
    return res.status(409).json({ erro: "E-mail já cadastrado" });
  }

  const condo = await prisma.condo.findFirst();
  if (!condo) {
    return res.status(500).json({ erro: "Nenhum condomínio configurado" });
  }

  let fotoUrl: string | null = null;
  const fotoFile = Array.isArray(files.foto) ? files.foto[0] : files.foto;
  if (fotoFile && fotoFile.size > 0) {
    const ext = path.extname(fotoFile.originalFilename ?? ".jpg");
    const novoNome = `${randomUUID()}${ext}`;
    const novoCaminho = path.join(uploadDir, novoNome);
    fs.renameSync(fotoFile.filepath, novoCaminho);
    fotoUrl = `/uploads/avatars/${novoNome}`;
  } else if (fotoFile?.filepath) {
    try { fs.unlinkSync(fotoFile.filepath); } catch {}
  }

  const hash = await bcrypt.hash(password, 10);

  const usuario = await prisma.user.create({
    data: {
      name,
      email,
      password: hash,
      perfil: "MORADOR",
      apartamento,
      bloco,
      cpf,
      telefone,
      fotoUrl,
      condoId: condo.id,
    },
    select: { id: true, name: true, email: true },
  });

  return res.status(201).json(usuario);
}
