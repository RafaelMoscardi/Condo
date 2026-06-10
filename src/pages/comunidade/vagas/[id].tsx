import { GetServerSideProps } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AppShell from "@/components/layout/AppShell";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState, useEffect, useRef, useCallback } from "react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ChevronLeft, Users, Send, Trash2, Car } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type MensagemConversa = {
  id: string;
  conteudo: string;
  criadaEm: string;
  autor: { id: string; name: string };
};

type ConversaVaga = {
  id: string;
  interessadoId: string;
  interessado: { id: string; name: string; apartamento: string | null; bloco: string | null };
  mensagens: MensagemConversa[];
};

type VagaDetalhe = {
  id: string;
  titulo: string;
  descricao: string | null;
  valor: number;
  tipo: string;
  periodoAluguel: string;
  bloco: string | null;
  numeroApto: string | null;
  disponivel: boolean;
  criadaEm: string;
  morador: { id: string; name: string; apartamento: string | null; bloco: string | null };
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// ─── Chat UI ──────────────────────────────────────────────────────────────────

function ConversaMsgs({
  conversaId,
  userId,
  onSend,
}: {
  conversaId: string;
  userId: string;
  onSend?: () => void;
}) {
  const [mensagens, setMensagens] = useState<MensagemConversa[]>([]);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchMsgs = useCallback(async () => {
    const res = await fetch(`/api/comunidade/vagas/conversas/${conversaId}`);
    if (res.ok) setMensagens(await res.json());
  }, [conversaId]);

  useEffect(() => {
    fetchMsgs();
    const iv = setInterval(fetchMsgs, 5000);
    return () => clearInterval(iv);
  }, [fetchMsgs]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensagens]);

  const handleSend = async () => {
    if (!texto.trim()) return;
    setEnviando(true);
    const res = await fetch(`/api/comunidade/vagas/conversas/${conversaId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conteudo: texto.trim() }),
    });
    setEnviando(false);
    if (res.ok) {
      setTexto("");
      fetchMsgs();
      onSend?.();
    } else {
      toast.error("Erro ao enviar mensagem");
    }
  };

  return (
    <div className="flex flex-col" style={{ height: "420px" }}>
      <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-muted/30 rounded-lg">
        {mensagens.length === 0 && (
          <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
            Nenhuma mensagem ainda
          </div>
        )}
        {mensagens.map((msg) => {
          const mine = msg.autor.id === userId;
          return (
            <div key={msg.id} className={cn("flex gap-2", mine && "flex-row-reverse")}>
              <div
                className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0",
                  mine ? "bg-indigo-600" : "bg-slate-500"
                )}
              >
                {msg.autor.name[0].toUpperCase()}
              </div>
              <div className={cn("max-w-[75%]", mine && "items-end flex flex-col")}>
                <span className="text-xs text-muted-foreground mb-0.5 block">{msg.autor.name}</span>
                <div
                  className={cn(
                    "px-3 py-1.5 rounded-2xl text-sm break-words",
                    mine ? "bg-indigo-600 text-white rounded-tr-sm" : "bg-muted rounded-tl-sm"
                  )}
                >
                  {msg.conteudo}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <div className="mt-2 flex gap-2 items-end">
        <textarea
          className="flex-1 resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[40px] max-h-[100px]"
          rows={1}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
          }}
          placeholder="Mensagem… (Enter para enviar)"
          disabled={enviando}
        />
        <Button
          onClick={handleSend}
          disabled={enviando || !texto.trim()}
          className="h-10 w-10 p-0 bg-indigo-600 hover:bg-indigo-700 text-white flex-shrink-0"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

// ─── Painel Interessado ───────────────────────────────────────────────────────

function PainelInteressado({ vagaId, userId }: { vagaId: string; userId: string }) {
  const [conversaId, setConversaId] = useState<string | null>(null);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/comunidade/vagas/conversas?vagaId=${vagaId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.id) setConversaId(data.id);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [vagaId]);

  const handleIniciar = async () => {
    if (!texto.trim()) return;
    setEnviando(true);
    const res = await fetch("/api/comunidade/vagas/conversas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vagaId, conteudo: texto.trim() }),
    });
    setEnviando(false);
    if (res.ok) {
      const data = await res.json();
      setConversaId(data.conversa.id);
      setTexto("");
    } else {
      toast.error("Erro ao iniciar conversa");
    }
  };

  if (loading) return <div className="py-10 text-center text-muted-foreground text-sm">Carregando…</div>;

  if (conversaId) return <ConversaMsgs conversaId={conversaId} userId={userId} />;

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">Inicie a conversa com o dono da vaga.</p>
      <textarea
        className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[80px]"
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder="Olá! Tenho interesse nesta vaga…"
      />
      <Button
        onClick={handleIniciar}
        disabled={enviando || !texto.trim()}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
      >
        {enviando ? "Enviando…" : "Enviar mensagem"}
      </Button>
    </div>
  );
}

// ─── Painel Dono ──────────────────────────────────────────────────────────────

function PainelDono({ vagaId, userId }: { vagaId: string; userId: string }) {
  const [conversas, setConversas] = useState<ConversaVaga[]>([]);
  const [ativa, setAtiva] = useState<ConversaVaga | null>(null);

  const fetchConversas = useCallback(async () => {
    const res = await fetch(`/api/comunidade/vagas/conversas?vagaId=${vagaId}`);
    if (res.ok) setConversas(await res.json());
  }, [vagaId]);

  useEffect(() => { fetchConversas(); }, [fetchConversas]);

  if (ativa) {
    return (
      <div>
        <button
          onClick={() => setAtiva(null)}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3"
        >
          <ChevronLeft className="w-4 h-4" /> Voltar
        </button>
        <p className="font-medium text-sm mb-3">
          {ativa.interessado.name}
          {ativa.interessado.apartamento && (
            <span className="text-xs text-muted-foreground ml-1.5">
              Apt {ativa.interessado.apartamento}{ativa.interessado.bloco ? `-${ativa.interessado.bloco}` : ""}
            </span>
          )}
        </p>
        <ConversaMsgs conversaId={ativa.id} userId={userId} onSend={fetchConversas} />
      </div>
    );
  }

  if (conversas.length === 0) {
    return (
      <div className="py-10 flex flex-col items-center text-muted-foreground gap-2">
        <Users className="w-10 h-10 opacity-20" />
        <p className="text-sm">Nenhum interessado ainda</p>
      </div>
    );
  }

  return (
    <div className="divide-y">
      {conversas.map((c) => {
        const ultima = c.mensagens[0];
        return (
          <button
            key={c.id}
            onClick={() => setAtiva(c)}
            className="w-full flex items-center gap-3 py-3 hover:bg-muted/50 rounded-lg px-2 text-left transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600 flex-shrink-0">
              {c.interessado.name[0]}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{c.interessado.name}</p>
              {c.interessado.apartamento && (
                <p className="text-xs text-muted-foreground">
                  Apt {c.interessado.apartamento}{c.interessado.bloco ? `-${c.interessado.bloco}` : ""}
                </p>
              )}
              {ultima && (
                <p className="text-xs text-muted-foreground truncate mt-0.5">{ultima.conteudo}</p>
              )}
            </div>
            <ChevronLeft className="w-4 h-4 text-muted-foreground rotate-180 flex-shrink-0" />
          </button>
        );
      })}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

type Props = { vaga: VagaDetalhe; userId: string };

export default function VagaDetailPage({ vaga, userId }: Props) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const isOwner = vaga.morador.id === userId;

  const toggleDisponivel = async () => {
    const res = await fetch(`/api/comunidade/vagas/${vaga.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ disponivel: !vaga.disponivel }),
    });
    if (res.ok) { toast.success("Vaga atualizada"); router.replace(router.asPath); }
  };

  const handleDelete = async () => {
    const res = await fetch(`/api/comunidade/vagas/${vaga.id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Anúncio removido"); router.push("/comunidade"); }
    setConfirmOpen(false);
  };

  return (
    <AppShell titulo={vaga.titulo}>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <Link
          href="/comunidade"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ChevronLeft className="w-4 h-4" /> Voltar às Vagas
        </Link>

        {/* Header */}
        <div className="bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 rounded-xl p-5 mb-6">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex flex-wrap gap-2">
              <span className={cn(
                "px-2.5 py-1 rounded-full text-xs font-semibold",
                vaga.tipo === "ALUGUEL" ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"
              )}>
                {vaga.tipo === "ALUGUEL" ? "Aluguel" : "Venda"}
              </span>
              {!vaga.disponivel && (
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-500">
                  Indisponível
                </span>
              )}
            </div>
            <p className="text-2xl font-bold text-indigo-600 flex-shrink-0">
              {formatBRL(vaga.valor)}
              {vaga.tipo === "ALUGUEL" && (
                <span className="text-sm font-normal text-slate-500">
                  {vaga.periodoAluguel === "DIARIO" ? "/dia" : "/mês"}
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2 mb-2">
            <Car className="w-5 h-5 text-indigo-500 flex-shrink-0" />
            <h1 className="text-xl font-bold text-slate-800">{vaga.titulo}</h1>
          </div>

          {(vaga.bloco || vaga.numeroApto) && (
            <p className="text-sm text-slate-500 mb-2">
              {[vaga.bloco && `Bloco ${vaga.bloco}`, vaga.numeroApto && `Apt ${vaga.numeroApto}`].filter(Boolean).join(" · ")}
            </p>
          )}
          {vaga.descricao && (
            <p className="text-sm text-slate-600 whitespace-pre-wrap">{vaga.descricao}</p>
          )}
        </div>

        {/* Dono */}
        <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-xl mb-6 border border-border">
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-600 flex-shrink-0">
            {vaga.morador.name[0]}
          </div>
          <div>
            <p className="font-medium text-sm">{vaga.morador.name}</p>
            {vaga.morador.apartamento && (
              <p className="text-xs text-muted-foreground">
                Apt {vaga.morador.apartamento}{vaga.morador.bloco ? `-${vaga.morador.bloco}` : ""}
              </p>
            )}
          </div>
        </div>

        {/* Ações do dono */}
        {isOwner && (
          <div className="flex flex-wrap gap-2 mb-8 pb-6 border-b border-border">
            <Button size="sm" variant="outline" onClick={toggleDisponivel}>
              {vaga.disponivel ? "Marcar como Alugada" : "Reativar Anúncio"}
            </Button>
            <Button size="sm" variant="destructive" onClick={() => setConfirmOpen(true)}>
              <Trash2 className="w-3.5 h-3.5 mr-1" /> Remover Anúncio
            </Button>
          </div>
        )}

        {/* Chat */}
        <div className="border border-border rounded-xl p-5">
          <h2 className="font-semibold mb-4">
            {isOwner ? "Interessados" : "Falar com o Dono"}
          </h2>
          {isOwner ? (
            <PainelDono vagaId={vaga.id} userId={userId} />
          ) : (
            <PainelInteressado vagaId={vaga.id} userId={userId} />
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Remover vaga"
        message="Remover este anúncio permanentemente? Esta ação não pode ser desfeita."
        confirmLabel="Remover"
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </AppShell>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);
  if (!session) return { redirect: { destination: "/login", permanent: false } };

  const { id } = context.params as { id: string };

  const vaga = await prisma.vagaGaragem.findUnique({
    where: { id },
    include: { morador: { select: { id: true, name: true, apartamento: true, bloco: true } } },
  });

  if (!vaga) return { notFound: true };

  return {
    props: {
      vaga: {
        ...vaga,
        criadaEm: vaga.criadaEm.toISOString(),
        atualizadaEm: vaga.atualizadaEm.toISOString(),
      },
      userId: session.user.id ?? "",
    },
  };
};
