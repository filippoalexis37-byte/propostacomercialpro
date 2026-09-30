import { createFileRoute } from "@tanstack/react-router";
import { FileDown } from "lucide-react";
import { CrudPage } from "@/components/crud-page";
import { Button } from "@/components/ui/button";
import { pageHead } from "@/lib/meta";
import { receiptPdf, type Receipt } from "@/lib/pdf";

export const Route = createFileRoute("/_authenticated/recibos")({
  head: pageHead("Recibos", "Emissão de recibos em PDF."),
  component: () => (
    <CrudPage
      table="receipts"
      title="Recibos"
      subtitle="Registre pagamentos e baixe o recibo em PDF."
      searchKeys={["client_name", "description"]}
      defaults={{ payment_method: "PIX", paid_at: new Date().toISOString().slice(0, 10) }}
      rowActions={(r) => (
        <Button size="icon" variant="ghost" aria-label="Baixar PDF" onClick={() => receiptPdf(r as unknown as Receipt)}>
          <FileDown className="h-4 w-4 text-primary" />
        </Button>
      )}
      fields={[
        { name: "number", label: "Nº", list: true, type: "number" },
        { name: "client_name", label: "Cliente", required: true, list: true },
        { name: "client_document", label: "CPF/CNPJ" },
        { name: "amount", label: "Valor", type: "money", required: true, list: true },
        { name: "payment_method", label: "Forma de pagamento", type: "select", options: ["PIX", "Dinheiro", "Cartão", "Boleto", "Transferência"], list: true },
        { name: "paid_at", label: "Data do pagamento", type: "date", required: true, list: true },
        { name: "description", label: "Referente a", type: "textarea" },
      ]}
    />
  ),
});
