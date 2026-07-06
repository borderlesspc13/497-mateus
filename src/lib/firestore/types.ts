import type {
  ChecklistAtivacao,
  StatusInconsistencia,
  StatusOperacionalCota,
  StatusPosVenda,
  TipoRegistroAtendimento,
} from "@/lib/types/domain";

export const COLLECTIONS = {
  administradoras: "administradoras",
  planos: "planos",
  vendas: "vendas",
  consorciados: "consorciados",
  equipes: "equipes",
  vendedores: "vendedores",
  extratos: "extratos",
  repasses: "repasses",
  usuarios: "usuarios",
  logs_auditoria: "logs_auditoria",
  metas: "metas",
  realizacoes: "realizacoes",
  conquistas: "conquistas",
} as const;

export const VENDA_SUBCOLLECTIONS = {
  historico: "historico",
  historico_atendimento: "historico_atendimento",
} as const;

export type AdministradoraDoc = {
  nome: string;
  cnpj: string;
  telefone: string | null;
  email: string | null;
  contatoPrincipal: string | null;
  enderecoLogradouro: string | null;
  enderecoNumero: string | null;
  enderecoComplemento: string | null;
  enderecoBairro: string | null;
  enderecoCidade: string | null;
  enderecoUf: string | null;
  enderecoCep: string | null;
  regrasOperacionaisJson: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PlanoDoc = {
  administradoraId: string;
  nome: string;
  tipoBem: string;
  valorCreditoCentavos: number | null;
  percentualComissao: number | null;
  parcelasRecebimento: number | null;
  diasParaEstorno: number | null;
  /** Regras de repasse interno (vendedor / supervisor / diretor) em JSON. */
  regrasRepasseJson: string | null;
  /** @deprecated Use percentualComissao. Mantido para documentos legados. */
  regrasComissaoJson?: string | null;
  /** @deprecated Use parcelasRecebimento. */
  regrasRecebimentoJson?: string | null;
  /** @deprecated Use diasParaEstorno. */
  regrasEstornoJson?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type UserRole = "admin" | "gerente" | "vendedor";

export type UsuarioDoc = {
  email: string;
  displayName: string | null;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
};

export type LogAuditoriaDoc = {
  userId: string;
  acao: string;
  documentoId: string;
  dataTimestamp: string;
};

/** Status do extrato da administradora. RECEBIDO = valor creditado via importação/remessa. */
export type ExtratoStatus = "PENDENTE" | "RECEBIDO" | "LIBERADO" | "PAGO";

export type ExtratoTipo = "COMISSAO" | "ESTORNO";

export type ExtratoDoc = {
  vendaId: string;
  /** Chave matriz desnormalizada — cruzamento universal por número do contrato. */
  numeroContrato: string;
  planoId: string;
  parcelaNumero: number;
  parcelaTotal: number;
  parcelaLabel: string;
  valorCentavos: number;
  status: ExtratoStatus;
  tipo: ExtratoTipo;
  vendedorId: string;
  equipeId: string;
  createdAt: string;
  updatedAt: string;
};

/** Cadastro de pessoa — sem status operacional (fica em vendas/cota). */
export type ConsorciadoDoc = {
  nome: string;
  cpf_cnpj: string;
  telefone: string;
  email: string;
  criadoEm: string;
};

export type EquipeDoc = {
  nome: string;
  supervisorId: string | null;
  diretorId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type RepasseStatus = "PENDENTE" | "PAGO";

export type PapelRepasse = "VENDEDOR" | "SUPERVISOR" | "DIRETOR";

/** Linha do mapa de pagamento interno — gerada ao marcar extrato como RECEBIDO. */
export type RepasseDoc = {
  extratoOrigemId: string;
  vendaId: string;
  numeroContrato: string;
  planoId: string;
  parcelaNumero: number;
  parcelaTotal: number;
  parcelaLabel: string;
  papel: PapelRepasse;
  beneficiarioId: string;
  beneficiarioNome: string;
  vendedorId: string;
  equipeId: string;
  valorCentavos: number;
  percentualPapel: number;
  status: RepasseStatus;
  createdAt: string;
  updatedAt: string;
};

export type VendedorDoc = {
  nome: string;
  email: string;
  telefone: string;
  equipeId: string;
  createdAt: string;
  updatedAt: string;
};

export type HistoricoAtendimentoDoc = {
  data: string;
  tipo: "chamada" | "email" | "nota" | "atualizacao";
  descricao: string;
};

export type HistoricoAtendimentoUniversalDoc = {
  /** Chave matriz do contrato atendido. */
  numeroContrato: string;
  dataRegistro: string;
  tipoRegistro: TipoRegistroAtendimento;
  observacao: string;
};

export type VendaDoc = {
  administradoraId: string;
  planoId: string | null;
  consorciadoId: string | null;
  equipeId: string;
  vendedorId: string;
  /** Status operacional da cota — nunca no documento do consorciado. */
  statusOperacional: StatusOperacionalCota;
  /** @deprecated Espelho de statusOperacional para queries legadas. */
  status?: StatusOperacionalCota;
  statusInconsistencia: StatusInconsistencia;
  statusPosVenda: StatusPosVenda;
  parcelasPagasCancelamento: number | null;
  /** Chave matriz universal — identificador único do produto/cota. */
  numeroContrato: string;
  /** @deprecated Espelho de numeroContrato para documentos legados. */
  contrato?: string;
  /** Atributos descritivos da cota (não compõem a chave matriz). */
  grupo: string;
  cota: string;
  dataVencimento: number;
  titulo: string;
  descricao: string | null;
  valorCentavos: number | null;
  dataVenda: string | null;
  /** Mês/ano de fechamento no formato YYYY-MM. */
  mesAnoFechamento: string | null;
  /** Data do contrato usada para ordenação e paginação (dataVenda ?? createdAt). */
  dataContrato: string;
  observacoes: string | null;
  checklistAtivacao: ChecklistAtivacao;
  dataPendencia: string | null;
  alertaAtivo: boolean;
  createdAt: string;
  updatedAt: string;
};

export type DocWithId<T> = T & { id: string };

export function newId(): string {
  return crypto.randomUUID();
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function sortByCreatedAtDesc<T extends { createdAt: string }>(rows: T[]): T[] {
  return [...rows].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function sortByCriadoEmDesc<T extends { criadoEm: string }>(rows: T[]): T[] {
  return [...rows].sort(
    (a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime(),
  );
}
