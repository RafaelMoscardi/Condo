import { useState, useRef } from "react";
import { GetServerSideProps } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { useRouter } from "next/router";
import AppShell from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, X, Save, KeyRound, User, Phone, CreditCard, Home, Bike } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

function maskCPF(v: string) {
  return v.replace(/\D/g, "").slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function maskTel(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

interface Props {
  usuario: {
    id: string;
    name: string;
    email: string;
    perfil: string;
    apartamento: string | null;
    bloco: string | null;
    cpf: string | null;
    telefone: string | null;
    codigoIfood: string | null;
    fotoUrl: string | null;
  };
}

export default function PerfilPage({ usuario }: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(usuario.name);
  const [apartamento, setApartamento] = useState(usuario.apartamento ?? "");
  const [bloco, setBloco] = useState(usuario.bloco ?? "");
  const [cpf, setCpf] = useState(usuario.cpf ?? "");
  const [telefone, setTelefone] = useState(usuario.telefone ?? "");
  const [codigoIfood, setCodigoIfood] = useState(usuario.codigoIfood ?? "");
  const [naoTemIfood, setNaoTemIfood] = useState(!usuario.codigoIfood);
  const [preview, setPreview] = useState<string | null>(usuario.fotoUrl ?? null);
  const [fotoFile, setFotoFile] = useState<File | null>(null);

  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");

  const [salvando, setSalvando] = useState(false);

  const handleFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFotoFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const removerFoto = () => {
    setFotoFile(null);
    setPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (novaSenha && novaSenha !== confirmar) {
      toast.error("Nova senha e confirmação não coincidem");
      return;
    }

    const fd = new FormData();
    fd.append("name", name);
    fd.append("apartamento", apartamento);
    fd.append("bloco", bloco);
    fd.append("cpf", cpf);
    fd.append("telefone", telefone);
    if (!naoTemIfood && codigoIfood.trim()) fd.append("codigoIfood", codigoIfood.trim());
    fd.append("naoTemIfood", String(naoTemIfood));
    if (senhaAtual) fd.append("senhaAtual", senhaAtual);
    if (novaSenha) fd.append("novaSenha", novaSenha);
    if (fotoFile) fd.append("foto", fotoFile);

    setSalvando(true);
    const res = await fetch("/api/perfil", { method: "PATCH", body: fd });
    setSalvando(false);

    if (res.ok) {
      toast.success("Perfil atualizado!");
      setSenhaAtual("");
      setNovaSenha("");
      setConfirmar("");
      router.replace(router.asPath);
    } else {
      const err = await res.json();
      toast.error(err.erro ?? "Erro ao salvar");
    }
  };

  return (
    <AppShell titulo="Meu Perfil">
      <div className="max-w-2xl space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Meu Perfil</h2>
          <p className="text-slate-500 text-sm mt-0.5">{usuario.email}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Foto */}
          <div className="bg-white border border-slate-100 rounded-xl p-5 space-y-4">
            <p className="text-sm font-semibold text-slate-700">Foto de Perfil</p>
            <div className="flex items-center gap-5">
              <div className="relative w-20 h-20 flex-shrink-0">
                <div className="w-20 h-20 rounded-full bg-indigo-50 border-2 border-indigo-100 overflow-hidden flex items-center justify-center">
                  {preview ? (
                    <img src={preview} alt="Foto" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-bold text-indigo-400">
                      {name[0]?.toUpperCase()}
                    </span>
                  )}
                </div>
                {preview && (
                  <button
                    type="button"
                    onClick={removerFoto}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center shadow"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                )}
              </div>
              <div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileRef.current?.click()}
                  className="gap-2"
                >
                  <Camera className="w-4 h-4" /> Alterar foto
                </Button>
                <p className="text-xs text-slate-400 mt-1.5">JPG, PNG — máx. 5 MB</p>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFoto} />
              </div>
            </div>
          </div>

          {/* Dados pessoais */}
          <div className="bg-white border border-slate-100 rounded-xl p-5 space-y-4">
            <p className="text-sm font-semibold text-slate-700">Dados Pessoais</p>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-600">Nome completo</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-600">Bloco</Label>
                <div className="relative">
                  <Home className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    value={bloco}
                    onChange={(e) => setBloco(e.target.value)}
                    placeholder="Ex: A"
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-600">Apartamento</Label>
                <div className="relative">
                  <Home className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    value={apartamento}
                    onChange={(e) => setApartamento(e.target.value)}
                    placeholder="Ex: 101"
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-600">CPF</Label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  value={cpf}
                  onChange={(e) => setCpf(maskCPF(e.target.value))}
                  placeholder="000.000.000-00"
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-600">Telefone com DDD</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  value={telefone}
                  onChange={(e) => setTelefone(maskTel(e.target.value))}
                  placeholder="(11) 99999-9999"
                  className="pl-10"
                />
              </div>
            </div>

            {/* Código iFood */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-600 flex items-center gap-1.5">
                <Bike className="w-3.5 h-3.5 text-rose-500" />
                Código iFood
              </Label>
              <p className="text-xs text-slate-400">
                Últimos 4 dígitos do celular no iFood — usado pelo porteiro para confirmar retirada.
              </p>
              {!naoTemIfood && (
                <div className="relative">
                  <Bike className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    value={codigoIfood}
                    onChange={(e) => setCodigoIfood(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    placeholder="0000"
                    maxLength={4}
                    className="pl-10 font-mono tracking-widest text-base"
                  />
                </div>
              )}
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
          </div>

          {/* Alterar senha */}
          <div className="bg-white border border-slate-100 rounded-xl p-5 space-y-4">
            <p className="text-sm font-semibold text-slate-700">Alterar Senha</p>
            <p className="text-xs text-slate-400">Deixe em branco para manter a senha atual.</p>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-600">Senha atual</Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  type="password"
                  value={senhaAtual}
                  onChange={(e) => setSenhaAtual(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-600">Nova senha</Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    type="password"
                    value={novaSenha}
                    onChange={(e) => setNovaSenha(e.target.value)}
                    placeholder="mín. 6 caracteres"
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-600">Confirmar nova senha</Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    type="password"
                    value={confirmar}
                    onChange={(e) => setConfirmar(e.target.value)}
                    placeholder="••••••••"
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </div>

          <Button
            type="submit"
            disabled={salvando}
            className="bg-indigo-600 hover:bg-indigo-700 gap-2 shadow-sm shadow-indigo-600/20"
          >
            <Save className="w-4 h-4" />
            {salvando ? "Salvando..." : "Salvar alterações"}
          </Button>
        </form>
      </div>
    </AppShell>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);
  if (!session) return { redirect: { destination: "/login", permanent: false } };

  const { prisma } = await import("@/lib/prisma");
  const usuario = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      perfil: true,
      apartamento: true,
      bloco: true,
      cpf: true,
      telefone: true,
      codigoIfood: true,
      fotoUrl: true,
    },
  });

  if (!usuario) return { redirect: { destination: "/login", permanent: false } };

  return { props: { usuario } };
};
