import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { GetServerSideProps } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import AppShell from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Search, X, Check, Building2 } from "lucide-react";

interface Morador {
  id: string;
  name: string;
  apartamento: string | null;
  bloco: string | null;
}

// ── Morador Combobox ────────────────────────────────────────────────────────

function MoradorCombobox({
  moradores,
  value,
  onChange,
}: {
  moradores: Morador[];
  value: Morador | null;
  onChange: (m: Morador | null) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const q = query.toLowerCase().trim();
  const filtered = q.length === 0
    ? moradores
    : moradores.filter((m) =>
        m.name.toLowerCase().includes(q) ||
        (m.apartamento ?? "").toLowerCase().includes(q) ||
        (m.bloco ?? "").toLowerCase().includes(q)
      );

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const select = (m: Morador) => {
    onChange(m);
    setQuery("");
    setOpen(false);
  };

  const clear = () => {
    onChange(null);
    setQuery("");
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  if (value) {
    return (
      <div className="flex items-center gap-3 h-11 px-3 bg-indigo-50 border border-indigo-200 rounded-xl">
        <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0">
          <span className="text-white text-xs font-bold">{value.name[0]?.toUpperCase()}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-indigo-900 leading-none truncate">{value.name}</p>
          {value.apartamento && (
            <p className="text-xs text-indigo-500 mt-0.5">
              {value.bloco ? `Bloco ${value.bloco} · ` : ""}Apt {value.apartamento}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={clear}
          className="p-1 rounded-lg hover:bg-indigo-100 text-indigo-400 hover:text-indigo-700 transition-colors flex-shrink-0"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Buscar por nome ou apartamento..."
          className="w-full h-11 pl-9 pr-4 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/15 transition-all placeholder:text-slate-400"
          autoComplete="off"
        />
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 top-full mt-1.5 left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-xl shadow-slate-200/60 overflow-hidden animate-slide-up">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <Building2 className="w-6 h-6 text-slate-300" />
              <p className="text-sm text-slate-400">Nenhum morador encontrado</p>
            </div>
          ) : (
            <ul className="max-h-60 overflow-y-auto py-1.5">
              {filtered.map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); select(m); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-indigo-50 transition-colors text-left group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-indigo-100 flex items-center justify-center flex-shrink-0 transition-colors">
                      <span className="text-xs font-bold text-slate-500 group-hover:text-indigo-600 transition-colors">
                        {m.name[0]?.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 leading-none truncate">
                        {highlight(m.name, q)}
                      </p>
                      {m.apartamento && (
                        <p className="text-xs text-slate-400 mt-0.5">
                          {m.bloco ? `Bloco ${m.bloco} · ` : ""}Apt {highlight(m.apartamento, q)}
                        </p>
                      )}
                    </div>
                    <Check className="w-3.5 h-3.5 text-indigo-400 opacity-0 group-hover:opacity-100 flex-shrink-0 transition-opacity" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

/** Wrap matching substring in a span for visual emphasis */
function highlight(text: string, q: string): React.ReactNode {
  if (!q) return text;
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-indigo-100 text-indigo-800 rounded px-0.5 not-italic">{text.slice(idx, idx + q.length)}</mark>
      {text.slice(idx + q.length)}
    </>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────

export default function RegistrarEntrega() {
  const router = useRouter();
  const [moradores, setMoradores] = useState<Morador[]>([]);
  const [selectedMorador, setSelectedMorador] = useState<Morador | null>(null);
  const [remetente, setRemetente] = useState("");
  const [descricao, setDescricao] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    fetch("/api/users/moradores")
      .then((r) => r.json())
      .then(setMoradores);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMorador || !descricao) {
      toast.error("Selecione o morador e descreva a entrega");
      return;
    }
    setSalvando(true);
    const res = await fetch("/api/entregas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ moradorId: selectedMorador.id, remetente, descricao, observacoes }),
    });
    setSalvando(false);
    if (res.ok) {
      toast.success("Entrega registrada!");
      router.push("/entregas");
    } else {
      const err = await res.json();
      toast.error(err.erro ?? "Erro ao registrar entrega");
    }
  };

  return (
    <AppShell titulo="Registrar Entrega">
      <div className="max-w-md">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-900">Registrar Entrega</h2>
          <p className="text-slate-500 text-sm mt-0.5">Preencha os dados da encomenda recebida.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Destinatário */}
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold text-slate-700">
              Destinatário *
              {selectedMorador && (
                <span className="ml-2 text-xs font-normal text-emerald-600">✓ selecionado</span>
              )}
            </Label>
            <MoradorCombobox
              moradores={moradores}
              value={selectedMorador}
              onChange={setSelectedMorador}
            />
            {!selectedMorador && (
              <p className="text-xs text-slate-400">Digite o nome ou número do apartamento para buscar</p>
            )}
          </div>

          {/* Remetente */}
          <div className="space-y-1.5">
            <Label htmlFor="remetente" className="text-sm font-semibold text-slate-700">
              Remetente <span className="font-normal text-slate-400">(opcional)</span>
            </Label>
            <Input
              id="remetente"
              value={remetente}
              onChange={(e) => setRemetente(e.target.value)}
              placeholder="Ex: Amazon, Correios, iFood…"
              className="h-11"
            />
          </div>

          {/* Descrição */}
          <div className="space-y-1.5">
            <Label htmlFor="descricao" className="text-sm font-semibold text-slate-700">
              Descrição da encomenda *
            </Label>
            <Input
              id="descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Ex: 1 caixa pequena, envelope A4…"
              className="h-11"
              required
            />
          </div>

          {/* Observações */}
          <div className="space-y-1.5">
            <Label htmlFor="obs" className="text-sm font-semibold text-slate-700">
              Observações <span className="font-normal text-slate-400">(opcional)</span>
            </Label>
            <Textarea
              id="obs"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Alguma informação adicional…"
              rows={2}
              className="resize-none"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <Button
              type="submit"
              disabled={salvando || !selectedMorador}
              className="bg-indigo-600 hover:bg-indigo-700 gap-2 shadow-sm shadow-indigo-600/20"
            >
              {salvando ? "Registrando…" : "Registrar Entrega"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);
  if (!session) return { redirect: { destination: "/login", permanent: false } };
  if (session.user.perfil !== "PORTEIRO") {
    return { redirect: { destination: "/entregas", permanent: false } };
  }
  return { props: {} };
};
