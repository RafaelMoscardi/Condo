import { Megaphone, Wrench, DollarSign, Shield, Bell } from "lucide-react";

const CATEGORIA_CONFIG: Record<string, { label: string; cor: string; bg: string; borda: string; Icon: React.ElementType }> = {
  manutencao: { label: "Manutenção",  cor: "text-orange-600", bg: "bg-orange-50",  borda: "border-l-orange-400",  Icon: Wrench },
  financeiro:  { label: "Financeiro", cor: "text-emerald-600",bg: "bg-emerald-50", borda: "border-l-emerald-400", Icon: DollarSign },
  geral:       { label: "Geral",      cor: "text-indigo-600", bg: "bg-indigo-50",  borda: "border-l-indigo-400",  Icon: Megaphone },
  seguranca:   { label: "Segurança",  cor: "text-rose-600",   bg: "bg-rose-50",    borda: "border-l-rose-400",    Icon: Shield },
};

interface Aviso {
  id: string;
  titulo: string;
  descricao: string;
  categoria: string;
  urgente: boolean;
  publicadoEm: string;
  autor: { name: string };
}

export default function AvisoCard({ aviso }: { aviso: Aviso }) {
  const cfg = CATEGORIA_CONFIG[aviso.categoria] ?? { label: aviso.categoria, cor: "text-slate-600", bg: "bg-slate-50", borda: "border-l-slate-400", Icon: Bell };
  const Icon = cfg.Icon;

  if (aviso.urgente) {
    return (
      <div className="bg-rose-50 border border-rose-200 border-l-4 border-l-rose-500 rounded-xl p-5 hover:shadow-md transition-all">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Bell className="w-5 h-5 text-rose-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1 bg-rose-600 text-white text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide">
                ⚠ Urgente
              </span>
              <span className="text-xs text-rose-400 font-medium uppercase tracking-wide">{cfg.label}</span>
            </div>
            <h3 className="font-bold text-rose-900 text-base mb-1.5 leading-snug">{aviso.titulo}</h3>
            <p className="text-sm text-rose-700/80 leading-relaxed">{aviso.descricao}</p>
            <p className="text-xs text-rose-400 mt-2.5">
              {aviso.autor.name} · {new Date(aviso.publicadoEm).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-slate-100 border-l-4 ${cfg.borda} rounded-xl p-5 hover:shadow-md transition-all`}>
      <div className="flex items-start gap-4">
        <div className={`w-10 h-10 rounded-xl ${cfg.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
          <Icon className={`w-5 h-5 ${cfg.cor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className={`text-xs font-semibold uppercase tracking-wide ${cfg.cor}`}>{cfg.label}</span>
            <span className="text-xs text-slate-400 flex-shrink-0">
              {new Date(aviso.publicadoEm).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
            </span>
          </div>
          <h3 className="font-semibold text-slate-900 text-sm mb-1.5 leading-snug">{aviso.titulo}</h3>
          <p className="text-sm text-slate-500 leading-relaxed line-clamp-2">{aviso.descricao}</p>
          <p className="text-xs text-slate-400 mt-2">Por {aviso.autor.name}</p>
        </div>
      </div>
    </div>
  );
}
