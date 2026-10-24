import React, { useState } from 'react';
import { Lock, Search, ShieldAlert, UserCheck } from 'lucide-react';
import { useApp } from '../../app/AppContext';
import { formatDateTimeBR, formatRoleLabel } from '../../lib/formatters';

export const AuditView: React.FC = () => {
  const { currentUser, auditLogs } = useApp();
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState<string>('ALL');

  const canAccess =
    currentUser?.role === 'ADMIN' ||
    Boolean(currentUser?.permissions?.canViewAuditRestricted);

  if (!canAccess) {
    return (
      <div className="bg-white rounded-3xl p-10 border border-rose-200 text-center">
        <Lock className="w-10 h-10 text-rose-600 mx-auto mb-3" />
        <h2 className="font-display font-bold text-xl text-linnk-obsidian">
          Auditoria Restrita
        </h2>
        <p className="text-sm text-linnk-stone-600 mt-1">
          Seu perfil atual não possui permissão para consultar os logs de auditoria.
        </p>
      </div>
    );
  }

  const filtered = auditLogs.filter((log) => {
    if (moduleFilter !== 'ALL' && log.module !== moduleFilter) return false;
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      log.summary.toLowerCase().includes(q) ||
      log.details.toLowerCase().includes(q) ||
      log.userName.toLowerCase().includes(q) ||
      log.action.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-6 border border-linnk-stone-300/80 shadow-arch-card">
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-linnk-flame">
          <ShieldAlert className="w-4 h-4" />
          <span>Rastreabilidade Imutável</span>
        </div>
        <h2 className="font-display font-bold text-2xl text-linnk-obsidian mt-1">
          Trilha de Auditoria e Segurança Operacional
        </h2>
        <p className="text-sm text-linnk-stone-600 mt-1">
          Registro cronológico de todas as ações críticas: detecção e resolução de
          duplicidade, conferência de termos, registro de vendas, repasses, estornos
          e alterações de regras.
        </p>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-3xl p-4 border border-linnk-stone-300/80 shadow-arch-card grid grid-cols-1 md:grid-cols-12 gap-3">
        <div className="md:col-span-8 relative">
          <Search className="w-4 h-4 text-linnk-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar por evento, código de indicação/venda, operador ou justificativa..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-linnk-stone-50 border border-linnk-stone-200 text-sm focus:border-linnk-flame focus:outline-none"
          />
        </div>
        <div className="md:col-span-4">
          <select
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-2xl bg-linnk-stone-50 border border-linnk-stone-200 text-sm focus:border-linnk-flame focus:outline-none"
          >
            <option value="ALL">Todos os Módulos ({auditLogs.length})</option>
            <option value="REFERRAL">Indicações (REFERRAL)</option>
            <option value="DUPLICATE">Duplicidades (DUPLICATE)</option>
            <option value="DOCUMENT">Documentos / Termos (DOCUMENT)</option>
            <option value="ATTENDANCE">Atendimentos (ATTENDANCE)</option>
            <option value="SALE">Vendas & Comissões (SALE)</option>
            <option value="FINANCE">Recebimentos, Repasses & Estornos (FINANCE)</option>
            <option value="CONFIG">Usuários & Regras (CONFIG)</option>
          </select>
        </div>
      </div>

      {/* Lista de Logs */}
      <div className="bg-white rounded-3xl border border-linnk-stone-300/80 shadow-arch-card overflow-hidden">
        <div className="divide-y divide-linnk-stone-200">
          {filtered.map((log) => (
            <div key={log.id} className="p-5 hover:bg-linnk-stone-50/80 transition-colors">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-linnk-obsidian text-white font-mono text-[10px] font-bold">
                    {log.module}
                  </span>
                  <span className="font-mono text-xs font-semibold text-linnk-flame">
                    {log.action}
                  </span>
                  <span className="font-mono text-xs text-linnk-stone-400">
                    ID: {log.entityId}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono text-linnk-stone-500">
                  <UserCheck className="w-3.5 h-3.5 text-linnk-flame" />
                  <span>
                    {log.userName} ({formatRoleLabel(log.userRole)}) · {formatDateTimeBR(log.createdAt)}
                  </span>
                </div>
              </div>
              <h4 className="font-display font-bold text-sm text-linnk-obsidian mt-2">
                {log.summary}
              </h4>
              <p className="text-xs text-linnk-stone-600 mt-1 leading-relaxed">
                {log.details}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
