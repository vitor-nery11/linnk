import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Eye,
  Lock,
  MessageSquareMore,
  Receipt,
  Send,
  SlidersHorizontal,
} from 'lucide-react';
import { useApp } from '../../app/AppContext';
import { AttendanceType, ReferralStatus } from '../../app/types';
import { formatDateTimeBR } from '../../lib/formatters';
import {
  ATTENDANCE_TYPE_LABELS,
  AttendanceTypeBadge,
  DocumentStatusBadge,
  ModalityBadge,
  ReferralStatusBadge,
} from '../../components/StatusBadges';

const TITLE_PRESETS: Record<AttendanceType, string[]> = {
  CONTATO_INICIAL: ['WhatsApp', 'Ligação', 'Tentativa de contato', 'Retorno de mensagem'],
  QUALIFICACAO: ['Perfil aprovado', 'Simulação de crédito', 'Investidor', 'Primeiro imóvel'],
  ENVIO_MATERIAL: ['Book enviado', 'Tabela de preços', 'Vídeo do decorado', 'Plantas'],
  AGENDAMENTO_VISITA: ['Visita ao decorado', 'Visita ao stand', 'Revisita agendada'],
  REUNIAO_PLANTAO: ['Reunião presencial', 'Alinhamento online', 'Reunião no plantão'],
  FILA_DIA_D: ['Cadastro no Dia D', 'Reserva de unidade', 'Pasta aprovada'],
  PROPOSTA_COMERCIAL: ['Proposta apresentada', 'Negociação de fluxo', 'Contraproposta'],
  OBSERVACAO: ['Aguardando retorno', 'Cliente em viagem', 'Anotação geral'],
};

