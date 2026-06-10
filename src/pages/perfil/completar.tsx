import { useState, useRef } from "react";
import { useRouter } from "next/router";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, Home, Phone, CreditCard, Camera, X, Bike } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function validarCPF(cpf: string): boolean {
  const d = cpf.replace(/\D/g, "");
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(d[i]) * (10 - i);
  let r = (sum * 10) % 11; if (r === 10 || r === 11) r = 0;
  if (r !== parseInt(d[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(d[i]) * (11 - i);
  r = (sum * 10) % 11; if (r === 10 || r === 11) r = 0;
  return r === parseInt(d[10]);
}

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

export default function CompletarPerfil() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [bloco, setBloco] = useState("");
  const [apartamento, setApartamento] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cpf, setCpf] = useState("");
  const [codigoIfood, setCodigoIfood] = useState("");
  const [naoTemIfood, setNaoTemIfood] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [salvando, setSalvando] = useState(false);

  // Redirect away if already complete or not authenticated
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    router.push("/login");
    return null;
  }

  if (session?.user?.perfilCompleto) {
    router.push("/dashboard");
    return null;
  }

  const handleFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFotoFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apartamento.trim()) { toast.error("Apartamento é obrigatório"); return; }
    if (!bloco.trim()) { toast.error("Bloco é obrigatório"); return; }
    if (!telefone.trim()) { toast.error("Telefone é obrigatório"); return; }
    if (!cpf.trim()) { toast.error("CPF é obrigatório"); return; }
    if (!validarCPF(cpf)) { toast.error("CPF inválido"); return; }
    if (!naoTemIfood && !codigoIfood.trim()) { toast.error("Informe o código iFood ou marque que não usa"); return; }

    const fd = new FormData();
    fd.append("name", session?.user?.name ?? "");
    fd.append("apartamento", apartamento.trim());
    fd.append("bloco", bloco.trim());
    fd.append("telefone", telefone);
    fd.append("cpf", cpf.trim());
    fd.append("naoTemIfood", String(naoTemIfood));
    if (!naoTemIfood && codigoIfood.trim()) fd.append("codigoIfood", codigoIfood.trim());
    if (fotoFile) fd.append("foto", fotoFile);

    setSalvando(true);
    const res = await fetch("/api/perfil", { method: "PATCH", body: fd });
    setSalvando(false);

    if (res.ok) {
      // Force session refresh so perfilCompleto updates
      await update();
      router.push("/dashboard");
    } else {
      const err = await res.json();
      toast.error(err.erro ?? "Erro ao salvar");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-slate-800">Condomínio</p>
            <p className="text-xs text-slate-400">Olá, {session?.user?.name?.split(" ")[0]}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900">Complete seu cadastro</h2>
            <p className="text-slate-500 text-sm mt-1">
              Precisamos de mais algumas informações para liberar seu acesso.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Foto */}
            <div className="flex justify-center">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-indigo-50 border-2 border-indigo-100 overflow-hidden flex items-center justify-center">
                  {preview ? (
                    <img src={preview} alt="Foto" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-bold text-indigo-400">
                      {session?.user?.name?.[0]?.toUpperCase()}
                    </span>
                  )}
                </div>
                {preview && (
                  <button
                    type="button"
                    onClick={() => { setFotoFile(null); setPreview(null); }}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center shadow"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="absolute -bottom-1 -right-1 w-7 h-7 bg-indigo-600 rounded-full flex items-center justify-center shadow"
                >
                  <Camera className="w-3.5 h-3.5 text-white" />
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFoto} />
              </div>
            </div>

            {/* Bloco + Apartamento */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-600">
                  Bloco <span className="text-rose-500">*</span>
                </Label>
                <div className="relative">
                  <Home className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    value={bloco}
                    onChange={(e) => setBloco(e.target.value)}
                    placeholder="Ex: A"
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-600">
                  Apartamento <span className="text-rose-500">*</span>
                </Label>
                <div className="relative">
                  <Home className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    value={apartamento}
                    onChange={(e) => setApartamento(e.target.value)}
                    placeholder="Ex: 101"
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Telefone */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-600">
                Telefone com DDD <span className="text-rose-500">*</span>
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  value={telefone}
                  onChange={(e) => setTelefone(maskTel(e.target.value))}
                  placeholder="(11) 99999-9999"
                  className="pl-10"
                  required
                />
              </div>
            </div>

            {/* CPF */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-600">CPF <span className="text-rose-500">*</span></Label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  value={cpf}
                  onChange={(e) => setCpf(maskCPF(e.target.value))}
                  placeholder="000.000.000-00"
                  className="pl-10"
                  maxLength={14}
                />
              </div>
            </div>

            {/* Código iFood */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-600 flex items-center gap-1.5">
                <Bike className="w-3.5 h-3.5 text-rose-500" />
                Código iFood <span className="text-rose-500">*</span>
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
                    naoTemIfood ? "bg-slate-600 border-slate-600" : "border-slate-300 group-hover:border-slate-400"
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

            <Button
              type="submit"
              disabled={salvando}
              className="w-full bg-indigo-600 hover:bg-indigo-700 gap-2"
            >
              {salvando ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : "Salvar e acessar"}
            </Button>

            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="w-full text-xs text-slate-400 hover:text-slate-600 transition-colors"
            >
              Sair e usar outra conta
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
