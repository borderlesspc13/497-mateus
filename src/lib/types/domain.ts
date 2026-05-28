export type VendaStatus = "ATIVO" | "INADIMPLENTE" | "CANCELADO";

export type StatusInconsistencia = "CONSISTENTE" | "INCONSISTENTE";

export type TipoRegistroAtendimento = "COBRANCA" | "POS_VENDA" | "INCONSISTENCIA";

export type HistoricoAtendimentoUniversalRow = {
  id: string;
  dataRegistro: string;
  tipoRegistro: TipoRegistroAtendimento;
  observacao: string;
};

export type ChecklistAtivacao = {
  documentacaoRecebida: boolean;
  taxaPaga: boolean;
  contratoAssinado: boolean;
};

export type HistoricoAtendimentoTipo = "chamada" | "email" | "nota" | "atualizacao";

export type HistoricoAtendimentoRow = {
  id: string;
  data: string;
  tipo: HistoricoAtendimentoTipo;
  descricao: string;
};

export type AdministradoraRow = {
  id: string;
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

export type AdministradoraMini = { id: string; nome: string; cnpj: string };

export type PlanoRow = {
  id: string;
  administradoraId: string;
  administradora: AdministradoraMini;
  nome: string;
  tipoBem: string;
  valorCreditoCentavos: number | null;
  regrasComissaoJson: string | null;
  regrasRecebimentoJson: string | null;
  regrasEstornoJson: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PlanoMini = { id: string; nome: string; tipoBem: string };

export type ConsorciadoRow = {
  id: string;
  nome: string;
  cpf_cnpj: string;
  telefone: string;
  email: string;
  criadoEm: string;
};

export type ConsorciadoMini = { id: string; nome: string; cpf_cnpj: string };

export type EquipeRow = {
  id: string;
  nome: string;
  createdAt: string;
  updatedAt: string;
};

export type EquipeMini = { id: string; nome: string };

export type VendedorRow = {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  equipeId: string;
  equipe: EquipeMini;
  createdAt: string;
  updatedAt: string;
};

export type VendedorMini = { id: string; nome: string; equipeId: string };

export type VendaRow = {
  id: string;
  administradoraId: string;
  planoId: string | null;
  consorciadoId: string | null;
  equipeId: string;
  vendedorId: string;
  administradora: AdministradoraMini;
  plano: PlanoMini | null;
  consorciado: ConsorciadoMini | null;
  equipe: EquipeMini | null;
  vendedor: VendedorMini | null;
  status: VendaStatus;
  statusInconsistencia: StatusInconsistencia;
  contrato: string;
  grupo: string;
  cota: string;
  dataVencimento: number;
  titulo: string;
  descricao: string | null;
  valorCentavos: number | null;
  dataVenda: string | null;
  observacoes: string | null;
  checklistAtivacao: ChecklistAtivacao;
  dataPendencia: string | null;
  alertaAtivo: boolean;
  createdAt: string;
  updatedAt: string;
};

export type DashboardCounts = {
  nAdministradoras: number;
  nPlanos: number;
  nVendas: number;
  nVendasAtivas: number;
};

export type DashboardVendaResumo = {
  id: string;
  titulo: string;
  status: VendaStatus;
  valorCentavos: number | null;
  dataVenda: string | null;
  consorciadoNome: string | null;
  administradoraNome: string;
};

export type DashboardMesResumo = {
  key: string;
  label: string;
  quantidade: number;
  valorCentavos: number;
};

export type DashboardAdmResumo = {
  id: string;
  nome: string;
  quantidade: number;
  valorCentavos: number;
};

export type DashboardStats = {
  nConsorciados: number;
  nAdministradoras: number;
  nPlanos: number;
  nVendas: number;
  nVendasAtivas: number;
  nVendasInadimplentes: number;
  nVendasCanceladas: number;
  valorTotalCentavos: number;
  valorAtivasCentavos: number;
  ticketMedioCentavos: number | null;
  vendasPorMes: DashboardMesResumo[];
  vendasRecentes: DashboardVendaResumo[];
  vendasPorAdministradora: DashboardAdmResumo[];
};
