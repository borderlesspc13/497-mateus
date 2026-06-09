import type { VendaStatus } from "@/lib/types/domain";

type WhatsAppTemplateInput = {
  nomeCliente: string;
  contrato: string;
  statusVenda: VendaStatus;
};

const STATUS_LABELS: Record<VendaStatus, string> = {
  ATIVO: "ativo",
  INADIMPLENTE: "inadimplente",
  CANCELADO: "cancelado",
};

export function buildWhatsAppMessage({
  nomeCliente,
  contrato,
  statusVenda,
}: WhatsAppTemplateInput): string {
  const nome = nomeCliente.trim() || "cliente";
  const contratoRef = contrato.trim() || "seu contrato";

  if (statusVenda === "INADIMPLENTE") {
    return `Olá ${nome}, vimos que a sua cota referente ao contrato ${contratoRef} possui uma pendência de pagamento. Podemos ajudá-lo(a) a regularizar a situação?`;
  }

  if (statusVenda === "CANCELADO") {
    return `Olá ${nome}, entramos em contato sobre a cota do contrato ${contratoRef}, que consta como cancelada. Caso precise de esclarecimentos, estamos à disposição.`;
  }

  return `Olá ${nome}, entramos em contato sobre a sua cota referente ao contrato ${contratoRef} (status: ${STATUS_LABELS[statusVenda]}). Podemos conversar?`;
}

export function buildWhatsAppUrl(phone: string, message: string): string {
  const params = new URLSearchParams({
    phone,
    text: message,
  });
  return `https://api.whatsapp.com/send?${params.toString()}`;
}
