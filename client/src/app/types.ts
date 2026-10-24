export type UserRole = 'ADMIN' | 'OPERATOR' | 'BROKER';

export type Modality = 'INDICA' | 'CONECTA';

export type NavSection =
  | 'dashboard'
  | 'referrals'
  | 'duplicates'
  | 'documents'
  | 'attendances'
  | 'brokers'
  | 'developments'
  | 'developers'
  | 'sales'
  | 'reports'
  | 'users'
  | 'audit'
  | 'profile';

export interface OperatorPermissions {
  canEditBrokers: boolean;
  canEditDevelopments: boolean;
  canResolveDuplicates: boolean;
  canRegisterSales: boolean;
  canViewCommissions: boolean;
  canRegisterFinance: boolean;
  canViewAuditRestricted: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  title: string;
  active: boolean;
  lastLoginAt: string;
  avatarUrl?: string;
  brokerId?: string;
  permissions?: OperatorPermissions;
}

export interface Broker {
  id: string;
  name: string;
  email: string;
  phone: string;
  phoneNormalized: string;
  creci: string; // Ex: "CRECI-BA 28.410" ou "PARCEIRO INDICADOR"
  city: string;
  state: string;
  defaultModality: Modality;
  isFoundingMember: boolean; // "Turma Fundadora LINNK"
  adhesionTermSigned: boolean; // Termo de adesão
  ndaTermSigned: boolean; // Termo de sigilo e lealdade
  pixKey: string;
  active: boolean; // RN13: Inativação em vez de exclusão
  createdAt: string;
}

export interface Developer {
  id: string;
  name: string;
  legalName: string;
  cnpj: string;
  city: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  paymentRuleDescription: string;
  active: boolean;
}

export interface Development {
  id: string;
  developerId: string;
  name: string;
  city: string;
  neighborhood: string;
  incorporationRegistry: string; // Registro de incorporação e cartório
  affectationPatrimony: boolean; // Patrimônio de afetação (Selo LINNK)
  constructionStatus: 'PRE_LANCAMENTO' | 'LANCAMENTO' | 'EM_OBRAS' | 'PRONTO';
  defaultCommissionRate: number; // Ex: 3.0 ou 4.0 (%)
  averageTicketCents: number; // Em centavos
  linnkSealVerified: boolean;
  active: boolean;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  phoneNormalized: string;
  email: string;
  emailNormalized: string;
  city: string;
  notes?: string;
  createdAt: string;
}

/**
 * RN06: Status independentes para Indicação, Documento, Venda, Recebimento e Repasse
 */
export type ReferralStatus =
  | 'EM_ANALISE_DUPLICIDADE'
  | 'AGUARDANDO_CONSENTIMENTO'
  | 'LIBERADA_ATENDIMENTO'
  | 'EM_ATENDIMENTO'
  | 'PROPOSTA_ENVIADA'
  | 'VENDA_CONFIRMADA'
  | 'CONFLITO_REJEITADO'
  | 'ENCERRADA_SEM_VENDA';

export type DocumentStatus =
  | 'PENDENTE_GERACAO'
  | 'GERADO_AGUARDANDO_ASSINATURA'
  | 'RECEBIDO_AGUARDANDO_CONFERENCIA'
  | 'APROVADO'
  | 'REJEITADO';

export type SaleStatus = 'NAO_INICIADA' | 'EM_NEGOCIACAO' | 'CONFIRMADA' | 'DISTRATO';

export type FinancialFlowStatus = 'NAO_APLICAVEL' | 'PENDENTE' | 'PARCIAL' | 'QUITADO';

