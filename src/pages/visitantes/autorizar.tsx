import { useState } from "react";
import { useRouter } from "next/router";
import { GetServerSideProps } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import AppShell from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function AutorizarVisitante() {
  const router = useRouter();
  const [nomeVisitante, setNomeVisitante] = useState("");
  const [documento, setDocumento] = useState("");
  const [dataValida, setDataValida] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [salvando, setSalvando] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvando(true);
    const res = await fetch("/api/visitantes/autorizacoes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nomeVisitante, documento, dataValida, observacoes }),
    });
    setSalvando(false);
    if (res.ok) {
      toast.success("Visitante autorizado!");
      router.push("/visitantes");
    } else {
      const err = await res.json();
      toast.error(err.erro ?? "Erro ao criar autorização");
    }
  };

  const hoje = new Date().toISOString().split("T")[0];

  return (
    <AppShell titulo="Autorizar Visitante">
      <div className="max-w-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome do visitante *</Label>
            <Input
              id="nome"
              value={nomeVisitante}
              onChange={(e) => setNomeVisitante(e.target.value)}
              placeholder="Nome completo"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="doc">CPF / RG (opcional)</Label>
            <Input
              id="doc"
              value={documento}
              onChange={(e) => setDocumento(e.target.value)}
              placeholder="000.000.000-00"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="data">Data de visita *</Label>
            <Input
              id="data"
              type="date"
              value={dataValida}
              min={hoje}
              onChange={(e) => setDataValida(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="obs">Observações (opcional)</Label>
            <Textarea
              id="obs"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Ex: técnico de internet, familiar..."
              rows={2}
            />
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={salvando}>
              {salvando ? "Autorizando..." : "Autorizar Visitante"}
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
  if (session.user.perfil !== "MORADOR") {
    return { redirect: { destination: "/visitantes", permanent: false } };
  }
  return { props: {} };
};
