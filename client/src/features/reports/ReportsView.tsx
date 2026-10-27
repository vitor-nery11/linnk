import React from 'react';
import { BarChart3, Building2, Printer, TrendingUp, UserCheck } from 'lucide-react';
import { useApp } from '../../app/AppContext';
import { formatCentsToBRL } from '../../lib/formatters';

export const ReportsView: React.FC = () => {
  const { referrals, sales, transactions, brokers, developments } = useApp();

  const indicaRefs = referrals.filter((r) => r.modality === 'INDICA');
  const conectaRefs = referrals.filter((r) => r.modality === 'CONECTA');

  const totalVgvCents = sales.reduce((acc, s) => acc + s.saleValueCents, 0);
  const totalGrossCommCents = sales.reduce(
    (acc, s) => acc + s.commission.grossCommissionCents,
    0
  );
  const totalBrokerCommCents = sales.reduce(
    (acc, s) => acc + s.commission.brokerCommissionCents,
    0
  );
  const totalLinnkCommCents = sales.reduce(
    (acc, s) => acc + s.commission.linnkCommissionCents,
    0
  );

  const totalReceivedCents = transactions
    .filter((t) => t.type === 'RECEBIMENTO_INCORPORADORA' && t.status === 'CONFIRMADO')
    .reduce((acc, t) => acc + t.amountCents, 0);

  const totalRepassedCents = transactions
    .filter((t) => t.type === 'REPASSE_CORRETOR' && t.status === 'CONFIRMADO')
    .reduce((acc, t) => acc + t.amountCents, 0);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-6 border border-linnk-stone-300/80 shadow-arch-card flex flex-col lg:flex-row lg:items-center justify-between gap-4 no-print">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-linnk-flame">
            <BarChart3 className="w-4 h-4" />
            <span>Inteligência Operacional & Fechamento</span>
          </div>
          <h2 className="font-display font-bold text-2xl text-linnk-obsidian mt-1">
            Relatórios Gerenciais, Conversão & Demonstrativo Financeiro
          </h2>
          <p className="text-sm text-linnk-stone-600 mt-1">
            Consolidado por modalidade (INDICA vs CONECTA), performance de corretores parceiros
            e conciliação entre recebimentos de incorporadoras e repasses de 50%.
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="px-4 py-2.5 rounded-2xl bg-linnk-obsidian hover:bg-linnk-obsidian-800 text-white font-display font-bold text-xs flex items-center gap-2 shrink-0"
        >
          <Printer className="w-4 h-4 text-linnk-flame" />
          <span>Imprimir / Exportar Relatório PDF</span>
        </button>
      </div>

      {/* KPIs Consolidados */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl p-5 border border-linnk-stone-300/80 shadow-arch-card">
          <span className="text-xs font-mono uppercase text-linnk-stone-500">
            VGV Total Confirmado
          </span>
          <div className="font-display font-bold text-2xl text-linnk-obsidian mt-1">
            {formatCentsToBRL(totalVgvCents)}
          </div>
          <span className="text-xs text-linnk-stone-500 mt-1 block">
            {sales.length} venda(s) sobre {referrals.length} indicações
          </span>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-linnk-stone-300/80 shadow-arch-card">
          <span className="text-xs font-mono uppercase text-linnk-stone-500">
            Comissão Bruta Gerada
          </span>
          <div className="font-display font-bold text-2xl text-emerald-700 mt-1">
            {formatCentsToBRL(totalGrossCommCents)}
          </div>
          <span className="text-xs text-linnk-stone-500 mt-1 block">
            Recebido até agora: {formatCentsToBRL(totalReceivedCents)}
          </span>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-linnk-stone-300/80 shadow-arch-card">
          <span className="text-xs font-mono uppercase text-linnk-stone-500">
            Total Devido aos Corretores (50%)
          </span>
          <div className="font-display font-bold text-2xl text-linnk-flame mt-1">
            {formatCentsToBRL(totalBrokerCommCents)}
          </div>
          <span className="text-xs text-linnk-stone-500 mt-1 block">
            Já repassado: {formatCentsToBRL(totalRepassedCents)}
          </span>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-linnk-stone-300/80 shadow-arch-card">
          <span className="text-xs font-mono uppercase text-linnk-stone-500">
            Receita Líquida LINNK (50%)
          </span>
          <div className="font-display font-bold text-2xl text-linnk-obsidian mt-1">
            {formatCentsToBRL(totalLinnkCommCents)}
          </div>
          <span className="text-xs text-linnk-stone-500 mt-1 block">
            Mix: {indicaRefs.length} INDICA / {conectaRefs.length} CONECTA
          </span>
        </div>
      </div>

      {/* Tabelas Analíticas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance por Empreendimento */}
        <div className="bg-white rounded-3xl p-6 border border-linnk-stone-300/80 shadow-arch-card overflow-hidden">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="w-4 h-4 text-linnk-flame" />
            <h3 className="font-display font-bold text-base text-linnk-obsidian">
              Desempenho por Empreendimento da Curadoria
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-linnk-stone-200 font-mono uppercase text-linnk-stone-500">
                  <th className="py-2.5 pr-3">Empreendimento</th>
                  <th className="py-2.5 px-2">Indicações</th>
                  <th className="py-2.5 px-2">Vendas</th>
                  <th className="py-2.5 pl-2 text-right">VGV Confirmado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-linnk-stone-200">
                {developments.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-linnk-stone-500">
                      Nenhum empreendimento registrado.
                    </td>
                  </tr>
                ) : (
                  developments.map((d) => {
                    const dRefs = referrals.filter((r) => r.developmentId === d.id);
                    const dSales = sales.filter((s) => s.developmentId === d.id);
                    const dVgv = dSales.reduce((acc, s) => acc + s.saleValueCents, 0);
                    return (
                      <tr key={d.id}>
                        <td className="py-3 pr-3 font-semibold text-linnk-obsidian">{d.name}</td>
                        <td className="py-3 px-2 font-mono">{dRefs.length}</td>
                        <td className="py-3 px-2 font-mono">{dSales.length}</td>
                        <td className="py-3 pl-2 font-mono font-bold text-right whitespace-nowrap">
                          {formatCentsToBRL(dVgv)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Performance por Corretor Parceiro */}
        <div className="bg-white rounded-3xl p-6 border border-linnk-stone-300/80 shadow-arch-card overflow-hidden">
          <div className="flex items-center gap-2 mb-4">
            <UserCheck className="w-4 h-4 text-linnk-flame" />
            <h3 className="font-display font-bold text-base text-linnk-obsidian">
              Ranking de Corretores Parceiros & Comissões 50%
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-linnk-stone-200 font-mono uppercase text-linnk-stone-500">
                  <th className="py-2.5 pr-3">Corretor & Praça</th>
                  <th className="py-2.5 px-2">Indicações</th>
                  <th className="py-2.5 px-2">Modalidade</th>
                  <th className="py-2.5 pl-2 text-right">Comissão 50%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-linnk-stone-200">
                {brokers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-linnk-stone-500">
                      Nenhum corretor parceiro registrado.
                    </td>
                  </tr>
                ) : (
                  brokers.map((b) => {
                    const bRefs = referrals.filter((r) => r.brokerId === b.id);
                    const bSales = sales.filter((s) =>
                      bRefs.some((r) => r.id === s.referralId)
                    );
                    const bComm = bSales.reduce(
                      (acc, s) => acc + s.commission.brokerCommissionCents,
                      0
                    );
                    return (
                      <tr key={b.id}>
                        <td className="py-3 pr-3">
                          <div className="font-semibold text-linnk-obsidian">{b.name}</div>
                          <div className="text-[11px] text-linnk-stone-500">{b.city}</div>
                        </td>
                        <td className="py-3 px-2 font-mono">{bRefs.length}</td>
                        <td className="py-3 px-2 font-mono">{b.defaultModality}</td>
                        <td className="py-3 pl-2 font-mono font-bold text-linnk-flame text-right whitespace-nowrap">
                          {formatCentsToBRL(bComm)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
