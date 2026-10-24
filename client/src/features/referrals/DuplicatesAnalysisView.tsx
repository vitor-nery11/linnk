import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  GitCompareArrows,
  Lock,
  ShieldCheck,
  UserCheck,
  XCircle,
} from 'lucide-react';
import { useApp } from '../../app/AppContext';
import { formatDateTimeBR } from '../../lib/formatters';
import { ReferralStatusBadge } from '../../components/StatusBadges';

export const DuplicatesAnalysisView: React.FC = () => {
  const {
    currentUser,
    referrals,
    clients,
    brokers,
    developments,
    commissionConfig,
    resolveDuplicate,
  } = useApp();

  const [justifications, setJustifications] = useState<Record<string, string>>({});

  const canResolve =
    currentUser?.role === 'ADMIN' || Boolean(currentUser?.permissions?.canResolveDuplicates);

  const pendingConflicts = referrals.filter((r) => r.status === 'EM_ANALISE_DUPLICIDADE');
  const resolvedConflicts = referrals.filter((r) => Boolean(r.duplicateResolvedAt));

  const handleDecision = (
    referralId: string,
    decision: 'APPROVE_NEW' | 'REJECT_AS_DUPLICATE'
  ) => {
    const note =
      justifications[referralId]?.trim() ||
      (decision === 'REJECT_AS_DUPLICATE'
        ? 'Aplicada regra de prioridade da primeira indicação válida (proteção de 6 meses ativa).'
        : 'Exceção operacional validada pela coordenação LINNK.');
    resolveDuplicate(referralId, decision, note);
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="bg-white rounded-3xl p-6 border border-linnk-stone-300/80 shadow-arch-card flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-rose-600">
            <AlertTriangle className="w-4 h-4" />
            <span>Governança Comercial</span>
          </div>
          <h2 className="font-display font-bold text-2xl text-linnk-obsidian mt-1">
            Análise e Resolução de Duplicidades
          </h2>
          <p className="text-sm text-linnk-stone-600 mt-1">
            Conflitos detectados por telefone e e-mail normalizados. Regra configurada:{' '}
            <strong className="text-linnk-obsidian font-mono">
              {commissionConfig.duplicatePriorityRule === 'PRIMEIRA_INDICACAO_VALIDA'
                ? 'Prioridade 1ª Indicação Válida (Proteção 6 Meses)'
                : 'Prioridade 1º Termo Assinado'}
            </strong>
            .
          </p>
        </div>

        <div className="px-4 py-2.5 rounded-2xl bg-linnk-stone-100 border border-linnk-stone-200 text-xs">
          <div className="font-mono uppercase text-linnk-stone-500">Permissão Atual</div>
          <div className="font-display font-bold text-linnk-obsidian mt-0.5 flex items-center gap-1.5">
            {canResolve ? (
              <>
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Autorizado a Resolver Conflitos</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 text-rose-600" />
                <span>Apenas Consulta (Sem Permissão de Resolução)</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Lista de Conflitos Pendentes */}
      {pendingConflicts.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 border border-linnk-stone-300/80 text-center">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="font-display font-bold text-lg text-linnk-obsidian">
            Nenhum conflito de duplicidade pendente
          </h3>
          <p className="text-sm text-linnk-stone-500 mt-1 max-w-md mx-auto">
            Todas as indicações em conflito foram analisadas e auditadas. Você pode simular
            um novo conflito criando uma indicação com telefone já cadastrado.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {pendingConflicts.map((conflictRef) => {
            const conflictClient = clients.find((c) => c.id === conflictRef.clientId);
            const conflictBroker = brokers.find((b) => b.id === conflictRef.brokerId);
            const conflictDev = developments.find((d) => d.id === conflictRef.developmentId);

            const origRef = referrals.find(
              (r) => r.id === conflictRef.duplicateOfReferralId
            );
            const origClient = origRef
              ? clients.find((c) => c.id === origRef.clientId)
              : null;
            const origBroker = origRef
              ? brokers.find((b) => b.id === origRef.brokerId)
              : null;
            const origDev = origRef
              ? developments.find((d) => d.id === origRef.developmentId)
              : null;

            return (
              <div
                key={conflictRef.id}
                className="bg-white rounded-3xl border-2 border-rose-300 shadow-arch-card overflow-hidden"
              >
                <div className="bg-rose-50 px-6 py-4 border-b border-rose-200 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="px-2.5 py-1 rounded-full bg-rose-600 text-white font-mono text-xs font-bold">
                      CONFLITO ATIVO
                    </span>
                    <span className="font-display font-bold text-linnk-obsidian">
                      {conflictRef.code} colide com {origRef?.code || 'Registro Anterior'}
                    </span>
                  </div>
                  <div className="text-xs font-mono text-rose-800">
                    Chave normalizada coincidente:{' '}
                    <strong>{conflictClient?.phoneNormalized}</strong> |{' '}
                    <strong>{conflictClient?.emailNormalized}</strong>
                  </div>
                </div>

                {/* Comparativo Lado a Lado */}
                <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Card 1: Indicação Original (Prioritária) */}
                  <div className="rounded-2xl bg-emerald-50/50 border border-emerald-200 p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-mono font-bold uppercase text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                        1º Registro Válido (Prioridade)
                      </span>
                      <span className="text-xs font-mono text-linnk-stone-500">
                        {origRef ? formatDateTimeBR(origRef.createdAt) : '—'}
                      </span>
                    </div>
                    <div className="font-display font-bold text-lg text-linnk-obsidian">
                      {origRef?.code} — {origClient?.name}
                    </div>
                    <div className="mt-3 space-y-1.5 text-xs text-linnk-stone-700">
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-emerald-600" />
                        <span>
                          Corretor Titular: <strong>{origBroker?.name}</strong> (
                          {origBroker?.city})
                        </span>
                      </div>
                      <div>
                        Empreendimento: <strong>{origDev?.name}</strong>
                      </div>
                      <div>
                        Modalidade: <strong>{origRef?.modality}</strong> · Status:{' '}
                        <strong>{origRef?.status}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Nova Indicação em Conflito */}
                  <div className="rounded-2xl bg-rose-50/40 border border-rose-200 p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-mono font-bold uppercase text-rose-700 bg-rose-100 px-2.5 py-1 rounded-full">
                        2º Registro (Submetido Depois)
                      </span>
                      <span className="text-xs font-mono text-linnk-stone-500">
                        {formatDateTimeBR(conflictRef.createdAt)}
                      </span>
                    </div>
                    <div className="font-display font-bold text-lg text-linnk-obsidian">
                      {conflictRef.code} — {conflictClient?.name}
                    </div>
                    <div className="mt-3 space-y-1.5 text-xs text-linnk-stone-700">
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-rose-600" />
                        <span>
                          Corretor Solicitante: <strong>{conflictBroker?.name}</strong> (
                          {conflictBroker?.city})
                        </span>
                      </div>
                      <div>
                        Empreendimento: <strong>{conflictDev?.name}</strong>
                      </div>
                      <div>
                        Modalidade: <strong>{conflictRef.modality}</strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Área de Decisão e Justificativa Auditada */}
                <div className="px-6 pb-6 pt-2 border-t border-linnk-stone-200 bg-linnk-stone-50/70">
                  <label className="block text-xs font-semibold text-linnk-obsidian mb-1.5">
                    Justificativa Formal de Resolução (Obrigatória para Auditoria)
                  </label>
                  <div className="flex flex-col md:flex-row gap-3">
                    <input
                      type="text"
                      disabled={!canResolve}
                      value={justifications[conflictRef.id] || ''}
                      onChange={(e) =>
                        setJustifications((prev) => ({
                          ...prev,
                          [conflictRef.id]: e.target.value,
                        }))
                      }
                      placeholder="Ex.: Prioridade mantida para LNK-2026-001 conforme regra de 1º registro válido e termo ativo..."
                      className="flex-1 px-4 py-2.5 rounded-2xl bg-white border border-linnk-stone-300 text-sm focus:border-linnk-flame focus:outline-none disabled:opacity-60"
                    />

                    <div className="flex flex-wrap gap-2 shrink-0">
                      <button
                        disabled={!canResolve}
                        onClick={() =>
                          handleDecision(conflictRef.id, 'REJECT_AS_DUPLICATE')
                        }
                        className="px-4 py-2.5 rounded-2xl bg-linnk-obsidian hover:bg-linnk-obsidian-800 text-white font-display font-bold text-xs flex items-center gap-1.5 disabled:opacity-40"
                      >
                        <XCircle className="w-4 h-4 text-rose-400" />
                        <span>Manter 1ª e Rejeitar Duplicada</span>
                      </button>

                      <button
                        disabled={!canResolve}
                        onClick={() => handleDecision(conflictRef.id, 'APPROVE_NEW')}
                        className="px-4 py-2.5 rounded-2xl bg-linnk-flame hover:bg-linnk-flame-600 text-white font-display font-bold text-xs flex items-center gap-1.5 disabled:opacity-40"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Aprovar Exceção e Liberar p/ Termo</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Histórico de Conflitos Já Resolvidos */}
      {resolvedConflicts.length > 0 && (
        <div className="bg-white rounded-3xl p-6 border border-linnk-stone-300/80 shadow-arch-card">
          <h3 className="font-display font-bold text-base text-linnk-obsidian mb-4">
            Histórico de Duplicidades Resolvidas ({resolvedConflicts.length})
          </h3>
          <div className="space-y-3">
            {resolvedConflicts.map((r) => {
              const cli = clients.find((c) => c.id === r.clientId);
              return (
                <div
                  key={r.id}
                  className="p-4 rounded-2xl bg-linnk-stone-50 border border-linnk-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-linnk-flame">{r.code}</span>
                      <span className="font-semibold text-linnk-obsidian">{cli?.name}</span>
                      <ReferralStatusBadge status={r.status} />
                    </div>
                    <p className="text-linnk-stone-600 mt-1">
                      Parecer registrado: <strong>"{r.duplicateResolutionNote}"</strong>
                    </p>
                  </div>
                  <div className="text-linnk-stone-500 font-mono">
                    {r.duplicateResolvedAt ? formatDateTimeBR(r.duplicateResolvedAt) : ''}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
