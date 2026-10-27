import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import {
  AuditLog,
  Attendance,
  Broker,
  Client,
  CommissionCalculation,
  CommissionRuleConfig,
  Developer,
  Development,
  FinancialTransaction,
  OperatorPermissions,
  Referral,
  ReferralDocument,
  Sale,
  User,
  UserRole,
} from '../app/types';

// ==============================================================================
// UTILITÁRIO: Validação de UUID para PostgreSQL
// ==============================================================================

export function isValidUuid(id?: string | null): boolean {
  if (!id) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
}

// ==============================================================================
// MAPEADORES: Banco de Dados (snake_case) <-> Frontend (camelCase)
// ==============================================================================

export function mapUserFromDb(row: any): User {
  return {
    id: row.id,
    name: row.name || 'Usuário LINNK',
    email: row.email,
    role: row.role as UserRole,
    title: row.title || '',
    active: row.active ?? true,
    lastLoginAt: row.last_login_at || row.created_at || new Date().toISOString(),
    avatarUrl: row.avatar_url || undefined,
    brokerId: row.broker_id || undefined,
    permissions: (row.permissions as OperatorPermissions) || undefined,
  };
}

export function mapBrokerFromDb(row: any): Broker {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    phoneNormalized: row.phone_normalized,
    creci: row.creci || '',
    city: row.city,
    state: row.state || 'BA',
    defaultModality: row.default_modality,
    isFoundingMember: Boolean(row.is_founding_member),
    adhesionTermSigned: Boolean(row.adhesion_term_signed),
    ndaTermSigned: Boolean(row.nda_term_signed),
    pixKey: row.pix_key || '',
    active: Boolean(row.active),
    createdAt: row.created_at,
  };
}

export function mapDeveloperFromDb(row: any): Developer {
  return {
    id: row.id,
    name: row.name,
    legalName: row.legal_name || row.name,
    cnpj: row.cnpj || '',
    city: row.city || '',
    contactName: row.contact_name || '',
    contactEmail: row.contact_email || '',
    contactPhone: row.contact_phone || '',
    paymentRuleDescription: row.payment_rule_description || '',
    active: Boolean(row.active),
  };
}

export function mapDevelopmentFromDb(row: any): Development {
  return {
    id: row.id,
    developerId: row.developer_id,
    name: row.name,
    city: row.city,
    neighborhood: row.neighborhood || '',
    incorporationRegistry: row.incorporation_registry || '',
    affectationPatrimony: Boolean(row.affectation_patrimony),
    constructionStatus: row.construction_status,
    defaultCommissionRate: Number(row.default_commission_rate),
    averageTicketCents: Number(row.average_ticket_cents || 0),
    linnkSealVerified: Boolean(row.linnk_seal_verified),
    active: Boolean(row.active),
  };
}

export function mapClientFromDb(row: any): Client {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    phoneNormalized: row.phone_normalized,
    email: row.email || '',
    emailNormalized: row.email_normalized || '',
    city: row.city || '',
    notes: row.notes || undefined,
    createdAt: row.created_at,
  };
}

