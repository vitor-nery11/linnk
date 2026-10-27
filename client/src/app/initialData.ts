import {
  Attendance,
  AuditLog,
  Broker,
  Client,
  CommissionRuleConfig,
  Developer,
  Development,
  FinancialTransaction,
  Referral,
  ReferralDocument,
  Sale,
  User,
} from './types';

// Coleções limpas: todos os dados passam a ser originados exclusivamente do Supabase
export const INITIAL_USERS: User[] = [];
export const INITIAL_DEVELOPERS: Developer[] = [];
export const INITIAL_DEVELOPMENTS: Development[] = [];
export const INITIAL_BROKERS: Broker[] = [];
export const INITIAL_CLIENTS: Client[] = [];
export const INITIAL_REFERRALS: Referral[] = [];
export const INITIAL_DOCUMENTS: ReferralDocument[] = [];
export const INITIAL_ATTENDANCES: Attendance[] = [];
export const INITIAL_SALES: Sale[] = [];
export const INITIAL_TRANSACTIONS: FinancialTransaction[] = [];
export const INITIAL_AUDIT_LOGS: AuditLog[] = [];

export const INITIAL_COMMISSION_CONFIG: CommissionRuleConfig = {
  currentVersion: 'REGRA-50-50-LIQ-v1.0',
  defaultBrokerSharePercent: 50,
  defaultLinnkSharePercent: 50,
  splitBase: 'LIQUIDA',
  defaultTaxDeductionPercent: 6.0,
  protectionMonths: 6,
  duplicatePriorityRule: 'PRIMEIRA_INDICACAO_VALIDA',
  allowMultipleSalesPerReferral: false,
  updatedAt: new Date().toISOString(),
  updatedByUserId: '',
};
