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

  const { condoId, id: userId } = session.user;
  if (!condoId || !userId) return res.status(401).json({ erro: "Sessão inválida" });

  if (req.method === "GET") {
    const anuncios = await prisma.anuncioLoja.findMany({
      where: { condoId },
      include: {
        morador: { select: { id: true, name: true, apartamento: true, bloco: true } },
      },
      orderBy: { criadaEm: "desc" },
    });
    return res.json(anuncios);
  }

  if (req.method === "POST") {
    const uploadDir = path.join(process.cwd(), "public", "uploads", "loja");
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    const form = formidable({
      uploadDir,
      keepExtensions: true,
      maxFileSize: 5 * 1024 * 1024,
    });

    const [fields, files] = await form.parse(req);

    const get = (f: string) => {
      const v = fields[f];
      return Array.isArray(v) ? v[0] : v ?? "";
    };

    const titulo = get("titulo");
    const descricao = get("descricao");
    const valorRaw = get("valor");
    const tipo = get("tipo") || "VENDA";
    const categoria = get("categoria") || "outro";

    if (!titulo || !descricao) return res.status(400).json({ erro: "Título e descrição são obrigatórios" });

    const valorNum = valorRaw !== "" && valorRaw != null && !isNaN(parseFloat(valorRaw)) ? parseFloat(valorRaw) : null;

    let fotoUrl: string | null = null;
    const fotoFile = Array.isArray(files.foto) ? files.foto[0] : files.foto;
    if (fotoFile && fotoFile.size > 0) {
      const ext = path.extname(fotoFile.originalFilename ?? ".jpg");
      const novoNome = `${randomUUID()}${ext}`;
      const novoCaminho = path.join(uploadDir, novoNome);
      fs.renameSync(fotoFile.filepath, novoCaminho);
      fotoUrl = `/uploads/loja/${novoNome}`;
    }

    const anuncio = await prisma.anuncioLoja.create({
      data: {
        titulo,
        descricao,
        valor: valorNum,
        tipo,
        categoria,
        fotoUrl,
        condo: { connect: { id: condoId } },
        morador: { connect: { id: userId } },
      },
    });
    return res.status(201).json(anuncio);
  }

  return res.status(405).end();
}
