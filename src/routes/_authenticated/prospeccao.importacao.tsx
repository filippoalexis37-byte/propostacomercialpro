// @ts-nocheck
/**
 * IMPORTAÇÃO DE EMPRESAS (CSV)
 * Detecta duplicatas antes de importar.
 */
import { useState, useCallback } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { pageHead } from "@/lib/meta";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/crud-page";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Upload, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/prospeccao/importacao")({
  head: pageHead("Importação de Leads", "Importe empresas via CSV com detecção de duplicatas."),
  component: ImportacaoLeads,
});

type ParsedRow = {
  name: string;
  trade_name?: string;
  niche?: string;
  city?: string;
  state?: string;
  address?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  website?: string;
  instagram?: string;
  cnpj?: string;
  prospecting_source?: string;
  isDuplicate?: boolean;
  duplicateReason?: string;
};

const CSV_FIELD_MAP: Record<string, string> = {
  // Português
  nome: "name", empresa: "name", "razão social": "name", "razao social": "name",
  "nome fantasia": "trade_name",
  nicho: "niche",
  cidade: "city",
  estado: "state", uf: "state",
  endereço: "address", endereco: "address",
  telefone: "phone",
  whatsapp: "whatsapp",
  "e-mail": "email", email: "email",
  site: "website", website: "website",
  instagram: "instagram",
  cnpj: "cnpj",
  origem: "prospecting_source",
  // Inglês
  "company name": "name",
  phone: "phone",
  address: "address",
  source: "prospecting_source",
};

