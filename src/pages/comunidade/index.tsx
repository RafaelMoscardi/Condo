import { useState, useEffect, useRef, useCallback } from "react";
import { GetServerSideProps } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import Link from "next/link";
import AppShell from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  MessageSquare,
  Car,
  ShoppingBag,
  Send,
  Plus,
  ImagePlus,
  X,
  ChevronRight,
  MessageCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type Mensagem = {
  id: string;
  conteudo: string;
  criadaEm: string;
  autor: { id: string; name: string; apartamento: string | null; bloco: string | null };
};

type VagaGaragem = {
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

type AnuncioLoja = {
  id: string;
  titulo: string;
  descricao: string;
  valor: number | null;
  tipo: string;
  categoria: string;
  status: string;
  fotoUrl: string | null;
  criadaEm: string;
  morador: { id: string; name: string; apartamento: string | null; bloco: string | null };
};

type Tab = "chat" | "vagas" | "loja";

type Props = { perfil: string; userId: string };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatData(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function AvatarCircle({ name, mine }: { name: string; mine?: boolean }) {
  return (
    <div
      className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold",
        mine ? "bg-indigo-600" : "bg-slate-500"
      )}
    >
      {name?.[0]?.toUpperCase() ?? "?"}
    </div>
  );
}

// ─── Chat Tab ─────────────────────────────────────────────────────────────────

