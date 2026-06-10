import { GetServerSideProps } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import AppShell from "@/components/layout/AppShell";
import {
  Bell, AlertTriangle, CalendarDays, PackageOpen, Users,
  TrendingUp, ArrowRight, UserCheck, Users2, BookUser,
  Megaphone, Home, Plus,
} from "lucide-react";

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

// ── KPI Cards ──────────────────────────────────────────────────────────────────

const KPI_CONFIGS: Record<string, {
  label: string;
  icon: React.ElementType;
  color: string;
  iconBg: string;
  valueBg: string;
  borderColor: string;
}> = {
  avisos:             {
    label: "Avisos ativos",
    icon: Bell,
    color: "text-indigo-600",
    iconBg: "bg-indigo-50",
    valueBg: "from-indigo-50/60",
    borderColor: "border-t-indigo-400",
  },
  ocorrenciasAbertas: {
    label: "Ocorrências abertas",
    icon: AlertTriangle,
    color: "text-amber-600",
    iconBg: "bg-amber-50",
    valueBg: "from-amber-50/60",
    borderColor: "border-t-amber-400",
  },
  reservasPendentes: {
    label: "Reservas pendentes",
    icon: CalendarDays,
    color: "text-violet-600",
    iconBg: "bg-violet-50",
    valueBg: "from-violet-50/60",
    borderColor: "border-t-violet-400",
  },
  entregasPendentes: {
    label: "Entregas aguardando",
    icon: PackageOpen,
    color: "text-orange-600",
    iconBg: "bg-orange-50",
    valueBg: "from-orange-50/60",
    borderColor: "border-t-orange-400",
  },
  visitantesHoje:    {
    label: "Visitantes hoje",
    icon: Users,
    color: "text-emerald-600",
    iconBg: "bg-emerald-50",
    valueBg: "from-emerald-50/60",
    borderColor: "border-t-emerald-400",
  },
};

function KpiCard({ chave, valor }: { chave: string; valor: number }) {
  const cfg = KPI_CONFIGS[chave];
  if (!cfg) return null;
  const Icon = cfg.icon;
  return (
    <div className={`bg-white rounded-2xl border-t-2 ${cfg.borderColor} border-b border-x border-slate-100 p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl ${cfg.iconBg} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${cfg.color}`} />
        </div>
        {valor > 0 && (
          <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
            <TrendingUp className="w-2.5 h-2.5" />
            ativo
          </span>
        )}
      </div>
      <p className={`text-3xl font-bold ${cfg.color} mb-1 tabular-nums`}>{valor}</p>
      <p className="text-xs text-slate-400 font-medium leading-snug">{cfg.label}</p>
    </div>
  );
}

// ── Quick Actions ──────────────────────────────────────────────────────────────

type QuickAction = {
  label: string;
  desc: string;
  href: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  border: string;
};

