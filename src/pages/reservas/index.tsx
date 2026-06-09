import { GetServerSideProps } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import AppShell from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Plus, CalendarDays, Clock, ChevronRight } from "lucide-react";

const STATUS_CONFIG: Record<string, { label: string; cor: string; bg: string }> = {
  PENDENTE:   { label: "Pendente",  cor: "text-amber-700",  bg: "bg-amber-50 border-amber-200" },
  APROVADA:   { label: "Aprovada",  cor: "text-emerald-700",bg: "bg-emerald-50 border-emerald-200" },
  REJEITADA:  { label: "Rejeitada", cor: "text-rose-700",   bg: "bg-rose-50 border-rose-200" },
  CANCELADA:  { label: "Cancelada", cor: "text-slate-500",  bg: "bg-slate-50 border-slate-200" },
};

interface Reserva {
  id: string; data: string; horaInicio: string; horaFim: string; status: string;
  area: { nome: string };
  morador: { name: string; apartamento: string | null; bloco: string | null };
}

interface Props { reservas: Reserva[]; perfil: string; }

export default function Reservas({ reservas, perfil }: Props) {
  return (
    <AppShell titulo="Reservas">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Reservas de Áreas Comuns</h2>
            <p className="text-slate-500 text-sm mt-0.5">{reservas.length} reserva(s)</p>
          </div>
          {perfil === "MORADOR" && (
            <Link href="/reservas/nova">
              <Button className="bg-indigo-600 hover:bg-indigo-700 gap-2 shadow-sm shadow-indigo-600/20">
                <Plus className="w-4 h-4" /> Nova Reserva
              </Button>
            </Link>
          )}
        </div>

        {reservas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-violet-50 rounded-2xl flex items-center justify-center mb-4">
              <CalendarDays className="w-8 h-8 text-violet-400" />
            </div>
            <h3 className="font-semibold text-slate-700 mb-1">Nenhuma reserva</h3>
            <p className="text-slate-400 text-sm">Reserve uma área comum para seu evento.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {reservas.map((r) => {
              const sc = STATUS_CONFIG[r.status] ?? STATUS_CONFIG.CANCELADA;
              const dataFormatada = new Date(r.data).toLocaleDateString("pt-BR", { timeZone: "UTC", weekday: "short", day: "2-digit", month: "short" });
              return (
                <Link key={r.id} href={`/reservas/${r.id}`}>
                  <div className="bg-white border border-slate-100 rounded-xl p-4 hover:shadow-md hover:border-slate-200 transition-all flex items-center gap-4 cursor-pointer">
                    <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center flex-shrink-0">
                      <CalendarDays className="w-4 h-4 text-violet-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 text-sm">{r.area.nome}</p>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <CalendarDays className="w-3 h-3" />{dataFormatada}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />{r.horaInicio}–{r.horaFim}
                        </span>
                      </div>
                      {perfil === "SINDICO" && (
                        <p className="text-xs text-slate-400 mt-0.5">
                          {r.morador.name}{r.morador.apartamento && ` — Apt ${r.morador.apartamento}`}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${sc.bg} ${sc.cor}`}>{sc.label}</span>
                      <ChevronRight className="w-4 h-4 text-slate-300" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);
  if (!session) return { redirect: { destination: "/login", permanent: false } };

  const { prisma } = await import("@/lib/prisma");
  const { perfil, condoId, id: userId } = session.user;

  const reservas = await prisma.reserva.findMany({
    where: { area: { condoId }, ...(perfil === "MORADOR" ? { moradorId: userId } : {}) },
    include: { area: { select: { nome: true } }, morador: { select: { name: true, apartamento: true, bloco: true } } },
    orderBy: [{ status: "asc" }, { data: "desc" }],
  });

  return {
    props: {
      perfil,
      reservas: reservas.map(r => ({
        ...r,
        data: r.data.toISOString(),
        criadaEm: r.criadaEm.toISOString(),
        atualizadaEm: r.atualizadaEm.toISOString(),
      })),
    },
  };
};
