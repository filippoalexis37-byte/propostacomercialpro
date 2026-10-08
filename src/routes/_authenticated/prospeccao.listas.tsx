// @ts-nocheck
/**
 * LISTAS DE PROSPECÇÃO
 */
import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { pageHead } from "@/lib/meta";
import { db, fmtDate, LIST_STATUSES, DEFAULT_NICHES } from "@/lib/db";
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
import { Plus, Pencil, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/prospeccao/listas")({
  head: pageHead("Listas de Prospecção", "Organize campanhas por nicho e região."),
  component: ListasProspeccao,
});

const STATUS_COLORS: Record<string, string> = {
  "Rascunho":       "bg-gray-100 text-gray-700",
  "Em prospecção":  "bg-blue-100 text-blue-700",
  "Pausada":        "bg-yellow-100 text-yellow-700",
  "Concluída":      "bg-green-100 text-green-700",
};

const BLANK = {
  name: "", niche: "", sub_niche: "", region: "", city: "", state: "",
  description: "", status: "Rascunho",
};

function ListasProspeccao() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const { data: lists = [], isLoading } = useQuery({
    queryKey: ["prospecting_lists"],
    queryFn: async () => {
      const { data } = await db
        .from("prospecting_lists")
        .select("*, prospecting_list_companies(count)")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  function set(k: string, v: string) {
    setEditing((e: any) => ({ ...e, [k]: v }));
  }

  async function save() {
    if (!editing?.name) return toast.error("Informe um nome para a lista.");
    setSaving(true);
    const payload = {
      name: editing.name,
      niche: editing.niche || null,
      sub_niche: editing.sub_niche || null,
      region: editing.region || null,
      city: editing.city || null,
      state: editing.state || null,
      description: editing.description || null,
      status: editing.status || "Rascunho",
    };
    const res = editing.id
      ? await db.from("prospecting_lists").update(payload).eq("id", editing.id)
      : await db.from("prospecting_lists").insert(payload);
    setSaving(false);
    if (res.error) return toast.error(res.error.message);
    toast.success("Lista salva!");
    setEditing(null);
    qc.invalidateQueries({ queryKey: ["prospecting_lists"] });
  }

  async function remove(id: string) {
    if (!confirm("Excluir esta lista?")) return;
    await db.from("prospecting_lists").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["prospecting_lists"] });
    toast.success("Lista removida.");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Listas de Prospecção"
        subtitle="Organize sua prospecção por campanha, nicho e região."
        action={<Button onClick={() => setEditing({ ...BLANK })}><Plus className="h-4 w-4 mr-1" /> Nova lista</Button>}
      />

      <div className="panel overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">Nicho</th>
              <th className="px-4 py-3">Cidade / Região</th>
              <th className="px-4 py-3">Empresas</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Criado em</th>
              <th className="px-3 py-3" />
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td className="px-4 py-8 text-muted-foreground" colSpan={99}>Carregando...</td></tr>
            )}
            {!isLoading && lists.length === 0 && (
              <tr><td className="px-4 py-10 text-center text-muted-foreground" colSpan={99}>Nenhuma lista criada ainda.</td></tr>
            )}
            {lists.map((l: any) => (
              <tr key={l.id} className="border-b border-border/60 last:border-0 hover:bg-muted/30">
                <td className="px-4 py-3 font-medium text-foreground">
                  {l.name}
                  {l.description && <div className="text-xs text-muted-foreground">{l.description}</div>}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{l.niche || "—"}{l.sub_niche ? ` / ${l.sub_niche}` : ""}</td>
                <td className="px-4 py-3 text-muted-foreground">{[l.city, l.state, l.region].filter(Boolean).join(" · ") || "—"}</td>
                <td className="px-4 py-3 text-center text-muted-foreground">
                  {l.prospecting_list_companies?.[0]?.count ?? 0}
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[l.status] || ""}`}>
                    {l.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{fmtDate(l.created_at)}</td>
                <td className="px-2 py-2 text-right whitespace-nowrap">
                  <Button size="icon" variant="ghost" onClick={() => setEditing(l)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => remove(l.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Editar" : "Nova"} Lista de Prospecção</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label className="mb-1.5 block text-xs text-muted-foreground">Nome da lista *</Label>
              <Input value={editing?.name || ""} onChange={(e) => set("name", e.target.value)} placeholder="Ex: Campinas — Serralherias" />
            </div>
            <div>
              <Label className="mb-1.5 block text-xs text-muted-foreground">Nicho</Label>
              <select className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground" value={editing?.niche || ""} onChange={(e) => set("niche", e.target.value)}>
                <option value="">—</option>
                {DEFAULT_NICHES.map((n) => <option key={n}>{n}</option>)}
              </select>
            </div>
            <div>
              <Label className="mb-1.5 block text-xs text-muted-foreground">Subnicho</Label>
              <Input value={editing?.sub_niche || ""} onChange={(e) => set("sub_niche", e.target.value)} />
            </div>
            <div>
              <Label className="mb-1.5 block text-xs text-muted-foreground">Cidade</Label>
              <Input value={editing?.city || ""} onChange={(e) => set("city", e.target.value)} />
            </div>
            <div>
              <Label className="mb-1.5 block text-xs text-muted-foreground">UF</Label>
              <Input value={editing?.state || ""} onChange={(e) => set("state", e.target.value)} maxLength={2} placeholder="SP" />
            </div>
            <div>
              <Label className="mb-1.5 block text-xs text-muted-foreground">Região</Label>
              <Input value={editing?.region || ""} onChange={(e) => set("region", e.target.value)} placeholder="Interior SP" />
            </div>
            <div>
              <Label className="mb-1.5 block text-xs text-muted-foreground">Status</Label>
              <select className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground" value={editing?.status || "Rascunho"} onChange={(e) => set("status", e.target.value)}>
                {LIST_STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <Label className="mb-1.5 block text-xs text-muted-foreground">Descrição</Label>
              <Textarea rows={2} value={editing?.description || ""} onChange={(e) => set("description", e.target.value)} />
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
