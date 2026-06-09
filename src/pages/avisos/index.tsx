import { GetServerSideProps } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import AppShell from "@/components/layout/AppShell";
import AvisoCard from "@/components/avisos/AvisoCard";
import { Button } from "@/components/ui/button";
import { Plus, Bell } from "lucide-react";

interface Aviso {
  id: string;
  titulo: string;
  descricao: string;
  categoria: string;
  urgente: boolean;
  publicadoEm: string;
  expiradoEm: string | null;
  autor: { name: string };
}

interface Props { avisos: Aviso[]; perfil: string; }

export default function Avisos({ avisos, perfil }: Props) {
  const urgentes = avisos.filter(a => a.urgente);
  const normais = avisos.filter(a => !a.urgente);

  return (
    <AppShell titulo="Mural de Avisos">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Mural de Avisos</h2>
            <p className="text-slate-500 text-sm mt-0.5">{avisos.length} aviso(s) ativo(s)</p>
          </div>
          {perfil === "SINDICO" && (
            <Link href="/avisos/novo">
              <Button className="bg-indigo-600 hover:bg-indigo-700 gap-2 shadow-sm shadow-indigo-600/20">
                <Plus className="w-4 h-4" />
                Novo Aviso
              </Button>
            </Link>
          )}
        </div>

        {/* Estado vazio */}
        {avisos.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
              <Bell className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="font-semibold text-slate-700 mb-1">Nenhum aviso publicado</h3>
            <p className="text-slate-400 text-sm">Os comunicados do condomínio aparecerão aqui.</p>
          </div>
        )}

        {/* Urgentes */}
        {urgentes.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-bold text-rose-600 uppercase tracking-widest">Urgente</p>
            {urgentes.map(a => <AvisoCard key={a.id} aviso={a} />)}
          </div>
        )}

        {/* Normais */}
        {normais.length > 0 && (
          <div className="space-y-3">
            {urgentes.length > 0 && <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Comunicados</p>}
            {normais.map(a => <AvisoCard key={a.id} aviso={a} />)}
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
  const avisos = await prisma.aviso.findMany({
    where: { condoId: session.user.condoId, ativo: true },
    include: { autor: { select: { name: true } } },
    orderBy: [{ urgente: "desc" }, { publicadoEm: "desc" }],
  });

  return {
    props: {
      perfil: session.user.perfil,
      avisos: avisos.map(a => ({ ...a, publicadoEm: a.publicadoEm.toISOString(), expiradoEm: a.expiradoEm?.toISOString() ?? null })),
    },
  };
};
