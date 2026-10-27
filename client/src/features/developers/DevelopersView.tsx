import React, { useState } from 'react';
import { Building, Edit3, Lock, Mail, Phone, Plus, Power, X } from 'lucide-react';
import { useApp } from '../../app/AppContext';
import { Developer } from '../../app/types';

export const DevelopersView: React.FC = () => {
  const {
    currentUser,
    developers,
    developments,
    saveDeveloper,
    toggleDeveloperActive,
  } = useApp();

  const [showModal, setShowModal] = useState(false);
  const [editingDev, setEditingDev] = useState<Developer | null>(null);

  const [name, setName] = useState('');
  const [legalName, setLegalName] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [city, setCity] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');

  const canEdit =
    currentUser?.role === 'ADMIN' ||
    Boolean(currentUser?.permissions?.canEditDevelopments);

  const openCreate = () => {
    setEditingDev(null);
    setName('');
    setLegalName('');
    setCnpj('');
    setCity('');
    setContactName('');
    setContactEmail('');
    setContactPhone('');
    setShowModal(true);
  };

  const openEdit = (d: Developer) => {
    setEditingDev(d);
    setName(d.name);
    setLegalName(d.legalName);
    setCnpj(d.cnpj);
    setCity(d.city);
    setContactName(d.contactName);
    setContactEmail(d.contactEmail);
    setContactPhone(d.contactPhone);
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit || !name.trim()) return;
    saveDeveloper(
      {
        name: name.trim(),
        legalName: legalName.trim() || name.trim(),
        cnpj: cnpj.trim(),
        city: city.trim(),
        contactName: contactName.trim(),
        contactEmail: contactEmail.trim(),
        contactPhone: contactPhone.trim(),
        paymentRuleDescription: editingDev?.paymentRuleDescription || '',
        active: editingDev ? editingDev.active : true,
      },
      editingDev?.id
    );
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-6 border border-linnk-stone-300/80 shadow-arch-card flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-linnk-flame">
            <Building className="w-4 h-4" />
            <span>Parceiros Construtores</span>
          </div>
          <h2 className="font-display font-bold text-2xl text-linnk-obsidian mt-1">
            Incorporadoras e Construtoras Parceiras
          </h2>
          <p className="text-sm text-linnk-stone-600 mt-1">
            Entidades comerciais associadas aos lançamentos da curadoria LINNK, com CNPJ e
            regras contratuais de pagamento de comissão.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {!canEdit && (
            <span className="px-3.5 py-2 rounded-2xl bg-linnk-stone-100 text-xs font-mono text-linnk-stone-600 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-rose-500" /> Modo Consulta
            </span>
          )}
          <button
            disabled={!canEdit}
            onClick={openCreate}
            className="px-5 py-2.5 rounded-2xl bg-linnk-flame hover:bg-linnk-flame-600 text-white font-display font-bold text-xs sm:text-sm shadow-flame-sm flex items-center gap-2 disabled:opacity-40"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Incorporadora</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {developers.length === 0 ? (
          <div className="col-span-full bg-white rounded-3xl p-12 border border-linnk-stone-300/80 shadow-arch-card text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-linnk-stone-100 text-linnk-stone-400 mx-auto flex items-center justify-center">
              <Building className="w-6 h-6" />
            </div>
            <h3 className="font-display font-bold text-lg text-linnk-obsidian">
              Nenhuma incorporadora cadastrada
            </h3>
            <p className="text-xs text-linnk-stone-500 max-w-md mx-auto leading-relaxed">
              Cadastre incorporadoras e construtoras parceiras com dados de contato e regras de pagamento de comissão.
            </p>
          </div>
        ) : (
          developers.map((dv) => {
          const linkedDevs = developments.filter((d) => d.developerId === dv.id);
          return (
            <div
              key={dv.id}
              className={`bg-white rounded-3xl p-6 border shadow-arch-card flex flex-col justify-between ${
                dv.active ? 'border-linnk-stone-300/80' : 'opacity-60 bg-linnk-stone-100'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs text-linnk-stone-500">
                    CNPJ: {dv.cnpj}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                      dv.active
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-stone-200 text-stone-600'
                    }`}
                  >
                    {dv.active ? 'Parceria Ativa' : 'Inativa'}
                  </span>
                </div>

                <h3 className="font-display font-bold text-xl text-linnk-obsidian mt-2">
                  {dv.name}
                </h3>
                <p className="text-xs text-linnk-stone-500">{dv.legalName}</p>

                <div className="mt-4 p-3.5 rounded-2xl bg-linnk-stone-50 border border-linnk-stone-200 text-xs space-y-1.5">
                  {dv.paymentRuleDescription && (
                    <div>
                      <span className="text-linnk-stone-500">Regra de Pagamento: </span>
                      <strong className="text-linnk-obsidian">
                        {dv.paymentRuleDescription}
                      </strong>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-4 pt-1 text-linnk-stone-600">
                    <span>Executivo: {dv.contactName}</span>
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-linnk-flame" /> {dv.contactPhone}
                    </span>
                    <span className="flex items-center gap-1">
                      <Mail className="w-3 h-3 text-linnk-flame" /> {dv.contactEmail}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-linnk-stone-200 flex items-center justify-between text-xs">
                <span className="text-linnk-stone-600">
                  Empreendimentos vinculados: <strong>{linkedDevs.length}</strong>
                </span>
                {canEdit && (
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => openEdit(dv)}
                      className="px-3 py-1.5 rounded-xl bg-linnk-stone-100 hover:bg-linnk-stone-200 font-display font-semibold flex items-center gap-1"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Editar
                    </button>
                    <button
                      onClick={() => toggleDeveloperActive(dv.id)}
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

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-linnk-stone-300 shadow-obsidian">
            <div className="bg-linnk-obsidian text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-display font-bold text-lg">
                {editingDev ? 'Editar Incorporadora' : 'Nova Incorporadora'}
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
                <div>
                  <label className="block text-xs font-semibold mb-1">Nome *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-linnk-stone-50 border border-linnk-stone-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">CNPJ *</label>
                  <input
                    type="text"
                    required
                    value={cnpj}
                    onChange={(e) => setCnpj(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-linnk-stone-50 border border-linnk-stone-300 font-mono"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold mb-1">Razão Social SPE</label>
                  <input
                    type="text"
                    value={legalName}
                    onChange={(e) => setLegalName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-linnk-stone-50 border border-linnk-stone-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Responsável Comercial</label>
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-linnk-stone-50 border border-linnk-stone-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Telefone</label>
                  <input
                    type="text"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
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
                  Salvar Incorporadora
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
