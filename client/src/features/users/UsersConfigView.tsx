import React, { useState } from 'react';
import {
  CheckCircle2,
  Edit3,
  Lock,
  Plus,
  Power,
  Save,
  ShieldCheck,
  Sliders,
  Users,
  X,
} from 'lucide-react';
import { useApp } from '../../app/AppContext';
import {
  CommissionSplitBase,
  OperatorPermissions,
  User,
  UserRole,
} from '../../app/types';
import { formatDateTimeBR, formatRoleLabel } from '../../lib/formatters';

const DEFAULT_OPERATOR_PERMISSIONS: OperatorPermissions = {
  canEditBrokers: true,
  canEditDevelopments: false,
  canResolveDuplicates: true,
  canRegisterSales: true,
  canViewCommissions: true,
  canRegisterFinance: false,
  canViewAuditRestricted: false,
};

const PERMISSION_LABELS: [keyof OperatorPermissions, string][] = [
  ['canEditBrokers', 'Gerenciar Corretores'],
  ['canEditDevelopments', 'Editar Empreendimentos'],
  ['canResolveDuplicates', 'Resolver Duplicidades'],
  ['canRegisterSales', 'Registrar Vendas'],
  ['canViewCommissions', 'Consultar Comissões'],
  ['canRegisterFinance', 'Registrar Recebimentos/Repasses'],
  ['canViewAuditRestricted', 'Consultar Auditoria'],
];

