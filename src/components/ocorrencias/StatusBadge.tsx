const CONFIG: Record<string, { label: string; cor: string; bg: string }> = {
  ABERTA:     { label: "Aberta",     cor: "text-amber-700",  bg: "bg-amber-50 border border-amber-200" },
  EM_ANALISE: { label: "Em Análise", cor: "text-indigo-700", bg: "bg-indigo-50 border border-indigo-200" },
  RESOLVIDA:  { label: "Resolvida",  cor: "text-emerald-700",bg: "bg-emerald-50 border border-emerald-200" },
  ENCERRADA:  { label: "Encerrada",  cor: "text-slate-500",  bg: "bg-slate-50 border border-slate-200" },
};

export default function StatusBadge({ status }: { status: string }) {
  const c = CONFIG[status] ?? CONFIG.ENCERRADA;
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${c.bg} ${c.cor}`}>
      {c.label}
    </span>
  );
}
