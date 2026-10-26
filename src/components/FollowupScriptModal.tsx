import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Copy, MessageSquare, ExternalLink, Check, Sparkles } from "lucide-react";
import { normalizePhone, formatPhoneDisplay } from "@/lib/phone";
import { SCRIPT_MODELS, generateScript, selectBestScriptModel } from "@/lib/scriptGenerator";

interface FollowupScriptModalProps {
  company: any;
  open: boolean;
  onClose: () => void;
  onOpenRegister?: (messageUsed: string) => void;
}

export function FollowupScriptModal({ company, open, onClose, onOpenRegister }: FollowupScriptModalProps) {
  const [selectedModel, setSelectedModel] = useState<string>("B");
  const [message, setMessage] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (company && open) {
      const best = selectBestScriptModel(company);
      setSelectedModel(best);
      setMessage(generateScript(company, best));
      setCopied(false);
    }
  }, [company, open]);

  const handleModelChange = (modelId: string) => {
    setSelectedModel(modelId);
    setMessage(generateScript(company, modelId));
    setCopied(false);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      toast.success("Mensagem copiada para a área de transferência!");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("Não foi possível copiar o texto.");
    }
  };

  const openWhatsApp = () => {
    const raw = company?.whatsapp || company?.phone;
    const phone = normalizePhone(raw);
    if (!phone) {
      toast.error("Número de telefone/WhatsApp não cadastrado ou inválido.");
      return;
    }
    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/${phone}?text=${encoded}`, "_blank");
    toast.info("WhatsApp aberto em nova aba.");
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <DialogTitle>Script de Follow-up — {company?.name}</DialogTitle>
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-muted-foreground">
            {company?.niche && <Badge variant="outline">{company.niche}</Badge>}
            <span>Telefone: {formatPhoneDisplay(company?.whatsapp || company?.phone)}</span>
            {company?.prospecting_status && <span>• Status: {company.prospecting_status}</span>}
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Seletor de Modelo */}
          <div>
            <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Escolher Modelo de Abordagem (A até H)
            </Label>
            <select
              value={selectedModel}
              onChange={(e) => handleModelChange(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {Object.values(SCRIPT_MODELS).map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} — ({m.category})
                </option>
              ))}
            </select>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {SCRIPT_MODELS[selectedModel]?.description}
            </p>
          </div>

          {/* Editor da Mensagem */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <Label className="text-xs font-medium text-muted-foreground">
                Mensagem Sugerida (você pode editar antes de enviar)
              </Label>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                onClick={copyToClipboard}
              >
                {copied ? <Check className="h-3.5 w-3.5 mr-1 text-green-600" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                {copied ? "Copiado!" : "Copiar"}
              </Button>
            </div>
            <Textarea
              rows={6}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="font-mono text-sm leading-relaxed"
            />
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 pt-2 border-t border-border">
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
            Fechar
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={copyToClipboard}
            className="w-full sm:w-auto"
          >
            <Copy className="h-4 w-4 mr-1.5" />
            Copiar Script
          </Button>

          <Button
            type="button"
            className="bg-emerald-600 hover:bg-emerald-700 text-white w-full sm:w-auto"
            onClick={openWhatsApp}
          >
            <MessageSquare className="h-4 w-4 mr-1.5" />
            Abrir WhatsApp
          </Button>

          {onOpenRegister && (
            <Button
              type="button"
              onClick={() => {
                onClose();
                onOpenRegister(message);
              }}
              className="w-full sm:w-auto"
            >
              Registrar Contato
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
