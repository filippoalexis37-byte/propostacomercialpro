import { useState } from "react";
import {
  Calendar,
  Video,
  Copy,
  ExternalLink,
  Send,
  Clock,
  User,
  Mail,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  generateGoogleCalendarUrl,
  generateClientInvitationMessage,
  openWhatsAppInvite,
  type MeetingDetails,
} from "@/lib/calendar";

interface ScheduleMeetingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultClientName?: string;
  defaultClientEmail?: string;
  defaultClientPhone?: string;
  defaultTitle?: string;
}

export function ScheduleMeetingModal({
  open,
  onOpenChange,
  defaultClientName = "",
  defaultClientEmail = "",
  defaultClientPhone = "",
  defaultTitle = "",
}: ScheduleMeetingModalProps) {
  // Configura data/hora padrão para amanhã às 14:00
  const getDefaultDateTime = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(14, 0, 0, 0);
    const tzOffset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
  };

  const [title, setTitle] = useState(defaultTitle || "Reunião de Diagnóstico & Alinhamento Estratégico");
  const [clientName, setClientName] = useState(defaultClientName);
  const [clientEmail, setClientEmail] = useState(defaultClientEmail);
  const [clientPhone, setClientPhone] = useState(defaultClientPhone);
  const [startDateTime, setStartDateTime] = useState(getDefaultDateTime());
  const [duration, setDuration] = useState("45");
  const [meetLink, setMeetLink] = useState("");
  const [notes, setNotes] = useState("Alinhar objetivos de marketing, gargalos de captação e apresentação da proposta.");
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedMsg, setCopiedMsg] = useState(false);

  const meetingDetails: MeetingDetails = {
    title,
    clientName,
    clientEmail,
    clientPhone,
    startDate: startDateTime,
    durationMinutes: Number(duration) || 45,
    description: notes,
  };

  const calendarUrl = generateGoogleCalendarUrl(meetingDetails);
  const invitationMessage = generateClientInvitationMessage(meetingDetails, meetLink);

  const handleOpenGoogleCalendar = () => {
    window.open(calendarUrl, "_blank");
    toast.success("Google Agenda aberto no navegador!");
  };

  const handleCopyCalendarLink = () => {
    navigator.clipboard.writeText(calendarUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
    toast.success("Link do Google Calendar copiado!");
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(invitationMessage);
    setCopiedMsg(true);
    setTimeout(() => setCopiedMsg(false), 2000);
    toast.success("Mensagem completa de convite copiada!");
  };

  const handleSendWhatsApp = () => {
    if (!clientPhone) {
      toast.error("Informe o telefone/WhatsApp do cliente.");
      return;
    }
    openWhatsAppInvite(clientPhone, invitationMessage);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-xl">Agendar Reunião no Google Calendar</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Conectado com <span className="font-semibold text-foreground">lucasmktpro158@gmail.com</span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Dados da reunião */}
          <div className="rounded-lg border border-border bg-card/50 p-4 space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">Título da Reunião</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Reunião Estratégica Santos MktPro"
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">Nome do Cliente / Lead</Label>
                <div className="relative mt-1">
                  <User className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Nome do cliente"
                    className="pl-9"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">E-mail do Cliente (opcional)</Label>
                <div className="relative mt-1">
                  <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="cliente@email.com"
                    className="pl-9"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <Label className="text-xs text-muted-foreground">Data e Horário</Label>
                <Input
                  type="datetime-local"
                  value={startDateTime}
                  onChange={(e) => setStartDateTime(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Duração</Label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
                >
                  <option value="30">30 minutos</option>
                  <option value="45">45 minutos</option>
                  <option value="60">1 hora</option>
                  <option value="90">1h 30m</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">WhatsApp do Cliente (para envio)</Label>
                <Input
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="(11) 99999-9999"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Link fixo do Google Meet (opcional)</Label>
                <div className="relative mt-1">
                  <Video className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={meetLink}
                    onChange={(e) => setMeetLink(e.target.value)}
                    placeholder="https://meet.google.com/..."
                    className="pl-9"
                  />
                </div>
              </div>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">Pauta / Observações</Label>
              <Textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Objetivo da reunião..."
                className="mt-1"
              />
            </div>
          </div>

          {/* Ações e links gerados */}
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={handleOpenGoogleCalendar}
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Criar no Google Agenda (Gmail)
              </Button>
              <Button
                variant="outline"
                onClick={handleCopyCalendarLink}
                className="gap-2"
              >
                {copiedLink ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                Copiar Link da Agenda
              </Button>
            </div>

            {/* Mensagem pronta para o cliente */}
            <div className="rounded-lg border border-border bg-muted/40 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground">Mensagem pronta para enviar ao cliente:</span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleCopyMessage}
                    className="h-7 text-xs gap-1"
                  >
                    {copiedMsg ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                    Copiar
                  </Button>
                  {clientPhone && (
                    <Button
                      size="sm"
                      onClick={handleSendWhatsApp}
                      className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                    >
                      <Send className="h-3.5 w-3.5" />
                      Enviar no WhatsApp
                    </Button>
                  )}
                </div>
              </div>
              <pre className="whitespace-pre-wrap font-sans text-xs text-muted-foreground bg-background p-2.5 rounded border border-border/60">
                {invitationMessage}
              </pre>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
