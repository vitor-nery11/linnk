import React, { useMemo, useState } from 'react';
import {
  ArrowUpRight,
  Building2,
  Calculator,
  FileCheck2,
  GitCompareArrows,
  MessageSquareMore,
  Receipt,
  TrendingUp,
  Wallet,
  X,
} from 'lucide-react';
import { useApp } from '../../app/AppContext';
import { Modality } from '../../app/types';
import {
  formatCentsToBRL,
  formatDateBR,
  formatDateTimeBR,
} from '../../lib/formatters';
import {
  DocumentStatusBadge,
  ModalityBadge,
  ReferralStatusBadge,
} from '../../components/StatusBadges';

export const BrokerDashboardView: React.FC = () => {
  const {
    currentUser,
    brokers,
    referrals,
    clients,
    developments,
    attendances,
    sales,
    transactions,
    commissionConfig,
    createReferral,
    setActiveNav,
    setSelectedReferralId,
  } = useApp();

  // Localiza o cadastro do corretor vinculado ao usuário autenticado
  const currentBroker = useMemo(() => {
    if (currentUser?.brokerId) {
      const found = brokers.find((b) => b.id === currentUser.brokerId);
      if (found) return found;
    }
    if (brokers.length > 0) return brokers[0];
    if (currentUser) {
      return {
        id: currentUser.brokerId || `brk-${currentUser.id}`,
        name: currentUser.name,
        email: currentUser.email,
        phone: '',
        phoneNormalized: '',
        creci: 'CRECI',
        city: '',
        state: 'BA',
        defaultModality: 'INDICA' as Modality,
        isFoundingMember: false,
        adhesionTermSigned: false,
        ndaTermSigned: false,
        pixKey: currentUser.email,
        active: true,
        createdAt: new Date().toISOString(),
      };
    }
    return null;
  }, [brokers, currentUser]);

  // Filtra exclusivamente os registros vinculados a este corretor
  const myReferrals = useMemo(
    () => referrals.filter((r) => r.brokerId === currentBroker?.id),
    [referrals, currentBroker?.id]
  );

  const mySales = useMemo(
    () =>
      sales.filter((s) =>
        myReferrals.some((ref) => ref.id === s.referralId)
      ),
    [sales, myReferrals]
  );

  const myPayoutTransactions = useMemo(
    () =>
      transactions.filter(
        (t) =>
          (t.type === 'REPASSE_CORRETOR' || t.type === 'ESTORNO_REPASSE') &&
          mySales.some((s) => s.id === t.saleId)
      ),
    [transactions, mySales]
  );

  // Indicadores exclusivos da carteira do corretor
  const activeProtectedReferrals = myReferrals.filter(
    (r) =>
      r.status !== 'CONFLITO_REJEITADO' &&
      r.status !== 'ENCERRADA_SEM_VENDA'
  );
  const inAttendanceReferrals = myReferrals.filter(
    (r) =>
      r.status === 'LIBERADA_ATENDIMENTO' ||
      r.status === 'EM_ATENDIMENTO' ||
      r.status === 'PROPOSTA_ENVIADA'
  );
  const pendingConsentReferrals = myReferrals.filter(
    (r) => r.documentStatus !== 'APROVADO' && r.status !== 'CONFLITO_REJEITADO'
  );

  const totalVgvCents = mySales.reduce((acc, s) => acc + s.saleValueCents, 0);
  const totalMyCommissionCents = mySales.reduce(
    (acc, s) => acc + s.commission.brokerCommissionCents,
    0
  );

  const confirmedPayoutCents = myPayoutTransactions
    .filter((t) => t.type === 'REPASSE_CORRETOR' && t.status === 'CONFIRMADO')
    .reduce((acc, t) => acc + t.amountCents, 0);
  const reversedPayoutCents = myPayoutTransactions
    .filter((t) => t.type === 'ESTORNO_REPASSE')
    .reduce((acc, t) => acc + Math.abs(t.amountCents), 0);
  const netReceivedPayoutCents = Math.max(0, confirmedPayoutCents - reversedPayoutCents);
  const pendingPayoutCents = Math.max(
    0,
    totalMyCommissionCents - netReceivedPayoutCents
  );

  // Estado do modal rápido de Nova Indicação pelo Corretor
  const [showNewRefModal, setShowNewRefModal] = useState(false);
  const activeDevelopments = developments.filter((d) => d.active);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientCity, setClientCity] = useState(
    currentBroker?.city ? `${currentBroker.city}${currentBroker.state ? ` · ${currentBroker.state}` : ''}` : ''
  );
  const [developmentId, setDevelopmentId] = useState(activeDevelopments[0]?.id || '');
  const [refModality, setRefModality] = useState<Modality>(
    currentBroker?.defaultModality || 'INDICA'
  );
  const [refNotes, setRefNotes] = useState('');

  // Simulador de Comissão 50% do Corretor
  const [simValueReais, setSimValueReais] = useState(500000);
  const [simRate, setSimRate] = useState(4.0);
  const simGrossCents = Math.round(simValueReais * 100 * (simRate / 100));
  const simTaxCents =
    commissionConfig.splitBase === 'LIQUIDA'
      ? Math.round((simGrossCents * commissionConfig.defaultTaxDeductionPercent) / 100)
      : 0;
  const simBrokerShareCents = Math.round((simGrossCents - simTaxCents) / 2);

  const handleCreateBrokerReferral = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBroker || !clientName.trim() || !clientPhone.trim() || !developmentId) return;

    const { referral } = createReferral({
      clientName: clientName.trim(),
      clientPhone: clientPhone.trim(),
      clientEmail: clientEmail.trim(),
      clientCity: clientCity.trim(),
      brokerId: currentBroker.id,
      developmentId,
      modality: refModality,
      notes: refNotes.trim(),
    });

    setShowNewRefModal(false);
    setClientName('');
    setClientPhone('');
    setClientEmail('');
    setRefNotes('');
    setSelectedReferralId(referral.id);
  };

  if (!currentBroker) return null;

  return (
    <div className="space-y-7">
      {/* 1. KPIs da Carteira do Corretor */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Minhas Indicações Vinculadas */}
        <button
          onClick={() => setActiveNav('referrals')}
          className="text-left bg-white rounded-2xl p-5 border border-linnk-stone-300/80 shadow-arch-card hover:border-linnk-flame transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-linnk-stone-500">
              Minhas Indicações
            </span>
            <div className="w-9 h-9 rounded-xl bg-linnk-stone-100 text-linnk-obsidian flex items-center justify-center group-hover:bg-linnk-flame group-hover:text-white transition-colors">
              <GitCompareArrows className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="font-display font-bold text-3xl text-linnk-obsidian">
              {myReferrals.length}
            </span>
            <span className="text-xs font-semibold text-linnk-flame flex items-center gap-1">
              Ver carteira <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </div>
          <p className="text-xs text-linnk-stone-500 mt-2">
            {activeProtectedReferrals.length} indicações com proteção de 6 meses ativa
          </p>
        </button>

        {/* Card 2: Em Atendimento & Termos */}
        <button
          onClick={() => setActiveNav('referrals')}
          className="text-left bg-white rounded-2xl p-5 border border-linnk-stone-300/80 shadow-arch-card hover:border-linnk-flame transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-linnk-stone-500">
              Atendimentos & Termos
            </span>
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center group-hover:bg-sky-600 group-hover:text-white transition-colors">
              <MessageSquareMore className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="font-display font-bold text-3xl text-linnk-obsidian">
              {inAttendanceReferrals.length}
            </span>
            <span className="text-xs font-semibold text-sky-600 flex items-center gap-1">
              Acompanhar <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </div>
          <p className="text-xs text-linnk-stone-500 mt-2">
            {pendingConsentReferrals.length} aguardando assinatura/conferência de termo
          </p>
        </button>

        {/* Card 3: Minhas Vendas Confirmadas */}
        <button
          onClick={() => setActiveNav('sales')}
          className="text-left bg-white rounded-2xl p-5 border border-linnk-stone-300/80 shadow-arch-card hover:border-linnk-flame transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-linnk-stone-500">
              Minhas Vendas ({mySales.length})
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="font-display font-bold text-2xl text-linnk-obsidian">
              {formatCentsToBRL(totalVgvCents, true)}
            </span>
            <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
              Detalhes <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </div>
          <p className="text-xs text-linnk-stone-500 mt-2">
            VGV acumulado nas suas indicações
          </p>
        </button>

        {/* Card 4: Minha Comissão (50%) & Repasses */}
        <button
          onClick={() => setActiveNav('sales')}
          className="text-left bg-white rounded-2xl p-5 border border-linnk-stone-300/80 shadow-arch-card hover:border-linnk-flame transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-linnk-stone-500">
              Minha Comissão (50%)
            </span>
            <div className="w-9 h-9 rounded-xl bg-linnk-flame-50 text-linnk-flame flex items-center justify-center group-hover:bg-linnk-flame group-hover:text-white transition-colors">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="font-display font-bold text-2xl text-linnk-flame">
              {formatCentsToBRL(totalMyCommissionCents)}
            </span>
            <span className="text-xs font-semibold text-linnk-flame flex items-center gap-1">
              Ver repasses <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </div>
          <p className="text-xs text-linnk-stone-500 mt-2">
            Recebido: {formatCentsToBRL(netReceivedPayoutCents)} · Saldo: {formatCentsToBRL(pendingPayoutCents)}
          </p>
        </button>
      </div>

      {/* 3. Modalidades de Atuação do Corretor: INDICA vs CONECTA */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div
          className={`bg-white rounded-2xl p-6 border shadow-arch-card flex flex-col justify-between ${
            currentBroker.defaultModality === 'INDICA'
              ? 'border-linnk-flame'
              : 'border-linnk-stone-300/80'
          }`}
        >
          <div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <ModalityBadge modality="INDICA" />
                {currentBroker.defaultModality === 'INDICA' && (
                  <span className="text-[11px] font-mono text-linnk-flame font-semibold">
                    · Sua Modalidade Padrão
                  </span>
                )}
              </div>
              <span className="font-mono text-xs font-bold text-linnk-obsidian">
                50% da Comissão
              </span>
            </div>
            <h3 className="font-display font-bold text-base text-linnk-obsidian mt-3">
              Modalidade INDICA — Equipe Closer LINNK conduz o atendimento
            </h3>
            <p className="text-xs text-linnk-stone-600 mt-1.5 leading-relaxed">
              Você cadastra a indicação do seu cliente e a equipe de especialistas da LINNK
              assume toda a apresentação consultiva, visita em Ilhéus/Itabuna e fechamento,
              atualizando cada etapa na sua linha do tempo.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-linnk-stone-200 flex items-center justify-between text-xs text-linnk-stone-500">
            <span>
              Suas indicações em INDICA:{' '}
              <strong className="text-linnk-obsidian">
                {myReferrals.filter((r) => r.modality === 'INDICA').length}
              </strong>
            </span>
            <button
              onClick={() => {
                setRefModality('INDICA');
                setShowNewRefModal(true);
              }}
              className="font-display font-semibold text-linnk-flame hover:underline"
            >
              Indicar via INDICA →
            </button>
          </div>
        </div>

        <div
          className={`bg-white rounded-2xl p-6 border shadow-arch-card flex flex-col justify-between ${
            currentBroker.defaultModality === 'CONECTA'
              ? 'border-linnk-obsidian'
              : 'border-linnk-stone-300/80'
          }`}
        >
          <div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <ModalityBadge modality="CONECTA" />
                {currentBroker.defaultModality === 'CONECTA' && (
                  <span className="text-[11px] font-mono text-linnk-obsidian font-semibold">
                    · Sua Modalidade Padrão
                  </span>
                )}
              </div>
              <span className="font-mono text-xs font-bold text-linnk-obsidian">
                50% da Comissão
              </span>
            </div>
            <h3 className="font-display font-bold text-base text-linnk-obsidian mt-3">
              Modalidade CONECTA — Você conduz o cliente com apoio da LINNK
            </h3>
            <p className="text-xs text-linnk-stone-600 mt-1.5 leading-relaxed">
              Você realiza o atendimento direto ao seu cliente utilizando o credenciamento
              junto às incorporadoras, materiais técnicos, tabelas atualizadas e salas de
              plantão da LINNK.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-linnk-stone-200 flex items-center justify-between text-xs text-linnk-stone-500">
            <span>
              Suas indicações em CONECTA:{' '}
              <strong className="text-linnk-obsidian">
                {myReferrals.filter((r) => r.modality === 'CONECTA').length}
              </strong>
            </span>
            <button
              onClick={() => {
                setRefModality('CONECTA');
                setShowNewRefModal(true);
              }}
              className="font-display font-semibold text-linnk-obsidian hover:underline"
            >
              Indicar via CONECTA →
            </button>
          </div>
        </div>
      </div>

      {/* 4. Seção Central: Minhas Indicações Vinculadas + Repasses & Simulador */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Tabela Exclusiva das Indicações do Corretor (8 colunas) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-linnk-stone-300/80 shadow-arch-card overflow-hidden">
          <div className="p-6 border-b border-linnk-stone-200 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-display font-bold text-lg text-linnk-obsidian">
                Minhas Indicações Vinculadas ({myReferrals.length})
              </h3>
              <p className="text-xs text-linnk-stone-500 mt-0.5">
                Acompanhe o status do termo de consentimento, atendimento comercial e prazo de proteção
              </p>
            </div>
            <button
              onClick={() => setActiveNav('referrals')}
              className="text-xs font-display font-bold text-linnk-flame hover:underline flex items-center gap-1"
            >
              Abrir visão completa <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-linnk-stone-50 border-b border-linnk-stone-200 text-[11px] font-mono uppercase tracking-wider text-linnk-stone-500">
                  <th className="py-3.5 px-5">Indicação & Cliente</th>
                  <th className="py-3.5 px-4">Empreendimento & Modalidade</th>
                  <th className="py-3.5 px-4">Status & Termo</th>
                  <th className="py-3.5 px-4">Última Atualização</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-linnk-stone-200 text-sm">
                {myReferrals.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 px-5 text-center text-linnk-stone-500 text-xs">
                      Nenhuma indicação vinculada no momento. Cadastre sua primeira indicação para acompanhar o processo comercial.
                    </td>
                  </tr>
                ) : (
                  myReferrals.map((ref) => {
                  const cli = clients.find((c) => c.id === ref.clientId);
                  const dev = developments.find((d) => d.id === ref.developmentId);
                  const refAtts = attendances.filter((a) => a.referralId === ref.id);
                  const lastAtt = refAtts[0];

                  return (
                    <tr
                      key={ref.id}
                      onClick={() => {
                        setSelectedReferralId(ref.id);
                        setActiveNav('referrals');
                      }}
                      className="hover:bg-linnk-stone-50/90 cursor-pointer transition-colors"
                    >
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-linnk-flame">
                            {ref.code}
                          </span>
                          <span className="text-[11px] text-linnk-stone-400 font-mono">
                            Proteção até {formatDateBR(ref.protectionExpiresAt)}
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
                          <Building2 className="w-3.5 h-3.5 text-linnk-flame shrink-0" />
                          <span>{dev?.name}</span>
                        </div>
                        <div className="mt-1.5">
                          <ModalityBadge modality={ref.modality} />
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex flex-col items-start gap-1.5">
                          <ReferralStatusBadge status={ref.status} />
                          <DocumentStatusBadge status={ref.documentStatus} />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedReferralId(ref.id);
                              setActiveNav('documents');
                            }}
                            className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-display font-semibold text-linnk-flame hover:underline"
                          >
                            <FileCheck2 className="w-3 h-3" />
                            <span>Ver / Imprimir Termo →</span>
                          </button>
                        </div>
                      </td>

                      <td className="py-4 px-4 text-xs text-linnk-stone-600 max-w-[240px]">
                        {lastAtt ? (
                          <div>
                            <span className="font-semibold text-linnk-obsidian block truncate">
                              {lastAtt.title}
                            </span>
                            <span className="text-[11px] font-mono text-linnk-stone-400">
                              {formatDateTimeBR(lastAtt.createdAt)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-linnk-stone-400">
                            {ref.documentStatus === 'APROVADO'
                              ? 'Aguardando início do atendimento'
                              : 'Aguardando liberação do termo'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            </table>
          </div>
        </div>

        {/* Coluna Direita (4 colunas): Demonstrativo de Repasses + Simulador 50% */}
        <div className="lg:col-span-4 space-y-6">
          {/* Card Demonstrativo de Repasses das Minhas Vendas */}
          <div className="bg-white rounded-2xl p-6 border border-linnk-stone-300/80 shadow-arch-card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-linnk-flame" />
                <h3 className="font-display font-bold text-base text-linnk-obsidian">
                  Meus Repasses & Comissões
                </h3>
              </div>
              <button
                onClick={() => setActiveNav('sales')}
                className="text-xs font-display font-semibold text-linnk-flame hover:underline"
              >
                Ver detalhes
              </button>
            </div>

            {myPayoutTransactions.length === 0 ? (
              <p className="text-xs text-linnk-stone-500 bg-linnk-stone-50 p-4 rounded-xl border border-linnk-stone-200">
                Nenhum repasse registrado ainda. Assim que suas vendas forem confirmadas,
                as parcelas aparecerão aqui.
              </p>
            ) : (
              <div className="space-y-3">
                {myPayoutTransactions.map((tx) => {
                  const sale = mySales.find((s) => s.id === tx.saleId);
                  return (
                    <div
                      key={tx.id}
                      className="p-3.5 rounded-xl bg-linnk-stone-50 border border-linnk-stone-200 text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono font-bold text-linnk-obsidian">
                          {sale?.code}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                            tx.status === 'CONFIRMADO'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {tx.status === 'CONFIRMADO' ? 'REPASSADO' : 'PENDENTE'}
                        </span>
                      </div>
                      <div className="font-medium text-linnk-obsidian">
                        {tx.installmentLabel}
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-linnk-stone-200/80 font-mono">
                        <span className="text-linnk-stone-500">Venc.: {tx.dueDate}</span>
                        <strong className="text-sm text-linnk-flame">
                          {formatCentsToBRL(tx.amountCents)}
                        </strong>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Simulador Rápido de Comissão do Corretor (50%) */}
          <div className="bg-[#161316] text-white rounded-2xl p-6 shadow-obsidian border border-neutral-800">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-linnk-flame">
              <Calculator className="w-4 h-4" />
              <span>Simulador do Corretor · 50%</span>
            </div>
            <h3 className="font-display font-bold text-base mt-1">
              Calcule seu Repasse por Indicação
            </h3>

            <div className="mt-4 space-y-3 text-xs">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-neutral-400">Valor do Imóvel (VGV)</span>
                  <span className="font-mono font-bold text-white">
                    {formatCentsToBRL(simValueReais * 100)}
                  </span>
                </div>
                <input
                  type="range"
                  min={450000}
                  max={2500000}
                  step={50000}
                  value={simValueReais}
                  onChange={(e) => setSimValueReais(Number(e.target.value))}
                  className="w-full accent-linnk-flame cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-neutral-400">Comissão do Lançamento</span>
                <div className="flex gap-1.5">
                  {[3.5, 4.0, 5.0].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setSimRate(r)}
                      className={`px-2.5 py-1 rounded-md font-mono text-xs transition-all ${
                        simRate === r
                          ? 'bg-linnk-flame text-white font-bold'
                          : 'bg-white/10 text-neutral-300 hover:bg-white/20'
                      }`}
                    >
                      {r.toFixed(1)}%
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-white/10 flex items-baseline justify-between">
                <span className="text-neutral-300 font-medium">Sua Comissão (50%):</span>
                <span className="font-display font-bold text-xl text-linnk-flame">
                  {formatCentsToBRL(simBrokerShareCents)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Nova Indicação pelo Painel do Corretor */}
      {showNewRefModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-linnk-stone-300 shadow-obsidian overflow-hidden">
            <div className="bg-[#161316] text-white px-6 py-4 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-linnk-flame">
                  Corretor Responsável: {currentBroker.name}
                </span>
                <h3 className="font-display font-bold text-base">
                  Cadastrar Nova Indicação de Cliente
                </h3>
              </div>
              <button
                onClick={() => setShowNewRefModal(false)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateBrokerReferral} className="p-6 space-y-4 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-linnk-obsidian mb-1">
                    Nome do Cliente Indicado *
                  </label>
                  <input
                    type="text"
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Ex.: Dr. Roberto Siqueira"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-linnk-stone-50 border border-linnk-stone-300 text-xs focus:border-linnk-flame focus:outline-none"
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
                    placeholder="(77) 99911-2233"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-linnk-stone-50 border border-linnk-stone-300 font-mono text-xs focus:border-linnk-flame focus:outline-none"
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
                    className="w-full px-3.5 py-2.5 rounded-xl bg-linnk-stone-50 border border-linnk-stone-300 text-xs focus:border-linnk-flame focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-linnk-obsidian mb-1">
                    Cidade do Cliente
                  </label>
                  <input
                    type="text"
                    value={clientCity}
                    onChange={(e) => setClientCity(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-linnk-stone-50 border border-linnk-stone-300 text-xs focus:border-linnk-flame focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-linnk-obsidian mb-1">
                  Empreendimento de Interesse *
                </label>
                <select
                  required
                  value={developmentId}
                  onChange={(e) => setDevelopmentId(e.target.value)}
                  disabled={activeDevelopments.length === 0}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-linnk-stone-50 border border-linnk-stone-300 text-xs focus:border-linnk-flame focus:outline-none disabled:opacity-60"
                >
                  {activeDevelopments.length === 0 ? (
                    <option value="">Nenhum empreendimento ativo cadastrado</option>
                  ) : (
                    <>
                      <option value="">Selecione um empreendimento</option>
                      {activeDevelopments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.city}) — Comissão {d.defaultCommissionRate}%
                        </option>
                      ))}
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-linnk-obsidian mb-1.5">
                  Modalidade de Atuação nesta Indicação
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRefModality('INDICA')}
                    className={`p-3 rounded-xl border text-left text-xs ${
                      refModality === 'INDICA'
                        ? 'bg-linnk-flame-50 border-linnk-flame font-semibold text-linnk-obsidian'
                        : 'bg-linnk-stone-50 border-linnk-stone-200 text-linnk-stone-600'
                    }`}
                  >
                    <div className="font-display font-bold">INDICA (50%)</div>
                    <div className="text-[11px] mt-0.5">Closer LINNK atende o cliente</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRefModality('CONECTA')}
                    className={`p-3 rounded-xl border text-left text-xs ${
                      refModality === 'CONECTA'
                        ? 'bg-[#161316] text-white border-[#161316] font-semibold'
                        : 'bg-linnk-stone-50 border-linnk-stone-200 text-linnk-stone-600'
                    }`}
                  >
                    <div className="font-display font-bold">CONECTA (50%)</div>
                    <div className="text-[11px] mt-0.5 opacity-85">Eu conduzo com apoio LINNK</div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-linnk-obsidian mb-1">
                  Observações / Perfil do Cliente
                </label>
                <textarea
                  rows={2}
                  value={refNotes}
                  onChange={(e) => setRefNotes(e.target.value)}
                  placeholder="Preferência de planta, disponibilidade de horário, contexto..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-linnk-stone-50 border border-linnk-stone-300 text-xs focus:border-linnk-flame focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-linnk-stone-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewRefModal(false)}
                  className="px-4 py-2 rounded-xl bg-linnk-stone-100 text-xs font-display font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={activeDevelopments.length === 0}
                  className="px-5 py-2 rounded-xl bg-linnk-flame hover:bg-linnk-flame-600 disabled:opacity-50 text-white text-xs font-display font-semibold cursor-pointer"
                >
                  Confirmar Indicação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
