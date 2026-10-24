import React, { createContext, useContext, useState } from 'react';
import {
  Attendance,
  AttendanceType,
  AuditLog,
  Broker,
  Client,
  CommissionCalculation,
  CommissionRuleConfig,
  Developer,
  Development,
  FinancialFlowStatus,
  FinancialTransaction,
  Modality,
  NavSection,
  OperatorPermissions,
  Referral,
  ReferralDocument,
  ReferralStatus,
  Sale,
  User,
} from './types';
import { normalizeEmail, normalizePhone } from '../lib/formatters';

interface CreateReferralInput {
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  clientCity: string;
  brokerId: string;
  developmentId: string;
  modality: Modality;
  notes?: string;
}

interface CreateSaleInput {
  referralId: string;
  developmentId: string;
  unitIdentifier: string;
  contractNumber: string;
  saleValueCents: number;
  commissionRatePercent: number;
  createInitialInstallments: boolean;
}

interface RegisterTransactionInput {
  saleId: string;
  type: 'RECEBIMENTO_INCORPORADORA' | 'REPASSE_CORRETOR';
  installmentLabel: string;
  amountCents: number;
  dueDate: string;
  confirmImmediately: boolean;
  receiptFileName?: string;
}

interface AppContextValue {
  currentUser: User | null;
  activeNav: NavSection;
  setActiveNav: (nav: NavSection) => void;
  selectedReferralId: string | null;
  setSelectedReferralId: (id: string | null) => void;
  loginAs: (userId: string) => void;
  logout: () => void;
  users: User[];
  brokers: Broker[];
  developers: Developer[];
  developments: Development[];
  clients: Client[];
  referrals: Referral[];
  documents: ReferralDocument[];
  attendances: Attendance[];
  sales: Sale[];
  transactions: FinancialTransaction[];
  auditLogs: AuditLog[];
  commissionConfig: CommissionRuleConfig;
  // Actions
  createReferral: (input: CreateReferralInput) => { referral: Referral; hasConflict: boolean };
  resolveDuplicate: (
    referralId: string,
    decision: 'APPROVE_NEW' | 'REJECT_AS_DUPLICATE',
    justification: string
  ) => void;
  generateConsentTerm: (referralId: string) => void;
  uploadSignedConsentTerm: (referralId: string, fileName: string) => void;
  reviewConsentTerm: (referralId: string, approved: boolean, reviewNotes: string) => void;
  addAttendance: (
    referralId: string,
    type: AttendanceType,
    title: string,
    description: string,
    nextReferralStatus?: ReferralStatus
  ) => void;
  registerSale: (input: CreateSaleInput) => Sale;
  registerTransaction: (input: RegisterTransactionInput) => void;
  confirmPendingTransaction: (transactionId: string, receiptFileName?: string) => void;
  reverseTransaction: (transactionId: string, reason: string) => void;
  saveBroker: (broker: Omit<Broker, 'id' | 'createdAt' | 'phoneNormalized'>, id?: string) => void;
  toggleBrokerActive: (brokerId: string) => void;
  saveDevelopment: (dev: Omit<Development, 'id'>, id?: string) => void;
  toggleDevelopmentActive: (devId: string) => void;
  saveDeveloper: (dev: Omit<Developer, 'id'>, id?: string) => void;
  toggleDeveloperActive: (devId: string) => void;
  updateCommissionConfig: (patch: Partial<CommissionRuleConfig>) => void;
  updateOperatorPermissions: (userId: string, permissions: OperatorPermissions) => void;
  toggleUserActive: (userId: string) => void;
  createUser: (input: { name: string; email: string; role: 'ADMIN' | 'OPERATOR' | 'BROKER'; title: string }) => void;
  updateCurrentUserProfile: (patch: { name?: string; email?: string; title?: string; avatarUrl?: string }) => void;
}

const INITIAL_USERS: User[] = [
  {
    id: 'usr-admin-1',
    name: 'Vitor Nery',
    email: 'vitor@linnk.com.br',
    role: 'ADMIN',
    title: 'Diretor de Operações & Curadoria (Administrador)',
    active: true,
    lastLoginAt: '2026-10-24T10:45:00-03:00',
  },
  {
    id: 'usr-op-1',
    name: 'Camila Andrade',
    email: 'camila.operacao@linnk.com.br',
    role: 'OPERATOR',
    title: 'Especialista Closer & Operações (Operador)',
    active: true,
    lastLoginAt: '2026-10-24T10:15:00-03:00',
    permissions: {
      canEditBrokers: true,
      canEditDevelopments: false,
      canResolveDuplicates: true,
      canRegisterSales: true,
      canViewCommissions: true,
      canRegisterFinance: true,
      canViewAuditRestricted: false,
    },
  },
  {
    id: 'usr-brk-1',
    name: 'Henrique Bastos',
    email: 'henrique.bastos@corretorba.com.br',
    role: 'BROKER',
    title: 'Corretor · CRECI-BA 24.819',
    active: true,
    brokerId: 'brk-1',
    lastLoginAt: '2026-10-24T09:50:00-03:00',
  },
  {
    id: 'usr-op-2',
    name: 'Lucas Figueiredo',
    email: 'lucas.atendimento@linnk.com.br',
    role: 'OPERATOR',
    title: 'Analista de Triagem & Termos (Operador)',
    active: true,
    lastLoginAt: '2026-10-23T18:20:00-03:00',
    permissions: {
      canEditBrokers: false,
      canEditDevelopments: false,
      canResolveDuplicates: false,
      canRegisterSales: false,
      canViewCommissions: true,
      canRegisterFinance: false,
      canViewAuditRestricted: false,
    },
  },
];

const INITIAL_DEVELOPERS: Developer[] = [
  {
    id: 'devp-1',
    name: 'M Cruz Incorporações',
    legalName: 'M Cruz Empreendimentos Imobiliários SPE Ltda.',
    cnpj: '34.819.204/0001-62',
    city: 'Ilhéus · BA',
    contactName: 'Roberto Cruz',
    contactEmail: 'diretoria@mcruzinc.com.br',
    contactPhone: '(73) 99981-2200',
    paymentRuleDescription: '50% na assinatura do contrato + 50% em 30 dias após registro.',
    active: true,
  },
  {
    id: 'devp-2',
    name: 'SSN Incorporadora',
    legalName: 'SSN Construções e Incorporações do Sul da Bahia S.A.',
    cnpj: '19.402.881/0001-19',
    city: 'Ilhéus / Itabuna · BA',
    contactName: 'Helena Sampaio',
    contactEmail: 'parcerias@ssninc.com.br',
    contactPhone: '(73) 99811-4500',
    paymentRuleDescription: 'Parcela única em até 15 dias úteis após compensação do sinal.',
    active: true,
  },
  {
    id: 'devp-3',
    name: 'Pelir Urbanismo & Construtora',
    legalName: 'Pelir Desenvolvimento Urbano Ltda.',
    cnpj: '41.009.512/0001-88',
    city: 'Itabuna / Ilhéus · BA',
    contactName: 'Eduardo Peixoto',
    contactEmail: 'comercial@pelir.com.br',
    contactPhone: '(73) 99104-7788',
    paymentRuleDescription: '3 parcelas mensais acompanhando o fluxo de entrada do comprador.',
    active: true,
  },
  {
    id: 'devp-4',
    name: 'Lunna Incorporadora',
    legalName: 'Lunna Desenvolvimento Imobiliário SPE S.A.',
    cnpj: '51.230.900/0001-04',
    city: 'Ilhéus · BA',
    contactName: 'Gustavo Nogueira',
    contactEmail: 'operacoes@lunnainc.com.br',
    contactPhone: '(73) 99940-1122',
    paymentRuleDescription: 'À vista na confirmação da venda e assinatura do quadro resumo.',
    active: true,
  },
];

