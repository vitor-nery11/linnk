import React, { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Eye,
  FileCheck2,
  FileText,
  FileUp,
  Lock,
  Mail,
  Printer,
  Send,
  ShieldCheck,
  Upload,
  X,
  XCircle,
} from 'lucide-react';
import { useApp } from '../../app/AppContext';
import { formatDateBR, formatDateTimeBR, formatCNPJ } from '../../lib/formatters';
import {
  DocumentStatusBadge,
  ModalityBadge,
  ReferralStatusBadge,
} from '../../components/StatusBadges';

export const DocumentsView: React.FC = () => {
  const {
    currentUser,
    referrals,
    documents,
    clients,
    brokers,
    developments,
    developers,
    generateConsentTerm,
    sendConsentTermEmail,
    uploadSignedConsentTerm,
    reviewConsentTerm,
    setActiveNav,
    selectedReferralId,
    setSelectedReferralId,
  } = useApp();

  const isBroker = currentUser?.role === 'BROKER';

  const [previewReferralId, setPreviewReferralId] = useState<string | null>(
    selectedReferralId
  );
  const [uploadModalReferralId, setUploadModalReferralId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [reviewNotesMap, setReviewNotesMap] = useState<Record<string, string>>({});

  // Estados para modal de envio por e-mail (Resend)
  const [emailModalReferralId, setEmailModalReferralId] = useState<string | null>(null);
  const [emailInput, setEmailInput] = useState('');
  const [customMessageInput, setCustomMessageInput] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailFeedback, setEmailFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const visibleReferrals = referrals.filter((r) => {
    if (r.status === 'CONFLITO_REJEITADO') return false;
    if (isBroker && currentUser?.brokerId) {
      return r.brokerId === currentUser.brokerId;
    }
    return true;
  });

  const previewReferral = referrals.find((r) => r.id === previewReferralId) || null;
  const previewClient = previewReferral
    ? clients.find((c) => c.id === previewReferral.clientId)
    : null;
  const previewBroker = previewReferral
    ? brokers.find((b) => b.id === previewReferral.brokerId)
    : null;
  const previewDev = previewReferral
    ? developments.find((d) => d.id === previewReferral.developmentId)
    : null;
  const previewDeveloper = previewDev
    ? developers.find((dv) => dv.id === previewDev.developerId)
    : null;
  const previewDoc = previewReferral
    ? documents.find((d) => d.referralId === previewReferral.id)
    : null;

  const handleUploadConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadModalReferralId) return;
    if (!selectedFile) {
      setUploadError('Por favor, selecione um arquivo (PDF ou imagem) do termo assinado.');
      return;
    }

    if (selectedFile.size > 15 * 1024 * 1024) {
      setUploadError('O arquivo selecionado é muito grande. O limite máximo permitido é 15 MB.');
      return;
    }

    try {
      setIsUploading(true);
      setUploadError('');
      await uploadSignedConsentTerm(uploadModalReferralId, selectedFile);
      setUploadModalReferralId(null);
      setSelectedFile(null);
    } catch (err: any) {
      setUploadError(err.message || 'Erro ao realizar upload do arquivo.');
    } finally {
      setIsUploading(false);
    }
  };

  const emailModalReferral = referrals.find((r) => r.id === emailModalReferralId) || null;
  const emailModalClient = emailModalReferral
    ? clients.find((c) => c.id === emailModalReferral.clientId)
    : null;
  const emailModalDev = emailModalReferral
    ? developments.find((d) => d.id === emailModalReferral.developmentId)
    : null;
  const emailModalBroker = emailModalReferral
    ? brokers.find((b) => b.id === emailModalReferral.brokerId)
    : null;

  const handleOpenEmailModal = (referralId: string) => {
    const ref = referrals.find((r) => r.id === referralId);
    const cli = ref ? clients.find((c) => c.id === ref.clientId) : null;
    setEmailModalReferralId(referralId);
    setEmailInput(cli?.email || '');
    setCustomMessageInput('');
    setEmailFeedback(null);
  };

  const handleSendEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailModalReferralId || !emailInput.trim()) return;

    setIsSendingEmail(true);
    setEmailFeedback(null);

    try {
      const res = await sendConsentTermEmail(
        emailModalReferralId,
        emailInput.trim(),
        customMessageInput.trim() || undefined
      );

      if (res.ok) {
        setEmailFeedback({
          type: 'success',
          message: res.message || `E-mail enviado com sucesso para ${emailInput.trim()}!`,
        });
        setTimeout(() => {
          setEmailModalReferralId(null);
          setEmailFeedback(null);
        }, 2500);
      } else {
        setEmailFeedback({
          type: 'error',
          message: res.error || 'Falha ao disparar e-mail via Resend.',
        });
      }
    } catch (err: any) {
      setEmailFeedback({
        type: 'error',
        message: err.message || 'Erro inesperado ao disparar e-mail.',
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="bg-white rounded-3xl p-6 border border-linnk-stone-300/80 shadow-arch-card flex flex-col lg:flex-row lg:items-center justify-between gap-4 no-print">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-linnk-flame">
            <FileCheck2 className="w-4 h-4" />
            <span>Conformidade Jurídica & LGPD</span>
          </div>
          <h2 className="font-display font-bold text-2xl text-linnk-obsidian mt-1">
            {isBroker
              ? 'Meus Termos de Consentimento & Proteção de Carteira'
              : 'Documentos, Termos de Consentimento & Conferência Manual'}
          </h2>
          <p className="text-sm text-linnk-stone-600 mt-1">
            {isBroker
              ? 'Visualize ou imprima o Termo de Consentimento gerado automaticamente para suas indicações e envie o arquivo assinado pelo cliente para liberação do atendimento.'
              : 'Gere o termo versionado (HTML/PDF), registre o arquivo assinado em armazenamento privado e aprove a conferência para liberar o atendimento comercial.'}
          </p>
        </div>

        <div className="flex items-center gap-3 bg-linnk-stone-100 px-4 py-3 rounded-2xl border border-linnk-stone-200 text-xs">
          <Lock className="w-4 h-4 text-linnk-flame shrink-0" />
          <div>
            <div className="font-display font-bold text-linnk-obsidian">
              Conferência Obrigatória
            </div>
            <div className="text-linnk-stone-600">
              {isBroker
                ? 'Após anexar o termo assinado, a equipe LINNK confere e libera o atendimento.'
                : 'Gerar ou enviar um termo não libera atendimento sem conferência manual.'}
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Documentos por Indicação */}
      <div className="grid grid-cols-1 gap-4 no-print">
        {visibleReferrals.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 border border-linnk-stone-300/80 shadow-arch-card text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-linnk-stone-100 text-linnk-stone-400 mx-auto flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="font-display font-bold text-lg text-linnk-obsidian">
              Nenhum termo de consentimento pendente
            </h3>
            <p className="text-xs text-linnk-stone-500 max-w-md mx-auto leading-relaxed">
              Os termos de consentimento e proteção LGPD serão listados aqui assim que novas indicações forem cadastradas na plataforma.
            </p>
          </div>
        ) : (
          visibleReferrals.map((ref) => {
          const doc = documents.find((d) => d.referralId === ref.id);
          const cli = clients.find((c) => c.id === ref.clientId);
          const brk = brokers.find((b) => b.id === ref.brokerId);
          const dev = developments.find((d) => d.id === ref.developmentId);
          const isBlockedByDuplicate = ref.status === 'EM_ANALISE_DUPLICIDADE';

          return (
            <div
              key={ref.id}
              className="bg-white rounded-3xl p-6 border border-linnk-stone-300/80 shadow-arch-card flex flex-col lg:flex-row lg:items-center justify-between gap-6"
            >
              <div className="space-y-2 max-w-2xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-full bg-linnk-obsidian text-white">
                    {ref.code}
                  </span>
                  <DocumentStatusBadge
                    status={doc?.status || 'PENDENTE_GERACAO'}
                  />
                  <ReferralStatusBadge status={ref.status} />
                  <ModalityBadge modality={ref.modality} />
                </div>

                <div className="font-display font-bold text-lg text-linnk-obsidian">
                  Cliente: {cli?.name}
                  {!isBroker && (
                    <>
                      {' · '}
                      <span className="font-normal text-sm text-linnk-stone-600">
                        Corretor: {brk?.name} ({brk?.city})
                      </span>
                    </>
                  )}
                </div>

                <div className="text-xs text-linnk-stone-600 flex flex-wrap gap-x-4 gap-y-1">
                  <span>
                    Empreendimento: <strong>{dev?.name}</strong>
                  </span>
                  <span>
                    Versão do Modelo:{' '}
                    <strong className="font-mono">
                      {doc?.templateVersion || 'TERMO-CONSENTIMENTO-v1.2'}
                    </strong>
                  </span>
                  {doc?.fileName && (
                    <a
                      href={doc.fileUrl || '#'}
                      target={doc.fileUrl ? '_blank' : undefined}
                      rel="noopener noreferrer"
                      onClick={(e) => {
                        if (!doc.fileUrl) {
                          e.preventDefault();
                          alert(`Arquivo registrado: ${doc.fileName}`);
                        }
                      }}
                      className="inline-flex items-center gap-1.5 font-mono text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors cursor-pointer"
                      title={doc.fileUrl ? 'Clique para visualizar ou baixar o termo assinado' : 'Termo assinado anexado'}
                    >
                      <FileCheck2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Anexo: {doc.fileName}</span>
                      {doc.fileUrl && <ExternalLink className="w-3 h-3 text-emerald-600 opacity-70" />}
                    </a>
                  )}
                  {doc?.sentAt && (
                    <span className="inline-flex items-center gap-1 font-mono text-sky-700 bg-sky-50 border border-sky-200 px-2.5 py-0.5 rounded-full">
                      <Mail className="w-3 h-3 text-sky-600" />
                      Enviado p/ {doc.sentToEmail || cli?.email} em {formatDateTimeBR(doc.sentAt)}
                    </span>
                  )}
                </div>

                {doc?.reviewNotes && (
                  <div className="text-xs bg-linnk-stone-50 px-3.5 py-2 rounded-xl border border-linnk-stone-200 text-linnk-stone-700">
                    Parecer da Conferência: <strong>"{doc.reviewNotes}"</strong> (
                    {doc.reviewedAt ? formatDateTimeBR(doc.reviewedAt) : ''})
                  </div>
                )}
              </div>

              {/* Ações do Ciclo do Documento */}
              <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
                <button
                  onClick={() => setPreviewReferralId(ref.id)}
                  className="px-4 py-2.5 rounded-2xl bg-linnk-stone-100 hover:bg-linnk-stone-200 text-linnk-obsidian font-display font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Eye className="w-4 h-4 text-linnk-flame" />
                  <span>Visualizar / Imprimir Termo</span>
                </button>

                <button
                  onClick={() => handleOpenEmailModal(ref.id)}
                  className="px-4 py-2.5 rounded-2xl bg-sky-50 hover:bg-sky-100 text-sky-900 border border-sky-200 font-display font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  title="Enviar Termo de Consentimento ao cliente por e-mail via Resend"
                >
                  <Mail className="w-4 h-4 text-sky-600" />
                  <span>{doc?.sentAt ? 'Reenviar E-mail' : 'Enviar por E-mail'}</span>
                </button>

                {isBlockedByDuplicate ? (
                  <span className="px-4 py-2.5 rounded-2xl bg-rose-50 text-rose-700 border border-rose-200 font-display font-bold text-xs text-center">
                    Em Análise de Duplicidade
                  </span>
                ) : (
                  <>
                    {doc?.status === 'PENDENTE_GERACAO' && (
                      <button
                        onClick={() => {
                          generateConsentTerm(ref.id);
                          setPreviewReferralId(ref.id);
                        }}
                        className="px-4 py-2.5 rounded-2xl bg-linnk-flame hover:bg-linnk-flame-600 text-white font-display font-bold text-xs flex items-center justify-center gap-1.5 shadow-flame-sm"
                      >
                        <FileText className="w-4 h-4" />
                        <span>1. Gerar Termo de Consentimento</span>
                      </button>
                    )}

                    {(doc?.status === 'GERADO_AGUARDANDO_ASSINATURA' ||
                      doc?.status === 'REJEITADO') && (
                      <button
                        onClick={() => {
                          setSelectedFile(null);
                          setUploadError('');
                          setUploadModalReferralId(ref.id);
                        }}
                        className="px-4 py-2.5 rounded-2xl bg-linnk-obsidian hover:bg-linnk-obsidian-800 text-white font-display font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Upload className="w-4 h-4 text-linnk-flame" />
                        <span>2. Anexar Termo Assinado</span>
                      </button>
                    )}

                    {doc?.status === 'APROVADO' && (
                      <button
                        onClick={() => {
                          setSelectedReferralId(ref.id);
                          setActiveNav('attendances');
                        }}
                        className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-display font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>Ir p/ Atendimento Liberado</span>
                      </button>
                    )}
                  </>
                )}
              </div>

              {/* Painel Inline de Conferência Manual quando RECEBIDO_AGUARDANDO_CONFERENCIA */}
              {doc?.status === 'RECEBIDO_AGUARDANDO_CONFERENCIA' &&
                (isBroker ? (
                  <div className="px-4 py-2.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium flex items-center justify-between gap-3">
                    <div className="flex items-center gap-1.5">
                      <FileCheck2 className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Termo assinado enviado · Aguardando conferência</span>
                    </div>
                    {doc.fileUrl && (
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-semibold text-amber-900 underline hover:text-amber-700 text-xs shrink-0"
                      >
                        <span>Abrir anexo</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                ) : (
                  <div className="w-full lg:w-auto pt-4 lg:pt-0 border-t lg:border-t-0 border-linnk-stone-200 flex flex-col gap-2 sm:min-w-[320px]">
                    {doc?.fileUrl && (
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Visualizar Arquivo Anexado</span>
                      </a>
                    )}
                    <input
                      type="text"
                      value={reviewNotesMap[ref.id] || ''}
                      onChange={(e) =>
                        setReviewNotesMap((prev) => ({
                          ...prev,
                          [ref.id]: e.target.value,
                        }))
                      }
                      placeholder="Parecer de conferência da assinatura..."
                      className="px-3 py-2 rounded-xl bg-linnk-stone-50 border border-linnk-stone-300 text-xs focus:border-linnk-flame focus:outline-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          reviewConsentTerm(
                            ref.id,
                            true,
                            reviewNotesMap[ref.id] ||
                              'Assinatura conferida e validada. Liberado para atendimento.'
                          )
                        }
                        className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-display font-bold text-xs flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>3. Aprovar & Liberar</span>
                      </button>
                      <button
                        onClick={() =>
                          reviewConsentTerm(
                            ref.id,
                            false,
                            reviewNotesMap[ref.id] ||
                              'Assinatura ilegível ou documento incompleto.'
                          )
                        }
                        className="py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-display font-bold text-xs flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Rejeitar</span>
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          );
        })
      )}
      </div>

      {/* Modal de Anexar Termo Assinado Real */}
      {uploadModalReferralId && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-linnk-stone-300 shadow-obsidian space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-50 text-linnk-flame border border-orange-200 flex items-center justify-center shrink-0">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg text-linnk-obsidian leading-tight">
                    Anexar Termo Assinado
                  </h3>
                  <p className="text-xs text-linnk-stone-600">
                    Protocolo:{' '}
                    <span className="font-mono font-bold text-linnk-obsidian">
                      {referrals.find((r) => r.id === uploadModalReferralId)?.code}
                    </span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setUploadModalReferralId(null);
                  setSelectedFile(null);
                  setUploadError('');
                }}
                className="p-1.5 rounded-xl bg-linnk-stone-100 hover:bg-linnk-stone-200 text-linnk-stone-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {uploadError && (
              <div
                role="alert"
                className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5 font-medium animate-fadeIn"
              >
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{uploadError}</span>
              </div>
            )}

            <form onSubmit={handleUploadConfirm} className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,image/png,image/jpeg,image/jpg"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setSelectedFile(file);
                    setUploadError('');
                  }
                }}
                className="hidden"
              />

              {!selectedFile ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files?.[0];
                    if (file) {
                      setSelectedFile(file);
                      setUploadError('');
                    }
                  }}
                  className="border-2 border-dashed border-linnk-stone-300 hover:border-linnk-flame rounded-3xl p-8 text-center cursor-pointer transition-colors bg-linnk-stone-50/60 hover:bg-orange-50/30 flex flex-col items-center justify-center gap-3 group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-white border border-linnk-stone-200 group-hover:border-orange-200 group-hover:scale-105 transition-all flex items-center justify-center text-linnk-stone-400 group-hover:text-linnk-flame shadow-xs">
                    <FileUp className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-linnk-obsidian group-hover:text-linnk-flame">
                      Clique para selecionar o arquivo
                    </span>
                    <span className="text-xs text-linnk-stone-500 block mt-0.5">
                      ou arraste o documento assinado até aqui
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-linnk-stone-400">
                    Formatos aceitos: PDF, PNG, JPG (até 15 MB)
                  </span>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      <FileCheck2 className="w-5 h-5" />
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-semibold text-emerald-950 truncate font-mono">
                        {selectedFile.name}
                      </p>
                      <p className="text-[11px] text-emerald-700 font-mono">
                        {(selectedFile.size / 1024).toFixed(0)} KB · Arquivo selecionado
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="text-xs font-semibold text-rose-600 hover:text-rose-800 shrink-0 px-2.5 py-1 rounded-lg hover:bg-rose-50 cursor-pointer"
                  >
                    Trocar arquivo
                  </button>
                </div>
              )}

              <p className="text-[11px] text-linnk-stone-500 leading-relaxed">
                Ao anexar o arquivo real do termo assinado, o documento é registrado e enviado para a esteira de conferência manual para liberar o atendimento.
              </p>

              <div className="flex justify-end gap-2 pt-2 border-t border-linnk-stone-200">
                <button
                  type="button"
                  onClick={() => {
                    setUploadModalReferralId(null);
                    setSelectedFile(null);
                    setUploadError('');
                  }}
                  disabled={isUploading}
                  className="px-4 py-2.5 rounded-xl bg-linnk-stone-100 hover:bg-linnk-stone-200 text-xs font-display font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!selectedFile || isUploading}
                  className="px-5 py-2.5 rounded-xl bg-linnk-flame hover:bg-linnk-flame-600 text-white text-xs font-display font-bold flex items-center gap-2 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed shadow-flame-sm"
                >
                  {isUploading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Anexando termo...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      <span>Confirmar & Anexar Termo</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Envio do Termo via E-mail (Resend) */}
      {emailModalReferral && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-linnk-stone-300 shadow-obsidian space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-600 border border-sky-200 flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg text-linnk-obsidian leading-tight">
                    Enviar Termo de Consentimento
                  </h3>
                  <p className="text-xs text-linnk-stone-600">
                    Disparo oficial via <strong>Resend</strong> · Protocolo{' '}
                    <span className="font-mono font-bold text-linnk-obsidian">
                      {emailModalReferral.code}
                    </span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEmailModalReferralId(null);
                  setEmailFeedback(null);
                }}
                className="p-1.5 rounded-xl bg-linnk-stone-100 hover:bg-linnk-stone-200 text-linnk-stone-600 transition-colors"
                aria-label="Fechar modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Resumo do Destinatário e Empreendimento */}
            <div className="bg-linnk-stone-50 border border-linnk-stone-200 rounded-2xl p-4 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-linnk-stone-600">Cliente Indicado:</span>
                <strong className="text-linnk-obsidian">{emailModalClient?.name || 'Cliente'}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-linnk-stone-600">Empreendimento:</span>
                <strong className="text-linnk-obsidian">{emailModalDev?.name || 'Empreendimento'}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-linnk-stone-600">Corretor Credenciado:</span>
                <strong className="text-linnk-obsidian">{emailModalBroker?.name || 'Corretor'}</strong>
              </div>
            </div>

            {/* Feedback Alert */}
            {emailFeedback && (
              <div
                className={`p-3.5 rounded-2xl text-xs flex items-start gap-2.5 ${
                  emailFeedback.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {emailFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div className="leading-relaxed">{emailFeedback.message}</div>
              </div>
            )}

            <form onSubmit={handleSendEmailSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-linnk-obsidian mb-1.5">
                  E-mail do Cliente Destinatário <span className="text-linnk-flame">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="cliente@exemplo.com"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-linnk-stone-50 border border-linnk-stone-300 text-sm font-mono focus:border-linnk-flame focus:outline-none"
                />
                <p className="text-[11px] text-linnk-stone-600 mt-1">
                  O cliente receberá o e-mail timbrado com o termo de consentimento LGPD formatado.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-linnk-obsidian mb-1.5">
                  Mensagem Personalizada Adicional (Opcional)
                </label>
                <textarea
                  rows={2}
                  value={customMessageInput}
                  onChange={(e) => setCustomMessageInput(e.target.value)}
                  placeholder="Ex: Olá! Conforme alinhamos, segue o termo de consentimento oficial para sua análise..."
                  className="w-full px-3.5 py-2 rounded-2xl bg-linnk-stone-50 border border-linnk-stone-300 text-xs focus:border-linnk-flame focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setEmailModalReferralId(null);
                    setEmailFeedback(null);
                  }}
                  disabled={isSendingEmail}
                  className="px-4 py-2.5 rounded-xl bg-linnk-stone-100 hover:bg-linnk-stone-200 text-linnk-stone-700 text-xs font-display font-semibold transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSendingEmail || !emailInput.trim()}
                  className="px-5 py-2.5 rounded-xl bg-linnk-flame hover:bg-linnk-flame-600 text-white text-xs font-display font-bold flex items-center gap-2 shadow-flame-sm transition-colors disabled:opacity-50"
                >
                  {isSendingEmail ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Disparando via Resend...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Enviar Termo via Resend</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Visualizador / Impressão do Termo de Consentimento Versionado (Folha Timbrada A4 Executiva) */}
      {previewReferral && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-start justify-center p-3 sm:p-6 overflow-y-auto print-document-sheet">
          <div className="bg-[#EAE6DF] rounded-3xl max-w-4xl w-full border border-linnk-stone-400 shadow-obsidian overflow-hidden my-4 sm:my-6 print-document-sheet">
            {/* Barra de Ferramentas do Visualizador (Oculta na Impressão) */}
            <div className="bg-[#161316] text-white px-6 py-4 flex flex-wrap items-center justify-between gap-4 no-print border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-linnk-flame/15 border border-linnk-flame/40 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-linnk-flame" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-display font-bold text-base text-white">
                       Instrumento Particular de Consentimento (LGPD) & Proteção de Carteira
                    </h3>
                    <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-white/10 text-linnk-stone-200">
                      Folha A4 Oficial
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-linnk-stone-400">
                    Protocolo {previewReferral.code} · Modelo{' '}
                    {previewDoc?.templateVersion || 'TERMO-CONSENTIMENTO-v1.2'} · Emissão{' '}
                    {formatDateBR(previewReferral.createdAt)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => handleOpenEmailModal(previewReferral.id)}
                  className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-display font-bold text-xs flex items-center gap-2 transition-colors shadow-sm"
                  title="Enviar este termo por e-mail para o cliente via Resend"
                >
                  <Mail className="w-4 h-4" />
                  <span>Enviar p/ E-mail do Cliente</span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2.5 rounded-xl bg-linnk-flame hover:bg-linnk-flame-600 text-white font-display font-bold text-xs flex items-center gap-2 shadow-flame-sm transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir / Salvar PDF (A4)</span>
                </button>
                <button
                  onClick={() => setPreviewReferralId(null)}
                  className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                  aria-label="Fechar documento"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Moldura da Folha A4 */}
            <div className="p-3 sm:p-8 print:p-0">
              <div className="bg-white text-[#161316] border border-linnk-stone-300 shadow-xl rounded-sm mx-auto max-w-[210mm] p-6 sm:p-12 print:shadow-none print:border-none print:p-0 space-y-6">
                {/* 1. CABEÇALHO TIMBRADO INSTITUCIONAL */}
                <div className="border-b-2 border-[#161316] pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="bg-[#161316] px-4 py-2.5 rounded-lg inline-flex items-center justify-center shrink-0">
                      <img
                        src="/linnk-logo-dark.png"
                        alt="LINNK"
                        className="h-7 w-auto object-contain"
                      />
                    </div>
                    <div className="border-l-2 border-linnk-stone-300 pl-3.5">
                      <div className="font-display font-bold text-sm uppercase tracking-wider text-[#161316]">
                        LINNK Curadoria Imobiliária & Parcerias
                      </div>
                      <div className="text-[11px] text-linnk-stone-600">
                        Governança Comercial, Compliance & Proteção de Carteira
                      </div>
                      <div className="text-[10px] font-mono text-linnk-stone-500 mt-0.5">
                        Regional Sul da Bahia · Ilhéus · Itabuna · Litoral Sul
                      </div>
                    </div>
                  </div>

                  {/* Quadro de Controle Protocolar */}
                  <div className="bg-linnk-stone-50 border border-linnk-stone-300 rounded-lg px-3.5 py-2.5 text-right font-mono text-[11px] shrink-0">
                    <div className="text-[10px] uppercase tracking-wider text-linnk-stone-500">
                      Protocolo de Registro
                    </div>
                    <div className="font-bold text-sm text-linnk-flame">
                      Nº {previewReferral.code}
                    </div>
                    <div className="text-linnk-stone-700">
                      Emissão: <strong>{formatDateBR(previewReferral.createdAt)}</strong>
                    </div>
                    <div className="text-linnk-stone-700">
                      Garantia até:{' '}
                      <strong>{formatDateBR(previewReferral.protectionExpiresAt)}</strong>
                    </div>
                  </div>
                </div>

                {/* 2. TÍTULO FORMAL DO INSTRUMENTO */}
                <div className="bg-[#161316] text-white px-5 py-3.5 rounded-lg text-center">
                  <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-linnk-flame">
                    Documento Oficial de Conformidade Jurídica · Lei Federal nº 13.709/2018 (LGPD)
                  </div>
                  <h1 className="font-display font-bold text-sm sm:text-base uppercase tracking-wide mt-0.5">
                    Termo de Consentimento para Tratamento de Dados Pessoais, Indicação Comercial e
                    Certificado de Proteção de Carteira (180 Dias)
                  </h1>
                </div>

                {/* 3. QUADRO I — QUALIFICAÇÃO DAS PARTES */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between border-b border-linnk-stone-300 pb-1">
                    <h2 className="font-display font-bold text-xs uppercase tracking-wider text-[#161316]">
                      Quadro I — Qualificação das Partes Vinculadas
                    </h2>
                    <span className="text-[10px] font-mono text-linnk-stone-500">
                      Seção 01/04
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {/* Parte 1: Titular / Cliente */}
                    <div className="border border-linnk-stone-300 rounded-lg overflow-hidden">
                      <div className="bg-linnk-stone-100 px-3 py-1.5 border-b border-linnk-stone-300 font-display font-bold text-[11px] uppercase tracking-wider text-[#161316] flex items-center justify-between">
                        <span>1. Cliente Indicado (Titular dos Dados)</span>
                        <span className="font-mono text-[10px] text-linnk-stone-600">
                          TITULAR LGPD
                        </span>
                      </div>
                      <div className="p-3 space-y-1.5 text-[11px]">
                        <div className="grid grid-cols-3 gap-1 border-b border-linnk-stone-100 pb-1">
                          <span className="text-linnk-stone-500">Nome Completo:</span>
                          <span className="col-span-2 font-semibold text-[#161316]">
                            {previewClient?.name || '—'}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-1 border-b border-linnk-stone-100 pb-1">
                          <span className="text-linnk-stone-500">Telefone / WhatsApp:</span>
                          <span className="col-span-2 font-mono font-medium text-[#161316]">
                            {previewClient?.phone || '—'}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-1 border-b border-linnk-stone-100 pb-1">
                          <span className="text-linnk-stone-500">E-mail Eletrônico:</span>
                          <span className="col-span-2 font-mono text-[#161316] break-all">
                            {previewClient?.email || '—'}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-1">
                          <span className="text-linnk-stone-500">Praça / Domicílio:</span>
                          <span className="col-span-2 font-medium text-[#161316]">
                            {previewClient?.city || '—'} / BA
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Parte 2: Corretor Parceiro */}
                    <div className="border border-linnk-stone-300 rounded-lg overflow-hidden">
                      <div className="bg-linnk-stone-100 px-3 py-1.5 border-b border-linnk-stone-300 font-display font-bold text-[11px] uppercase tracking-wider text-[#161316] flex items-center justify-between">
                        <span>2. Corretor(a) Parceiro(a) Indicador(a)</span>
                        <span className="font-mono text-[10px] text-linnk-flame font-bold">
                          ORIGINADOR
                        </span>
                      </div>
                      <div className="p-3 space-y-1.5 text-[11px]">
                        <div className="grid grid-cols-3 gap-1 border-b border-linnk-stone-100 pb-1">
                          <span className="text-linnk-stone-500">Profissional:</span>
                          <span className="col-span-2 font-semibold text-[#161316]">
                            {previewBroker?.name || '—'}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-1 border-b border-linnk-stone-100 pb-1">
                          <span className="text-linnk-stone-500">Registro / Vínculo:</span>
                          <span className="col-span-2 font-mono font-medium text-[#161316]">
                            {previewBroker?.creci || 'Parceiro Credenciado LINNK'}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-1 border-b border-linnk-stone-100 pb-1">
                          <span className="text-linnk-stone-500">Contato / Praça:</span>
                          <span className="col-span-2 text-[#161316]">
                            {previewBroker?.phone} · {previewBroker?.city}/{previewBroker?.state}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-1">
                          <span className="text-linnk-stone-500">Modalidade Eleita:</span>
                          <span className="col-span-2 font-mono font-bold text-[#161316]">
                            {previewReferral.modality === 'INDICA'
                              ? 'INDICA (Atendimento Closer LINNK)'
                              : 'CONECTA (Atendimento pelo Corretor)'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. QUADRO II — ANEXO I: EMPREENDIMENTO DE INTERESSE E CONDIÇÕES COMERCIAIS */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between border-b border-linnk-stone-300 pb-1">
                    <h2 className="font-display font-bold text-xs uppercase tracking-wider text-[#161316]">
                      Quadro II — Anexo I: Especificação do Empreendimento & Governança da Indicação
                    </h2>
                    <span className="text-[10px] font-mono text-linnk-stone-500">
                      Seção 02/04
                    </span>
                  </div>

                  <div className="border border-linnk-stone-300 rounded-lg overflow-hidden text-[11px]">
                    <div className="grid grid-cols-1 sm:grid-cols-4 bg-linnk-stone-50 border-b border-linnk-stone-300">
                      <div className="p-2.5 border-b sm:border-b-0 sm:border-r border-linnk-stone-300">
                        <div className="text-[10px] font-mono uppercase text-linnk-stone-500">
                          Empreendimento de Interesse
                        </div>
                        <div className="font-display font-bold text-xs text-[#161316] mt-0.5">
                          {previewDev?.name || 'Portfólio Curadoria LINNK'}
                        </div>
                      </div>
                      <div className="p-2.5 border-b sm:border-b-0 sm:border-r border-linnk-stone-300">
                        <div className="text-[10px] font-mono uppercase text-linnk-stone-500">
                          Incorporadora Responsável
                        </div>
                        <div className="font-semibold text-[#161316] mt-0.5">
                          {previewDeveloper?.legalName || previewDeveloper?.name || '—'}
                        </div>
                        <div className="font-mono text-[10px] text-linnk-stone-600">
                          CNPJ: {formatCNPJ(previewDeveloper?.cnpj) || previewDeveloper?.cnpj || '—'}
                        </div>
                      </div>
                      <div className="p-2.5 border-b sm:border-b-0 sm:border-r border-linnk-stone-300">
                        <div className="text-[10px] font-mono uppercase text-linnk-stone-500">
                          Registro de Incorporação
                        </div>
                        <div className="font-mono font-semibold text-[#161316] mt-0.5">
                          {previewDev?.incorporationRegistry || '—'}
                        </div>
                        <div className="text-[10px] text-linnk-stone-600">
                          {previewDev?.neighborhood} · {previewDev?.city}/BA
                        </div>
                      </div>
                      <div className="p-2.5">
                        <div className="text-[10px] font-mono uppercase text-linnk-stone-500">
                          Partilha de Honorários
                        </div>
                        <div className="font-display font-bold text-xs text-linnk-flame mt-0.5">
                          50% Corretor · 50% LINNK
                        </div>
                        <div className="text-[10px] text-linnk-stone-600">
                          Proteção integral por 180 dias
                        </div>
                      </div>
                    </div>
                    {previewReferral.notes && (
                      <div className="px-3 py-2 bg-white text-linnk-stone-700">
                        <span className="font-semibold text-[#161316]">
                          Contexto / Perfil Registrado na Indicação:{' '}
                        </span>
                        {previewReferral.notes}
                      </div>
                    )}
                  </div>
                </div>

                {/* 5. CLÁUSULAS E CONDIÇÕES JURÍDICAS */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between border-b border-linnk-stone-300 pb-1">
                    <h2 className="font-display font-bold text-xs uppercase tracking-wider text-[#161316]">
                      Quadro III — Cláusulas de Consentimento LGPD, Proteção Cartorial e Regras de Negócio
                    </h2>
                    <span className="text-[10px] font-mono text-linnk-stone-500">
                      Seção 03/04
                    </span>
                  </div>

                  <div className="space-y-2.5 text-[11.5px] leading-relaxed text-justify text-[#161316]">
                    <p>
                      <strong>
                        CLÁUSULA 1ª — DO OBJETO E CONSENTIMENTO LIVRE E ESCLARECIDO (ART. 7º, I DA
                        LEI Nº 13.709/2018 – LGPD):
                      </strong>{' '}
                      Pelo presente instrumento particular, o(a){' '}
                      <strong>CLIENTE INDICADO(A) (TITULAR DOS DADOS)</strong>, qualificado(a) no
                      Quadro I, manifesta seu consentimento livre, informado, expresso e inequívoco
                      para que seus dados pessoais de identificação e contato sejam compartilhados
                      pelo(a) <strong>CORRETOR(A) PARCEIRO(A) INDICADOR(A)</strong> com a{' '}
                      <strong>LINNK CURADORIA IMOBILIÁRIA</strong> e com a respectiva Incorporadora
                      do empreendimento, para a finalidade estrita de apresentação consultiva,
                      agendamento de visitas técnicas, envio de materiais informativos, simulações
                      financeiras e eventual formalização de proposta de aquisição imobiliária.
                    </p>

                    <p>
                      <strong>
                        CLÁUSULA 2ª — DA PROTEÇÃO DE CARTEIRA E EXCLUSIVIDADE TEMPORAL (180 DIAS / 6
                        MESES):
                      </strong>{' '}
                      Fica formalmente reconhecida a anterioridade da apresentação comercial
                      realizada pelo(a) Corretor(a) Parceiro(a), garantindo-lhe a proteção integral
                      de carteira pelo prazo de <strong>6 (seis) meses (180 dias corridos)</strong>{' '}
                      a contar da data de registro desta indicação (vigente até{' '}
                      <strong>{formatDateBR(previewReferral.protectionExpiresAt)}</strong>). A
                      referida proteção abrange tanto o empreendimento de interesse inicial listado
                      no Quadro II quanto{' '}
                      <strong>
                        qualquer outro empreendimento integrante do Portfólio de Curadoria LINNK
                      </strong>{' '}
                      que venha a ser adquirido pelo(a) Cliente Indicado(a) durante o período de
                      vigência.
                    </p>

                    <p>
                      <strong>
                        CLÁUSULA 3ª — DA MODALIDADE DE ATENDIMENTO ELEITA (
                        {previewReferral.modality}):
                      </strong>{' '}
                      As partes declaram ciência de que a presente indicação foi registrada sob a
                      modalidade{' '}
                      <strong>
                        {previewReferral.modality === 'INDICA'
                          ? 'INDICA (na qual o especialista Closer da LINNK conduz integralmente a apresentação técnica, negociação e fechamento junto ao Cliente, mantendo o Corretor Parceiro informado em tempo real)'
                          : 'CONECTA (na qual o próprio Corretor Parceiro conduz o atendimento direto ao Cliente com suporte estratégico, material técnico e retaguarda operacional da equipe LINNK)'}
                      </strong>
                      .
                    </p>

                    <p>
                      <strong>
                        CLÁUSULA 4ª — DA PARTILHA PARITÁRIA DE HONORÁRIOS DE CORRETAGEM (50% / 50%):
                      </strong>{' '}
                      Em caso de concretização de negócio jurídico de compra e venda imobiliária
                      pelo(a) Cliente Indicado(a) dentro do prazo de proteção estabelecido na
                      Cláusula 2ª, fica assegurada ao(à) Corretor(a) Parceiro(a) Indicador(a) a
                      participação de <strong>50% (cinquenta por cento)</strong> sobre a comissão
                      destinada à intermediação parceira LINNK, cujo repasse financeiro ocorrerá em
                      estrita conformidade com o fluxo de recebimento junto à Incorporadora.
                    </p>

                    <p>
                      <strong>
                        CLÁUSULA 5ª — DOS DIREITOS DO TITULAR E SEGURANÇA DA INFORMAÇÃO (ART. 18 DA
                        LGPD):
                      </strong>{' '}
                      A LINNK compromete-se a armazenar este instrumento e os dados pessoais dele
                      constantes em ambiente digital privado e criptografado, vedando seu uso para
                      finalidades diversas das aqui pactuadas. O(A) Titular poderá, a qualquer
                      tempo, solicitar a confirmação de tratamento, atualização cadastral ou a
                      revogação deste consentimento mediante comunicação formal aos canais de
                      atendimento da LINNK.
                    </p>
                  </div>
                </div>

                {/* 6. DECLARAÇÃO DE CIÊNCIA & CHECKLIST FORMAL */}
                <div className="bg-linnk-stone-50 border border-linnk-stone-300 rounded-lg p-3.5 space-y-2 text-[11px]">
                  <div className="font-display font-bold uppercase tracking-wider text-[#161316] text-[10.5px]">
                    Declaração Expressa de Ciência e Concordância
                  </div>
                  <div className="space-y-1.5 text-linnk-stone-800">
                    <div className="flex items-start gap-2">
                      <span className="inline-block w-3.5 h-3.5 border border-[#161316] rounded-xs text-center leading-3 font-bold text-[10px] shrink-0 mt-0.5">
                        ✓
                      </span>
                      <span>
                        O(A) <strong>Cliente Indicado(a)</strong> confirma que foi previamente
                        contatado(a) pelo(a) Corretor(a) Parceiro(a) acima identificado(a) e
                        autoriza o contato consultivo pela curadoria <strong>LINNK</strong>.
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="inline-block w-3.5 h-3.5 border border-[#161316] rounded-xs text-center leading-3 font-bold text-[10px] shrink-0 mt-0.5">
                        ✓
                      </span>
                      <span>
                        A liberação do atendimento comercial está condicionada à juntada deste
                        instrumento assinado e à respectiva validação pela mesa de Compliance da
                        LINNK.
                      </span>
                    </div>
                  </div>
                </div>

                {/* 7. LOCAL, DATA E BLOCO DE ASSINATURAS */}
                <div className="space-y-6 pt-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs border-b border-linnk-stone-200 pb-2">
                    <div>
                      <strong>Local e Data:</strong>{' '}
                      {previewBroker?.city
                        ? `${previewBroker.city} — ${previewBroker.state || 'BA'}`
                        : previewDev?.city || 'Bahia'}
                      , {formatDateBR(previewReferral.createdAt)}.
                    </div>
                    <div className="font-mono text-[11px] text-linnk-stone-600">
                      Status Documental:{' '}
                      <strong className="text-[#161316]">
                        {previewDoc?.status === 'APROVADO'
                          ? 'ASSINATURA CONFERIDA E VALIDADA'
                          : previewDoc?.status === 'RECEBIDO_AGUARDANDO_CONFERENCIA'
                          ? 'RECEBIDO · EM CONFERÊNCIA'
                          : 'AGUARDANDO ASSINATURA DO TITULAR'}
                      </strong>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 text-center text-xs">
                    {/* Assinatura 1: Cliente */}
                    <div className="flex flex-col justify-end">
                      <div className="h-12 flex items-end justify-center pb-1">
                        {previewDoc?.status === 'APROVADO' ||
                        previewDoc?.status === 'RECEBIDO_AGUARDANDO_CONFERENCIA' ? (
                          <span className="font-serif italic text-base text-linnk-stone-700 select-none">
                            {previewClient?.name}
                          </span>
                        ) : null}
                      </div>
                      <div className="border-t border-[#161316] pt-2">
                        <div className="font-display font-bold text-[#161316] uppercase text-[11px]">
                          {previewClient?.name}
                        </div>
                        <div className="text-[10px] text-linnk-stone-600">
                          Cliente Indicado(a) · Titular dos Dados
                        </div>
                        <div className="font-mono text-[9.5px] text-linnk-stone-500 mt-0.5">
                          Tel: {previewClient?.phone}
                        </div>
                      </div>
                    </div>

                    {/* Assinatura 2: Corretor Parceiro */}
                    <div className="flex flex-col justify-end">
                      <div className="h-12 flex items-end justify-center pb-1">
                        <span className="font-serif italic text-base text-linnk-stone-700 select-none">
                          {previewBroker?.name}
                        </span>
                      </div>
                      <div className="border-t border-[#161316] pt-2">
                        <div className="font-display font-bold text-[#161316] uppercase text-[11px]">
                          {previewBroker?.name}
                        </div>
                        <div className="text-[10px] text-linnk-stone-600">
                          Corretor(a) Parceiro(a) Indicador(a)
                        </div>
                        <div className="font-mono text-[9.5px] text-linnk-stone-500 mt-0.5">
                          {previewBroker?.creci} · {previewBroker?.city}/{previewBroker?.state}
                        </div>
                      </div>
                    </div>

                    {/* Assinatura 3: Compliance LINNK */}
                    <div className="flex flex-col justify-end">
                      <div className="h-12 flex items-end justify-center pb-1">
                        {previewDoc?.status === 'APROVADO' ? (
                          <div className="border border-emerald-700 text-emerald-800 bg-emerald-50/70 px-2.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider">
                            ✓ CONFERIDO E APROVADO · LINNK
                          </div>
                        ) : (
                          <span className="text-[10px] font-mono text-linnk-stone-400">
                            [ Carimbo / Validação Operacional ]
                          </span>
                        )}
                      </div>
                      <div className="border-t border-[#161316] pt-2">
                        <div className="font-display font-bold text-[#161316] uppercase text-[11px]">
                          Mesa de Governança & Compliance
                        </div>
                        <div className="text-[10px] text-linnk-stone-600">
                          LINNK Curadoria Imobiliária
                        </div>
                        <div className="font-mono text-[9.5px] text-linnk-stone-500 mt-0.5">
                          {previewDoc?.reviewedAt
                            ? `Validado em ${formatDateTimeBR(previewDoc.reviewedAt)}`
                            : 'Sujeito à conferência de assinatura'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 8. RODAPÉ DE AUTENTICIDADE E RASTREABILIDADE */}
                <div className="border-t-2 border-[#161316] pt-3 mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[10px] font-mono text-linnk-stone-600">
                  <div>
                    <div>
                      <strong>AUTENTICIDADE DOCUMENTAL:</strong> Protocolo {previewReferral.code} ·
                      Template {previewDoc?.templateVersion || 'TERMO-CONSENTIMENTO-v1.2'}
                    </div>
                    <div>
                      Chave de Armazenamento Seguro:{' '}
                      <span className="text-[#161316]">
                        {previewDoc?.storageKey ||
                          `private-bucket/consent-terms/${previewReferral.code.toLowerCase()}.pdf`}
                      </span>
                    </div>
                  </div>
                  <div className="sm:text-right shrink-0">
                    <div className="font-bold text-[#161316]">
                      LINNK · GESTÃO DE PARCERIAS IMOBILIÁRIAS
                    </div>
                    <div>Via Única Digital / Impressa · Página 1 de 1</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
