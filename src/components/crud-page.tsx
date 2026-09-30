// @ts-nocheck
import { useMemo, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import { db, brl, fmtDate } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type Field = {
  name: string;
  label: string;
  type?: "text" | "textarea" | "number" | "money" | "date" | "select" | "switch" | "relation";
  options?: string[];
  relation?: { table: string; label: string };
  required?: boolean;
  list?: boolean;
  full?: boolean;
};

type Row = Record<string, unknown> & { id: string };

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl font-semibold text-foreground">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function useRelation(field: Field) {
  return useQuery({
    queryKey: ["rel", field.relation?.table],
    enabled: !!field.relation,
    queryFn: async () => {
      const { data } = await db.from(field.relation!.table).select(`id, ${field.relation!.label}`).order(field.relation!.label);
      return (data ?? []) as Row[];
    },
  });
}

function RelationSelect({ field, value, onChange }: { field: Field; value: string; onChange: (v: string) => void }) {
  const { data = [] } = useRelation(field);
  return (
    <select
      className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">—</option>
      {data.map((r) => (
        <option key={r.id} value={r.id}>
          {String(r[field.relation!.label] ?? "")}
        </option>
      ))}
    </select>
  );
}

function RelationLabel({ field, value }: { field: Field; value: unknown }) {
  const { data = [] } = useRelation(field);
  const r = data.find((x) => x.id === value);
  return <>{r ? String(r[field.relation!.label]) : "—"}</>;
}

function renderCell(f: Field, v: unknown) {
  if (f.type === "relation") return <RelationLabel field={f} value={v} />;
  if (v === null || v === undefined || v === "") return "—";
  if (f.type === "money") return brl(Number(v));
  if (f.type === "date") return fmtDate(String(v));
  if (f.type === "switch") return v ? <Badge>Sim</Badge> : <Badge variant="secondary">Não</Badge>;
  if (f.type === "select") return <Badge variant="outline">{String(v)}</Badge>;
  return String(v);
}

