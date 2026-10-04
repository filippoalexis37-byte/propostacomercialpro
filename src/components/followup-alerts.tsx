/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BellRing, Check } from "lucide-react";
import { db, brl, fmtDate } from "@/lib/db";
import { Button } from "@/components/ui/button";

const today = () => new Date().toISOString().slice(0, 10);

/** Proposals and leads whose follow-up date has arrived. */
export function FollowupAlerts() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["followup-alerts"],
    queryFn: async () => {
      const t = today();
      const [p, l] = await Promise.all([
        db.from("proposals").select("id, number, client_name, company, total, sent_at, sent_to, followup_at").eq("followup_done", false).not("followup_at", "is", null).lte("followup_at", t).order("followup_at"),
        db.from("leads").select("id, name, company_name, whatsapp, next_contact_at, status").not("next_contact_at", "is", null).lte("next_contact_at", t).not("status", "in", "(Fechado,Perdido)").order("next_contact_at"),
      ]);
      return { proposals: p.data ?? [], leads: l.data ?? [] };
    },
  });
  const n = (data?.proposals.length ?? 0) + (data?.leads.length ?? 0);
  async function doneProposal(id: string) {
    await db.from("proposals").update({ followup_done: true }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["followup-alerts"] });
    qc.invalidateQueries({ queryKey: ["proposals"] });
  }
  async function snoozeLead(id: string) {
    await db.from("leads").update({ next_contact_at: new Date(Date.now() + 3 * 864e5).toISOString().slice(0, 10), last_contact_at: today() }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["followup-alerts"] });
  }
  return (
    <div className="panel mb-6 p-5">
      <div className="mb-3 flex items-center gap-2">
        <BellRing className={`h-5 w-5 ${n ? "text-primary" : "text-muted-foreground"}`} />
        <h3 className="font-display font-semibold text-foreground">Entrar em contato hoje</h3>
        {n > 0 && <span className="rounded-full bg-primary px-2 text-xs font-semibold text-primary-foreground">{n}</span>}
      </div>
      {n === 0 && <p className="text-sm text-muted-foreground">Nenhum contato pendente. 👍</p>}
      <div className="space-y-2">
        {data?.proposals.map((p: any) => (
          <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border p-3 text-sm">
            <div>
              <div className="font-medium text-foreground">Proposta Nº {p.number} — {p.company || p.client_name} ({brl(p.total)})</div>
              <div className="text-xs text-muted-foreground">
                {p.sent_at ? `Enviada por e-mail em ${fmtDate(p.sent_at)} para ${p.sent_to}` : "Não enviada por e-mail"} • follow-up {fmtDate(p.followup_at)}
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={() => doneProposal(p.id)}><Check className="mr-1 h-4 w-4" />Já falei</Button>
          </div>
        ))}
        {data?.leads.map((l: any) => (
          <div key={l.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border p-3 text-sm">
            <div>
              <div className="font-medium text-foreground">Lead: {l.name}{l.company_name ? ` — ${l.company_name}` : ""}</div>
              <div className="text-xs text-muted-foreground">{l.status} • contato marcado para {fmtDate(l.next_contact_at)}{l.whatsapp ? ` • ${l.whatsapp}` : ""}</div>
            </div>
            <Button size="sm" variant="outline" onClick={() => snoozeLead(l.id)}><Check className="mr-1 h-4 w-4" />Já falei (+3 dias)</Button>
          </div>
        ))}
      </div>
    </div>
  );
}
