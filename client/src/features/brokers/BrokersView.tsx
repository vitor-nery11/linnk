import React, { useState } from 'react';
import {
  Award,
  CheckCircle2,
  Edit3,
  Eye,
  Lock,
  MapPin,
  Plus,
  Power,
  Search,
  UserCheck,
  X,
} from 'lucide-react';
import { useApp } from '../../app/AppContext';
import { Broker, Modality } from '../../app/types';
import { formatCentsToBRL } from '../../lib/formatters';
import { ModalityBadge, ReferralStatusBadge } from '../../components/StatusBadges';

export const BrokersView: React.FC = () => {
  const {
    currentUser,
    brokers,
    referrals,
    sales,
    clients,
    saveBroker,
    toggleBrokerActive,
    setSelectedReferralId,
    setActiveNav,
  } = useApp();

  const [search, setSearch] = useState('');
  const [selectedBrokerId, setSelectedBrokerId] = useState<string | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingBroker, setEditingBroker] = useState<Broker | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [creci, setCreci] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('BA');
  const [defaultModality, setDefaultModality] = useState<Modality>('INDICA');
  const [isFoundingMember, setIsFoundingMember] = useState(false);
  const [adhesionTermSigned, setAdhesionTermSigned] = useState(false);
  const [ndaTermSigned, setNdaTermSigned] = useState(false);
  const [pixKey, setPixKey] = useState('');

  const canEdit =
    currentUser?.role === 'ADMIN' || Boolean(currentUser?.permissions?.canEditBrokers);

  const openCreateModal = () => {
    setEditingBroker(null);
    setName('');
    setEmail('');
    setPhone('');
    setCreci('');
    setCity('');
    setState('BA');
    setDefaultModality('INDICA');
    setIsFoundingMember(false);
    setAdhesionTermSigned(false);
    setNdaTermSigned(false);
    setPixKey('');
    setShowFormModal(true);
  };

  const openEditModal = (b: Broker) => {
    setEditingBroker(b);
    setName(b.name);
    setEmail(b.email);
    setPhone(b.phone);
    setCreci(b.creci);
    setCity(b.city);
    setState(b.state);
    setDefaultModality(b.defaultModality);
    setIsFoundingMember(b.isFoundingMember);
    setAdhesionTermSigned(b.adhesionTermSigned);
    setNdaTermSigned(b.ndaTermSigned);
    setPixKey(b.pixKey);
    setShowFormModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit || !name.trim() || !phone.trim()) return;
    saveBroker(
      {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        creci: creci.trim(),
        city: city.trim(),
        state: state.trim(),
        defaultModality,
        isFoundingMember,
        adhesionTermSigned,
        ndaTermSigned,
        pixKey: pixKey.trim(),
        active: editingBroker ? editingBroker.active : true,
      },
      editingBroker?.id
    );
    setShowFormModal(false);
  };

  const filteredBrokers = brokers.filter((b) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      b.name.toLowerCase().includes(q) ||
      b.city.toLowerCase().includes(q) ||
      b.creci.toLowerCase().includes(q) ||
      b.email.toLowerCase().includes(q)
    );
  });

  const detailBroker = brokers.find((b) => b.id === selectedBrokerId) || null;
  const detailReferrals = detailBroker
    ? referrals.filter((r) => r.brokerId === detailBroker.id)
    : [];

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="bg-white rounded-3xl p-6 border border-linnk-stone-300/80 shadow-arch-card flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-linnk-flame">
            <UserCheck className="w-4 h-4" />
            <span>Rede de Parceiros & Turma Fundadora</span>
          </div>
          <h2 className="font-display font-bold text-2xl text-linnk-obsidian mt-1">
            Corretores Parceiros & Indicadores Credenciados
          </h2>
          <p className="text-sm text-linnk-stone-600 mt-1">
            Gestão de corretores autônomos e do interior (Vitória da Conquista, LEM, Barreiras,
            Salvador, Jequié, Ilhéus e Itabuna).
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
            onClick={openCreateModal}
            className="px-5 py-2.5 rounded-2xl bg-linnk-flame hover:bg-linnk-flame-600 text-white font-display font-bold text-xs sm:text-sm shadow-flame-sm flex items-center gap-2 disabled:opacity-40"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Corretor</span>
          </button>
        </div>
      </div>

      {/* Busca */}
      <div className="bg-white rounded-3xl p-4 border border-linnk-stone-300/80 shadow-arch-card flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-linnk-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar corretor por nome, cidade (Conquista, Ilhéus, LEM...), CRECI ou e-mail..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-linnk-stone-50 border border-linnk-stone-200 text-sm focus:border-linnk-flame focus:outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Lista de Corretores */}
        <div
          className={`${
            detailBroker ? 'xl:col-span-7' : 'xl:col-span-12'
          } grid grid-cols-1 md:grid-cols-2 gap-4`}
        >
          {filteredBrokers.length === 0 ? (
            <div className="col-span-full bg-white rounded-3xl p-12 border border-linnk-stone-300/80 shadow-arch-card text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-linnk-stone-100 text-linnk-stone-400 mx-auto flex items-center justify-center">
                <UserCheck className="w-6 h-6" />
              </div>
              <h3 className="font-display font-bold text-lg text-linnk-obsidian">
                Nenhum corretor encontrado
              </h3>
              <p className="text-xs text-linnk-stone-500 max-w-md mx-auto leading-relaxed">
                Cadastre novos corretores parceiros para iniciar a esteira de indicações e comissões integradas.
              </p>
            </div>
          ) : (
            filteredBrokers.map((b) => {
            const brokerRefs = referrals.filter((r) => r.brokerId === b.id);
            const brokerSales = sales.filter((s) =>
              brokerRefs.some((r) => r.id === s.referralId)
            );
            const brokerTotalCommCents = brokerSales.reduce(
              (acc, s) => acc + s.commission.brokerCommissionCents,
              0
            );

            return (
              <div
                key={b.id}
                className={`bg-white rounded-3xl p-5 border transition-all shadow-arch-card flex flex-col justify-between ${
                  !b.active
                    ? 'opacity-65 border-linnk-stone-300 bg-linnk-stone-100/60'
                    : selectedBrokerId === b.id
                    ? 'border-2 border-linnk-flame'
                    : 'border-linnk-stone-300/80'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                            b.active
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-stone-200 text-stone-600'
                          }`}
                        >
                          {b.active ? 'Ativo' : 'Inativo'}
                        </span>
                        {b.isFoundingMember && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-linnk-flame-50 text-linnk-flame border border-linnk-flame-200 flex items-center gap-1">
                            <Award className="w-3 h-3" /> Turma Fundadora
                          </span>
                        )}
                      </div>
                      <h3 className="font-display font-bold text-lg text-linnk-obsidian mt-2">
                        {b.name}
                      </h3>
                      <p className="text-xs font-mono text-linnk-stone-500">
                        {b.creci} · {b.phone}
                      </p>
                    </div>
                    <ModalityBadge modality={b.defaultModality} />
                  </div>

                  <div className="mt-3 flex items-center gap-1.5 text-xs text-linnk-stone-600">
                    <MapPin className="w-3.5 h-3.5 text-linnk-flame" />
                    <span>
                      Praça: <strong>{b.city} · {b.state}</strong>
                    </span>
                  </div>

                  {/* Situação Contratual Kit Mínimo */}
                  <div className="mt-3 pt-3 border-t border-linnk-stone-200 flex flex-wrap gap-2 text-[11px]">
                    <span
                      className={`px-2.5 py-1 rounded-lg font-medium ${
                        b.adhesionTermSigned
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      Termo Adesão: {b.adhesionTermSigned ? 'Assinado' : 'Pendente'}
                    </span>
                    <span
                      className={`px-2.5 py-1 rounded-lg font-medium ${
                        b.ndaTermSigned
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      Sigilo & Lealdade: {b.ndaTermSigned ? 'Assinado' : 'Pendente'}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-linnk-stone-200 flex items-center justify-between">
                  <div className="text-xs">
                    <span className="text-linnk-stone-500">
                      Indicações: <strong>{brokerRefs.length}</strong>
                    </span>
                    {brokerTotalCommCents > 0 && (
                      <span className="ml-3 font-mono font-bold text-emerald-700">
                        50%: {formatCentsToBRL(brokerTotalCommCents)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setSelectedBrokerId(b.id)}
                      className="p-2 rounded-xl bg-linnk-stone-100 hover:bg-linnk-obsidian hover:text-white text-xs font-display font-semibold flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Indicações</span>
                    </button>
                    {canEdit && (
                      <>
                        <button
                          onClick={() => openEditModal(b)}
                          title="Editar cadastro"
                          className="p-2 rounded-xl bg-linnk-stone-100 hover:bg-linnk-stone-200 text-linnk-obsidian"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => toggleBrokerActive(b.id)}
                          title={b.active ? 'Inativar Corretor' : 'Reativar Corretor'}
                          className="p-2 rounded-xl bg-linnk-stone-100 hover:bg-rose-50 hover:text-rose-600 text-linnk-stone-600"
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        </div>

        {/* Drawer de Detalhes do Corretor e Indicações Vinculadas */}
        {detailBroker && (
          <div className="xl:col-span-5 bg-white rounded-3xl border-2 border-linnk-obsidian shadow-obsidian overflow-hidden">
            <div className="bg-linnk-obsidian text-white p-6 flex items-start justify-between">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-widest text-linnk-flame">
                  Ficha do Parceiro
                </span>
                <h3 className="font-display font-bold text-xl mt-1">
                  {detailBroker.name}
                </h3>
                <p className="text-xs font-mono text-linnk-stone-300 mt-0.5">
                  {detailBroker.creci} · {detailBroker.city}/{detailBroker.state}
                </p>
              </div>
              <button
                onClick={() => setSelectedBrokerId(null)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-linnk-stone-50 p-4 rounded-2xl border border-linnk-stone-200">
                <div>
                  <span className="text-linnk-stone-500 block">E-mail</span>
                  <strong className="text-linnk-obsidian">{detailBroker.email}</strong>
                </div>
                <div>
                  <span className="text-linnk-stone-500 block">Chave PIX p/ Repasse 50%</span>
                  <strong className="font-mono text-linnk-obsidian">
                    {detailBroker.pixKey}
                  </strong>
                </div>
              </div>

              <div>
                <h4 className="font-mono uppercase tracking-wider text-linnk-stone-500 mb-2.5">
                  Indicações Vinculadas a este Corretor ({detailReferrals.length})
                </h4>
                {detailReferrals.length === 0 ? (
                  <p className="text-linnk-stone-500 bg-linnk-stone-50 p-4 rounded-2xl">
                    Nenhuma indicação registrada para este corretor ainda.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {detailReferrals.map((r) => {
                      const cli = clients.find((c) => c.id === r.clientId);
                      return (
                        <div
                          key={r.id}
                          onClick={() => {
                            setSelectedReferralId(r.id);
                            setActiveNav('referrals');
                          }}
                          className="p-3.5 rounded-2xl bg-linnk-stone-50 hover:bg-linnk-flame-50 border border-linnk-stone-200 cursor-pointer flex items-center justify-between gap-2"
                        >
                          <div>
                            <span className="font-mono font-bold text-linnk-flame">
                              {r.code}
                            </span>
                            <div className="font-display font-bold text-sm text-linnk-obsidian">
                              {cli?.name}
                            </div>
                          </div>
                          <ReferralStatusBadge status={r.status} />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Cadastro / Edição de Corretor */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto border border-linnk-stone-300 shadow-obsidian">
            <div className="bg-linnk-obsidian text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-display font-bold text-lg">
                {editingBroker ? 'Editar Corretor Parceiro' : 'Novo Corretor Parceiro'}
              </h3>
              <button
                onClick={() => setShowFormModal(false)}
                className="p-1.5 rounded-xl bg-white/10 text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1">Nome Completo *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-linnk-stone-50 border border-linnk-stone-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    CRECI ou Contrato Indicador *
                  </label>
                  <input
                    type="text"
                    required
                    value={creci}
                    onChange={(e) => setCreci(e.target.value)}
                    placeholder="Ex.: CRECI-BA 25.100"
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-linnk-stone-50 border border-linnk-stone-300 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">WhatsApp *</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(77) 99900-0000"
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-linnk-stone-50 border border-linnk-stone-300 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">E-mail</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-linnk-stone-50 border border-linnk-stone-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Cidade / Praça</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-linnk-stone-50 border border-linnk-stone-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Modalidade Preferencial
                  </label>
                  <select
                    value={defaultModality}
                    onChange={(e) => setDefaultModality(e.target.value as Modality)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-linnk-stone-50 border border-linnk-stone-300"
                  >
                    <option value="INDICA">INDICA (Closer LINNK)</option>
                    <option value="CONECTA">CONECTA (Corretor Atende)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">
                  Chave PIX para Repasses de 50%
                </label>
                <input
                  type="text"
                  value={pixKey}
                  onChange={(e) => setPixKey(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-linnk-stone-50 border border-linnk-stone-300 font-mono"
                />
              </div>

              <div className="flex flex-wrap gap-4 pt-2 text-xs">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFoundingMember}
                    onChange={(e) => setIsFoundingMember(e.target.checked)}
                    className="accent-linnk-flame"
                  />
                  <span>Turma Fundadora LINNK</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={adhesionTermSigned}
                    onChange={(e) => setAdhesionTermSigned(e.target.checked)}
                    className="accent-linnk-flame"
                  />
                  <span>Termo de Adesão Assinado</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={ndaTermSigned}
                    onChange={(e) => setNdaTermSigned(e.target.checked)}
                    className="accent-linnk-flame"
                  />
                  <span>Termo de Sigilo & Lealdade</span>
                </label>
              </div>

              <div className="pt-4 border-t border-linnk-stone-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="px-4 py-2 rounded-xl bg-linnk-stone-100 text-xs font-display font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-linnk-flame text-white text-xs font-display font-bold"
                >
                  Salvar Corretor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
