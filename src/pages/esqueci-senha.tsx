import { useState } from "react";
import Link from "next/link";
import { Building2, Mail, ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function EsqueciSenha() {
  const [email, setEmail] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    setCarregando(true);
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setCarregando(false);
    if (res.ok) {
      setEnviado(true);
    } else {
      const data = await res.json();
      setErro(data.erro ?? "Erro ao enviar email");
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
          {enviado ? (
            <div className="text-center space-y-4">
              <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                <Mail className="w-7 h-7 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Email enviado!</h2>
                <p className="text-slate-500 text-sm mt-2">
                  Se <strong>{email}</strong> estiver cadastrado, você receberá um link para redefinir a senha. Verifique também a caixa de spam.
                </p>
              </div>
              <Link href="/login">
                <Button variant="outline" className="gap-2 mt-2">
                  <ArrowLeft className="w-4 h-4" /> Voltar ao login
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-bold text-slate-900">Esqueci minha senha</h2>
                <p className="text-slate-500 text-sm mt-1">Informe seu e-mail e enviaremos um link para redefinir a senha.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-slate-700">E-mail</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@email.com"
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
                  ) : (
                    <>Enviar link <ArrowRight className="w-4 h-4" /></>
                  )}
                </Button>

                <Link href="/login" className="flex items-center justify-center gap-1.5 text-sm text-slate-400 hover:text-slate-600">
                  <ArrowLeft className="w-3.5 h-3.5" /> Voltar ao login
                </Link>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
