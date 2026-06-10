import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import formidable from "formidable";
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { uploadFile, deleteFile } from "@/lib/storage";

export const config = { api: { bodyParser: false } };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "PATCH") return res.status(405).end();

  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ erro: "Não autenticado" });

  const form = formidable({ maxFileSize: 5 * 1024 * 1024 });
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
  const naoTemIfood = get("naoTemIfood") === "true";
  const codigoIfood = naoTemIfood ? null : (get("codigoIfood").trim() || null);
  const senhaAtual = get("senhaAtual");
  const novaSenha = get("novaSenha");

  if (!name) return res.status(400).json({ erro: "Nome é obrigatório" });

  if (cpf) {
    const d = cpf.replace(/\D/g, "");
    let ok = d.length === 11 && !/^(\d)\1{10}$/.test(d);
    if (ok) {
      let sum = 0;
      for (let i = 0; i < 9; i++) sum += parseInt(d[i]) * (10 - i);
      let r = (sum * 10) % 11; if (r >= 10) r = 0;
      ok = r === parseInt(d[9]);
      if (ok) {
        sum = 0;
        for (let i = 0; i < 10; i++) sum += parseInt(d[i]) * (11 - i);
        r = (sum * 10) % 11; if (r >= 10) r = 0;
        ok = r === parseInt(d[10]);
      }
    }
    if (!ok) return res.status(400).json({ erro: "CPF inválido" });

    const cpfExistente = await prisma.user.findUnique({ where: { cpf } });
    if (cpfExistente && cpfExistente.id !== session.user.id) {
      return res.status(409).json({ erro: "CPF já cadastrado por outro usuário" });
    }
  }

  const usuario = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!usuario) return res.status(404).json({ erro: "Usuário não encontrado" });

  let passwordHash: string | undefined;
  if (novaSenha) {
    if (!senhaAtual) return res.status(400).json({ erro: "Informe a senha atual para alterar a senha" });
    const senhaValida = await bcrypt.compare(senhaAtual, usuario.password);
    if (!senhaValida) return res.status(400).json({ erro: "Senha atual incorreta" });
    if (novaSenha.length < 6) return res.status(400).json({ erro: "Nova senha deve ter no mínimo 6 caracteres" });
    passwordHash = await bcrypt.hash(novaSenha, 10);
  }

  let fotoUrl: string | undefined;
  const fotoFile = Array.isArray(files.foto) ? files.foto[0] : files.foto;
  if (fotoFile && fotoFile.size > 0) {
    if (usuario.fotoUrl) await deleteFile(usuario.fotoUrl);
    const ext = path.extname(fotoFile.originalFilename ?? ".jpg");
    const buffer = fs.readFileSync(fotoFile.filepath);
    fotoUrl = await uploadFile(buffer, `${randomUUID()}${ext}`, "avatars");
    try { fs.unlinkSync(fotoFile.filepath); } catch {}
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
      codigoIfood,
      ...(fotoUrl !== undefined && { fotoUrl }),
      ...(passwordHash !== undefined && { password: passwordHash }),
    },
  });

  return res.status(200).json({ ok: true });
}
