import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  db,
  ATTEMPT_CHANNELS,
  ATTEMPT_RESULTS,
  ATTEMPT_TYPES,
  PROSPECTING_STATUSES,
} from "@/lib/db";

interface ContactRegisterModalProps {
  company: any;
  open: boolean;
  onClose: () => void;
  initialMessage?: string;
}

export function ContactRegisterModal({ company, open, onClose, initialMessage }: ContactRegisterModalProps) {
  const qc = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    attempt_date: new Date().toISOString().slice(0, 10),
    channel: "WhatsApp",
    attempt_type: "Follow-up",
    message_used: "",
    result: "Não respondeu",
    notes: "",
    next_contact_at: "",
    new_status: "",
  });

  useEffect(() => {
    if (open && company) {
      setForm({
        attempt_date: new Date().toISOString().slice(0, 10),
        channel: "WhatsApp",
        attempt_type: company.attempt_count > 0 ? "Follow-up" : "Primeiro contato",
        message_used: initialMessage || "",
        result: "Mensagem enviada",
        notes: "",
        next_contact_at: "",
        new_status: company.prospecting_status || "",
      });
    }
  }, [open, company, initialMessage]);

  function set(k: string, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function save() {
    if (!company?.id) return;
    setSaving(true);
    try {
      // 1. Inserir histórico em prospecting_attempts
      const { error: errInsert } = await db.from("prospecting_attempts").insert({
        company_id: company.id,
        attempt_date: form.attempt_date,
        channel: form.channel,
        attempt_type: form.attempt_type,
        message_used: form.message_used || null,
        result: form.result,
        notes: form.notes || null,
        next_contact_at: form.next_contact_at || null,
      });
      if (errInsert) throw errInsert;

      // 2. Atualizar tabela companies
      const updateData: any = {
        last_attempted_at: form.attempt_date,
        attempt_count: (company.attempt_count || 0) + 1,
        last_attempt_result: form.result,
        last_message_used: form.message_used || null,
        contact_channel: form.channel,
      };

      if (form.next_contact_at) {
        updateData.next_contact_at = form.next_contact_at;
      } else {
        updateData.next_contact_at = null;
      }

      if (form.new_status) {
        updateData.prospecting_status = form.new_status;
      }

      if (!company.first_prospected_at) {
        updateData.first_prospected_at = form.attempt_date;
      }

      const { error: errUpdate } = await db
        .from("companies")
        .update(updateData)
        .eq("id", company.id);

      if (errUpdate) throw errUpdate;

      toast.success("Registro de contato salvo com sucesso!");
      qc.invalidateQueries({ queryKey: ["companies-followup"] });
      qc.invalidateQueries({ queryKey: ["companies-prospecting"] });
      qc.invalidateQueries({ queryKey: ["companies-non-prospected"] });
      qc.invalidateQueries({ queryKey: ["company-history", company.id] });
      qc.invalidateQueries({ queryKey: ["prospecting-stats"] });
      onClose();
    } catch (e: any) {
      toast.error(e.message || "Erro ao salvar contato.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar Contato — {company?.name}</DialogTitle>
          <p className="text-xs text-muted-foreground">
            Adicione detalhes do contato e agende o próximo follow-up.
          </p>
        </DialogHeader>

        <div className="grid gap-3.5 sm:grid-cols-2 py-2">
          <div>
            <Label className="mb-1 block text-xs text-muted-foreground">Data da Tentativa *</Label>
            <Input
              type="date"
              value={form.attempt_date}
              onChange={(e) => set("attempt_date", e.target.value)}
            />
          </div>

          <div>
            <Label className="mb-1 block text-xs text-muted-foreground">Canal de Contato *</Label>
            <select
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              value={form.channel}
              onChange={(e) => set("channel", e.target.value)}
            >
              {ATTEMPT_CHANNELS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <Label className="mb-1 block text-xs text-muted-foreground">Tipo de Ação</Label>
            <select
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              value={form.attempt_type}
              onChange={(e) => set("attempt_type", e.target.value)}
            >
              {ATTEMPT_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <Label className="mb-1 block text-xs text-muted-foreground">Resultado do Contato *</Label>
            <select
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              value={form.result}
              onChange={(e) => set("result", e.target.value)}
            >
              {ATTEMPT_RESULTS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div>
            <Label className="mb-1 block text-xs text-muted-foreground">Próximo Follow-up (Data)</Label>
            <Input
              type="date"
              value={form.next_contact_at}
              onChange={(e) => set("next_contact_at", e.target.value)}
            />
          </div>

          <div>
            <Label className="mb-1 block text-xs text-muted-foreground">Atualizar Status</Label>
            <select
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              value={form.new_status}
              onChange={(e) => set("new_status", e.target.value)}
            >
              <option value="">Manter atual ({company?.prospecting_status || "Não definido"})</option>
              {PROSPECTING_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <Label className="mb-1 block text-xs text-muted-foreground">Mensagem Utilizada</Label>
            <Textarea
              rows={2}
              value={form.message_used}
              onChange={(e) => set("message_used", e.target.value)}
              placeholder="Script ou texto enviado..."
            />
          </div>

          <div className="sm:col-span-2">
            <Label className="mb-1 block text-xs text-muted-foreground">Observações / Próximos Passos</Label>
            <Textarea
              rows={2}
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Ex: Pediu para retornar na quarta-feira após as 14h..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? "Salvando..." : "Salvar Registro"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
