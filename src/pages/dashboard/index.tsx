import { GetServerSideProps } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import AppShell from "@/components/layout/AppShell";
import { Bell, AlertTriangle, CalendarDays, PackageOpen, Users, TrendingUp } from "lucide-react";

interface Resumo {
  avisos: number;
  ocorrenciasAbertas: number;
  reservasPendentes: number;
  entregasPendentes: number;
  visitantesHoje: number;
}

interface Props {
  perfil: string;
  nome: string;
  resumo: Resumo;
}

const KPI_CONFIGS: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  avisos:             { label: "Avisos ativos",          icon: Bell,          color: "text-indigo-600",  bg: "bg-indigo-50" },
  ocorrenciasAbertas: { label: "Ocorrências abertas",    icon: AlertTriangle, color: "text-amber-600",   bg: "bg-amber-50" },
  reservasPendentes:  { label: "Reservas pendentes",     icon: CalendarDays,  color: "text-violet-600",  bg: "bg-violet-50" },
  entregasPendentes:  { label: "Entregas aguardando",    icon: PackageOpen,   color: "text-orange-600",  bg: "bg-orange-50" },
  visitantesHoje:     { label: "Visitantes hoje",        icon: Users,         color: "text-emerald-600", bg: "bg-emerald-50" },
};

function KpiCard({ chave, valor }: { chave: string; valor: number }) {
  const cfg = KPI_CONFIGS[chave];
  if (!cfg) return null;
  const Icon = cfg.icon;
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-11 h-11 rounded-xl ${cfg.bg} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${cfg.color}`} />
        </div>
        <div className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
          <TrendingUp className="w-3 h-3" />
          <span>hoje</span>
        </div>
      </div>
      <p className={`text-3xl font-bold ${cfg.color} mb-1`}>{valor}</p>
      <p className="text-sm text-slate-500 font-medium">{cfg.label}</p>
    </div>
  );
}

const PERFIL_KPIS: Record<string, string[]> = {
  MORADOR:        ["avisos", "ocorrenciasAbertas", "reservasPendentes", "entregasPendentes"],
  SINDICO:        ["avisos", "ocorrenciasAbertas", "reservasPendentes"],
  PORTEIRO:       ["visitantesHoje", "entregasPendentes"],
  ADMINISTRADORA: ["avisos", "ocorrenciasAbertas"],
};

const SAUDACOES: Record<string, string> = {
  MORADOR:        "Olá, morador",
  SINDICO:        "Painel do Síndico",
  PORTEIRO:       "Painel da Portaria",
  ADMINISTRADORA: "Painel Administrativo",
};

export default function Dashboard({ perfil, nome, resumo }: Props) {
  const kpis = PERFIL_KPIS[perfil] ?? [];
  const primeiroNome = nome.split(" ")[0];

  return (
    <AppShell titulo="Dashboard">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              {SAUDACOES[perfil]}, {primeiroNome}!
            </h2>
            <p className="text-slate-500 text-sm mt-0.5">
              {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
            </p>
          </div>
        </div>

        {/* KPI Grid */}
        <div className={`grid gap-4 ${kpis.length <= 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-2 lg:grid-cols-4"}`}>
          {kpis.map((chave) => (
            <KpiCard key={chave} chave={chave} valor={resumo[chave as keyof Resumo] as number} />
          ))}
        </div>

        {/* Dica de acesso rápido */}
        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5">
          <p className="text-indigo-700 text-sm font-semibold mb-1">Acesso rápido</p>
          <p className="text-indigo-500 text-xs">Use o menu lateral para navegar entre os módulos do sistema.</p>
        </div>
      </div>
    </AppShell>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);
  if (!session) return { redirect: { destination: "/login", permanent: false } };

  const { prisma } = await import("@/lib/prisma");
  const { condoId, id: userId, perfil } = session.user;
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  const amanha = new Date(hoje); amanha.setDate(amanha.getDate() + 1);

  const [avisos, ocorrenciasAbertas, reservasPendentes, entregasPendentes, visitantesHoje] = await Promise.all([
    prisma.aviso.count({ where: { condoId, ativo: true } }),
    prisma.ocorrencia.count({ where: { condoId, status: { in: ["ABERTA","EM_ANALISE"] }, ...(perfil === "MORADOR" ? { moradorId: userId } : {}) } }),
    prisma.reserva.count({ where: { status: "PENDENTE", area: { condoId }, ...(perfil === "MORADOR" ? { moradorId: userId } : {}) } }),
    prisma.entrega.count({ where: { status: "AGUARDANDO_RETIRADA", ...(perfil === "MORADOR" ? { moradorId: userId } : { porteiro: { condoId } }) } }),
    prisma.autorizacaoVisitante.count({ where: { ativa: true, dataValida: { gte: hoje, lt: amanha }, morador: { condoId } } }),
  ]);

  return {
    props: {
      perfil: session.user.perfil,
      nome: session.user.name ?? "",
      resumo: { avisos, ocorrenciasAbertas, reservasPendentes, entregasPendentes, visitantesHoje },
    },
  };
};
