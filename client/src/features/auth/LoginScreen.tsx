import React, { useState } from 'react';
import {
  ArrowRight,
  Briefcase,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Users,
  AlertTriangle,
} from 'lucide-react';
import { useApp } from '../../app/AppContext';
import { UserRole } from '../../app/types';
import { BrandLogo } from '../../components/BrandLogo';

const ROLE_OPTIONS: {
  role: UserRole;
  label: string;
  shortDesc: string;
}[] = [
  {
    role: 'ADMIN',
    label: 'Administrador',
    shortDesc: 'Acesso restrito à gestão global. Contas criadas exclusivamente pelo desenvolvedor.',
  },
  {
    role: 'OPERATOR',
    label: 'Operador',
    shortDesc: 'Acesso restrito a contratos e esteira. Contas criadas exclusivamente pelo desenvolvedor.',
  },
  {
    role: 'BROKER',
    label: 'Corretor',
    shortDesc: 'Envio de propostas, consulta de tabelas, comissões e acompanhamento de vendas.',
  },
];

interface LoginScreenProps {
  onNavigateToRegister?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onNavigateToRegister,
}) => {
  const { loginWithCredentials } = useApp();

  const [selectedRole, setSelectedRole] = useState<UserRole>('ADMIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [keepSigned, setKeepSigned] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSelectRole = (role: UserRole) => {
    setErrorMsg('');
    setSelectedRole(role);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const normalized = email.trim().toLowerCase();
    if (!normalized || !normalized.includes('@')) {
      setErrorMsg('Informe um e-mail de acesso válido.');
      return;
    }

    if (password.trim().length < 4) {
      setErrorMsg('Informe sua senha de acesso para prosseguir (mínimo 4 caracteres).');
      return;
    }

    try {
      setIsSubmitting(true);
      const result = await loginWithCredentials(normalized, selectedRole, password);
      if (!result.ok) {
        setErrorMsg(result.error || 'Credencial não autorizada para o perfil selecionado.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro inesperado ao realizar autenticação.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeRoleMeta =
    ROLE_OPTIONS.find((r) => r.role === selectedRole) || ROLE_OPTIONS[0];

  return (
    <div className="min-h-screen bg-white text-[#161316] grid grid-cols-1 lg:grid-cols-12">
      {/* Painel Institucional Esquerdo — Fundo Preto & Laranja Difuso em Movimento com Textura Granulada */}
      <div className="hidden lg:flex lg:col-span-5 relative overflow-hidden bg-[#080605] text-white p-12 xl:p-16 flex-col justify-between border-r border-neutral-900">
        {/* Camada de Formas Orgânicas em Laranja Queimado / Chama em Movimento Contínuo */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {/* Blob 1: Canto superior/esquerdo */}
          <div
            className="animate-aurora-1 absolute -top-[10%] -left-[18%] w-[68%] h-[58%] rounded-full opacity-80 blur-[85px]"
            style={{
              background:
                'radial-gradient(circle, rgba(214,68,5,0.85) 0%, rgba(145,42,3,0.45) 55%, rgba(8,6,5,0) 100%)',
            }}
          />

          {/* Blob 2: Centro-inferior intenso */}
          <div
            className="animate-aurora-2 absolute bottom-[-12%] left-[12%] w-[75%] h-[68%] rounded-full opacity-95 blur-[90px]"
            style={{
              background:
                'radial-gradient(circle, rgba(254,71,1,0.95) 0%, rgba(204,55,0,0.6) 48%, rgba(8,6,5,0) 100%)',
            }}
          />

          {/* Blob 3: Lateral direita luminosa */}
          <div
            className="animate-aurora-3 absolute top-[22%] -right-[22%] w-[65%] h-[70%] rounded-full opacity-90 blur-[80px]"
            style={{
              background:
                'radial-gradient(circle, rgba(255,94,14,0.92) 0%, rgba(176,47,0,0.5) 52%, rgba(8,6,5,0) 100%)',
            }}
          />

          {/* Blob 4: Ponto quente inferior esquerdo */}
          <div
            className="animate-aurora-4 absolute -bottom-[16%] -left-[14%] w-[60%] h-[55%] rounded-full opacity-85 blur-[75px]"
            style={{
              background:
                'radial-gradient(circle, rgba(235,76,8,0.88) 0%, rgba(120,32,0,0.4) 55%, rgba(8,6,5,0) 100%)',
            }}
          />

          {/* Sombra escura orgânica central para dar contraste profundo */}
          <div
            className="animate-aurora-2 absolute top-[8%] left-[25%] w-[52%] h-[52%] rounded-full opacity-85 blur-[70px]"
            style={{
              background:
                'radial-gradient(circle, rgba(5,4,4,0.95) 0%, rgba(8,6,5,0.6) 60%, transparent 100%)',
            }}
          />

          {/* Textura Granulada (Film Grain / Noise) idêntica à referência */}
          <svg
            className="absolute inset-0 w-full h-full opacity-[0.28] mix-blend-overlay pointer-events-none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <filter id="linnk-login-grain">
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.78"
                numOctaves="4"
                stitchTiles="stitch"
              />
              <feColorMatrix type="saturate" values="0" />
            </filter>
            <rect width="100%" height="100%" filter="url(#linnk-login-grain)" />
          </svg>

          {/* Vinheta sutil nas bordas para leitura perfeita dos textos */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/20 to-black/55" />
        </div>

        <div className="relative z-10 flex items-center justify-between">
          <BrandLogo variant="dark" size="md" />
        </div>

        <div className="relative z-10 max-w-md space-y-6">
          <div className="inline-flex items-center gap-2 text-xs font-medium tracking-wider uppercase text-[#FF6D29]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FE4701]" />
            <span>Ecossistema Imobiliário LINNK</span>
          </div>

          <h1 className="font-display font-semibold text-3xl xl:text-4xl tracking-tight leading-snug text-white drop-shadow-xs">
            Conexão estruturada entre corretores, lançamentos e fechamento.
          </h1>

          <p className="text-sm text-white/80 leading-relaxed">
            Ambiente unificado para administração, operação comercial e
            acompanhamento transparente de indicações e comissões.
          </p>
        </div>

        <div className="relative z-10 flex items-center justify-between text-xs text-white/60 pt-6 border-t border-white/15">
          <span>© 2026 LINNK · Todos os direitos reservados</span>
        </div>
      </div>

      {/* Coluna Direita — Layout Mobile Nativo Limpo + Centralizado no Desktop */}
      <div className="lg:col-span-7 bg-white text-[#18181b]">
        <div className="w-full min-h-screen flex flex-col justify-between px-6 py-8 max-w-md mx-auto lg:py-12">
          {/* BEGIN: TopBrandHeader */}
          <header
            className="pt-2 pb-6 flex items-center justify-between"
            data-purpose="brand-header"
          >
            <div className="lg:hidden">
              <BrandLogo variant="light" size="md" />
            </div>
            <div className="hidden lg:block">
              <span className="text-[12px] font-semibold tracking-wider text-gray-400 uppercase">
                Acesso Seguro
              </span>
            </div>
          </header>
          {/* END: TopBrandHeader */}

          {/* BEGIN: AuthCard */}
          <main
            className="w-full flex-1 lg:flex-initial flex flex-col justify-start p-0 bg-transparent"
            data-purpose="login-container"
          >
            {/* Heading & Explanatory Subtitle */}
            <div className="mb-6">
              <h1 className="text-[22px] sm:text-2xl font-bold tracking-tight text-[#111827] mb-1.5">
                Acessar plataforma
              </h1>
              <p className="text-[13.5px] leading-relaxed text-[#6b7280]">
                Selecione seu perfil de acesso e informe suas credenciais.
              </p>
            </div>

            {errorMsg && (
              <div
                role="alert"
                className="mb-5 p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs sm:text-[13px] text-rose-800 leading-relaxed flex items-start gap-3 shadow-xs animate-fadeIn"
              >
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1 font-medium">{errorMsg}</div>
              </div>
            )}

            {/* BEGIN: AccessForm */}
            <form onSubmit={handleSubmit} className="space-y-5" id="login-form">
              {/* Role Selector (Segmented Control) */}
              <div data-purpose="role-selector-section">
                <label className="block text-[13px] font-semibold text-[#374151] mb-2">
                  Perfil de acesso
                </label>
                <div
                  className="grid grid-cols-3 gap-1 p-1 bg-[#f9fafb] rounded-xl border border-gray-200"
                  role="tablist"
                >
                  {ROLE_OPTIONS.map((opt) => {
                    const isSelected = selectedRole === opt.role;
                    return (
                      <button
                        key={opt.role}
                        type="button"
                        role="tab"
                        aria-selected={isSelected}
                        onClick={() => handleSelectRole(opt.role)}
                        className={`flex items-center justify-center gap-1.5 py-2 px-1 text-[12.5px] rounded-lg transition-all focus:outline-none cursor-pointer ${
                          isSelected
                            ? 'bg-[#18181b] text-white shadow-sm font-semibold'
                            : 'font-medium text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        {opt.role === 'OPERATOR' && (
                          <Users className="w-3.5 h-3.5 opacity-70 shrink-0" />
                        )}
                        {opt.role === 'BROKER' && (
                          <Briefcase className="w-3.5 h-3.5 opacity-70 shrink-0" />
                        )}
                        <span>{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
                {/* Dynamic Role Description */}
                <p
                  className="mt-2 text-[12px] leading-relaxed text-[#6b7280]"
                  id="role-description"
                >
                  {activeRoleMeta.shortDesc}
                </p>

                {selectedRole === 'BROKER' && onNavigateToRegister && (
                  <div className="mt-2.5 p-2.5 rounded-xl bg-orange-50/70 border border-orange-100/90 flex items-center justify-between text-[12px] animate-fadeIn">
                    <span className="text-gray-600 font-medium">Novo corretor na LINNK?</span>
                    <button
                      type="button"
                      onClick={onNavigateToRegister}
                      className="font-bold text-[#f95721] hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <span>Cadastre-se agora</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Input Field: E-mail */}
              <div data-purpose="email-input-group">
                <label
                  className="block text-[13px] font-semibold text-[#374151] mb-1.5"
                  htmlFor="login-email"
                >
                  E-mail de acesso
                </label>
                <div className="relative flex items-center rounded-xl border border-gray-300 bg-white shadow-xs focus-within:border-gray-400 focus-within:ring-1 focus-within:ring-gray-400 transition-all">
                  <div className="pl-3.5 pr-1 pointer-events-none text-gray-400">
                    <Mail className="w-5 h-5" strokeWidth={1.8} />
                  </div>
                  <input
                    id="login-email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seuemail@linnk.com.br"
                    className="w-full py-3 pr-3.5 pl-1.5 text-[14px] text-gray-900 border-0 bg-transparent placeholder-gray-400 focus:ring-0 focus:outline-none"
                  />
                </div>
              </div>

              {/* Input Field: Senha */}
              <div data-purpose="password-input-group">
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    className="text-[13px] font-semibold text-[#374151]"
                    htmlFor="login-password"
                  >
                    Senha
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setErrorMsg(
                        'Para redefinição de senha, solicite suporte ao Administrador da LINNK.'
                      )
                    }
                    className="text-[12px] font-normal text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
                  >
                    Esqueceu a senha?
                  </button>
                </div>
                <div className="relative flex items-center rounded-xl border border-gray-300 bg-white shadow-xs focus-within:border-gray-400 focus-within:ring-1 focus-within:ring-gray-400 transition-all">
                  <div className="pl-3.5 pr-1 pointer-events-none text-gray-400">
                    <Lock className="w-5 h-5" strokeWidth={1.8} />
                  </div>
                  <input
                    id="login-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Digite sua senha"
                    className="w-full py-3 px-1.5 text-[14px] text-gray-900 tracking-wider border-0 bg-transparent placeholder-gray-400 focus:ring-0 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label="Alternar visibilidade da senha"
                    className="pr-3.5 pl-1 text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" strokeWidth={1.8} />
                    ) : (
                      <Eye className="w-5 h-5" strokeWidth={1.8} />
                    )}
                  </button>
                </div>
              </div>

              {/* Checkbox: Manter sessão conectada */}
              <div className="flex items-center pt-0.5" data-purpose="remember-session">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={keepSigned}
                  onChange={(e) => setKeepSigned(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-[#18181b] accent-[#18181b] focus:ring-black cursor-pointer"
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 block text-[13px] text-gray-600 select-none cursor-pointer"
                >
                  Manter sessão conectada
                </label>
              </div>

              {/* Primary CTA Button */}
              <div className="pt-2" data-purpose="form-actions">
                <button
                  id="submit-button"
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2.5 py-3.5 px-4 bg-[#18181b] hover:bg-[#27272a] active:scale-[0.99] text-white text-[14px] font-semibold rounded-xl shadow-md transition-all duration-150 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
                >
                  <span id="submit-text">
                    {isSubmitting ? 'Acessando plataforma...' : `Entrar como ${activeRoleMeta.label}`}
                  </span>
                  <ArrowRight
                    className={`w-4 h-4 text-[#f95721] shrink-0 ${isSubmitting ? 'animate-pulse' : ''}`}
                    strokeWidth={2.5}
                  />
                </button>
              </div>

              {/* Botão e Chamada de Cadastro de Corretor (apenas no perfil Corretor) */}
              {onNavigateToRegister && selectedRole === 'BROKER' && (
                <div className="pt-4 border-t border-gray-100 flex flex-col items-center gap-1.5 text-center">
                  <p className="text-[12.5px] text-gray-500">
                    É corretor imobiliário e quer ser nosso parceiro?
                  </p>
                  <button
                    type="button"
                    onClick={onNavigateToRegister}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-[13.5px] font-bold text-[#f95721] hover:text-[#ea4915] transition-all py-2.5 px-4 rounded-xl border border-orange-200/80 bg-orange-50/50 hover:bg-orange-50 cursor-pointer"
                  >
                    <span>Cadastre-se como Corretor Parceiro</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {selectedRole !== 'BROKER' && (
                <div className="pt-4 border-t border-gray-100 text-center">
                  <p className="text-[12px] text-gray-400">
                    Contas de {activeRoleMeta.label} são criadas exclusivamente pela equipe de desenvolvimento.
                  </p>
                </div>
              )}
            </form>
            {/* END: AccessForm */}
          </main>

          {/* Footer */}
          <footer
            className="pt-8 pb-2 text-center text-[12px] text-gray-500 flex flex-col sm:flex-row items-center justify-center gap-2"
            data-purpose="screen-footer"
          >
            <button
              type="button"
              onClick={() =>
                setErrorMsg(
                  'Suporte LINNK: entre em contato pelo e-mail suporte@linnk.com.br ou com o Administrador.'
                )
              }
              className="hover:text-gray-800 transition-colors cursor-pointer"
            >
              Precisa de ajuda? Fale com o suporte
            </button>
            <span className="hidden sm:inline opacity-40">•</span>
            <span className="text-gray-400">© 2025 Linnk Tecnologia</span>
          </footer>
          {/* END: AuthCard */}
        </div>
      </div>
    </div>
  );
};
