import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { MessageSquare, FileText, Copy, PlusCircle, Calendar, History } from "lucide-react";
import { normalizePhone } from "@/lib/phone";
import { generateScript } from "@/lib/scriptGenerator";

interface FollowupActionsProps {
  company: any;
  onOpenScript: (company: any) => void;
  onOpenRegister: (company: any) => void;
  onOpenSchedule: (company: any) => void;
  onOpenHistory: (company: any) => void;
}

export function FollowupActions({
  company,
  onOpenScript,
  onOpenRegister,
  onOpenSchedule,
  onOpenHistory,
}: FollowupActionsProps) {
  const handleWhatsApp = () => {
    const raw = company?.whatsapp || company?.phone;
    const phone = normalizePhone(raw);
    if (!phone) {
      toast.error("Telefone/WhatsApp não disponível ou inválido.");
      return;
    }
    const defaultMsg = generateScript(company);
    const encoded = encodeURIComponent(defaultMsg);
    window.open(`https://wa.me/${phone}?text=${encoded}`, "_blank");
    toast.info("WhatsApp aberto!");
  };

  const handleCopyMessage = async () => {
    try {
      const msg = generateScript(company);
      await navigator.clipboard.writeText(msg);
      toast.success("Script de mensagem copiado!");
    } catch {
      toast.error("Erro ao copiar para a área de transferência.");
    }
  };

  return (
    <div className="flex items-center gap-1">
      {/* 1. WhatsApp */}
      <Button
        variant="outline"
        size="sm"
        className="h-8 px-2 text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
        title="Abrir WhatsApp com mensagem recomendada"
        onClick={handleWhatsApp}
      >
        <MessageSquare className="h-3.5 w-3.5 mr-1" />
        WhatsApp
      </Button>

      {/* 2. Script */}
      <Button
        variant="outline"
        size="sm"
        className="h-8 px-2 text-indigo-600 border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
        title="Ver e personalizar script de abordagem"
        onClick={() => onOpenScript(company)}
      >
        <FileText className="h-3.5 w-3.5 mr-1" />
        Script
      </Button>

      {/* 3. Copiar */}
      <Button
        variant="outline"
        size="sm"
        className="h-8 px-2 text-muted-foreground hover:text-foreground"
        title="Copiar mensagem sugerida rapidamente"
        onClick={handleCopyMessage}
      >
        <Copy className="h-3.5 w-3.5 mr-1" />
        Copiar
      </Button>

      {/* 4. Registrar */}
      <Button
        variant="outline"
        size="sm"
        className="h-8 px-2 text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700 font-medium"
        title="Registrar retorno ou nova tentativa"
        onClick={() => onOpenRegister(company)}
      >
        <PlusCircle className="h-3.5 w-3.5 mr-1" />
        Registrar
      </Button>

      {/* 5. Agendar */}
      <Button
        variant="outline"
        size="sm"
        className="h-8 px-2 text-amber-600 border-amber-200 hover:bg-amber-50 hover:text-amber-700"
        title="Agendar data do próximo contato"
        onClick={() => onOpenSchedule(company)}
      >
        <Calendar className="h-3.5 w-3.5 mr-1" />
        Agendar
      </Button>

      {/* 6. Histórico */}
      <Button
        variant="ghost"
        size="sm"
        className="h-8 px-2 text-slate-500 hover:text-slate-800"
        title="Ver todas as interações e histórico"
        onClick={() => onOpenHistory(company)}
      >
        <History className="h-3.5 w-3.5 mr-1" />
        Histórico
      </Button>
    </div>
  );
}
