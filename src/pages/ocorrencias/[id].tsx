import { useState } from "react";
import { GetServerSideProps } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import AppShell from "@/components/layout/AppShell";
import StatusBadge from "@/components/ocorrencias/StatusBadge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import Image from "next/image";
import { ArrowLeft, User, Clock, MessageSquare } from "lucide-react";
import Link from "next/link";

const TIPOS: Record<string, string> = {
  barulho: "Barulho", vazamento: "Vazamento", iluminacao: "Iluminação",
  seguranca: "Segurança", outro: "Outro",
};

const STATUS_LABELS: Record<string, string> = {
  ABERTA: "Aberta", EM_ANALISE: "Em Análise", RESOLVIDA: "Resolvida", ENCERRADA: "Encerrada",
};

interface Ocorrencia {
  id: string; tipo: string; descricao: string; fotoUrl: string | null;
  status: string; observacoes: string | null; abertaEm: string;
  morador: { name: string; apartamento: string | null; bloco: string | null };
}

interface Props { ocorrencia: Ocorrencia; perfil: string; }

export default function DetalheOcorrencia({ ocorrencia, perfil }: Props) {
  const [status, setStatus] = useState(ocorrencia.status);
  const [observacoes, setObservacoes] = useState(ocorrencia.observacoes ?? "");
  const [salvando, setSalvando] = useState(false);

  const salvarStatus = async () => {
    setSalvando(true);
    const res = await fetch(`/api/ocorrencias/${ocorrencia.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, observacoes }),
    });
    setSalvando(false);
    if (res.ok) toast.success("Status atualizado com sucesso!");
    else toast.error("Erro ao atualizar");
  };

  return (
    <AppShell titulo="Detalhe da Ocorrência">
      <div className="max-w-2xl space-y-5">
        <Link href="/ocorrencias" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Voltar
        </Link>

        {/* Card principal */}
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
          {/* Header */}
          <div className="px-6 py-5 border-b border-slate-50 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">{TIPOS[ocorrencia.tipo] ?? ocorrencia.tipo}</p>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-2">
                <User className="w-3.5 h-3.5" />
                <span>{ocorrencia.morador.name}
                  {ocorrencia.morador.apartamento && ` — Apt ${ocorrencia.morador.apartamento}${ocorrencia.morador.bloco ? `-${ocorrencia.morador.bloco}` : ""}`}
                </span>
                <span className="text-slate-200">·</span>
                <Clock className="w-3.5 h-3.5" />
                <span>{new Date(ocorrencia.abertaEm).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}</span>
              </div>
            </div>
            <StatusBadge status={status} />
          </div>

          {/* Descrição */}
          <div className="px-6 py-5">
            <p className="text-sm font-medium text-slate-500 mb-2">Descrição</p>
            <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">{ocorrencia.descricao}</p>
          </div>

          {/* Foto */}
          {ocorrencia.fotoUrl && (
            <div className="px-6 pb-5">
              <Image src={ocorrencia.fotoUrl} alt="Foto" width={500} height={320} className="rounded-xl border border-slate-100 object-cover w-full max-h-64" />
            </div>
          )}

          {/* Observações do Síndico (para morador) */}
          {ocorrencia.observacoes && perfil !== "SINDICO" && (
            <div className="mx-6 mb-5 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="w-4 h-4 text-indigo-600" />
                <p className="text-xs font-bold text-indigo-700 uppercase tracking-wide">Observações do Síndico</p>
              </div>
              <p className="text-sm text-indigo-700">{ocorrencia.observacoes}</p>
            </div>
          )}
        </div>

        {/* Painel de atualização (só síndico) */}
        {perfil === "SINDICO" && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
            <h3 className="font-semibold text-slate-900">Atualizar Status</h3>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-700">Status</Label>
              <Select value={status} onValueChange={(v) => v && setStatus(v)}>
                <SelectTrigger className="h-10 border-slate-200">
                  <SelectValue>{STATUS_LABELS[status] ?? status}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ABERTA">Aberta</SelectItem>
                  <SelectItem value="EM_ANALISE">Em Análise</SelectItem>
                  <SelectItem value="RESOLVIDA">Resolvida</SelectItem>
                  <SelectItem value="ENCERRADA">Encerrada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-700">Observações</Label>
              <Textarea
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Descreva as ações tomadas..."
                rows={3}
                className="border-slate-200 resize-none"
              />
            </div>
            <Button onClick={salvarStatus} disabled={salvando} className="bg-indigo-600 hover:bg-indigo-700 gap-2">
              {salvando ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "Salvar Atualização"}
            </Button>
          </div>
        )}
      </div>
    </AppShell>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);
  if (!session) return { redirect: { destination: "/login", permanent: false } };
  const { id } = context.params as { id: string };
  const { prisma } = await import("@/lib/prisma");
  const ocorrencia = await prisma.ocorrencia.findUnique({
    where: { id },
    include: { morador: { select: { name: true, apartamento: true, bloco: true } } },
  });
  if (!ocorrencia || ocorrencia.condoId !== session.user.condoId) return { notFound: true };
  if (session.user.perfil === "MORADOR" && ocorrencia.moradorId !== session.user.id) return { notFound: true };
  return {
    props: {
      perfil: session.user.perfil,
      ocorrencia: { ...ocorrencia, abertaEm: ocorrencia.abertaEm.toISOString(), atualizadaEm: ocorrencia.atualizadaEm.toISOString() },
    },
  };
};
