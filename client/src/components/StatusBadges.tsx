import React from 'react';
import {
  DocumentStatus,
  FinancialFlowStatus,
  Modality,
  ReferralStatus,
} from '../app/types';

export const ModalityBadge: React.FC<{ modality: Modality }> = ({ modality }) => {
  if (modality === 'INDICA') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-display font-bold tracking-wider uppercase bg-linnk-flame-50 text-linnk-flame-700 border border-linnk-flame-200">
        <span className="w-1.5 h-1.5 rounded-full bg-linnk-flame" />
        INDICA · Closer LINNK
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-display font-bold tracking-wider uppercase bg-linnk-obsidian text-white border border-linnk-obsidian-700">
      <span className="w-1.5 h-1.5 rounded-full bg-linnk-flame-400" />
      CONECTA · Corretor Atende
    </span>
  );
};

export const ReferralStatusBadge: React.FC<{ status: ReferralStatus }> = ({ status }) => {
  const map: Record<
    ReferralStatus,
    { label: string; classes: string; dot: string }
  > = {
    EM_ANALISE_DUPLICIDADE: {
      label: 'Conflito Duplicidade',
      classes: 'bg-rose-50 text-rose-700 border-rose-200',
      dot: 'bg-rose-500 animate-pulse',
    },
    AGUARDANDO_CONSENTIMENTO: {
      label: 'Aguardando Termo',
      classes: 'bg-amber-50 text-amber-800 border-amber-200',
      dot: 'bg-amber-500',
    },
    LIBERADA_ATENDIMENTO: {
      label: 'Liberada p/ Atendimento',
      classes: 'bg-sky-50 text-sky-700 border-sky-200',
      dot: 'bg-sky-500',
    },
    EM_ATENDIMENTO: {
      label: 'Em Atendimento Ativo',
      classes: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      dot: 'bg-indigo-500',
    },
    PROPOSTA_ENVIADA: {
      label: 'Proposta em Negociação',
      classes: 'bg-purple-50 text-purple-700 border-purple-200',
      dot: 'bg-purple-500',
    },
    VENDA_CONFIRMADA: {
      label: 'Venda Confirmada',
      classes: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dot: 'bg-emerald-500',
    },
    CONFLITO_REJEITADO: {
      label: 'Rejeitada · Duplicidade',
      classes: 'bg-stone-100 text-stone-600 border-stone-300',
      dot: 'bg-stone-400',
    },
    ENCERRADA_SEM_VENDA: {
      label: 'Encerrada s/ Venda',
      classes: 'bg-stone-100 text-stone-600 border-stone-300',
      dot: 'bg-stone-400',
    },
  };

  const item = map[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${item.classes}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${item.dot}`} />
      {item.label}
    </span>
  );
};

export const DocumentStatusBadge: React.FC<{ status: DocumentStatus }> = ({ status }) => {
  const map: Record<
    DocumentStatus,
    { label: string; classes: string; dot: string }
  > = {
    PENDENTE_GERACAO: {
      label: 'Termo Não Gerado',
      classes: 'bg-stone-100 text-stone-600 border-stone-200',
      dot: 'bg-stone-400',
    },
    GERADO_AGUARDANDO_ASSINATURA: {
      label: 'Aguardando Assinatura',
      classes: 'bg-amber-50 text-amber-700 border-amber-200',
      dot: 'bg-amber-500',
    },
    RECEBIDO_AGUARDANDO_CONFERENCIA: {
      label: 'Pendente Conferência',
      classes: 'bg-linnk-flame-50 text-linnk-flame-700 border-linnk-flame-200',
      dot: 'bg-linnk-flame animate-pulse',
    },
    APROVADO: {
      label: 'Termo Conferido & OK',
      classes: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dot: 'bg-emerald-500',
    },
    REJEITADO: {
      label: 'Termo Rejeitado',
      classes: 'bg-rose-50 text-rose-700 border-rose-200',
      dot: 'bg-rose-500',
    },
  };

  const item = map[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${item.classes}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${item.dot}`} />
      {item.label}
    </span>
  );
};

export const FinancialFlowBadge: React.FC<{
  status: FinancialFlowStatus;
  prefix?: string;
}> = ({ status, prefix }) => {
  const map: Record<
    FinancialFlowStatus,
    { label: string; classes: string }
  > = {
    NAO_APLICAVEL: {
      label: '—',
      classes: 'bg-stone-100 text-stone-500 border-stone-200',
    },
    PENDENTE: {
      label: 'Pendente',
      classes: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    PARCIAL: {
      label: 'Parcial (Parcelado)',
      classes: 'bg-sky-50 text-sky-700 border-sky-200',
    },
    QUITADO: {
      label: 'Quitado 100%',
      classes: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
  };

  const item = map[status];
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${item.classes}`}
    >
      {prefix ? `${prefix}: ${item.label}` : item.label}
    </span>
  );
};
