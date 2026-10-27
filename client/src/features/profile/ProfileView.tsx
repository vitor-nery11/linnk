import React, { useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  Award,
  Camera,
  CheckCircle2,
  Clock,
  FileCheck2,
  KeyRound,
  Mail,
  MapPin,
  MessageSquareMore,
  Phone,
  Receipt,
  Save,
  ShieldCheck,
  Trash2,
  User as UserIcon,
  UserCheck,
} from 'lucide-react';
import { useApp } from '../../app/AppContext';
import { Modality } from '../../app/types';
import {
  formatCentsToBRL,
  formatDateBR,
  formatDateTimeBR,
  formatRoleLabel,
} from '../../lib/formatters';
import {
  DocumentStatusBadge,
  ModalityBadge,
  ReferralStatusBadge,
} from '../../components/StatusBadges';

export const ProfileView: React.FC = () => {
  const {
    currentUser,
    brokers,
    referrals,
    documents,
    clients,
    developments,
    sales,
    transactions,
    saveBroker,
    updateCurrentUserProfile,
    setActiveNav,
    setSelectedReferralId,
  } = useApp();

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const isBroker = currentUser?.role === 'BROKER';
  const isAdmin = currentUser?.role === 'ADMIN';

  const currentBroker = useMemo(() => {
    if (!currentUser) return null;
    if (currentUser.brokerId) {
      return brokers.find((b) => b.id === currentUser.brokerId) || null;
    }
    if (isBroker) {
      return brokers[0] || null;
    }
    return null;
  }, [brokers, currentUser, isBroker]);

  // Estados do formulário de edição de perfil
  const [nameInput, setNameInput] = useState(
    currentBroker?.name || currentUser?.name || ''
  );
  const [emailInput, setEmailInput] = useState(
    currentBroker?.email || currentUser?.email || ''
  );
  const [titleInput, setTitleInput] = useState(currentUser?.title || '');
  const [phoneInput, setPhoneInput] = useState(currentBroker?.phone || '');
  const [creciInput, setCreciInput] = useState(currentBroker?.creci || '');
  const [cityInput, setCityInput] = useState(currentBroker?.city || '');
  const [stateInput, setStateInput] = useState(currentBroker?.state || 'BA');
  const [pixInput, setPixInput] = useState(
    currentBroker?.pixKey || currentUser?.email || ''
  );
  const [modalityInput, setModalityInput] = useState<Modality>(
    currentBroker?.defaultModality || 'INDICA'
  );
  const [savedToast, setSavedToast] = useState(false);

  // Carteira e Pendências vinculadas ao usuário
  const myReferrals = useMemo(() => {
    if (isBroker && currentBroker) {
      return referrals.filter((r) => r.brokerId === currentBroker.id);
    }
    return referrals;
  }, [referrals, isBroker, currentBroker]);

  const pendingConsentRefs = useMemo(
    () =>
      myReferrals.filter(
        (r) => r.documentStatus !== 'APROVADO' && r.status !== 'CONFLITO_REJEITADO'
      ),
    [myReferrals]
  );

  const duplicateAnalysisRefs = useMemo(
    () => myReferrals.filter((r) => r.status === 'EM_ANALISE_DUPLICIDADE'),
    [myReferrals]
  );

  const activeConectaRefs = useMemo(
    () =>
      myReferrals.filter(
        (r) =>
          r.modality === 'CONECTA' &&
          (r.status === 'LIBERADA_ATENDIMENTO' ||
            r.status === 'EM_ATENDIMENTO' ||
            r.status === 'PROPOSTA_ENVIADA')
      ),
    [myReferrals]
  );

  const mySales = useMemo(() => {
    if (isBroker) {
      return sales.filter((s) => myReferrals.some((r) => r.id === s.referralId));
    }
    return sales;
  }, [sales, myReferrals, isBroker]);

  const pendingTransactions = useMemo(
    () =>
      transactions.filter(
        (t) =>
          t.status === 'PENDENTE' &&
          mySales.some((s) => s.id === t.saleId) &&
          (!isBroker || t.type === 'REPASSE_CORRETOR')
      ),
    [transactions, mySales, isBroker]
  );

  const contractualPendenciesCount = useMemo(() => {
    if (!currentBroker) return 0;
    let count = 0;
    if (!currentBroker.adhesionTermSigned) count += 1;
    if (!currentBroker.ndaTermSigned) count += 1;
    if (!currentBroker.pixKey?.trim()) count += 1;
    return count;
  }, [currentBroker]);

  const totalPendenciesCount =
    pendingConsentRefs.length +
    duplicateAnalysisRefs.length +
    pendingTransactions.length +
    contractualPendenciesCount;

  if (!currentUser) return null;

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        updateCurrentUserProfile({ avatarUrl: reader.result });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    updateCurrentUserProfile({ avatarUrl: '' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateCurrentUserProfile({
      name: nameInput.trim() || currentUser.name,
      email: emailInput.trim() || currentUser.email,
      title: titleInput.trim() || currentUser.title,
    });

    if (currentBroker) {
      saveBroker(
        {
          name: nameInput.trim() || currentBroker.name,
          email: emailInput.trim() || currentBroker.email,
          phone: phoneInput.trim() || currentBroker.phone,
          creci: creciInput.trim() || currentBroker.creci,
          city: cityInput.trim() || currentBroker.city,
          state: stateInput.trim() || currentBroker.state,
          defaultModality: modalityInput,
          isFoundingMember: currentBroker.isFoundingMember,
          adhesionTermSigned: currentBroker.adhesionTermSigned,
          ndaTermSigned: currentBroker.ndaTermSigned,
          pixKey: pixInput.trim() || currentBroker.pixKey,
          active: currentBroker.active,
        },
        currentBroker.id
      );
    }

    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 3500);
  };

  const handleSignBrokerTerm = (termType: 'ADHESION' | 'NDA') => {
    if (!currentBroker) return;
    saveBroker(
      {
        name: currentBroker.name,
        email: currentBroker.email,
        phone: currentBroker.phone,
        creci: currentBroker.creci,
        city: currentBroker.city,
        state: currentBroker.state,
        defaultModality: currentBroker.defaultModality,
        isFoundingMember: currentBroker.isFoundingMember,
        adhesionTermSigned:
          termType === 'ADHESION' ? true : currentBroker.adhesionTermSigned,
        ndaTermSigned: termType === 'NDA' ? true : currentBroker.ndaTermSigned,
        pixKey: currentBroker.pixKey,
        active: currentBroker.active,
      },
      currentBroker.id
    );
  };

  return (
    <div className="space-y-6">
      {/* 1. Card Principal de Identificação do Perfil, Foto & Situação Contratual */}
      <div className="bg-white rounded-3xl border border-linnk-stone-300/80 shadow-arch-card overflow-hidden">
        <div className="p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            {/* Avatar / Foto de Perfil com Upload */}
            <div className="relative group shrink-0">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#161316] border-2 border-linnk-stone-300 flex items-center justify-center overflow-hidden shadow-md">
                {currentUser.avatarUrl ? (
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <UserIcon className="w-9 h-9 text-white/80" />
                )}
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Alterar foto de perfil"
                className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-linnk-flame hover:bg-linnk-flame-600 text-white flex items-center justify-center shadow-md transition-colors cursor-pointer"
              >
                <Camera className="w-4 h-4" />
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </div>

            {/* Dados Principais do Perfil */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#161316] text-white font-mono text-[11px] font-semibold uppercase tracking-wider">
                  <UserCheck className="w-3.5 h-3.5 text-linnk-flame" />
                  {isBroker
                    ? 'Perfil do Corretor Parceiro'
                    : `Perfil ${formatRoleLabel(currentUser.role)}`}
                </span>

                {currentBroker && (
                  <span className="px-2.5 py-1 rounded-md bg-linnk-stone-100 text-linnk-obsidian font-mono text-[11px] font-semibold border border-linnk-stone-200">
                    {currentBroker.creci}
                  </span>
                )}

                {currentBroker?.isFoundingMember && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-linnk-flame-50 text-linnk-flame border border-linnk-flame-200 font-mono text-[11px] font-semibold">
                    <Award className="w-3.5 h-3.5" />
                    Turma Fundadora
                  </span>
                )}
              </div>

              <h2 className="font-display font-bold text-2xl text-linnk-obsidian tracking-tight">
                {currentBroker?.name || currentUser.name}
              </h2>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-linnk-stone-600">
                {currentBroker ? (
                  <>
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-linnk-flame" />
                      Praça de origem:{' '}
                      <strong className="text-linnk-obsidian">
                        {currentBroker.city}/{currentBroker.state}
                      </strong>
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-linnk-stone-400" />
                      <span className="font-mono">{currentBroker.phone}</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-linnk-stone-400" />
                      Chave PIX p/ Repasse:{' '}
                      <strong className="font-mono text-linnk-obsidian">
                        {currentBroker.pixKey}
                      </strong>
                    </span>
                  </>
                ) : (
                  <>
                    <span className="inline-flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-linnk-flame" />
                      <span className="font-mono">{currentUser.email}</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-linnk-stone-400" />
                      Último acesso: {formatDateTimeBR(currentUser.lastLoginAt)}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Botões de Foto e Resumo de Pendências */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-2 rounded-xl bg-linnk-stone-100 hover:bg-linnk-stone-200 border border-linnk-stone-300 text-linnk-obsidian font-display font-semibold text-xs flex items-center gap-1.5 transition-colors"
            >
              <Camera className="w-3.5 h-3.5 text-linnk-flame" />
              <span>{currentUser.avatarUrl ? 'Trocar Foto' : 'Adicionar Foto'}</span>
            </button>

            {currentUser.avatarUrl && (
              <button
                type="button"
                onClick={handleRemovePhoto}
                className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-display font-semibold text-xs flex items-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remover</span>
              </button>
            )}
          </div>
        </div>

        {/* Barra Inferior: Situação Contratual e Status Geral de Pendências */}
        <div className="bg-linnk-stone-50 px-6 sm:px-8 py-3.5 border-t border-linnk-stone-200 flex flex-wrap items-center justify-between gap-4 text-xs">
          {currentBroker ? (
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-linnk-stone-500 font-medium">Situação Contratual:</span>

              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium border ${
                  currentBroker.adhesionTermSigned
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Termo de Adesão:{' '}
                <strong>{currentBroker.adhesionTermSigned ? 'Assinado' : 'Pendente'}</strong>
              </span>

              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium border ${
                  currentBroker.ndaTermSigned
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Termo de Sigilo & Lealdade:{' '}
                <strong>{currentBroker.ndaTermSigned ? 'Assinado' : 'Pendente'}</strong>
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-linnk-stone-600">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>
                Credencial corporativa ativa · Cargo: <strong>{currentUser.title}</strong>
              </span>
            </div>
          )}

          <div className="flex items-center gap-2">
            {totalPendenciesCount > 0 ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-mono font-bold text-[11px]">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                {totalPendenciesCount} pendência(s) ativa(s)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono font-bold text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Perfil e documentos em dia
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 2. Grid Principal: Central de Pendências (Esquerda) + Edição de Dados e Governança (Direita) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Coluna Esquerda (5 colunas): Minhas Pendências & Situação Contratual */}
        <div className="lg:col-span-5 space-y-6">
          {/* Card: Central de Pendências do Usuário */}
          <div className="bg-white rounded-3xl p-6 border border-linnk-stone-300/80 shadow-arch-card space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-linnk-flame">
                  Acompanhamento de Perfil
                </span>
                <h3 className="font-display font-bold text-lg text-linnk-obsidian">
                  Minhas Pendências & Alertas
                </h3>
              </div>
              <span
                className={`px-2.5 py-1 rounded-full font-mono text-xs font-bold ${
                  totalPendenciesCount > 0
                    ? 'bg-linnk-flame/15 text-linnk-flame border border-linnk-flame/30'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}
              >
                {totalPendenciesCount}
              </span>
            </div>

            {totalPendenciesCount === 0 ? (
              <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-900 space-y-1">
                <div className="font-display font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Nenhuma pendência encontrada!</span>
                </div>
                <p className="text-emerald-800/90 leading-relaxed">
                  Todos os seus dados cadastrais, termos contratuais e documentos de indicações
                  estão regularizados.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Pendências Contratuais do Corretor */}
                {currentBroker && !currentBroker.adhesionTermSigned && (
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs flex items-center justify-between gap-3">
                    <div>
                      <div className="font-display font-bold text-amber-900">
                        Termo de Adesão Pendente
                      </div>
                      <p className="text-amber-800 mt-0.5">
                        Formalize seu Termo de Adesão de Corretor Parceiro LINNK.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSignBrokerTerm('ADHESION')}
                      className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-display font-bold text-[11px] shrink-0"
                    >
                      Assinar Agora
                    </button>
                  </div>
                )}

                {currentBroker && !currentBroker.ndaTermSigned && (
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs flex items-center justify-between gap-3">
                    <div>
                      <div className="font-display font-bold text-amber-900">
                        Termo de Sigilo & Lealdade Pendente
                      </div>
                      <p className="text-amber-800 mt-0.5">
                        Assine o compromisso de confidencialidade e proteção de carteira.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSignBrokerTerm('NDA')}
                      className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-display font-bold text-[11px] shrink-0"
                    >
                      Assinar Agora
                    </button>
                  </div>
                )}

                {/* Pendências de Termos de Consentimento (LGPD) */}
                {pendingConsentRefs.map((ref) => {
                  const cli = clients.find((c) => c.id === ref.clientId);
                  const dev = developments.find((d) => d.id === ref.developmentId);
                  const doc = documents.find((d) => d.referralId === ref.id);
                  return (
                    <div
                      key={ref.id}
                      className="p-4 rounded-2xl bg-linnk-stone-50 border border-linnk-stone-200 text-xs space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono font-bold text-linnk-flame">
                          {ref.code} · Termo LGPD
                        </span>
                        <DocumentStatusBadge
                          status={doc?.status || ref.documentStatus}
                        />
                      </div>
                      <div>
                        <div className="font-semibold text-linnk-obsidian">
                          Cliente: {cli?.name}
                        </div>
                        <div className="text-linnk-stone-500">
                          Empreendimento: {dev?.name}
                        </div>
                      </div>
                      <div className="pt-1 flex justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedReferralId(ref.id);
                            setActiveNav('documents');
                          }}
                          className="inline-flex items-center gap-1 font-display font-bold text-linnk-flame hover:underline"
                        >
                          <FileCheck2 className="w-3.5 h-3.5" />
                          <span>Resolver em Termos de Consentimento</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* Pendências de Duplicidade */}
                {duplicateAnalysisRefs.map((ref) => {
                  const cli = clients.find((c) => c.id === ref.clientId);
                  return (
                    <div
                      key={ref.id}
                      className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200 text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono font-bold text-rose-700">
                          {ref.code} · Duplicidade
                        </span>
                        <ReferralStatusBadge status={ref.status} />
                      </div>
                      <div className="font-semibold text-linnk-obsidian">
                        Cliente: {cli?.name}
                      </div>
                      <div className="pt-1 flex justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedReferralId(ref.id);
                            setActiveNav(isBroker ? 'referrals' : 'duplicates');
                          }}
                          className="inline-flex items-center gap-1 font-display font-bold text-rose-700 hover:underline"
                        >
                          <span>Ver Indicação</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* Pendências Financeiras / Repasses Programados */}
                {pendingTransactions.map((tx) => {
                  const sale = mySales.find((s) => s.id === tx.saleId);
                  return (
                    <div
                      key={tx.id}
                      className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono font-bold text-amber-900">
                          {sale?.code} · Parcela Programada
                        </span>
                        <span className="font-mono font-bold text-linnk-flame">
                          {formatCentsToBRL(tx.amountCents)}
                        </span>
                      </div>
                      <div className="text-linnk-obsidian font-medium">
                        {tx.installmentLabel} (Venc.: {tx.dueDate})
                      </div>
                      <div className="pt-1 flex justify-end">
                        <button
                          type="button"
                          onClick={() => setActiveNav('sales')}
                          className="inline-flex items-center gap-1 font-display font-bold text-amber-900 hover:underline"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                          <span>Acompanhar Repasse</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Atendimentos CONECTA sob condução do Corretor */}
            {isBroker && activeConectaRefs.length > 0 && (
              <div className="pt-3 border-t border-linnk-stone-200 space-y-2">
                <div className="text-[11px] font-mono uppercase tracking-wider text-linnk-stone-500">
                  Atendimentos CONECTA sob sua condução ({activeConectaRefs.length})
                </div>
                {activeConectaRefs.map((ref) => {
                  const cli = clients.find((c) => c.id === ref.clientId);
                  return (
                    <div
                      key={ref.id}
                      className="p-3 rounded-xl bg-linnk-stone-50 border border-linnk-stone-200 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-mono font-bold text-linnk-obsidian">
                          {ref.code}
                        </span>{' '}
                        · {cli?.name}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedReferralId(ref.id);
                          setActiveNav('attendances');
                        }}
                        className="font-display font-bold text-linnk-flame hover:underline flex items-center gap-1"
                      >
                        <MessageSquareMore className="w-3.5 h-3.5" />
                        <span>Atualizar</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Card: Termos de Parceria & Governança da Conta */}
          <div className="bg-[#161316] text-white rounded-3xl p-6 shadow-obsidian border border-neutral-800 space-y-4">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-linnk-flame">
                Governança & Credenciamento
              </span>
              <h3 className="font-display font-bold text-base mt-1">
                Garantias e Vínculo Institucional LINNK
              </h3>
            </div>

            <div className="space-y-3 text-xs text-neutral-300">
              <div className="p-3.5 rounded-2xl bg-white/[0.05] border border-white/10 flex items-start gap-3">
                <ShieldCheck className="w-4 h-4 text-linnk-flame shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-white">
                    Divisão Paritária 50% / 50% Garantida
                  </div>
                  <p className="text-neutral-400 mt-0.5 leading-relaxed">
                    Todas as indicações aprovadas garantem 50% da comissão da parceria ao
                    Corretor Indicador tanto na modalidade INDICA quanto na CONECTA.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/[0.05] border border-white/10 flex items-start gap-3">
                <Clock className="w-4 h-4 text-linnk-flame shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-white">
                    Proteção de Carteira de 6 Meses (180 Dias)
                  </div>
                  <p className="text-neutral-400 mt-0.5 leading-relaxed">
                    O cliente indicado fica protegido em sua carteira por 6 meses em todo o
                    portfólio de empreendimentos curados pela LINNK.
                  </p>
                </div>
              </div>

              {!isBroker && (
                <div className="p-3.5 rounded-2xl bg-white/[0.05] border border-white/10">
                  <div className="font-semibold text-white mb-1">
                    Nível de Permissão ({formatRoleLabel(currentUser.role)})
                  </div>
                  <p className="text-neutral-400 leading-relaxed">
                    {isAdmin
                      ? 'Acesso irrestrito à governança global, configuração de regras 50/50, trilha de auditoria e gestão financeira.'
                      : 'Acesso operacional autorizado para triagem de indicações, conferência de termos LGPD e condução de atendimentos.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Coluna Direita (7 colunas): Formulário Completo de Dados do Perfil & Modalidade */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-linnk-stone-300/80 shadow-arch-card">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-5 border-b border-linnk-stone-200">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-linnk-flame">
                Cadastro Pessoal & Profissional
              </span>
              <h3 className="font-display font-bold text-xl text-linnk-obsidian mt-0.5">
                Meus Dados, Chave PIX & Modalidade Padrão
              </h3>
            </div>

            {savedToast && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-display font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Dados atualizados com sucesso!
              </span>
            )}
          </div>

          <form onSubmit={handleSaveProfile} className="mt-6 space-y-5 text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-linnk-obsidian mb-1.5">
                  Nome Completo / Profissional *
                </label>
                <input
                  type="text"
                  required
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-linnk-stone-50 border border-linnk-stone-300 text-xs focus:border-linnk-flame focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-linnk-obsidian mb-1.5">
                  E-mail Corporativo / Acesso *
                </label>
                <input
                  type="email"
                  required
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-linnk-stone-50 border border-linnk-stone-300 font-mono text-xs focus:border-linnk-flame focus:outline-none"
                />
              </div>

              {currentBroker ? (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-linnk-obsidian mb-1.5">
                      Registro Profissional (CRECI)
                    </label>
                    <input
                      type="text"
                      value={creciInput}
                      onChange={(e) => setCreciInput(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-linnk-stone-50 border border-linnk-stone-300 font-mono text-xs focus:border-linnk-flame focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-linnk-obsidian mb-1.5">
                      Telefone / WhatsApp *
                    </label>
                    <input
                      type="text"
                      required
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-linnk-stone-50 border border-linnk-stone-300 font-mono text-xs focus:border-linnk-flame focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-linnk-obsidian mb-1.5">
                      Cidade / Praça de Origem *
                    </label>
                    <input
                      type="text"
                      required
                      value={cityInput}
                      onChange={(e) => setCityInput(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-linnk-stone-50 border border-linnk-stone-300 text-xs focus:border-linnk-flame focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-linnk-obsidian mb-1.5">
                      UF (Estado)
                    </label>
                    <input
                      type="text"
                      maxLength={2}
                      value={stateInput}
                      onChange={(e) => setStateInput(e.target.value.toUpperCase())}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-linnk-stone-50 border border-linnk-stone-300 font-mono text-xs focus:border-linnk-flame focus:outline-none"
                    />
                  </div>
                </>
              ) : (
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-linnk-obsidian mb-1.5">
                    Cargo / Função na Plataforma
                  </label>
                  <input
                    type="text"
                    value={titleInput}
                    onChange={(e) => setTitleInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-linnk-stone-50 border border-linnk-stone-300 text-xs focus:border-linnk-flame focus:outline-none"
                  />
                </div>
              )}
            </div>

            {currentBroker && (
              <>
                <div className="pt-2 border-t border-linnk-stone-200">
                  <label className="block text-xs font-semibold text-linnk-obsidian mb-1.5">
                    Chave PIX para Recebimento de Repasses (50%) *
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-linnk-flame absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={pixInput}
                      onChange={(e) => setPixInput(e.target.value)}
                      placeholder="CPF, CNPJ, E-mail ou Telefone"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-linnk-stone-50 border border-linnk-stone-300 font-mono text-xs focus:border-linnk-flame focus:outline-none"
                    />
                  </div>
                  <p className="text-[11px] text-linnk-stone-500 mt-1">
                    Utilizada pelo financeiro LINNK para transferência das parcelas de comissão
                    após confirmação de recebimento junto à incorporadora.
                  </p>
                </div>

                <div className="pt-2 border-t border-linnk-stone-200">
                  <label className="block text-xs font-semibold text-linnk-obsidian mb-2">
                    Modalidade de Atuação Padrão nas Indicações
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setModalityInput('INDICA')}
                      className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                        modalityInput === 'INDICA'
                          ? 'bg-linnk-flame-50 border-linnk-flame ring-1 ring-linnk-flame'
                          : 'bg-linnk-stone-50 border-linnk-stone-200 hover:border-linnk-stone-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <ModalityBadge modality="INDICA" />
                        <span className="font-mono text-[11px] font-bold text-linnk-flame">
                          50% Comissão
                        </span>
                      </div>
                      <div className="font-display font-bold text-xs text-linnk-obsidian mt-2">
                        Closer LINNK conduz o cliente
                      </div>
                      <p className="text-[11px] text-linnk-stone-600 mt-1 leading-relaxed">
                        Você indica o cliente e o especialista LINNK realiza todo o atendimento e
                        fechamento.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setModalityInput('CONECTA')}
                      className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                        modalityInput === 'CONECTA'
                          ? 'bg-[#161316] text-white border-[#161316]'
                          : 'bg-linnk-stone-50 border-linnk-stone-200 hover:border-linnk-stone-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <ModalityBadge modality="CONECTA" />
                        <span
                          className={`font-mono text-[11px] font-bold ${
                            modalityInput === 'CONECTA' ? 'text-linnk-flame' : 'text-linnk-obsidian'
                          }`}
                        >
                          50% Comissão
                        </span>
                      </div>
                      <div
                        className={`font-display font-bold text-xs mt-2 ${
                          modalityInput === 'CONECTA' ? 'text-white' : 'text-linnk-obsidian'
                        }`}
                      >
                        Você conduz com suporte LINNK
                      </div>
                      <p
                        className={`text-[11px] mt-1 leading-relaxed ${
                          modalityInput === 'CONECTA' ? 'text-neutral-300' : 'text-linnk-stone-600'
                        }`}
                      >
                        Você atende diretamente o cliente utilizando a curadoria, tabelas e
                        estrutura da LINNK.
                      </p>
                    </button>
                  </div>
                </div>
              </>
            )}

            <div className="pt-4 border-t border-linnk-stone-200 flex items-center justify-between gap-4">
              <span className="text-xs text-linnk-stone-500">
                Suas alterações ficam registradas na trilha de governança da plataforma.
              </span>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-linnk-flame hover:bg-linnk-flame-600 text-white font-display font-bold text-xs sm:text-sm shadow-flame-sm flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Salvar Alterações do Perfil</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