function ChatTab({ userId }: { userId: string }) {
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchMensagens = useCallback(async () => {
    const res = await fetch("/api/comunidade/chat");
    if (res.ok) setMensagens(await res.json());
  }, []);

  useEffect(() => {
    fetchMensagens();
    const interval = setInterval(fetchMensagens, 5000);
    return () => clearInterval(interval);
  }, [fetchMensagens]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensagens]);

  const handleSend = async () => {
    if (!texto.trim()) return;
    setEnviando(true);
    const res = await fetch("/api/comunidade/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conteudo: texto.trim() }),
    });
    setEnviando(false);
    if (res.ok) {
      setTexto("");
      fetchMensagens();
    } else {
      toast.error("Erro ao enviar mensagem");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      className="flex flex-col border border-border rounded-xl overflow-hidden bg-background"
      style={{ height: "560px" }}
    >
      {/* Mensagens */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {mensagens.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-3">
            <MessageSquare className="w-12 h-12 opacity-20" />
            <p className="text-sm">Nenhuma mensagem ainda. Comece a conversa!</p>
          </div>
        )}
        {mensagens.map((msg) => {
          const mine = msg.autor.id === userId;
          return (
            <div key={msg.id} className={cn("flex gap-3", mine && "flex-row-reverse")}>
              <AvatarCircle name={msg.autor.name} mine={mine} />
              <div className={cn("max-w-xs lg:max-w-md", mine && "items-end flex flex-col")}>
                <div
                  className={cn(
                    "flex items-baseline gap-2 mb-1 flex-wrap",
                    mine && "flex-row-reverse"
                  )}
                >
                  <span className="text-xs font-semibold">{msg.autor.name}</span>
                  {msg.autor.apartamento && (
                    <span className="text-xs text-muted-foreground">
                      Apt {msg.autor.apartamento}
                      {msg.autor.bloco ? `-${msg.autor.bloco}` : ""}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {formatData(msg.criadaEm)}
                  </span>
                </div>
                <div
                  className={cn(
                    "px-3 py-2 rounded-2xl text-sm break-words",
                    mine
                      ? "bg-indigo-600 text-white rounded-tr-sm"
                      : "bg-muted rounded-tl-sm"
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

      {/* Input */}
      <div className="border-t bg-muted/30 p-3 flex gap-2 items-end flex-shrink-0">
        <textarea
          className="flex-1 resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[40px] max-h-[120px]"
          rows={1}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escreva uma mensagem… (Enter para enviar, Shift+Enter para quebrar linha)"
          disabled={enviando}
        />
        <Button
          onClick={handleSend}
          disabled={enviando || !texto.trim()}
          className="h-9 w-9 p-0 bg-indigo-600 hover:bg-indigo-700 text-white flex-shrink-0"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

// ─── Vagas Tab ────────────────────────────────────────────────────────────────

function VagasTab({ userId, perfil }: { userId: string; perfil: string }) {
  const [vagas, setVagas] = useState<VagaGaragem[]>([]);
  const [filtro, setFiltro] = useState<"disponiveis" | "todas">("disponiveis");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [tipo, setTipo] = useState("ALUGUEL");
  const [periodoAluguel, setPeriodoAluguel] = useState("MENSAL");
  const [bloco, setBloco] = useState("");
  const [numeroApto, setNumeroApto] = useState("");

  const fetchVagas = useCallback(async () => {
    const res = await fetch("/api/comunidade/vagas");
    if (res.ok) setVagas(await res.json());
  }, []);

  useEffect(() => { fetchVagas(); }, [fetchVagas]);

  const vagasFiltradas =
    filtro === "disponiveis"
      ? vagas.filter((v) => v.disponivel || v.morador.id === userId)
      : vagas;

  const handleCreate = async () => {
    if (!titulo || !valor) return toast.error("Preencha o título e o valor");
    setSalvando(true);
    const res = await fetch("/api/comunidade/vagas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ titulo, descricao, valor: parseFloat(valor), tipo, periodoAluguel, bloco: bloco || undefined, numeroApto: numeroApto || undefined }),
    });
    setSalvando(false);
    if (res.ok) {
      toast.success("Vaga anunciada com sucesso!");
      setDialogOpen(false);
      setTitulo(""); setDescricao(""); setValor(""); setTipo("ALUGUEL");
      setPeriodoAluguel("MENSAL"); setBloco(""); setNumeroApto("");
      fetchVagas();
    } else {
      const data = await res.json();
      toast.error(data.erro ?? "Erro ao anunciar vaga");
    }
  };


  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/comunidade/vagas/${id}`, { method: "DELETE" });
    if (res.ok) { fetchVagas(); toast.success("Anúncio removido"); }
    setConfirmId(null);
  };

  const canCreate = ["MORADOR", "SINDICO"].includes(perfil);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
          {(["disponiveis", "todas"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className={cn(
                "px-3 py-1.5 text-sm rounded-md font-medium transition-colors",
                filtro === f
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {f === "disponiveis" ? "Disponíveis" : "Todas"}
            </button>
          ))}
        </div>
        {canCreate && (
          <Button
            onClick={() => setDialogOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" /> Anunciar Vaga
          </Button>
        )}
      </div>

      {vagasFiltradas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
          <Car className="w-12 h-12 opacity-20" />
          <p className="text-sm">Nenhuma vaga encontrada</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {vagasFiltradas.map((vaga) => (
            <Link
              key={vaga.id}
              href={`/comunidade/vagas/${vaga.id}`}
              className={cn(
                "border border-border rounded-xl p-4 bg-card hover:shadow-md transition-shadow flex flex-col cursor-pointer",
                !vaga.disponivel && "opacity-70"
              )}
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex flex-wrap gap-1.5">
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-full text-xs font-medium",
                      vaga.tipo === "ALUGUEL"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-green-100 text-green-700"
                    )}
                  >
                    {vaga.tipo === "ALUGUEL" ? "Aluguel" : "Venda"}
                  </span>
                  {!vaga.disponivel && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500">
                      Indisponível
                    </span>
                  )}
                </div>
                <span className="text-base font-bold text-indigo-600 flex-shrink-0">
                  {formatBRL(vaga.valor)}
                  {vaga.tipo === "ALUGUEL"
                    ? vaga.periodoAluguel === "DIARIO" ? "/dia" : "/mês"
                    : ""}
                </span>
              </div>

              <h3 className="font-semibold text-sm mb-1">{vaga.titulo}</h3>
              {(vaga.bloco || vaga.numeroApto) && (
                <p className="text-xs text-muted-foreground mb-1">
                  {[vaga.bloco && `Bloco ${vaga.bloco}`, vaga.numeroApto && `Apt ${vaga.numeroApto}`].filter(Boolean).join(" · ")}
                </p>
              )}
              {vaga.descricao && (
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {vaga.descricao}
                </p>
              )}

              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-auto pt-3 border-t border-border/50">
                <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 flex-shrink-0">
                  {vaga.morador.name[0]}
                </div>
                <span className="truncate">{vaga.morador.name}</span>
                {vaga.morador.apartamento && (
                  <span className="flex-shrink-0">
                    · Apt {vaga.morador.apartamento}
                    {vaga.morador.bloco ? `-${vaga.morador.bloco}` : ""}
                  </span>
                )}
                <span className="ml-auto flex items-center gap-1 text-indigo-500 flex-shrink-0">
                  <MessageCircle className="w-3.5 h-3.5" />
                  {vaga.morador.id === userId ? "Ver interessados" : "Entrar em contato"}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Anunciar Vaga de Garagem</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="vaga-titulo">Título *</Label>
              <Input
                id="vaga-titulo"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ex: Vaga coberta próx. elevador"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Tipo *</Label>
                <Select value={tipo} onValueChange={(v) => v && setTipo(v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALUGUEL">Aluguel</SelectItem>
                    <SelectItem value="VENDA">Venda</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {tipo === "ALUGUEL" && (
                <div className="space-y-1.5">
                  <Label>Período *</Label>
                  <Select value={periodoAluguel} onValueChange={(v) => v && setPeriodoAluguel(v)}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MENSAL">Por mês</SelectItem>
                      <SelectItem value="DIARIO">Por dia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vaga-valor">
                Valor (R$){tipo === "ALUGUEL" ? (periodoAluguel === "DIARIO" ? " por dia" : " por mês") : ""} *
              </Label>
              <Input
                id="vaga-valor"
                type="number"
                min="0"
                step="0.01"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                placeholder="0,00"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="vaga-bloco">Bloco</Label>
                <Input
                  id="vaga-bloco"
                  value={bloco}
                  onChange={(e) => setBloco(e.target.value)}
                  placeholder="Ex: A, B, 1"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="vaga-apto">Nº Apartamento</Label>
                <Input
                  id="vaga-apto"
                  value={numeroApto}
                  onChange={(e) => setNumeroApto(e.target.value)}
                  placeholder="Ex: 101"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vaga-desc">Descrição</Label>
              <Textarea
                id="vaga-desc"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Detalhes sobre a vaga (localização, cobertura, etc.)"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleCreate}
              disabled={salvando}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {salvando ? "Publicando…" : "Publicar Anúncio"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmId !== null}
        title="Remover vaga"
        message="Remover este anúncio de vaga? Esta ação não pode ser desfeita."
        confirmLabel="Remover"
        onConfirm={() => confirmId && handleDelete(confirmId)}
        onCancel={() => setConfirmId(null)}
      />
    </div>
  );
}

// ─── Loja Tab ─────────────────────────────────────────────────────────────────

const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  DISPONIVEL: { label: "Disponível", cls: "bg-emerald-100 text-emerald-700" },
  RESERVADO:  { label: "Reservado",  cls: "bg-amber-100 text-amber-700" },
  VENDIDO:    { label: "Vendido",    cls: "bg-slate-100 text-slate-500" },
};

const TIPO_CFG: Record<string, { label: string; cls: string }> = {
  VENDA:  { label: "Venda",  cls: "bg-blue-100 text-blue-700" },
  TROCA:  { label: "Troca",  cls: "bg-purple-100 text-purple-700" },
  DOACAO: { label: "Doação", cls: "bg-rose-100 text-rose-700" },
};

const CAT_LABEL: Record<string, string> = {
  eletronico: "Eletrônico",
  movel: "Móvel",
  roupa: "Roupa",
  outro: "Outro",
};

// ─── Loja Tab ─────────────────────────────────────────────────────────────────

function LojaTab() {
  const [anuncios, setAnuncios] = useState<AnuncioLoja[]>([]);
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [tipo, setTipo] = useState("VENDA");
  const [categoria, setCategoria] = useState("outro");
  const [foto, setFoto] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const fotoInputRef = useRef<HTMLInputElement>(null);

  const fetchAnuncios = useCallback(async () => {
    const res = await fetch("/api/comunidade/loja");
    if (res.ok) setAnuncios(await res.json());
  }, []);

  useEffect(() => { fetchAnuncios(); }, [fetchAnuncios]);

  const filtrados =
    filtroTipo === "todos"
      ? anuncios
      : anuncios.filter((a) => a.tipo === filtroTipo);

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setFoto(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setFotoPreview(url);
    } else {
      setFotoPreview(null);
    }
  };

  const clearFoto = () => {
    setFoto(null);
    setFotoPreview(null);
    if (fotoInputRef.current) fotoInputRef.current.value = "";
  };

  const handleCreate = async () => {
    if (!titulo || !descricao) return toast.error("Preencha o título e a descrição");
    setSalvando(true);
    const fd = new FormData();
    fd.append("titulo", titulo);
    fd.append("descricao", descricao);
    fd.append("tipo", tipo);
    fd.append("categoria", categoria);
    if (valor !== "") fd.append("valor", valor);
    if (foto) fd.append("foto", foto);
    const res = await fetch("/api/comunidade/loja", { method: "POST", body: fd });
    setSalvando(false);
    if (res.ok) {
      toast.success("Anúncio publicado!");
      setDialogOpen(false);
      setTitulo(""); setDescricao(""); setValor(""); setTipo("VENDA"); setCategoria("outro");
      clearFoto();
      fetchAnuncios();
    } else {
      const data = await res.json();
      toast.error(data.erro ?? "Erro ao publicar");
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit flex-wrap">
          {["todos", "VENDA", "TROCA", "DOACAO"].map((t) => (
            <button
              key={t}
              onClick={() => setFiltroTipo(t)}
              className={cn(
                "px-3 py-1.5 text-sm rounded-md font-medium transition-colors",
                filtroTipo === t
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t === "todos" ? "Todos" : TIPO_CFG[t].label}
            </button>
          ))}
        </div>
        <Button
          onClick={() => setDialogOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" /> Publicar Anúncio
        </Button>
      </div>

      {filtrados.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
          <ShoppingBag className="w-12 h-12 opacity-20" />
          <p className="text-sm">Nenhum anúncio encontrado</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtrados.map((anuncio) => {
            const stCfg = STATUS_CFG[anuncio.status] ?? STATUS_CFG.DISPONIVEL;
            const tpCfg = TIPO_CFG[anuncio.tipo] ?? TIPO_CFG.VENDA;
            return (
              <Link
                key={anuncio.id}
                href={`/comunidade/loja/${anuncio.id}`}
                className={cn(
                  "border border-border rounded-xl p-4 bg-card hover:shadow-md transition-shadow flex flex-col cursor-pointer",
                  anuncio.status !== "DISPONIVEL" && "opacity-75"
                )}
              >
                <div className="flex flex-wrap gap-1.5 mb-3">
                  <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", tpCfg.cls)}>
                    {tpCfg.label}
                  </span>
                  <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", stCfg.cls)}>
                    {stCfg.label}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                    {CAT_LABEL[anuncio.categoria] ?? anuncio.categoria}
                  </span>
                </div>

                {anuncio.fotoUrl && (
                  <img
                    src={anuncio.fotoUrl}
                    alt={anuncio.titulo}
                    className="w-full h-40 object-cover rounded-lg mb-3 border border-border"
                  />
                )}
                <h3 className="font-semibold text-sm mb-1">{anuncio.titulo}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {anuncio.descricao}
                </p>

                {anuncio.valor != null ? (
                  <p className="text-lg font-bold text-indigo-600 mb-2">
                    {formatBRL(anuncio.valor)}
                  </p>
                ) : (
                  anuncio.tipo === "DOACAO" && (
                    <p className="text-sm font-semibold text-rose-600 mb-2">Gratuito</p>
                  )
                )}

                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-auto pt-3 border-t border-border/50">
                  <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 flex-shrink-0">
                    {anuncio.morador.name[0]}
                  </div>
                  <span className="truncate flex-1">{anuncio.morador.name}</span>
                  {anuncio.morador.apartamento && (
                    <span className="flex-shrink-0">
                      Apt {anuncio.morador.apartamento}
                      {anuncio.morador.bloco ? `-${anuncio.morador.bloco}` : ""}
                    </span>
                  )}
                  <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 text-muted-foreground/50" />
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Publicar Anúncio na Loja</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="loja-titulo">Título *</Label>
              <Input
                id="loja-titulo"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ex: Sofá 3 lugares bege"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Tipo *</Label>
                <Select value={tipo} onValueChange={(v) => v && setTipo(v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="VENDA">Venda</SelectItem>
                    <SelectItem value="TROCA">Troca</SelectItem>
                    <SelectItem value="DOACAO">Doação</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Categoria *</Label>
                <Select value={categoria} onValueChange={(v) => v && setCategoria(v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="eletronico">Eletrônico</SelectItem>
                    <SelectItem value="movel">Móvel</SelectItem>
                    <SelectItem value="roupa">Roupa</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {tipo !== "DOACAO" && (
              <div className="space-y-1.5">
                <Label htmlFor="loja-valor">Valor (R$)</Label>
                <Input
                  id="loja-valor"
                  type="number"
                  min="0"
                  step="0.01"
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  placeholder="0,00"
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="loja-desc">Descrição *</Label>
              <Textarea
                id="loja-desc"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Descreva o item: estado, dimensões, etc."
                rows={3}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Foto do produto</Label>
              {fotoPreview ? (
                <div className="relative w-full">
                  <img
                    src={fotoPreview}
                    alt="Preview"
                    className="w-full h-40 object-cover rounded-lg border border-border"
                  />
                  <button
                    type="button"
                    onClick={clearFoto}
                    className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fotoInputRef.current?.click()}
                  className="w-full h-24 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-1.5 text-muted-foreground hover:border-indigo-400 hover:text-indigo-500 transition-colors"
                >
                  <ImagePlus className="w-5 h-5" />
                  <span className="text-xs">Clique para adicionar foto (opcional)</span>
                </button>
              )}
              <input
                ref={fotoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFotoChange}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleCreate}
              disabled={salvando}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {salvando ? "Publicando…" : "Publicar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const TABS = [
  { key: "chat",  label: "Chat",             icon: MessageSquare },
  { key: "vagas", label: "Vagas de Garagem", icon: Car },
  { key: "loja",  label: "Loja",             icon: ShoppingBag },
] as const;

export default function ComunidadePage({ perfil, userId }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("chat");

  return (
    <AppShell titulo="Comunidade">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">Comunidade</h1>
          <p className="text-muted-foreground mt-1">
            Conecte-se com os moradores do condomínio
          </p>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 p-1 bg-muted rounded-xl mb-6 w-fit">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                activeTab === key
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === "chat"  && <ChatTab  userId={userId} />}
        {activeTab === "vagas" && <VagasTab userId={userId} perfil={perfil} />}
        {activeTab === "loja"  && <LojaTab />}
      </div>
    </AppShell>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);
  if (!session) return { redirect: { destination: "/login", permanent: false } };

  let userId = session.user.id ?? "";
  if (!userId && session.user.email) {
    const user = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } });
    userId = user?.id ?? "";
  }

  return {
    props: {
      perfil: session.user.perfil ?? "MORADOR",
      userId,
    },
  };
};
