import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  Calculator,
  CheckCircle2,
  DollarSign,
  Eye,
  FileCheck2,
  Filter,
  GitCompareArrows,
  Lock,
  MessageSquareMore,
  Phone,
  Plus,
  Receipt,
  Search,
  ShieldCheck,
  UserCheck,
  X,
} from 'lucide-react';
import { useApp } from '../../app/AppContext';
import { Modality, Referral, ReferralStatus } from '../../app/types';
import {
  formatCentsToBRL,
  formatDateBR,
  formatDateTimeBR,
  formatThousands,
  normalizeEmail,
  normalizePhone,
  parseBRLToCents,
} from '../../lib/formatters';
import {
  AttendanceTypeBadge,
  DocumentStatusBadge,
  FinancialFlowBadge,
  ModalityBadge,
  ReferralStatusBadge,
} from '../../components/StatusBadges';

export const ReferralsView: React.FC = () => {
  const {
    currentUser,
    referrals,
    clients,
    brokers,
    developments,
    documents,
    attendances,
    sales,
    selectedReferralId,
    setSelectedReferralId,
    createReferral,
    registerSale,
    commissionConfig,
    setActiveNav,
  } = useApp();

  const isBroker = currentUser?.role === 'BROKER';

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReferralStatus | 'ALL'>('ALL');
  const [modalityFilter, setModalityFilter] = useState<Modality | 'ALL'>('ALL');
  const [developmentFilter, setDevelopmentFilter] = useState<string>('ALL');

  const [showNewModal, setShowNewModal] = useState(false);
  const [popupReferralId, setPopupReferralId] = useState<string | null>(null);

  // Estado do modal Registrar Venda da Indicação
  const [saleModalRef, setSaleModalRef] = useState<Referral | null>(null);
  const [saleUnit, setSaleUnit] = useState('');
  const [saleContract, setSaleContract] = useState('');
  const [saleValueInput, setSaleValueInput] = useState('');
  const [saleCommissionRate, setSaleCommissionRate] = useState('4.0');

  // Estado de venda direta no cadastro de Nova Indicação
  const [isDirectSale, setIsDirectSale] = useState(false);
  const [directSaleUnit, setDirectSaleUnit] = useState('Unidade 101');
  const [directSaleValue, setDirectSaleValue] = useState('');

  // Estado do formulário de Nova Indicação
  const activeBrokers = brokers.filter((b) => b.active);
  const activeDevelopments = developments.filter((d) => d.active);

  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientCity, setClientCity] = useState('');
  const [brokerId, setBrokerId] = useState(
    currentUser?.brokerId || activeBrokers[0]?.id || ''
  );
  const [developmentId, setDevelopmentId] = useState(activeDevelopments[0]?.id || '');
  const [modality, setModality] = useState<Modality>('INDICA');
  const [notes, setNotes] = useState('');

  // RN02: Pré-verificação em tempo real por telefone e e-mail normalizado
  const liveDuplicateCheck = useMemo(() => {
    const pNorm = normalizePhone(clientPhone);
    const eNorm = normalizeEmail(clientEmail);
    if (pNorm.length < 8 && eNorm.length < 4) return null;

    const matchedClient = clients.find(
      (c) =>
        (pNorm.length >= 8 && c.phoneNormalized === pNorm) ||
        (eNorm.length >= 4 && c.emailNormalized === eNorm)
    );
    if (!matchedClient) return null;

    const activeRef = referrals.find(
      (r) =>
        r.clientId === matchedClient.id &&
        r.status !== 'CONFLITO_REJEITADO' &&
        r.status !== 'ENCERRADA_SEM_VENDA'
    );
    return activeRef ? { client: matchedClient, referral: activeRef } : null;
  }, [clientPhone, clientEmail, clients, referrals]);

  const filteredReferrals = useMemo(() => {
    const q = search.trim().toLowerCase();
    return referrals.filter((ref) => {
      if (isBroker && currentUser?.brokerId && ref.brokerId !== currentUser.brokerId) {
        return false;
      }
      if (statusFilter !== 'ALL' && ref.status !== statusFilter) return false;
      if (modalityFilter !== 'ALL' && ref.modality !== modalityFilter) return false;
      if (developmentFilter !== 'ALL' && ref.developmentId !== developmentFilter) return false;

      if (!q) return true;
      const cli = clients.find((c) => c.id === ref.clientId);
      const brk = brokers.find((b) => b.id === ref.brokerId);
      const dev = developments.find((d) => d.id === ref.developmentId);

      return (
        ref.code.toLowerCase().includes(q) ||
        (cli?.name.toLowerCase().includes(q) ?? false) ||
        (cli?.phoneNormalized.includes(q.replace(/\D/g, '')) ?? false) ||
        (cli?.emailNormalized.includes(q) ?? false) ||
        (brk?.name.toLowerCase().includes(q) ?? false) ||
        (dev?.name.toLowerCase().includes(q) ?? false)
      );
    });
  }, [
    referrals,
    clients,
    brokers,
    developments,
    search,
    statusFilter,
    modalityFilter,
    developmentFilter,
    isBroker,
    currentUser?.brokerId,
  ]);

  const selectedReferral = referrals.find((r) => r.id === popupReferralId) || null;
  const selectedClient = selectedReferral
    ? clients.find((c) => c.id === selectedReferral.clientId)
    : null;
  const selectedBroker = selectedReferral
    ? brokers.find((b) => b.id === selectedReferral.brokerId)
    : null;
  const selectedDevelopment = selectedReferral
    ? developments.find((d) => d.id === selectedReferral.developmentId)
    : null;
  const selectedDoc = selectedReferral
    ? documents.find((d) => d.referralId === selectedReferral.id)
    : null;
  const selectedAttendances = selectedReferral
    ? attendances.filter((a) => a.referralId === selectedReferral.id)
    : [];
  const selectedSale = selectedReferral
    ? sales.find((s) => s.referralId === selectedReferral.id)
    : null;

  const handleOpen360 = (refId: string) => {
    setSelectedReferralId(refId);
    setPopupReferralId(refId);
  };

  const openRegisterSaleModal = (ref: Referral) => {
    const dev = developments.find((d) => d.id === ref.developmentId);
    const defaultTicket = dev?.averageTicketCents
      ? Math.round(dev.averageTicketCents / 100)
      : 850000;
    setSaleModalRef(ref);
    setSaleUnit('Unidade 101');
    setSaleContract(`CTR-${ref.code}`);
    setSaleValueInput(formatThousands(defaultTicket));
    setSaleCommissionRate(String(dev?.defaultCommissionRate || 4.0));
    setPopupReferralId(null);
  };

  const handleConfirmSaleFromModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!saleModalRef) return;

    const rawDigits = saleValueInput.replace(/\D/g, '');
    const saleCents = rawDigits ? parseInt(rawDigits, 10) * 100 : 85000000;
    const rate = parseFloat(saleCommissionRate) || 4.0;

    registerSale({
      referralId: saleModalRef.id,
      developmentId: saleModalRef.developmentId,
      unitIdentifier: saleUnit.trim() || 'Unidade Comercializada',
      contractNumber: saleContract.trim() || `CTR-${saleModalRef.code}`,
      saleValueCents: saleCents,
      commissionRatePercent: rate,
      createInitialInstallments: true,
    });

    setSaleModalRef(null);
    setActiveNav('sales');
  };

  // Pré-cálculo da comissão no modal de venda
  const modalSaleCents = (parseInt(saleValueInput.replace(/\D/g, ''), 10) || 0) * 100;
  const modalRate = parseFloat(saleCommissionRate) || 4.0;
  const modalGrossCents = Math.round((modalSaleCents * modalRate) / 100);
  const modalTaxRate = commissionConfig?.defaultTaxDeductionPercent ?? 6.0;
  const modalTaxCents =
    commissionConfig?.splitBase === 'LIQUIDA'
      ? Math.round((modalGrossCents * modalTaxRate) / 100)
      : 0;
  const modalNetBaseCents = modalGrossCents - modalTaxCents;
  const modalBrokerSharePercent = commissionConfig?.defaultBrokerSharePercent ?? 50;
  const modalBrokerCents = Math.round((modalNetBaseCents * modalBrokerSharePercent) / 100);
  const modalLinnkCents = modalNetBaseCents - modalBrokerCents;

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !clientPhone.trim() || !brokerId || !developmentId) return;

    const { referral } = createReferral({
      clientName,
      clientPhone,
      clientEmail,
      clientCity,
      brokerId,
      developmentId,
      modality,
      notes,
    });

    if (isDirectSale) {
      const selDev = developments.find((d) => d.id === developmentId);
      const rawDigits = directSaleValue.replace(/\D/g, '');
      const saleCents = rawDigits ? parseInt(rawDigits, 10) * 100 : (selDev?.averageTicketCents || 85000000);

      registerSale({
        referralId: referral.id,
        developmentId: referral.developmentId,
        unitIdentifier: directSaleUnit.trim() || 'Unidade Comercializada',
        contractNumber: `CTR-${referral.code}`,
        saleValueCents: saleCents,
        commissionRatePercent: selDev?.defaultCommissionRate || 4.0,
        createInitialInstallments: true,
      });

      setShowNewModal(false);
      setClientName('');
      setClientPhone('');
      setClientEmail('');
      setClientCity('');
      setNotes('');
      setIsDirectSale(false);
      setActiveNav('sales');
      return;
    }

    setShowNewModal(false);
    setClientName('');
    setClientPhone('');
    setClientEmail('');
    setClientCity('');
    setNotes('');
    setIsDirectSale(false);
    setSelectedReferralId(referral.id);
    setPopupReferralId(referral.id);
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho da Seção */}
      <div className="bg-white rounded-3xl p-6 border border-linnk-stone-300/80 shadow-arch-card flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-linnk-flame">
            <GitCompareArrows className="w-4 h-4" />
            <span>Gestão Comercial</span>
          </div>
          <h2 className="font-display font-bold text-2xl text-linnk-obsidian mt-1">
            Gestão de Indicações & Clientes Protegidos
          </h2>
          <p className="text-sm text-linnk-stone-600 mt-1">
            Registre novas indicações vinculadas ao corretor parceiro, verifique
            duplicidades automaticamente e acompanhe os status da operação.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {!isBroker && (
            <button
              onClick={() => setActiveNav('duplicates')}
              className="px-4 py-2.5 rounded-2xl bg-linnk-stone-100 hover:bg-linnk-stone-200 text-linnk-obsidian font-display font-semibold text-xs sm:text-sm transition-all flex items-center gap-2"
            >
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>
                Fila de Duplicidades (
                {referrals.filter((r) => r.status === 'EM_ANALISE_DUPLICIDADE').length})
              </span>
            </button>
          )}

          <button
            onClick={() => setShowNewModal(true)}
            className="px-5 py-2.5 rounded-2xl bg-linnk-flame hover:bg-linnk-flame-600 text-white font-display font-bold text-xs sm:text-sm shadow-flame-sm transition-all flex items-center gap-2 active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Indicação</span>
          </button>
        </div>
      </div>

      {/* Barra de Busca e Filtros */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-linnk-stone-300/80 shadow-arch-card grid grid-cols-1 md:grid-cols-12 gap-3">
        <div className="md:col-span-5 relative">
          <Search className="w-4 h-4 text-linnk-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar cliente, WhatsApp, e-mail, código LNK ou corretor..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-linnk-stone-50 border border-linnk-stone-200 text-sm focus:border-linnk-flame focus:outline-none"
          />
        </div>

        <div className="md:col-span-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ReferralStatus | 'ALL')}
            className="w-full px-3.5 py-2.5 rounded-2xl bg-linnk-stone-50 border border-linnk-stone-200 text-sm focus:border-linnk-flame focus:outline-none"
          >
            <option value="ALL">Todos os Status da Indicação</option>
            <option value="EM_ANALISE_DUPLICIDADE">Em Análise de Duplicidade</option>
            <option value="AGUARDANDO_CONSENTIMENTO">Aguardando Termo</option>
            <option value="LIBERADA_ATENDIMENTO">Liberada p/ Atendimento</option>
            <option value="EM_ATENDIMENTO">Em Atendimento</option>
            <option value="PROPOSTA_ENVIADA">Proposta Enviada</option>
            <option value="VENDA_CONFIRMADA">Venda Confirmada</option>
            <option value="CONFLITO_REJEITADO">Conflito Rejeitado</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <select
            value={modalityFilter}
            onChange={(e) => setModalityFilter(e.target.value as Modality | 'ALL')}
            className="w-full px-3.5 py-2.5 rounded-2xl bg-linnk-stone-50 border border-linnk-stone-200 text-sm focus:border-linnk-flame focus:outline-none"
          >
            <option value="ALL">Todas as Modalidades</option>
            <option value="INDICA">INDICA (Closer LINNK)</option>
            <option value="CONECTA">CONECTA (Corretor)</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <select
            value={developmentFilter}
            onChange={(e) => setDevelopmentFilter(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-2xl bg-linnk-stone-50 border border-linnk-stone-200 text-sm focus:border-linnk-flame focus:outline-none"
          >
            <option value="ALL">Empreendimentos</option>
            {developments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabela de Indicações em Largura Total */}
      <div className="bg-white rounded-3xl border border-linnk-stone-300/80 shadow-arch-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-linnk-stone-50 border-b border-linnk-stone-200 text-[11px] font-mono uppercase tracking-wider text-linnk-stone-500">
                <th className="py-3.5 px-5">Indicação & Cliente</th>
                <th className="py-3.5 px-4">Corretor & Empreendimento</th>
                <th className="py-3.5 px-4">Modalidade</th>
                <th className="py-3.5 px-4">Status da Operação</th>
                <th className="py-3.5 px-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-linnk-stone-200 text-sm">
              {filteredReferrals.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 px-5 text-center text-linnk-stone-500 text-xs">
                    Nenhuma indicação encontrada. Cadastre uma nova indicação para iniciar a proteção de carteira e fluxo de atendimento.
                  </td>
                </tr>
              ) : (
                filteredReferrals.map((ref) => {
                const cli = clients.find((c) => c.id === ref.clientId);
                const brk = brokers.find((b) => b.id === ref.brokerId);
                const dev = developments.find((d) => d.id === ref.developmentId);
                const isSelected = popupReferralId === ref.id;

                return (
                  <tr
                    key={ref.id}
                    onClick={() => handleOpen360(ref.id)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-linnk-flame-50/70'
                        : 'hover:bg-linnk-stone-50/90'
                    }`}
                  >
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-linnk-flame">
                          {ref.code}
                        </span>
                        <span className="text-[11px] text-linnk-stone-400">
                          {formatDateBR(ref.createdAt)}
                        </span>
                      </div>
                      <div className="font-semibold text-linnk-obsidian mt-0.5">
                        {cli?.name}
                      </div>
                      <div className="text-xs text-linnk-stone-500 font-mono">
                        {cli?.phone} · {cli?.city}
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="font-medium text-linnk-obsidian flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-linnk-flame shrink-0" />
                        <span>{brk?.name}</span>
                      </div>
                      <div className="text-xs text-linnk-stone-500 mt-0.5 flex items-center gap-1">
                        <Building2 className="w-3 h-3 shrink-0" />
                        <span className="truncate max-w-[200px]">{dev?.name}</span>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <ModalityBadge modality={ref.modality} />
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex flex-col items-start gap-1.5">
                        <ReferralStatusBadge status={ref.status} />
                        <DocumentStatusBadge status={ref.documentStatus} />
                      </div>
                    </td>

                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {sales.some((s) => s.referralId === ref.id) ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveNav('sales');
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-display font-bold border border-emerald-200 transition-colors cursor-pointer"
                            title="Ver venda e comissões no Financeiro"
                          >
                            <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                            <span>No Financeiro</span>
                          </button>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openRegisterSaleModal(ref);
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-linnk-flame hover:bg-linnk-flame-600 text-white text-xs font-display font-bold transition-colors cursor-pointer shadow-xs"
                            title="Registrar venda desta indicação e enviar direto ao Financeiro"
                          >
                            <DollarSign className="w-3.5 h-3.5" />
                            <span>Registrar Venda</span>
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpen360(ref.id);
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-linnk-stone-100 hover:bg-linnk-obsidian hover:text-white text-xs font-display font-semibold transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Ficha 360º</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
          </table>
        </div>
      </div>

      {/* Pop-up Card Flutuante: Ficha 360º da Indicação Selecionada */}
      {selectedReferral && (
        <div
          className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setPopupReferralId(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-2xl w-full border-2 border-linnk-obsidian shadow-obsidian overflow-hidden max-h-[90vh] flex flex-col my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-linnk-obsidian text-white p-6 flex items-start justify-between shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-linnk-flame text-white font-mono text-xs font-bold">
                    {selectedReferral.code}
                  </span>
                  <span className="text-xs font-mono text-linnk-stone-400">
                    Proteção até {formatDateBR(selectedReferral.protectionExpiresAt)}
                  </span>
                </div>
                <h3 className="font-display font-bold text-xl mt-2">
                  {selectedClient?.name}
                </h3>
                <p className="text-xs text-linnk-stone-300 mt-0.5 font-mono">
                  {selectedClient?.phone} · {selectedClient?.email}
                </p>
              </div>
              <button
                onClick={() => setPopupReferralId(null)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                aria-label="Fechar detalhes"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto">
              {/* Alerta / Trava de Consentimento antes do Atendimento */}
              {selectedReferral.documentStatus !== 'APROVADO' ? (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3">
                  <Lock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-900 leading-relaxed">
                    <strong className="block font-display text-sm">
                      Aguardando Conferência de Termo
                    </strong>
                    Esta indicação não pode avançar para atendimento comercial liberado
                    antes de o Termo de Consentimento ser assinado, recebido e conferido.
                    <div className="mt-2.5 flex flex-wrap gap-2">
                      {selectedReferral.status === 'EM_ANALISE_DUPLICIDADE' ? (
                        <button
                          onClick={() => {
                            setPopupReferralId(null);
                            setActiveNav('duplicates');
                          }}
                          className="px-3 py-1.5 rounded-xl bg-rose-600 text-white font-display font-bold text-xs cursor-pointer"
                        >
                          Resolver Duplicidade
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setPopupReferralId(null);
                            setActiveNav('documents');
                          }}
                          className="px-3 py-1.5 rounded-xl bg-linnk-flame text-white font-display font-bold text-xs cursor-pointer"
                        >
                          Ir para Termo de Consentimento →
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="text-xs text-emerald-900">
                      <strong className="block font-display text-sm">
                        Consentimento Conferido & Atendimento Liberado
                      </strong>
                      Termo assinado e validado em{' '}
                      {selectedDoc?.reviewedAt
                        ? formatDateTimeBR(selectedDoc.reviewedAt)
                        : 'conferência interna'}
                      .
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setPopupReferralId(null);
                      setActiveNav('attendances');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-display font-bold text-xs shrink-0 cursor-pointer"
                  >
                    Atendimentos
                  </button>
                </div>
              )}

              {/* Matriz de Status da Operação */}
              <div>
                <h4 className="text-xs font-mono uppercase tracking-wider text-linnk-stone-500 mb-3">
                  Status da Operação
                </h4>
                <div className="grid grid-cols-2 gap-2.5 bg-linnk-stone-50 p-3.5 rounded-2xl border border-linnk-stone-200">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-linnk-stone-500 block mb-1">
                      1. Status Indicação
                    </span>
                    <ReferralStatusBadge status={selectedReferral.status} />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase text-linnk-stone-500 block mb-1">
                      2. Status Documento
                    </span>
                    <DocumentStatusBadge status={selectedReferral.documentStatus} />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase text-linnk-stone-500 block mb-1">
                      3. Recebimento Incorporadora
                    </span>
                    <FinancialFlowBadge status={selectedReferral.receivementStatus} />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase text-linnk-stone-500 block mb-1">
                      4. Repasse Corretor (50%)
                    </span>
                    <FinancialFlowBadge status={selectedReferral.payoutStatus} />
                  </div>
                </div>
              </div>

              {/* Vínculo Corretor & Empreendimento */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl border border-linnk-stone-200">
                  <span className="text-[10px] font-mono uppercase text-linnk-stone-400">
                    Corretor Responsável
                  </span>
                  <div className="font-display font-bold text-sm text-linnk-obsidian mt-1">
                    {selectedBroker?.name}
                  </div>
                  <div className="text-linnk-stone-500 mt-0.5">
                    {selectedBroker?.creci} · {selectedBroker?.city}/{selectedBroker?.state}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl border border-linnk-stone-200">
                  <span className="text-[10px] font-mono uppercase text-linnk-stone-400">
                    Empreendimento & Modalidade
                  </span>
                  <div className="font-display font-bold text-sm text-linnk-obsidian mt-1">
                    {selectedDevelopment?.name}
                  </div>
                  <div className="mt-1.5">
                    <ModalityBadge modality={selectedReferral.modality} />
                  </div>
                </div>
              </div>

              {/* Linha do Tempo Resumida da Indicação */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <h4 className="text-xs font-mono uppercase tracking-wider text-linnk-stone-500">
                    Histórico de Atendimentos ({selectedAttendances.length})
                  </h4>
                  <button
                    onClick={() => {
                      setPopupReferralId(null);
                      setActiveNav('attendances');
                    }}
                    className="text-xs font-display font-bold text-linnk-flame hover:underline cursor-pointer"
                  >
                    Registrar interação →
                  </button>
                </div>

                {selectedAttendances.length === 0 ? (
                  <p className="text-xs text-linnk-stone-500 bg-linnk-stone-50 p-3.5 rounded-2xl border border-linnk-stone-200">
                    Nenhuma interação comercial registrada ainda para esta indicação.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {selectedAttendances.map((att) => (
                      <div
                        key={att.id}
                        className="p-3 rounded-2xl bg-linnk-stone-50 border border-linnk-stone-200 text-xs"
                      >
                        <div className="flex items-center justify-between gap-2 text-[10px] font-mono text-linnk-stone-500">
                          <AttendanceTypeBadge type={att.type} />
                          <span>{formatDateTimeBR(att.createdAt)}</span>
                        </div>
                        <div className="font-semibold text-linnk-obsidian mt-0.5">
                          {att.title}
                        </div>
                        <p className="text-linnk-stone-600 mt-0.5">{att.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Ações de Próxima Etapa */}
              <div className="pt-3 border-t border-linnk-stone-200 flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    setPopupReferralId(null);
                    setActiveNav('documents');
                  }}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-linnk-stone-100 hover:bg-linnk-stone-200 text-linnk-obsidian font-display font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <FileCheck2 className="w-4 h-4 text-linnk-flame" />
                  <span>Ver / Imprimir Termo</span>
                </button>
                <button
                  onClick={() => {
                    if (selectedSale) {
                      setPopupReferralId(null);
                      setActiveNav('sales');
                    } else {
                      openRegisterSaleModal(selectedReferral);
                    }
                  }}
                  className={`flex-1 py-2.5 px-3 rounded-xl font-display font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs ${
                    selectedSale
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-linnk-flame hover:bg-linnk-flame-600 text-white'
                  }`}
                >
                  <Receipt className="w-4 h-4" />
                  <span>
                    {selectedSale
                      ? 'Ver Venda & Comissão'
                      : 'Registrar Venda e Ir ao Financeiro →'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Nova Indicação com Detector de Duplicidade */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-linnk-stone-300 shadow-obsidian overflow-hidden max-h-[92vh] flex flex-col">
            <div className="bg-linnk-obsidian text-white px-6 py-5 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-widest text-linnk-flame">
                  Cadastro de Indicação
                </span>
                <h3 className="font-display font-bold text-xl">
                  Registrar Nova Indicação
                </h3>
              </div>
              <button
                onClick={() => setShowNewModal(false)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={handleCreateSubmit}
              className="p-6 overflow-y-auto space-y-4 text-sm"
            >
              {/* Alerta em Tempo Real se houver Duplicidade */}
              {liveDuplicateCheck && (
                <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-300 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-rose-900 leading-relaxed">
                    <strong className="font-display font-bold text-sm block">
                      Possível Duplicidade Detectada na Base
                    </strong>
                    {isBroker ? (
                      <>
                        Já existe um registro ativo vinculado a este contato na plataforma (protocolo{' '}
                        <span className="font-mono font-bold">
                          {liveDuplicateCheck.referral.code}
                        </span>{' '}
                        — dados pessoais de terceiros protegidos por sigilo). Ao salvar, a indicação será encaminhada para análise da curadoria.
                      </>
                    ) : (
                      <>
                        O contato normalizado coincide com a indicação ativa{' '}
                        <span className="font-mono font-bold">
                          {liveDuplicateCheck.referral.code}
                        </span>{' '}
                        ({liveDuplicateCheck.client.name}). Ao salvar, esta indicação será
                        encaminhada automaticamente para a fila de{' '}
                        <strong>Análise de Duplicidade</strong> para decisão formal auditada.
                      </>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-linnk-obsidian mb-1">
                    Nome Completo do Cliente Indicado *
                  </label>
                  <input
                    type="text"
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Ex.: Dr. Marcelo Sampaio"
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-linnk-stone-50 border border-linnk-stone-300 focus:border-linnk-flame focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-linnk-obsidian mb-1">
                    Telefone / WhatsApp *
                  </label>
                  <input
                    type="tel"
                    required
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="Ex.: (77) 99984-5521"
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-linnk-stone-50 border border-linnk-stone-300 focus:border-linnk-flame focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-linnk-obsidian mb-1">
                    E-mail do Cliente
                  </label>
                  <input
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="cliente@email.com.br"
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-linnk-stone-50 border border-linnk-stone-300 focus:border-linnk-flame focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-linnk-obsidian mb-1">
                    Cidade / Origem do Cliente
                  </label>
                  <input
                    type="text"
                    value={clientCity}
                    onChange={(e) => setClientCity(e.target.value)}
                    placeholder="Ex.: Vitória da Conquista · BA"
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-linnk-stone-50 border border-linnk-stone-300 focus:border-linnk-flame focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-linnk-obsidian mb-1">
                    Corretor Parceiro Responsável *
                  </label>
                  <select
                    required
                    disabled={isBroker || activeBrokers.length === 0}
                    value={isBroker ? currentUser?.brokerId || brokerId : brokerId}
                    onChange={(e) => setBrokerId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-linnk-stone-50 border border-linnk-stone-300 focus:border-linnk-flame focus:outline-none disabled:opacity-70"
                  >
                    {activeBrokers.length === 0 ? (
                      <option value="">Nenhum corretor ativo cadastrado</option>
                    ) : (
                      <>
                        <option value="">Selecione um corretor</option>
                        {activeBrokers.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name} ({b.city}) — {b.creci}
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-linnk-obsidian mb-1">
                    Empreendimento da Curadoria LINNK *
                  </label>
                  <select
                    required
                    disabled={activeDevelopments.length === 0}
                    value={developmentId}
                    onChange={(e) => setDevelopmentId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-linnk-stone-50 border border-linnk-stone-300 focus:border-linnk-flame focus:outline-none disabled:opacity-70"
                  >
                    {activeDevelopments.length === 0 ? (
                      <option value="">Nenhum empreendimento ativo cadastrado</option>
                    ) : (
                      <>
                        <option value="">Selecione um empreendimento</option>
                        {activeDevelopments.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name} ({d.city})
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                </div>
              </div>

              {/* Seleção de Modalidade */}
              <div className="pt-2">
                <label className="block text-xs font-semibold text-linnk-obsidian mb-2">
                  Modalidade de Atuação (Mesma divisão de 50% para o Corretor)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setModality('INDICA')}
                    className={`p-4 rounded-2xl border text-left transition-all ${
                      modality === 'INDICA'
                        ? 'bg-linnk-flame-50 border-linnk-flame ring-2 ring-linnk-flame/20'
                        : 'bg-linnk-stone-50 border-linnk-stone-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-display font-bold text-sm text-linnk-obsidian">
                        INDICA · Closer LINNK Atende
                      </span>
                      <span className="text-[11px] font-mono font-bold text-linnk-flame">
                        50% Comissão
                      </span>
                    </div>
                    <p className="text-xs text-linnk-stone-600 mt-1">
                      O corretor apenas indica o cliente. Especialista LINNK conduz todo o
                      atendimento e fechamento.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setModality('CONECTA')}
                    className={`p-4 rounded-2xl border text-left transition-all ${
                      modality === 'CONECTA'
                        ? 'bg-linnk-obsidian text-white border-linnk-obsidian ring-2 ring-linnk-obsidian/20'
                        : 'bg-linnk-stone-50 border-linnk-stone-200 text-linnk-obsidian'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-display font-bold text-sm">
                        CONECTA · Corretor Atende
                      </span>
                      <span className="text-[11px] font-mono font-bold text-linnk-flame-400">
                        50% Comissão
                      </span>
                    </div>
                    <p
                      className={`text-xs mt-1 ${
                        modality === 'CONECTA' ? 'text-linnk-stone-300' : 'text-linnk-stone-600'
                      }`}
                    >
                      O corretor conduz o atendimento com suporte, material, plantão e
                      credenciamento da LINNK.
                    </p>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-linnk-obsidian mb-1">
                  Observações de Triagem / Perfil do Cliente
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Contexto do cliente, preferência de planta, disponibilidade para reunião..."
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-linnk-stone-50 border border-linnk-stone-300 focus:border-linnk-flame focus:outline-none"
                />
              </div>

              {/* Opção para já registrar venda confirmada e enviar direto ao Financeiro */}
              <div className="p-4 rounded-2xl bg-linnk-stone-50 border border-linnk-stone-200 space-y-3">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isDirectSale}
                    onChange={(e) => {
                      setIsDirectSale(e.target.checked);
                      if (e.target.checked && !directSaleValue) {
                        const selDev = developments.find((d) => d.id === developmentId);
                        const defaultTicket = selDev?.averageTicketCents
                          ? Math.round(selDev.averageTicketCents / 100)
                          : 850000;
                        setDirectSaleValue(formatThousands(defaultTicket));
                      }
                    }}
                    className="w-4 h-4 rounded text-linnk-flame focus:ring-linnk-flame border-linnk-stone-300 cursor-pointer"
                  />
                  <div className="text-xs">
                    <strong className="text-linnk-obsidian block">
                      Venda já realizada? Registrar e enviar direto para o Financeiro
                    </strong>
                    <span className="text-linnk-stone-500">
                      Gera a venda confirmada e lança os repasses no Financeiro automaticamente.
                    </span>
                  </div>
                </label>

                {isDirectSale && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-linnk-stone-200">
                    <div>
                      <label className="block text-[11px] font-semibold text-linnk-obsidian mb-1">
                        Identificador da Unidade *
                      </label>
                      <input
                        type="text"
                        value={directSaleUnit}
                        onChange={(e) => setDirectSaleUnit(e.target.value)}
                        placeholder="Ex: Unidade 101 · Vista Mar"
                        className="w-full px-3 py-2 rounded-xl bg-white border border-linnk-stone-300 focus:border-linnk-flame focus:outline-none text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-linnk-obsidian mb-1">
                        Valor da Venda (VGV em R$) *
                      </label>
                      <input
                        type="text"
                        value={directSaleValue}
                        onChange={(e) => setDirectSaleValue(formatThousands(e.target.value))}
                        placeholder="Ex: 850.000"
                        className="w-full px-3 py-2 rounded-xl bg-white border border-linnk-stone-300 focus:border-linnk-flame focus:outline-none text-xs font-mono font-bold"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-linnk-stone-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2.5 rounded-2xl bg-linnk-stone-100 hover:bg-linnk-stone-200 text-linnk-obsidian font-display font-semibold text-xs sm:text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={activeBrokers.length === 0 || activeDevelopments.length === 0}
                  className="px-6 py-2.5 rounded-2xl bg-linnk-flame hover:bg-linnk-flame-600 disabled:opacity-50 text-white font-display font-bold text-xs sm:text-sm shadow-flame-sm cursor-pointer flex items-center gap-2"
                >
                  {isDirectSale ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Registrar Indicação e Enviar ao Financeiro →</span>
                    </>
                  ) : liveDuplicateCheck ? (
                    'Registrar e Enviar p/ Análise de Duplicidade'
                  ) : (
                    'Confirmar Indicação'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Dedicado: Registrar Venda da Indicação */}
      {saleModalRef && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full border border-linnk-stone-300 shadow-obsidian overflow-hidden max-h-[92vh] flex flex-col">
            <div className="bg-linnk-obsidian text-white px-6 py-5 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-widest text-linnk-flame">
                  Gestão Financeira & Comissões
                </span>
                <h3 className="font-display font-bold text-xl">
                  Registrar Venda da Indicação
                </h3>
              </div>
              <button
                onClick={() => setSaleModalRef(null)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                aria-label="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={handleConfirmSaleFromModal}
              className="p-6 overflow-y-auto space-y-4 text-sm"
            >
              {/* Informações da Indicação */}
              <div className="p-4 rounded-2xl bg-linnk-stone-50 border border-linnk-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <span className="text-[10px] font-mono uppercase text-linnk-stone-400 block">
                    Cliente & Indicação
                  </span>
                  <strong className="font-display text-sm text-linnk-obsidian block">
                    {clients.find((c) => c.id === saleModalRef.clientId)?.name}
                  </strong>
                  <span className="font-mono text-linnk-stone-500">
                    {saleModalRef.code} · {saleModalRef.modality}
                  </span>
                </div>
                <div className="sm:text-right">
                  <span className="text-[10px] font-mono uppercase text-linnk-stone-400 block">
                    Empreendimento & Corretor
                  </span>
                  <span className="font-semibold text-linnk-obsidian block">
                    {developments.find((d) => d.id === saleModalRef.developmentId)?.name}
                  </span>
                  <span className="text-linnk-stone-500">
                    {brokers.find((b) => b.id === saleModalRef.brokerId)?.name} (50%)
                  </span>
                </div>
              </div>

              {/* Campos da Venda */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-linnk-obsidian mb-1">
                    Identificador da Unidade *
                  </label>
                  <input
                    type="text"
                    required
                    value={saleUnit}
                    onChange={(e) => setSaleUnit(e.target.value)}
                    placeholder="Ex: Unidade 802 · Solarium"
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-linnk-stone-50 border border-linnk-stone-300 focus:border-linnk-flame focus:outline-none text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-linnk-obsidian mb-1">
                    Número do Contrato *
                  </label>
                  <input
                    type="text"
                    required
                    value={saleContract}
                    onChange={(e) => setSaleContract(e.target.value)}
                    placeholder="Ex: CTR-2026-001"
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-linnk-stone-50 border border-linnk-stone-300 focus:border-linnk-flame focus:outline-none text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-linnk-obsidian mb-1">
                    Valor da Venda (VGV em R$) *
                  </label>
                  <input
                    type="text"
                    required
                    value={saleValueInput}
                    onChange={(e) => setSaleValueInput(formatThousands(e.target.value))}
                    placeholder="Ex: 950.000"
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-linnk-stone-50 border border-linnk-stone-300 focus:border-linnk-flame focus:outline-none text-xs font-mono font-bold text-linnk-obsidian"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-linnk-obsidian mb-1">
                    Comissão Acordada (%) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="15"
                    required
                    value={saleCommissionRate}
                    onChange={(e) => setSaleCommissionRate(e.target.value)}
                    placeholder="4.0"
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-linnk-stone-50 border border-linnk-stone-300 focus:border-linnk-flame focus:outline-none text-xs font-mono"
                  />
                </div>
              </div>

              {/* Memória de Cálculo Prévia */}
              <div className="p-4 rounded-2xl bg-linnk-stone-100/70 border border-linnk-stone-200/90 space-y-2 text-xs">
                <div className="flex items-center justify-between pb-1.5 border-b border-linnk-stone-200">
                  <span className="font-display font-bold text-xs text-linnk-obsidian flex items-center gap-1.5">
                    <Calculator className="w-3.5 h-3.5 text-linnk-flame" />
                    Memória de Repasse Estimada (Regra 50/50 Líquida)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-linnk-stone-600">Comissão Bruta ({saleCommissionRate}%):</span>
                  <strong className="font-mono text-linnk-obsidian">
                    {formatCentsToBRL(modalGrossCents)}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-linnk-stone-600">Dedução NF LINNK ({modalTaxRate}%):</span>
                  <span className="font-mono text-rose-600">
                    - {formatCentsToBRL(modalTaxCents)}
                  </span>
                </div>
                <div className="flex justify-between pt-1 border-t border-linnk-stone-200 font-semibold">
                  <span className="text-linnk-stone-700">Base Líquida a Dividir:</span>
                  <span className="font-mono text-linnk-obsidian">
                    {formatCentsToBRL(modalNetBaseCents)}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1.5">
                  <div className="p-2.5 rounded-xl bg-linnk-flame-50 border border-linnk-flame-200">
                    <span className="text-[10px] font-mono uppercase text-linnk-flame-800 block">
                      Corretor Parceiro (50%)
                    </span>
                    <strong className="font-display text-sm text-linnk-flame">
                      {formatCentsToBRL(modalBrokerCents)}
                    </strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-linnk-stone-200">
                    <span className="text-[10px] font-mono uppercase text-linnk-stone-600 block">
                      LINNK (50%)
                    </span>
                    <strong className="font-display text-sm text-linnk-obsidian">
                      {formatCentsToBRL(modalLinnkCents)}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-linnk-stone-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSaleModalRef(null)}
                  className="px-4 py-2.5 rounded-2xl bg-linnk-stone-100 hover:bg-linnk-stone-200 text-linnk-obsidian font-display font-semibold text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-display font-bold text-xs sm:text-sm shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirmar Venda e Ir para o Financeiro →</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
