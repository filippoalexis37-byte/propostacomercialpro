import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { MapPin, Search, Star, Building2, UserPlus, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { db } from "@/lib/db";
import { apiPost } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Place = { id: string; name: string; address: string; phone: string; website: string; rating: number | null; reviews: number | null; maps: string; types: string };

function cityOf(addr: string) {
  const m = addr.match(/,\s*([^,-]+?)\s*-\s*([A-Z]{2})\b/);
  return m ? { city: (m[1] ?? "").trim(), state: m[2] ?? "" } : { city: "", state: "" };
}

export function PlacesSearch() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<Place[]>([]);

  async function search(e?: React.FormEvent) {
    e?.preventDefault();
    if (q.trim().length < 3) return;
    setBusy(true);
    try { setRes(await apiPost<Place[]>("/api/places", { query: q })); }
    catch (err) { toast.error((err as Error).message); }
    finally { setBusy(false); }
  }

  async function save(p: Place, asLead: boolean) {
    const { city, state } = cityOf(p.address);
    const { data: c, error } = await db.from("companies").insert({
      name: p.name, phone: p.phone, whatsapp: p.phone, website: p.website, address: p.address, city, state, niche: p.types,
      notes: `Google Maps: ${p.maps}${p.rating ? ` — nota ${p.rating} (${p.reviews} avaliações)` : ""}`,
    }).select().single();
    if (error) return void toast.error(error.message);
    if (asLead) {
      await db.from("leads").insert({ name: p.name, company_name: p.name, company_id: c.id, phone: p.phone, whatsapp: p.phone, website: p.website, city, state, niche: p.types, source: "Google Maps", status: "Lead novo" });
      qc.invalidateQueries({ queryKey: ["leads"] });
    }
    qc.invalidateQueries({ queryKey: ["companies"] });
    toast.success(asLead ? "Empresa e lead criados" : "Empresa salva");
  }

  return (
    <div className="panel mb-6 p-5">
      <div className="mb-3 flex items-center gap-2 font-display font-semibold text-foreground"><MapPin className="h-4 w-4 text-primary" /> Buscar empresa no Google Maps</div>
      <form onSubmit={search} className="flex gap-2">
        <Input placeholder='Ex.: "hamburgueria Campinas" ou nome da empresa' value={q} onChange={(e) => setQ(e.target.value)} />
        <Button type="submit" disabled={busy}><Search className="mr-1 h-4 w-4" />{busy ? "Buscando..." : "Buscar"}</Button>
      </form>
      {res.length > 0 && (
        <div className="mt-4 divide-y divide-border">
          {res.map((p) => (
            <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <div className="font-medium text-foreground">{p.name} <span className="text-xs text-muted-foreground">{p.types}</span></div>
                <div className="text-xs text-muted-foreground">{p.address}</div>
                <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
                  {p.rating && <span className="flex items-center gap-1"><Star className="h-3 w-3 text-primary" />{p.rating} ({p.reviews})</span>}
                  {p.phone && <span>{p.phone}</span>}
                  {p.website && <a className="text-primary" href={p.website} target="_blank" rel="noreferrer">site</a>}
                  <a className="flex items-center gap-1 text-primary" href={p.maps} target="_blank" rel="noreferrer">Maps <ExternalLink className="h-3 w-3" /></a>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => save(p, false)}><Building2 className="mr-1 h-3.5 w-3.5" />Salvar empresa</Button>
                <Button size="sm" onClick={() => save(p, true)}><UserPlus className="mr-1 h-3.5 w-3.5" />Virar lead</Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
