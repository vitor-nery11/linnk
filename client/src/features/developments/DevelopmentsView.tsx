import React, { useState } from 'react';
import {
  Award,
  Building2,
  CheckCircle2,
  Edit3,
  Lock,
  MapPin,
  Plus,
  Power,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useApp } from '../../app/AppContext';
import { Development } from '../../app/types';
import { formatCentsToBRL, parseBRLToCents } from '../../lib/formatters';

export const DevelopmentsView: React.FC = () => {
  const {
    currentUser,
    developments,
    developers,
    referrals,
    sales,
    saveDevelopment,
    toggleDevelopmentActive,
  } = useApp();

  const [showModal, setShowModal] = useState(false);
  const [editingDev, setEditingDev] = useState<Development | null>(null);

  const [developerId, setDeveloperId] = useState(developers[0]?.id || '');
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [incorporationRegistry, setIncorporationRegistry] = useState('');
  const [affectationPatrimony, setAffectationPatrimony] = useState(false);
  const [constructionStatus, setConstructionStatus] =
    useState<Development['constructionStatus']>('LANCAMENTO');
  const [defaultCommissionRate, setDefaultCommissionRate] = useState('4.0');
  const [averageTicketInput, setAverageTicketInput] = useState('');

  const canEdit =
    currentUser?.role === 'ADMIN' ||
    Boolean(currentUser?.permissions?.canEditDevelopments);

  const openCreate = () => {
    setEditingDev(null);
    setDeveloperId(developers[0]?.id || '');
    setName('');
    setCity('');
    setNeighborhood('');
    setIncorporationRegistry('');
    setAffectationPatrimony(false);
    setConstructionStatus('LANCAMENTO');
    setDefaultCommissionRate('4.0');
    setAverageTicketInput('');
    setShowModal(true);
  };

  const openEdit = (d: Development) => {
    setEditingDev(d);
    setDeveloperId(d.developerId);
    setName(d.name);
    setCity(d.city);
    setNeighborhood(d.neighborhood);
    setIncorporationRegistry(d.incorporationRegistry);
    setAffectationPatrimony(d.affectationPatrimony);
    setConstructionStatus(d.constructionStatus);
    setDefaultCommissionRate(String(d.defaultCommissionRate));
    setAverageTicketInput(String(d.averageTicketCents / 100));
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit || !name.trim()) return;
    saveDevelopment(
      {
        developerId,
        name: name.trim(),
        city: city.trim(),
        neighborhood: neighborhood.trim(),
        incorporationRegistry: incorporationRegistry.trim(),
        affectationPatrimony,
        constructionStatus,
        defaultCommissionRate: parseFloat(defaultCommissionRate) || 4.0,
        averageTicketCents: parseBRLToCents(averageTicketInput) || 0,
        linnkSealVerified: true,
        active: editingDev ? editingDev.active : true,
      },
      editingDev?.id
    );
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="bg-white rounded-3xl p-6 border border-linnk-stone-300/80 shadow-arch-card flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-linnk-flame">
            <Award className="w-4 h-4" />
            <span>Portfólio & Selo de Curadoria LINNK</span>
          </div>
          <h2 className="font-display font-bold text-2xl text-linnk-obsidian mt-1">
            Empreendimentos Homologados na Curadoria
          </h2>
          <p className="text-sm text-linnk-stone-600 mt-1">
            Apenas lançamentos com Registro de Incorporação, Patrimônio de Afetação e
            documentação auditada entram no portfólio comercial da LINNK.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {!canEdit && (
            <span className="px-3.5 py-2 rounded-2xl bg-linnk-stone-100 text-xs font-mono text-linnk-stone-600 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-rose-500" /> Edição Restrita
            </span>
          )}
          <button
            disabled={!canEdit}
            onClick={openCreate}
            className="px-5 py-2.5 rounded-2xl bg-linnk-flame hover:bg-linnk-flame-600 text-white font-display font-bold text-xs sm:text-sm shadow-flame-sm flex items-center gap-2 disabled:opacity-40"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Empreendimento</span>
          </button>
        </div>
      </div>

      {/* Cards dos Empreendimentos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {developments.length === 0 ? (
          <div className="col-span-full bg-white rounded-3xl p-12 border border-linnk-stone-300/80 shadow-arch-card text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-linnk-stone-100 text-linnk-stone-400 mx-auto flex items-center justify-center">
              <Building2 className="w-6 h-6" />
            </div>
            <h3 className="font-display font-bold text-lg text-linnk-obsidian">
              Nenhum empreendimento cadastrado
            </h3>
            <p className="text-xs text-linnk-stone-500 max-w-md mx-auto leading-relaxed">
              Cadastre novos empreendimentos homologados com parâmetros de comissão e critérios de curadoria.
            </p>
          </div>
        ) : (
          developments.map((dev) => {
          const developer = developers.find((dv) => dv.id === dev.developerId);
          const devReferrals = referrals.filter((r) => r.developmentId === dev.id);
          const devSales = sales.filter((s) => s.developmentId === dev.id);

          return (
            <div
              key={dev.id}
              className={`bg-white rounded-3xl p-6 border shadow-arch-card flex flex-col justify-between ${
                dev.active ? 'border-linnk-stone-300/80' : 'opacity-65 bg-linnk-stone-100'
              }`}
            >
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-linnk-obsidian text-white">
                      <ShieldCheck className="w-3.5 h-3.5 text-linnk-flame" />
                      SELO LINNK
                    </span>
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold bg-linnk-stone-100 text-linnk-stone-700">
                      {dev.constructionStatus}
                    </span>
                  </div>

                  <span className="font-mono text-xs font-bold text-linnk-flame bg-linnk-flame-50 px-3 py-1 rounded-full border border-linnk-flame-200">
                    Comissão: {dev.defaultCommissionRate}% (50/50)
                  </span>
                </div>

                <h3 className="font-display font-bold text-xl text-linnk-obsidian">
                  {dev.name}
                </h3>
                <p className="text-xs text-linnk-stone-600 mt-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-linnk-flame" />
                  <span>
                    {dev.neighborhood} · <strong>{dev.city}</strong> · Incorporadora:{' '}
                    <strong>{developer?.name}</strong>
                  </span>
                </p>

                <div className="mt-4 p-3.5 rounded-2xl bg-linnk-stone-50 border border-linnk-stone-200 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-linnk-stone-500">Registro de Incorporação:</span>
                    <span className="font-mono font-semibold text-linnk-obsidian">
                      {dev.incorporationRegistry}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-linnk-stone-500">Patrimônio de Afetação:</span>
                    <span className="font-semibold text-emerald-700">
                      {dev.affectationPatrimony ? 'Sim · Auditado' : 'Em análise'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-linnk-stone-500">Ticket Médio Estimado:</span>
                    <span className="font-mono font-bold text-linnk-obsidian">
                      {formatCentsToBRL(dev.averageTicketCents, true)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-linnk-stone-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-4 text-linnk-stone-600">
                  <span>
                    Indicações: <strong>{devReferrals.length}</strong>
                  </span>
                  <span>
                    Vendas Confirmadas: <strong>{devSales.length}</strong>
                  </span>
                </div>

                {canEdit && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openEdit(dev)}
                      className="px-3 py-1.5 rounded-xl bg-linnk-stone-100 hover:bg-linnk-stone-200 font-display font-semibold flex items-center gap-1"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Editar</span>
                    </button>
                    <button
                      onClick={() => toggleDevelopmentActive(dev.id)}
                      title="Inativar / Reativar"
                      className="p-1.5 rounded-xl bg-linnk-stone-100 hover:bg-rose-50 hover:text-rose-600"
                    >
                      <Power className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })
      )}
      </div>

      {/* Modal de Empreendimento */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto border border-linnk-stone-300 shadow-obsidian">
            <div className="bg-linnk-obsidian text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-display font-bold text-lg">
                {editingDev ? 'Editar Empreendimento' : 'Homologar Novo Empreendimento'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-xl bg-white/10 text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold mb-1">
                    Nome do Empreendimento *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex.: Brisa do Atlântico Residence"
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-linnk-stone-50 border border-linnk-stone-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Incorporadora Responsável *
                  </label>
                  <select
                    value={developerId}
                    onChange={(e) => setDeveloperId(e.target.value)}
                    disabled={developers.length === 0}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-linnk-stone-50 border border-linnk-stone-300 disabled:opacity-60"
                  >
                    {developers.length === 0 ? (
                      <option value="">Nenhuma incorporadora cadastrada</option>
                    ) : (
                      <>
                        <option value="">Selecione uma incorporadora</option>
                        {developers.map((dv) => (
                          <option key={dv.id} value={dv.id}>
                            {dv.name}
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Cidade / Eixo *</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-linnk-stone-50 border border-linnk-stone-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Bairro / Local</label>
                  <input
                    type="text"
                    value={neighborhood}
                    onChange={(e) => setNeighborhood(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-linnk-stone-50 border border-linnk-stone-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Estágio do Produto
                  </label>
                  <select
                    value={constructionStatus}
                    onChange={(e) =>
                      setConstructionStatus(
                        e.target.value as Development['constructionStatus']
                      )
                    }
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-linnk-stone-50 border border-linnk-stone-300"
                  >
                    <option value="PRE_LANCAMENTO">Pré-Lançamento</option>
                    <option value="LANCAMENTO">Lançamento</option>
                    <option value="EM_OBRAS">Em Obras</option>
                    <option value="PRONTO">Pronto p/ Morar</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Taxa Comissão Padrão (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={defaultCommissionRate}
                    onChange={(e) => setDefaultCommissionRate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-linnk-stone-50 border border-linnk-stone-300 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Ticket Médio (R$)
                  </label>
                  <input
                    type="text"
                    value={averageTicketInput}
                    onChange={(e) => setAverageTicketInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-linnk-stone-50 border border-linnk-stone-300 font-mono"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold mb-1">
                    Registro de Incorporação e Cartório
                  </label>
                  <input
                    type="text"
                    value={incorporationRegistry}
                    onChange={(e) => setIncorporationRegistry(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-linnk-stone-50 border border-linnk-stone-300 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-linnk-stone-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-linnk-stone-100 text-xs font-display font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-linnk-flame text-white text-xs font-display font-bold"
                >
                  Salvar Empreendimento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
