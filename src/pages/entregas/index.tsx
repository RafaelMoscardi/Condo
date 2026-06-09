import { GetServerSideProps } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { useRouter } from "next/router";
import AppShell from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Plus, PackageOpen, Package, CheckCircle2 } from "lucide-react";

interface Entrega {
  id: string; descricao: string; remetente: string | null; status: string;
  recebidaEm: string; retiradaEm: string | null;
  morador: { name: string; apartamento: string | null; bloco: string | null };
  porteiro: { name: string };
}

interface Props { entregas: Entrega[]; perfil: string; }

export default function Entregas({ entregas, perfil }: Props) {
  const router = useRouter();

  const confirmarRetirada = async (id: string) => {
    const res = await fetch(`/api/entregas/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" } });
    if (res.ok) { toast.success("Retirada confirmada!"); router.replace(router.asPath); }
    else { const err = await res.json(); toast.error(err.erro ?? "Erro"); }
  };

  const pendentes = entregas.filter(e => e.status === "AGUARDANDO_RETIRADA");
  const retiradas = entregas.filter(e => e.status === "RETIRADA");

  return (
    <AppShell titulo="Controle de Entregas">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Controle de Entregas</h2>
            <p className="text-slate-500 text-sm mt-0.5">
              {pendentes.length} aguardando retirada · {retiradas.length} retirada(s)
            </p>
          </div>
          {perfil === "PORTEIRO" && (
            <Link href="/entregas/registrar">
              <Button className="bg-indigo-600 hover:bg-indigo-700 gap-2 shadow-sm shadow-indigo-600/20">
                <Plus className="w-4 h-4" /> Registrar Entrega
              </Button>
            </Link>
          )}
        </div>

        {entregas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center mb-4">
              <PackageOpen className="w-8 h-8 text-orange-400" />
            </div>
            <h3 className="font-semibold text-slate-700 mb-1">Nenhuma entrega</h3>
            <p className="text-slate-400 text-sm">As encomendas recebidas aparecerão aqui.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Pendentes */}
            {pendentes.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-bold text-orange-600 uppercase tracking-widest">Aguardando Retirada</p>
                {pendentes.map(e => (
                  <div key={e.id} className="bg-white border border-orange-100 rounded-xl p-4 flex items-center gap-4 shadow-sm">
                    <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
                      <Package className="w-4 h-4 text-orange-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 text-sm">{e.descricao}</p>
                      {e.remetente && <p className="text-xs text-slate-400">De: {e.remetente}</p>}
                      <p className="text-xs text-slate-400 mt-0.5">
                        Para: {e.morador.name}{e.morador.apartamento && ` — Apt ${e.morador.apartamento}${e.morador.bloco ? `-${e.morador.bloco}` : ""}`}
                      </p>
                      <p className="text-xs text-slate-400">
                        Recebida em {new Date(e.recebidaEm).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => confirmarRetirada(e.id)}
                      className="bg-emerald-600 hover:bg-emerald-700 gap-1.5 text-xs flex-shrink-0"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Confirmar Retirada
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Retiradas */}
            {retiradas.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Histórico — Retiradas</p>
                {retiradas.map(e => (
                  <div key={e.id} className="bg-white border border-slate-100 rounded-xl p-4 flex items-center gap-4 opacity-70">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-600 text-sm">{e.descricao}</p>
                      {e.remetente && <p className="text-xs text-slate-400">De: {e.remetente}</p>}
                      <p className="text-xs text-slate-400 mt-0.5">
                        Para: {e.morador.name}{e.morador.apartamento && ` — Apt ${e.morador.apartamento}`}
                      </p>
                      {e.retiradaEm && (
                        <p className="text-xs text-emerald-500 font-medium">
                          Retirada em {new Date(e.retiradaEm).toLocaleDateString("pt-BR")}
                        </p>
                      )}
                    </div>
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full flex-shrink-0">
                      Retirada
                    </span>
                  </div>
                ))}
              </div>
            )}
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

  const entregas = await prisma.entrega.findMany({
    where: { ...(perfil === "MORADOR" ? { moradorId: userId } : { porteiro: { condoId } }) },
    include: {
      morador: { select: { name: true, apartamento: true, bloco: true } },
      porteiro: { select: { name: true } },
    },
    orderBy: { recebidaEm: "desc" },
  });

  return {
    props: {
      perfil,
      entregas: entregas.map(e => ({
        ...e,
        recebidaEm: e.recebidaEm.toISOString(),
        retiradaEm: e.retiradaEm?.toISOString() ?? null,
      })),
    },
  };
};
