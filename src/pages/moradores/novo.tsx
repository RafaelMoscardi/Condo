import { useState } from "react";
import { useRouter } from "next/router";
import { GetServerSideProps } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import AppShell from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, User, Mail, KeyRound, Home, Hash } from "lucide-react";
import Link from "next/link";

export default function NovoCadastro() {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [perfil, setPerfil] = useState("MORADOR");
  const [apartamento, setApartamento] = useState("");
  const [bloco, setBloco] = useState("");
  const [salvando, setSalvando] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !email.trim() || !senha.trim()) {
      toast.error("Preencha nome, e-mail e senha");
      return;
    }
    if (senha.length < 6) {
      toast.error("A senha deve ter no mínimo 6 caracteres");
      return;
    }

    setSalvando(true);
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: nome, email, password: senha, perfil, apartamento, bloco }),
    });
    setSalvando(false);

    if (res.ok) {
      toast.success("Usuário cadastrado com sucesso!");
      router.push("/moradores");
    } else {
      const data = await res.json();
      toast.error(data.erro ?? "Erro ao cadastrar usuário");
    }
  };

  const isMorador = perfil === "MORADOR";

  return (
    <AppShell titulo="Novo Usuário">
      <div className="max-w-lg space-y-5">
        <Link href="/moradores" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Voltar
        </Link>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h2 className="font-bold text-slate-900 text-lg mb-5">Cadastrar Novo Usuário</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nome */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-700">Nome completo *</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: João da Silva"
                  className="pl-9 h-10 border-slate-200"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-700">E-mail *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="joao@email.com"
                  className="pl-9 h-10 border-slate-200"
                  required
                />
              </div>
            </div>

            {/* Senha */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-700">Senha * (mín. 6 caracteres)</Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••••"
                  className="pl-9 h-10 border-slate-200"
                  required
                />
              </div>
            </div>

            {/* Perfil */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-700">Perfil *</Label>
              <Select value={perfil} onValueChange={(v) => v && setPerfil(v)}>
                <SelectTrigger className="h-10 border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MORADOR">Morador</SelectItem>
                  <SelectItem value="PORTEIRO">Porteiro</SelectItem>
                  <SelectItem value="ADMINISTRADORA">Administradora</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Apartamento + Bloco — visível para MORADOR */}
            {isMorador && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-slate-700">Apartamento</Label>
                  <div className="relative">
                    <Home className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      value={apartamento}
                      onChange={(e) => setApartamento(e.target.value)}
                      placeholder="Ex: 101"
                      className="pl-9 h-10 border-slate-200"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-slate-700">Bloco</Label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      value={bloco}
                      onChange={(e) => setBloco(e.target.value)}
                      placeholder="Ex: A"
                      className="pl-9 h-10 border-slate-200"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="pt-2 flex gap-2">
              <Button
                type="submit"
                disabled={salvando}
                className="bg-indigo-600 hover:bg-indigo-700 gap-2 flex-1"
              >
                {salvando
                  ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : "Cadastrar Usuário"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.push("/moradores")}>
                Cancelar
              </Button>
            </div>
          </form>
        </div>

        <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
          <p className="text-xs text-slate-500">
            <span className="font-semibold">Senha inicial:</span> o usuário receberá a senha definida aqui e poderá utilizá-la para o primeiro acesso. Troca de senha está disponível futuramente.
          </p>
        </div>
      </div>
    </AppShell>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);
  if (!session) return { redirect: { destination: "/login", permanent: false } };
  if (session.user.perfil !== "SINDICO") return { redirect: { destination: "/dashboard", permanent: false } };
  return { props: {} };
};
