import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { db, fmtDate, fmtDateTime } from "@/lib/db";
import { History, Calendar, MessageSquare, PhoneCall, CheckCircle2, Clock } from "lucide-react";

interface HistoryModalProps {
  company: any;
  open: boolean;
  onClose: () => void;
}

export function HistoryModal({ company, open, onClose }: HistoryModalProps) {
  const { data: history = [], isLoading } = useQuery({
    queryKey: ["company-history", company?.id],
    enabled: open && !!company?.id,
    queryFn: async () => {
      const { data, error } = await db
        .from("prospecting_attempts")
        .select("*")
        .eq("company_id", company.id)
        .order("attempt_date", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            <DialogTitle>Histórico de Interações — {company?.name}</DialogTitle>
          </div>
          <p className="text-xs text-muted-foreground">
            Todas as tentativas de contato e registros realizados para este lead.
          </p>
        </DialogHeader>

        <div className="py-4">
          {isLoading && (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Carregando histórico...
            </div>
          )}

          {!isLoading && history.length === 0 && (
            <div className="py-12 text-center text-muted-foreground">
              <Clock className="mx-auto h-8 w-8 text-muted-foreground/50 mb-2" />
              <p className="text-sm font-medium">Nenhum histórico registrado ainda.</p>
              <p className="text-xs text-muted-foreground mt-1">
                Registre uma tentativa de contato ou follow-up para começar a monitorar.
              </p>
            </div>
          )}

          {!isLoading && history.length > 0 && (
            <div className="space-y-4">
              {history.map((item: any, idx: number) => (
                <div
                  key={item.id || idx}
                  className="rounded-lg border border-border bg-card p-4 transition-all hover:bg-muted/20"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 pb-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                        {item.channel || "Contato"}
                      </span>
                      {item.attempt_type && (
                        <Badge variant="outline" className="text-xs">
                          {item.attempt_type}
                        </Badge>
                      )}
                      <span className="text-xs font-medium text-foreground">
                        {item.result || "Sem resultado"}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {fmtDate(item.attempt_date)} {item.created_at ? `(${new Date(item.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })})` : ""}
                    </div>
                  </div>

                  {item.notes && (
                    <div className="mb-2 text-xs text-foreground/90">
                      <strong className="text-muted-foreground font-medium">Observações: </strong>
                      {item.notes}
                    </div>
                  )}

                  {item.message_used && (
                    <div className="rounded bg-muted/40 p-2.5 text-xs text-muted-foreground font-mono mb-2">
                      <div className="text-[10px] uppercase font-bold text-muted-foreground mb-1">
                        Mensagem Enviada:
                      </div>
                      <div className="whitespace-pre-wrap">{item.message_used}</div>
                    </div>
                  )}

                  {item.next_contact_at && (
                    <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 rounded px-2 py-1 w-fit mt-1">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>Próximo contato agendado para: <strong>{fmtDate(item.next_contact_at)}</strong></span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
