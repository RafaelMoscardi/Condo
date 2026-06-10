import { useState, useRef } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/router";
import { GetServerSideProps } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, ArrowRight, KeyRound, Mail, User, Phone, CreditCard, Home, Camera, X, Bike } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function maskCPF(v: string) {
  return v.replace(/\D/g, "").slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function maskTel(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0,2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`;
  return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
}

function validarCPF(cpf: string): boolean {
  const d = cpf.replace(/\D/g, "");
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(d[i]) * (10 - i);
  let r = (sum * 10) % 11;
  if (r === 10 || r === 11) r = 0;
  if (r !== parseInt(d[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(d[i]) * (11 - i);
  r = (sum * 10) % 11;
  if (r === 10 || r === 11) r = 0;
  return r === parseInt(d[10]);
}

// ─── Login form ───────────────────────────────────────────────────────────────

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function LoginForm({ erroInicial }: { erroInicial?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [erro, setErro] = useState(erroInicial ?? "");
  const [carregando, setCarregando] = useState(false);
  const [carregandoGoogle, setCarregandoGoogle] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    setCarregando(true);
    const resultado = await signIn("credentials", { email, password, redirect: false });
    setCarregando(false);
    if (resultado?.error) setErro("E-mail ou senha incorretos.");
    else router.push("/dashboard");
  };

  const handleGoogle = async () => {
    setCarregandoGoogle(true);
    await signIn("google", { callbackUrl: "/dashboard" });
  };

  return (
    <div className="space-y-5">
      {/* Botão Google */}
      <button
        type="button"
        onClick={handleGoogle}
        disabled={carregandoGoogle || carregando}
        className="w-full h-11 flex items-center justify-center gap-3 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 transition-colors text-sm font-semibold text-slate-700 disabled:opacity-50"
      >
        {carregandoGoogle ? (
          <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
        ) : (
          <GoogleIcon />
        )}
        Entrar com Google
      </button>

      {/* Divisor */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-slate-200" />
        <span className="text-xs text-slate-400 font-medium">ou</span>
        <div className="flex-1 h-px bg-slate-200" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="login-email" className="text-sm font-medium text-slate-700">E-mail, CPF ou celular</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              id="login-email"
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="E-mail, CPF ou celular"
              className="pl-10 h-11 border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20 bg-white"
              required
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
          <Label htmlFor="login-senha" className="text-sm font-medium text-slate-700">Senha</Label>
          <Link href="/esqueci-senha" className="text-xs text-indigo-600 hover:underline">Esqueci minha senha</Link>
        </div>
          <div className="relative">
            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              id="login-senha"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="pl-10 h-11 border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20 bg-white"
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
          disabled={carregando || carregandoGoogle}
          className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold gap-2 shadow-md shadow-indigo-600/20"
        >
          {carregando ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>Entrar <ArrowRight className="w-4 h-4" /></>
          )}
        </Button>

        <div className="mt-2 p-4 bg-slate-100 rounded-xl">
          <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Acesso de teste</p>
          <div className="grid grid-cols-2 gap-1.5 text-xs text-slate-600">
            <span className="font-medium">Síndico:</span><span>sindico@condo.com</span>
            <span className="font-medium">Morador:</span><span>morador@condo.com</span>
            <span className="font-medium">Porteiro:</span><span>porteiro@condo.com</span>
            <span className="font-medium">Senha:</span><span className="font-mono font-bold">senha123</span>
          </div>
        </div>
      </form>
    </div>
  );
}

// ─── Cadastro form ────────────────────────────────────────────────────────────

function CadastroForm({ onSucesso }: { onSucesso: () => void }) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [bloco, setBloco] = useState("");
  const [apartamento, setApartamento] = useState("");
  const [cpf, setCpf] = useState("");
  const [telefone, setTelefone] = useState("");
  const [codigoIfood, setCodigoIfood] = useState("");
  const [naoTemIfood, setNaoTemIfood] = useState(false);
  const [foto, setFoto] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  const fotoRef = useRef<HTMLInputElement>(null);

  const handleFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setFoto(file);
    setFotoPreview(file ? URL.createObjectURL(file) : null);
  };

  const clearFoto = () => {
    setFoto(null);
    setFotoPreview(null);
    if (fotoRef.current) fotoRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");

    if (senha !== confirmar) {
      setErro("As senhas não coincidem");
      return;
    }
    if (senha.length < 6) {
      setErro("Senha deve ter no mínimo 6 caracteres");
      return;
    }
    if (!cpf.trim()) {
      setErro("CPF é obrigatório");
      return;
    }
    if (!validarCPF(cpf)) {
      setErro("CPF inválido");
      return;
    }
    if (!naoTemIfood && !codigoIfood.trim()) {
      setErro("Informe seu código iFood ou marque \"Não uso iFood\"");
      return;
    }

    setCarregando(true);
    const fd = new FormData();
    fd.append("name", nome);
    fd.append("email", email);
    fd.append("password", senha);
    if (bloco) fd.append("bloco", bloco);
    if (apartamento) fd.append("apartamento", apartamento);
    fd.append("cpf", cpf);
    if (telefone) fd.append("telefone", telefone);
    if (!naoTemIfood && codigoIfood.trim()) fd.append("codigoIfood", codigoIfood.trim());
    fd.append("naoTemIfood", String(naoTemIfood));
    if (foto) fd.append("foto", foto);

    const res = await fetch("/api/auth/register", { method: "POST", body: fd });
    setCarregando(false);

    if (res.ok) {
      onSucesso();
    } else {
      const data = await res.json();
      setErro(data.erro ?? "Erro ao cadastrar");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Foto de perfil */}
      <div className="flex justify-center">
        <div className="relative">
          {fotoPreview ? (
            <>
              <img
                src={fotoPreview}
                alt="Foto de perfil"
                className="w-20 h-20 rounded-full object-cover border-4 border-indigo-100 shadow"
              />
              <button
                type="button"
                onClick={clearFoto}
                className="absolute -top-1 -right-1 w-6 h-6 bg-slate-700 hover:bg-slate-900 text-white rounded-full flex items-center justify-center shadow"
              >
                <X className="w-3 h-3" />
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => fotoRef.current?.click()}
              className="w-20 h-20 rounded-full bg-slate-100 border-2 border-dashed border-slate-300 hover:border-indigo-400 hover:bg-indigo-50 flex flex-col items-center justify-center gap-1 transition-colors"
            >
              <Camera className="w-5 h-5 text-slate-400" />
              <span className="text-[9px] text-slate-400 font-medium">Foto</span>
            </button>
          )}
          <input ref={fotoRef} type="file" accept="image/*" className="hidden" onChange={handleFoto} />
        </div>
      </div>

      {/* Nome */}
      <div className="space-y-1.5">
        <Label htmlFor="cad-nome" className="text-sm font-medium text-slate-700">Nome completo *</Label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            id="cad-nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Seu nome completo"
            className="pl-10 h-11 border-slate-200 bg-white"
            required
          />
        </div>
      </div>

      {/* E-mail */}
      <div className="space-y-1.5">
        <Label htmlFor="cad-email" className="text-sm font-medium text-slate-700">E-mail *</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            id="cad-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            className="pl-10 h-11 border-slate-200 bg-white"
            required
          />
        </div>
      </div>

      {/* Senha + confirmar */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="cad-senha" className="text-sm font-medium text-slate-700">Senha *</Label>
          <div className="relative">
            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              id="cad-senha"
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="••••••••"
              className="pl-10 h-11 border-slate-200 bg-white"
              required
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cad-conf" className="text-sm font-medium text-slate-700">Confirmar *</Label>
          <div className="relative">
            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              id="cad-conf"
              type="password"
              value={confirmar}
              onChange={(e) => setConfirmar(e.target.value)}
              placeholder="••••••••"
              className="pl-10 h-11 border-slate-200 bg-white"
              required
            />
          </div>
        </div>
      </div>

      {/* Bloco + Apartamento */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="cad-bloco" className="text-sm font-medium text-slate-700">Bloco</Label>
          <div className="relative">
            <Home className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              id="cad-bloco"
              value={bloco}
              onChange={(e) => setBloco(e.target.value)}
              placeholder="Ex: A"
              className="pl-10 h-11 border-slate-200 bg-white"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cad-apto" className="text-sm font-medium text-slate-700">Apartamento</Label>
          <div className="relative">
            <Home className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              id="cad-apto"
              value={apartamento}
              onChange={(e) => setApartamento(e.target.value)}
              placeholder="Ex: 101"
              className="pl-10 h-11 border-slate-200 bg-white"
            />
          </div>
        </div>
      </div>

      {/* CPF */}
      <div className="space-y-1.5">
        <Label htmlFor="cad-cpf" className="text-sm font-medium text-slate-700">CPF <span className="text-rose-500">*</span></Label>
        <div className="relative">
          <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            id="cad-cpf"
            value={cpf}
            onChange={(e) => setCpf(maskCPF(e.target.value))}
            placeholder="000.000.000-00"
            className="pl-10 h-11 border-slate-200 bg-white"
            maxLength={14}
          />
        </div>
      </div>

      {/* Telefone */}
      <div className="space-y-1.5">
        <Label htmlFor="cad-tel" className="text-sm font-medium text-slate-700">Telefone com DDD</Label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            id="cad-tel"
            value={telefone}
            onChange={(e) => setTelefone(maskTel(e.target.value))}
            placeholder="(11) 99999-9999"
            className="pl-10 h-11 border-slate-200 bg-white"
            maxLength={15}
          />
        </div>
      </div>

      {/* Código iFood */}
      <div className="space-y-1.5">
        <Label htmlFor="cad-ifood" className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
          <Bike className="w-3.5 h-3.5 text-rose-500" />
          Código iFood *
        </Label>
        <p className="text-xs text-slate-400 -mt-0.5">
          Últimos 4 dígitos do celular cadastrado no iFood (ex: <span className="font-mono font-semibold">9981</span>)
        </p>
        {!naoTemIfood ? (
          <div className="relative">
            <Bike className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              id="cad-ifood"
              value={codigoIfood}
              onChange={(e) => setCodigoIfood(e.target.value.replace(/\D/g, "").slice(0, 4))}
              placeholder="0000"
              maxLength={4}
              className="pl-10 h-11 border-slate-200 bg-white font-mono tracking-widest text-base"
            />
          </div>
        ) : null}
        <label className="flex items-center gap-2 cursor-pointer select-none group w-fit">
          <div
            onClick={() => { setNaoTemIfood(!naoTemIfood); setCodigoIfood(""); }}
            className={cn(
              "w-4 h-4 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0",
              naoTemIfood
                ? "bg-slate-600 border-slate-600"
                : "border-slate-300 group-hover:border-slate-400"
            )}
          >
            {naoTemIfood && (
              <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2 6l3 3 5-5" />
              </svg>
            )}
          </div>
          <span className="text-xs text-slate-500 group-hover:text-slate-700 transition-colors">
            Não uso iFood / não tenho código
          </span>
        </label>
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
        className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold gap-2 shadow-md shadow-indigo-600/20"
      >
        {carregando ? (
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <>Criar conta <ArrowRight className="w-4 h-4" /></>
        )}
      </Button>
    </form>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function Login() {
  const router = useRouter();
  const [modo, setModo] = useState<"login" | "cadastro">("login");
  const [cadastroOk, setCadastroOk] = useState(false);

  const erroQuery = router.query.erro as string | undefined;
  const erroMensagem = erroQuery === "aguardando_aprovacao"
    ? "Sua conta está aguardando aprovação do síndico."
    : undefined;

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-50 via-slate-50 to-indigo-50/40">
      {/* Painel esquerdo — branding */}
      <div className="hidden lg:flex w-[420px] flex-shrink-0 bg-[#0D1225] flex-col justify-between p-10 relative overflow-hidden">
        {/* Gradient orbs */}
        <div className="absolute top-[-60px] left-[-40px] w-72 h-72 bg-indigo-600/25 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute bottom-[-40px] right-[-60px] w-64 h-64 bg-violet-600/20 rounded-full blur-[70px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-indigo-900/30 rounded-full blur-[60px] pointer-events-none" />

        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-[0.04]">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <div className="relative z-10">
          <div className="relative w-14 h-14 mb-8">
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-900/60">
              <Building2 className="w-7 h-7 text-white" />
            </div>
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-indigo-500/30 to-violet-600/30 blur-md -z-10" />
          </div>
          <h1 className="text-white font-bold text-3xl leading-tight mb-3 tracking-tight">
            Gestão de<br />Condomínio
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            Avisos, reservas, ocorrências, visitantes e entregas — tudo num só lugar.
          </p>
        </div>

        <div className="relative z-10 space-y-2">
          {[
            { label: "Moradores", desc: "Acompanhe tudo do seu apartamento", color: "bg-indigo-500" },
            { label: "Síndico",   desc: "Gerencie o condomínio com facilidade", color: "bg-violet-500" },
            { label: "Portaria",  desc: "Controle de acesso e entregas", color: "bg-emerald-500" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3 p-3.5 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.07] transition-colors">
              <div className={`w-2 h-2 rounded-full ${item.color} flex-shrink-0`} />
              <div>
                <p className="text-white text-xs font-semibold">{item.label}</p>
                <p className="text-slate-500 text-xs mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Painel direito — formulário */}
      <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
        <div className="w-full max-w-md py-4">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/25">
                <Building2 className="w-5 h-5 text-white" />
              </div>
            </div>
            <span className="font-bold text-slate-800 text-lg tracking-tight">Condomínio</span>
          </div>

          {/* Tab toggle */}
          <div className="flex bg-slate-100 rounded-xl p-1 mb-8">
            {(["login", "cadastro"] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setModo(m); setCadastroOk(false); }}
                className={cn(
                  "flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all",
                  modo === m
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                )}
              >
                {m === "login" ? "Entrar" : "Criar conta"}
              </button>
            ))}
          </div>

          {modo === "login" ? (
            <>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-900 mb-1">Bem-vindo de volta</h2>
                <p className="text-slate-500 text-sm">Entre com suas credenciais de acesso</p>
              </div>
              <LoginForm erroInicial={erroMensagem} />
            </>
          ) : cadastroOk ? (
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Cadastro realizado!</h3>
                <p className="text-slate-500 text-sm mt-1">Sua conta foi criada. Aguarde a aprovação do síndico para acessar o sistema.</p>
              </div>
              <Button
                onClick={() => { setModo("login"); setCadastroOk(false); }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white mt-2"
              >
                Ir para o login
              </Button>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-900 mb-1">Criar conta</h2>
                <p className="text-slate-500 text-sm">Preencha seus dados para solicitar acesso</p>
              </div>
              <CadastroForm onSucesso={() => setCadastroOk(true)} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);
  if (session) return { redirect: { destination: "/dashboard", permanent: false } };
  return { props: {} };
};