const QUICK_ACTIONS: Record<string, QuickAction[]> = {
  MORADOR: [
    { label: "Nova Reserva",       desc: "Reserve uma área comum",  href: "/reservas/nova",       icon: CalendarDays, color: "text-violet-600",  bg: "bg-violet-50",  border: "border-violet-100" },
    { label: "Autorizar Visitante",desc: "Libere entrada de visita", href: "/visitantes/autorizar",icon: UserCheck,    color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
    { label: "Abrir Ocorrência",   desc: "Relate um problema",       href: "/ocorrencias/nova",    icon: AlertTriangle,color: "text-amber-600",   bg: "bg-amber-50",   border: "border-amber-100" },
    { label: "Comunidade",         desc: "Loja e vagas de garagem",  href: "/comunidade",          icon: Users2,       color: "text-indigo-600",  bg: "bg-indigo-50",  border: "border-indigo-100" },
  ],
  SINDICO: [
    { label: "Novo Aviso",         desc: "Publique um comunicado",   href: "/avisos/novo",         icon: Megaphone,    color: "text-indigo-600",  bg: "bg-indigo-50",  border: "border-indigo-100" },
    { label: "Ocorrências",        desc: "Veja os registros",        href: "/ocorrencias",         icon: AlertTriangle,color: "text-amber-600",   bg: "bg-amber-50",   border: "border-amber-100" },
    { label: "Moradores",          desc: "Gerencie usuários",        href: "/moradores",           icon: Users,        color: "text-violet-600",  bg: "bg-violet-50",  border: "border-violet-100" },
    { label: "Reservas",           desc: "Aprovar reservas",         href: "/reservas",            icon: CalendarDays, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
  ],
  PORTEIRO: [
    { label: "Reg. Entrega",       desc: "Nova encomenda recebida",  href: "/entregas/registrar",  icon: PackageOpen,  color: "text-orange-600",  bg: "bg-orange-50",  border: "border-orange-100" },
    { label: "Visitantes",         desc: "Autorizados hoje",         href: "/visitantes",          icon: Users,        color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
    { label: "Diretório",          desc: "Lista de moradores",       href: "/porteiro/diretorio",  icon: BookUser,     color: "text-indigo-600",  bg: "bg-indigo-50",  border: "border-indigo-100" },
    { label: "Nova Ocorrência",    desc: "Registrar problema",       href: "/ocorrencias/nova",    icon: AlertTriangle,color: "text-amber-600",   bg: "bg-amber-50",   border: "border-amber-100" },
  ],
  ADMINISTRADORA: [
    { label: "Novo Aviso",         desc: "Publique um comunicado",   href: "/avisos/novo",         icon: Megaphone,    color: "text-indigo-600",  bg: "bg-indigo-50",  border: "border-indigo-100" },
    { label: "Ocorrências",        desc: "Veja os registros",        href: "/ocorrencias",         icon: AlertTriangle,color: "text-amber-600",   bg: "bg-amber-50",   border: "border-amber-100" },
    { label: "Comunidade",         desc: "Loja e vagas",             href: "/comunidade",          icon: Users2,       color: "text-violet-600",  bg: "bg-violet-50",  border: "border-violet-100" },
    { label: "Mural de Avisos",    desc: "Ver todos comunicados",    href: "/avisos",              icon: Bell,         color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
  ],
};

function QuickActionCard({ action }: { action: QuickAction }) {
  const Icon = action.icon;
  return (
    <Link href={action.href}>
      <div className={`group bg-white border ${action.border} rounded-2xl p-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-3 sm:flex-col sm:items-start sm:gap-3`}>
        <div className={`w-10 h-10 rounded-xl ${action.bg} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200`}>
          <Icon className={`w-5 h-5 ${action.color}`} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-slate-800 text-sm leading-tight">{action.label}</p>
          <p className="text-xs text-slate-400 mt-0.5 leading-snug hidden sm:block">{action.desc}</p>
        </div>
        <ArrowRight className={`w-4 h-4 ${action.color} opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-200 flex-shrink-0`} />
      </div>
    </Link>
  );
}

// ── Saudações ──────────────────────────────────────────────────────────────────

const SAUDACOES: Record<string, string> = {
  MORADOR:        "Olá",
  SINDICO:        "Bem-vindo",
  PORTEIRO:       "Olá",
  ADMINISTRADORA: "Olá",
};

const SUBTITULOS: Record<string, string> = {
  MORADOR:        "Veja o que está acontecendo no condomínio.",
  SINDICO:        "Aqui está o resumo do condomínio.",
  PORTEIRO:       "Aqui está o painel da portaria.",
  ADMINISTRADORA: "Aqui está o painel administrativo.",
};

const PERFIL_KPIS: Record<string, string[]> = {
  MORADOR:        ["avisos", "ocorrenciasAbertas", "reservasPendentes", "entregasPendentes"],
  SINDICO:        ["avisos", "ocorrenciasAbertas", "reservasPendentes"],
  PORTEIRO:       ["visitantesHoje", "entregasPendentes"],
  ADMINISTRADORA: ["avisos", "ocorrenciasAbertas"],
};

// ── Page ───────────────────────────────────────────────────────────────────────

export default function Dashboard({ perfil, nome, resumo }: Props) {
  const kpis = PERFIL_KPIS[perfil] ?? [];
  const quickActions = QUICK_ACTIONS[perfil] ?? QUICK_ACTIONS.MORADOR;
  const primeiroNome = nome.split(" ")[0];

  const agora = new Date();
  const hora = agora.getHours();
  const periodo = hora < 12 ? "Bom dia" : hora < 18 ? "Boa tarde" : "Boa noite";
  const dataFormatada = agora.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });

  return (
    <AppShell titulo="Dashboard">
      <div className="space-y-6">

        {/* ── Welcome banner ── */}
        <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-700 rounded-2xl p-5 sm:p-6 shadow-xl shadow-indigo-600/20">
          {/* Decorative blobs */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 w-32 h-32 bg-violet-400/10 rounded-full blur-xl pointer-events-none" />

          <div className="relative flex items-start justify-between gap-4">
            <div>
              <p className="text-indigo-200 text-sm font-medium mb-1">{periodo},</p>
              <h2 className="text-white font-bold text-2xl sm:text-3xl leading-tight mb-1">
                {SAUDACOES[perfil]} {primeiroNome}!
              </h2>
              <p className="text-indigo-200/80 text-sm capitalize">{dataFormatada}</p>
              <p className="text-indigo-200/60 text-xs mt-1">{SUBTITULOS[perfil]}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
              <Home className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        {/* ── KPI Grid ── */}
        {kpis.length > 0 && (
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Resumo</h3>
            <div className={`grid gap-3 ${kpis.length <= 2 ? "grid-cols-2" : "grid-cols-2 lg:grid-cols-4"}`}>
              {kpis.map((chave) => (
                <KpiCard key={chave} chave={chave} valor={resumo[chave as keyof Resumo] as number} />
              ))}
            </div>
          </div>
        )}

        {/* ── Quick Actions ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Ações Rápidas</h3>
            <Plus className="w-3.5 h-3.5 text-slate-300" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {quickActions.map((action) => (
              <QuickActionCard key={action.href} action={action} />
            ))}
          </div>
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
