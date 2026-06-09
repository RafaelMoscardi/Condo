import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const INCLUDE_MSG = {
  autor: { select: { id: true, name: true } },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ erro: "Não autorizado" });

  const userId = session.user.id;

  // GET ?anuncioId=xxx — comprador busca sua conversa; vendedor lista todas do anuncio
  if (req.method === "GET") {
    const { anuncioId } = req.query as { anuncioId: string };
    if (!anuncioId) return res.status(400).json({ erro: "anuncioId obrigatório" });

    const anuncio = await prisma.anuncioLoja.findUnique({ where: { id: anuncioId } });
    if (!anuncio) return res.status(404).json({ erro: "Anúncio não encontrado" });

    // Vendedor: retorna todas as conversas do anuncio
    if (anuncio.moradorId === userId) {
      const conversas = await prisma.conversaLoja.findMany({
        where: { anuncioId },
        include: {
          comprador: { select: { id: true, name: true, apartamento: true, bloco: true } },
          mensagens: { orderBy: { criadaEm: "desc" }, take: 1, include: INCLUDE_MSG },
        },
        orderBy: { criadaEm: "desc" },
      });
      return res.json(conversas);
    }

    // Comprador: retorna sua conversa (ou null se ainda não existe)
    const conversa = await prisma.conversaLoja.findUnique({
      where: { anuncioId_compradorId: { anuncioId, compradorId: userId } },
      include: { mensagens: { orderBy: { criadaEm: "asc" }, include: INCLUDE_MSG } },
    });
    return res.json(conversa ?? null);
  }

  // POST — comprador inicia conversa (ou continua) com primeira mensagem
  if (req.method === "POST") {
    const { anuncioId, conteudo } = req.body;
    if (!anuncioId || !conteudo?.trim()) return res.status(400).json({ erro: "anuncioId e conteudo obrigatórios" });

    const anuncio = await prisma.anuncioLoja.findUnique({ where: { id: anuncioId } });
    if (!anuncio) return res.status(404).json({ erro: "Anúncio não encontrado" });
    if (anuncio.moradorId === userId) return res.status(400).json({ erro: "Não pode abrir conversa com seu próprio anúncio" });

    // upsert: cria conversa se não existe, depois adiciona mensagem
    const conversa = await prisma.conversaLoja.upsert({
      where: { anuncioId_compradorId: { anuncioId, compradorId: userId } },
      create: {
        anuncioId,
        compradorId: userId,
        vendedorId: anuncio.moradorId,
      },
      update: {},
    });

    const msg = await prisma.mensagemConversaLoja.create({
      data: {
        conversaId: conversa.id,
        autorId: userId,
        conteudo: conteudo.trim(),
      },
      include: INCLUDE_MSG,
    });

    return res.status(201).json({ conversa, msg });
  }

  return res.status(405).end();
}
