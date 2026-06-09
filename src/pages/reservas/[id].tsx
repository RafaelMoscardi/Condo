import { GetServerSideProps } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { useRouter } from "next/router";
import AppShell from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Link from "next/link";
import { ArrowLeft, CalendarDays, Clock, User, CheckCircle2, XCircle } from "lucide-react";

const STATUS_CONFIG: Record<string, { label: string; cor: string; bg: string }> = {
  PENDENTE:   { label: "Pendente",  cor: "text-amber-700",  bg: "bg-amber-50 border-amber-200" },
  APROVADA:   { label: "Aprovada",  cor: "text-emerald-700",bg: "bg-emerald-50 border-emerald-200" },
  REJEITADA:  { label: "Rejeitada", cor: "text-rose-700",   bg: "bg-rose-50 border-rose-200" },
  CANCELADA:  { label: "Cancelada", cor: "text-slate-500",  bg: "bg-slate-50 border-slate-200" },
};

interface Reserva {
  id: string; data: string; horaInicio: string; horaFim: string;
  status: string; observacoes: string | null;
  area: { nome: string; descricao: string | null };
  morador: { name: string; apartamento: string | null; bloco: string | null };
}

interface Props { reserva: Reserva; perfil: string; moradorProprietario: boolean; }

export default function DetalheReserva({ reserva, perfil, moradorProprietario }: Props) {
  const router = useRouter();
  const sc = STATUS_CONFIG[reserva.status] ?? STATUS_CONFIG.CANCELADA;

  const atualizar = async (novoStatus: string) => {
    const res = await fetch(`/api/reservas/${reserva.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: novoStatus }),
    });
    if (res.ok) {
      toast.success(`Reserva ${STATUS_CONFIG[novoStatus]?.label.toLowerCase()}!`);
      router.replace(router.asPath);
    } else {
      const err = await res.json();
      toast.error(err.erro ?? "Erro ao atualizar reserva");
    }
  };

  return (
    <AppShell titulo="Detalhe da Reserva">
      <div className="max-w-lg space-y-5">
        <Link href="/reservas" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Voltar
        </Link>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-50 flex items-center justify-between">
            <h2 className="font-bold text-slate-900 text-lg">{reserva.area.nome}</h2>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${sc.bg} ${sc.cor}`}>{sc.label}</span>
          </div>

          <div className="px-6 py-5 grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                <CalendarDays className="w-3.5 h-3.5" /> Data
              </div>
              <p className="text-sm font-semibold text-slate-800">
                {new Date(reserva.data).toLocaleDateString("pt-BR", { timeZone: "UTC", weekday: "long", day: "2-digit", month: "long" })}
              </p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                <Clock className="w-3.5 h-3.5" /> Horário
              </div>
              <p className="text-sm font-semibold text-slate-800">{reserva.horaInicio} – {reserva.horaFim}</p>
            </div>
            <div className="col-span-2 space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                <User className="w-3.5 h-3.5" /> Solicitante
              </div>
              <p className="text-sm font-semibold text-slate-800">
                {reserva.morador.name}
                {reserva.morador.apartamento && ` — Apt ${reserva.morador.apartamento}${reserva.morador.bloco ? `-${reserva.morador.bloco}` : ""}`}
              </p>
            </div>
            {reserva.observacoes && (
              <div className="col-span-2 space-y-1">
                <p className="text-xs text-slate-400 font-medium">Observações</p>
                <p className="text-sm text-slate-600">{reserva.observacoes}</p>
              </div>
            )}
          </div>

          {/* Ações */}
          {(perfil === "SINDICO" && reserva.status === "PENDENTE") || (moradorProprietario && ["PENDENTE","APROVADA"].includes(reserva.status)) ? (
            <div className="px-6 pb-5 flex gap-2 border-t border-slate-50 pt-5">
              {perfil === "SINDICO" && reserva.status === "PENDENTE" && (
                <>
                  <Button onClick={() => atualizar("APROVADA")} className="bg-emerald-600 hover:bg-emerald-700 gap-2 flex-1">
                    <CheckCircle2 className="w-4 h-4" /> Aprovar
                  </Button>
                  <Button onClick={() => atualizar("REJEITADA")} variant="destructive" className="gap-2 flex-1">
                    <XCircle className="w-4 h-4" /> Rejeitar
                  </Button>
                </>
              )}
              {moradorProprietario && ["PENDENTE","APROVADA"].includes(reserva.status) && (
                <Button variant="outline" onClick={() => atualizar("CANCELADA")} className="gap-2">
                  Cancelar Reserva
                </Button>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </AppShell>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);
  if (!session) return { redirect: { destination: "/login", permanent: false } };
  const { id } = context.params as { id: string };
  const { prisma } = await import("@/lib/prisma");
  const reserva = await prisma.reserva.findUnique({
    where: { id },
    include: { area: { select: { nome: true, descricao: true, condoId: true } }, morador: { select: { name: true, apartamento: true, bloco: true } } },
  });
  if (!reserva || reserva.area.condoId !== session.user.condoId) return { notFound: true };
  if (session.user.perfil === "MORADOR" && reserva.moradorId !== session.user.id) return { notFound: true };
  return {
    props: {
      perfil: session.user.perfil,
      moradorProprietario: reserva.moradorId === session.user.id,
      reserva: { ...reserva, data: reserva.data.toISOString(), criadaEm: reserva.criadaEm.toISOString(), atualizadaEm: reserva.atualizadaEm.toISOString() },
    },
  };
};
