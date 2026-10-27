import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  Building2,
  Calculator,
  CheckCircle2,
  Clock,
  FileCheck2,
  GitCompareArrows,
  MessageSquareMore,
  Receipt,
  ShieldAlert,
  TrendingUp,
  UserCheck,
  Wallet,
} from 'lucide-react';
import { useApp } from '../../app/AppContext';
import { formatCentsToBRL, formatDateTimeBR } from '../../lib/formatters';
import {
  DocumentStatusBadge,
  ModalityBadge,
  ReferralStatusBadge,
} from '../../components/StatusBadges';

export const DashboardView: React.FC = () => {
  const {
    referrals,
    documents,
    sales,
    transactions,
    brokers,
    developments,
    clients,
    auditLogs,
    commissionConfig,
    setActiveNav,
    setSelectedReferralId,
  } = useApp();

  // Simulador rápido 50/50 inspirado na apresentação LINNK
  const [simPropertyReais, setSimPropertyReais] = useState(850000);
  const [simRate, setSimRate] = useState(4.0);

  // Indicadores reais do sistema (Seção 3.3)
  const pendingDuplicates = referrals.filter(
    (r) => r.status === 'EM_ANALISE_DUPLICIDADE'
  );
  const pendingTermsReview = documents.filter(
    (d) =>
      d.status === 'RECEBIDO_AGUARDANDO_CONFERENCIA' ||
      d.status === 'GERADO_AGUARDANDO_ASSINATURA' ||
      d.status === 'PENDENTE_GERACAO'
  );
  const activeAttendances = referrals.filter(
    (r) =>
      r.status === 'LIBERADA_ATENDIMENTO' ||
      r.status === 'EM_ATENDIMENTO' ||
      r.status === 'PROPOSTA_ENVIADA'
  );
  const confirmedSales = sales.filter((s) => s.status === 'CONFIRMADA');

  const totalVgvCents = confirmedSales.reduce((acc, s) => acc + s.saleValueCents, 0);
  const totalGrossCommissionCents = confirmedSales.reduce(
    (acc, s) => acc + s.commission.grossCommissionCents,
    0
  );
  const totalBrokerShareCents = confirmedSales.reduce(
    (acc, s) => acc + s.commission.brokerCommissionCents,
    0
  );
  const totalLinnkShareCents = confirmedSales.reduce(
    (acc, s) => acc + s.commission.linnkCommissionCents,
    0
  );

  const pendingReceivementsCents = transactions
    .filter((t) => t.type === 'RECEBIMENTO_INCORPORADORA' && t.status === 'PENDENTE')
    .reduce((acc, t) => acc + t.amountCents, 0);

  const pendingPayoutsCents = transactions
    .filter((t) => t.type === 'REPASSE_CORRETOR' && t.status === 'PENDENTE')
    .reduce((acc, t) => acc + t.amountCents, 0);

  // Cálculo do simulador
  const simGrossCents = Math.round(simPropertyReais * 100 * (simRate / 100));
  const simTaxCents =
    commissionConfig.splitBase === 'LIQUIDA'
      ? Math.round((simGrossCents * commissionConfig.defaultTaxDeductionPercent) / 100)
      : 0;
  const simNetBaseCents = simGrossCents - simTaxCents;
  const simBroker50Cents = Math.round(simNetBaseCents / 2);

  return (
    <div className="space-y-8">
      {/* Cabeçalho Corporativo Limpo */}
      <div className="bg-white rounded-2xl p-6 sm:p-7 border border-linnk-stone-300/80 shadow-arch-card">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-linnk-flame mb-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-linnk-flame" />
              <span>Visão Geral da Operação</span>
            </div>
            <h2 className="font-display font-bold text-2xl text-linnk-obsidian tracking-tight">
              Acompanhamento de Indicações, Termos e Comissões
            </h2>
            <p className="text-sm text-linnk-stone-600 mt-1.5 leading-relaxed">
              Monitore conflitos de duplicidade, conferência manual de termos de
              consentimento, atendimentos nas modalidades <strong>INDICA</strong> e{' '}
              <strong>CONECTA</strong> e movimentações financeiras.
            </p>
          </div>

          {/* Atalhos Operacionais Rápidos */}
          <div className="flex flex-wrap gap-2.5 shrink-0">
            <button
              onClick={() => setActiveNav('referrals')}
              className="px-4 py-2.5 rounded-xl bg-[#161316] hover:bg-neutral-800 text-white font-display font-semibold text-xs sm:text-sm transition-all flex items-center gap-2"
            >
              <GitCompareArrows className="w-4 h-4 text-linnk-flame" />
              <span>Gerenciar Indicações</span>
            </button>
            <button
              onClick={() => setActiveNav('documents')}
              className="px-4 py-2.5 rounded-xl bg-linnk-stone-100 hover:bg-linnk-stone-200 border border-linnk-stone-300 text-linnk-obsidian font-display font-semibold text-xs sm:text-sm transition-all flex items-center gap-2"
            >
              <FileCheck2 className="w-4 h-4 text-linnk-flame" />
              <span>Conferir Termos ({pendingTermsReview.length})</span>
            </button>
            {pendingDuplicates.length > 0 && (
              <button
                onClick={() => setActiveNav('duplicates')}
                className="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-display font-semibold text-xs sm:text-sm transition-all flex items-center gap-2"
              >
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Duplicidades ({pendingDuplicates.length})</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Grid de Indicadores Operacionais e Financeiros */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Duplicidades Pendentes */}
        <button
          onClick={() => setActiveNav('duplicates')}
          className="text-left bg-white rounded-3xl p-5 border border-linnk-stone-300/80 shadow-arch-card hover:border-linnk-flame transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-linnk-stone-500">
              Duplicidades
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:bg-rose-600 group-hover:text-white transition-colors">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="font-display font-bold text-3xl text-linnk-obsidian">
              {pendingDuplicates.length}
            </span>
            <span className="text-xs font-semibold text-rose-600 flex items-center gap-1">
              Analisar fila <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </div>
          <p className="text-xs text-linnk-stone-500 mt-2">
            Conflitos por telefone/e-mail aguardando decisão
          </p>
        </button>

        {/* Card 2: Termos Aguardando Conferência */}
        <button
          onClick={() => setActiveNav('documents')}
          className="text-left bg-white rounded-3xl p-5 border border-linnk-stone-300/80 shadow-arch-card hover:border-linnk-flame transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-linnk-stone-500">
              Termos & Consentimento
            </span>
            <div className="w-9 h-9 rounded-xl bg-linnk-flame-50 text-linnk-flame flex items-center justify-center group-hover:bg-linnk-flame group-hover:text-white transition-colors">
              <FileCheck2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="font-display font-bold text-3xl text-linnk-obsidian">
              {pendingTermsReview.length}
            </span>
            <span className="text-xs font-semibold text-linnk-flame flex items-center gap-1">
              Conferir assinatura <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </div>
          <p className="text-xs text-linnk-stone-500 mt-2">
            Aguardando validação para liberar o atendimento comercial
          </p>
        </button>

        {/* Card 3: Atendimentos em Andamento */}
        <button
          onClick={() => setActiveNav('attendances')}
          className="text-left bg-white rounded-3xl p-5 border border-linnk-stone-300/80 shadow-arch-card hover:border-linnk-flame transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-linnk-stone-500">
              Atendimentos Ativos
            </span>
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center group-hover:bg-sky-600 group-hover:text-white transition-colors">
              <MessageSquareMore className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="font-display font-bold text-3xl text-linnk-obsidian">
              {activeAttendances.length}
            </span>
            <span className="text-xs font-semibold text-sky-600 flex items-center gap-1">
              Linha do tempo <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </div>
          <p className="text-xs text-linnk-stone-500 mt-2">
            {referrals.filter((r) => r.modality === 'INDICA').length} INDICA ·{' '}
            {referrals.filter((r) => r.modality === 'CONECTA').length} CONECTA no total
          </p>
        </button>

        {/* Card 4: Vendas Confirmadas & VGV */}
        <button
          onClick={() => setActiveNav('sales')}
          className="text-left bg-white rounded-3xl p-5 border border-linnk-stone-300/80 shadow-arch-card hover:border-linnk-flame transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-linnk-stone-500">
              Vendas Confirmadas ({confirmedSales.length})
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
              Ver comissões <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </div>
          <p className="text-xs text-linnk-stone-500 mt-2">
            Comissão bruta gerada: {formatCentsToBRL(totalGrossCommissionCents)}
          </p>
        </button>
      </div>

      {/* Segunda Linha: Resumo Financeiro */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-3xl p-5 border border-linnk-stone-300/80 shadow-arch-card flex items-center justify-between">
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-linnk-stone-500">
              Comissão Prevista Corretores (50%)
            </span>
            <div className="font-display font-bold text-2xl text-linnk-obsidian mt-1">
              {formatCentsToBRL(totalBrokerShareCents)}
            </div>
            <span className="text-xs text-linnk-stone-500 mt-1 block">
              Parte LINNK (50%): {formatCentsToBRL(totalLinnkShareCents)}
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-linnk-stone-100 flex items-center justify-center text-linnk-obsidian">
            <Wallet className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-linnk-stone-300/80 shadow-arch-card flex items-center justify-between">
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-linnk-stone-500">
              Recebimentos Incorporadora Pendentes
            </span>
            <div className="font-display font-bold text-2xl text-amber-600 mt-1">
              {formatCentsToBRL(pendingReceivementsCents)}
            </div>
            <span className="text-xs text-linnk-stone-500 mt-1 block">
              A receber das construtoras parceiras
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
            <Building2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-linnk-stone-300/80 shadow-arch-card flex items-center justify-between">
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-linnk-stone-500">
              Repasses Pendentes aos Corretores
            </span>
            <div className="font-display font-bold text-2xl text-linnk-flame mt-1">
              {formatCentsToBRL(pendingPayoutsCents)}
            </div>
            <span className="text-xs text-linnk-stone-500 mt-1 block">
              Vinculados às parcelas de recebimento
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-linnk-flame-50 flex items-center justify-center text-linnk-flame">
            <Receipt className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Seção Central: Funil de Indicações Recentes + Simulador 50/50 & Auditoria */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Tabela de Indicações Recentes (8 colunas) */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-linnk-stone-300/80 shadow-arch-card overflow-hidden">
          <div className="p-6 border-b border-linnk-stone-200 flex items-center justify-between">
            <div>
              <h3 className="font-display font-bold text-lg text-linnk-obsidian">
                Pipeline Operacional de Indicações
              </h3>
              <p className="text-xs text-linnk-stone-500 mt-0.5">
                Clique em qualquer indicação para abrir os detalhes 360º, termo ou atendimento
              </p>
            </div>
            <button
              onClick={() => setActiveNav('referrals')}
              className="text-xs font-display font-bold text-linnk-flame hover:underline flex items-center gap-1"
            >
              Ver todas ({referrals.length}) <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-linnk-stone-50 border-b border-linnk-stone-200 text-[11px] font-mono uppercase tracking-wider text-linnk-stone-500">
                  <th className="py-3.5 px-5">Código & Cliente</th>
                  <th className="py-3.5 px-4">Corretor & Empreendimento</th>
                  <th className="py-3.5 px-4">Modalidade</th>
                  <th className="py-3.5 px-4">Status Indicação</th>
                  <th className="py-3.5 px-4">Termo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-linnk-stone-200 text-sm">
                {referrals.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 px-5 text-center text-linnk-stone-500 text-xs">
                      Nenhuma indicação cadastrada no momento.
                    </td>
                  </tr>
                ) : (
                  referrals.slice(0, 6).map((ref) => {
                    const cli = clients.find((c) => c.id === ref.clientId);
                    const brk = brokers.find((b) => b.id === ref.brokerId);
                    const dev = developments.find((d) => d.id === ref.developmentId);

                    return (
                      <tr
                        key={ref.id}
                        onClick={() => {
                          setSelectedReferralId(ref.id);
                          setActiveNav('referrals');
                        }}
                        className="hover:bg-linnk-stone-50/90 cursor-pointer transition-colors"
                      >
                        <td className="py-3.5 px-5">
                          <div className="font-mono text-xs font-semibold text-linnk-flame">
                            {ref.code}
                          </div>
                          <div className="font-semibold text-linnk-obsidian">
                            {cli?.name || 'Cliente'}
                          </div>
                          <div className="text-xs text-linnk-stone-500">{cli?.phone}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-linnk-obsidian">{brk?.name}</div>
                          <div className="text-xs text-linnk-stone-500 truncate max-w-[210px]">
                            {dev?.name}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <ModalityBadge modality={ref.modality} />
                        </td>
                        <td className="py-3.5 px-4">
                          <ReferralStatusBadge status={ref.status} />
                        </td>
                        <td className="py-3.5 px-4">
                          <DocumentStatusBadge status={ref.documentStatus} />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Coluna Lateral: Calculadora 50% Líquido + Últimos Eventos Auditados (4 colunas) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Simulador de Comissão 50/50 */}
          <div className="bg-linnk-obsidian text-white rounded-3xl p-6 border border-linnk-obsidian-700 shadow-obsidian">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calculator className="w-4 h-4 text-linnk-flame" />
                <h3 className="font-display font-bold text-base">
                  Simulador 50/50 ({commissionConfig.splitBase})
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-linnk-stone-300">
                {commissionConfig.currentVersion}
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs text-linnk-stone-300 mb-1">
                  <span>Valor do Imóvel</span>
                  <span className="font-mono font-bold text-white">
                    {formatCentsToBRL(simPropertyReais * 100, true)}
                  </span>
                </div>
                <input
                  type="range"
                  min={250000}
                  max={3000000}
                  step={25000}
                  value={simPropertyReais}
                  onChange={(e) => setSimPropertyReais(Number(e.target.value))}
                  className="w-full accent-linnk-flame cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between gap-3">
                <label className="text-xs text-linnk-stone-300">
                  Taxa Comissão Incorporadora (%)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  max="10"
                  value={simRate}
                  onChange={(e) => setSimRate(Number(e.target.value) || 0)}
                  className="w-20 px-2.5 py-1.5 rounded-xl bg-white/10 border border-white/15 text-right font-mono text-sm text-white focus:border-linnk-flame focus:outline-none"
                />
              </div>

              <div className="mt-4 pt-4 border-t border-white/10 space-y-1.5 text-xs">
                <div className="flex justify-between text-linnk-stone-400">
                  <span>Comissão Bruta Total</span>
                  <span className="font-mono text-white">
                    {formatCentsToBRL(simGrossCents)}
                  </span>
                </div>
                {commissionConfig.splitBase === 'LIQUIDA' && (
                  <div className="flex justify-between text-linnk-stone-400">
                    <span>
                      Dedução Tributária ({commissionConfig.defaultTaxDeductionPercent}%)
                    </span>
                    <span className="font-mono text-rose-300">
                      - {formatCentsToBRL(simTaxCents)}
                    </span>
                  </div>
                )}
                <div className="pt-2 flex items-baseline justify-between">
                  <span className="font-display font-semibold text-linnk-flame-300">
                    Repasse Corretor (50%)
                  </span>
                  <span className="font-display font-bold text-xl text-linnk-flame-400">
                    {formatCentsToBRL(simBroker50Cents)}
                  </span>
                </div>
                <div className="flex justify-between text-linnk-stone-400">
                  <span>Parte LINNK (50%)</span>
                  <span className="font-mono text-white">
                    {formatCentsToBRL(simNetBaseCents - simBroker50Cents)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Atividades Auditadas Recentes */}
          <div className="bg-white rounded-3xl p-6 border border-linnk-stone-300/80 shadow-arch-card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-linnk-flame" />
                <h3 className="font-display font-bold text-base text-linnk-obsidian">
                  Rastreabilidade Recente
                </h3>
              </div>
            </div>

            <div className="space-y-3.5">
              {auditLogs.length === 0 ? (
                <p className="text-xs text-linnk-stone-500 py-3 text-center">
                  Nenhuma atividade registrada na auditoria.
                </p>
              ) : (
                auditLogs.slice(0, 4).map((log) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-2xl bg-linnk-stone-50 border border-linnk-stone-200/80 text-xs"
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono text-linnk-stone-500 mb-1">
                      <span className="font-bold text-linnk-obsidian">{log.module}</span>
                      <span>{formatDateTimeBR(log.createdAt)}</span>
                    </div>
                    <div className="font-semibold text-linnk-obsidian">{log.summary}</div>
                    <div className="text-linnk-stone-500 mt-1 flex items-center gap-1">
                      <UserCheck className="w-3 h-3 text-linnk-flame" />
                      <span>
                        {log.userName} ({log.userRole})
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
