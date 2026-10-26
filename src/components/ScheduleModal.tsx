import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { db } from "@/lib/db";
import { Calendar } from "lucide-react";

interface ScheduleModalProps {
  company: any;
  open: boolean;
  onClose: () => void;
}

export function ScheduleModal({ company, open, onClose }: ScheduleModalProps) {
  const qc = useQueryClient();
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && company) {
      setDate(company.next_contact_at || "");
      setNotes("");
    }
  }, [open, company]);

  async function handleSchedule() {
    if (!company?.id) return;
    if (!date) {
      toast.error("Selecione uma data para o próximo contato.");
      return;
    }
    setSaving(true);
    try {
      const { error } = await db
        .from("companies")
        .update({
          next_contact_at: date,
          notes: notes ? (company.notes ? `${company.notes}\n[Agendamento]: ${notes}` : `[Agendamento]: ${notes}`) : company.notes,
        })
        .eq("id", company.id);

      if (error) throw error;

      toast.success("Próximo contato agendado!");
      qc.invalidateQueries({ queryKey: ["companies-followup"] });
      qc.invalidateQueries({ queryKey: ["companies-prospecting"] });
      qc.invalidateQueries({ queryKey: ["prospecting-stats"] });
      onClose();
    } catch (e: any) {
      toast.error(e.message || "Erro ao agendar contato.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <DialogTitle>Agendar Follow-up — {company?.name}</DialogTitle>
          </div>
          <p className="text-xs text-muted-foreground">
            Defina quando este lead deve reaparecer nas suas listas de follow-up.
          </p>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <Label className="mb-1 block text-xs font-medium text-muted-foreground">
              Data do Próximo Contato *
            </Label>
            <Input
              type="date"
              value={date}
              min={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div>
            <Label className="mb-1 block text-xs font-medium text-muted-foreground">
              Motivo ou Lembrete (Opcional)
            </Label>
            <Textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Ligar às 14h para falar com o decisor..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSchedule} disabled={saving}>
            {saving ? "Salvando..." : "Confirmar Agendamento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
