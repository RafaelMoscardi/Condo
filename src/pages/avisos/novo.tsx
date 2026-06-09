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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export default function NovoAviso() {
  const router = useRouter();
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [categoria, setCategoria] = useState("");
  const [urgente, setUrgente] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoria) { toast.error("Selecione uma categoria"); return; }
    setSalvando(true);

    const res = await fetch("/api/avisos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ titulo, descricao, categoria, urgente }),
    });

    setSalvando(false);
    if (res.ok) {
      toast.success("Aviso publicado com sucesso!");
      router.push("/avisos");
    } else {
      const data = await res.json();
      toast.error(data.erro ?? "Erro ao publicar aviso");
    }
  };

  return (
    <AppShell titulo="Novo Aviso">
      <div className="max-w-xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="titulo">Título *</Label>
            <Input
              id="titulo"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Manutenção do elevador"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição *</Label>
            <Textarea
              id="descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descreva o aviso com detalhes..."
              rows={4}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Categoria *</Label>
            <Select value={categoria} onValueChange={(v) => v && setCategoria(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="geral">Geral</SelectItem>
                <SelectItem value="manutencao">Manutenção</SelectItem>
                <SelectItem value="financeiro">Financeiro</SelectItem>
                <SelectItem value="seguranca">Segurança</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="urgente"
              checked={urgente}
              onChange={(e) => setUrgente(e.target.checked)}
              className="w-4 h-4"
            />
            <Label htmlFor="urgente" className="cursor-pointer">
              Marcar como urgente (destaque em vermelho)
            </Label>
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={salvando}>
              {salvando ? "Publicando..." : "Publicar Aviso"}
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
  if (session.user.perfil !== "SINDICO") {
    return { redirect: { destination: "/avisos", permanent: false } };
  }
  return { props: {} };
};