export interface Referral {
  id: string;
  code: string; // Ex: "LNK-2026-001"
  clientId: string;
  brokerId: string;
  developmentId: string;
  modality: Modality; // RN05: INDICA ou CONECTA
  assignedOperatorId: string;
  status: ReferralStatus;
  documentStatus: DocumentStatus;
  saleStatus: SaleStatus;
  receivementStatus: FinancialFlowStatus;
  payoutStatus: FinancialFlowStatus;
  duplicateOfReferralId?: string;
  duplicateResolutionNote?: string;
  duplicateResolvedById?: string;
  duplicateResolvedAt?: string;
  protectionExpiresAt: string; // Vínculo de 6 meses
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReferralDocument {
  id: string;
  referralId: string;
  templateVersion: string; // Ex: "TERMO-CONSENTIMENTO-v1.2"
  status: DocumentStatus;
  generatedAt?: string;
  GeneratedByUserId?: string;
  storageKey?: string; // Ex: "private/consent-terms/2026/LNK-2026-001-assinado.pdf"
  fileName?: string;
  receivedAt?: string;
  receivedByUserId?: string;
  reviewedAt?: string;
  reviewedByUserId?: string;
  reviewNotes?: string;
}

export type AttendanceType =
  | 'CONTATO_INICIAL'
  | 'QUALIFICACAO'
  | 'ENVIO_MATERIAL'
  | 'AGENDAMENTO_VISITA'
  | 'REUNIAO_PLANTAO'
  | 'FILA_DIA_D'
  | 'PROPOSTA_COMERCIAL'
  | 'OBSERVACAO';

export interface Attendance {
  id: string;
  referralId: string;
  type: AttendanceType;
  title: string;
  description: string;
  createdByUserId: string;
  createdAt: string;
}

export type CommissionSplitBase = 'LIQUIDA' | 'BRUTA';

export interface CommissionCalculation {
  id: string;
  saleId: string;
  ruleVersion: string; // RN08: Ex: "REGRA-50-50-LIQ-v1.0"
  splitBase: CommissionSplitBase; // RN07: Bruta ou Líquida de deduções
  commissionRatePercent: number; // Ex: 3.0%
  grossCommissionCents: number; // Comissão bruta total
  taxDeductionRatePercent: number; // Alíquota/dedução fiscal (ex: 6.0%)
  taxDeductionCents: number; // Valor deduzido em centavos
  netCalculableBaseCents: number; // Base divisível
  brokerSharePercent: number; // 50%
  brokerCommissionCents: number; // Valor devido ao corretor
  linnkSharePercent: number; // 50%
  linnkCommissionCents: number; // Parte da LINNK
  calculatedAt: string;
}

export interface Sale {
  id: string;
  code: string; // Ex: "VND-2026-01"
  referralId: string;
  developmentId: string;
  unitIdentifier: string; // Ex: "Torre Atlântica · Unid. 1402"
  contractNumber: string;
  saleValueCents: number; // Armazenado em centavos inteiros (Seção 7)
  saleDate: string;
  status: 'CONFIRMADA' | 'DISTRATO';
  registeredByUserId: string;
  commission: CommissionCalculation;
}

export type TransactionType =
  | 'RECEBIMENTO_INCORPORADORA'
  | 'REPASSE_CORRETOR'
  | 'ESTORNO_RECEBIMENTO'
  | 'ESTORNO_REPASSE';

export interface FinancialTransaction {
  id: string;
  saleId: string;
  commissionId: string;
  type: TransactionType;
  installmentLabel: string; // Ex: "Parcela 1/2 (Sinal)" ou "Parcela Única"
  amountCents: number; // Positivo para recebimento/repasse, negativo ou marcado para estorno
  dueDate: string;
  paidAt?: string;
  status: 'PENDENTE' | 'CONFIRMADO' | 'ESTORNADO';
  receiptStorageKey?: string;
  reversalOfTransactionId?: string; // RN10: Referência ao registro original
  reversalReason?: string; // RN10: Motivo obrigatório em correções/estornos
  createdByUserId: string;
  createdAt: string;
}

export interface CommissionRuleConfig {
  currentVersion: string;
  defaultBrokerSharePercent: number;
  defaultLinnkSharePercent: number;
  splitBase: CommissionSplitBase;
  defaultTaxDeductionPercent: number;
  protectionMonths: number;
  duplicatePriorityRule: 'PRIMEIRA_INDICACAO_VALIDA' | 'TERMO_ASSINADO_PRIMEIRO';
  allowMultipleSalesPerReferral: boolean;
  updatedAt: string;
  updatedByUserId: string;
}

export interface AuditLog {
  id: string;
  action: string;
  module:
    | 'AUTH'
    | 'REFERRAL'
    | 'DUPLICATE'
    | 'DOCUMENT'
    | 'ATTENDANCE'
    | 'SALE'
    | 'FINANCE'
    | 'BROKER'
    | 'DEVELOPMENT'
    | 'CONFIG';
  entityId: string;
  summary: string;
  details: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  createdAt: string;
}