export function CrudPage({
  table,
  title,
  subtitle,
  fields,
  orderBy = "created_at",
  searchKeys,
  defaults = {},
  filter,
  rowActions,
}: {
  table: string;
  title: string;
  subtitle?: string;
  fields: Field[];
  orderBy?: string;
  searchKeys?: string[];
  defaults?: Record<string, unknown>;
  filter?: { key: string; options: string[] };
  rowActions?: (r: Row) => ReactNode;
}) {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [fv, setFv] = useState("");
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [saving, setSaving] = useState(false);

  const { data = [], isLoading } = useQuery({
    queryKey: [table],
    queryFn: async () => {
      const { data, error } = await db.from(table).select("*").order(orderBy, { ascending: false });
      if (error) throw error;
      return data as Row[];
    },
  });

  const keys = searchKeys ?? [fields[0].name];
  const rows = useMemo(
    () =>
      data.filter(
        (r) =>
          (!q || keys.some((k) => String(r[k] ?? "").toLowerCase().includes(q.toLowerCase()))) &&
          (!fv || !filter || r[filter.key] === fv),
      ),
    [data, q, fv, keys, filter],
  );
  const listFields = fields.filter((f) => f.list);

  async function save() {
    if (!editing) return;
    for (const f of fields)
      if (f.required && !editing[f.name] && editing[f.name] !== 0) return toast.error(`Preencha: ${f.label}`);
    setSaving(true);
    const payload: Record<string, unknown> = {};
    for (const f of fields) {
      let v = editing[f.name];
      if (v === "" || v === undefined) v = null;
      if ((f.type === "number" || f.type === "money") && v !== null) v = Number(v);
      if (f.type === "switch") v = !!v;
      payload[f.name] = v;
    }
    const res = editing.id
      ? await db.from(table).update(payload).eq("id", editing.id)
      : await db.from(table).insert(payload);
    setSaving(false);
    if (res.error) return toast.error(res.error.message);
    toast.success("Salvo com sucesso");
    setEditing(null);
    qc.invalidateQueries({ queryKey: [table] });
    qc.invalidateQueries({ queryKey: ["rel", table] });
    qc.invalidateQueries({ queryKey: ["dashboard"] });
  }

  async function remove(id: string) {
    if (!confirm("Excluir este registro?")) return;
    const { error } = await db.from(table).delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Excluído");
    qc.invalidateQueries({ queryKey: [table] });
  }

  const set = (k: string, v: unknown) => setEditing((e) => ({ ...(e ?? {}), [k]: v }));

  return (
    <div>
      <PageHeader
        title={title}
        subtitle={subtitle}
        action={
          <Button onClick={() => setEditing({ ...defaults })}>
            <Plus className="mr-1 h-4 w-4" /> Novo
          </Button>
        }
      />
      <div className="mb-4 flex flex-wrap gap-2">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Buscar..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        {filter && (
          <select
            className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground"
            value={fv}
            onChange={(e) => setFv(e.target.value)}
          >
            <option value="">Todos</option>
            {filter.options.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        )}
      </div>
      <div className="panel overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
              {listFields.map((f) => (
                <th key={f.name} className="px-4 py-3 font-medium">
                  {f.label}
                </th>
              ))}
              <th className="w-24" />
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td className="px-4 py-6 text-muted-foreground" colSpan={99}>
                  Carregando...
                </td>
              </tr>
            )}
            {!isLoading && rows.length === 0 && (
              <tr>
                <td className="px-4 py-10 text-center text-muted-foreground" colSpan={99}>
                  Nenhum registro encontrado.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-border/60 last:border-0 hover:bg-muted/30">
                {listFields.map((f, i) => (
                  <td key={f.name} className={`px-4 py-3 ${i === 0 ? "font-medium text-foreground" : "text-muted-foreground"}`}>
                    {renderCell(f, r[f.name])}
                    {i === 0 && r.is_demo === true && (
                      <Badge variant="secondary" className="ml-2 text-[10px]">demo</Badge>
                    )}
                  </td>
                ))}
                <td className="px-2 py-2 text-right whitespace-nowrap">
                  {rowActions?.(r)}
                  <Button size="icon" variant="ghost" onClick={() => setEditing(r)} aria-label="Editar">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => remove(r.id)} aria-label="Excluir">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Editar" : "Novo"} — {title}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            {fields.map((f) => {
              const v = editing?.[f.name];
              return (
                <div key={f.name} className={f.full || f.type === "textarea" ? "sm:col-span-2" : ""}>
                  <Label className="mb-1.5 block text-xs text-muted-foreground">
                    {f.label}
                    {f.required && " *"}
                  </Label>
                  {f.type === "textarea" ? (
                    <Textarea rows={3} value={String(v ?? "")} onChange={(e) => set(f.name, e.target.value)} />
                  ) : f.type === "select" ? (
                    <select
                      className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
                      value={String(v ?? "")}
                      onChange={(e) => set(f.name, e.target.value)}
                    >
                      <option value="">—</option>
                      {f.options!.map((o) => (
                        <option key={o}>{o}</option>
                      ))}
                    </select>
                  ) : f.type === "relation" ? (
                    <RelationSelect field={f} value={String(v ?? "")} onChange={(x) => set(f.name, x)} />
                  ) : f.type === "switch" ? (
                    <div className="pt-1">
                      <Switch checked={!!v} onCheckedChange={(c) => set(f.name, c)} />
                    </div>
                  ) : (
                    <Input
                      type={f.type === "number" || f.type === "money" ? "number" : f.type === "date" ? "date" : "text"}
                      step="any"
                      value={v === null || v === undefined ? "" : String(v).slice(0, f.type === "date" ? 10 : undefined)}
                      onChange={(e) => set(f.name, e.target.value)}
                    />
                  )}
                </div>
              );
            })}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancelar
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
