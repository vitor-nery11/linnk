import React, { useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  Bell,
  Building,
  Building2,
  CheckCircle2,
  FileCheck2,
  GitCompareArrows,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquareMore,
  Receipt,
  ShieldAlert,
  Sliders,
  User as UserIcon,
  UserCheck,
  X,
} from 'lucide-react';
import { useApp } from '../app/AppContext';
import { NavSection } from '../app/types';
import { formatCentsToBRL, formatRoleLabel } from '../lib/formatters';
import { BrandLogo } from './BrandLogo';

interface NavItemConfig {
  id: NavSection;
  label: string;
  group: 'OPERACAO' | 'CADASTROS' | 'FINANCEIRO' | 'GOVERNANCA';
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  badgeColor?: 'flame' | 'rose' | 'amber';
  adminOnly?: boolean;
  requiresAuditAccess?: boolean;
}

export const SidebarLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    currentUser,
    activeNav,
    setActiveNav,
    setSelectedReferralId,
    logout,
    brokers,
    clients,
    sales,
    referrals,
    documents,
    transactions,
  } = useApp();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);

  if (!currentUser) return <>{children}</>;

  const isAdmin = currentUser.role === 'ADMIN';
  const isBroker = currentUser.role === 'BROKER';
  const canSeeAudit =
    isAdmin || (!isBroker && Boolean(currentUser.permissions?.canViewAuditRestricted));

  const currentBroker = isBroker
    ? brokers.find((b) => b.id === currentUser.brokerId) || brokers[0]
    : null;

  const pendingDuplicatesCount = referrals.filter(
    (r) => r.status === 'EM_ANALISE_DUPLICIDADE'
  ).length;
  const pendingDocsCount = documents.filter((d) => {
    if (isBroker) {
      const ref = referrals.find((r) => r.id === d.referralId);
      if (ref?.brokerId !== currentUser.brokerId) return false;
    }
    return (
      d.status === 'RECEBIDO_AGUARDANDO_CONFERENCIA' ||
      d.status === 'GERADO_AGUARDANDO_ASSINATURA' ||
      d.status === 'PENDENTE_GERACAO'
    );
  }).length;

  const activeAttendancesCount = referrals.filter(
    (r) =>
      (!isBroker || r.brokerId === currentUser.brokerId) &&
      (r.status === 'LIBERADA_ATENDIMENTO' ||
        r.status === 'EM_ATENDIMENTO' ||
        r.status === 'PROPOSTA_ENVIADA')
  ).length;
  const pendingFinanceCount = transactions.filter((t) => t.status === 'PENDENTE').length;

  const brokerReferralsCount = isBroker
    ? referrals.filter((r) => r.brokerId === currentUser.brokerId).length
    : referrals.length;

  // Monta a lista de Alertas e Pendências do Sistema para o Sino de Notificações
  const systemAlerts: {
    id: string;
    category: string;
    title: string;
    subtitle: string;
    tone: 'flame' | 'rose' | 'amber';
    targetNav: NavSection;
    referralId?: string;
  }[] = [];

  if (currentBroker && !currentBroker.adhesionTermSigned) {
    systemAlerts.push({
      id: 'alert-adhesion',
      category: 'Contrato',
      title: 'Termo de Adesão Pendente',
      subtitle: 'Assine seu Termo de Adesão na seção Meu Perfil.',
      tone: 'amber',
      targetNav: 'profile',
    });
  }

  if (currentBroker && !currentBroker.ndaTermSigned) {
    systemAlerts.push({
      id: 'alert-nda',
      category: 'Contrato',
      title: 'Termo de Sigilo & Lealdade Pendente',
      subtitle: 'Regularize seu compromisso de confidencialidade.',
      tone: 'amber',
      targetNav: 'profile',
    });
  }

  referrals
    .filter((r) => (!isBroker || r.brokerId === currentUser.brokerId))
    .forEach((ref) => {
      const cli = clients.find((c) => c.id === ref.clientId);
      if (ref.status === 'EM_ANALISE_DUPLICIDADE') {
        systemAlerts.push({
          id: `alert-dup-${ref.id}`,
          category: 'Duplicidade',
          title: `${ref.code} · Análise de Duplicidade`,
          subtitle: `Cliente: ${cli?.name || '—'}`,
          tone: 'rose',
          targetNav: isBroker ? 'referrals' : 'duplicates',
          referralId: ref.id,
        });
      } else if (ref.documentStatus !== 'APROVADO' && ref.status !== 'CONFLITO_REJEITADO') {
        systemAlerts.push({
          id: `alert-doc-${ref.id}`,
          category: 'Termo LGPD',
          title: `${ref.code} · Termo de Consentimento Pendente`,
          subtitle: `Cliente: ${cli?.name || '—'}`,
          tone: 'flame',
          targetNav: 'documents',
          referralId: ref.id,
        });
      }
    });

  transactions
    .filter((t) => {
      if (t.status !== 'PENDENTE') return false;
      if (isBroker) {
        if (t.type !== 'REPASSE_CORRETOR') return false;
        const sale = sales.find((s) => s.id === t.saleId);
        const ref = referrals.find((r) => r.id === sale?.referralId);
        return ref?.brokerId === currentUser.brokerId;
      }
      return true;
    })
    .forEach((tx) => {
      systemAlerts.push({
        id: `alert-tx-${tx.id}`,
        category: 'Financeiro',
        title: `${tx.installmentLabel}`,
        subtitle: `Valor: ${formatCentsToBRL(tx.amountCents)} · Venc.: ${tx.dueDate}`,
        tone: 'amber',
        targetNav: 'sales',
      });
    });

  const navItems: NavItemConfig[] = [
    {
      id: 'dashboard',
      label: isBroker ? 'Meu Painel' : 'Dashboard Operacional',
      group: 'OPERACAO',
      icon: LayoutDashboard,
    },
    {
      id: 'referrals',
      label: isBroker ? 'Minhas Indicações' : 'Indicações',
      group: 'OPERACAO',
      icon: GitCompareArrows,
      badge: brokerReferralsCount,
    },
    {
      id: 'duplicates',
      label: 'Análise de Duplicidade',
      group: 'OPERACAO',
      icon: AlertTriangle,
      badge: pendingDuplicatesCount > 0 ? pendingDuplicatesCount : undefined,
      badgeColor: 'rose',
    },
    {
      id: 'documents',
      label: isBroker ? 'Termos de Consentimento' : 'Documentos & Termos',
      group: 'OPERACAO',
      icon: FileCheck2,
      badge: pendingDocsCount > 0 ? pendingDocsCount : undefined,
      badgeColor: 'flame',
    },
    {
      id: 'attendances',
      label: 'Atendimento',
      group: 'OPERACAO',
      icon: MessageSquareMore,
      badge: activeAttendancesCount > 0 ? activeAttendancesCount : undefined,
    },
    {
      id: 'brokers',
      label: 'Corretores Parceiros',
      group: 'CADASTROS',
      icon: UserCheck,
    },
    {
      id: 'developments',
      label: 'Empreendimentos',
      group: 'CADASTROS',
      icon: Building2,
    },
    {
      id: 'developers',
      label: 'Incorporadoras',
      group: 'CADASTROS',
      icon: Building,
    },
    {
      id: 'sales',
      label: 'Financeiro',
      group: 'FINANCEIRO',
      icon: Receipt,
      badge: !isBroker && pendingFinanceCount > 0 ? pendingFinanceCount : undefined,
      badgeColor: 'amber',
    },
    {
      id: 'reports',
      label: 'Relatórios & Conversão',
      group: 'FINANCEIRO',
      icon: BarChart3,
    },
    {
      id: 'users',
      label: 'Usuários & Regras',
      group: 'GOVERNANCA',
      icon: Sliders,
      adminOnly: true,
    },
    {
      id: 'audit',
      label: 'Trilha de Auditoria',
      group: 'GOVERNANCA',
      icon: ShieldAlert,
      requiresAuditAccess: true,
    },
    {
      id: 'profile',
      label: 'Meu Perfil',
      group: 'GOVERNANCA',
      icon: UserIcon,
    },
  ];

  // Filtra estritamente apenas os módulos autorizados
  const visibleItems = navItems.filter((item) => {
    if (isBroker) {
      return [
        'dashboard',
        'referrals',
        'documents',
        'attendances',
        'developments',
        'sales',
        'profile',
      ].includes(item.id);
    }
    if (item.adminOnly && !isAdmin) return false;
    if (item.requiresAuditAccess && !canSeeAudit) return false;
    return true;
  });

  const groups: { key: NavItemConfig['group']; title: string }[] = [
    { key: 'OPERACAO', title: 'Fluxo Central de Indicações' },
    { key: 'CADASTROS', title: 'Parceiros & Curadoria' },
    { key: 'FINANCEIRO', title: 'Fechamento & Financeiro' },
    { key: 'GOVERNANCA', title: isBroker ? 'Conta & Perfil' : 'Governança & Segurança' },
  ];

  const handleSelectNav = (id: NavSection) => {
    setActiveNav(id);
    setMobileOpen(false);
  };

  return (
    <div className="h-screen overflow-hidden flex bg-[#161316] text-linnk-obsidian">
      {/* Overlay Mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Corporativa Fixa (#161316) */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-72 h-screen shrink-0 bg-[#161316] text-white flex flex-col transition-transform duration-200 no-print ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Topo da Sidebar conectado à Barra Superior */}
        <div className="h-14 px-6 flex items-center justify-between shrink-0">
          <BrandLogo variant="dark" size="md" showTagline />
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-2 rounded-lg text-linnk-stone-400 hover:text-white hover:bg-white/10"
            aria-label="Fechar menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Links de Navegação */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {groups.map((grp) => {
            const items = visibleItems.filter((i) => i.group === grp.key);
            if (items.length === 0) return null;
            return (
              <div key={grp.key}>
                <div className="px-3 mb-2 text-[10px] font-mono uppercase tracking-[0.18em] text-linnk-stone-400">
                  {grp.title}
                </div>
                <div className="space-y-1">
                  {items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeNav === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleSelectNav(item.id)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                          isActive
                            ? 'bg-linnk-flame text-white shadow-flame-sm font-semibold'
                            : 'text-linnk-stone-300 hover:bg-white/[0.07] hover:text-white'
                        }`}
                      >
                        <span className="flex items-center gap-3 truncate">
                          <Icon
                            className={`w-4 h-4 shrink-0 ${
                              isActive ? 'text-white' : 'text-linnk-stone-400'
                            }`}
                          />
                          <span className="truncate">{item.label}</span>
                        </span>

                        {item.badge !== undefined && (
                          <span
                            className={`ml-2 px-2 py-0.5 text-[11px] font-mono font-bold rounded-full ${
                              isActive
                                ? 'bg-black/25 text-white'
                                : item.badgeColor === 'rose'
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                : item.badgeColor === 'flame'
                                ? 'bg-linnk-flame/20 text-linnk-flame-300 border border-linnk-flame/40'
                                : item.badgeColor === 'amber'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                : 'bg-white/10 text-linnk-stone-300'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Card do Usuário Autenticado no Rodapé da Sidebar */}
        <div className="p-4 border-t border-white/10 bg-black/20">
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => handleSelectNav('profile')}
              className="min-w-0 text-left hover:opacity-90 transition-opacity cursor-pointer"
              title="Abrir Meu Perfil"
            >
              <div className="flex items-center gap-1.5">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                    currentUser.role === 'ADMIN'
                      ? 'bg-linnk-flame text-white'
                      : 'bg-white/15 text-linnk-stone-200'
                  }`}
                >
                  {formatRoleLabel(currentUser.role)}
                </span>
                <span className="text-xs font-semibold text-white truncate">
                  {currentUser.name}
                </span>
              </div>
              <p className="text-[11px] text-linnk-stone-400 truncate mt-0.5">
                {currentUser.email}
              </p>
            </button>
            <button
              onClick={logout}
              title="Encerrar sessão / Tela de Login"
              className="p-2 rounded-lg text-linnk-stone-400 hover:text-white hover:bg-white/10 transition-colors shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Coluna Direita: Topo Conectado (#161316) + Área de Conteúdo com Scroll */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden bg-[#161316]">
        {/* Barra Superior integrada ao Menu Lateral (#161316) */}
        <header className="h-14 shrink-0 bg-[#161316] text-white px-4 sm:px-8 flex items-center justify-between no-print relative z-30">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-2 rounded-xl border border-white/15 text-white hover:bg-white/10"
            aria-label="Abrir navegação"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="ml-auto flex items-center gap-3">
            {/* Botão Sino de Alertas e Pendências do Sistema */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setAlertsOpen((prev) => !prev)}
                title="Alertas e Pendências do Sistema"
                className={`relative w-9 h-9 rounded-full bg-white/10 border flex items-center justify-center transition-all cursor-pointer ${
                  alertsOpen
                    ? 'border-linnk-flame ring-2 ring-linnk-flame/40'
                    : 'border-white/20 hover:border-linnk-flame/70'
                }`}
              >
                <Bell className="w-4 h-4 text-white/85" />
                {systemAlerts.length > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-linnk-flame text-white font-mono font-bold text-[10px] flex items-center justify-center border border-[#161316] shadow-sm">
                    {systemAlerts.length}
                  </span>
                )}
              </button>

              {alertsOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setAlertsOpen(false)}
                  />
                  <div className="absolute right-0 mt-2.5 w-80 sm:w-96 rounded-2xl bg-white text-linnk-obsidian border border-linnk-stone-300 shadow-obsidian overflow-hidden z-50">
                    <div className="bg-[#161316] text-white px-4 py-3 flex items-center justify-between border-b border-white/10">
                      <div>
                        <div className="font-display font-bold text-xs uppercase tracking-wider text-white">
                          Alertas & Pendências
                        </div>
                        <div className="text-[11px] text-linnk-stone-400">
                          {systemAlerts.length > 0
                            ? `${systemAlerts.length} item(ns) aguardando ação`
                            : 'Nenhuma pendência ativa'}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAlertsOpen(false)}
                        className="p-1 rounded-lg text-linnk-stone-400 hover:text-white hover:bg-white/10"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-linnk-stone-200">
                      {systemAlerts.length === 0 ? (
                        <div className="p-5 text-center text-xs text-linnk-stone-600 space-y-1">
                          <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
                          <div className="font-display font-bold text-linnk-obsidian">
                            Tudo em dia!
                          </div>
                          <p>Você não possui alertas ou pendências no momento.</p>
                        </div>
                      ) : (
                        systemAlerts.map((alert) => (
                          <button
                            key={alert.id}
                            type="button"
                            onClick={() => {
                              if (alert.referralId) {
                                setSelectedReferralId(alert.referralId);
                              }
                              handleSelectNav(alert.targetNav);
                              setAlertsOpen(false);
                            }}
                            className="w-full text-left px-4 py-3 hover:bg-linnk-stone-50 transition-colors flex items-start justify-between gap-3 cursor-pointer"
                          >
                            <div className="min-w-0">
                              <span
                                className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                                  alert.tone === 'rose'
                                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                    : alert.tone === 'flame'
                                    ? 'bg-linnk-flame-50 text-linnk-flame border border-linnk-flame-200'
                                    : 'bg-amber-50 text-amber-800 border border-amber-200'
                                }`}
                              >
                                {alert.category}
                              </span>
                              <div className="font-display font-bold text-xs text-linnk-obsidian mt-1 truncate">
                                {alert.title}
                              </div>
                              <div className="text-[11px] text-linnk-stone-500 truncate">
                                {alert.subtitle}
                              </div>
                            </div>
                            <span className="text-[11px] font-display font-bold text-linnk-flame shrink-0 mt-1">
                              Ver →
                            </span>
                          </button>
                        ))
                      )}
                    </div>

                    <div className="bg-linnk-stone-50 px-4 py-2.5 border-t border-linnk-stone-200 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          handleSelectNav('profile');
                          setAlertsOpen(false);
                        }}
                        className="text-xs font-display font-bold text-linnk-flame hover:underline cursor-pointer"
                      >
                        Ver todas as pendências em Meu Perfil →
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Botão Foto / Ícone de Usuário */}
            <button
              type="button"
              onClick={() => {
                setAlertsOpen(false);
                handleSelectNav('profile');
              }}
              title={`${currentUser.name} · Abrir Meu Perfil`}
              className={`w-9 h-9 rounded-full bg-white/10 border flex items-center justify-center overflow-hidden transition-all cursor-pointer ${
                activeNav === 'profile'
                  ? 'border-linnk-flame ring-2 ring-linnk-flame/40'
                  : 'border-white/20 hover:border-linnk-flame/70'
              }`}
            >
              {currentUser.avatarUrl ? (
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <UserIcon className="w-4 h-4 text-white/85" />
              )}
            </button>
          </div>
        </header>

        {/* Conteúdo da Tela Ativa com Scroll Independente */}
        <div className="flex-1 overflow-y-auto bg-[#F6F5F2] lg:rounded-tl-3xl">
          <main className="p-4 sm:p-8 max-w-[1600px] w-full mx-auto">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};
