import { useState } from "react";
import { useRouter } from "next/router";
import { GetServerSideProps } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import AppShell from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export default function NovaOcorrencia() {
  const router = useRouter();
  const [tipo, setTipo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [foto, setFoto] = useState<File | null>(null);
  const [salvando, setSalvando] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tipo) { toast.error("Selecione o tipo de ocorrência"); return; }
    setSalvando(true);

    const formData = new FormData();
    formData.append("tipo", tipo);
    formData.append("descricao", descricao);
    if (foto) formData.append("foto", foto);

    const res = await fetch("/api/ocorrencias", { method: "POST", body: formData });
    setSalvando(false);

    if (res.ok) {
      toast.success("Ocorrência registrada!");
      router.push("/ocorrencias");
    } else {
      const data = await res.json();
      toast.error(data.erro ?? "Erro ao registrar ocorrência");
    }
  };

  return (
    <AppShell titulo="Nova Ocorrência">
      <div className="max-w-xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Tipo *</Label>
            <Select value={tipo} onValueChange={(v) => v && setTipo(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="barulho">Barulho</SelectItem>
                <SelectItem value="vazamento">Vazamento</SelectItem>
                <SelectItem value="iluminacao">Iluminação</SelectItem>
                <SelectItem value="seguranca">Segurança</SelectItem>
                <SelectItem value="outro">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição *</Label>
            <Textarea
              id="descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descreva o problema com detalhes..."
              rows={4}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="foto">Foto (opcional, máx. 5MB)</Label>
            <input
              id="foto"
              type="file"
              accept="image/*"
              onChange={(e) => setFoto(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={salvando}>
              {salvando ? "Registrando..." : "Registrar Ocorrência"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);
  if (!session) return { redirect: { destination: "/login", permanent: false } };
  if (!["MORADOR", "PORTEIRO"].includes(session.user.perfil)) {
    return { redirect: { destination: "/ocorrencias", permanent: false } };
  }
  return { props: {} };
};
