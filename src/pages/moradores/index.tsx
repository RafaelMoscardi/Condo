import { GetServerSideProps } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";
import { Plus, Users, Building2, UserCheck, Briefcase, CheckCircle, XCircle, Clock } from "lucide-react";

const PERFIL_CONFIG: Record<string, { label: string; cor: string; bg: string; Icon: React.ElementType }> = {
  MORADOR:        { label: "Morador",        cor: "text-indigo-700",  bg: "bg-indigo-50 border-indigo-200",  Icon: Building2 },
  PORTEIRO:       { label: "Porteiro",       cor: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", Icon: UserCheck },
  ADMINISTRADORA: { label: "Administradora", cor: "text-violet-700",  bg: "bg-violet-50 border-violet-200",  Icon: Briefcase },
  SINDICO:        { label: "Síndico",        cor: "text-amber-700",   bg: "bg-amber-50 border-amber-200",    Icon: Users },
};

interface Usuario {
  id: string;
  name: string;
  email: string;
  perfil: string;
  apartamento: string | null;
  bloco: string | null;
  ativo: boolean;
}

interface Props { usuarios: Usuario[] }

export default function Moradores({ usuarios }: Props) {
  const router = useRouter();
  const [confirm, setConfirm] = useState<{ message: string; title: string; onConfirm: () => void } | null>(null);

  const pendentes = usuarios.filter(u => !u.ativo);
  const ativos = usuarios.filter(u => u.ativo);
  const porPerfil = (p: string) => ativos.filter(u => u.perfil === p);

  const patch = async (id: string, body: object) => {
    const res = await fetch(`/api/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      router.replace(router.asPath);
    } else {
      const err = await res.json();
      toast.error(err.erro ?? "Erro");
    }
  };

  const aprovar = (u: Usuario) => {
    toast.promise(patch(u.id, { ativo: true }), {
      loading: "Aprovando...",
      success: `${u.name} aprovado!`,
      error: "Erro ao aprovar",
    });
  };

  const rejeitar = (u: Usuario) => {
    setConfirm({
      title: "Remover cadastro",
      message: `Remover o cadastro de ${u.name}? Esta ação não pode ser desfeita.`,
      onConfirm: async () => {
        const res = await fetch(`/api/users/${u.id}`, { method: "DELETE" });
        if (res.ok) {
          toast.success("Cadastro removido");
          router.replace(router.asPath);
        } else {
          toast.error("Erro ao remover");
        }
        setConfirm(null);
      },
    });
  };

  const toggleAtivo = (u: Usuario) => {
    const acao = u.ativo ? "Desativar" : "Reativar";
    setConfirm({
      title: `${acao} acesso`,
      message: `${acao} o acesso de ${u.name}?`,
      onConfirm: () => {
        toast.promise(patch(u.id, { ativo: !u.ativo }), {
          loading: `${acao}ndo...`,
          success: `Acesso ${u.ativo ? "desativado" : "reativado"}!`,
          error: "Erro",
        });
        setConfirm(null);
      },
    });
  };

  return (
    <AppShell titulo="Moradores">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Gestão de Usuários</h2>
            <p className="text-slate-500 text-sm mt-0.5">{ativos.length} ativo(s) · {pendentes.length} pendente(s)</p>
          </div>
          <Link href="/moradores/novo">
            <Button className="bg-indigo-600 hover:bg-indigo-700 gap-2 shadow-sm shadow-indigo-600/20">
              <Plus className="w-4 h-4" /> Novo Usuário
            </Button>
          </Link>
        </div>

        {/* Pendentes de aprovação */}
        {pendentes.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              <p className="text-xs font-bold uppercase tracking-widest text-amber-700">
                Aguardando aprovação ({pendentes.length})
              </p>
            </div>
            <div className="grid gap-2">
              {pendentes.map((u) => (
                <div
                  key={u.id}
                  className="bg-white border border-amber-100 rounded-xl px-4 py-3 flex items-center gap-4"
                >
                  <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-amber-600">{u.name[0]?.toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 text-sm">{u.name}</p>
                    <p className="text-xs text-slate-400 truncate">{u.email}</p>
                    {(u.apartamento || u.bloco) && (
                      <p className="text-xs text-slate-400">
                        {[u.bloco && `Bloco ${u.bloco}`, u.apartamento && `Apt ${u.apartamento}`].filter(Boolean).join(" · ")}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => aprovar(u)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> Aprovar
                    </button>
                    <button
                      onClick={() => rejeitar(u)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Recusar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ativos */}
        {ativos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-indigo-400" />
            </div>
            <h3 className="font-semibold text-slate-700 mb-1">Nenhum usuário ativo</h3>
            <p className="text-slate-400 text-sm">Cadastre ou aprove moradores, porteiros e administradoras.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {["MORADOR", "PORTEIRO", "ADMINISTRADORA", "SINDICO"].map((perfil) => {
              const grupo = porPerfil(perfil);
              if (grupo.length === 0) return null;
              const cfg = PERFIL_CONFIG[perfil];
              const Icon = cfg.Icon;
              return (
                <div key={perfil}>
                  <div className="flex items-center gap-2 mb-3">
                    <Icon className={`w-4 h-4 ${cfg.cor}`} />
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                      {cfg.label}s ({grupo.length})
                    </p>
                  </div>
                  <div className="grid gap-2">
                    {grupo.map((u) => (
                      <div
                        key={u.id}
                        className="bg-white border border-slate-100 rounded-xl px-4 py-3 flex items-center gap-4 hover:shadow-sm transition-all"
                      >
                        <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold text-slate-500">{u.name[0]?.toUpperCase()}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-800 text-sm">{u.name}</p>
                          <p className="text-xs text-slate-400 truncate">{u.email}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {u.apartamento && (
                            <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                              Apt {u.apartamento}{u.bloco ? `-${u.bloco}` : ""}
                            </span>
                          )}
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${cfg.bg} ${cfg.cor}`}>
                            {cfg.label}
                          </span>
                          {perfil !== "SINDICO" && (
                            <button
                              onClick={() => toggleAtivo(u)}
                              className="text-xs text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-2.5 py-1 rounded-full transition-colors"
                            >
                              Desativar
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirm !== null}
        title={confirm?.title ?? "Confirmar"}
        message={confirm?.message ?? ""}
        confirmLabel="Confirmar"
        onConfirm={() => confirm?.onConfirm()}
        onCancel={() => setConfirm(null)}
      />
    </AppShell>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);
  if (!session) return { redirect: { destination: "/login", permanent: false } };
  if (session.user.perfil !== "SINDICO") return { redirect: { destination: "/dashboard", permanent: false } };

  const { prisma } = await import("@/lib/prisma");
  const usuarios = await prisma.user.findMany({
    where: { condoId: session.user.condoId },
    select: { id: true, name: true, email: true, perfil: true, apartamento: true, bloco: true, ativo: true },
    orderBy: [{ ativo: "desc" }, { perfil: "asc" }, { bloco: "asc" }, { apartamento: "asc" }],
  });

  return { props: { usuarios } };
};