const INITIAL_DEVELOPMENTS: Development[] = [
  {
    id: 'devm-1',
    developerId: 'devp-1',
    name: 'Lançamento M Cruz · Pé na Areia',
    city: 'Ilhéus · BA',
    neighborhood: 'Praia dos Milionários',
    incorporationRegistry: 'R-4 Matrícula 48.219 · 1º Ofício de Ilhéus',
    affectationPatrimony: true,
    constructionStatus: 'LANCAMENTO',
    defaultCommissionRate: 4.0,
    averageTicketCents: 98000000, // R$ 980.000,00
    linnkSealVerified: true,
    active: true,
  },
  {
    id: 'devm-2',
    developerId: 'devp-2',
    name: 'Polipark Residence',
    city: 'Itabuna / Ilhéus · BA',
    neighborhood: 'Eixo Sul Prime',
    incorporationRegistry: 'R-2 Matrícula 31.904 · CRI Regional',
    affectationPatrimony: true,
    constructionStatus: 'LANCAMENTO',
    defaultCommissionRate: 3.5,
    averageTicketCents: 72000000, // R$ 720.000,00
    linnkSealVerified: true,
    active: true,
  },
  {
    id: 'devm-3',
    developerId: 'devp-3',
    name: 'Jardim das Hortênsias',
    city: 'Eixo BR-415 · Itabuna/Ilhéus',
    neighborhood: 'BR-415 Km 18',
    incorporationRegistry: 'R-7 Matrícula 62.110 · 2º Ofício',
    affectationPatrimony: true,
    constructionStatus: 'EM_OBRAS',
    defaultCommissionRate: 4.0,
    averageTicketCents: 85000000, // R$ 850.000,00
    linnkSealVerified: true,
    active: true,
  },
  {
    id: 'devm-4',
    developerId: 'devp-4',
    name: 'Lunna Mirante Sul',
    city: 'Ilhéus · BA',
    neighborhood: 'Pontal',
    incorporationRegistry: 'Protocolo RI 91.402 · Em averbação final',
    affectationPatrimony: true,
    constructionStatus: 'PRE_LANCAMENTO',
    defaultCommissionRate: 4.0,
    averageTicketCents: 115000000, // R$ 1.150.000,00
    linnkSealVerified: true,
    active: true,
  },
];

const INITIAL_BROKERS: Broker[] = [
  {
    id: 'brk-1',
    name: 'Henrique Bastos',
    email: 'henrique.bastos@corretorba.com.br',
    phone: '(77) 99912-4410',
    phoneNormalized: '77999124410',
    creci: 'CRECI-BA 24.819',
    city: 'Vitória da Conquista',
    state: 'BA',
    defaultModality: 'INDICA',
    isFoundingMember: true,
    adhesionTermSigned: true,
    ndaTermSigned: true,
    pixKey: 'henrique.bastos@corretorba.com.br',
    active: true,
    createdAt: '2026-10-02T09:00:00-03:00',
  },
  {
    id: 'brk-2',
    name: 'Fernanda Oliveira',
    email: 'fernanda.imoveis@gmail.com',
    phone: '(73) 99844-1920',
    phoneNormalized: '73998441920',
    creci: 'CRECI-BA 19.302',
    city: 'Ilhéus',
    state: 'BA',
    defaultModality: 'CONECTA',
    isFoundingMember: true,
    adhesionTermSigned: true,
    ndaTermSigned: true,
    pixKey: '73998441920',
    active: true,
    createdAt: '2026-10-03T11:30:00-03:00',
  },
  {
    id: 'brk-3',
    name: 'Marcos Vinícius Rocha',
    email: 'mvrocha.agroimoveis@outlook.com',
    phone: '(77) 99188-7300',
    phoneNormalized: '77991887300',
    creci: 'CRECI-BA 31.105',
    city: 'Luís Eduardo Magalhães',
    state: 'BA',
    defaultModality: 'INDICA',
    isFoundingMember: true,
    adhesionTermSigned: true,
    ndaTermSigned: true,
    pixKey: '048.912.335-20',
    active: true,
    createdAt: '2026-10-05T14:20:00-03:00',
  },
  {
    id: 'brk-4',
    name: 'Patrícia Medeiros',
    email: 'patricia.medeiros@consultoriaba.com',
    phone: '(71) 99602-8811',
    phoneNormalized: '71996028811',
    creci: 'PARCEIRA INDICADORA (Contrato)',
    city: 'Salvador',
    state: 'BA',
    defaultModality: 'INDICA',
    isFoundingMember: false,
    adhesionTermSigned: true,
    ndaTermSigned: false,
    pixKey: 'patricia.medeiros@consultoriaba.com',
    active: true,
    createdAt: '2026-10-12T16:10:00-03:00',
  },
  {
    id: 'brk-5',
    name: 'Carlos Eduardo Dantas',
    email: 'cedantas@imobiliariajequie.com.br',
    phone: '(73) 98811-0092',
    phoneNormalized: '73988110092',
    creci: 'CRECI-BA 15.044',
    city: 'Jequié',
    state: 'BA',
    defaultModality: 'INDICA',
    isFoundingMember: false,
    adhesionTermSigned: false,
    ndaTermSigned: false,
    pixKey: '73988110092',
    active: false, // Inativo para demonstrar RN13
    createdAt: '2026-09-20T10:00:00-03:00',
  },
];

const INITIAL_CLIENTS: Client[] = [
  {
    id: 'cli-1',
    name: 'Dr. Otávio Magalhães',
    phone: '(77) 99984-5521',
    phoneNormalized: '77999845521',
    email: 'otavio.magalhaes@clinicaudoeste.com.br',
    emailNormalized: 'otavio.magalhaes@clinicaudoeste.com.br',
    city: 'Vitória da Conquista · BA',
    notes: 'Médico cirurgião, busca unidade vista mar em Ilhéus para segunda moradia e investimento.',
    createdAt: '2026-10-10T10:00:00-03:00',
  },
  {
    id: 'cli-2',
    name: 'Marina Costa Vasconcelos',
    phone: '(73) 99142-8830',
    phoneNormalized: '73991428830',
    email: 'marina.vasconcelos@gmail.com',
    emailNormalized: 'marina.vasconcelos@gmail.com',
    city: 'Itabuna · BA',
    notes: 'Interesse em condomínio fechado no eixo Ilhéus-Itabuna (BR-415).',
    createdAt: '2026-10-14T15:10:00-03:00',
  },
  {
    id: 'cli-3',
    name: 'Ricardo Fontes Agronegócios',
    phone: '(77) 99801-3390',
    phoneNormalized: '77998013390',
    email: 'ricardo@fontesagro.com.br',
    emailNormalized: 'ricardo@fontesagro.com.br',
    city: 'Barreiras / LEM · BA',
    notes: 'Investidor de alta liquidez, compra recorrente no litoral sul.',
    createdAt: '2026-10-18T09:25:00-03:00',
  },
  {
    id: 'cli-4',
    name: 'Beatriz Alencar',
    phone: '(71) 99210-6400',
    phoneNormalized: '71992106400',
    email: 'beatriz.alencar@arquitetura.ba.gov.br',
    emailNormalized: 'beatriz.alencar@arquitetura.ba.gov.br',
    city: 'Salvador · BA',
    notes: 'Quer conhecer o Polipark Residence na próxima viagem a Ilhéus.',
    createdAt: '2026-10-21T11:40:00-03:00',
  },
  {
    id: 'cli-5',
    name: 'Dr. Otávio M. (Duplicidade em Análise)',
    phone: '(77) 99984-5521',
    phoneNormalized: '77999845521',
    email: 'otavio.magalhaes@clinicaudoeste.com.br',
    emailNormalized: 'otavio.magalhaes@clinicaudoeste.com.br',
    city: 'Vitória da Conquista · BA',
    notes: 'Indicado posteriormente por outra corretora com o mesmo WhatsApp normalizado.',
    createdAt: '2026-10-23T16:05:00-03:00',
  },
  {
    id: 'cli-6',
    name: 'Dra. Clarice Moura',
    phone: '(77) 99931-7840',
    phoneNormalized: '77999317840',
    email: 'clarice.moura@medconquista.com.br',
    emailNormalized: 'clarice.moura@medconquista.com.br',
    city: 'Vitória da Conquista · BA',
    notes: 'Médica dermatologista, atendimento conduzido diretamente por Henrique na modalidade CONECTA.',
    createdAt: '2026-10-16T11:20:00-03:00',
  },
  {
    id: 'cli-7',
    name: 'Eng. Roberto Peixoto',
    phone: '(77) 99812-6050',
    phoneNormalized: '77998126050',
    email: 'roberto.peixoto@construsulba.com.br',
    emailNormalized: 'roberto.peixoto@construsulba.com.br',
    city: 'Vitória da Conquista · BA',
    notes: 'Investidor interessado no pré-lançamento Lunna Mirante Sul.',
    createdAt: '2026-10-22T09:15:00-03:00',
  },
];

