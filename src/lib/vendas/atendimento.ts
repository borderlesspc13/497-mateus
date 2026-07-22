import type { StatusInconsistencia, TipoRegistroAtendimento } from "@/lib/types/domain";

export const TIPO_REGISTRO_LABELS: Record<TipoRegistroAtendimento, string> = {
  ATENDIMENTO: "Atendimento",
  COBRANCA: "Cobrança",
  COBRANCA_WHATSAPP: "Cobrança WhatsApp",
  POS_VENDA: "Pós-venda",
  INCONSISTENCIA: "Inconsistência",
};

export const STATUS_INCONSISTENCIA_LABELS: Record<StatusInconsistencia, string> = {
  CONSISTENTE: "Consistente",
  INCONSISTENTE: "Inconsistente",
};

export const TIPO_REGISTRO_OPTIONS: TipoRegistroAtendimento[] = [
  "ATENDIMENTO",
  "COBRANCA",
  "POS_VENDA",
  "INCONSISTENCIA",
];
