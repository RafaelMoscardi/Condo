import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { GetServerSideProps } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import AppShell from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const HORARIOS = [
  "07:00", "08:00", "09:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00", "17:00", "18:00",
  "19:00", "20:00", "21:00", "22:00", "23:00",
];

interface Area {
  id: string;
  nome: string;
  capacidade: number | null;
}

export default function NovaReserva() {
  const router = useRouter();
  const [areas, setAreas] = useState<Area[]>([]);
  const [areaId, setAreaId] = useState("");
  const [data, setData] = useState("");
  const [horaInicio, setHoraInicio] = useState("");
  const [horaFim, setHoraFim] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    fetch("/api/reservas/areas")
      .then((r) => r.json())
      .then(setAreas);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!areaId || !data || !horaInicio || !horaFim) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    if (horaInicio >= horaFim) {
      toast.error("O horário de início deve ser antes do fim");
      return;
    }
    setSalvando(true);

    const res = await fetch("/api/reservas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ areaId, data, horaInicio, horaFim, observacoes }),
    });

    setSalvando(false);
    if (res.ok) {
      toast.success("Reserva solicitada! Aguarde aprovação do síndico.");
      router.push("/reservas");
    } else {
      const err = await res.json();
      toast.error(err.erro ?? "Erro ao solicitar reserva");
    }
  };

  const hoje = new Date().toISOString().split("T")[0];

  return (
    <AppShell titulo="Nova Reserva">
      <div className="max-w-xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Área *</Label>
            <Select value={areaId} onValueChange={(v) => v && setAreaId(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a área" />
              </SelectTrigger>
              <SelectContent>
                {areas.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.nome}{a.capacidade ? ` (até ${a.capacidade} pessoas)` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="data">Data *</Label>
            <Input
              id="data"
              type="date"
              value={data}
              min={hoje}
              onChange={(e) => setData(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Horário de início *</Label>
              <Select value={horaInicio} onValueChange={(v) => v && setHoraInicio(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Início" />
                </SelectTrigger>
                <SelectContent>
                  {HORARIOS.slice(0, -1).map((h) => (
                    <SelectItem key={h} value={h}>{h}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Horário de fim *</Label>
              <Select value={horaFim} onValueChange={(v) => v && setHoraFim(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Fim" />
                </SelectTrigger>
                <SelectContent>
                  {HORARIOS.slice(1).map((h) => (
                    <SelectItem key={h} value={h}>{h}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="obs">Observações (opcional)</Label>
            <Textarea
              id="obs"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Alguma informação adicional..."
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={salvando}>
              {salvando ? "Solicitando..." : "Solicitar Reserva"}
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
    return { redirect: { destination: "/reservas", permanent: false } };
  }
  return { props: {} };
};