const INITIAL_REFERRALS: Referral[] = [
  {
    id: 'ref-1',
    code: 'LNK-2026-001',
    clientId: 'cli-1',
    brokerId: 'brk-1',
    developmentId: 'devm-1',
    modality: 'INDICA',
    assignedOperatorId: 'usr-op-1',
    status: 'VENDA_CONFIRMADA',
    documentStatus: 'APROVADO',
    saleStatus: 'CONFIRMADA',
    receivementStatus: 'PARCIAL',
    payoutStatus: 'PARCIAL',
    protectionExpiresAt: '2027-04-10T10:00:00-03:00',
    notes: 'Cliente assinou termo no mesmo dia. Especialista LINNK fechou unidade 1201 no lançamento M Cruz.',
    createdAt: '2026-10-10T10:00:00-03:00',
    updatedAt: '2026-10-19T17:30:00-03:00',
  },
  {
    id: 'ref-2',
    code: 'LNK-2026-002',
    clientId: 'cli-2',
    brokerId: 'brk-2',
    developmentId: 'devm-3',
    modality: 'CONECTA',
    assignedOperatorId: 'usr-op-1',
    status: 'EM_ATENDIMENTO',
    documentStatus: 'APROVADO',
    saleStatus: 'EM_NEGOCIACAO',
    receivementStatus: 'NAO_APLICAVEL',
    payoutStatus: 'NAO_APLICAVEL',
    protectionExpiresAt: '2027-04-14T15:10:00-03:00',
    notes: 'Modalidade CONECTA: Corretora Fernanda conduz o atendimento com material e plantão da LINNK.',
    createdAt: '2026-10-14T15:10:00-03:00',
    updatedAt: '2026-10-22T14:00:00-03:00',
  },
  {
    id: 'ref-3',
    code: 'LNK-2026-003',
    clientId: 'cli-3',
    brokerId: 'brk-3',
    developmentId: 'devm-1',
    modality: 'INDICA',
    assignedOperatorId: 'usr-op-2',
    status: 'AGUARDANDO_CONSENTIMENTO',
    documentStatus: 'RECEBIDO_AGUARDANDO_CONFERENCIA',
    saleStatus: 'NAO_INICIADA',
    receivementStatus: 'NAO_APLICAVEL',
    payoutStatus: 'NAO_APLICAVEL',
    protectionExpiresAt: '2027-04-18T09:25:00-03:00',
    notes: 'Termo assinado manualmente recebido via PDF. Aguardando conferência do operador para liberar atendimento.',
    createdAt: '2026-10-18T09:25:00-03:00',
    updatedAt: '2026-10-23T11:20:00-03:00',
  },
  {
    id: 'ref-4',
    code: 'LNK-2026-004',
    clientId: 'cli-4',
    brokerId: 'brk-4',
    developmentId: 'devm-2',
    modality: 'INDICA',
    assignedOperatorId: 'usr-op-2',
    status: 'AGUARDANDO_CONSENTIMENTO',
    documentStatus: 'GERADO_AGUARDANDO_ASSINATURA',
    saleStatus: 'NAO_INICIADA',
    receivementStatus: 'NAO_APLICAVEL',
    payoutStatus: 'NAO_APLICAVEL',
    protectionExpiresAt: '2027-04-21T11:40:00-03:00',
    notes: 'Termo gerado e enviado para assinatura manual da cliente Beatriz.',
    createdAt: '2026-10-21T11:40:00-03:00',
    updatedAt: '2026-10-21T12:00:00-03:00',
  },
  {
    id: 'ref-5',
    code: 'LNK-2026-005',
    clientId: 'cli-5',
    brokerId: 'brk-4',
    developmentId: 'devm-1',
    modality: 'INDICA',
    assignedOperatorId: 'usr-admin-1',
    status: 'EM_ANALISE_DUPLICIDADE',
    documentStatus: 'PENDENTE_GERACAO',
    saleStatus: 'NAO_INICIADA',
    receivementStatus: 'NAO_APLICAVEL',
    payoutStatus: 'NAO_APLICAVEL',
    duplicateOfReferralId: 'ref-1',
    protectionExpiresAt: '2027-04-23T16:05:00-03:00',
    notes: 'Conflito detectado automaticamente por telefone (77999845521) e e-mail idênticos à indicação LNK-2026-001.',
    createdAt: '2026-10-23T16:05:00-03:00',
    updatedAt: '2026-10-23T16:05:00-03:00',
  },
  {
    id: 'ref-6',
    code: 'LNK-2026-006',
    clientId: 'cli-6',
    brokerId: 'brk-1',
    developmentId: 'devm-2',
    modality: 'CONECTA',
    assignedOperatorId: 'usr-op-1',
    status: 'EM_ATENDIMENTO',
    documentStatus: 'APROVADO',
    saleStatus: 'EM_NEGOCIACAO',
    receivementStatus: 'NAO_APLICAVEL',
    payoutStatus: 'NAO_APLICAVEL',
    protectionExpiresAt: '2027-04-16T11:20:00-03:00',
    notes: 'Corretor Henrique conduzindo apresentação do Polipark Residence com apoio de material LINNK.',
    createdAt: '2026-10-16T11:20:00-03:00',
    updatedAt: '2026-10-23T15:40:00-03:00',
  },
  {
    id: 'ref-7',
    code: 'LNK-2026-007',
    clientId: 'cli-7',
    brokerId: 'brk-1',
    developmentId: 'devm-4',
    modality: 'INDICA',
    assignedOperatorId: 'usr-op-2',
    status: 'AGUARDANDO_CONSENTIMENTO',
    documentStatus: 'GERADO_AGUARDANDO_ASSINATURA',
    saleStatus: 'NAO_INICIADA',
    receivementStatus: 'NAO_APLICAVEL',
    payoutStatus: 'NAO_APLICAVEL',
    protectionExpiresAt: '2027-04-22T09:15:00-03:00',
    notes: 'Termo gerado para assinatura manual do cliente Eng. Roberto Peixoto.',
    createdAt: '2026-10-22T09:15:00-03:00',
    updatedAt: '2026-10-22T09:45:00-03:00',
  },
];

const INITIAL_DOCUMENTS: ReferralDocument[] = [
  {
    id: 'doc-1',
    referralId: 'ref-1',
    templateVersion: 'TERMO-CONSENTIMENTO-v1.2',
    status: 'APROVADO',
    generatedAt: '2026-10-10T10:05:00-03:00',
    GeneratedByUserId: 'usr-op-1',
    storageKey: 'private/consent-terms/2026/10/LNK-2026-001-termo-assinado.pdf',
    fileName: 'termo_consentimento_otavio_magalhaes_assinado.pdf',
    receivedAt: '2026-10-10T14:20:00-03:00',
    receivedByUserId: 'usr-op-1',
    reviewedAt: '2026-10-10T14:35:00-03:00',
    reviewedByUserId: 'usr-admin-1',
    reviewNotes: 'Assinatura conferida conforme documento de identificação e cláusula de 6 meses validada.',
  },
  {
    id: 'doc-2',
    referralId: 'ref-2',
    templateVersion: 'TERMO-CONSENTIMENTO-v1.2',
    status: 'APROVADO',
    generatedAt: '2026-10-14T15:20:00-03:00',
    GeneratedByUserId: 'usr-op-1',
    storageKey: 'private/consent-terms/2026/10/LNK-2026-002-termo-assinado.pdf',
    fileName: 'termo_marina_vasconcelos_assinado.pdf',
    receivedAt: '2026-10-15T09:10:00-03:00',
    receivedByUserId: 'usr-op-1',
    reviewedAt: '2026-10-15T09:40:00-03:00',
    reviewedByUserId: 'usr-op-1',
    reviewNotes: 'Documento legível e assinado pela cliente Marina e corretora Fernanda.',
  },
  {
    id: 'doc-3',
    referralId: 'ref-3',
    templateVersion: 'TERMO-CONSENTIMENTO-v1.2',
    status: 'RECEBIDO_AGUARDANDO_CONFERENCIA',
    generatedAt: '2026-10-18T09:40:00-03:00',
    GeneratedByUserId: 'usr-op-2',
    storageKey: 'private/consent-terms/2026/10/LNK-2026-003-termo-assinado.pdf',
    fileName: 'termo_ricardo_fontes_assinado_scan.pdf',
    receivedAt: '2026-10-23T11:20:00-03:00',
    receivedByUserId: 'usr-op-2',
  },
  {
    id: 'doc-4',
    referralId: 'ref-4',
    templateVersion: 'TERMO-CONSENTIMENTO-v1.2',
    status: 'GERADO_AGUARDANDO_ASSINATURA',
    generatedAt: '2026-10-21T12:00:00-03:00',
    GeneratedByUserId: 'usr-op-2',
  },
  {
    id: 'doc-5',
    referralId: 'ref-5',
    templateVersion: 'TERMO-CONSENTIMENTO-v1.2',
    status: 'PENDENTE_GERACAO',
  },
  {
    id: 'doc-6',
    referralId: 'ref-6',
    templateVersion: 'TERMO-CONSENTIMENTO-v1.2',
    status: 'APROVADO',
    generatedAt: '2026-10-16T11:30:00-03:00',
    GeneratedByUserId: 'usr-op-1',
    storageKey: 'private/consent-terms/2026/10/LNK-2026-006-termo-assinado.pdf',
    fileName: 'termo_clarice_moura_assinado.pdf',
    receivedAt: '2026-10-16T16:10:00-03:00',
    receivedByUserId: 'usr-op-1',
    reviewedAt: '2026-10-16T16:40:00-03:00',
    reviewedByUserId: 'usr-op-1',
    reviewNotes: 'Termo validado para atuação em modalidade CONECTA.',
  },
  {
    id: 'doc-7',
    referralId: 'ref-7',
    templateVersion: 'TERMO-CONSENTIMENTO-v1.2',
    status: 'GERADO_AGUARDANDO_ASSINATURA',
    generatedAt: '2026-10-22T09:45:00-03:00',
    GeneratedByUserId: 'usr-op-2',
  },
];