export const AttendancesView: React.FC = () => {
  const {
    currentUser,
    referrals,
    clients,
    brokers,
    developments,
    attendances,
    users,
    selectedReferralId,
    setSelectedReferralId,
    addAttendance,
    setActiveNav,
  } = useApp();

  const isBroker = currentUser?.role === 'BROKER';

  // O corretor visualiza exclusivamente as suas próprias indicações (INDICA e CONECTA)
  const visibleReferrals = useMemo(() => {
    if (!isBroker || !currentUser?.brokerId) return referrals;
    return referrals.filter((r) => r.brokerId === currentUser.brokerId);
  }, [referrals, isBroker, currentUser?.brokerId]);

  const [activeId, setActiveId] = useState<string>(
    selectedReferralId || visibleReferrals[0]?.id || ''
  );
  const [attType, setAttType] = useState<AttendanceType>('REUNIAO_PLANTAO');
  const [attTitle, setAttTitle] = useState('');
  const [attDesc, setAttDesc] = useState('');
  const [nextStatus, setNextStatus] = useState<ReferralStatus | ''>('');

  const currentRef =
    visibleReferrals.find((r) => r.id === activeId) || visibleReferrals[0] || null;
  const currentClient = currentRef
    ? clients.find((c) => c.id === currentRef.clientId)
    : null;
  const currentBroker = currentRef
    ? brokers.find((b) => b.id === currentRef.brokerId)
    : null;
  const currentDev = currentRef
    ? developments.find((d) => d.id === currentRef.developmentId)
    : null;
  const currentTimeline = currentRef
    ? attendances.filter((a) => a.referralId === currentRef.id)
    : [];

  const isReleased = currentRef?.documentStatus === 'APROVADO';

  // Regra do Corretor: só pode alterar status e registrar interações em atendimentos CONECTA;
  // em atendimentos INDICA, o corretor possui acesso exclusivamente de visualização.
  const canEditAttendance =
    !isBroker || (currentRef?.modality === 'CONECTA' && currentRef?.brokerId === currentUser?.brokerId);

  const handleAddInteraction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRef || !isReleased || !canEditAttendance) return;

    const finalTitle =
      attTitle.trim() ||
      ATTENDANCE_TYPE_LABELS[attType]?.defaultTitle ||
      'Atendimento registrado';

    addAttendance(
      currentRef.id,
      attType,
      finalTitle,
      attDesc.trim() ||
        (isBroker
          ? 'Atualização de atendimento registrada pelo corretor na modalidade CONECTA.'
          : 'Registro operacional inserido pela equipe LINNK.'),
      nextStatus ? (nextStatus as ReferralStatus) : undefined
    );

    setAttTitle('');
    setAttDesc('');
    setNextStatus('');
  };

  const handleQuickStatusChange = (targetStatus: ReferralStatus, statusLabel: string) => {
    if (!currentRef || !isReleased || !canEditAttendance || currentRef.status === targetStatus) {
      return;
    }

    addAttendance(
      currentRef.id,
      'OBSERVACAO',
      `Status: ${statusLabel}`,
      isBroker
        ? `Status atualizado pelo corretor (${currentUser?.name}) na modalidade CONECTA.`
        : `Status atualizado por ${currentUser?.name}.`,
      targetStatus
    );
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="bg-white rounded-3xl p-6 border border-linnk-stone-300/80 shadow-arch-card flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-linnk-flame">
            <MessageSquareMore className="w-4 h-4" />
            <span>
              {isBroker ? 'Gestão de Atendimentos da Carteira' : 'Condução Comercial & Closer'}
            </span>
          </div>
          <h2 className="font-display font-bold text-2xl text-linnk-obsidian mt-1">
            Atendimentos e Linha do Tempo da Indicação
          </h2>
          <p className="text-sm text-linnk-stone-600 mt-1">
            {isBroker ? (
              <>
                Nos atendimentos da modalidade <strong>CONECTA</strong>, você conduz o cliente e
                pode atualizar o status e registrar atividades. Nos atendimentos da modalidade{' '}
                <strong>INDICA</strong>, a equipe LINNK conduz a negociação e você visualiza toda
                a evolução em tempo real.
              </>
            ) : (
              <>
                Registre contatos, visitas, plantões, fila de Dia D e propostas. Em{' '}
                <strong>INDICA</strong>, a equipe LINNK conduz o cliente; em{' '}
                <strong>CONECTA</strong>, o corretor conduz com apoio da LINNK.
              </>
            )}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Coluna Esquerda: Seleção da Indicação (4 colunas) */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-linnk-stone-300/80 shadow-arch-card overflow-hidden">
          <div className="p-4 border-b border-linnk-stone-200 bg-linnk-stone-50">
            <h3 className="font-display font-bold text-sm text-linnk-obsidian">
              {isBroker
                ? `Meus Atendimentos (${visibleReferrals.length})`
                : `Selecione a Indicação (${visibleReferrals.length})`}
            </h3>
          </div>
          <div className="divide-y divide-linnk-stone-200 max-h-[680px] overflow-y-auto">
            {visibleReferrals.length === 0 ? (
              <div className="p-8 text-center text-xs text-linnk-stone-500">
                Nenhuma indicação cadastrada para atendimento.
              </div>
            ) : (
              visibleReferrals.map((ref) => {
                const cli = clients.find((c) => c.id === ref.clientId);
                const brk = brokers.find((b) => b.id === ref.brokerId);
                const dev = developments.find((d) => d.id === ref.developmentId);
                const selected = currentRef?.id === ref.id;
                const approved = ref.documentStatus === 'APROVADO';

                return (
                  <button
                    key={ref.id}
                    onClick={() => {
                      setActiveId(ref.id);
                      setSelectedReferralId(ref.id);
                    }}
                    className={`w-full text-left p-4 transition-colors ${
                      selected ? 'bg-linnk-flame-50/80' : 'hover:bg-linnk-stone-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-mono text-xs font-bold text-linnk-flame">
                        {ref.code}
                      </span>
                      {approved ? (
                        <span className="text-[10px] font-mono font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          Liberada
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5" /> Aguardando Termo
                        </span>
                      )}
                    </div>
                    <div className="font-display font-bold text-sm text-linnk-obsidian">
                      {cli?.name}
                    </div>
                    <div className="text-xs text-linnk-stone-500 mt-0.5 truncate">
                      {dev?.name} {!isBroker && `· Corretor: ${brk?.name}`}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-1.5">
                      <div className="flex flex-wrap gap-1.5">
                        <ModalityBadge modality={ref.modality} />
                        <ReferralStatusBadge status={ref.status} />
                      </div>
                      {isBroker && (
                        <span
                          className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded ${
                            ref.modality === 'CONECTA'
                              ? 'bg-linnk-obsidian text-white'
                              : 'bg-linnk-stone-100 text-linnk-stone-600'
                          }`}
                        >
                          {ref.modality === 'CONECTA' ? 'Edição Liberada' : 'Somente Leitura'}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Coluna Direita: Linha do Tempo + Formulário de Registro de Atividade (8 colunas) */}
        {!currentRef ? (
          <div className="lg:col-span-8 bg-white rounded-3xl p-12 border border-linnk-stone-300/80 shadow-arch-card text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-linnk-stone-100 text-linnk-stone-400 mx-auto flex items-center justify-center">
              <MessageSquareMore className="w-6 h-6" />
            </div>
            <h3 className="font-display font-bold text-lg text-linnk-obsidian">
              Nenhum atendimento selecionado
            </h3>
            <p className="text-xs text-linnk-stone-500 max-w-md mx-auto leading-relaxed">
              Selecione uma indicação da lista ou cadastre uma nova indicação para iniciar a linha do tempo comercial.
            </p>
          </div>
        ) : (
          <div className="lg:col-span-8 space-y-6">
            {/* Resumo da Indicação & Regra de Condução */}
            <div className="bg-white rounded-3xl p-6 border border-linnk-stone-300/80 shadow-arch-card">
              <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-linnk-stone-200">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-linnk-flame">
                      {currentRef.code}
                    </span>
                    <ModalityBadge modality={currentRef.modality} />
                    <ReferralStatusBadge status={currentRef.status} />
                    {isBroker && (
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold ${
                          canEditAttendance
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-linnk-stone-100 text-linnk-stone-600 border border-linnk-stone-300'
                        }`}
                      >
                        {canEditAttendance ? (
                          <>
                            <SlidersHorizontal className="w-3 h-3" /> Condução pelo Corretor (Alteração de Status Ativa)
                          </>
                        ) : (
                          <>
                            <Eye className="w-3 h-3" /> Apenas Visualização (Condução LINNK)
                          </>
                        )}
                      </span>
                    )}
                  </div>
                  <h3 className="font-display font-bold text-xl text-linnk-obsidian mt-2">
                    {currentClient?.name}
                  </h3>
                  <p className="text-xs text-linnk-stone-600 mt-0.5">
                    WhatsApp: <strong>{currentClient?.phone}</strong> · E-mail:{' '}
                    <strong>{currentClient?.email}</strong> · Empreendimento:{' '}
                    <strong>{currentDev?.name}</strong>
                  </p>
                </div>

                {!isBroker && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setActiveNav('sales')}
                      disabled={!isReleased}
                      className="px-4 py-2.5 rounded-2xl bg-linnk-obsidian hover:bg-linnk-obsidian-800 text-white font-display font-bold text-xs flex items-center gap-1.5 disabled:opacity-40"
                    >
                      <Receipt className="w-4 h-4 text-linnk-flame" />
                      <span>Registrar Venda desta Indicação</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Explicação da Modalidade */}
              <div className="mt-4 p-4 rounded-2xl bg-linnk-stone-50 border border-linnk-stone-200 flex items-start justify-between gap-4 text-xs">
                <div>
                  <strong className="font-display text-sm text-linnk-obsidian block">
                    Diretriz Operacional da Modalidade ({currentRef.modality}):
                  </strong>
                  {currentRef.modality === 'INDICA' ? (
                    <span className="text-linnk-stone-600">
                      O corretor <strong>{currentBroker?.name}</strong> optou por{' '}
                      <strong>INDICA</strong>. O especialista Closer da LINNK conduz 100% do
                      atendimento com o cliente e mantém o corretor atualizado no sistema.
                    </span>
                  ) : (
                    <span className="text-linnk-stone-600">
                      O corretor <strong>{currentBroker?.name}</strong> optou por{' '}
                      <strong>CONECTA</strong>. O próprio corretor conduz o cliente e atualiza o
                      status do atendimento com suporte de material, plantão e credenciamento da
                      equipe LINNK.
                    </span>
                  )}
                </div>
              </div>

              {/* Bloqueio caso Termo não esteja aprovado */}
              {!isReleased ? (
                <div className="mt-4 p-5 rounded-2xl bg-amber-50 border-2 border-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <Lock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="text-xs text-amber-900">
                      <strong className="font-display font-bold text-sm block">
                        Atendimento Comercial Aguardando Liberação de Termo
                      </strong>
                      O Termo de Consentimento desta indicação está com status{' '}
                      <DocumentStatusBadge status={currentRef.documentStatus} />. É
                      obrigatório aprovar a conferência manual do termo antes de liberar o
                      atendimento.
                    </div>
                  </div>
                  {!isBroker && (
                    <button
                      onClick={() => setActiveNav('documents')}
                      className="px-4 py-2.5 rounded-xl bg-linnk-flame text-white font-display font-bold text-xs shrink-0"
                    >
                      Conferir Termo em Documentos →
                    </button>
                  )}
                </div>
              ) : !canEditAttendance ? (
                /* Modo Somente Visualização para Corretor em atendimentos INDICA */
                <div className="mt-4 p-4 rounded-2xl bg-linnk-stone-100/90 border border-linnk-stone-300 flex items-start gap-3">
                  <Eye className="w-5 h-5 text-linnk-obsidian shrink-0 mt-0.5" />
                  <div className="text-xs text-linnk-stone-700 leading-relaxed">
                    <strong className="font-display font-bold text-sm text-linnk-obsidian block">
                      Modo de Visualização (Modalidade INDICA)
                    </strong>
                    Como esta indicação foi cadastrada na modalidade <strong>INDICA</strong>, a
                    condução e a alteração de status do atendimento são realizadas pela equipe
                    LINNK. Para alterar status diretamente pelo seu perfil de Corretor, selecione
                    um atendimento na modalidade <strong>CONECTA</strong>.
                  </div>
                </div>
              ) : (
                /* Controles de Alteração Rápida de Status + Formulário de Nova Interação */
                <div className="mt-5 pt-5 border-t border-linnk-stone-200 space-y-5">
                  {/* Barra Rápida de Alteração de Status do Atendimento */}
                  <div className="p-4 rounded-2xl bg-linnk-stone-50 border border-linnk-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-[11px] font-mono uppercase tracking-wider text-linnk-flame font-semibold block">
                        Alteração de Status do Atendimento ({currentRef.modality})
                      </span>
                      <p className="text-xs text-linnk-stone-600 mt-0.5">
                        Atualize a etapa atual do atendimento com o cliente:
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {(
                        [
                          ['EM_ATENDIMENTO', 'Em Atendimento'],
                          ['PROPOSTA_ENVIADA', 'Proposta Enviada'],
                          ['VENDA_CONFIRMADA', 'Encerrada com Venda'],
                          ['ENCERRADA_SEM_VENDA', 'Encerrar Sem Venda'],
                        ] as [ReferralStatus, string][]
                      ).map(([st, label]) => {
                        const isCurrent = currentRef.status === st;
                        return (
                          <button
                            key={st}
                            type="button"
                            disabled={isCurrent}
                            onClick={() => handleQuickStatusChange(st, label)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-display font-semibold transition-all flex items-center gap-1.5 ${
                              isCurrent
                                ? 'bg-linnk-obsidian text-white cursor-default'
                                : 'bg-white border border-linnk-stone-300 text-linnk-obsidian hover:border-linnk-flame hover:text-linnk-flame cursor-pointer'
                            }`}
                          >
                            {isCurrent && <CheckCircle2 className="w-3.5 h-3.5 text-linnk-flame" />}
                            <span>{label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Formulário de Nova Interação na Linha do Tempo */}
                  <form onSubmit={handleAddInteraction} className="space-y-4">
                    <h4 className="font-display font-bold text-sm text-linnk-obsidian">
                      + Registrar Nova Atividade e Atualizar Status
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-linnk-obsidian mb-1">
                          Tipo de Interação
                        </label>
                        <select
                          value={attType}
                          onChange={(e) => setAttType(e.target.value as AttendanceType)}
                          className="w-full px-3 py-2 rounded-xl bg-linnk-stone-50 border border-linnk-stone-300 text-xs focus:border-linnk-flame focus:outline-none"
                        >
                          <option value="CONTATO_INICIAL">Contato</option>
                          <option value="QUALIFICACAO">Qualificação</option>
                          <option value="ENVIO_MATERIAL">Material</option>
                          <option value="AGENDAMENTO_VISITA">Visita</option>
                          <option value="REUNIAO_PLANTAO">Reunião</option>
                          <option value="FILA_DIA_D">Dia D</option>
                          <option value="PROPOSTA_COMERCIAL">Proposta</option>
                          <option value="OBSERVACAO">Anotação</option>
                        </select>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-semibold text-linnk-obsidian">
                            Título da Interação
                          </label>
                          <span className="text-[10px] text-linnk-stone-400">Opcional</span>
                        </div>
                        <input
                          type="text"
                          value={attTitle}
                          onChange={(e) => setAttTitle(e.target.value)}
                          placeholder={`Ex.: ${ATTENDANCE_TYPE_LABELS[attType]?.defaultTitle || 'Visita agendada'}`}
                          className="w-full px-3 py-2 rounded-xl bg-linnk-stone-50 border border-linnk-stone-300 text-xs focus:border-linnk-flame focus:outline-none"
                        />
                        {/* Sugestões rápidas de títulos simples */}
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {TITLE_PRESETS[attType]?.map((preset) => (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => setAttTitle(preset)}
                              className={`text-[10px] px-2 py-0.5 rounded-md border transition-all cursor-pointer ${
                                attTitle === preset
                                  ? 'bg-linnk-obsidian text-white border-linnk-obsidian'
                                  : 'bg-white text-linnk-stone-600 border-linnk-stone-200 hover:border-linnk-flame hover:text-linnk-flame'
                              }`}
                            >
                              {preset}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-linnk-obsidian mb-1">
                          Alterar Status (Opcional)
                        </label>
                        <select
                          value={nextStatus}
                          onChange={(e) =>
                            setNextStatus(e.target.value as ReferralStatus | '')
                          }
                          className="w-full px-3 py-2 rounded-xl bg-linnk-stone-50 border border-linnk-stone-300 text-xs focus:border-linnk-flame focus:outline-none"
                        >
                          <option value="">Manter status atual</option>
                          <option value="EM_ATENDIMENTO">Em Atendimento</option>
                          <option value="PROPOSTA_ENVIADA">Proposta Enviada</option>
                          <option value="VENDA_CONFIRMADA">Venda Confirmada</option>
                          <option value="ENCERRADA_SEM_VENDA">Encerrar Sem Venda</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <input
                        type="text"
                        value={attDesc}
                        onChange={(e) => setAttDesc(e.target.value)}
                        placeholder="Descreva os detalhes da reunião, condições apresentadas, feedback do cliente..."
                        className="flex-1 px-3.5 py-2.5 rounded-xl bg-linnk-stone-50 border border-linnk-stone-300 text-xs focus:border-linnk-flame focus:outline-none"
                      />
                      <button
                        type="submit"
                        className="px-5 py-2.5 rounded-xl bg-linnk-flame hover:bg-linnk-flame-600 text-white font-display font-bold text-xs flex items-center justify-center gap-1.5 shrink-0 shadow-flame-sm"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Salvar na Linha do Tempo</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>

            {/* Linha do Tempo Completa da Indicação */}
            <div className="bg-white rounded-3xl p-6 border border-linnk-stone-300/80 shadow-arch-card">
              <h4 className="font-display font-bold text-base text-linnk-obsidian mb-4">
                Linha do Tempo Auditada ({currentTimeline.length} registros)
              </h4>

              {currentTimeline.length === 0 ? (
                <p className="text-xs text-linnk-stone-500">
                  Nenhuma atividade registrada ainda para esta indicação.
                </p>
              ) : (
                <div className="relative pl-6 border-l-2 border-linnk-flame/40 space-y-5">
                  {currentTimeline.map((item) => {
                    const author = users.find((u) => u.id === item.createdByUserId);
                    return (
                      <div key={item.id} className="relative">
                        <span className="w-3 h-3 rounded-full bg-linnk-flame border-2 border-white absolute -left-[31px] top-1.5 shadow-xs" />
                        <div className="p-4 rounded-2xl bg-linnk-stone-50 border border-linnk-stone-200">
                          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                            <AttendanceTypeBadge type={item.type} />
                            <span className="font-mono text-linnk-stone-500 text-[11px]">
                              {formatDateTimeBR(item.createdAt)} · por{' '}
                              {author?.name || 'Operador LINNK'}
                            </span>
                          </div>
                          <h5 className="font-display font-bold text-sm text-linnk-obsidian mt-2">
                            {item.title}
                          </h5>
                          <p className="text-xs text-linnk-stone-600 mt-1 leading-relaxed">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

