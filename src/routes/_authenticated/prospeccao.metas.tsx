// @ts-nocheck
/**
 * METAS DE PROSPECÇÃO
 */
import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { pageHead } from "@/lib/meta";
import { db, fmtDate } from "@/lib/db";
import { PageHeader } from "@/components/crud-page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Target } from "lucide-react";

export const Route = createFileRoute("/_authenticated/prospeccao/metas")({
  head: pageHead("Metas de Prospecção", "Acompanhe as metas da equipe de prospecção."),
  component: MetasProspeccao,
});

const BLANK = {
  period: "Mensal",
  target_count: 30,
  reference_date: new Date().toISOString().slice(0, 10),
  notes: "",
};

const PERIODS = ["Diária", "Semanal", "Mensal", "Trimestral"];

function MetasProspeccao() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const { data: goals = [] } = useQuery({
    queryKey: ["prospecting_goals"],
    queryFn: async () => {
      const { data } = await db.from("prospecting_goals").select("*").order("reference_date", { ascending: false });
      return data ?? [];
    },
  });

  // Contagem real de prospecções por período
  const { data: companies = [] } = useQuery({
    queryKey: ["companies-meta"],
    queryFn: async () => {
      const { data } = await db.from("companies").select("prospecting_status, first_prospected_at");
      return data ?? [];
    },
  });

  const counts = useMemo(() => {
    const now = new Date();
    const startOfDay = new Date(now); startOfDay.setHours(0, 0, 0, 0);
    const startOfWeek = new Date(now); startOfWeek.setDate(now.getDate() - now.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfQuarter = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);

    const prospected = companies.filter((c: any) => c.first_prospected_at);

    return {
      Diária: prospected.filter((c: any) => new Date(c.first_prospected_at) >= startOfDay).length,
      Semanal: prospected.filter((c: any) => new Date(c.first_prospected_at) >= startOfWeek).length,
      Mensal: prospected.filter((c: any) => new Date(c.first_prospected_at) >= startOfMonth).length,
      Trimestral: prospected.filter((c: any) => new Date(c.first_prospected_at) >= startOfQuarter).length,
    };
  }, [companies]);

  function set(k: string, v: any) { setEditing((e: any) => ({ ...e, [k]: v })); }

  async function save() {
    if (!editing?.target_count) return toast.error("Informe a meta.");
    setSaving(true);
    const payload = {
      period: editing.period || "Mensal",
      target_count: Number(editing.target_count) || 30,
      reference_date: editing.reference_date || new Date().toISOString().slice(0, 10),
      notes: editing.notes || null,
    };
    const res = editing.id
      ? await db.from("prospecting_goals").update(payload).eq("id", editing.id)
      : await db.from("prospecting_goals").insert(payload);
    setSaving(false);
    if (res.error) return toast.error(res.error.message);
    toast.success("Meta salva!");
    setEditing(null);
    qc.invalidateQueries({ queryKey: ["prospecting_goals"] });
  }

  async function remove(id: string) {
    if (!confirm("Excluir esta meta?")) return;
    await db.from("prospecting_goals").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["prospecting_goals"] });
    toast.success("Meta removida.");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Metas de Prospecção"
        subtitle="Configure e acompanhe as metas da equipe."
        action={<Button onClick={() => setEditing({ ...BLANK })}><Plus className="h-4 w-4 mr-1" /> Nova meta</Button>}
      />

      {/* Resumo atual */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PERIODS.map((p) => {
          const done = counts[p] || 0;
          const goal = goals.find((g: any) => g.period === p);
          const target = goal?.target_count || 0;
          const pctDone = target > 0 ? Math.min(Math.round((done / target) * 100), 100) : 0;
          return (
            <div key={p} className="panel p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-medium text-muted-foreground">{p}</div>
                <Target className="h-4 w-4 text-primary" />
              </div>
              <div>
                <div className="font-display text-3xl font-semibold text-foreground">{done}</div>
                <div className="text-xs text-muted-foreground">de {target > 0 ? target : "—"} empresas</div>
              </div>
              {target > 0 && (
                <>
                  <Progress value={pctDone} className="h-2" />
                  <div className="text-xs text-muted-foreground">{pctDone}% concluído · faltam {Math.max(0, target - done)}</div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Lista de metas */}
      <div className="panel overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3">Período</th>
              <th className="px-4 py-3 text-right">Meta</th>
              <th className="px-4 py-3 text-right">Realizado</th>
              <th className="px-4 py-3 text-right">Restante</th>
              <th className="px-4 py-3">Progresso</th>
              <th className="px-4 py-3">Referência</th>
              <th className="px-4 py-3">Obs.</th>
              <th className="px-3 py-3" />
            </tr>
          </thead>
          <tbody>
            {goals.length === 0 && (
              <tr><td className="px-4 py-10 text-center text-muted-foreground" colSpan={99}>Nenhuma meta configurada.</td></tr>
            )}
            {goals.map((g: any) => {
              const done = counts[g.period] || 0;
              const remaining = Math.max(0, g.target_count - done);
              const pctDone = g.target_count > 0 ? Math.min(Math.round((done / g.target_count) * 100), 100) : 0;
              return (
                <tr key={g.id} className="border-b border-border/60 last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium text-foreground">{g.period}</td>
                  <td className="px-4 py-3 text-right font-medium">{g.target_count}</td>
                  <td className="px-4 py-3 text-right text-green-600 font-medium">{done}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground">{remaining}</td>
                  <td className="px-4 py-3 w-32">
                    <div className="flex items-center gap-2">
                      <Progress value={pctDone} className="h-1.5 flex-1" />
                      <span className="text-xs text-muted-foreground">{pctDone}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{fmtDate(g.reference_date)}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{g.notes || "—"}</td>
                  <td className="px-2 py-2 text-right whitespace-nowrap">
                    <Button size="icon" variant="ghost" onClick={() => setEditing(g)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => remove(g.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Editar" : "Nova"} Meta</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="mb-1.5 block text-xs text-muted-foreground">Período *</Label>
              <select className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground" value={editing?.period || "Mensal"} onChange={(e) => set("period", e.target.value)}>
                {PERIODS.map((p) => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <Label className="mb-1.5 block text-xs text-muted-foreground">Meta (quantidade) *</Label>
              <Input type="number" min={1} value={editing?.target_count || ""} onChange={(e) => set("target_count", e.target.value)} />
            </div>
            <div>
              <Label className="mb-1.5 block text-xs text-muted-foreground">Data de referência</Label>
              <Input type="date" value={editing?.reference_date || ""} onChange={(e) => set("reference_date", e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <Label className="mb-1.5 block text-xs text-muted-foreground">Observações</Label>
              <Textarea rows={2} value={editing?.notes || ""} onChange={(e) => set("notes", e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button onClick={save} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
