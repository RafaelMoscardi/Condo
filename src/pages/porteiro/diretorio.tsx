import { GetServerSideProps } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import AppShell from "@/components/layout/AppShell";
import { Phone, Package, Building2, Search } from "lucide-react";
import { useState } from "react";

interface EntregaPendente {
  id: string;
  descricao: string;
  remetente: string | null;
  recebidaEm: string;
}

interface Morador {
  id: string;
  name: string;
  apartamento: string | null;
  bloco: string | null;
  telefone: string | null;
  fotoUrl: string | null;
  entregas: EntregaPendente[];
}

interface Props { moradores: Morador[] }

export default function DiretorioPorteiro({ moradores }: Props) {
  const [busca, setBusca] = useState("");

  const filtrados = moradores.filter((m) => {
    const q = busca.toLowerCase();
    return (
      m.name.toLowerCase().includes(q) ||
      (m.apartamento ?? "").toLowerCase().includes(q) ||
      (m.bloco ?? "").toLowerCase().includes(q) ||
      (m.telefone ?? "").includes(q)
    );
  });

  const totalEntregas = moradores.reduce((acc, m) => acc + m.entregas.length, 0);

  return (
    <AppShell titulo="Diretório de Moradores">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-xl font-bold text-slate-900">Diretório de Moradores</h2>
          <p className="text-slate-500 text-sm mt-0.5">
            {moradores.length} morador(es) · {totalEntregas} entrega(s) aguardando retirada
          </p>
        </div>

        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nome, apartamento, bloco ou telefone..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/10"
          />
        </div>

        {/* Lista */}
        {filtrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
              <Building2 className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-slate-500 font-medium">Nenhum morador encontrado</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtrados.map((m) => (
              <div
                key={m.id}
                className="bg-white border border-slate-100 rounded-xl p-4 space-y-3 hover:shadow-sm transition-all"
              >
                {/* Identidade */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {m.fotoUrl ? (
                      <img src={m.fotoUrl} alt={m.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm font-bold text-indigo-600">
                        {m.name[0]?.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 text-sm truncate">{m.name}</p>
                    {(m.bloco || m.apartamento) && (
                      <p className="text-xs text-slate-400">
                        {[m.bloco && `Bloco ${m.bloco}`, m.apartamento && `Apt ${m.apartamento}`]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    )}
                  </div>
                </div>

                {/* Telefone */}
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  {m.telefone ? (
                    <a
                      href={`tel:${m.telefone.replace(/\D/g, "")}`}
                      className="text-indigo-600 hover:underline font-medium"
                    >
                      {m.telefone}
                    </a>
                  ) : (
                    <span className="text-slate-400 italic">Não informado</span>
                  )}
                </div>

                {/* Entregas pendentes */}
                {m.entregas.length > 0 && (
                  <div className="border-t border-slate-50 pt-3 space-y-2">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Entregas aguardando ({m.entregas.length})
                    </p>
                    {m.entregas.map((e) => (
                      <div
                        key={e.id}
                        className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2"
                      >
                        <Package className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-amber-700 font-mono">
                              #{e.id.slice(-6).toUpperCase()}
                            </span>
                            <span className="text-xs text-slate-400">
                              {new Date(e.recebidaEm).toLocaleDateString("pt-BR")}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 truncate">{e.descricao}</p>
                          {e.remetente && (
                            <p className="text-xs text-slate-400 truncate">de: {e.remetente}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
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
  if (!["PORTEIRO", "SINDICO"].includes(session.user.perfil)) {
    return { redirect: { destination: "/dashboard", permanent: false } };
  }

  const { prisma } = await import("@/lib/prisma");

  const moradores = await prisma.user.findMany({
    where: { condoId: session.user.condoId, perfil: "MORADOR", ativo: true },
    select: {
      id: true,
      name: true,
      apartamento: true,
      bloco: true,
      telefone: true,
      fotoUrl: true,
      entregasRecebidas: {
        where: { status: "AGUARDANDO_RETIRADA" },
        select: { id: true, descricao: true, remetente: true, recebidaEm: true },
        orderBy: { recebidaEm: "asc" },
      },
    },
    orderBy: [{ bloco: "asc" }, { apartamento: "asc" }, { name: "asc" }],
  });

  return {
    props: {
      moradores: moradores.map((m) => ({
        id: m.id,
        name: m.name,
        apartamento: m.apartamento,
        bloco: m.bloco,
        telefone: m.telefone,
        fotoUrl: m.fotoUrl,
        entregas: m.entregasRecebidas.map((e) => ({
          id: e.id,
          descricao: e.descricao,
          remetente: e.remetente,
          recebidaEm: e.recebidaEm.toISOString(),
        })),
      })),
    },
  };
};