const INITIAL_ATTENDANCES: Attendance[] = [
  {
    id: 'att-1',
    referralId: 'ref-1',
    type: 'CONTATO_INICIAL',
    title: 'Apresentação Consultiva LINNK (Modalidade INDICA)',
    description: 'Contato realizado pelo closer LINNK após aprovação do termo. Apresentado book e tabela do Lançamento M Cruz.',
    createdByUserId: 'usr-op-1',
    createdAt: '2026-10-11T10:30:00-03:00',
  },
  {
    id: 'att-2',
    referralId: 'ref-1',
    type: 'REUNIAO_PLANTAO',
    title: 'Videoconferência com Memorial e Vista da Unidade 1201',
    description: 'Dr. Otávio escolheu a unidade 1201 nascente. Simulado fluxo de pagamento direto com a M Cruz.',
    createdByUserId: 'usr-op-1',
    createdAt: '2026-10-15T16:00:00-03:00',
  },
  {
    id: 'att-3',
    referralId: 'ref-1',
    type: 'PROPOSTA_COMERCIAL',
    title: 'Proposta Aceita e Contrato Assinado (R$ 950.000,00)',
    description: 'Contrato assinado junto à incorporadora M Cruz. Venda registrada para apuração de comissão 50/50.',
    createdByUserId: 'usr-admin-1',
    createdAt: '2026-10-19T17:15:00-03:00',
  },
  {
    id: 'att-4',
    referralId: 'ref-2',
    type: 'AGENDAMENTO_VISITA',
    title: 'Apoio ao Corretor no Stand (Modalidade CONECTA)',
    description: 'Reservada sala VIP no stand da Pelir para a corretora Fernanda apresentar o Jardim das Hortênsias à cliente Marina.',
    createdByUserId: 'usr-op-1',
    createdAt: '2026-10-20T14:00:00-03:00',
  },
  {
    id: 'att-5',
    referralId: 'ref-2',
    type: 'PROPOSTA_COMERCIAL',
    title: 'Simulação de Proposta Lote Prime Quadra C',
    description: 'Cliente avaliando proposta de R$ 850.000,00 com sinal parcelado em 3x.',
    createdByUserId: 'usr-op-1',
    createdAt: '2026-10-22T14:00:00-03:00',
  },
  {
    id: 'att-6',
    referralId: 'ref-6',
    type: 'REUNIAO_PLANTAO',
    title: 'Apresentação Conjunta CONECTA · Polipark Residence',
    description: 'Reunião online conduzida pelo corretor Henrique Bastos com suporte da especialista Camila. Cliente solicitou simulação da unidade 504.',
    createdByUserId: 'usr-op-1',
    createdAt: '2026-10-23T15:40:00-03:00',
  },
];

const INITIAL_SALES: Sale[] = [
  {
    id: 'sale-1',
    code: 'VND-2026-001',
    referralId: 'ref-1',
    developmentId: 'devm-1',
    unitIdentifier: 'Torre Mar · Unidade 1201 (Vista Definitiva)',
    contractNumber: 'MCZ-2026-1201',
    saleValueCents: 95000000, // R$ 950.000,00
    saleDate: '2026-10-19T17:30:00-03:00',
    status: 'CONFIRMADA',
    registeredByUserId: 'usr-admin-1',
    commission: {
      id: 'comm-1',
      saleId: 'sale-1',
      ruleVersion: 'REGRA-50-50-LIQ-v1.0',
      splitBase: 'LIQUIDA',
      commissionRatePercent: 4.0,
      grossCommissionCents: 3800000, // R$ 38.000,00 (4% de 950k)
      taxDeductionRatePercent: 6.0, // Imposto NF LINNK
      taxDeductionCents: 228000, // R$ 2.280,00
      netCalculableBaseCents: 3572000, // R$ 35.720,00 líquidos
      brokerSharePercent: 50,
      brokerCommissionCents: 1786000, // R$ 17.860,00 líquido para o corretor Henrique
      linnkSharePercent: 50,
      linnkCommissionCents: 1786000, // R$ 17.860,00 para a LINNK
      calculatedAt: '2026-10-19T17:30:00-03:00',
    },
  },
];

const INITIAL_TRANSACTIONS: FinancialTransaction[] = [
  {
    id: 'fin-1',
    saleId: 'sale-1',
    commissionId: 'comm-1',
    type: 'RECEBIMENTO_INCORPORADORA',
    installmentLabel: 'Parcela 1/2 · Sinal Incorporadora M Cruz',
    amountCents: 1900000, // R$ 19.000,00 (50% da comissão bruta recebida)
    dueDate: '2026-10-20',
    paidAt: '2026-10-20T15:10:00-03:00',
    status: 'CONFIRMADO',
    receiptStorageKey: 'private/finance/2026/10/comp_recebimento_mcruz_p1.pdf',
    createdByUserId: 'usr-admin-1',
    createdAt: '2026-10-20T15:10:00-03:00',
  },
  {
    id: 'fin-2',
    saleId: 'sale-1',
    commissionId: 'comm-1',
    type: 'RECEBIMENTO_INCORPORADORA',
    installmentLabel: 'Parcela 2/2 · 30 dias após registro',
    amountCents: 1900000, // R$ 19.000,00 pendente
    dueDate: '2026-11-20',
    status: 'PENDENTE',
    createdByUserId: 'usr-admin-1',
    createdAt: '2026-10-20T15:10:00-03:00',
  },
  {
    id: 'fin-3',
    saleId: 'sale-1',
    commissionId: 'comm-1',
    type: 'REPASSE_CORRETOR',
    installmentLabel: 'Repasse 1/2 · Corretor Henrique Bastos (50% Líquido ref. Parcela 1)',
    amountCents: 893000, // R$ 8.930,00 repassados
    dueDate: '2026-10-21',
    paidAt: '2026-10-21T11:00:00-03:00',
    status: 'CONFIRMADO',
    receiptStorageKey: 'private/finance/2026/10/comp_pix_henrique_bastos_p1.pdf',
    createdByUserId: 'usr-admin-1',
    createdAt: '2026-10-21T11:00:00-03:00',
  },
  {
    id: 'fin-4',
    saleId: 'sale-1',
    commissionId: 'comm-1',
    type: 'REPASSE_CORRETOR',
    installmentLabel: 'Repasse 2/2 · Corretor Henrique Bastos (Aguardando 2ª parcela M Cruz)',
    amountCents: 893000, // R$ 8.930,00 pendente
    dueDate: '2026-11-22',
    status: 'PENDENTE',
    createdByUserId: 'usr-admin-1',
    createdAt: '2026-10-21T11:00:00-03:00',
  },
];

const INITIAL_COMMISSION_CONFIG: CommissionRuleConfig = {
  currentVersion: 'REGRA-50-50-LIQ-v1.0',
  defaultBrokerSharePercent: 50,
  defaultLinnkSharePercent: 50,
  splitBase: 'LIQUIDA',
  defaultTaxDeductionPercent: 6.0,
  protectionMonths: 6,
  duplicatePriorityRule: 'PRIMEIRA_INDICACAO_VALIDA',
  allowMultipleSalesPerReferral: false,
  updatedAt: '2026-10-01T09:00:00-03:00',
  updatedByUserId: 'usr-admin-1',
};