export function mapReferralFromDb(row: any): Referral {
  return {
    id: row.id,
    code: row.code,
    clientId: row.client_id,
    brokerId: row.broker_id,
    developmentId: row.development_id,
    modality: row.modality,
    assignedOperatorId: row.assigned_operator_id || '',
    status: row.status,
    documentStatus: row.document_status,
    saleStatus: row.sale_status,
    receivementStatus: row.receivement_status,
    payoutStatus: row.payout_status,
    duplicateOfReferralId: row.duplicate_of_referral_id || undefined,
    duplicateResolutionNote: row.duplicate_resolution_note || undefined,
    duplicateResolvedById: row.duplicate_resolved_by_id || undefined,
    duplicateResolvedAt: row.duplicate_resolved_at || undefined,
    protectionExpiresAt: row.protection_expires_at,
    notes: row.notes || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapReferralDocumentFromDb(row: any): ReferralDocument {
  return {
    id: row.id,
    referralId: row.referral_id,
    templateVersion: row.template_version,
    status: row.status,
    generatedAt: row.generated_at || undefined,
    GeneratedByUserId: row.generated_by_user_id || undefined,
    storageKey: row.storage_key || undefined,
    fileName: row.file_name || undefined,
    receivedAt: row.received_at || undefined,
    receivedByUserId: row.received_by_user_id || undefined,
    reviewedAt: row.reviewed_at || undefined,
    reviewedByUserId: row.reviewed_by_user_id || undefined,
    reviewNotes: row.review_notes || undefined,
  };
}

export function mapAttendanceFromDb(row: any): Attendance {
  return {
    id: row.id,
    referralId: row.referral_id,
    type: row.type,
    title: row.title,
    description: row.description,
    createdByUserId: row.created_by_user_id || '',
    createdAt: row.created_at,
  };
}

export function mapSaleFromDb(saleRow: any, commRow?: any): Sale {
  const comm: CommissionCalculation = commRow
    ? {
        id: commRow.id,
        saleId: commRow.sale_id,
        ruleVersion: commRow.rule_version,
        splitBase: commRow.split_base,
        commissionRatePercent: Number(commRow.commission_rate_percent),
        grossCommissionCents: Number(commRow.gross_commission_cents),
        taxDeductionRatePercent: Number(commRow.tax_deduction_rate_percent),
        taxDeductionCents: Number(commRow.tax_deduction_cents),
        netCalculableBaseCents: Number(commRow.net_calculable_base_cents),
        brokerSharePercent: Number(commRow.broker_share_percent),
        brokerCommissionCents: Number(commRow.broker_commission_cents),
        linnkSharePercent: Number(commRow.linnk_share_percent),
        linnkCommissionCents: Number(commRow.linnk_commission_cents),
        calculatedAt: commRow.calculated_at,
      }
    : {
        id: `comm-${saleRow.id}`,
        saleId: saleRow.id,
        ruleVersion: 'REGRA-50-50-LIQ-v1.0',
        splitBase: 'LIQUIDA',
        commissionRatePercent: 4.0,
        grossCommissionCents: Math.round(Number(saleRow.sale_value_cents) * 0.04),
        taxDeductionRatePercent: 6.0,
        taxDeductionCents: Math.round(Number(saleRow.sale_value_cents) * 0.04 * 0.06),
        netCalculableBaseCents: Math.round(Number(saleRow.sale_value_cents) * 0.04 * 0.94),
        brokerSharePercent: 50,
        brokerCommissionCents: Math.round(Number(saleRow.sale_value_cents) * 0.04 * 0.94 * 0.5),
        linnkSharePercent: 50,
        linnkCommissionCents: Math.round(Number(saleRow.sale_value_cents) * 0.04 * 0.94 * 0.5),
        calculatedAt: saleRow.sale_date,
      };

  return {
    id: saleRow.id,
    code: saleRow.code,
    referralId: saleRow.referral_id,
    developmentId: saleRow.development_id,
    unitIdentifier: saleRow.unit_identifier,
    contractNumber: saleRow.contract_number,
    saleValueCents: Number(saleRow.sale_value_cents),
    saleDate: saleRow.sale_date,
    status: saleRow.status,
    registeredByUserId: saleRow.registered_by_user_id || '',
    commission: comm,
  };
}

export function mapFinancialTransactionFromDb(row: any): FinancialTransaction {
  return {
    id: row.id,
    saleId: row.sale_id,
    commissionId: row.commission_id || '',
    type: row.type,
    installmentLabel: row.installment_label,
    amountCents: Number(row.amount_cents),
    dueDate: row.due_date,
    paidAt: row.paid_at || undefined,
    status: row.status,
    receiptStorageKey: row.receipt_storage_key || undefined,
    reversalOfTransactionId: row.reversal_of_transaction_id || undefined,
    reversalReason: row.reversal_reason || undefined,
    createdByUserId: row.created_by_user_id || '',
    createdAt: row.created_at,
  };
}

export function mapAuditLogFromDb(row: any): AuditLog {
  return {
    id: row.id,
    action: row.action,
    module: row.module,
    entityId: row.entity_id,
    summary: row.summary,
    details: row.details || '',
    userId: row.user_id || '',
    userName: row.user_name,
    userRole: row.user_role as UserRole,
    createdAt: row.created_at,
  };
}

export function mapCommissionRuleConfigFromDb(row: any): CommissionRuleConfig {
  return {
    currentVersion: row.current_version,
    defaultBrokerSharePercent: Number(row.default_broker_share_percent),
    defaultLinnkSharePercent: Number(row.default_linnk_share_percent),
    splitBase: row.split_base,
    defaultTaxDeductionPercent: Number(row.default_tax_deduction_percent),
    protectionMonths: Number(row.protection_months),
    duplicatePriorityRule: row.duplicate_priority_rule,
    allowMultipleSalesPerReferral: Boolean(row.allow_multiple_sales_per_referral),
    updatedAt: row.updated_at,
    updatedByUserId: row.updated_by_user_id || '',
  };
}

// ==============================================================================
// OPERAÇÕES REMOTAS (SUPABASE)
// ==============================================================================

// ==============================================================================
// UTILITÁRIO: Tratamento de Erros de Autenticação Supabase
// ==============================================================================

export function formatAuthError(error: any): string {
  if (!error) return 'Erro inesperado na autenticação.';
  const msg = typeof error === 'string' ? error : error.message || String(error);
  const code = error.code || '';

  if (
    msg.toLowerCase().includes('signups not allowed') ||
    msg.toLowerCase().includes('signup is disabled') ||
    code === 'signup_disabled' ||
    (error.status === 422 && msg.toLowerCase().includes('instance'))
  ) {
    return 'Os cadastros de novos usuários estão desativados no seu painel Supabase. Acesse o painel em Authentication > Providers > Email e ATIVE a opção "Allow new users to sign up" (e clique em Save).';
  }
  if (msg.toLowerCase().includes('email not confirmed')) {
    return 'E-mail não confirmado. Verifique seu e-mail ou desative "Confirm email" em Authentication > Providers > Email no painel do Supabase para login imediato.';
  }
  if (msg.toLowerCase().includes('invalid login credentials')) {
    return 'E-mail ou senha incorretos.';
  }
  if (msg.toLowerCase().includes('already registered') || msg.toLowerCase().includes('user already exists')) {
    return 'Este e-mail já está cadastrado na plataforma. Tente fazer login com suas credenciais.';
  }
  return msg;
}

// ==============================================================================
// OPERAÇÕES REMOTAS (SUPABASE)
// ==============================================================================

export const SupabaseService = {
  // --- CARREGAMENTO INICIAL GERAL ---
  async fetchAllInitialData() {
    if (!isSupabaseConfigured) return null;

    try {
      const [
        usersRes,
        brokersRes,
        devsRes,
        developmentsRes,
        clientsRes,
        referralsRes,
        docsRes,
        attendancesRes,
        salesRes,
        transactionsRes,
        auditRes,
        configRes,
      ] = await Promise.all([
        supabase.from('users').select('*'),
        supabase.from('brokers').select('*').order('name'),
        supabase.from('developers').select('*').order('name'),
        supabase.from('developments').select('*').order('name'),
        supabase.from('clients').select('*').order('name'),
        supabase.from('referrals').select('*').order('created_at', { ascending: false }),
        supabase.from('referral_documents').select('*'),
        supabase.from('attendances').select('*').order('created_at', { ascending: false }),
        supabase.from('sales').select('*, commissions(*)').order('sale_date', { ascending: false }),
        supabase.from('financial_transactions').select('*').order('due_date', { ascending: false }),
        supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(25),
        supabase.from('commission_rule_config').select('*').limit(1).maybeSingle(),
      ]);

      const sales = (salesRes.data || []).map((s: any) => {
        const comm = Array.isArray(s.commissions) ? s.commissions[0] : s.commissions;
        return mapSaleFromDb(s, comm);
      });

      return {
        users: (usersRes.data || []).map(mapUserFromDb),
        brokers: (brokersRes.data || []).map(mapBrokerFromDb),
        developers: (devsRes.data || []).map(mapDeveloperFromDb),
        developments: (developmentsRes.data || []).map(mapDevelopmentFromDb),
        clients: (clientsRes.data || []).map(mapClientFromDb),
        referrals: (referralsRes.data || []).map(mapReferralFromDb),
        documents: (docsRes.data || []).map(mapReferralDocumentFromDb),
        attendances: (attendancesRes.data || []).map(mapAttendanceFromDb),
        sales,
        transactions: (transactionsRes.data || []).map(mapFinancialTransactionFromDb),
        auditLogs: (auditRes.data || []).map(mapAuditLogFromDb),
        commissionConfig: configRes.data ? mapCommissionRuleConfigFromDb(configRes.data) : null,
      };
    } catch (err) {
      console.error('[SupabaseService] Erro ao buscar dados remotos:', err);
      return null;
    }
  },

  // --- AUTENTICAÇÃO ---
  async signIn(email: string, password: string) {
    if (!isSupabaseConfigured) return { ok: false, error: 'Supabase não configurado' };
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return { ok: false, error: formatAuthError(error) };
    }
    return { ok: true, session: data.session, user: data.user };
  },

  async signUp(email: string, password: string, name: string, role: UserRole) {
    if (!isSupabaseConfigured) return { ok: false, error: 'Supabase não configurado' };
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, role },
      },
    });
    if (error) {
      return { ok: false, error: formatAuthError(error) };
    }
    return { ok: true, session: data.session, user: data.user };
  },

  async registerBroker(data: {
    name: string;
    email: string;
    phone: string;
    creci: string;
    city: string;
    state: string;
    defaultModality: any;
    pixKey: string;
    password: string;
    adhesionTermSigned: boolean;
    ndaTermSigned: boolean;
  }) {
    if (!isSupabaseConfigured) return { ok: false, error: 'Supabase não configurado' };

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          name: data.name,
          role: 'BROKER',
          phone: data.phone,
          creci: data.creci,
          city: data.city,
          state: data.state,
          default_modality: data.defaultModality,
          pix_key: data.pixKey,
        },
      },
    });

    if (authError) {
      return { ok: false, error: formatAuthError(authError) };
    }

    let savedBroker: Broker | null = null;
    try {
      savedBroker = await this.saveBroker({
        name: data.name,
        email: data.email,
        phone: data.phone,
        creci: data.creci,
        city: data.city,
        state: data.state,
        defaultModality: data.defaultModality,
        isFoundingMember: false,
        adhesionTermSigned: data.adhesionTermSigned,
        ndaTermSigned: data.ndaTermSigned,
        pixKey: data.pixKey,
        active: true,
      });

      if (authData.user && savedBroker) {
        await this.updateUser(authData.user.id, {
          brokerId: savedBroker.id,
        });
      }
    } catch (brokerErr) {
      console.warn('[SupabaseService] Falha ao persistir corretor em public.brokers:', brokerErr);
    }

    return {
      ok: true,
      session: authData.session,
      user: authData.user,
      broker: savedBroker,
    };
  },

  async signOut() {
    if (!isSupabaseConfigured) return;
    await supabase.auth.signOut();
  },

  async getCurrentSessionUser() {
    if (!isSupabaseConfigured) return null;
    const { data: sessionData } = await supabase.auth.getSession();
    const authUser = sessionData?.session?.user;
    if (!authUser) return null;

    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle();

    if (profile) {
      return mapUserFromDb(profile);
    }

    return {
      id: authUser.id,
      name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'Usuário',
      email: authUser.email || '',
      role: (authUser.user_metadata?.role as UserRole) || 'BROKER',
      title: 'Usuário LINNK',
      active: true,
      lastLoginAt: new Date().toISOString(),
    };
  },

  // --- MUTATIONS: USERS ---
  async updateUserProfile(userId: string, patch: Partial<User>) {
    if (!isSupabaseConfigured || !isValidUuid(userId)) return;
    const dbPatch: any = {};
    if (patch.name !== undefined) dbPatch.name = patch.name;
    if (patch.email !== undefined) dbPatch.email = patch.email;
    if (patch.title !== undefined) dbPatch.title = patch.title;
    if (patch.avatarUrl !== undefined) dbPatch.avatar_url = patch.avatarUrl;
    await supabase.from('users').update(dbPatch).eq('id', userId);
  },

  async updateUser(
    userId: string,
    patch: {
      name?: string;
      email?: string;
      role?: UserRole;
      title?: string;
      brokerId?: string;
      permissions?: OperatorPermissions;
      active?: boolean;
    }
  ) {
    if (!isSupabaseConfigured || !isValidUuid(userId)) return;
    const dbPatch: any = {};
    if (patch.name !== undefined) dbPatch.name = patch.name;
    if (patch.email !== undefined) dbPatch.email = patch.email;
    if (patch.role !== undefined) dbPatch.role = patch.role;
    if (patch.title !== undefined) dbPatch.title = patch.title;
    if (patch.brokerId !== undefined) {
      dbPatch.broker_id = isValidUuid(patch.brokerId) ? patch.brokerId : null;
    }
    if (patch.permissions !== undefined) dbPatch.permissions = patch.permissions;
    if (patch.active !== undefined) dbPatch.active = patch.active;
    await supabase.from('users').update(dbPatch).eq('id', userId);
  },

  async toggleUserActive(userId: string, active: boolean) {
    if (!isSupabaseConfigured || !isValidUuid(userId)) return;
    await supabase.from('users').update({ active }).eq('id', userId);
  },

  // --- MUTATIONS: BROKERS ---
  async saveBroker(brokerData: Omit<Broker, 'id' | 'createdAt' | 'phoneNormalized'>, id?: string) {
    if (!isSupabaseConfigured) return null;
    const payload = {
      name: brokerData.name,
      email: brokerData.email,
      phone: brokerData.phone,
      phone_normalized: brokerData.phone.replace(/\D/g, ''),
      creci: brokerData.creci,
      city: brokerData.city,
      state: brokerData.state,
      default_modality: brokerData.defaultModality,
      is_founding_member: brokerData.isFoundingMember,
      adhesion_term_signed: brokerData.adhesionTermSigned,
      nda_term_signed: brokerData.ndaTermSigned,
      pix_key: brokerData.pixKey,
      active: brokerData.active,
    };

    if (id && isValidUuid(id)) {
      const { data, error } = await supabase.from('brokers').update(payload).eq('id', id).select().single();
      if (error) throw error;
      return mapBrokerFromDb(data);
    } else {
      const { data, error } = await supabase.from('brokers').insert([payload]).select().single();
      if (error) throw error;
      return mapBrokerFromDb(data);
    }
  },

  async toggleBrokerActive(id: string, active: boolean) {
    if (!isSupabaseConfigured || !isValidUuid(id)) return;
    await supabase.from('brokers').update({ active }).eq('id', id);
  },

  // --- MUTATIONS: DEVELOPERS & DEVELOPMENTS ---
  async saveDeveloper(devData: Omit<Developer, 'id'>, id?: string) {
    if (!isSupabaseConfigured) return null;
    const payload = {
      name: devData.name,
      legal_name: devData.legalName,
      cnpj: devData.cnpj,
      city: devData.city,
      contact_name: devData.contactName,
      contact_email: devData.contactEmail,
      contact_phone: devData.contactPhone,
      payment_rule_description: devData.paymentRuleDescription,
      active: devData.active,
    };
    if (id && isValidUuid(id)) {
      const { data, error } = await supabase.from('developers').update(payload).eq('id', id).select().single();
      if (error) throw error;
      return mapDeveloperFromDb(data);
    } else {
      const { data, error } = await supabase.from('developers').insert([payload]).select().single();
      if (error) throw error;
      return mapDeveloperFromDb(data);
    }
  },

  async toggleDeveloperActive(id: string, active: boolean) {
    if (!isSupabaseConfigured || !isValidUuid(id)) return;
    await supabase.from('developers').update({ active }).eq('id', id);
  },

  async saveDevelopment(devData: Omit<Development, 'id'>, id?: string) {
    if (!isSupabaseConfigured) return null;
    const payload = {
      developer_id: isValidUuid(devData.developerId) ? devData.developerId : null,
      name: devData.name,
      city: devData.city,
      neighborhood: devData.neighborhood,
      incorporation_registry: devData.incorporationRegistry,
      affectation_patrimony: devData.affectationPatrimony,
      construction_status: devData.constructionStatus,
      default_commission_rate: devData.defaultCommissionRate,
      average_ticket_cents: devData.averageTicketCents,
      linnk_seal_verified: devData.linnkSealVerified,
      active: devData.active,
    };
    if (id && isValidUuid(id)) {
      const { data, error } = await supabase.from('developments').update(payload).eq('id', id).select().single();
      if (error) throw error;
      return mapDevelopmentFromDb(data);
    } else {
      const { data, error } = await supabase.from('developments').insert([payload]).select().single();
      if (error) throw error;
      return mapDevelopmentFromDb(data);
    }
  },

  async toggleDevelopmentActive(id: string, active: boolean) {
    if (!isSupabaseConfigured || !isValidUuid(id)) return;
    await supabase.from('developments').update({ active }).eq('id', id);
  },

  // --- MUTATIONS: CLIENTS & REFERRALS ---
  async createClient(clientData: Omit<Client, 'id' | 'createdAt' | 'phoneNormalized' | 'emailNormalized'>) {
    if (!isSupabaseConfigured) return null;
    const payload = {
      name: clientData.name,
      phone: clientData.phone,
      phone_normalized: clientData.phone.replace(/\D/g, ''),
      email: clientData.email,
      email_normalized: clientData.email.toLowerCase().trim(),
      city: clientData.city,
      notes: clientData.notes,
    };
    const { data, error } = await supabase.from('clients').insert([payload]).select().single();
    if (error) throw error;
    return mapClientFromDb(data);
  },

  async createReferral(referral: Referral) {
    if (!isSupabaseConfigured) return null;
    const payload = {
      id: isValidUuid(referral.id) ? referral.id : undefined,
      code: referral.code,
      client_id: referral.clientId,
      broker_id: isValidUuid(referral.brokerId) ? referral.brokerId : null,
      development_id: isValidUuid(referral.developmentId) ? referral.developmentId : null,
      modality: referral.modality,
      assigned_operator_id: isValidUuid(referral.assignedOperatorId) ? referral.assignedOperatorId : null,
      status: referral.status,
      document_status: referral.documentStatus,
      sale_status: referral.saleStatus,
      receivement_status: referral.receivementStatus,
      payout_status: referral.payoutStatus,
      duplicate_of_referral_id: isValidUuid(referral.duplicateOfReferralId) ? referral.duplicateOfReferralId : null,
      protection_expires_at: referral.protectionExpiresAt,
      notes: referral.notes,
    };
    const { data, error } = await supabase.from('referrals').insert([payload]).select().single();
    if (error) throw error;
    return mapReferralFromDb(data);
  },

  async createReferralWithClient(
    clientInput: Omit<Client, 'id' | 'createdAt' | 'phoneNormalized' | 'emailNormalized'>,
    referralInput: Omit<Referral, 'id' | 'clientId' | 'createdAt' | 'updatedAt'>,
    docInput?: Omit<ReferralDocument, 'id' | 'referralId'>
  ) {
    if (!isSupabaseConfigured) return null;

    // 1. Salvar ou buscar cliente existente
    const phoneNorm = clientInput.phone.replace(/\D/g, '');
    const emailNorm = clientInput.email.toLowerCase().trim();

    let clientRow: any = null;
    if (phoneNorm.length >= 8) {
      const { data } = await supabase
        .from('clients')
        .select('*')
        .eq('phone_normalized', phoneNorm)
        .maybeSingle();
      clientRow = data;
    }
    if (!clientRow && emailNorm.length > 3) {
      const { data } = await supabase
        .from('clients')
        .select('*')
        .eq('email_normalized', emailNorm)
        .maybeSingle();
      clientRow = data;
    }

    if (!clientRow) {
      const { data, error } = await supabase
        .from('clients')
        .insert([
          {
            name: clientInput.name,
            phone: clientInput.phone,
            phone_normalized: phoneNorm,
            email: clientInput.email,
            email_normalized: emailNorm,
            city: clientInput.city,
            notes: clientInput.notes,
          },
        ])
        .select()
        .single();
      if (error) throw error;
      clientRow = data;
    }

    // 2. Salvar indicação vinculada
    const refPayload = {
      code: referralInput.code,
      client_id: clientRow.id,
      broker_id: isValidUuid(referralInput.brokerId) ? referralInput.brokerId : null,
      development_id: isValidUuid(referralInput.developmentId) ? referralInput.developmentId : null,
      modality: referralInput.modality,
      assigned_operator_id: isValidUuid(referralInput.assignedOperatorId) ? referralInput.assignedOperatorId : null,
      status: referralInput.status,
      document_status: referralInput.documentStatus,
      sale_status: referralInput.saleStatus,
      receivement_status: referralInput.receivementStatus,
      payout_status: referralInput.payoutStatus,
      duplicate_of_referral_id: isValidUuid(referralInput.duplicateOfReferralId) ? referralInput.duplicateOfReferralId : null,
      protection_expires_at: referralInput.protectionExpiresAt,
      notes: referralInput.notes,
    };

    const { data: refData, error: refError } = await supabase
      .from('referrals')
      .insert([refPayload])
      .select()
      .single();
    if (refError) throw refError;

    // 3. Salvar documento associado
    let docData: any = null;
    if (docInput) {
      const docPayload = {
        referral_id: refData.id,
        template_version: docInput.templateVersion,
        status: docInput.status,
        generated_at: docInput.generatedAt || null,
        generated_by_user_id: isValidUuid(docInput.GeneratedByUserId) ? docInput.GeneratedByUserId : null,
      };
      const { data: dData, error: dError } = await supabase
        .from('referral_documents')
        .insert([docPayload])
        .select()
        .single();
      if (!dError) docData = dData;
    }

    return {
      client: mapClientFromDb(clientRow),
      referral: mapReferralFromDb(refData),
      document: docData ? mapReferralDocumentFromDb(docData) : null,
    };
  },

  async updateReferralStatus(
    referralId: string,
    status: Referral['status'],
    patch?: Partial<{
      documentStatus: Referral['documentStatus'];
      duplicateResolutionNote: string;
      duplicateResolvedById: string;
    }>
  ) {
    if (!isSupabaseConfigured || !isValidUuid(referralId)) return;
    const updatePayload: any = {
      status,
      updated_at: new Date().toISOString(),
    };
    if (patch?.documentStatus) updatePayload.document_status = patch.documentStatus;
    if (patch?.duplicateResolutionNote) {
      updatePayload.duplicate_resolution_note = patch.duplicateResolutionNote;
      updatePayload.duplicate_resolved_at = new Date().toISOString();
    }
    if (patch?.duplicateResolvedById) {
      updatePayload.duplicate_resolved_by_id = isValidUuid(patch.duplicateResolvedById)
        ? patch.duplicateResolvedById
        : null;
    }

    await supabase.from('referrals').update(updatePayload).eq('id', referralId);
  },

  // --- MUTATIONS: REFERRAL DOCUMENTS ---
  async saveReferralDocument(doc: ReferralDocument) {
    if (!isSupabaseConfigured) return null;
    const payload = {
      id: isValidUuid(doc.id) ? doc.id : undefined,
      referral_id: isValidUuid(doc.referralId) ? doc.referralId : null,
      template_version: doc.templateVersion,
      status: doc.status,
      generated_at: doc.generatedAt,
      generated_by_user_id: isValidUuid(doc.GeneratedByUserId) ? doc.GeneratedByUserId : null,
      storage_key: doc.storageKey || null,
      file_name: doc.fileName || null,
      received_at: doc.receivedAt || null,
      received_by_user_id: isValidUuid(doc.receivedByUserId) ? doc.receivedByUserId : null,
      reviewed_at: doc.reviewedAt || null,
      reviewed_by_user_id: isValidUuid(doc.reviewedByUserId) ? doc.reviewedByUserId : null,
      review_notes: doc.reviewNotes || null,
    };
    const { data, error } = await supabase
      .from('referral_documents')
      .upsert(payload)
      .select()
      .single();
    if (error) throw error;
    return mapReferralDocumentFromDb(data);
  },

  // --- MUTATIONS: ATTENDANCES ---
  async createAttendance(att: Attendance) {
    if (!isSupabaseConfigured) return null;
    const payload = {
      id: isValidUuid(att.id) ? att.id : undefined,
      referral_id: isValidUuid(att.referralId) ? att.referralId : null,
      type: att.type,
      title: att.title,
      description: att.description,
      created_by_user_id: isValidUuid(att.createdByUserId) ? att.createdByUserId : null,
    };
    const { data, error } = await supabase.from('attendances').insert([payload]).select().single();
    if (error) throw error;
    return mapAttendanceFromDb(data);
  },

  // --- MUTATIONS: SALES & COMMISSIONS ---
  async createSaleWithCommission(sale: Sale) {
    if (!isSupabaseConfigured) return null;
    const salePayload = {
      id: isValidUuid(sale.id) ? sale.id : undefined,
      code: sale.code,
      referral_id: isValidUuid(sale.referralId) ? sale.referralId : null,
      development_id: isValidUuid(sale.developmentId) ? sale.developmentId : null,
      unit_identifier: sale.unitIdentifier,
      contract_number: sale.contractNumber,
      sale_value_cents: sale.saleValueCents,
      sale_date: sale.saleDate,
      status: sale.status,
      registered_by_user_id: isValidUuid(sale.registeredByUserId) ? sale.registeredByUserId : null,
    };

    const { data: savedSale, error: saleErr } = await supabase
      .from('sales')
      .insert([salePayload])
      .select()
      .single();
    if (saleErr) throw saleErr;

    const comm = sale.commission;
    const commPayload = {
      sale_id: savedSale.id,
      rule_version: comm.ruleVersion,
      split_base: comm.splitBase,
      commission_rate_percent: comm.commissionRatePercent,
      gross_commission_cents: comm.grossCommissionCents,
      tax_deduction_rate_percent: comm.taxDeductionRatePercent,
      tax_deduction_cents: comm.taxDeductionCents,
      net_calculable_base_cents: comm.netCalculableBaseCents,
      broker_share_percent: comm.brokerSharePercent,
      broker_commission_cents: comm.brokerCommissionCents,
      linnk_share_percent: comm.linnkSharePercent,
      linnk_commission_cents: comm.linnkCommissionCents,
    };

    const { data: savedComm, error: commErr } = await supabase
      .from('commissions')
      .insert([commPayload])
      .select()
      .single();
    if (commErr) throw commErr;

    return mapSaleFromDb(savedSale, savedComm);
  },

  // --- MUTATIONS: FINANCIAL TRANSACTIONS ---
  async createFinancialTransaction(tx: FinancialTransaction) {
    if (!isSupabaseConfigured) return null;
    const payload = {
      id: isValidUuid(tx.id) ? tx.id : undefined,
      sale_id: isValidUuid(tx.saleId) ? tx.saleId : null,
      commission_id: isValidUuid(tx.commissionId) ? tx.commissionId : null,
      type: tx.type,
      installment_label: tx.installmentLabel,
      amount_cents: tx.amountCents,
      due_date: tx.dueDate,
      paid_at: tx.paidAt || null,
      status: tx.status,
      receipt_storage_key: tx.receiptStorageKey || null,
      reversal_of_transaction_id: isValidUuid(tx.reversalOfTransactionId) ? tx.reversalOfTransactionId : null,
      reversal_reason: tx.reversalReason || null,
      created_by_user_id: isValidUuid(tx.createdByUserId) ? tx.createdByUserId : null,
    };

    const { data, error } = await supabase
      .from('financial_transactions')
      .insert([payload])
      .select()
      .single();
    if (error) throw error;
    return mapFinancialTransactionFromDb(data);
  },

  async updateTransactionStatus(
    txId: string,
    status: FinancialTransaction['status'],
    paidAt?: string,
    receiptStorageKey?: string
  ) {
    if (!isSupabaseConfigured || !isValidUuid(txId)) return;
    const patch: any = { status };
    if (paidAt) patch.paid_at = paidAt;
    if (receiptStorageKey) patch.receipt_storage_key = receiptStorageKey;
    await supabase.from('financial_transactions').update(patch).eq('id', txId);
  },

  // --- MUTATIONS: AUDIT LOGS ---
  async appendAuditLog(log: AuditLog) {
    if (!isSupabaseConfigured) return;
    try {
      await supabase.from('audit_logs').insert([
        {
          action: log.action,
          module: log.module,
          entity_id: log.entityId,
          summary: log.summary,
          details: log.details,
          user_id: log.userId && !log.userId.startsWith('usr-') ? log.userId : null,
          user_name: log.userName,
          user_role: log.userRole,
        },
      ]);
    } catch (e) {
      console.warn('[SupabaseService] Erro ao gravar log de auditoria:', e);
    }
  },

  // --- MUTATIONS: COMMISSION CONFIG ---
  async saveCommissionConfig(config: CommissionRuleConfig) {
    if (!isSupabaseConfigured) return;
    const payload = {
      current_version: config.currentVersion,
      default_broker_share_percent: config.defaultBrokerSharePercent,
      default_linnk_share_percent: config.defaultLinnkSharePercent,
      split_base: config.splitBase,
      default_tax_deduction_percent: config.defaultTaxDeductionPercent,
      protection_months: config.protectionMonths,
      duplicate_priority_rule: config.duplicatePriorityRule,
      allow_multiple_sales_per_referral: config.allowMultipleSalesPerReferral,
      updated_at: new Date().toISOString(),
      updated_by_user_id: config.updatedByUserId || null,
    };
    await supabase.from('commission_rule_config').upsert({ id: 1, ...payload });
  },
};
