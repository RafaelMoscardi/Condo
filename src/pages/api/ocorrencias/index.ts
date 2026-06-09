import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import formidable from "formidable";
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";

export const config = { api: { bodyParser: false } };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ erro: "Não autorizado" });

  const { perfil, condoId, id: userId } = session.user;

  if (req.method === "GET") {
    const ocorrencias = await prisma.ocorrencia.findMany({
      where: {
        condoId,
        ...(perfil === "MORADOR" ? { moradorId: userId } : {}),
      },
      include: { morador: { select: { name: true, apartamento: true, bloco: true } } },
      orderBy: { abertaEm: "desc" },
    });
    return res.json(ocorrencias);
  }

  if (req.method === "POST") {
    if (!["MORADOR", "PORTEIRO"].includes(perfil)) {
      return res.status(403).json({ erro: "Sem permissão para abrir ocorrências" });
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads", "ocorrencias");
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    const form = formidable({
      uploadDir,
      keepExtensions: true,
      maxFileSize: 5 * 1024 * 1024,
    });

    const [fields, files] = await form.parse(req);
    const tipo = Array.isArray(fields.tipo) ? fields.tipo[0] : fields.tipo;
    const descricao = Array.isArray(fields.descricao) ? fields.descricao[0] : fields.descricao;

    if (!tipo || !descricao) {
      return res.status(400).json({ erro: "Campos obrigatórios: tipo, descricao" });
    }

    let fotoUrl: string | null = null;
    const fotoFile = Array.isArray(files.foto) ? files.foto[0] : files.foto;
    if (fotoFile && fotoFile.size > 0) {
      const ext = path.extname(fotoFile.originalFilename ?? ".jpg");
      const novoNome = `${randomUUID()}${ext}`;
      const novoCaminho = path.join(uploadDir, novoNome);
      fs.renameSync(fotoFile.filepath, novoCaminho);
      fotoUrl = `/uploads/ocorrencias/${novoNome}`;
    }

    const ocorrencia = await prisma.ocorrencia.create({
      data: { tipo, descricao, fotoUrl, condoId, moradorId: userId },
    });
    return res.status(201).json(ocorrencia);
  }

  return res.status(405).json({ erro: "Método não permitido" });
}
