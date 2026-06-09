import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { GetServerSideProps } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import AppShell from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface Morador {
  id: string;
  name: string;
  apartamento: string | null;
  bloco: string | null;
}

export default function RegistrarEntrega() {
  const router = useRouter();
  const [moradores, setMoradores] = useState<Morador[]>([]);
  const [moradorId, setMoradorId] = useState("");
  const [remetente, setRemetente] = useState("");
  const [descricao, setDescricao] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    fetch("/api/users/moradores")
      .then((r) => r.json())
      .then(setMoradores);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!moradorId || !descricao) {
      toast.error("Selecione o morador e descreva a entrega");
      return;
    }
    setSalvando(true);
    const res = await fetch("/api/entregas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ moradorId, remetente, descricao, observacoes }),
    });
    setSalvando(false);
    if (res.ok) {
      toast.success("Entrega registrada!");
      router.push("/entregas");
    } else {
      const err = await res.json();
      toast.error(err.erro ?? "Erro ao registrar entrega");
    }
  };

  return (
    <AppShell titulo="Registrar Entrega">
      <div className="max-w-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Destinatário (morador) *</Label>
            <Select value={moradorId} onValueChange={(v) => v && setMoradorId(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o morador" />
              </SelectTrigger>
              <SelectContent>
                {moradores.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
                    {m.apartamento && ` — Apt ${m.apartamento}${m.bloco ? `-${m.bloco}` : ""}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="remetente">Remetente (opcional)</Label>
            <Input
              id="remetente"
              value={remetente}
              onChange={(e) => setRemetente(e.target.value)}
              placeholder="Ex: Amazon, Correios..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição da encomenda *</Label>
            <Input
              id="descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Ex: 1 caixa pequena, envelope A4..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="obs">Observações (opcional)</Label>
            <Textarea
              id="obs"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Alguma informação adicional..."
              rows={2}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={salvando}>
              {salvando ? "Registrando..." : "Registrar Entrega"}
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
  if (session.user.perfil !== "PORTEIRO") {
    return { redirect: { destination: "/entregas", permanent: false } };
  }
  return { props: {} };
};
