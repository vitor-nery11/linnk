import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  FileCheck,
  Lock,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Users,
  Wallet,
} from 'lucide-react';
import { useApp } from '../../app/AppContext';
import { Modality } from '../../app/types';
import { BrandLogo } from '../../components/BrandLogo';

interface BrokerRegisterScreenProps {
  onNavigateToLogin: () => void;
}

export const BrokerRegisterScreen: React.FC<BrokerRegisterScreenProps> = ({
  onNavigateToLogin,
}) => {
  const { registerBroker } = useApp();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [creci, setCreci] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('BA');
  const [defaultModality, setDefaultModality] = useState<Modality>('INDICA');
  const [pixKey, setPixKey] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [adhesionTermSigned, setAdhesionTermSigned] = useState(true);
  const [ndaTermSigned, setNdaTermSigned] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successInfo, setSuccessInfo] = useState<{
    show: boolean;
    requiresEmailConfirmation: boolean;
  } | null>(null);

  // Formatação em tempo real de telefone (71) 99999-9999
  const handlePhoneChange = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 11);
    let formatted = raw;
    if (raw.length > 2 && raw.length <= 7) {
      formatted = `(${raw.slice(0, 2)}) ${raw.slice(2)}`;
    } else if (raw.length > 7) {
      formatted = `(${raw.slice(0, 2)}) ${raw.slice(2, 7)}-${raw.slice(7)}`;
    }
    setPhone(formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg('Informe seu nome completo para emissão dos termos de parceria.');
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMsg('Informe um endereço de e-mail profissional válido.');
      return;
    }

    const rawPhone = phone.replace(/\D/g, '');
    if (rawPhone.length < 10) {
      setErrorMsg('Informe seu WhatsApp / telefone com DDD (mínimo 10 dígitos).');
      return;
    }

    if (!creci.trim()) {
      setErrorMsg('Informe seu número de CRECI ou identificação profissional.');
      return;
    }

    if (!city.trim()) {
      setErrorMsg('Informe sua cidade de atuação.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('A senha de acesso deve conter pelo menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('A confirmação da senha não coincide com a senha digitada.');
      return;
    }

    if (!adhesionTermSigned) {
      setErrorMsg('É obrigatório aceitar o Termo de Adesão e Parceria Comercial LINNK.');
      return;
    }

    if (!ndaTermSigned) {
      setErrorMsg('É obrigatório aceitar o Termo de Confidencialidade e Proteção de Clientes (NDA).');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await registerBroker({
        name: name.trim(),
        email: cleanEmail,
        phone: phone.trim(),
        creci: creci.trim(),
        city: city.trim(),
        state: state.trim() || 'BA',
        defaultModality,
        pixKey: pixKey.trim() || cleanEmail,
        password,
        adhesionTermSigned,
        ndaTermSigned,
      });

      if (!res.ok) {
        setErrorMsg(res.error || 'Não foi possível concluir seu cadastro. Verifique os dados.');
        return;
      }

      if (res.emailConfirmationRequired) {
        setSuccessInfo({
          show: true,
          requiresEmailConfirmation: true,
        });
      }
      // Se não requer confirmação de email, o AppContext já efetuou o login automático e renderizará o dashboard!
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro inesperado ao registrar corretor parceiro.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-screen w-full bg-white text-[#161316] flex flex-col lg:grid lg:grid-cols-12 overflow-hidden">
      {/* PAINEL INSTITUCIONAL ESQUERDO (Fixo no Desktop) */}
      <div className="hidden lg:flex lg:col-span-5 relative overflow-hidden bg-[#080605] text-white p-8 xl:p-12 flex-col justify-between border-r border-neutral-900 h-screen sticky top-0 shrink-0 select-none">
        {/* Camada Orgânica de Gradiente Laranja Queimado em Movimento */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className="animate-aurora-1 absolute -top-[10%] -left-[18%] w-[68%] h-[58%] rounded-full opacity-80 blur-[85px]"
            style={{
              background:
                'radial-gradient(circle, rgba(214,68,5,0.85) 0%, rgba(145,42,3,0.45) 55%, rgba(8,6,5,0) 100%)',
            }}
          />
          <div
            className="animate-aurora-2 absolute bottom-[-12%] left-[12%] w-[75%] h-[68%] rounded-full opacity-95 blur-[90px]"
            style={{
              background:
                'radial-gradient(circle, rgba(254,71,1,0.95) 0%, rgba(204,55,0,0.6) 48%, rgba(8,6,5,0) 100%)',
            }}
          />
          <div
            className="animate-aurora-3 absolute top-[22%] -right-[22%] w-[65%] h-[70%] rounded-full opacity-90 blur-[80px]"
            style={{
              background:
                'radial-gradient(circle, rgba(255,94,14,0.92) 0%, rgba(176,47,0,0.5) 52%, rgba(8,6,5,0) 100%)',
            }}
          />
        </div>

        {/* Topo: Logo */}
        <div className="relative z-10">
          <BrandLogo size="lg" variant="dark" />
        </div>

        {/* Centro: Proposta de Valor para o Corretor */}
        <div className="relative z-10 my-auto py-4 space-y-4">
          <div className="space-y-2">
            <h2 className="text-2xl xl:text-3xl font-extrabold tracking-tight leading-[1.15] text-white">
              Monetize sua rede com <span className="text-[#f95721]">50% de comissão líquida</span> garantida.
            </h2>
            <p className="text-[13.5px] leading-relaxed text-neutral-300">
              Tenha acesso direto a empreendimentos de alto padrão selecionados, proteção de carteira por 6 meses e esteira digital completa de indicações.
            </p>
          </div>

          <div className="space-y-2.5 pt-1">
            <div className="flex items-start gap-3 p-2.5 rounded-xl bg-white/[0.04] border border-white/5">
              <div className="p-2 rounded-lg bg-[#f95721]/15 text-[#f95721] shrink-0 mt-0.5">
                <Wallet className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[13px] font-bold text-white">Divisão 50/50 Transparente</p>
                <p className="text-[11.5px] text-neutral-400 leading-snug">
                  Cálculo de comissão congelado no contrato e repasses pontuais via PIX a cada recebimento da incorporadora.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-2.5 rounded-xl bg-white/[0.04] border border-white/5">
              <div className="p-2 rounded-lg bg-[#f95721]/15 text-[#f95721] shrink-0 mt-0.5">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[13px] font-bold text-white">Proteção de Carteira (6 Meses)</p>
                <p className="text-[11.5px] text-neutral-400 leading-snug">
                  Sistema com detecção de duplicidade por telefone e e-mail que assegura o pioneirismo do seu registro.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-2.5 rounded-xl bg-white/[0.04] border border-white/5">
              <div className="p-2 rounded-lg bg-[#f95721]/15 text-[#f95721] shrink-0 mt-0.5">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[13px] font-bold text-white">Empreendimentos Auditados</p>
                <p className="text-[11.5px] text-neutral-400 leading-snug">
                  Curadoria rigorosa de incorporadoras com Patrimônio de Afetação e Registro de Incorporação em dia.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Rodapé institucional */}
        <div className="relative z-10 pt-3 border-t border-white/10 flex items-center justify-between text-[11.5px] text-neutral-400">
          <span>LINNK Tecnologia Imobiliária</span>
          <span className="flex items-center gap-1.5 text-neutral-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Cadastro Gratuito
          </span>
        </div>
      </div>

      {/* PAINEL DIREITO: FORMULÁRIO DE CADASTRO (Scrollável) */}
      <div className="flex-1 lg:col-span-7 h-screen overflow-y-auto scroll-smooth">
        <div className="flex flex-col justify-between min-h-full p-6 sm:p-10 lg:p-12 xl:p-16 max-w-2xl mx-auto w-full">
        {/* Header Superior com Botão de Voltar ao Login */}
        <div className="flex items-center justify-between pb-6 border-b border-gray-100">
          <div className="lg:hidden">
            <BrandLogo size="md" />
          </div>
          <button
            type="button"
            onClick={onNavigateToLogin}
            className="inline-flex items-center gap-2 text-[13px] font-semibold text-gray-600 hover:text-gray-900 transition-colors py-1.5 px-3 rounded-lg hover:bg-gray-100 cursor-pointer ml-auto"
          >
            <ArrowLeft className="w-4 h-4 text-gray-500" />
            <span>Já tem conta? Fazer login</span>
          </button>
        </div>

        {/* Card de Sucesso (se confirmação de e-mail estiver ativada no Supabase) */}
        {successInfo?.show ? (
          <div className="my-auto py-12 text-center space-y-6 max-w-md mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-gray-900">Cadastro Realizado com Sucesso!</h2>
              <p className="text-[14px] text-gray-600 leading-relaxed">
                Seu cadastro de corretor parceiro foi gerado. Se o seu projeto estiver configurado com confirmação de e-mail, verifique sua caixa de entrada no e-mail <strong className="text-gray-900">{email}</strong>.
              </p>
            </div>
            <div className="pt-4">
              <button
                type="button"
                onClick={onNavigateToLogin}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#18181b] hover:bg-[#27272a] text-white text-[14px] font-semibold rounded-xl shadow-md transition-all cursor-pointer"
              >
                <span>Ir para a Tela de Login</span>
                <ArrowRight className="w-4 h-4 text-[#f95721]" />
              </button>
            </div>
          </div>
        ) : (
          <div className="my-6">
            <div className="mb-6">
              <span className="text-[11.5px] font-bold uppercase tracking-wider text-[#f95721] bg-orange-50 px-2.5 py-1 rounded-md">
                Parceria Comercial
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900 mt-2 mb-1.5">
                Cadastre-se como Corretor
              </h1>
              <p className="text-[13.5px] text-gray-500 leading-relaxed">
                Preencha seus dados cadastrais para começar a indicar clientes e acessar a tabela de empreendimentos.
              </p>
            </div>

            {/* Mensagem de Erro */}
            {errorMsg && (
              <div
                role="alert"
                className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-[13px] flex items-start gap-2.5 animate-fadeIn"
              >
                <span className="font-bold shrink-0 mt-0.5">⚠️</span>
                <span className="leading-snug">{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Seção 1: Dados Pessoais */}
              <div className="space-y-4">
                <h3 className="text-[13px] font-bold text-gray-700 uppercase tracking-wide flex items-center gap-1.5 border-b border-gray-100 pb-1.5">
                  <Briefcase className="w-4 h-4 text-[#f95721]" />
                  <span>Dados Profissionais</span>
                </h3>

                {/* Nome Completo */}
                <div>
                  <label className="block text-[13px] font-semibold text-gray-700 mb-1" htmlFor="reg-name">
                    Nome Completo *
                  </label>
                  <input
                    id="reg-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Vitor Nery Santana"
                    className="w-full px-3.5 py-2.5 text-[14px] rounded-xl border border-gray-300 focus:border-[#f95721] focus:ring-1 focus:ring-[#f95721] outline-none transition-all"
                  />
                </div>

                {/* Grid: E-mail e WhatsApp */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[13px] font-semibold text-gray-700 mb-1" htmlFor="reg-email">
                      E-mail Profissional *
                    </label>
                    <div className="relative flex items-center">
                      <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 pointer-events-none" />
                      <input
                        id="reg-email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="corretor@linnk.com.br"
                        className="w-full pl-10 pr-3.5 py-2.5 text-[14px] rounded-xl border border-gray-300 focus:border-[#f95721] focus:ring-1 focus:ring-[#f95721] outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[13px] font-semibold text-gray-700 mb-1" htmlFor="reg-phone">
                      WhatsApp / Celular *
                    </label>
                    <div className="relative flex items-center">
                      <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 pointer-events-none" />
                      <input
                        id="reg-phone"
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => handlePhoneChange(e.target.value)}
                        placeholder="(71) 99999-9999"
                        className="w-full pl-10 pr-3.5 py-2.5 text-[14px] rounded-xl border border-gray-300 focus:border-[#f95721] focus:ring-1 focus:ring-[#f95721] outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Grid: CRECI, Cidade e Estado */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                  <div className="sm:col-span-5">
                    <label className="block text-[13px] font-semibold text-gray-700 mb-1" htmlFor="reg-creci">
                      CRECI / Inscrição *
                    </label>
                    <input
                      id="reg-creci"
                      type="text"
                      required
                      value={creci}
                      onChange={(e) => setCreci(e.target.value)}
                      placeholder="Ex: CRECI-BA 28.410"
                      className="w-full px-3.5 py-2.5 text-[14px] rounded-xl border border-gray-300 focus:border-[#f95721] focus:ring-1 focus:ring-[#f95721] outline-none transition-all"
                    />
                  </div>

                  <div className="sm:col-span-5">
                    <label className="block text-[13px] font-semibold text-gray-700 mb-1" htmlFor="reg-city">
                      Cidade de Atuação *
                    </label>
                    <div className="relative flex items-center">
                      <MapPin className="w-4 h-4 text-gray-400 absolute left-3.5 pointer-events-none" />
                      <input
                        id="reg-city"
                        type="text"
                        required
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Ex: Salvador"
                        className="w-full pl-10 pr-3.5 py-2.5 text-[14px] rounded-xl border border-gray-300 focus:border-[#f95721] focus:ring-1 focus:ring-[#f95721] outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[13px] font-semibold text-gray-700 mb-1" htmlFor="reg-state">
                      UF
                    </label>
                    <select
                      id="reg-state"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="w-full px-2.5 py-2.5 text-[14px] rounded-xl border border-gray-300 focus:border-[#f95721] focus:ring-1 focus:ring-[#f95721] outline-none bg-white transition-all cursor-pointer"
                    >
                      <option value="BA">BA</option>
                      <option value="SE">SE</option>
                      <option value="AL">AL</option>
                      <option value="PE">PE</option>
                      <option value="SP">SP</option>
                      <option value="RJ">RJ</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Seção 2: Modalidade de Atuação Preferencial */}
              <div className="space-y-3 pt-2">
                <label className="block text-[13px] font-semibold text-gray-700">
                  Modalidade Preferencial de Parceria
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Opção INDICA */}
                  <div
                    onClick={() => setDefaultModality('INDICA')}
                    className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                      defaultModality === 'INDICA'
                        ? 'border-[#f95721] bg-orange-50/40 shadow-xs'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[13.5px] font-bold text-gray-900">Modalidade INDICA</span>
                      <span
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          defaultModality === 'INDICA'
                            ? 'border-[#f95721] bg-[#f95721]'
                            : 'border-gray-300'
                        }`}
                      >
                        {defaultModality === 'INDICA' && <span className="w-1.5 h-1.5 bg-white rounded-full" />}
                      </span>
                    </div>
                    <p className="text-[12px] text-gray-600 leading-snug">
                      Você indica o cliente e a equipe LINNK conduz todo o atendimento comercial até a assinatura. Ideal para foco em prospecção.
                    </p>
                  </div>

                  {/* Opção CONECTA */}
                  <div
                    onClick={() => setDefaultModality('CONECTA')}
                    className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                      defaultModality === 'CONECTA'
                        ? 'border-[#f95721] bg-orange-50/40 shadow-xs'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[13.5px] font-bold text-gray-900">Modalidade CONECTA</span>
                      <span
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          defaultModality === 'CONECTA'
                            ? 'border-[#f95721] bg-[#f95721]'
                            : 'border-gray-300'
                        }`}
                      >
                        {defaultModality === 'CONECTA' && <span className="w-1.5 h-1.5 bg-white rounded-full" />}
                      </span>
                    </div>
                    <p className="text-[12px] text-gray-600 leading-snug">
                      Você participa ativamente da negociação e atendimento comercial em parceria direta com o operador LINNK.
                    </p>
                  </div>
                </div>
              </div>

              {/* Seção 3: Dados Financeiros (PIX) */}
              <div className="space-y-3 pt-2">
                <label className="block text-[13px] font-semibold text-gray-700" htmlFor="reg-pix">
                  Chave PIX para Recebimento de Comissões (50%)
                </label>
                <div className="relative flex items-center">
                  <Wallet className="w-4 h-4 text-gray-400 absolute left-3.5 pointer-events-none" />
                  <input
                    id="reg-pix"
                    type="text"
                    value={pixKey}
                    onChange={(e) => setPixKey(e.target.value)}
                    placeholder="Chave CPF, e-mail, telefone ou chave aleatória"
                    className="w-full pl-10 pr-3.5 py-2.5 text-[14px] rounded-xl border border-gray-300 focus:border-[#f95721] focus:ring-1 focus:ring-[#f95721] outline-none transition-all"
                  />
                </div>
                <p className="text-[11.5px] text-gray-500">
                  Utilizada para o repasse automático e auditado da sua parcela de 50% líquida. Você pode alterar no perfil a qualquer momento.
                </p>
              </div>

              {/* Seção 4: Senha de Acesso */}
              <div className="space-y-4 pt-2">
                <h3 className="text-[13px] font-bold text-gray-700 uppercase tracking-wide flex items-center gap-1.5 border-b border-gray-100 pb-1.5">
                  <Lock className="w-4 h-4 text-[#f95721]" />
                  <span>Senha de Acesso à Plataforma</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[13px] font-semibold text-gray-700 mb-1" htmlFor="reg-password">
                      Senha *
                    </label>
                    <div className="relative flex items-center">
                      <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 pointer-events-none" />
                      <input
                        id="reg-password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                        className="w-full pl-10 pr-10 py-2.5 text-[14px] rounded-xl border border-gray-300 focus:border-[#f95721] focus:ring-1 focus:ring-[#f95721] outline-none transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[13px] font-semibold text-gray-700 mb-1" htmlFor="reg-confirm-password">
                      Confirmar Senha *
                    </label>
                    <div className="relative flex items-center">
                      <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 pointer-events-none" />
                      <input
                        id="reg-confirm-password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repita a senha"
                        className="w-full pl-10 pr-3.5 py-2.5 text-[14px] rounded-xl border border-gray-300 focus:border-[#f95721] focus:ring-1 focus:ring-[#f95721] outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Seção 5: Termos e Governança */}
              <div className="space-y-3 pt-2 bg-gray-50/70 p-4 rounded-xl border border-gray-200">
                <div className="flex items-start gap-2.5">
                  <input
                    id="term-adhesion"
                    type="checkbox"
                    checked={adhesionTermSigned}
                    onChange={(e) => setAdhesionTermSigned(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-[#18181b] accent-[#18181b] mt-0.5 cursor-pointer"
                  />
                  <label htmlFor="term-adhesion" className="text-[12.5px] text-gray-700 leading-snug cursor-pointer select-none">
                    Declaro que li e concordo com o <strong>Termo de Adesão e Parceria Comercial LINNK</strong> (comissão líquida dividida em 50/50 com repasse direto via PIX após faturamento).
                  </label>
                </div>

                <div className="flex items-start gap-2.5">
                  <input
                    id="term-nda"
                    type="checkbox"
                    checked={ndaTermSigned}
                    onChange={(e) => setNdaTermSigned(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-[#18181b] accent-[#18181b] mt-0.5 cursor-pointer"
                  />
                  <label htmlFor="term-nda" className="text-[12.5px] text-gray-700 leading-snug cursor-pointer select-none">
                    Aceito o <strong>Termo de Confidencialidade e Proteção de Clientes (NDA)</strong>, com garantia de proteção de indicação ativa de 6 meses contra contatos duplicados.
                  </label>
                </div>
              </div>

              {/* Botão de Envio */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2.5 py-3.5 px-4 bg-[#18181b] hover:bg-[#27272a] active:scale-[0.99] text-white text-[14.5px] font-semibold rounded-xl shadow-md transition-all duration-150 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
                >
                  <span>{isSubmitting ? 'Finalizando cadastro...' : 'Concluir Cadastro e Acessar'}</span>
                  <ArrowRight
                    className={`w-4 h-4 text-[#f95721] shrink-0 ${isSubmitting ? 'animate-pulse' : ''}`}
                    strokeWidth={2.5}
                  />
                </button>
              </div>

              {/* Link Secundário */}
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={onNavigateToLogin}
                  className="text-[13px] text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
                >
                  Já tem uma conta cadastrada? <span className="font-semibold text-gray-800 underline">Fazer login</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Rodapé da Tela */}
        <footer className="pt-6 border-t border-gray-100 text-center text-[12px] text-gray-400">
          © 2025 Linnk Tecnologia Imobiliária • Todos os direitos reservados
        </footer>
        </div>
      </div>
    </div>
  );
};
