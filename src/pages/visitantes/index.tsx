import { GetServerSideProps } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { useRouter } from "next/router";
import AppShell from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Plus, Users, UserCheck, CalendarDays, LogIn } from "lucide-react";

interface Autorizacao {
  id: string;
  nomeVisitante: string;
  documento: string | null;
  dataValida: string;
  observacoes: string | null;
  morador: { name: string; apartamento: string | null; bloco: string | null };
}

interface Props { autorizacoes: Autorizacao[]; perfil: string; }

export default function Visitantes({ autorizacoes, perfil }: Props) {
  const router = useRouter();
  const isPorteiro = perfil === "PORTEIRO";

  const registrarEntrada = async (autorizacaoId: string) => {
    const res = await fetch("/api/visitantes/visitas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ autorizacaoId }),
    });
    if (res.ok) { toast.success("Entrada registrada!"); router.replace(router.asPath); }
    else { const err = await res.json(); toast.error(err.erro ?? "Erro ao registrar"); }
  };

  return (
    <AppShell titulo={isPorteiro ? "Visitantes — Hoje" : "Visitantes Autorizados"}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {isPorteiro ? "Visitantes de Hoje" : "Visitantes Autorizados"}
            </h2>
            <p className="text-slate-500 text-sm mt-0.5">
              {isPorteiro ? `${autorizacoes.length} autorização(ões) para hoje` : `${autorizacoes.length} autorização(ões) ativa(s)`}
            </p>
          </div>
          {perfil === "MORADOR" && (
            <Link href="/visitantes/autorizar">
              <Button className="bg-indigo-600 hover:bg-indigo-700 gap-2 shadow-sm shadow-indigo-600/20">
                <Plus className="w-4 h-4" /> Autorizar Visitante
              </Button>
            </Link>
          )}
        </div>

        {autorizacoes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-emerald-400" />
            </div>
            <h3 className="font-semibold text-slate-700 mb-1">
              {isPorteiro ? "Nenhum visitante esperado hoje" : "Nenhuma autorização criada"}
            </h3>
            <p className="text-slate-400 text-sm">
              {isPorteiro ? "Confira novamente mais tarde." : "Autorize visitantes para o condomínio."}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {autorizacoes.map((a) => (
              <div key={a.id} className="bg-white border border-slate-100 rounded-xl p-4 hover:shadow-sm transition-all flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 text-sm">{a.nomeVisitante}</p>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-400">
                    {a.documento && <span>Doc: {a.documento}</span>}
                    <span className="flex items-center gap-1">
                      <CalendarDays className="w-3 h-3" />
                      {new Date(a.dataValida).toLocaleDateString("pt-BR", { timeZone: "UTC", weekday: "short", day: "2-digit", month: "short" })}
                    </span>
                  </div>
                  {isPorteiro && (
                    <p className="text-xs text-slate-400 mt-0.5">
                      {a.morador.name}{a.morador.apartamento && ` — Apt ${a.morador.apartamento}${a.morador.bloco ? `-${a.morador.bloco}` : ""}`}
                    </p>
                  )}
                  {a.observacoes && <p className="text-xs text-slate-400 mt-0.5 truncate">{a.observacoes}</p>}
                </div>
                {isPorteiro && (
                  <Button
                    size="sm"
                    onClick={() => registrarEntrada(a.id)}
                    className="bg-emerald-600 hover:bg-emerald-700 gap-1.5 text-xs flex-shrink-0"
                  >
                    <LogIn className="w-3.5 h-3.5" /> Registrar Entrada
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);
  if (!session) return { redirect: { destination: "/login", permanent: false } };
  const { perfil, condoId, id: userId } = session.user;
  if (!["MORADOR","PORTEIRO"].includes(perfil)) return { redirect: { destination: "/dashboard", permanent: false } };

  const { prisma } = await import("@/lib/prisma");
  const hoje = new Date(); hoje.setHours(0,0,0,0);
  const amanha = new Date(hoje); amanha.setDate(amanha.getDate()+1);

  const autorizacoes = await prisma.autorizacaoVisitante.findMany({
    where: {
      ativa: true,
      ...(perfil === "PORTEIRO"
        ? { dataValida: { gte: hoje, lt: amanha }, morador: { condoId } }
        : { moradorId: userId }),
    },
    include: { morador: { select: { name: true, apartamento: true, bloco: true } } },
    orderBy: { dataValida: "asc" },
  });

  return {
    props: {
      perfil,
      autorizacoes: autorizacoes.map(a => ({ ...a, dataValida: a.dataValida.toISOString(), criadaEm: a.criadaEm.toISOString() })),
    },
  };
};
