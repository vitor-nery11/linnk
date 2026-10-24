import React, { useState } from 'react';
import {
  CheckCircle2,
  Lock,
  Plus,
  Power,
  ShieldCheck,
  Sliders,
  Users,
} from 'lucide-react';
import { useApp } from '../../app/AppContext';
import { CommissionSplitBase, OperatorPermissions } from '../../app/types';
import { formatDateTimeBR, formatRoleLabel } from '../../lib/formatters';

export const UsersConfigView: React.FC = () => {
  const {
    currentUser,
    users,
    commissionConfig,
    updateCommissionConfig,
    updateOperatorPermissions,
    toggleUserActive,
    createUser,
  } = useApp();

  const [versionInput, setVersionInput] = useState(commissionConfig.currentVersion);
  const [splitBase, setSplitBase] = useState<CommissionSplitBase>(
    commissionConfig.splitBase
  );
  const [taxRate, setTaxRate] = useState(
    String(commissionConfig.defaultTaxDeductionPercent)
  );
  const [protectionMonths, setProtectionMonths] = useState(
    String(commissionConfig.protectionMonths)
  );
  const [priorityRule, setPriorityRule] = useState(
    commissionConfig.duplicatePriorityRule
  );
  const [allowMultiSales, setAllowMultiSales] = useState(
    commissionConfig.allowMultipleSalesPerReferral
  );

  // Novo usuário interno
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<'ADMIN' | 'OPERATOR'>('OPERATOR');
  const [newTitle, setNewTitle] = useState('Analista Operacional LINNK');

  if (currentUser?.role !== 'ADMIN') {
    return (
      <div className="bg-white rounded-3xl p-10 border border-rose-200 text-center">
        <Lock className="w-10 h-10 text-rose-600 mx-auto mb-3" />
        <h2 className="font-display font-bold text-xl text-linnk-obsidian">
          Acesso Restrito ao Administrador
        </h2>
        <p className="text-sm text-linnk-stone-600 mt-1">
          O perfil atual não possui autorização para gerenciar usuários internos ou
          alterar regras globais de comissão.
        </p>
      </div>
    );
  }

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    updateCommissionConfig({
      currentVersion: versionInput.trim() || 'REGRA-50-50-v1.1',
      splitBase,
      defaultTaxDeductionPercent: parseFloat(taxRate) || 0,
      protectionMonths: parseInt(protectionMonths, 10) || 6,
      duplicatePriorityRule: priorityRule,
      allowMultipleSalesPerReferral: allowMultiSales,
    });
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) return;
    createUser({
      name: newName.trim(),
      email: newEmail.trim(),
      role: newRole,
      title: newTitle.trim(),
    });
    setNewName('');
    setNewEmail('');
  };

  const togglePermission = (
    userId: string,
    currentPerms: OperatorPermissions,
    key: keyof OperatorPermissions
  ) => {
    updateOperatorPermissions(userId, {
      ...currentPerms,
      [key]: !currentPerms[key],
    });
  };

  return (
    <div className="space-y-8">
      {/* Cabeçalho */}
      <div className="bg-white rounded-3xl p-6 border border-linnk-stone-300/80 shadow-arch-card">
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-linnk-flame">
          <Sliders className="w-4 h-4" />
          <span>Governança Administrativa</span>
        </div>
        <h2 className="font-display font-bold text-2xl text-linnk-obsidian mt-1">
          Usuários Internos, Matriz de Permissões & Regras de Comissão 50/50
        </h2>
        <p className="text-sm text-linnk-stone-600 mt-1">
          Configure os parâmetros operacionais (base de divisão Bruta vs Líquida,
          prioridade de duplicidade e permissões granulares do Operador) mantendo o
          histórico de vendas passadas intacto.
        </p>
      </div>

      {/* Seção 1: Parametrização das Regras de Comissão e Negócio */}
      <div className="bg-white rounded-3xl p-6 border border-linnk-stone-300/80 shadow-arch-card">
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-linnk-stone-200">
          <div>
            <h3 className="font-display font-bold text-lg text-linnk-obsidian">
              1. Motor de Regras de Comissão & Parâmetros de Negócio
            </h3>
            <p className="text-xs text-linnk-stone-500 mt-0.5">
              Última atualização em {formatDateTimeBR(commissionConfig.updatedAt)} · Versão
              ativa: <strong className="font-mono">{commissionConfig.currentVersion}</strong>
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveConfig} className="grid grid-cols-1 md:grid-cols-3 gap-5 text-sm">
          <div>
            <label className="block text-xs font-semibold text-linnk-obsidian mb-1">
              Identificador da Versão da Regra
            </label>
            <input
              type="text"
              value={versionInput}
              onChange={(e) => setVersionInput(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-linnk-stone-50 border border-linnk-stone-300 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-linnk-obsidian mb-1">
              Base da Divisão 50/50
            </label>
            <select
              value={splitBase}
              onChange={(e) => setSplitBase(e.target.value as CommissionSplitBase)}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-linnk-stone-50 border border-linnk-stone-300"
            >
              <option value="LIQUIDA">
                Comissão Líquida (Após dedução de impostos NF)
              </option>
              <option value="BRUTA">Comissão Bruta Integral (Sem deduções)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-linnk-obsidian mb-1">
              Alíquota / Dedução Tributária Padrão (%)
            </label>
            <input
              type="number"
              step="0.5"
              value={taxRate}
              onChange={(e) => setTaxRate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-linnk-stone-50 border border-linnk-stone-300 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-linnk-obsidian mb-1">
              Regra de Prioridade em Duplicidade
            </label>
            <select
              value={priorityRule}
              onChange={(e) =>
                setPriorityRule(
                  e.target.value as
                    | 'PRIMEIRA_INDICACAO_VALIDA'
                    | 'TERMO_ASSINADO_PRIMEIRO'
                )
              }
              className="w-full px-3.5 py-2.5 rounded-2xl bg-linnk-stone-50 border border-linnk-stone-300"
            >
              <option value="PRIMEIRA_INDICACAO_VALIDA">
                Primeira Indicação Válida Registrada
              </option>
              <option value="TERMO_ASSINADO_PRIMEIRO">
                Primeiro Termo de Consentimento Conferido
              </option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-linnk-obsidian mb-1">
              Prazo de Proteção do Cliente (Meses)
            </label>
            <input
              type="number"
              value={protectionMonths}
              onChange={(e) => setProtectionMonths(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-linnk-stone-50 border border-linnk-stone-300 font-mono"
            />
          </div>

          <div className="flex items-center pt-5">
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={allowMultiSales}
                onChange={(e) => setAllowMultiSales(e.target.checked)}
                className="accent-linnk-flame"
              />
              <span>
                Permitir mais de 1 venda para a mesma indicação
              </span>
            </label>
          </div>

          <div className="md:col-span-3 flex justify-end pt-3 border-t border-linnk-stone-200">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-2xl bg-linnk-flame hover:bg-linnk-flame-600 text-white font-display font-bold text-xs sm:text-sm shadow-flame-sm"
            >
              Salvar e Publicar Nova Versão da Regra
            </button>
          </div>
        </form>
      </div>

      {/* Seção 2: Gestão de Usuários Internos e Matriz de Permissões do Operador */}
      <div className="bg-white rounded-3xl p-6 border border-linnk-stone-300/80 shadow-arch-card space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display font-bold text-lg text-linnk-obsidian">
              2. Usuários Internos & Matriz de Permissões Granulares do Operador
            </h3>
            <p className="text-xs text-linnk-stone-500">
              Ative ou inative membros da equipe LINNK e defina exatamente o que cada
              Operador pode executar.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {users.map((u) => (
            <div
              key={u.id}
              className={`p-5 rounded-2xl border ${
                u.active
                  ? 'bg-linnk-stone-50/70 border-linnk-stone-200'
                  : 'opacity-60 bg-stone-100 border-stone-300'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded font-mono text-[10px] font-bold ${
                        u.role === 'ADMIN'
                          ? 'bg-linnk-flame text-white'
                          : 'bg-linnk-obsidian text-white'
                      }`}
                    >
                      {formatRoleLabel(u.role)}
                    </span>
                    <span className="font-display font-bold text-base text-linnk-obsidian">
                      {u.name}
                    </span>
                    <span className="text-xs text-linnk-stone-500 font-mono">
                      ({u.email})
                    </span>
                  </div>
                  <p className="text-xs text-linnk-stone-600 mt-1">{u.title}</p>
                </div>

                {u.id !== currentUser.id && (
                  <button
                    onClick={() => toggleUserActive(u.id)}
                    className="px-3 py-1.5 rounded-xl bg-white border border-linnk-stone-300 hover:bg-rose-50 hover:text-rose-600 text-xs font-display font-semibold flex items-center gap-1"
                  >
                    <Power className="w-3.5 h-3.5" />
                    <span>{u.active ? 'Inativar' : 'Reativar'}</span>
                  </button>
                )}
              </div>

              {/* Checkboxes de Permissão Granular para Operador */}
              {u.role === 'OPERATOR' && u.permissions && (
                <div className="mt-4 pt-3 border-t border-linnk-stone-200 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 text-xs">
                  {(
                    [
                      ['canEditBrokers', 'Gerenciar Corretores'],
                      ['canEditDevelopments', 'Editar Empreendimentos'],
                      ['canResolveDuplicates', 'Resolver Duplicidades'],
                      ['canRegisterSales', 'Registrar Vendas'],
                      ['canViewCommissions', 'Consultar Comissões'],
                      ['canRegisterFinance', 'Registrar Recebimentos/Repasses'],
                      ['canViewAuditRestricted', 'Consultar Auditoria'],
                    ] as [keyof OperatorPermissions, string][]
                  ).map(([permKey, label]) => (
                    <label
                      key={permKey}
                      className="flex items-center gap-2 p-2 rounded-xl bg-white border border-linnk-stone-200 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={u.permissions![permKey]}
                        onChange={() =>
                          togglePermission(u.id, u.permissions!, permKey)
                        }
                        className="accent-linnk-flame"
                      />
                      <span className="text-linnk-obsidian font-medium">{label}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Formulário de Novo Usuário Interno */}
        <form
          onSubmit={handleCreateUser}
          className="pt-5 border-t border-linnk-stone-200 grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs"
        >
          <input
            type="text"
            required
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nome do novo membro..."
            className="px-3.5 py-2.5 rounded-xl bg-linnk-stone-50 border border-linnk-stone-300"
          />
          <input
            type="email"
            required
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="email@linnk.com.br"
            className="px-3.5 py-2.5 rounded-xl bg-linnk-stone-50 border border-linnk-stone-300"
          />
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Cargo / Função"
            className="px-3.5 py-2.5 rounded-xl bg-linnk-stone-50 border border-linnk-stone-300"
          />
          <select
            value={newRole}
            onChange={(e) => setNewRole(e.target.value as 'ADMIN' | 'OPERATOR')}
            className="px-3.5 py-2.5 rounded-xl bg-linnk-stone-50 border border-linnk-stone-300 font-medium"
          >
            <option value="OPERATOR">Operador</option>
            <option value="ADMIN">Administrador</option>
          </select>
          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl bg-linnk-obsidian hover:bg-linnk-obsidian-800 text-white font-display font-bold flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4 text-linnk-flame" />
            <span>Adicionar Usuário</span>
          </button>
        </form>
      </div>
    </div>
  );
};