export const UsersConfigView: React.FC = () => {
  const {
    currentUser,
    users,
    brokers,
    commissionConfig,
    updateCommissionConfig,
    updateOperatorPermissions,
    toggleUserActive,
    createUser,
    updateUser,
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
  const [newRole, setNewRole] = useState<UserRole>('OPERATOR');
  const [newTitle, setNewTitle] = useState('');

  // Estado do Modal de Edição de Usuário
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('OPERATOR');
  const [editBrokerId, setEditBrokerId] = useState<string>('');
  const [editPermissions, setEditPermissions] = useState<OperatorPermissions>(
    DEFAULT_OPERATOR_PERMISSIONS
  );
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

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

  const showFeedback = (msg: string) => {
    setFeedbackMessage(msg);
    setTimeout(() => {
      setFeedbackMessage((prev) => (prev === msg ? null : prev));
    }, 3500);
  };

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
    showFeedback('Nova versão da regra de comissão salva e publicada com sucesso.');
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) return;
    createUser({
      name: newName.trim(),
      email: newEmail.trim(),
      role: newRole,
      title: newTitle.trim(),
      brokerId: newRole === 'BROKER' ? brokers[0]?.id : undefined,
    });
    showFeedback(`Usuário "${newName.trim()}" adicionado com sucesso.`);
    setNewName('');
    setNewEmail('');
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditTitle(user.title);
    setEditRole(user.role);
    setEditBrokerId(user.brokerId || brokers[0]?.id || '');
    setEditPermissions(
      user.permissions ? { ...user.permissions } : { ...DEFAULT_OPERATOR_PERMISSIONS }
    );
  };

  const handleSaveEditUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser || !editName.trim() || !editEmail.trim()) return;

    updateUser(editingUser.id, {
      name: editName.trim(),
      email: editEmail.trim(),
      role: editRole,
      title: editTitle.trim(),
      brokerId: editRole === 'BROKER' ? editBrokerId || undefined : undefined,
      permissions: editRole === 'OPERATOR' ? editPermissions : undefined,
    });

    showFeedback(`Dados do usuário "${editName.trim()}" atualizados com sucesso.`);
    setEditingUser(null);
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

  const toggleEditModalPermission = (key: keyof OperatorPermissions) => {
    setEditPermissions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <div className="space-y-8">
      {/* Cabeçalho */}
      <div className="bg-white rounded-3xl p-6 border border-linnk-stone-300/80 shadow-arch-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
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

        {feedbackMessage && (
          <div className="px-4 py-2.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-display font-semibold flex items-center gap-2 shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{feedbackMessage}</span>
          </div>
        )}
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
              Edite informações cadastrais, altere cargos ou perfis de acesso, ative/inative
              membros da equipe LINNK e defina o que cada Operador pode executar.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {users.length === 0 ? (
            <p className="text-xs text-linnk-stone-500 py-6 text-center">
              Nenhum usuário cadastrado.
            </p>
          ) : (
            users.map((u) => {
            const linkedBroker = u.brokerId
              ? brokers.find((b) => b.id === u.brokerId)
              : null;

            return (
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
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded font-mono text-[10px] font-bold ${
                          u.role === 'ADMIN'
                            ? 'bg-linnk-flame text-white'
                            : u.role === 'BROKER'
                            ? 'bg-amber-700 text-white'
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
                      {u.id === currentUser.id && (
                        <span className="px-2 py-0.5 rounded-full bg-linnk-stone-200 text-linnk-obsidian text-[10px] font-mono font-semibold">
                          Você
                        </span>
                      )}
                      {!u.active && (
                        <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-mono font-semibold">
                          Inativo
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-linnk-stone-600 mt-1">
                      {u.title}
                      {linkedBroker && (
                        <span className="text-linnk-stone-500">
                          {' '}
                          · Vinculado ao corretor: <strong>{linkedBroker.name}</strong> ({linkedBroker.creci})
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openEditModal(u)}
                      className="px-3 py-1.5 rounded-xl bg-white border border-linnk-stone-300 hover:bg-linnk-stone-100 text-linnk-obsidian text-xs font-display font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-linnk-flame" />
                      <span>Editar</span>
                    </button>

                    {u.id !== currentUser.id && (
                      <button
                        type="button"
                        onClick={() => toggleUserActive(u.id)}
                        className="px-3 py-1.5 rounded-xl bg-white border border-linnk-stone-300 hover:bg-rose-50 hover:text-rose-600 text-xs font-display font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Power className="w-3.5 h-3.5" />
                        <span>{u.active ? 'Inativar' : 'Reativar'}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Checkboxes de Permissão Granular para Operador */}
                {u.role === 'OPERATOR' && u.permissions && (
                  <div className="mt-4 pt-3 border-t border-linnk-stone-200 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 text-xs">
                    {PERMISSION_LABELS.map(([permKey, label]) => (
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
            );
          })
        )}
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
            onChange={(e) => setNewRole(e.target.value as UserRole)}
            className="px-3.5 py-2.5 rounded-xl bg-linnk-stone-50 border border-linnk-stone-300 font-medium"
          >
            <option value="OPERATOR">Operador</option>
            <option value="ADMIN">Administrador</option>
            <option value="BROKER">Corretor</option>
          </select>
          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl bg-linnk-obsidian hover:bg-linnk-obsidian-800 text-white font-display font-bold flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-linnk-flame" />
            <span>Adicionar Usuário</span>
          </button>
        </form>
      </div>

      {/* Modal de Edição de Usuário */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto border border-linnk-stone-300 shadow-obsidian">
            <div className="bg-linnk-obsidian text-white px-6 py-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-linnk-flame block">
                  Gestão de Conta & Acesso
                </span>
                <h3 className="font-display font-bold text-lg">
                  Editar Usuário · {editingUser.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditUser} className="p-6 space-y-4 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-linnk-obsidian mb-1">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Nome completo do usuário"
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-linnk-stone-50 border border-linnk-stone-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-linnk-obsidian mb-1">
                    E-mail de Acesso *
                  </label>
                  <input
                    type="email"
                    required
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    placeholder="email@linnk.com.br"
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-linnk-stone-50 border border-linnk-stone-300 font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-linnk-obsidian mb-1">
                    Perfil / Papel no Sistema *
                  </label>
                  <select
                    value={editRole}
                    disabled={editingUser.id === currentUser.id}
                    onChange={(e) => setEditRole(e.target.value as UserRole)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-linnk-stone-50 border border-linnk-stone-300 font-medium disabled:opacity-60"
                  >
                    <option value="OPERATOR">Operador</option>
                    <option value="ADMIN">Administrador</option>
                    <option value="BROKER">Corretor</option>
                  </select>
                  {editingUser.id === currentUser.id && (
                    <span className="block text-[11px] text-linnk-stone-500 mt-1">
                      Seu próprio papel de Administrador permanece fixo para evitar perda de acesso.
                    </span>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-linnk-obsidian mb-1">
                    Cargo / Função Exibida
                  </label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="Ex: Especialista Closer & Operações"
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-linnk-stone-50 border border-linnk-stone-300"
                  />
                </div>

                {editRole === 'BROKER' && (
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-linnk-obsidian mb-1">
                      Corretor Parceiro Vinculado
                    </label>
                    <select
                      value={editBrokerId}
                      onChange={(e) => setEditBrokerId(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-linnk-stone-50 border border-linnk-stone-300"
                    >
                      <option value="">Sem vínculo específico</option>
                      {brokers.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name} ({b.creci} · {b.city})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {editRole === 'OPERATOR' && (
                <div className="pt-3 border-t border-linnk-stone-200">
                  <label className="block text-xs font-semibold text-linnk-obsidian mb-2">
                    Matriz de Permissões Granulares do Operador
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {PERMISSION_LABELS.map(([permKey, label]) => (
                      <label
                        key={permKey}
                        className="flex items-center gap-2 p-2.5 rounded-xl bg-linnk-stone-50 border border-linnk-stone-200 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={editPermissions[permKey]}
                          onChange={() => toggleEditModalPermission(permKey)}
                          className="accent-linnk-flame"
                        />
                        <span className="text-linnk-obsidian font-medium">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t border-linnk-stone-200">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2.5 rounded-xl bg-linnk-stone-100 hover:bg-linnk-stone-200 text-linnk-obsidian text-xs font-display font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-linnk-flame hover:bg-linnk-flame-600 text-white text-xs font-display font-bold flex items-center gap-1.5 shadow-flame-sm cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Salvar Alterações</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
