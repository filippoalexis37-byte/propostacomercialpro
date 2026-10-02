import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { db, brl, fmtDate } from "@/lib/db";

type Settings = { company_name?: string | null; cnpj?: string | null; whatsapp?: string | null; phone?: string | null; email?: string | null; website?: string | null; document_footer?: string | null; pix_key?: string | null };

async function getSettings(): Promise<Settings> {
  const { data } = await db.from("settings").select("*").limit(1).maybeSingle();
  return data ?? { company_name: "Santos MktPro" };
}

const BLUE: [number, number, number] = [201, 162, 39];
const GOLD = BLUE;
const DARK: [number, number, number] = [18, 16, 12];

const imgCache: Record<string, string> = {};
async function loadImg(url: string): Promise<string | null> {
  if (imgCache[url]) return imgCache[url];
  try {
    const b = await (await fetch(url)).blob();
    const d = await new Promise<string>((r) => { const f = new FileReader(); f.onload = () => r(String(f.result)); f.readAsDataURL(b); });
    return (imgCache[url] = d);
  } catch { return null; }
}
let LOGO: string | null = null;
async function prep() { LOGO = await loadImg("/logo-santos.jpg"); }

function header(doc: jsPDF, s: Settings, title: string, number?: number) {
  const w = doc.internal.pageSize.getWidth();
  doc.setFillColor(...DARK);
  doc.rect(0, 0, w, 32, "F");
  doc.setFillColor(...GOLD);
  doc.rect(0, 32, w, 1.5, "F");
  const x0 = LOGO ? 38 : 14;
  if (LOGO) doc.addImage(LOGO, "JPEG", 10, 4, 24, 24);
  doc.setTextColor(...GOLD);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(s.company_name || "Santos MktPro", x0, 15);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(230, 220, 190);
  const info = [s.cnpj && `CNPJ ${s.cnpj}`, s.whatsapp || s.phone, s.email, s.website].filter(Boolean).join("  •  ");
  doc.text(info, x0, 23);
  doc.setTextColor(...GOLD);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text(title + (number ? ` Nº ${String(number).padStart(4, "0")}` : ""), w - 14, 15, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(230, 220, 190);
  doc.text(new Date().toLocaleDateString("pt-BR"), w - 14, 23, { align: "right" });
  doc.setTextColor(30, 30, 30);
}

function footer(doc: jsPDF, s: Settings) {
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  const t = [s.document_footer, s.pix_key && `PIX: ${s.pix_key}`].filter(Boolean).join("  •  ");
  if (t) doc.text(doc.splitTextToSize(t, w - 28), w / 2, h - 12, { align: "center" });
}

function section(doc: jsPDF, y: number, title: string, body: string) {
  const w = doc.internal.pageSize.getWidth();
  if (y > 250) { doc.addPage(); y = 20; }
  doc.setFillColor(...BLUE);
  doc.rect(14, y - 4, 3, 6, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(title, 20, y + 1);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const lines = doc.splitTextToSize(body || "—", w - 28);
  let yy = y + 9;
  for (const l of lines) {
    if (yy > 275) { doc.addPage(); yy = 20; }
    doc.text(l, 14, yy);
    yy += 5;
  }
  return yy + 6;
}

export type ProposalItem = { name: string; price: number; qty: number };
export type Proposal = {
  number?: number; client_name: string; company?: string | null; niche_name?: string;
  items: ProposalItem[]; bottlenecks?: string | null; solution?: string | null;
  discount_percent: number; total: number; valid_until?: string | null; notes?: string | null;
};

export async function proposalPdf(p: Proposal) {
  const s = await getSettings();
  await prep();
  const doc = new jsPDF();
  header(doc, s, "PROPOSTA COMERCIAL", p.number);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(`Cliente: ${p.client_name}`, 14, 44);
  doc.setFont("helvetica", "normal");
  if (p.company) doc.text(`Empresa: ${p.company}`, 14, 50);
  if (p.niche_name) doc.text(`Segmento: ${p.niche_name}`, 14, 56);
  let y = 68;
  y = section(doc, y, `Gargalos identificados${p.niche_name ? ` — ${p.niche_name}` : ""}`, p.bottlenecks ?? "");
  y = section(doc, y, "Nossa solução", p.solution ?? "");
  const subtotal = p.items.reduce((a, i) => a + i.price * i.qty, 0);
  autoTable(doc, {
    startY: y,
    head: [["Serviço", "Qtd", "Valor unit.", "Total"]],
    body: p.items.map((i) => [i.name, String(i.qty), brl(i.price), brl(i.price * i.qty)]),
    foot: [
      ["", "", "Subtotal", brl(subtotal)],
      ...(p.discount_percent ? [["", "", `Desconto (${p.discount_percent}%)`, "- " + brl(subtotal - p.total)]] : []),
      ["", "", "TOTAL", brl(p.total)],
    ],
    headStyles: { fillColor: DARK, textColor: GOLD },
    footStyles: { fillColor: [250, 243, 220], textColor: DARK, fontStyle: "bold" },
    columnStyles: { 1: { halign: "center" }, 2: { halign: "right" }, 3: { halign: "right" } },
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = (doc as any).lastAutoTable.finalY + 12;
  if (p.notes) y = section(doc, y, "Condições e observações", p.notes);
  if (p.valid_until) { doc.setFontSize(10); doc.text(`Proposta válida até ${fmtDate(p.valid_until)}.`, 14, y); }
  footer(doc, s);
  doc.save(`proposta-${p.client_name.replace(/\s+/g, "-").toLowerCase()}.pdf`);
}

export type Receipt = {
  number?: number; client_name: string; client_document?: string | null; amount: number;
  description?: string | null; payment_method: string; paid_at: string;
};

export async function receiptPdf(r: Receipt) {
  const s = await getSettings();
  await prep();
  const doc = new jsPDF();
  const w = doc.internal.pageSize.getWidth();
  header(doc, s, "RECIBO", r.number);
  doc.setFillColor(250, 243, 220);
  doc.roundedRect(w - 84, 42, 70, 18, 3, 3, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(brl(r.amount), w - 49, 54, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  const text =
    `Recebemos de ${r.client_name}${r.client_document ? `, CPF/CNPJ ${r.client_document}` : ""}, ` +
    `a importância de ${brl(r.amount)}, referente a ${r.description || "serviços prestados"}, ` +
    `paga via ${r.payment_method} em ${fmtDate(r.paid_at)}.`;
  doc.text(doc.splitTextToSize(text, w - 28), 14, 78);
  doc.text("Para clareza, firmamos o presente recibo.", 14, 104);
  const sig = await loadImg("/assinatura.png");
  if (sig) doc.addImage(sig, "PNG", w / 2 - 35, 132, 70, 11.4);
  doc.setDrawColor(...GOLD);
  doc.line(w / 2 - 50, 150, w / 2 + 50, 150);
  doc.text("Lucas Santos — " + (s.company_name || "Santos MktPro"), w / 2, 156, { align: "center" });
  if (s.cnpj) doc.text(`CNPJ ${s.cnpj}`, w / 2, 162, { align: "center" });
  footer(doc, s);
  doc.save(`recibo-${r.client_name.replace(/\s+/g, "-").toLowerCase()}.pdf`);
}

export type DocSection = { title: string; body?: string; table?: { head: string[]; rows: string[][] } };

export async function documentPdf(opts: { title: string; subtitle?: string; client: string; sections: DocSection[]; filename: string; signature?: boolean }) {
  const s = await getSettings();
  await prep();
  const doc = new jsPDF();
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  // cover
  doc.setFillColor(...DARK); doc.rect(0, 0, w, h, "F");
  if (LOGO) doc.addImage(LOGO, "JPEG", w / 2 - 30, 40, 60, 60);
  doc.setTextColor(...GOLD); doc.setFont("helvetica", "bold"); doc.setFontSize(22);
  doc.text(doc.splitTextToSize(opts.title.toUpperCase(), w - 40), w / 2, 125, { align: "center" });
  doc.setFontSize(16); doc.setTextColor(240, 230, 200);
  doc.text(opts.client, w / 2, 150, { align: "center" });
  doc.setFont("helvetica", "normal"); doc.setFontSize(11);
  if (opts.subtitle) doc.text(opts.subtitle, w / 2, 160, { align: "center" });
  doc.text(new Date().toLocaleDateString("pt-BR"), w / 2, 170, { align: "center" });
  doc.setFillColor(...GOLD); doc.rect(w / 2 - 30, 180, 60, 0.8, "F");
  doc.text("Consultor: Lucas Santos  •  " + (s.company_name || "Santos MktPro"), w / 2, h - 30, { align: "center" });
  doc.addPage();
  header(doc, s, opts.title.length > 28 ? "DOCUMENTO" : opts.title.toUpperCase());
  let y = 46;
  for (const sec of opts.sections) {
    if (sec.body !== undefined) y = section(doc, y, sec.title, sec.body);
    if (sec.table) {
      if (sec.body === undefined) y = section(doc, y, sec.title, "");
      autoTable(doc, { startY: y - 8, head: [sec.table.head], body: sec.table.rows, headStyles: { fillColor: DARK, textColor: GOLD }, styles: { fontSize: 8.5 } });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      y = (doc as any).lastAutoTable.finalY + 12;
    }
  }
  if (opts.signature) {
    if (y > 240) { doc.addPage(); y = 30; }
    const sig = await loadImg("/assinatura.png");
    if (sig) doc.addImage(sig, "PNG", 14, y + 4, 60, 9.8);
    doc.setDrawColor(...GOLD); doc.line(14, y + 18, 90, y + 18); doc.line(w - 90, y + 18, w - 14, y + 18);
    doc.setFontSize(9); doc.setTextColor(60, 60, 60);
    doc.text("Lucas Santos — Santos MktPro", 14, y + 23); doc.text("De acordo — " + opts.client, w - 90, y + 23);
  }
  const pages = doc.getNumberOfPages();
  for (let i = 2; i <= pages; i++) { doc.setPage(i); footer(doc, s); }
  doc.save(opts.filename);
}
