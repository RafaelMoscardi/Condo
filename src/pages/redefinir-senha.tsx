import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { GetServerSideProps } from "next";
import { Building2, KeyRound, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props { token: string; valido: boolean }

export default function RedefinirSenha({ token, valido }: Props) {
  const router = useRouter();
  const [senha, setSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState(false);

  if (!valido) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl border border-slate-100 shadow-sm p-8 text-center space-y-4">
          <div className="w-14 h-14 bg-rose-100 rounded-full flex items-center justify-center mx-auto">
            <KeyRound className="w-7 h-7 text-rose-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Link inválido ou expirado</h2>
          <p className="text-slate-500 text-sm">Este link de redefinição não é mais válido. Solicite um novo.</p>
          <Link href="/esqueci-senha">
            <Button className="bg-indigo-600 hover:bg-indigo-700">Solicitar novo link</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (sucesso) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl border border-slate-100 shadow-sm p-8 text-center space-y-4">
          <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-7 h-7 text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Senha redefinida!</h2>
          <p className="text-slate-500 text-sm">Sua senha foi atualizada com sucesso.</p>
          <Button onClick={() => router.push("/login")} className="bg-indigo-600 hover:bg-indigo-700">
            Ir para o login
          </Button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    if (senha !== confirmar) { setErro("As senhas não coincidem"); return; }
    if (senha.length < 6) { setErro("Senha deve ter no mínimo 6 caracteres"); return; }

    setCarregando(true);
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, senha }),
    });
    setCarregando(false);

    if (res.ok) {
      setSucesso(true);
    } else {
      const data = await res.json();
      setErro(data.erro ?? "Erro ao redefinir senha");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-slate-800 text-lg">Condomínio</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900">Nova senha</h2>
            <p className="text-slate-500 text-sm mt-1">Crie uma nova senha para sua conta.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-700">Nova senha</Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="mín. 6 caracteres"
                  className="pl-10 h-11"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-700">Confirmar nova senha</Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  type="password"
                  value={confirmar}
                  onChange={(e) => setConfirmar(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10 h-11"
                  required
                />
              </div>
            </div>

            {erro && (
              <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-100 rounded-lg">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-500 flex-shrink-0" />
                <p className="text-sm text-rose-600">{erro}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={carregando}
              className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 gap-2"
            >
              {carregando ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : "Salvar nova senha"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const token = (context.query.token as string) ?? "";
  if (!token) return { props: { token: "", valido: false } };

  const { prisma } = await import("@/lib/prisma");
  const registro = await prisma.passwordResetToken.findUnique({ where: { token } });
  const valido = !!registro && registro.expiraEm > new Date();

  return { props: { token, valido } };
};
