import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import formidable from "formidable";
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { uploadFile } from "@/lib/storage";

export const config = { api: { bodyParser: false } };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const form = formidable({ maxFileSize: 5 * 1024 * 1024 });
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
  const naoTemIfood = get("naoTemIfood") === "true";
  const codigoIfood = naoTemIfood ? null : (get("codigoIfood").trim() || null);

  if (!name || !email || !password) {
    return res.status(400).json({ erro: "Nome, e-mail e senha são obrigatórios" });
  }
  if (password.length < 6) {
    return res.status(400).json({ erro: "Senha deve ter no mínimo 6 caracteres" });
  }
  if (!cpf) {
    return res.status(400).json({ erro: "CPF é obrigatório" });
  }
  const cpfDigits = cpf.replace(/\D/g, "");
  {
    let ok = cpfDigits.length === 11 && !/^(\d)\1{10}$/.test(cpfDigits);
    if (ok) {
      let sum = 0;
      for (let i = 0; i < 9; i++) sum += parseInt(cpfDigits[i]) * (10 - i);
      let r = (sum * 10) % 11; if (r >= 10) r = 0;
      ok = r === parseInt(cpfDigits[9]);
      if (ok) {
        sum = 0;
        for (let i = 0; i < 10; i++) sum += parseInt(cpfDigits[i]) * (11 - i);
        r = (sum * 10) % 11; if (r >= 10) r = 0;
        ok = r === parseInt(cpfDigits[10]);
      }
    }
    if (!ok) return res.status(400).json({ erro: "CPF inválido" });
  }

  const [existente, cpfExistente] = await Promise.all([
    prisma.user.findUnique({ where: { email } }),
    prisma.user.findUnique({ where: { cpf } }),
  ]);
  if (existente) return res.status(409).json({ erro: "E-mail já cadastrado" });
  if (cpfExistente) return res.status(409).json({ erro: "CPF já cadastrado" });

  const condo = await prisma.condo.findFirst();
  if (!condo) return res.status(500).json({ erro: "Nenhum condomínio configurado" });

  let fotoUrl: string | null = null;
  const fotoFile = Array.isArray(files.foto) ? files.foto[0] : files.foto;
  if (fotoFile && fotoFile.size > 0) {
    const ext = path.extname(fotoFile.originalFilename ?? ".jpg");
    const buffer = fs.readFileSync(fotoFile.filepath);
    fotoUrl = await uploadFile(buffer, `${randomUUID()}${ext}`, "avatars");
    try { fs.unlinkSync(fotoFile.filepath); } catch {}
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
      codigoIfood,
      fotoUrl,
      condoId: condo.id,
    },
    select: { id: true, name: true, email: true },
  });

  return res.status(201).json(usuario);
}
