// @ts-nocheck
/**
 * CADÊNCIAS DE PROSPECÇÃO
 */
import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { pageHead } from "@/lib/meta";
import { db, fmtDate } from "@/lib/db";
import { PageHeader } from "@/components/crud-page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/_authenticated/prospeccao/cadencias")({
  head: pageHead("Cadências", "Sequências de contato para prospecção B2B."),
  component: Cadencias,
});

const BLANK_SEQUENCE = {
  name: "", description: "", objective: "", channel: "WhatsApp", active: true,
};
const BLANK_STEP = {
  step_number: 1, day_offset: 0, channel: "WhatsApp", message_template: "", objective: "",
};

function Cadencias() {
  const qc = useQueryClient();
  const [editingSeq, setEditingSeq] = useState<any>(null);
  const [editingStep, setEditingStep] = useState<any>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const { data: sequences = [] } = useQuery({
    queryKey: ["prospecting_sequences"],
    queryFn: async () => {
      const { data } = await db
        .from("prospecting_sequences")
        .select("*, prospecting_sequence_steps(*)")
        .order("created_at", { ascending: false });
      return (data ?? []).map((s: any) => ({
        ...s,
        prospecting_sequence_steps: (s.prospecting_sequence_steps || []).sort(
          (a: any, b: any) => a.step_number - b.step_number
        ),
      }));
    },
  });

  function setSeq(k: string, v: any) {
    setEditingSeq((e: any) => ({ ...e, [k]: v }));
  }
  function setStep(k: string, v: any) {
    setEditingStep((e: any) => ({ ...e, [k]: v }));
  }

  async function saveSequence() {
    if (!editingSeq?.name) return toast.error("Informe um nome.");
    setSaving(true);
    const payload = {
      name: editingSeq.name,
      description: editingSeq.description || null,
      objective: editingSeq.objective || null,
      channel: editingSeq.channel || "WhatsApp",
      active: editingSeq.active !== false,
    };
    const res = editingSeq.id
      ? await db.from("prospecting_sequences").update(payload).eq("id", editingSeq.id)
      : await db.from("prospecting_sequences").insert(payload);
    setSaving(false);
    if (res.error) return toast.error(res.error.message);
    toast.success("Cadência salva!");
    setEditingSeq(null);
    qc.invalidateQueries({ queryKey: ["prospecting_sequences"] });
  }

  async function removeSequence(id: string) {
    if (!confirm("Excluir esta cadência e suas etapas?")) return;
    await db.from("prospecting_sequences").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["prospecting_sequences"] });
    toast.success("Cadência removida.");
  }

  async function saveStep() {
    if (!editingStep?.sequence_id) return;
    setSaving(true);
    const payload = {
      sequence_id: editingStep.sequence_id,
      step_number: Number(editingStep.step_number) || 1,
      day_offset: Number(editingStep.day_offset) || 0,
      channel: editingStep.channel || "WhatsApp",
      message_template: editingStep.message_template || null,
      objective: editingStep.objective || null,
    };
    const res = editingStep.id
      ? await db.from("prospecting_sequence_steps").update(payload).eq("id", editingStep.id)
      : await db.from("prospecting_sequence_steps").insert(payload);
    setSaving(false);
    if (res.error) return toast.error(res.error.message);
    toast.success("Etapa salva!");
    setEditingStep(null);
    qc.invalidateQueries({ queryKey: ["prospecting_sequences"] });
  }

  async function removeStep(id: string) {
    if (!confirm("Excluir esta etapa?")) return;
    await db.from("prospecting_sequence_steps").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["prospecting_sequences"] });
    toast.success("Etapa removida.");
  }

  const channels = ["WhatsApp","Telefone","E-mail","Instagram","LinkedIn","Outro"];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cadências de Prospecção"
        subtitle="Configure sequências de contato para cada tipo de campanha."
        action={
          <Button onClick={() => setEditingSeq({ ...BLANK_SEQUENCE })}>
            <Plus className="h-4 w-4 mr-1" /> Nova cadência
          </Button>
        }
      />

      <div className="space-y-4">
        {sequences.length === 0 && (
          <div className="panel p-8 text-center text-muted-foreground">
            Nenhuma cadência criada ainda. Crie sua primeira cadência de prospecção.
          </div>
        )}
        {sequences.map((seq: any) => (
          <div key={seq.id} className="panel overflow-hidden">
            {/* Header da sequência */}
            <div
              className="flex items-start justify-between gap-4 p-5 cursor-pointer hover:bg-muted/30"
              onClick={() => setExpandedId(expandedId === seq.id ? null : seq.id)}
            >
              <div className="flex items-center gap-3 min-w-0">
                {expandedId === seq.id ? <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />}
                <div>
                  <div className="font-medium text-foreground flex items-center gap-2">
                    {seq.name}
                    {!seq.active && <Badge variant="secondary" className="text-[10px]">Inativa</Badge>}
                  </div>
                  {seq.description && <div className="text-xs text-muted-foreground mt-0.5">{seq.description}</div>}
                  <div className="text-xs text-muted-foreground mt-1">
                    {seq.prospecting_sequence_steps.length} etapa(s) · Canal principal: {seq.channel}
                  </div>
                </div>
              </div>
              <div className="flex gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                <Button size="icon" variant="ghost" onClick={() => setEditingSeq(seq)}><Pencil className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" onClick={() => removeSequence(seq.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            </div>

            {/* Etapas */}
            {expandedId === seq.id && (
              <div className="border-t border-border px-5 pb-5">
                <div className="pt-4 space-y-3">
                  {seq.prospecting_sequence_steps.length === 0 && (
                    <p className="text-sm text-muted-foreground">Nenhuma etapa configurada.</p>
                  )}
                  {seq.prospecting_sequence_steps.map((step: any) => (
                    <div key={step.id} className="flex items-start gap-4 rounded-lg border border-border bg-muted/30 px-4 py-3">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                        {step.step_number}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-foreground">{step.objective || `Etapa ${step.step_number}`}</span>
                          <Badge variant="outline" className="text-[10px]">{step.channel}</Badge>
                          <span className="text-xs text-muted-foreground">Dia {step.day_offset}</span>
                        </div>
                        {step.message_template && (
                          <div className="mt-1.5 rounded bg-background border border-border px-3 py-2 text-xs text-foreground whitespace-pre-wrap max-h-24 overflow-y-auto">
                            {step.message_template}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button size="icon" variant="ghost" onClick={() => setEditingStep(step)}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => removeStep(step.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                      </div>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingStep({ ...BLANK_STEP, sequence_id: seq.id, step_number: seq.prospecting_sequence_steps.length + 1 })}
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar etapa
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Dialog: Sequência */}
      <Dialog open={!!editingSeq} onOpenChange={(o) => !o && setEditingSeq(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingSeq?.id ? "Editar" : "Nova"} Cadência</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div>
              <Label className="mb-1.5 block text-xs text-muted-foreground">Nome *</Label>
              <Input value={editingSeq?.name || ""} onChange={(e) => setSeq("name", e.target.value)} placeholder="Ex: Cadência B2B — 7 dias" />
            </div>
            <div>
              <Label className="mb-1.5 block text-xs text-muted-foreground">Canal principal</Label>
              <select className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground" value={editingSeq?.channel || "WhatsApp"} onChange={(e) => setSeq("channel", e.target.value)}>
                {channels.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <Label className="mb-1.5 block text-xs text-muted-foreground">Objetivo</Label>
              <Input value={editingSeq?.objective || ""} onChange={(e) => setSeq("objective", e.target.value)} placeholder="Ex: Qualificação inicial" />
            </div>
            <div>
              <Label className="mb-1.5 block text-xs text-muted-foreground">Descrição</Label>
              <Textarea rows={2} value={editingSeq?.description || ""} onChange={(e) => setSeq("description", e.target.value)} />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="active" checked={editingSeq?.active !== false} onChange={(e) => setSeq("active", e.target.checked)} className="h-4 w-4" />
              <Label htmlFor="active" className="text-sm cursor-pointer">Cadência ativa</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingSeq(null)}>Cancelar</Button>
            <Button onClick={saveSequence} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Etapa */}
      <Dialog open={!!editingStep} onOpenChange={(o) => !o && setEditingStep(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingStep?.id ? "Editar" : "Nova"} Etapa</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="mb-1.5 block text-xs text-muted-foreground">Número da etapa</Label>
              <Input type="number" min={1} value={editingStep?.step_number || 1} onChange={(e) => setStep("step_number", e.target.value)} />
            </div>
            <div>
              <Label className="mb-1.5 block text-xs text-muted-foreground">Dia (offset desde o início)</Label>
              <Input type="number" min={0} value={editingStep?.day_offset ?? 0} onChange={(e) => setStep("day_offset", e.target.value)} />
            </div>
            <div>
              <Label className="mb-1.5 block text-xs text-muted-foreground">Canal</Label>
              <select className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground" value={editingStep?.channel || "WhatsApp"} onChange={(e) => setStep("channel", e.target.value)}>
                {channels.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <Label className="mb-1.5 block text-xs text-muted-foreground">Objetivo da etapa</Label>
              <Input value={editingStep?.objective || ""} onChange={(e) => setStep("objective", e.target.value)} placeholder="Ex: Primeiro contato" />
            </div>
            <div className="sm:col-span-2">
              <Label className="mb-1.5 block text-xs text-muted-foreground">Mensagem modelo</Label>
              <Textarea rows={5} value={editingStep?.message_template || ""} onChange={(e) => setStep("message_template", e.target.value)} placeholder="Cole aqui o roteiro ou mensagem modelo..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingStep(null)}>Cancelar</Button>
            <Button onClick={saveStep} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