function parseCSV(text: string): ParsedRow[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim().replace(/^["']|["']$/g, "").toLowerCase());
  return lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim().replace(/^["']|["']$/g, ""));
    const row: any = {};
    headers.forEach((h, i) => {
      const field = CSV_FIELD_MAP[h];
      if (field) row[field] = values[i] || undefined;
    });
    return row as ParsedRow;
  }).filter((r) => r.name);
}

function ImportacaoLeads() {
  const qc = useQueryClient();
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [done, setDone] = useState<{ imported: number; skipped: number } | null>(null);

  const { data: existing = [] } = useQuery({
    queryKey: ["companies-for-import"],
    queryFn: async () => {
      const { data } = await db.from("companies").select("name, cnpj, phone, whatsapp, email");
      return data ?? [];
    },
  });

  const handleFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const parsed = parseCSV(text);

      // Detectar duplicatas
      const cnpjSet = new Set(existing.map((c: any) => c.cnpj?.replace(/\D/g, "")).filter(Boolean));
      const phoneSet = new Set(existing.map((c: any) => c.phone?.replace(/\D/g, "")).filter(Boolean));
      const waSet = new Set(existing.map((c: any) => c.whatsapp?.replace(/\D/g, "")).filter(Boolean));
      const emailSet = new Set(existing.map((c: any) => c.email?.toLowerCase()).filter(Boolean));

      const marked = parsed.map((r) => {
        let reason = "";
        if (r.cnpj && cnpjSet.has(r.cnpj.replace(/\D/g, ""))) reason = "CNPJ já cadastrado";
        else if (r.phone && phoneSet.has(r.phone.replace(/\D/g, ""))) reason = "Telefone já cadastrado";
        else if (r.whatsapp && waSet.has(r.whatsapp.replace(/\D/g, ""))) reason = "WhatsApp já cadastrado";
        else if (r.email && emailSet.has(r.email.toLowerCase())) reason = "E-mail já cadastrado";
        return { ...r, isDuplicate: !!reason, duplicateReason: reason };
      });

      setRows(marked);
      setDone(null);
    };
    reader.readAsText(file);
  }, [existing]);

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file?.name.endsWith(".csv")) handleFile(file);
    else toast.error("Selecione um arquivo CSV.");
  }

  function onInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  const newRows = rows.filter((r) => !r.isDuplicate);
  const dupRows = rows.filter((r) => r.isDuplicate);

  async function importNew() {
    if (newRows.length === 0) return toast.info("Nenhuma empresa nova para importar.");
    setImporting(true);
    try {
      const payload = newRows.map((r) => ({
        name: r.name,
        trade_name: r.trade_name || null,
        niche: r.niche || null,
        city: r.city || null,
        state: r.state || null,
        address: r.address || null,
        phone: r.phone || null,
        whatsapp: r.whatsapp || null,
        email: r.email || null,
        website: r.website || null,
        instagram: r.instagram || null,
        cnpj: r.cnpj || null,
        prospecting_source: r.prospecting_source || "Lista importada",
        prospecting_status: "Não prospectado",
      }));
      const { error } = await db.from("companies").insert(payload);
      if (error) throw error;
      toast.success(`${newRows.length} empresa(s) importada(s) com sucesso!`);
      setDone({ imported: newRows.length, skipped: dupRows.length });
      setRows([]);
      qc.invalidateQueries({ queryKey: ["companies-for-import"] });
      qc.invalidateQueries({ queryKey: ["companies-not-prospected"] });
      qc.invalidateQueries({ queryKey: ["companies-prospecting"] });
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao importar.");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Importação de Empresas"
        subtitle="Importe empresas via arquivo CSV. Duplicatas são detectadas automaticamente."
      />

      {/* Aviso de futuras integrações */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
        <p className="text-sm text-blue-800">
          <strong>Integrações futuras:</strong> Conexão com Google Maps, ZapData, APIs de dados empresariais e extensões de coleta estão <strong>planejadas</strong> mas ainda não configuradas.
          Por enquanto, importe empresas via CSV.
        </p>
      </div>

      {/* Modelo CSV */}
      <div className="panel p-4">
        <p className="text-sm font-medium text-foreground mb-2">Campos suportados no CSV:</p>
        <div className="flex flex-wrap gap-1">
          {["nome", "empresa", "nome_fantasia", "nicho", "cidade", "estado", "endereço", "telefone", "whatsapp", "email", "site", "instagram", "cnpj", "origem"].map((f) => (
            <Badge key={f} variant="secondary" className="text-[10px] font-mono">{f}</Badge>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2">A primeira linha deve ser o cabeçalho. Separador: vírgula.</p>
      </div>

      {/* Área de upload */}
      {rows.length === 0 && !done && (
        <div
          className="panel border-2 border-dashed border-border p-12 text-center cursor-pointer hover:border-primary/50 transition-colors"
          onDrop={onDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => document.getElementById("csv-input")?.click()}
        >
          <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="font-medium text-foreground">Arraste um arquivo CSV aqui</p>
          <p className="text-sm text-muted-foreground mt-1">ou clique para selecionar</p>
          <input id="csv-input" type="file" accept=".csv" className="hidden" onChange={onInput} />
        </div>
      )}

      {/* Resultado após importação */}
      {done && (
        <div className="panel p-6 text-center space-y-2">
          <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto" />
          <div className="font-display text-xl font-semibold text-foreground">Importação concluída!</div>
          <div className="text-sm text-muted-foreground">
            <span className="text-green-600 font-medium">{done.imported} novas</span> importadas ·{" "}
            <span className="text-amber-600 font-medium">{done.skipped} duplicatas</span> ignoradas
          </div>
          <Button variant="outline" className="mt-2" onClick={() => setDone(null)}>Importar outro arquivo</Button>
        </div>
      )}

      {/* Prévia */}
      {rows.length > 0 && (
        <>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium text-foreground">{newRows.length} empresa(s) nova(s)</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-medium text-foreground">{dupRows.length} possível(is) duplicata(s)</span>
            </div>
            <div className="ml-auto flex gap-2">
              <Button variant="outline" onClick={() => setRows([])}>Cancelar</Button>
              <Button onClick={importNew} disabled={importing || newRows.length === 0}>
                {importing ? "Importando..." : `Importar ${newRows.length} nova(s)`}
              </Button>
            </div>
          </div>

          <div className="panel overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Empresa</th>
                  <th className="px-3 py-2">Nicho</th>
                  <th className="px-3 py-2">Cidade</th>
                  <th className="px-3 py-2">Telefone</th>
                  <th className="px-3 py-2">WhatsApp</th>
                  <th className="px-3 py-2">E-mail</th>
                  <th className="px-3 py-2">Observação</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className={`border-b border-border/50 last:border-0 ${r.isDuplicate ? "opacity-60 bg-amber-50/50" : ""}`}>
                    <td className="px-3 py-2">
                      {r.isDuplicate
                        ? <XCircle className="h-4 w-4 text-amber-500" title="Duplicata" />
                        : <CheckCircle2 className="h-4 w-4 text-green-500" />
                      }
                    </td>
                    <td className="px-3 py-2 font-medium text-foreground">{r.name}</td>
                    <td className="px-3 py-2 text-muted-foreground">{r.niche || "—"}</td>
                    <td className="px-3 py-2 text-muted-foreground">{r.city || "—"}</td>
                    <td className="px-3 py-2 text-muted-foreground">{r.phone || "—"}</td>
                    <td className="px-3 py-2 text-muted-foreground">{r.whatsapp || "—"}</td>
                    <td className="px-3 py-2 text-muted-foreground">{r.email || "—"}</td>
                    <td className="px-3 py-2 text-xs text-amber-600">{r.duplicateReason || ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