const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'aud-1',
    action: 'DUPLICATE_DETECTED',
    module: 'DUPLICATE',
    entityId: 'ref-5',
    summary: 'Possível duplicidade detectada automaticamente (LNK-2026-005 vs LNK-2026-001)',
    details: 'Telefone normalizado 77999845521 e e-mail otavio.magalhaes@clinicaudoeste.com.br já vinculados à indicação ativa LNK-2026-001 (Corretor Henrique Bastos). Encaminhada para fila de análise.',
    userId: 'usr-op-2',
    userName: 'Lucas Figueiredo',
    userRole: 'OPERATOR',
    createdAt: '2026-10-23T16:05:00-03:00',
  },
  {
    id: 'aud-2',
    action: 'DOCUMENT_UPLOADED',
    module: 'DOCUMENT',
    entityId: 'doc-3',
    summary: 'Termo de consentimento assinado recebido para LNK-2026-003',
    details: 'Arquivo armazenado em chave privada: private/consent-terms/2026/10/LNK-2026-003-termo-assinado.pdf. Aguardando conferência manual.',
    userId: 'usr-op-2',
    userName: 'Lucas Figueiredo',
    userRole: 'OPERATOR',
    createdAt: '2026-10-23T11:20:00-03:00',
  },
  {
    id: 'aud-3',
    action: 'PAYOUT_CONFIRMED',
    module: 'FINANCE',
    entityId: 'fin-3',
    summary: 'Repasse 1/2 confirmado ao corretor Henrique Bastos (R$ 8.930,00)',
    details: 'Comprovante PIX anexado em private/finance/2026/10/comp_pix_henrique_bastos_p1.pdf referente à venda VND-2026-001.',
    userId: 'usr-admin-1',
    userName: 'Vitor Nery',
    userRole: 'ADMIN',
    createdAt: '2026-10-21T11:00:00-03:00',
  },
  {
    id: 'aud-4',
    action: 'SALE_REGISTERED',
    module: 'SALE',
    entityId: 'sale-1',
    summary: 'Venda VND-2026-001 confirmada (R$ 950.000,00) · Regra REGRA-50-50-LIQ-v1.0',
    details: 'Unidade 1201 no Lançamento M Cruz. Comissão bruta R$ 38.000,00, dedução fiscal 6% (R$ 2.280,00), líquido divisível R$ 35.720,00 (50% Corretor R$ 17.860,00 / 50% LINNK R$ 17.860,00).',
    userId: 'usr-admin-1',
    userName: 'Vitor Nery',
    userRole: 'ADMIN',
    createdAt: '2026-10-19T17:30:00-03:00',
  },
  {
    id: 'aud-5',
    action: 'DOCUMENT_APPROVED',
    module: 'DOCUMENT',
    entityId: 'doc-1',
    summary: 'Termo de consentimento conferido e aprovado para LNK-2026-001',
    details: 'Atendimento comercial liberado após validação de assinatura manual.',
    userId: 'usr-admin-1',
    userName: 'Vitor Nery',
    userRole: 'ADMIN',
    createdAt: '2026-10-10T14:35:00-03:00',
  },
];

