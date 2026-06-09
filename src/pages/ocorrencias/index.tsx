import { GetServerSideProps } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import AppShell from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Plus, AlertTriangle, ChevronRight } from "lucide-react";

const TIPOS: Record<string, string> = {
  barulho: "Barulho", vazamento: "Vazamento", iluminacao: "Iluminação",
  seguranca: "Segurança", outro: "Outro",
};

const STATUS_CONFIG: Record<string, { label: string; cor: string; bg: string }> = {
  ABERTA:     { label: "Aberta",      cor: "text-amber-700",  bg: "bg-amber-50 border-amber-200" },
  EM_ANALISE: { label: "Em Análise",  cor: "text-indigo-700", bg: "bg-indigo-50 border-indigo-200" },
  RESOLVIDA:  { label: "Resolvida",   cor: "text-emerald-700",bg: "bg-emerald-50 border-emerald-200" },
  ENCERRADA:  { label: "Encerrada",   cor: "text-slate-500",  bg: "bg-slate-50 border-slate-200" },
};

interface Ocorrencia {
  id: string; tipo: string; descricao: string; status: string; abertaEm: string;
  morador: { name: string; apartamento: string | null; bloco: string | null };
}

interface Props { ocorrencias: Ocorrencia[]; perfil: string; }

export default function Ocorrencias({ ocorrencias, perfil }: Props) {
  const podeAbrir = ["MORADOR", "PORTEIRO"].includes(perfil);

  return (
    <AppShell titulo="Ocorrências">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Ocorrências</h2>
            <p className="text-slate-500 text-sm mt-0.5">{ocorrencias.length} registro(s)</p>
          </div>
          {podeAbrir && (
            <Link href="/ocorrencias/nova">
              <Button className="bg-indigo-600 hover:bg-indigo-700 gap-2 shadow-sm shadow-indigo-600/20">
                <Plus className="w-4 h-4" /> Nova Ocorrência
              </Button>
            </Link>
          )}
        </div>

        {ocorrencias.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8 text-emerald-500" />
            </div>
            <h3 className="font-semibold text-slate-700 mb-1">Nenhuma ocorrência</h3>
            <p className="text-slate-400 text-sm">Tudo em ordem por aqui.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {ocorrencias.map((o) => {
              const sc = STATUS_CONFIG[o.status] ?? STATUS_CONFIG.ENCERRADA;
              return (
                <Link key={o.id} href={`/ocorrencias/${o.id}`}>
                  <div className="bg-white border border-slate-100 rounded-xl p-4 hover:shadow-md hover:border-slate-200 transition-all flex items-center gap-4 cursor-pointer">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-semibold text-slate-800 text-sm">{TIPOS[o.tipo] ?? o.tipo}</span>
                        {o.morador.apartamento && (
                          <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                            Apt {o.morador.apartamento}{o.morador.bloco ? `-${o.morador.bloco}` : ""}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 truncate">{o.descricao}</p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${sc.bg} ${sc.cor}`}>
                        {sc.label}
                      </span>
                      <span className="text-xs text-slate-400 hidden sm:block">
                        {new Date(o.abertaEm).toLocaleDateString("pt-BR")}
                      </span>
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

  const ocorrencias = await prisma.ocorrencia.findMany({
    where: { condoId, ...(perfil === "MORADOR" ? { moradorId: userId } : {}) },
    include: { morador: { select: { name: true, apartamento: true, bloco: true } } },
    orderBy: { abertaEm: "desc" },
  });

  return {
    props: {
      perfil,
      ocorrencias: ocorrencias.map(o => ({ ...o, abertaEm: o.abertaEm.toISOString(), atualizadaEm: o.atualizadaEm.toISOString() })),
    },
  };
};
