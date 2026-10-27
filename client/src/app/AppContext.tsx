import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
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
  SaleStatus,
  User,
  UserRole,
} from './types';
import { formatCentsToBRL, formatDateBR, normalizeEmail, normalizePhone } from '../lib/formatters';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { SupabaseService, isValidUuid } from '../services/supabaseService';
import { EmailService } from '../services/emailService';
import {
  INITIAL_ATTENDANCES,
  INITIAL_AUDIT_LOGS,
  INITIAL_BROKERS,
  INITIAL_CLIENTS,
  INITIAL_COMMISSION_CONFIG,
  INITIAL_DEVELOPERS,
  INITIAL_DEVELOPMENTS,
  INITIAL_DOCUMENTS,
  INITIAL_REFERRALS,
  INITIAL_SALES,
  INITIAL_TRANSACTIONS,
  INITIAL_USERS,
} from './initialData';

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
  isInitialLoading: boolean;
  loginAs: (userId: string) => void;
  loginWithCredentials: (
    email: string,
    role: UserRole,
    password?: string
  ) => Promise<{ ok: boolean; error?: string }>;
  registerBroker: (input: {
    name: string;
    email: string;
    phone: string;
    creci: string;
    city: string;
    state: string;
    defaultModality: Modality;
    pixKey: string;
    password: string;
    adhesionTermSigned: boolean;
    ndaTermSigned: boolean;
  }) => Promise<{ ok: boolean; error?: string; emailConfirmationRequired?: boolean }>;
  logout: () => Promise<void> | void;
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
  sendConsentTermEmail: (
    referralId: string,
    recipientEmail?: string,
    customMessage?: string
  ) => Promise<{ ok: boolean; error?: string; message?: string; simulated?: boolean }>;
  uploadSignedConsentTerm: (
    referralId: string,
    fileOrName: File | string,
    fileUrl?: string
  ) => Promise<void> | void;
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
  reopenTransactionForConfirmation: (transactionId: string) => void;
  saveBroker: (broker: Omit<Broker, 'id' | 'createdAt' | 'phoneNormalized'>, id?: string) => void;
  toggleBrokerActive: (brokerId: string) => void;
  saveDevelopment: (dev: Omit<Development, 'id'>, id?: string) => void;
  toggleDevelopmentActive: (devId: string) => void;
  saveDeveloper: (dev: Omit<Developer, 'id'>, id?: string) => void;
  toggleDeveloperActive: (devId: string) => void;
  updateCommissionConfig: (patch: Partial<CommissionRuleConfig>) => void;
  updateOperatorPermissions: (userId: string, permissions: OperatorPermissions) => void;
  toggleUserActive: (userId: string) => void;
  createUser: (input: { name: string; email: string; role: 'ADMIN' | 'OPERATOR' | 'BROKER'; title: string; brokerId?: string }) => void;
  updateUser: (
    userId: string,
    patch: {
      name: string;
      email: string;
      role: UserRole;
      title: string;
      brokerId?: string;
      permissions?: OperatorPermissions;
    }
  ) => void;
  updateCurrentUserProfile: (patch: { name?: string; email?: string; title?: string; avatarUrl?: string }) => void;
}

const DEFAULT_COMMISSION_CONFIG: CommissionRuleConfig = {
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

function getInitialStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const item = window.localStorage.getItem(key);
    if (!item) return fallback;
    const parsed = JSON.parse(item);
    if (Array.isArray(fallback) && Array.isArray(parsed) && parsed.length === 0 && fallback.length > 0) {
      return fallback;
    }
    return parsed;
  } catch (e) {
    return fallback;
  }
}

function setLocalStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    // ignore
  }
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeNav, setActiveNav] = useState<NavSection>('dashboard');
  const [selectedReferralId, setSelectedReferralId] = useState<string | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const [users, setUsers] = useState<User[]>(() => getInitialStorage('linnk_users', INITIAL_USERS));
  const [brokers, setBrokers] = useState<Broker[]>(() => getInitialStorage('linnk_brokers', INITIAL_BROKERS));
  const [developers, setDevelopers] = useState<Developer[]>(() => getInitialStorage('linnk_developers', INITIAL_DEVELOPERS));
  const [developments, setDevelopments] = useState<Development[]>(() => getInitialStorage('linnk_developments', INITIAL_DEVELOPMENTS));
  const [clients, setClients] = useState<Client[]>(() => getInitialStorage('linnk_clients', INITIAL_CLIENTS));
  const [referrals, setReferrals] = useState<Referral[]>(() => getInitialStorage('linnk_referrals', INITIAL_REFERRALS));
  const [documents, setDocuments] = useState<ReferralDocument[]>(() => getInitialStorage('linnk_documents', INITIAL_DOCUMENTS));
  const [attendances, setAttendances] = useState<Attendance[]>(() => getInitialStorage('linnk_attendances', INITIAL_ATTENDANCES));
  const [sales, setSales] = useState<Sale[]>(() => getInitialStorage('linnk_sales', INITIAL_SALES));
  const [transactions, setTransactions] = useState<FinancialTransaction[]>(() => getInitialStorage('linnk_transactions', INITIAL_TRANSACTIONS));
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => getInitialStorage('linnk_audit_logs', INITIAL_AUDIT_LOGS));
  const [commissionConfig, setCommissionConfig] = useState<CommissionRuleConfig>(
    () => getInitialStorage('linnk_comm_config', INITIAL_COMMISSION_CONFIG)
  );

  useEffect(() => { setLocalStorage('linnk_sales', sales); }, [sales]);
  useEffect(() => { setLocalStorage('linnk_transactions', transactions); }, [transactions]);
  useEffect(() => { setLocalStorage('linnk_referrals', referrals); }, [referrals]);
  useEffect(() => { setLocalStorage('linnk_documents', documents); }, [documents]);
  useEffect(() => { setLocalStorage('linnk_attendances', attendances); }, [attendances]);
  useEffect(() => { setLocalStorage('linnk_clients', clients); }, [clients]);
  useEffect(() => { setLocalStorage('linnk_developments', developments); }, [developments]);
  useEffect(() => { setLocalStorage('linnk_brokers', brokers); }, [brokers]);
  useEffect(() => { setLocalStorage('linnk_developers', developers); }, [developers]);
  useEffect(() => { setLocalStorage('linnk_users', users); }, [users]);
  useEffect(() => { setLocalStorage('linnk_audit_logs', auditLogs); }, [auditLogs]);
  useEffect(() => { setLocalStorage('linnk_comm_config', commissionConfig); }, [commissionConfig]);

  // Sincronização e migração garantida para o cliente Marcelo Scher e seus dados financeiros
  useEffect(() => {
    // 1. Garantir cliente Marcelo Scher em clients
    setClients((prev) => {
      const hasScher = prev.some(
        (c) => c.id === 'cli-scher' || c.name.toLowerCase().includes('scher')
      );
      if (!hasScher) {
        const scherClient = INITIAL_CLIENTS.find((c) => c.id === 'cli-scher');
        return scherClient ? [scherClient, ...prev] : prev;
      }
      return prev;
    });

    // 2. Garantir indicação ref-1 associada a Marcelo Scher
    setReferrals((prev) => {
      let changed = false;
      const next = prev.map((r) => {
        if (r.id === 'ref-1' && r.clientId !== 'cli-scher') {
          changed = true;
          return {
            ...r,
            clientId: 'cli-scher',
            status: 'VENDA_CONFIRMADA' as ReferralStatus,
            saleStatus: 'CONFIRMADA' as SaleStatus,
          };
        }
        return r;
      });
      return changed ? next : prev;
    });

    // 3. Garantir venda no Financeiro para o cliente Marcelo Scher sem texto legado de Torre Mar
    setSales((prev) => {
      if (!prev || prev.length === 0) {
        return INITIAL_SALES;
      }
      let changed = false;
      const next = prev.map((s) => {
        if (s.unitIdentifier.includes('Torre Mar') || s.id === 'sale-1') {
          changed = true;
          return {
            ...s,
            referralId: 'ref-1',
            unitIdentifier: s.unitIdentifier.includes('Torre Mar')
              ? 'Unidade 802 · Solarium Vista Mar'
              : s.unitIdentifier,
          };
        }
        return s;
      });
      return changed ? next : prev;
    });

    // 4. Garantir transações financeiras para a venda se estiverem vazias
    setTransactions((prev) => {
      if (!prev || prev.length === 0) {
        return INITIAL_TRANSACTIONS;
      }
      return prev;
    });
  }, []);

  // Helper para gravação simultânea de logs de auditoria (local + Supabase)
  const appendAudit = (
    action: string,
    module: AuditLog['module'],
    entityId: string,
    summary: string,
    details: string,
    actorOverride?: User
  ) => {
    const actor = actorOverride ||
      currentUser || {
        id: 'system',
        name: 'Sistema LINNK',
        role: 'ADMIN' as UserRole,
      };
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

    if (isSupabaseConfigured) {
      SupabaseService.appendAuditLog(newLog).catch((err) => {
        console.warn('[AppContext] Falha ao persistir log de auditoria no Supabase:', err);
      });
    }
  };

  const loadRemotePromiseRef = useRef<Promise<void> | null>(null);
  const lastLoadTimeRef = useRef<number>(0);
  const isMountedRef = useRef<boolean>(true);
  const currentUserRef = useRef<User | null>(null);
  const isAuthenticatingRef = useRef<boolean>(false);

  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  const applyAuthenticatedUser = (user: User) => {
    currentUserRef.current = user;
    setCurrentUser(user);
    if (user.role === 'OPERATOR' && (activeNav === 'users' || activeNav === 'audit')) {
      setActiveNav('dashboard');
    }
    if (
      user.role === 'BROKER' &&
      ![
        'dashboard',
        'referrals',
        'documents',
        'attendances',
        'developments',
        'sales',
        'profile',
      ].includes(activeNav)
    ) {
      setActiveNav('dashboard');
    }
    appendAudit(
      'USER_LOGIN',
      'AUTH',
      user.id,
      `Sessão autenticada como ${user.name} (${user.role})`,
      `Acesso autenticado. Perfil aplicado: ${user.role}.`,
      user
    );
  };

  // Carregar dados de todas as entidades remotas do Supabase (com proteção anti-duplicação e debounce)
  const loadRemoteData = async (force: boolean = false): Promise<void> => {
    if (!isSupabaseConfigured) return;

    // Se já houver um carregamento remoto em curso, reaproveita a mesma Promise em voo
    if (loadRemotePromiseRef.current) {
      return loadRemotePromiseRef.current;
    }

    // Debounce: se buscou há menos de 3 segundos e não é uma chamada forçada, ignora
    const now = Date.now();
    if (!force && now - lastLoadTimeRef.current < 3000) {
      return;
    }

    const fetchPromise = (async () => {
      try {
        const data = await SupabaseService.fetchAllInitialData();
        if (data) {
          if (data.users && data.users.length > 0) setUsers(data.users);
          if (data.brokers && data.brokers.length > 0) setBrokers(data.brokers);
          if (data.developers && data.developers.length > 0) setDevelopers(data.developers);
          if (data.developments && data.developments.length > 0) setDevelopments(data.developments);
          if (data.clients && data.clients.length > 0) setClients(data.clients);
          if (data.referrals && data.referrals.length > 0) setReferrals(data.referrals);
          if (data.documents && data.documents.length > 0) setDocuments(data.documents);
          if (data.attendances && data.attendances.length > 0) setAttendances(data.attendances);
          if (data.sales && data.sales.length > 0) setSales(data.sales);
          if (data.transactions && data.transactions.length > 0) setTransactions(data.transactions);
          if (data.auditLogs && data.auditLogs.length > 0) setAuditLogs(data.auditLogs);
          if (data.commissionConfig) {
            setCommissionConfig(data.commissionConfig);
          }
          lastLoadTimeRef.current = Date.now();
        }
      } catch (err) {
        console.error('[AppContext] Erro ao sincronizar dados com Supabase:', err);
      } finally {
        loadRemotePromiseRef.current = null;
      }
    })();

    loadRemotePromiseRef.current = fetchPromise;
    return fetchPromise;
  };

  // Efeito inicial: verificar sessão Supabase persistida e carregar dados em background
  useEffect(() => {
    isMountedRef.current = true;

    // Failsafe timeout: garante que o app NUNCA fique travado no loading por mais de 1 segundo
    const loadingTimeout = setTimeout(() => {
      setIsInitialLoading(false);
    }, 1000);

    async function initializeSession() {
      if (!isSupabaseConfigured) {
        setIsInitialLoading(false);
        return;
      }

      try {
        const remoteDataPromise = loadRemoteData(true);

        // Limita o tempo de espera pela verificação de sessão a 1.2s para nunca travar a tela
        const sessionUserPromise = SupabaseService.getCurrentSessionUser();
        const timeoutPromise = new Promise<null>((resolve) =>
          setTimeout(() => resolve(null), 1200)
        );
        const sessionUser = await Promise.race([sessionUserPromise, timeoutPromise]);

        if (sessionUser) {
          applyAuthenticatedUser(sessionUser);
        }
        await remoteDataPromise;
      } catch (err) {
        console.warn('[AppContext] Erro ao restaurar sessão Supabase:', err);
      } finally {
        clearTimeout(loadingTimeout);
        setIsInitialLoading(false);
      }
    }

    initializeSession();

    // Listener para eventos de autenticação do Supabase (login, logout, refresh de token)
    const { data: authSubscription } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Se estiver no meio do fluxo explícito de login (loginWithCredentials),
      // não aplica o usuário automaticamente até que a verificação de permissão/papel seja concluída
      if (isAuthenticatingRef.current) {
        if (event === 'SIGNED_OUT') {
          currentUserRef.current = null;
          setCurrentUser(null);
        }
        return;
      }

      if (event === 'SIGNED_OUT') {
        currentUserRef.current = null;
        setCurrentUser(null);
      } else if (event === 'SIGNED_IN' && session?.user) {
        // Ignora evento se o usuário atual já for este (evita duplicar requests)
        if (currentUserRef.current?.id === session.user.id) {
          return;
        }
        const user = await SupabaseService.getCurrentSessionUser();
        if (user) {
          applyAuthenticatedUser(user);
          loadRemoteData();
        }
      }
    });

    return () => {
      isMountedRef.current = false;
      clearTimeout(loadingTimeout);
      authSubscription.subscription.unsubscribe();
    };
  }, []);

  const loginAs = (userId: string) => {
    const found = users.find((u) => u.id === userId);
    if (!found || !found.active) return;
    applyAuthenticatedUser(found);
  };

  const loginWithCredentials = async (
    emailInput: string,
    role: UserRole,
    passwordInput?: string
  ): Promise<{ ok: boolean; error?: string }> => {
    const cleanEmail = normalizeEmail(emailInput);
    if (!cleanEmail) {
      return { ok: false, error: 'Informe um e-mail válido.' };
    }
    const password = passwordInput || 'Password123!';

    if (!isSupabaseConfigured) {
      return { ok: false, error: 'Supabase não está configurado no ambiente.' };
    }

    isAuthenticatingRef.current = true;
    try {
      // 1. Tentar autenticação via Supabase Auth (sem auto-cadastro)
      const authRes = await SupabaseService.signIn(cleanEmail, password);

      if (!authRes.ok) {
        if (authRes.error?.toLowerCase().includes('email not confirmed')) {
          return {
            ok: false,
            error:
              'E-mail não confirmado. Verifique seu e-mail ou desative "Confirm email" em Authentication > Providers > Email no painel do Supabase.',
          };
        }
        if (
          authRes.error?.toLowerCase().includes('invalid login credentials') ||
          authRes.error?.toLowerCase().includes('user not found')
        ) {
          if (role === 'ADMIN') {
            return {
              ok: false,
              error:
                'Você não é um usuário autorizado. Contas de Administrador são restritas e criadas exclusivamente pelo desenvolvedor.',
            };
          }
          if (role === 'OPERATOR') {
            return {
              ok: false,
              error:
                'Você não é um usuário autorizado. Contas de Operador são restritas e criadas exclusivamente pelo desenvolvedor.',
            };
          }
          return {
            ok: false,
            error:
              'E-mail ou senha incorretos. Novos corretores parceiros devem realizar o cadastro pelo botão "Cadastre-se como Corretor Parceiro".',
          };
        }
        return { ok: false, error: authRes.error };
      }

      // 2. Buscar perfil no Supabase e validar estritamente o papel selecionado
      const sessionUser = await SupabaseService.getCurrentSessionUser();
      if (!sessionUser) {
        await SupabaseService.signOut();
        return { ok: false, error: 'Falha ao recuperar perfil autenticado no Supabase.' };
      }

      // Operador e Administrador não podem ser acessados por contas sem esses privilégios
      if (role === 'ADMIN' && sessionUser.role !== 'ADMIN') {
        await SupabaseService.signOut();
        return {
          ok: false,
          error:
            'Você não é um usuário autorizado para acessar como Administrador. Contas administrativas são criadas exclusivamente pelo desenvolvedor.',
        };
      }

      if (role === 'OPERATOR' && sessionUser.role !== 'OPERATOR' && sessionUser.role !== 'ADMIN') {
        await SupabaseService.signOut();
        return {
          ok: false,
          error:
            'Você não é um usuário autorizado para acessar como Operador. Contas de operador são criadas exclusivamente pelo desenvolvedor.',
        };
      }

      if (!sessionUser.active) {
        await SupabaseService.signOut();
        return {
          ok: false,
          error: 'Esta conta de usuário está inativa. Solicite suporte ao Administrador.',
        };
      }

      applyAuthenticatedUser(sessionUser);
      await loadRemoteData(true);
      return { ok: true };
    } finally {
      isAuthenticatingRef.current = false;
    }
  };

  const logout = async () => {
    if (isSupabaseConfigured) {
      await SupabaseService.signOut();
    }
    setCurrentUser(null);
    setActiveNav('dashboard');
  };

  const registerBroker = async (input: {
    name: string;
    email: string;
    phone: string;
    creci: string;
    city: string;
    state: string;
    defaultModality: Modality;
    pixKey: string;
    password: string;
    adhesionTermSigned: boolean;
    ndaTermSigned: boolean;
  }): Promise<{ ok: boolean; error?: string; emailConfirmationRequired?: boolean }> => {
    const cleanEmail = normalizeEmail(input.email);
    if (!cleanEmail) return { ok: false, error: 'Informe um e-mail válido.' };
    const cleanPhone = normalizePhone(input.phone);
    if (!cleanPhone || cleanPhone.length < 10) {
      return { ok: false, error: 'Informe um número de telefone/WhatsApp válido com DDD.' };
    }
    if (!input.name.trim()) return { ok: false, error: 'Informe seu nome completo.' };
    if (!input.creci.trim()) return { ok: false, error: 'Informe seu CRECI ou identificação profissional.' };
    if (!input.city.trim()) return { ok: false, error: 'Informe sua cidade de atuação.' };
    if (!input.password || input.password.length < 6) {
      return { ok: false, error: 'A senha deve conter no mínimo 6 caracteres.' };
    }
    if (!input.adhesionTermSigned) {
      return { ok: false, error: 'É necessário concordar com o Termo de Adesão e Parceria Comercial LINNK.' };
    }
    if (!input.ndaTermSigned) {
      return { ok: false, error: 'É necessário concordar com o Termo de Confidencialidade (NDA).' };
    }

    if (!isSupabaseConfigured) {
      return { ok: false, error: 'Supabase não está configurado no ambiente.' };
    }

    try {
      const regRes = await SupabaseService.registerBroker({
        ...input,
        email: cleanEmail,
        phone: input.phone.trim(),
      });

      if (!regRes.ok) {
        return { ok: false, error: regRes.error };
      }

      if (!regRes.session) {
        return {
          ok: true,
          emailConfirmationRequired: true,
        };
      }

      // Sessão ativa: aplicar usuário do Supabase e sincronizar
      const sessionUser = await SupabaseService.getCurrentSessionUser();
      const userId = regRes.user?.id || sessionUser?.id;
      if (sessionUser) {
        applyAuthenticatedUser(sessionUser);
      } else if (userId) {
        const userToApply: User = {
          id: userId,
          name: input.name.trim(),
          email: cleanEmail,
          role: 'BROKER' as UserRole,
          title: 'Corretor Parceiro',
          active: true,
          lastLoginAt: new Date().toISOString(),
          brokerId: regRes.broker?.id,
        };
        applyAuthenticatedUser(userToApply);
      }
      await loadRemoteData(true);
      return { ok: true, emailConfirmationRequired: false };
    } catch (err: any) {
      console.warn('[AppContext] Falha ao registrar no Supabase:', err);
      return { ok: false, error: err.message || 'Erro inesperado ao registrar corretor no Supabase.' };
    }
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

    const newClientId = conflictingClient ? conflictingClient.id : `cli-${Date.now()}`;
    const newClient: Client = conflictingClient || {
      id: newClientId,
      name: input.clientName.trim(),
      phone: input.clientPhone.trim(),
      phoneNormalized: phoneNorm,
      email: input.clientEmail.trim(),
      emailNormalized: emailNorm,
      city: input.clientCity.trim(),
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
      assignedOperatorId: currentUser?.id || '',
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

    if (!conflictingClient) {
      setClients((prev) => [newClient, ...prev]);
    }
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

    // Persistência assíncrona no Supabase
    if (isSupabaseConfigured) {
      SupabaseService.createReferralWithClient(
        {
          name: newClient.name,
          phone: newClient.phone,
          email: newClient.email,
          city: newClient.city,
          notes: newClient.notes,
        },
        {
          code: newReferral.code,
          brokerId: newReferral.brokerId,
          developmentId: newReferral.developmentId,
          modality: newReferral.modality,
          assignedOperatorId: newReferral.assignedOperatorId,
          status: newReferral.status,
          documentStatus: newReferral.documentStatus,
          saleStatus: newReferral.saleStatus,
          receivementStatus: newReferral.receivementStatus,
          payoutStatus: newReferral.payoutStatus,
          duplicateOfReferralId: newReferral.duplicateOfReferralId,
          protectionExpiresAt: newReferral.protectionExpiresAt,
          notes: newReferral.notes,
        },
        {
          templateVersion: newDoc.templateVersion,
          status: newDoc.status,
          generatedAt: newDoc.generatedAt,
          GeneratedByUserId: newDoc.GeneratedByUserId,
        }
      )
        .then((result) => {
          if (result) {
            setClients((prev) =>
              prev.map((c) => (c.id === newClientId ? result.client : c))
            );
            setReferrals((prev) =>
              prev.map((r) => (r.id === newRefId ? result.referral : r))
            );
            if (result.document) {
              setDocuments((prev) =>
                prev.map((d) => (d.id === newDoc.id ? result.document! : d))
              );
            }
          }
        })
        .catch((err) => {
          console.error('[AppContext] Erro ao persistir indicação no Supabase:', err);
        });
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
    const nextStatus =
      decision === 'APPROVE_NEW' ? 'AGUARDANDO_CONSENTIMENTO' : 'CONFLITO_REJEITADO';

    setReferrals((prev) =>
      prev.map((r) =>
        r.id === referralId
          ? {
              ...r,
              status: nextStatus,
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

    if (isSupabaseConfigured) {
      SupabaseService.updateReferralStatus(referralId, nextStatus, {
        duplicateResolutionNote: justification,
        duplicateResolvedById: currentUser?.id,
      }).catch((e) => console.error('[AppContext] Erro ao atualizar duplicidade:', e));
    }
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

    if (isSupabaseConfigured) {
      SupabaseService.updateReferralStatus(referralId, ref.status, {
        documentStatus: 'GERADO_AGUARDANDO_ASSINATURA',
      });
      const targetDoc = documents.find((d) => d.referralId === referralId);
      if (targetDoc) {
        SupabaseService.saveReferralDocument({
          ...targetDoc,
          status: 'GERADO_AGUARDANDO_ASSINATURA',
          generatedAt: now,
          GeneratedByUserId: currentUser?.id,
        });
      }
    }
  };

  /**
   * Envio do Termo de Consentimento para o cliente via Resend (com auditoria e rastreio)
   */
  const sendConsentTermEmail = async (
    referralId: string,
    recipientEmail?: string,
    customMessage?: string
  ): Promise<{ ok: boolean; error?: string; message?: string; simulated?: boolean }> => {
    const ref = referrals.find((r) => r.id === referralId);
    if (!ref) return { ok: false, error: 'Indicação não encontrada.' };

    const cli = clients.find((c) => c.id === ref.clientId);
    const brk = brokers.find((b) => b.id === ref.brokerId);
    const dev = developments.find((d) => d.id === ref.developmentId);
    const developer = developers.find((dv) => dv.id === dev?.developerId);

    const targetEmail = recipientEmail?.trim() || cli?.email?.trim();
    if (!targetEmail || !targetEmail.includes('@')) {
      return { ok: false, error: 'Informe um endereço de e-mail válido para o envio do termo.' };
    }

    const emailRes = await EmailService.sendConsentTerm({
      referralCode: ref.code,
      clientName: cli?.name || 'Cliente',
      clientEmail: targetEmail,
      brokerName: brk?.name || 'Corretor Parceiro LINNK',
      brokerPhone: brk?.phone,
      brokerCreci: brk?.creci,
      developmentName: dev?.name || 'Empreendimento LINNK',
      developerName: developer?.name || developer?.legalName,
      city: dev?.city || cli?.city || 'Bahia',
      protectionExpiresAt: ref.protectionExpiresAt ? formatDateBR(ref.protectionExpiresAt) : undefined,
      customMessage,
    });

    if (emailRes.ok) {
      const now = new Date().toISOString();
      setDocuments((prev) =>
        prev.map((d) =>
          d.referralId === referralId
            ? {
                ...d,
                sentAt: now,
                sentToEmail: targetEmail,
              }
            : d
        )
      );

      appendAudit(
        'CONSENT_EMAIL_SENT',
        'DOCUMENT',
        referralId,
        `Termo de Consentimento ${ref.code} enviado por e-mail para ${targetEmail}`,
        emailRes.simulated
          ? `[Modo Simulação] Disparo simulado com sucesso para ${targetEmail}. Mensagem personalizada: "${customMessage || 'Sem mensagem adicional'}".`
          : `Disparo via Resend confirmado (Message ID: ${emailRes.messageId || 'N/A'}). Destinatário: ${targetEmail}. Mensagem: "${customMessage || 'Sem mensagem adicional'}".`
      );
    }

    return emailRes;
  };

  /**
   * Registro de recebimento do documento assinado manualmente
   */
  const uploadSignedConsentTerm = async (
    referralId: string,
    fileOrName: File | string,
    customFileUrl?: string
  ) => {
    const now = new Date().toISOString();
    const ref = referrals.find((r) => r.id === referralId);
    if (!ref) return;

    const isActualFile = typeof fileOrName !== 'string' && fileOrName instanceof File;
    const fileName = isActualFile ? fileOrName.name : fileOrName;
    const safeName = fileName.replace(/\s+/g, '_');
    const storageKey = `consent-terms/${ref.code}-${Date.now()}-${safeName}`;
    let fileUrl = customFileUrl || '';

    if (isActualFile) {
      if (isSupabaseConfigured) {
        try {
          const res = await SupabaseService.uploadConsentDocument(fileOrName, storageKey);
          if (res.ok && res.publicUrl) {
            fileUrl = res.publicUrl;
          } else if (!res.ok) {
            throw new Error(res.error || 'Erro ao realizar upload do arquivo para o servidor.');
          }
        } catch (e: any) {
          console.warn('[AppContext] Erro ao enviar para Supabase Storage:', e);
          throw e;
        }
      }

      if (!fileUrl && typeof window !== 'undefined' && window.URL) {
        try {
          fileUrl = URL.createObjectURL(fileOrName);
        } catch (e) {
          console.warn('Erro ao criar ObjectURL:', e);
        }
      }
    }

    setDocuments((prev) =>
      prev.map((d) =>
        d.referralId === referralId
          ? {
              ...d,
              status: 'RECEBIDO_AGUARDANDO_CONFERENCIA',
              fileName,
              storageKey,
              fileUrl: fileUrl || d.fileUrl,
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
      `Arquivo de termo assinado anexado para ${ref.code}`,
      `Nome do arquivo: ${fileName}. Chave de armazenamento: ${storageKey}. Aguardando conferência manual.`
    );

    if (isSupabaseConfigured) {
      SupabaseService.updateReferralStatus(referralId, ref.status, {
        documentStatus: 'RECEBIDO_AGUARDANDO_CONFERENCIA',
      });
      const targetDoc = documents.find((d) => d.referralId === referralId);
      if (targetDoc) {
        SupabaseService.saveReferralDocument({
          ...targetDoc,
          status: 'RECEBIDO_AGUARDANDO_CONFERENCIA',
          fileName,
          storageKey,
          receivedAt: now,
          receivedByUserId: currentUser?.id,
        });
      }
    }
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

    const nextStatus = approved ? 'LIBERADA_ATENDIMENTO' : 'AGUARDANDO_CONSENTIMENTO';
    const nextDocStatus = approved ? 'APROVADO' : 'REJEITADO';

    setReferrals((prev) =>
      prev.map((r) =>
        r.id === referralId
          ? {
              ...r,
              documentStatus: nextDocStatus,
              status: nextStatus,
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

    if (isSupabaseConfigured) {
      SupabaseService.updateReferralStatus(referralId, nextStatus, {
        documentStatus: nextDocStatus,
      });
      const targetDoc = documents.find((d) => d.referralId === referralId);
      if (targetDoc) {
        SupabaseService.saveReferralDocument({
          ...targetDoc,
          status: nextDocStatus,
          reviewedAt: now,
          reviewedByUserId: currentUser?.id,
          reviewNotes,
        });
      }
    }
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
      createdByUserId: currentUser?.id || '',
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
      if (isSupabaseConfigured) {
        SupabaseService.updateReferralStatus(referralId, statusToApply);
      }
    }

    appendAudit(
      'ATTENDANCE_LOGGED',
      'ATTENDANCE',
      referralId,
      `Atividade registrada em ${ref.code}: ${title}`,
      `Tipo: ${type} | Modalidade: ${ref.modality} | Status: ${statusToApply}`
    );

    if (isSupabaseConfigured) {
      SupabaseService.createAttendance(newAtt).then((saved) => {
        if (saved) {
          setAttendances((prev) =>
            prev.map((a) => (a.id === newAtt.id ? saved : a))
          );
        }
      });
    }
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
      registeredByUserId: currentUser?.id || '',
      commission,
    };

    setSales((prev) => [newSale, ...prev]);

    let recTx: FinancialTransaction | undefined;
    let payTx: FinancialTransaction | undefined;

    if (input.createInitialInstallments) {
      const due1 = new Date();
      due1.setDate(due1.getDate() + 15);
      const due2 = new Date();
      due2.setDate(due2.getDate() + 18);

      recTx = {
        id: `fin-rec-${Date.now()}`,
        saleId,
        commissionId: commId,
        type: 'RECEBIMENTO_INCORPORADORA',
        installmentLabel: 'Parcela Única · Recebimento Incorporadora',
        amountCents: grossCents,
        dueDate: due1.toISOString().slice(0, 10),
        status: 'PENDENTE',
        createdByUserId: currentUser?.id || '',
        createdAt: now,
      };

      payTx = {
        id: `fin-pay-${Date.now() + 1}`,
        saleId,
        commissionId: commId,
        type: 'REPASSE_CORRETOR',
        installmentLabel: 'Repasse 50% Corretor Parceiro',
        amountCents: brokerCents,
        dueDate: due2.toISOString().slice(0, 10),
        status: 'PENDENTE',
        createdByUserId: currentUser?.id || '',
        createdAt: now,
      };

      setTransactions((prev) => [recTx!, payTx!, ...prev]);
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

    if (isSupabaseConfigured) {
      SupabaseService.createSaleWithCommission(newSale).then((saved) => {
        if (saved) {
          setSales((prev) => prev.map((s) => (s.id === saleId ? saved : s)));
          if (recTx) {
            SupabaseService.createFinancialTransaction({
              ...recTx,
              saleId: saved.id,
              commissionId: saved.commission.id,
            });
          }
          if (payTx) {
            SupabaseService.createFinancialTransaction({
              ...payTx,
              saleId: saved.id,
              commissionId: saved.commission.id,
            });
          }
        }
      });
      SupabaseService.updateReferralStatus(input.referralId, 'VENDA_CONFIRMADA');
    }

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
      createdByUserId: currentUser?.id || '',
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

    if (isSupabaseConfigured) {
      SupabaseService.createFinancialTransaction(newTx).then((saved) => {
        if (saved) {
          setTransactions((prev) =>
            prev.map((t) => (t.id === newTx.id ? saved : t))
          );
        }
      });
    }
  };

  const confirmPendingTransaction = (transactionId: string, receiptFileName?: string) => {
    const target = transactions.find((t) => t.id === transactionId);
    if (!target) return;
    const now = new Date().toISOString();
    const finalReceipt = receiptFileName
      ? `private/finance/2026/10/${receiptFileName.replace(/\s+/g, '_')}`
      : target.receiptStorageKey || `private/finance/2026/10/comprovante_${target.id}.pdf`;

    const nextList = transactions.map((t) =>
      t.id === transactionId
        ? {
            ...t,
            status: 'CONFIRMADO' as const,
            paidAt: now,
            receiptStorageKey: finalReceipt,
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

    if (isSupabaseConfigured) {
      SupabaseService.updateTransactionStatus(
        transactionId,
        'CONFIRMADO',
        now,
        finalReceipt
      );
    }
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
      createdByUserId: currentUser?.id || '',
      createdAt: now,
    };

    // Cria automaticamente nova parcela pendente para reconfirmar o recebimento ou repasse pós-estorno
    const newPendingTx: FinancialTransaction = {
      id: `fin-pend-${Date.now() + 1}`,
      saleId: orig.saleId,
      commissionId: orig.commissionId,
      type: orig.type,
      installmentLabel: `${
        orig.type === 'RECEBIMENTO_INCORPORADORA'
          ? 'Nova Entrada Incorporadora'
          : 'Novo Repasse Corretor'
      } (pós-estorno)`,
      amountCents: Math.abs(orig.amountCents),
      dueDate: now.slice(0, 10),
      status: 'PENDENTE',
      createdByUserId: currentUser?.id || '',
      createdAt: now,
    };

    const nextList = [
      newPendingTx,
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
      `Registro original preservado (${orig.id}). Motivo do estorno: "${reason}". Novo lançamento pendente adicionado para confirmação.`
    );

    if (isSupabaseConfigured) {
      SupabaseService.updateTransactionStatus(transactionId, 'ESTORNADO');
      SupabaseService.createFinancialTransaction(reversalTx);
      SupabaseService.createFinancialTransaction(newPendingTx);
    }
  };

  /**
   * Reabrir lançamento pendente para confirmar valor após estorno
   */
  const reopenTransactionForConfirmation = (transactionId: string) => {
    const orig = transactions.find((t) => t.id === transactionId);
    if (!orig || orig.status !== 'ESTORNADO') return;
    const now = new Date().toISOString();

    const targetType =
      orig.type === 'ESTORNO_RECEBIMENTO'
        ? 'RECEBIMENTO_INCORPORADORA'
        : orig.type === 'ESTORNO_REPASSE'
        ? 'REPASSE_CORRETOR'
        : orig.type;

    const newPendingTx: FinancialTransaction = {
      id: `fin-pend-${Date.now()}`,
      saleId: orig.saleId,
      commissionId: orig.commissionId,
      type: targetType,
      installmentLabel: `${
        targetType === 'RECEBIMENTO_INCORPORADORA'
          ? 'Entrada Incorporadora'
          : 'Repasse Corretor'
      } (Reaberto para Confirmação)`,
      amountCents: Math.abs(orig.amountCents),
      dueDate: now.slice(0, 10),
      status: 'PENDENTE',
      createdByUserId: currentUser?.id || '',
      createdAt: now,
    };

    const nextList = [newPendingTx, ...transactions];
    setTransactions(nextList);
    syncFinancialStatuses(orig.saleId, nextList);

    appendAudit(
      'FINANCE_REOPENED',
      'FINANCE',
      newPendingTx.id,
      `Lançamento reaberto para confirmação: ${newPendingTx.installmentLabel}`,
      `Valor: ${formatCentsToBRL(newPendingTx.amountCents)}. Reaberto a partir do estorno ${orig.id}.`
    );

    if (isSupabaseConfigured) {
      SupabaseService.createFinancialTransaction(newPendingTx);
    }
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
      if (isSupabaseConfigured) {
        SupabaseService.saveBroker(brokerInput, id);
      }
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
      if (isSupabaseConfigured) {
        SupabaseService.saveBroker(brokerInput).then((saved) => {
          if (saved) {
            setBrokers((prev) => prev.map((b) => (b.id === newId ? saved : b)));
          }
        });
      }
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
    if (isSupabaseConfigured) {
      SupabaseService.toggleBrokerActive(brokerId, nextState);
    }
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
      if (isSupabaseConfigured) {
        SupabaseService.saveDevelopment(devInput, id);
      }
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
      if (isSupabaseConfigured) {
        SupabaseService.saveDevelopment(devInput).then((saved) => {
          if (saved) {
            setDevelopments((prev) => prev.map((d) => (d.id === newId ? saved : d)));
          }
        });
      }
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
    if (isSupabaseConfigured) {
      SupabaseService.toggleDevelopmentActive(devId, nextState);
    }
  };

  const saveDeveloper = (devInput: Omit<Developer, 'id'>, id?: string) => {
    if (id) {
      setDevelopers((prev) => prev.map((d) => (d.id === id ? { ...devInput, id } : d)));
      if (isSupabaseConfigured) {
        SupabaseService.saveDeveloper(devInput, id);
      }
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
      if (isSupabaseConfigured) {
        SupabaseService.saveDeveloper(devInput).then((saved) => {
          if (saved) {
            setDevelopers((prev) => prev.map((d) => (d.id === newId ? saved : d)));
          }
        });
      }
    }
  };

  const toggleDeveloperActive = (devId: string) => {
    const target = developers.find((d) => d.id === devId);
    if (!target) return;
    const nextState = !target.active;
    setDevelopers((prev) => prev.map((d) => (d.id === devId ? { ...d, active: nextState } : d)));
    if (isSupabaseConfigured) {
      SupabaseService.toggleDeveloperActive(devId, nextState);
    }
  };

  const updateCommissionConfig = (patch: Partial<CommissionRuleConfig>) => {
    const now = new Date().toISOString();
    const nextConfig: CommissionRuleConfig = {
      ...commissionConfig,
      ...patch,
      updatedAt: now,
      updatedByUserId: currentUser?.id || '',
    };
    setCommissionConfig(nextConfig);
    appendAudit(
      'COMMISSION_RULE_UPDATED',
      'CONFIG',
      nextConfig.currentVersion,
      `Regra de comissão atualizada (${nextConfig.currentVersion})`,
      `Base: ${nextConfig.splitBase} | Divisão: ${nextConfig.defaultBrokerSharePercent}% Corretor / ${nextConfig.defaultLinnkSharePercent}% LINNK | Imposto: ${nextConfig.defaultTaxDeductionPercent}%. Vendas anteriores mantêm cálculo congelado.`
    );
    if (isSupabaseConfigured) {
      SupabaseService.saveCommissionConfig(nextConfig);
    }
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
    if (isSupabaseConfigured) {
      SupabaseService.updateUser(userId, { permissions });
    }
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
    if (isSupabaseConfigured) {
      SupabaseService.toggleUserActive(userId, nextState);
    }
  };

  const createUser = (input: {
    name: string;
    email: string;
    role: 'ADMIN' | 'OPERATOR' | 'BROKER';
    title: string;
    brokerId?: string;
  }) => {
    const newId = `usr-${Date.now()}`;
    const newUser: User = {
      id: newId,
      name: input.name,
      email: input.email,
      role: input.role,
      title: input.title,
      brokerId: input.role === 'BROKER' ? input.brokerId : undefined,
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

    if (isSupabaseConfigured) {
      SupabaseService.signUp(input.email, 'Password123!', input.name, input.role).catch((err) => {
        console.warn('[AppContext] Erro ao cadastrar usuário no Supabase Auth:', err);
      });
    }
  };

  const updateUser = (
    userId: string,
    patch: {
      name: string;
      email: string;
      role: UserRole;
      title: string;
      brokerId?: string;
      permissions?: OperatorPermissions;
    }
  ) => {
    const target = users.find((u) => u.id === userId);
    if (!target) return;

    const effectiveRole: UserRole =
      target.id === currentUser?.id ? 'ADMIN' : patch.role;

    const defaultOperatorPerms: OperatorPermissions = {
      canEditBrokers: true,
      canEditDevelopments: false,
      canResolveDuplicates: true,
      canRegisterSales: true,
      canViewCommissions: true,
      canRegisterFinance: false,
      canViewAuditRestricted: false,
    };

    const nextPermissions =
      effectiveRole === 'OPERATOR'
        ? patch.permissions || target.permissions || defaultOperatorPerms
        : undefined;

    const updatedUser: User = {
      ...target,
      name: patch.name.trim(),
      email: patch.email.trim(),
      role: effectiveRole,
      title: patch.title.trim(),
      brokerId: effectiveRole === 'BROKER' ? patch.brokerId : undefined,
      permissions: nextPermissions,
    };

    setUsers((prev) => prev.map((u) => (u.id === userId ? updatedUser : u)));
    if (currentUser?.id === userId) {
      setCurrentUser(updatedUser);
    }

    appendAudit(
      'USER_UPDATED',
      'CONFIG',
      userId,
      `Usuário atualizado pelo Administrador: ${updatedUser.name}`,
      `Papel: ${updatedUser.role} | E-mail: ${updatedUser.email} | Cargo: ${updatedUser.title}`
    );

    if (isSupabaseConfigured) {
      SupabaseService.updateUser(userId, {
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        title: updatedUser.title,
        brokerId: updatedUser.brokerId,
        permissions: updatedUser.permissions,
      });
    }
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
    if (isSupabaseConfigured) {
      SupabaseService.updateUserProfile(currentUser.id, patch);
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        activeNav,
        setActiveNav,
        selectedReferralId,
        setSelectedReferralId,
        isInitialLoading,
        loginAs,
        loginWithCredentials,
        registerBroker,
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
        sendConsentTermEmail,
        uploadSignedConsentTerm,
        reviewConsentTerm,
        addAttendance,
        registerSale,
        registerTransaction,
        confirmPendingTransaction,
        reverseTransaction,
        reopenTransactionForConfirmation,
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
        updateUser,
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
