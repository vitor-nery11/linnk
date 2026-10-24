import React, { useMemo, useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Calculator,
  CheckCircle2,
  FileText,
  Lock,
  Plus,
  Receipt,
  RotateCcw,
  ShieldCheck,
  Wallet,
  X,
} from 'lucide-react';
import { useApp } from '../../app/AppContext';
import {
  formatCentsToBRL,
  formatDateBR,
  formatDateTimeBR,
  parseBRLToCents,
} from '../../lib/formatters';
import { FinancialFlowBadge, ModalityBadge } from '../../components/StatusBadges';

export const SalesFinanceView: React.FC = () => {
  const {
    currentUser,
    sales,
    referrals,
    clients,
    brokers,
    developments,
    transactions,
    commissionConfig,
    registerSale,
    registerTransaction,
    confirmPendingTransaction,
    reverseTransaction,
  } = useApp();

  const [showSaleModal, setShowSaleModal] = useState(false);
  const [showTxModalForSaleId, setShowTxModalForSaleId] = useState<string | null>(null);
  const [reversalTargetTxId, setReversalTargetTxId] = useState<string | null>(null);
  const [reversalReason, setReversalReason] = useState('');

  // Permissões de acesso
  const isBroker = currentUser?.role === 'BROKER';
  const canRegisterSale =
    currentUser?.role === 'ADMIN' || Boolean(currentUser?.permissions?.canRegisterSales);
  const canRegisterFinance =
    currentUser?.role === 'ADMIN' || Boolean(currentUser?.permissions?.canRegisterFinance);

  const visibleSales = useMemo(() => {
    if (!isBroker || !currentUser?.brokerId) return sales;
    return sales.filter((s) => {
      const ref = referrals.find((r) => r.id === s.referralId);
      return ref?.brokerId === currentUser.brokerId;
    });
  }, [sales, referrals, isBroker, currentUser?.brokerId]);

  // Indicações elegíveis para nova venda
  const eligibleReferrals = useMemo(() => {
    return referrals.filter(
      (r) =>
        r.documentStatus === 'APROVADO' &&
        (commissionConfig.allowMultipleSalesPerReferral ||
          !sales.some((s) => s.referralId === r.id))
    );
  }, [referrals, sales, commissionConfig.allowMultipleSalesPerReferral]);

  // Estado do modal de Nova Venda
  const [selectedRefId, setSelectedRefId] = useState(eligibleReferrals[0]?.id || '');
  const [unitIdentifier, setUnitIdentifier] = useState('Torre Sul · Unidade 802');
  const [contractNumber, setContractNumber] = useState('CTR-2026-802');
  const [saleValueInput, setSaleValueInput] = useState('850.000,00');
  const [commissionRateInput, setCommissionRateInput] = useState('4.0');
  const [createInitialInstallments, setCreateInitialInstallments] = useState(true);

  // Estado do modal de Nova Parcela (Recebimento ou Repasse)
  const [txType, setTxType] = useState<'RECEBIMENTO_INCORPORADORA' | 'REPASSE_CORRETOR'>(
    'RECEBIMENTO_INCORPORADORA'
  );
  const [txLabel, setTxLabel] = useState('Parcela Parcial · Sinal');
  const [txAmountInput, setTxAmountInput] = useState('9.500,00');
  const [txDueDate, setTxDueDate] = useState('2026-11-15');
  const [txConfirmNow, setTxConfirmNow] = useState(true);
  const [txReceiptFile, setTxReceiptFile] = useState('comprovante_ted_pix.pdf');

  // Pré-cálculo da venda no modal
  const previewSaleCents = parseBRLToCents(saleValueInput);
  const previewRate = parseFloat(commissionRateInput) || 4.0;
  const previewGrossCents = Math.round((previewSaleCents * previewRate) / 100);
  const previewTaxCents =
    commissionConfig.splitBase === 'LIQUIDA'
      ? Math.round(
          (previewGrossCents * commissionConfig.defaultTaxDeductionPercent) / 100
        )
      : 0;
  const previewNetBaseCents = previewGrossCents - previewTaxCents;
  const previewBrokerCents = Math.round(
    (previewNetBaseCents * commissionConfig.defaultBrokerSharePercent) / 100
  );

  const handleCreateSale = (e: React.FormEvent) => {
    e.preventDefault();
    const targetRef = referrals.find((r) => r.id === selectedRefId);
    if (!targetRef || previewSaleCents <= 0) return;

    registerSale({
      referralId: targetRef.id,
      developmentId: targetRef.developmentId,
      unitIdentifier: unitIdentifier.trim(),
      contractNumber: contractNumber.trim(),
      saleValueCents: previewSaleCents,
      commissionRatePercent: previewRate,
      createInitialInstallments,
    });

    setShowSaleModal(false);
  };

  const handleCreateTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showTxModalForSaleId) return;
    const cents = parseBRLToCents(txAmountInput);
    if (cents <= 0) return;

    registerTransaction({
      saleId: showTxModalForSaleId,
      type: txType,
      installmentLabel: txLabel.trim(),
      amountCents: cents,
      dueDate: txDueDate,
      confirmImmediately: txConfirmNow,
      receiptFileName: txConfirmNow ? txReceiptFile.trim() : undefined,
    });

    setShowTxModalForSaleId(null);
  };

  const handleConfirmReversal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reversalTargetTxId || !reversalReason.trim()) return;
    reverseTransaction(reversalTargetTxId, reversalReason.trim());
    setReversalTargetTxId(null);
    setReversalReason('');
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="bg-white rounded-3xl p-6 border border-linnk-stone-300/80 shadow-arch-card flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-linnk-flame">
            <Receipt className="w-4 h-4" />
            <span>
              {isBroker
                ? 'Carteira do Corretor Parceiro'
                : 'Fechamento Comercial & Financeiro'}
            </span>
          </div>
          <h2 className="font-display font-bold text-2xl text-linnk-obsidian mt-1">
            {isBroker
              ? 'Minhas Vendas, Comissão 50% & Repasses'
              : 'Vendas, Memória de Cálculo 50/50, Recebimentos & Repasses'}
          </h2>
          <p className="text-sm text-linnk-stone-600 mt-1">
            {isBroker
              ? 'Consulte a memória de cálculo da sua comissão de 50% e o status dos repasses associados às suas vendas confirmadas.'
              : 'Cada venda congela a versão da regra de comissão aplicada. Recebimentos da incorporadora e repasses ao corretor suportam parcelas parciais e estornos auditáveis.'}
          </p>
        </div>

        {!isBroker && (
          <div className="flex items-center gap-3 shrink-0">
            {!canRegisterSale && (
              <span className="px-3.5 py-2 rounded-2xl bg-linnk-stone-100 text-xs font-mono text-linnk-stone-600 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-rose-500" /> Permissão Restrita
              </span>
            )}
            <button
              disabled={!canRegisterSale || eligibleReferrals.length === 0}
              onClick={() => {
                setSelectedRefId(eligibleReferrals[0]?.id || '');
                setShowSaleModal(true);
              }}
              className="px-5 py-2.5 rounded-2xl bg-linnk-flame hover:bg-linnk-flame-600 text-white font-display font-bold text-xs sm:text-sm shadow-flame-sm flex items-center gap-2 disabled:opacity-40"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Nova Venda</span>
            </button>
          </div>
        )}
      </div>

      {/* Lista de Vendas e Respectivas Comissões + Movimentações Financeiras */}
      {visibleSales.map((sale) => {
        const ref = referrals.find((r) => r.id === sale.referralId);
        const cli = ref ? clients.find((c) => c.id === ref.clientId) : null;
        const brk = ref ? brokers.find((b) => b.id === ref.brokerId) : null;
        const dev = developments.find((d) => d.id === sale.developmentId);
        const saleTxs = transactions.filter((t) => t.saleId === sale.id);

        // Saldos
        const receivedConfirmedCents = saleTxs
          .filter(
            (t) => t.type === 'RECEBIMENTO_INCORPORADORA' && t.status === 'CONFIRMADO'
          )
          .reduce((acc, t) => acc + t.amountCents, 0);
        const receivedReversedCents = saleTxs
          .filter((t) => t.type === 'ESTORNO_RECEBIMENTO')
          .reduce((acc, t) => acc + Math.abs(t.amountCents), 0);
        const netReceivedCents = Math.max(0, receivedConfirmedCents - receivedReversedCents);
        const pendingReceiveBalanceCents = Math.max(
          0,
          sale.commission.grossCommissionCents - netReceivedCents
        );

        const paidConfirmedCents = saleTxs
          .filter((t) => t.type === 'REPASSE_CORRETOR' && t.status === 'CONFIRMADO')
          .reduce((acc, t) => acc + t.amountCents, 0);
        const paidReversedCents = saleTxs
          .filter((t) => t.type === 'ESTORNO_REPASSE')
          .reduce((acc, t) => acc + Math.abs(t.amountCents), 0);
        const netPaidCents = Math.max(0, paidConfirmedCents - paidReversedCents);
        const pendingPayoutBalanceCents = Math.max(
          0,
          sale.commission.brokerCommissionCents - netPaidCents
        );

        return (
          <div
            key={sale.id}
            className="bg-white rounded-3xl border border-linnk-stone-300/80 shadow-arch-card overflow-hidden"
          >
            {/* Header da Venda */}
            <div className="bg-linnk-obsidian text-white p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-linnk-flame text-white font-mono text-xs font-bold">
                    {sale.code}
                  </span>
                  <span className="font-mono text-xs text-linnk-stone-300">
                    Indicação: {ref?.code} · Contrato: {sale.contractNumber}
                  </span>
                  {ref && <ModalityBadge modality={ref.modality} />}
                </div>
                <h3 className="font-display font-bold text-xl mt-2">
                  {dev?.name} — {sale.unitIdentifier}
                </h3>
                <p className="text-xs text-linnk-stone-300 mt-0.5">
                  Comprador: <strong>{cli?.name}</strong> · Corretor Titular (50%):{' '}
                  <strong>
                    {brk?.name} ({brk?.city})
                  </strong>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <div className="text-right">
                  <span className="text-[11px] font-mono uppercase text-linnk-stone-400 block">
                    Valor da Venda (VGV)
                  </span>
                  <span className="font-display font-bold text-2xl text-white">
                    {formatCentsToBRL(sale.saleValueCents)}
                  </span>
                </div>

                {canRegisterFinance && (
                  <button
                    onClick={() => setShowTxModalForSaleId(sale.id)}
                    className="px-4 py-2.5 rounded-2xl bg-linnk-flame hover:bg-linnk-flame-600 text-white font-display font-bold text-xs flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Registrar Recebimento / Repasse</span>
                  </button>
                )}
              </div>
            </div>

            {/* Memória de Cálculo Imutável + Saldos Separados */}
            <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 border-b border-linnk-stone-200 bg-linnk-stone-50/60">
              {/* Bloco Memória de Cálculo */}
              <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-linnk-stone-200/90 space-y-2.5 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-linnk-stone-200">
                  <span className="font-display font-bold text-sm text-linnk-obsidian flex items-center gap-1.5">
                    <Calculator className="w-4 h-4 text-linnk-flame" />
                    Memória de Cálculo Congelada
                  </span>
                  <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-linnk-stone-100 text-linnk-obsidian font-semibold">
                    {sale.commission.ruleVersion}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-linnk-stone-600">
                    Comissão Bruta ({sale.commission.commissionRatePercent}%):
                  </span>
                  <strong className="font-mono text-linnk-obsidian">
                    {formatCentsToBRL(sale.commission.grossCommissionCents)}
                  </strong>
                </div>

                <div className="flex justify-between">
                  <span className="text-linnk-stone-600">
                    Deduções / Imposto NF ({sale.commission.taxDeductionRatePercent}% sobre{' '}
                    {sale.commission.splitBase}):
                  </span>
                  <span className="font-mono text-rose-600">
                    - {formatCentsToBRL(sale.commission.taxDeductionCents)}
                  </span>
                </div>

                <div className="flex justify-between pt-1 border-t border-linnk-stone-200">
                  <span className="text-linnk-stone-600">Base Líquida Divisível:</span>
                  <strong className="font-mono text-linnk-obsidian">
                    {formatCentsToBRL(sale.commission.netCalculableBaseCents)}
                  </strong>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <div className="p-3 rounded-xl bg-linnk-flame-50 border border-linnk-flame-200">
                    <span className="text-[10px] font-mono uppercase text-linnk-flame-800 block">
                      Corretor ({sale.commission.brokerSharePercent}%)
                    </span>
                    <span className="font-display font-bold text-base text-linnk-flame-700">
                      {formatCentsToBRL(sale.commission.brokerCommissionCents)}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-linnk-stone-100 border border-linnk-stone-200">
                    <span className="text-[10px] font-mono uppercase text-linnk-stone-600 block">
                      LINNK ({sale.commission.linnkSharePercent}%)
                    </span>
                    <span className="font-display font-bold text-base text-linnk-obsidian">
                      {formatCentsToBRL(sale.commission.linnkCommissionCents)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bloco Saldos Separados: Recebimento Incorporadora vs Repasse Corretor */}
              <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl p-5 border border-linnk-stone-200/90 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono uppercase text-linnk-stone-500">
                        1. Recebimento Incorporadora
                      </span>
                      {ref && (
                        <FinancialFlowBadge status={ref.receivementStatus} />
                      )}
                    </div>
                    <div className="font-display font-bold text-2xl text-emerald-700 mt-2">
                      {formatCentsToBRL(netReceivedCents)}
                    </div>
                    <p className="text-xs text-linnk-stone-500 mt-0.5">
                      de {formatCentsToBRL(sale.commission.grossCommissionCents)} previstos
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-linnk-stone-200 flex justify-between text-xs">
                    <span className="text-linnk-stone-600">Saldo Pendente a Receber:</span>
                    <strong className="font-mono text-amber-700">
                      {formatCentsToBRL(pendingReceiveBalanceCents)}
                    </strong>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-linnk-stone-200/90 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono uppercase text-linnk-stone-500">
                        2. Repasse ao Corretor (50%)
                      </span>
                      {ref && <FinancialFlowBadge status={ref.payoutStatus} />}
                    </div>
                    <div className="font-display font-bold text-2xl text-linnk-flame mt-2">
                      {formatCentsToBRL(netPaidCents)}
                    </div>
                    <p className="text-xs text-linnk-stone-500 mt-0.5">
                      de {formatCentsToBRL(sale.commission.brokerCommissionCents)} devidos a{' '}
                      {brk?.name}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-linnk-stone-200 flex justify-between text-xs">
                    <span className="text-linnk-stone-600">Saldo Pendente a Repassar:</span>
                    <strong className="font-mono text-linnk-flame">
                      {formatCentsToBRL(pendingPayoutBalanceCents)}
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabela de Movimentações Financeiras da Venda */}
            <div className="p-6">
              <h4 className="font-display font-bold text-sm text-linnk-obsidian mb-3">
                Movimentações Financeiras & Parcelas Registradas ({saleTxs.length})
              </h4>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-linnk-stone-50 border-b border-linnk-stone-200 font-mono uppercase text-linnk-stone-500">
                      <th className="py-3 px-4">Tipo de Movimentação</th>
                      <th className="py-3 px-4">Descrição / Parcela</th>
                      <th className="py-3 px-4">Vencimento / Data</th>
                      <th className="py-3 px-4">Valor</th>
                      <th className="py-3 px-4">Status & Comprovante</th>
                      <th className="py-3 px-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-linnk-stone-200">
                    {saleTxs.map((tx) => {
                      const isReversal =
                        tx.type === 'ESTORNO_RECEBIMENTO' || tx.type === 'ESTORNO_REPASSE';

                      return (
                        <tr
                          key={tx.id}
                          className={
                            tx.status === 'ESTORNADO'
                              ? 'bg-stone-100/80 text-stone-500'
                              : isReversal
                              ? 'bg-rose-50/50'
                              : 'hover:bg-linnk-stone-50'
                          }
                        >
                          <td className="py-3.5 px-4 font-mono font-bold">
                            {tx.type === 'RECEBIMENTO_INCORPORADORA' && (
                              <span className="inline-flex items-center gap-1 text-emerald-700">
                                <ArrowDownLeft className="w-3.5 h-3.5" />
                                ENTRADA INCORPORADORA
                              </span>
                            )}
                            {tx.type === 'REPASSE_CORRETOR' && (
                              <span className="inline-flex items-center gap-1 text-linnk-flame">
                                <ArrowUpRight className="w-3.5 h-3.5" />
                                REPASSE CORRETOR (50%)
                              </span>
                            )}
                            {isReversal && (
                              <span className="inline-flex items-center gap-1 text-rose-700">
                                <RotateCcw className="w-3.5 h-3.5" />
                                {tx.type}
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-linnk-obsidian">
                              {tx.installmentLabel}
                            </div>
                            {tx.reversalReason && (
                              <div className="text-[11px] text-rose-700 mt-0.5">
                                Motivo do Estorno: "{tx.reversalReason}"
                              </div>
                            )}
                          </td>

                          <td className="py-3.5 px-4 font-mono">
                            <div>Venc.: {tx.dueDate}</div>
                            {tx.paidAt && (
                              <div className="text-[11px] text-linnk-stone-500">
                                Efetivado: {formatDateTimeBR(tx.paidAt)}
                              </div>
                            )}
                          </td>

                          <td className="py-3.5 px-4 font-mono font-bold text-sm">
                            <span
                              className={
                                tx.amountCents < 0
                                  ? 'text-rose-600'
                                  : 'text-linnk-obsidian'
                              }
                            >
                              {formatCentsToBRL(tx.amountCents)}
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                                tx.status === 'CONFIRMADO'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : tx.status === 'ESTORNADO'
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200 line-through'
                                  : 'bg-amber-50 text-amber-800 border border-amber-200'
                              }`}
                            >
                              {tx.status}
                            </span>
                            {tx.receiptStorageKey && (
                              <div className="text-[10px] font-mono text-linnk-stone-500 mt-1 truncate max-w-[200px]">
                                {tx.receiptStorageKey}
                              </div>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            {canRegisterFinance && tx.status === 'PENDENTE' && (
                              <button
                                onClick={() => confirmPendingTransaction(tx.id)}
                                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-display font-bold text-xs inline-flex items-center gap-1"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Confirmar Baixa</span>
                              </button>
                            )}

                            {canRegisterFinance &&
                              tx.status === 'CONFIRMADO' &&
                              !isReversal && (
                                <button
                                  onClick={() => setReversalTargetTxId(tx.id)}
                                  className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-display font-semibold text-xs inline-flex items-center gap-1"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                  <span>Estornar</span>
                                </button>
                              )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })}

      {/* Modal de Nova Venda */}
      {showSaleModal && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full border border-linnk-stone-300 shadow-obsidian overflow-hidden">
            <div className="bg-linnk-obsidian text-white px-6 py-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-linnk-flame">
                  Cálculo Reproduzível e Auditável
                </span>
                <h3 className="font-display font-bold text-lg">
                  Registrar Venda Confirmada
                </h3>
              </div>
              <button
                onClick={() => setShowSaleModal(false)}
                className="p-1.5 rounded-xl bg-white/10 text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSale} className="p-6 space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold mb-1">
                  Indicação com Termo Conferido *
                </label>
                <select
                  required
                  value={selectedRefId}
                  onChange={(e) => setSelectedRefId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-linnk-stone-50 border border-linnk-stone-300"
                >
                  {eligibleReferrals.map((r) => {
                    const c = clients.find((cl) => cl.id === r.clientId);
                    const b = brokers.find((br) => br.id === r.brokerId);
                    return (
                      <option key={r.id} value={r.id}>
                        {r.code} — Cliente: {c?.name} (Corretor: {b?.name})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Unidade / Bloco / Lote *
                  </label>
                  <input
                    type="text"
                    required
                    value={unitIdentifier}
                    onChange={(e) => setUnitIdentifier(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-linnk-stone-50 border border-linnk-stone-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Nº do Contrato / Proposta *
                  </label>
                  <input
                    type="text"
                    required
                    value={contractNumber}
                    onChange={(e) => setContractNumber(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-linnk-stone-50 border border-linnk-stone-300 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Valor da Venda (R$) *
                  </label>
                  <input
                    type="text"
                    required
                    value={saleValueInput}
                    onChange={(e) => setSaleValueInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-linnk-stone-50 border border-linnk-stone-300 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Taxa de Comissão Aplicável (%) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={commissionRateInput}
                    onChange={(e) => setCommissionRateInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-linnk-stone-50 border border-linnk-stone-300 font-mono"
                  />
                </div>
              </div>

              {/* Preview do Cálculo Congelado */}
              <div className="p-4 rounded-2xl bg-linnk-obsidian text-white space-y-1.5 text-xs">
                <div className="flex justify-between text-linnk-stone-400">
                  <span>Regra que será congelada:</span>
                  <span className="font-mono text-linnk-flame-400">
                    {commissionConfig.currentVersion} ({commissionConfig.splitBase})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Comissão Bruta Total:</span>
                  <span className="font-mono font-bold">
                    {formatCentsToBRL(previewGrossCents)}
                  </span>
                </div>
                <div className="flex justify-between text-linnk-flame-300 font-bold text-sm pt-1 border-t border-white/10">
                  <span>Repasse 50% Corretor:</span>
                  <span className="font-mono">{formatCentsToBRL(previewBrokerCents)}</span>
                </div>
              </div>

              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={createInitialInstallments}
                  onChange={(e) => setCreateInitialInstallments(e.target.checked)}
                  className="accent-linnk-flame"
                />
                <span>
                  Gerar automaticamente os lançamentos pendentes de Recebimento e Repasse
                </span>
              </label>

              <div className="flex justify-end gap-2 pt-3 border-t border-linnk-stone-200">
                <button
                  type="button"
                  onClick={() => setShowSaleModal(false)}
                  className="px-4 py-2 rounded-xl bg-linnk-stone-100 text-xs font-display font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-linnk-flame text-white text-xs font-display font-bold"
                >
                  Confirmar Venda & Congelar Comissão
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Nova Parcela Financeira (Recebimento ou Repasse) */}
      {showTxModalForSaleId && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full border border-linnk-stone-300 shadow-obsidian overflow-hidden">
            <div className="bg-linnk-obsidian text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-display font-bold text-base">
                Registrar Recebimento ou Repasse
              </h3>
              <button
                onClick={() => setShowTxModalForSaleId(null)}
                className="p-1.5 rounded-xl bg-white/10 text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateTransaction} className="p-6 space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold mb-1">
                  Natureza da Movimentação
                </label>
                <select
                  value={txType}
                  onChange={(e) =>
                    setTxType(
                      e.target.value as 'RECEBIMENTO_INCORPORADORA' | 'REPASSE_CORRETOR'
                    )
                  }
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-linnk-stone-50 border border-linnk-stone-300"
                >
                  <option value="RECEBIMENTO_INCORPORADORA">
                    Recebimento da Incorporadora (Entrada LINNK)
                  </option>
                  <option value="REPASSE_CORRETOR">
                    Repasse ao Corretor Parceiro (Saída 50%)
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">
                  Identificação da Parcela *
                </label>
                <input
                  type="text"
                  required
                  value={txLabel}
                  onChange={(e) => setTxLabel(e.target.value)}
                  placeholder="Ex.: Parcela 2/3 · Pagamento Parcial"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-linnk-stone-50 border border-linnk-stone-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Valor (R$) *</label>
                  <input
                    type="text"
                    required
                    value={txAmountInput}
                    onChange={(e) => setTxAmountInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-linnk-stone-50 border border-linnk-stone-300 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Vencimento *</label>
                  <input
                    type="date"
                    required
                    value={txDueDate}
                    onChange={(e) => setTxDueDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-linnk-stone-50 border border-linnk-stone-300 font-mono"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={txConfirmNow}
                  onChange={(e) => setTxConfirmNow(e.target.checked)}
                  className="accent-linnk-flame"
                />
                <span>Já foi pago/recebido (anexar comprovante no Storage privado)</span>
              </label>

              {txConfirmNow && (
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Arquivo de Comprovante (Supabase Storage)
                  </label>
                  <input
                    type="text"
                    value={txReceiptFile}
                    onChange={(e) => setTxReceiptFile(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-2xl bg-linnk-stone-50 border border-linnk-stone-300 font-mono text-xs"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-linnk-stone-200">
                <button
                  type="button"
                  onClick={() => setShowTxModalForSaleId(null)}
                  className="px-4 py-2 rounded-xl bg-linnk-stone-100 text-xs font-display font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-linnk-flame text-white text-xs font-display font-bold"
                >
                  Salvar Movimentação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Estorno Auditável */}
      {reversalTargetTxId && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full border-2 border-rose-400 shadow-obsidian overflow-hidden">
            <div className="bg-rose-600 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4" />
                <h3 className="font-display font-bold text-base">
                  Estorno / Ajuste Financeiro Auditável
                </h3>
              </div>
              <button
                onClick={() => setReversalTargetTxId(null)}
                className="p-1 rounded-lg bg-white/15 text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleConfirmReversal} className="p-6 space-y-4 text-sm">
              <p className="text-xs text-linnk-stone-600 leading-relaxed">
                Nenhuma movimentação financeira confirmada é apagada silenciosamente.
                O sistema preservará o registro original e criará um lançamento
                compensatório de estorno vinculado, auditando usuário, data e
                justificativa.
              </p>
              <div>
                <label className="block text-xs font-semibold text-linnk-obsidian mb-1">
                  Motivo Obrigatório do Estorno / Correção *
                </label>
                <textarea
                  rows={3}
                  required
                  value={reversalReason}
                  onChange={(e) => setReversalReason(e.target.value)}
                  placeholder="Ex.: Valor lançado com divergência de centavos no comprovante bancário; será relançado com o valor ajustado..."
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-linnk-stone-50 border border-linnk-stone-300 text-xs focus:border-rose-500 focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReversalTargetTxId(null)}
                  className="px-4 py-2 rounded-xl bg-linnk-stone-100 text-xs font-display font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-display font-bold"
                >
                  Confirmar Estorno Auditado
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