const AppContext = createContext<AppContextValue | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeNav, setActiveNav] = useState<NavSection>('dashboard');
  const [selectedReferralId, setSelectedReferralId] = useState<string | null>(null);

  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [brokers, setBrokers] = useState<Broker[]>(INITIAL_BROKERS);
  const [developers, setDevelopers] = useState<Developer[]>(INITIAL_DEVELOPERS);
  const [developments, setDevelopments] = useState<Development[]>(INITIAL_DEVELOPMENTS);
  const [clients, setClients] = useState<Client[]>(INITIAL_CLIENTS);
  const [referrals, setReferrals] = useState<Referral[]>(INITIAL_REFERRALS);
  const [documents, setDocuments] = useState<ReferralDocument[]>(INITIAL_DOCUMENTS);
  const [attendances, setAttendances] = useState<Attendance[]>(INITIAL_ATTENDANCES);
  const [sales, setSales] = useState<Sale[]>(INITIAL_SALES);
  const [transactions, setTransactions] = useState<FinancialTransaction[]>(INITIAL_TRANSACTIONS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(INITIAL_AUDIT_LOGS);
  const [commissionConfig, setCommissionConfig] = useState<CommissionRuleConfig>(INITIAL_COMMISSION_CONFIG);

  const appendAudit = (
    action: string,
    module: AuditLog['module'],
    entityId: string,
    summary: string,
    details: string
  ) => {
    const actor = currentUser || INITIAL_USERS[0];
    const newLog: AuditLog = {
      id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      action,
      module,
      entityId,
      summary,
      details,
      userId: actor.id,
      userName: actor.name,
      userRole: actor.role,
      createdAt: new Date().toISOString(),
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  const loginAs = (userId: string) => {
    const found = users.find((u) => u.id === userId);
    if (!found || !found.active) return;
    setCurrentUser(found);
    if (found.role === 'OPERATOR' && (activeNav === 'users' || activeNav === 'audit')) {
      setActiveNav('dashboard');
    }
    if (
      found.role === 'BROKER' &&
      ![
        'dashboard',
        'referrals',
        'documents',
        'attendances',
        'developments',
        'sales',
      ].includes(activeNav)
    ) {
      setActiveNav('dashboard');
    }
    appendAudit(
      'USER_LOGIN',
      'AUTH',
      found.id,
      `Sessão autenticada como ${found.name} (${found.role})`,
      `Token Supabase Auth validado. Perfil aplicado: ${found.role}.`
    );
  };

  const logout = () => {
    setCurrentUser(null);
  };

  /**
   * Criação de indicação com normalização de contato e verificação automática de duplicidade
   */
  const createReferral = (input: CreateReferralInput) => {
    const phoneNorm = normalizePhone(input.clientPhone);
    const emailNorm = normalizeEmail(input.clientEmail);
    const now = new Date();
    const protectionDate = new Date(now);
    protectionDate.setMonth(protectionDate.getMonth() + commissionConfig.protectionMonths);

    // Busca na base por telefone ou e-mail normalizado em indicações ativas
    const conflictingClient = clients.find(
      (c) =>
        (phoneNorm.length >= 8 && c.phoneNormalized === phoneNorm) ||
        (emailNorm.length > 3 && c.emailNormalized === emailNorm)
    );

    const existingActiveReferral = conflictingClient
      ? referrals.find(
          (r) =>
            r.clientId === conflictingClient.id &&
            r.status !== 'CONFLITO_REJEITADO' &&
            r.status !== 'ENCERRADA_SEM_VENDA'
        )
      : undefined;

    const newClientId = `cli-${Date.now()}`;
    const newClient: Client = {
      id: newClientId,
      name: input.clientName.trim(),
      phone: input.clientPhone.trim(),
      phoneNormalized: phoneNorm,
      email: input.clientEmail.trim(),
      emailNormalized: emailNorm,
      city: input.clientCity.trim() || 'Ilhéus / Região · BA',
      notes: input.notes,
      createdAt: now.toISOString(),
    };

    const nextNum = referrals.length + 1;
    const code = `LNK-2026-${String(nextNum).padStart(3, '0')}`;
    const newRefId = `ref-${Date.now()}`;
    const hasConflict = Boolean(existingActiveReferral);
    const initialDocStatus = hasConflict
      ? 'PENDENTE_GERACAO'
      : 'GERADO_AGUARDANDO_ASSINATURA';

    const newReferral: Referral = {
      id: newRefId,
      code,
      clientId: newClientId,
      brokerId: input.brokerId,
      developmentId: input.developmentId,
      modality: input.modality,
      assignedOperatorId: currentUser?.id || 'usr-op-1',
      status: hasConflict ? 'EM_ANALISE_DUPLICIDADE' : 'AGUARDANDO_CONSENTIMENTO',
      documentStatus: initialDocStatus,
      saleStatus: 'NAO_INICIADA',
      receivementStatus: 'NAO_APLICAVEL',
      payoutStatus: 'NAO_APLICAVEL',
      duplicateOfReferralId: existingActiveReferral?.id,
      protectionExpiresAt: protectionDate.toISOString(),
      notes: input.notes,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    const newDoc: ReferralDocument = {
      id: `doc-${Date.now()}`,
      referralId: newRefId,
      templateVersion: 'TERMO-CONSENTIMENTO-v1.2',
      status: initialDocStatus,
      generatedAt: hasConflict ? undefined : now.toISOString(),
      GeneratedByUserId: hasConflict ? undefined : currentUser?.id,
    };

    setClients((prev) => [newClient, ...prev]);
    setReferrals((prev) => [newReferral, ...prev]);
    setDocuments((prev) => [newDoc, ...prev]);

    if (hasConflict && existingActiveReferral) {
      appendAudit(
        'DUPLICATE_DETECTED',
        'DUPLICATE',
        newRefId,
        `Conflito de duplicidade detectado ao registrar ${code}`,
        `Contato normalizado (${phoneNorm} / ${emailNorm}) conflita com indicação ${existingActiveReferral.code}. Encaminhado para Análise de Duplicidade.`
      );
    } else {
      appendAudit(
        'REFERRAL_CREATED',
        'REFERRAL',
        newRefId,
        `Nova indicação ${code} registrada (${input.modality})`,
        `Cliente: ${newClient.name} | Modalidade: ${input.modality} | Sem duplicidade na base.`
      );
    }

    return { referral: newReferral, hasConflict };
  };

  /**
   * Resolução auditada de duplicidade com justificativa obrigatória
   */
  const resolveDuplicate = (
    referralId: string,
    decision: 'APPROVE_NEW' | 'REJECT_AS_DUPLICATE',
    justification: string
  ) => {
    const target = referrals.find((r) => r.id === referralId);
    if (!target) return;
    const now = new Date().toISOString();

    setReferrals((prev) =>
      prev.map((r) =>
        r.id === referralId
          ? {
              ...r,
              status: decision === 'APPROVE_NEW' ? 'AGUARDANDO_CONSENTIMENTO' : 'CONFLITO_REJEITADO',
              duplicateResolutionNote: justification,
              duplicateResolvedById: currentUser?.id,
              duplicateResolvedAt: now,
              updatedAt: now,
            }
          : r
      )
    );

    appendAudit(
      decision === 'APPROVE_NEW' ? 'DUPLICATE_APPROVED_EXCEPTION' : 'DUPLICATE_REJECTED_PRIORITY',
      'DUPLICATE',
      referralId,
      `Duplicidade resolvida para ${target.code}: ${
        decision === 'APPROVE_NEW' ? 'Liberada para Termo' : 'Rejeitada (Prioridade 1º Registro)'
      }`,
      `Justificativa registrada: "${justification}"`
    );
  };

  /**
   * Geração de Termo de Consentimento versionado
   */
  const generateConsentTerm = (referralId: string) => {
    const now = new Date().toISOString();
    const ref = referrals.find((r) => r.id === referralId);
    if (!ref) return;

    setDocuments((prev) =>
      prev.map((d) =>
        d.referralId === referralId
          ? {
              ...d,
              status: 'GERADO_AGUARDANDO_ASSINATURA',
              generatedAt: now,
              GeneratedByUserId: currentUser?.id,
            }
          : d
      )
    );

    setReferrals((prev) =>
      prev.map((r) =>
        r.id === referralId
          ? {
              ...r,
              documentStatus: 'GERADO_AGUARDANDO_ASSINATURA',
              updatedAt: now,
            }
          : r
      )
    );

    appendAudit(
      'DOCUMENT_GENERATED',
      'DOCUMENT',
      referralId,
      `Termo de Consentimento gerado para ${ref.code}`,
      `Modelo TERMO-CONSENTIMENTO-v1.2 emitido para assinatura manual do cliente.`
    );
  };

  /**
   * Registro de recebimento do documento assinado manualmente
   */
  const uploadSignedConsentTerm = (referralId: string, fileName: string) => {
    const now = new Date().toISOString();
    const ref = referrals.find((r) => r.id === referralId);
    if (!ref) return;
    const storageKey = `private/consent-terms/2026/10/${ref.code}-${fileName.replace(/\s+/g, '_')}`;

    setDocuments((prev) =>
      prev.map((d) =>
        d.referralId === referralId
          ? {
              ...d,
              status: 'RECEBIDO_AGUARDANDO_CONFERENCIA',
              fileName,
              storageKey,
              receivedAt: now,
              receivedByUserId: currentUser?.id,
            }
          : d
      )
    );

    setReferrals((prev) =>
      prev.map((r) =>
        r.id === referralId
          ? {
              ...r,
              documentStatus: 'RECEBIDO_AGUARDANDO_CONFERENCIA',
              updatedAt: now,
            }
          : r
      )
    );

    appendAudit(
      'DOCUMENT_RECEIVED',
      'DOCUMENT',
      referralId,
      `Arquivo de termo assinado registrado para ${ref.code}`,
      `Chave privada Supabase Storage: ${storageKey}. Aguardando conferência manual.`
    );
  };

  /**
   * Conferência manual (aprovação libera atendimento; rejeição mantém bloqueio)
   */
  const reviewConsentTerm = (referralId: string, approved: boolean, reviewNotes: string) => {
    const now = new Date().toISOString();
    const ref = referrals.find((r) => r.id === referralId);
    if (!ref) return;

    setDocuments((prev) =>
      prev.map((d) =>
        d.referralId === referralId
          ? {
              ...d,
              status: approved ? 'APROVADO' : 'REJEITADO',
              reviewedAt: now,
              reviewedByUserId: currentUser?.id,
              reviewNotes,
            }
          : d
      )
    );

    setReferrals((prev) =>
      prev.map((r) =>
        r.id === referralId
          ? {
              ...r,
              documentStatus: approved ? 'APROVADO' : 'REJEITADO',
              status: approved ? 'LIBERADA_ATENDIMENTO' : 'AGUARDANDO_CONSENTIMENTO',
              updatedAt: now,
            }
          : r
      )
    );

    appendAudit(
      approved ? 'DOCUMENT_APPROVED' : 'DOCUMENT_REJECTED',
      'DOCUMENT',
      referralId,
      `Termo de Consentimento ${approved ? 'APROVADO' : 'REJEITADO'} (${ref.code})`,
      `${
        approved
          ? 'Indicação liberada para Atendimento Comercial.'
          : 'Documento rejeitado na conferência manual.'
      } Parecer: "${reviewNotes}"`
    );
  };

  /**
   * Registro de atividade de atendimento comercial
   */
  const addAttendance = (
    referralId: string,
    type: AttendanceType,
    title: string,
    description: string,
    nextReferralStatus?: ReferralStatus
  ) => {
    const ref = referrals.find((r) => r.id === referralId);
    if (!ref || ref.documentStatus !== 'APROVADO') return;
    if (
      currentUser?.role === 'BROKER' &&
      (ref.brokerId !== currentUser.brokerId || ref.modality !== 'CONECTA')
    ) {
      return;
    }

    const now = new Date().toISOString();
    const newAtt: Attendance = {
      id: `att-${Date.now()}`,
      referralId,
      type,
      title,
      description,
      createdByUserId: currentUser?.id || 'usr-op-1',
      createdAt: now,
    };

    setAttendances((prev) => [newAtt, ...prev]);

    const statusToApply =
      nextReferralStatus ||
      (ref.status === 'LIBERADA_ATENDIMENTO' ? 'EM_ATENDIMENTO' : ref.status);

    const alreadyHasSale = sales.some((s) => s.referralId === referralId);

    if (statusToApply === 'VENDA_CONFIRMADA' && !alreadyHasSale) {
      const dev = developments.find((d) => d.id === ref.developmentId);
      registerSale({
        referralId: ref.id,
        developmentId: ref.developmentId,
        unitIdentifier: 'Unidade Comercializada (Via Atendimento)',
        contractNumber: `CTR-${ref.code}`,
        saleValueCents: dev?.averageTicketCents || 85000000,
        commissionRatePercent: dev?.defaultCommissionRate || 4.0,
        createInitialInstallments: true,
      });
    } else {
      setReferrals((prev) =>
        prev.map((r) =>
          r.id === referralId
            ? {
                ...r,
                status: statusToApply,
                saleStatus:
                  statusToApply === 'VENDA_CONFIRMADA'
                    ? 'CONFIRMADA'
                    : type === 'PROPOSTA_COMERCIAL' && r.saleStatus === 'NAO_INICIADA'
                    ? 'EM_NEGOCIACAO'
                    : r.saleStatus,
                updatedAt: now,
              }
            : r
        )
      );
    }

    appendAudit(
      'ATTENDANCE_LOGGED',
      'ATTENDANCE',
      referralId,
      `Atividade registrada em ${ref.code}: ${title}`,
      `Tipo: ${type} | Modalidade: ${ref.modality} | Status: ${statusToApply}`
    );
  };

  /**
   * Registro de Venda e Cálculo Imutável de Comissão 50/50
   */
  const registerSale = (input: CreateSaleInput): Sale => {
    const now = new Date().toISOString();
    const ref = referrals.find((r) => r.id === input.referralId);
    const saleId = `sale-${Date.now()}`;
    const commId = `comm-${Date.now()}`;
    const nextSaleCode = `VND-2026-${String(sales.length + 1).padStart(3, '0')}`;

    const grossCents = Math.round((input.saleValueCents * input.commissionRatePercent) / 100);
    const taxRate = commissionConfig.defaultTaxDeductionPercent;
    const taxCents =
      commissionConfig.splitBase === 'LIQUIDA'
        ? Math.round((grossCents * taxRate) / 100)
        : 0;
    const netBaseCents = grossCents - taxCents;
    const brokerCents = Math.round(
      (netBaseCents * commissionConfig.defaultBrokerSharePercent) / 100
    );
    const linnkCents = netBaseCents - brokerCents;

    const commission: CommissionCalculation = {
      id: commId,
      saleId,
      ruleVersion: commissionConfig.currentVersion,
      splitBase: commissionConfig.splitBase,
      commissionRatePercent: input.commissionRatePercent,
      grossCommissionCents: grossCents,
      taxDeductionRatePercent: taxRate,
      taxDeductionCents: taxCents,
      netCalculableBaseCents: netBaseCents,
      brokerSharePercent: commissionConfig.defaultBrokerSharePercent,
      brokerCommissionCents: brokerCents,
      linnkSharePercent: commissionConfig.defaultLinnkSharePercent,
      linnkCommissionCents: linnkCents,
      calculatedAt: now,
    };

    const newSale: Sale = {
      id: saleId,
      code: nextSaleCode,
      referralId: input.referralId,
      developmentId: input.developmentId,
      unitIdentifier: input.unitIdentifier,
      contractNumber: input.contractNumber,
      saleValueCents: input.saleValueCents,
      saleDate: now,
      status: 'CONFIRMADA',
      registeredByUserId: currentUser?.id || 'usr-admin-1',
      commission,
    };

    setSales((prev) => [newSale, ...prev]);

    if (input.createInitialInstallments) {
      const due1 = new Date();
      due1.setDate(due1.getDate() + 15);
      const due2 = new Date();
      due2.setDate(due2.getDate() + 18);

      const recTx: FinancialTransaction = {
        id: `fin-rec-${Date.now()}`,
        saleId,
        commissionId: commId,
        type: 'RECEBIMENTO_INCORPORADORA',
        installmentLabel: 'Parcela Única · Recebimento Incorporadora',
        amountCents: grossCents,
        dueDate: due1.toISOString().slice(0, 10),
        status: 'PENDENTE',
        createdByUserId: currentUser?.id || 'usr-admin-1',
        createdAt: now,
      };

      const payTx: FinancialTransaction = {
        id: `fin-pay-${Date.now() + 1}`,
        saleId,
        commissionId: commId,
        type: 'REPASSE_CORRETOR',
        installmentLabel: 'Repasse 50% Corretor Parceiro',
        amountCents: brokerCents,
        dueDate: due2.toISOString().slice(0, 10),
        status: 'PENDENTE',
        createdByUserId: currentUser?.id || 'usr-admin-1',
        createdAt: now,
      };

      setTransactions((prev) => [recTx, payTx, ...prev]);
    }

    setReferrals((prev) =>
      prev.map((r) =>
        r.id === input.referralId
          ? {
              ...r,
              status: 'VENDA_CONFIRMADA',
              saleStatus: 'CONFIRMADA',
              receivementStatus: 'PENDENTE',
              payoutStatus: 'PENDENTE',
              updatedAt: now,
            }
          : r
      )
    );

    appendAudit(
      'SALE_REGISTERED',
      'SALE',
      saleId,
      `Venda ${nextSaleCode} registrada para ${ref?.code || input.referralId}`,
      `Unidade: ${input.unitIdentifier} | Regra congelada: ${commission.ruleVersion} (${commission.splitBase}).`
    );

    return newSale;
  };

  /**
   * Recalcula os status financeiros independentes de uma venda/indicação
   */
  const syncFinancialStatuses = (saleId: string, updatedTxs: FinancialTransaction[]) => {
    const sale = sales.find((s) => s.id === saleId);
    if (!sale) return;

    const saleTxs = updatedTxs.filter((t) => t.saleId === saleId);
    const confirmedReceived = saleTxs
      .filter((t) => t.type === 'RECEBIMENTO_INCORPORADORA' && t.status === 'CONFIRMADO')
      .reduce((acc, t) => acc + t.amountCents, 0);
    const reversedReceived = saleTxs
      .filter((t) => t.type === 'ESTORNO_RECEBIMENTO')
      .reduce((acc, t) => acc + Math.abs(t.amountCents), 0);
    const netReceived = Math.max(0, confirmedReceived - reversedReceived);

    const confirmedPaid = saleTxs
      .filter((t) => t.type === 'REPASSE_CORRETOR' && t.status === 'CONFIRMADO')
      .reduce((acc, t) => acc + t.amountCents, 0);
    const reversedPaid = saleTxs
      .filter((t) => t.type === 'ESTORNO_REPASSE')
      .reduce((acc, t) => acc + Math.abs(t.amountCents), 0);
    const netPaid = Math.max(0, confirmedPaid - reversedPaid);

    const recStatus: FinancialFlowStatus =
      netReceived <= 0
        ? 'PENDENTE'
        : netReceived >= sale.commission.grossCommissionCents
        ? 'QUITADO'
        : 'PARCIAL';

    const payStatus: FinancialFlowStatus =
      netPaid <= 0
        ? 'PENDENTE'
        : netPaid >= sale.commission.brokerCommissionCents
        ? 'QUITADO'
        : 'PARCIAL';

    setReferrals((prev) =>
      prev.map((r) =>
        r.id === sale.referralId
          ? {
              ...r,
              receivementStatus: recStatus,
              payoutStatus: payStatus,
              updatedAt: new Date().toISOString(),
            }
          : r
      )
    );
  };

  /**
   * Registro manual de recebimento da incorporadora ou repasse ao corretor (suporta parcelas)
   */
  const registerTransaction = (input: RegisterTransactionInput) => {
    const sale = sales.find((s) => s.id === input.saleId);
    if (!sale) return;
    const now = new Date().toISOString();

    const newTx: FinancialTransaction = {
      id: `fin-${Date.now()}`,
      saleId: sale.id,
      commissionId: sale.commission.id,
      type: input.type,
      installmentLabel: input.installmentLabel,
      amountCents: input.amountCents,
      dueDate: input.dueDate,
      paidAt: input.confirmImmediately ? now : undefined,
      status: input.confirmImmediately ? 'CONFIRMADO' : 'PENDENTE',
      receiptStorageKey: input.receiptFileName
        ? `private/finance/2026/10/${sale.code}-${input.receiptFileName.replace(/\s+/g, '_')}`
        : undefined,
      createdByUserId: currentUser?.id || 'usr-admin-1',
      createdAt: now,
    };

    const nextList = [newTx, ...transactions];
    setTransactions(nextList);
    syncFinancialStatuses(sale.id, nextList);

    appendAudit(
      input.type === 'RECEBIMENTO_INCORPORADORA' ? 'RECEIVEMENT_LOGGED' : 'PAYOUT_LOGGED',
      'FINANCE',
      newTx.id,
      `${
        input.type === 'RECEBIMENTO_INCORPORADORA' ? 'Recebimento' : 'Repasse'
      } registrado em ${sale.code}: ${input.installmentLabel}`,
      `Status: ${newTx.status} | Movimentação financeira manual registrada.`
    );
  };

  const confirmPendingTransaction = (transactionId: string, receiptFileName?: string) => {
    const target = transactions.find((t) => t.id === transactionId);
    if (!target) return;
    const now = new Date().toISOString();

    const nextList = transactions.map((t) =>
      t.id === transactionId
        ? {
            ...t,
            status: 'CONFIRMADO' as const,
            paidAt: now,
            receiptStorageKey: receiptFileName
              ? `private/finance/2026/10/${receiptFileName.replace(/\s+/g, '_')}`
              : t.receiptStorageKey || `private/finance/2026/10/comprovante_${t.id}.pdf`,
          }
        : t
    );

    setTransactions(nextList);
    syncFinancialStatuses(target.saleId, nextList);

    appendAudit(
      'TRANSACTION_CONFIRMED',
      'FINANCE',
      transactionId,
      `Movimentação financeira confirmada: ${target.installmentLabel}`,
      `Confirmada manualmente com comprovante privado vinculado.`
    );
  };

  /**
   * Correções financeiras auditáveis — Nunca apaga silenciosamente, cria registro de estorno vinculado
   */
  const reverseTransaction = (transactionId: string, reason: string) => {
    const orig = transactions.find((t) => t.id === transactionId);
    if (!orig || orig.status !== 'CONFIRMADO') return;
    const now = new Date().toISOString();

    const reversalType =
      orig.type === 'RECEBIMENTO_INCORPORADORA' ? 'ESTORNO_RECEBIMENTO' : 'ESTORNO_REPASSE';

    const reversalTx: FinancialTransaction = {
      id: `fin-rev-${Date.now()}`,
      saleId: orig.saleId,
      commissionId: orig.commissionId,
      type: reversalType,
      installmentLabel: `ESTORNO: ${orig.installmentLabel}`,
      amountCents: -Math.abs(orig.amountCents),
      dueDate: now.slice(0, 10),
      paidAt: now,
      status: 'CONFIRMADO',
      reversalOfTransactionId: orig.id,
      reversalReason: reason,
      createdByUserId: currentUser?.id || 'usr-admin-1',
      createdAt: now,
    };

    const nextList = [
      reversalTx,
      ...transactions.map((t) =>
        t.id === transactionId
          ? {
              ...t,
              status: 'ESTORNADO' as const,
              reversalReason: reason,
            }
          : t
      ),
    ];

    setTransactions(nextList);
    syncFinancialStatuses(orig.saleId, nextList);

    appendAudit(
      'FINANCIAL_REVERSAL',
      'FINANCE',
      reversalTx.id,
      `Estorno auditado sobre ${orig.installmentLabel}`,
      `Registro original preservado (${orig.id}). Motivo do estorno: "${reason}"`
    );
  };

  const saveBroker = (
    brokerInput: Omit<Broker, 'id' | 'createdAt' | 'phoneNormalized'>,
    id?: string
  ) => {
    const phoneNorm = normalizePhone(brokerInput.phone);
    if (id) {
      setBrokers((prev) =>
        prev.map((b) => (b.id === id ? { ...b, ...brokerInput, phoneNormalized: phoneNorm } : b))
      );
      appendAudit(
        'BROKER_UPDATED',
        'BROKER',
        id,
        `Cadastro do corretor ${brokerInput.name} atualizado`,
        `Cidade: ${brokerInput.city}/${brokerInput.state} | Modalidade padrão: ${brokerInput.defaultModality}`
      );
    } else {
      const newId = `brk-${Date.now()}`;
      const newBroker: Broker = {
        ...brokerInput,
        id: newId,
        phoneNormalized: phoneNorm,
        createdAt: new Date().toISOString(),
      };
      setBrokers((prev) => [newBroker, ...prev]);
      appendAudit(
        'BROKER_CREATED',
        'BROKER',
        newId,
        `Novo corretor parceiro cadastrado: ${newBroker.name}`,
        `CRECI/Vínculo: ${newBroker.creci} | Cidade: ${newBroker.city}`
      );
    }
  };

  const toggleBrokerActive = (brokerId: string) => {
    const target = brokers.find((b) => b.id === brokerId);
    if (!target) return;
    const nextState = !target.active;
    setBrokers((prev) => prev.map((b) => (b.id === brokerId ? { ...b, active: nextState } : b)));
    appendAudit(
      nextState ? 'BROKER_ACTIVATED' : 'BROKER_INACTIVATED',
      'BROKER',
      brokerId,
      `Corretor ${target.name} ${nextState ? 'reativado' : 'inativado'}`,
      `Histórico comercial preservado integralmente.`
    );
  };

  const saveDevelopment = (devInput: Omit<Development, 'id'>, id?: string) => {
    if (id) {
      setDevelopments((prev) => prev.map((d) => (d.id === id ? { ...devInput, id } : d)));
      appendAudit(
        'DEVELOPMENT_UPDATED',
        'DEVELOPMENT',
        id,
        `Empreendimento atualizado: ${devInput.name}`,
        `Comissão padrão: ${devInput.defaultCommissionRate}% | Selo LINNK: ${devInput.linnkSealVerified ? 'Sim' : 'Não'}`
      );
    } else {
      const newId = `devm-${Date.now()}`;
      setDevelopments((prev) => [{ ...devInput, id: newId }, ...prev]);
      appendAudit(
        'DEVELOPMENT_CREATED',
        'DEVELOPMENT',
        newId,
        `Novo empreendimento na curadoria: ${devInput.name}`,
        `Registro de Incorporação: ${devInput.incorporationRegistry}`
      );
    }
  };

  const toggleDevelopmentActive = (devId: string) => {
    const target = developments.find((d) => d.id === devId);
    if (!target) return;
    const nextState = !target.active;
    setDevelopments((prev) => prev.map((d) => (d.id === devId ? { ...d, active: nextState } : d)));
    appendAudit(
      nextState ? 'DEVELOPMENT_ACTIVATED' : 'DEVELOPMENT_INACTIVATED',
      'DEVELOPMENT',
      devId,
      `Empreendimento ${target.name} ${nextState ? 'ativado' : 'inativado'}`,
      `Histórico de indicações e vendas preservado.`
    );
  };

  const saveDeveloper = (devInput: Omit<Developer, 'id'>, id?: string) => {
    if (id) {
      setDevelopers((prev) => prev.map((d) => (d.id === id ? { ...devInput, id } : d)));
    } else {
      const newId = `devp-${Date.now()}`;
      setDevelopers((prev) => [{ ...devInput, id: newId }, ...prev]);
      appendAudit(
        'DEVELOPER_CREATED',
        'DEVELOPMENT',
        newId,
        `Nova incorporadora cadastrada: ${devInput.name}`,
        `CNPJ: ${devInput.cnpj} | Cidade: ${devInput.city}`
      );
    }
  };

  const toggleDeveloperActive = (devId: string) => {
    setDevelopers((prev) => prev.map((d) => (d.id === devId ? { ...d, active: !d.active } : d)));
  };

  const updateCommissionConfig = (patch: Partial<CommissionRuleConfig>) => {
    const now = new Date().toISOString();
    const nextConfig: CommissionRuleConfig = {
      ...commissionConfig,
      ...patch,
      updatedAt: now,
      updatedByUserId: currentUser?.id || 'usr-admin-1',
    };
    setCommissionConfig(nextConfig);
    appendAudit(
      'COMMISSION_RULE_UPDATED',
      'CONFIG',
      nextConfig.currentVersion,
      `Regra de comissão atualizada (${nextConfig.currentVersion})`,
      `Base: ${nextConfig.splitBase} | Divisão: ${nextConfig.defaultBrokerSharePercent}% Corretor / ${nextConfig.defaultLinnkSharePercent}% LINNK | Imposto: ${nextConfig.defaultTaxDeductionPercent}%. Vendas anteriores mantêm cálculo congelado.`
    );
  };

  const updateOperatorPermissions = (userId: string, permissions: OperatorPermissions) => {
    const target = users.find((u) => u.id === userId);
    if (!target) return;
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, permissions } : u)));
    if (currentUser?.id === userId) {
      setCurrentUser({ ...currentUser, permissions });
    }
    appendAudit(
      'USER_PERMISSIONS_UPDATED',
      'CONFIG',
      userId,
      `Permissões granulares atualizadas para ${target.name}`,
      `Princípio do menor privilégio aplicado.`
    );
  };

  const toggleUserActive = (userId: string) => {
    const target = users.find((u) => u.id === userId);
    if (!target || target.id === currentUser?.id) return;
    const nextState = !target.active;
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, active: nextState } : u)));
    appendAudit(
      nextState ? 'USER_ACTIVATED' : 'USER_INACTIVATED',
      'CONFIG',
      userId,
      `Usuário interno ${target.name} ${nextState ? 'ativado' : 'inativado'}`,
      `Papel: ${target.role}`
    );
  };

  const createUser = (input: {
    name: string;
    email: string;
    role: 'ADMIN' | 'OPERATOR' | 'BROKER';
    title: string;
  }) => {
    const newId = `usr-${Date.now()}`;
    const newUser: User = {
      id: newId,
      name: input.name,
      email: input.email,
      role: input.role,
      title: input.title,
      active: true,
      lastLoginAt: new Date().toISOString(),
      permissions:
        input.role === 'OPERATOR'
          ? {
              canEditBrokers: true,
              canEditDevelopments: false,
              canResolveDuplicates: true,
              canRegisterSales: true,
              canViewCommissions: true,
              canRegisterFinance: false,
              canViewAuditRestricted: false,
            }
          : undefined,
    };
    setUsers((prev) => [...prev, newUser]);
    appendAudit(
      'USER_CREATED',
      'CONFIG',
      newId,
      `Novo usuário interno criado: ${newUser.name} (${newUser.role})`,
      `E-mail: ${newUser.email}`
    );
  };

  const updateCurrentUserProfile = (patch: {
    name?: string;
    email?: string;
    title?: string;
    avatarUrl?: string;
  }) => {
    if (!currentUser) return;
    const updatedUser: User = {
      ...currentUser,
      name: patch.name !== undefined ? patch.name : currentUser.name,
      email: patch.email !== undefined ? patch.email : currentUser.email,
      title: patch.title !== undefined ? patch.title : currentUser.title,
      avatarUrl: patch.avatarUrl !== undefined ? patch.avatarUrl : currentUser.avatarUrl,
    };
    setCurrentUser(updatedUser);
    setUsers((prev) => prev.map((u) => (u.id === currentUser.id ? updatedUser : u)));
    appendAudit(
      'USER_PROFILE_UPDATED',
      'CONFIG',
      currentUser.id,
      `Perfil atualizado por ${updatedUser.name}`,
      `Dados pessoais / avatar atualizados na seção Meu Perfil.`
    );
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        activeNav,
        setActiveNav,
        selectedReferralId,
        setSelectedReferralId,
        loginAs,
        logout,
        users,
        brokers,
        developers,
        developments,
        clients,
        referrals,
        documents,
        attendances,
        sales,
        transactions,
        auditLogs,
        commissionConfig,
        createReferral,
        resolveDuplicate,
        generateConsentTerm,
        uploadSignedConsentTerm,
        reviewConsentTerm,
        addAttendance,
        registerSale,
        registerTransaction,
        confirmPendingTransaction,
        reverseTransaction,
        saveBroker,
        toggleBrokerActive,
        saveDevelopment,
        toggleDevelopmentActive,
        saveDeveloper,
        toggleDeveloperActive,
        updateCommissionConfig,
        updateOperatorPermissions,
        toggleUserActive,
        createUser,
        updateCurrentUserProfile,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
