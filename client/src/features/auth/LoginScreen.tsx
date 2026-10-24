import React, { useState } from 'react';
import {
  ArrowRight,
  Briefcase,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
  UserCheck,
  Users,
} from 'lucide-react';
import { useApp } from '../../app/AppContext';
import { UserRole } from '../../app/types';
import { BrandLogo } from '../../components/BrandLogo';

const ROLE_OPTIONS: {
  role: UserRole;
  label: string;
  shortDesc: string;
  defaultEmail: string;
}[] = [
  {
    role: 'ADMIN',
    label: 'Administrador',
    shortDesc: 'Gestão global da plataforma, regras de comissão, financeiro e auditoria.',
    defaultEmail: 'vitor@linnk.com.br',
  },
  {
    role: 'OPERATOR',
    label: 'Operador',
    shortDesc: 'Execução diária: triagem de indicações, conferência de termos e atendimento.',
    defaultEmail: 'camila.operacao@linnk.com.br',
  },
  {
    role: 'BROKER',
    label: 'Corretor',
    shortDesc: 'Envio e acompanhamento das próprias indicações, lançamentos e comissões 50%.',
    defaultEmail: 'henrique.bastos@corretorba.com.br',
  },
];

export const LoginScreen: React.FC = () => {
  const { users, loginAs } = useApp();

  const [selectedRole, setSelectedRole] = useState<UserRole>('ADMIN');
  const [email, setEmail] = useState('vitor@linnk.com.br');
  const [password, setPassword] = useState('linnk2026');
  const [showPassword, setShowPassword] = useState(false);
  const [keepSigned, setKeepSigned] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSelectRole = (role: UserRole) => {
    setErrorMsg('');
    setSelectedRole(role);
    const target = users.find((u) => u.role === role && u.active);
    if (target) {
      setEmail(target.email);
      setPassword('linnk2026');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const normalized = email.trim().toLowerCase();
    const matchedUser = users.find(
      (u) => u.email.toLowerCase() === normalized && u.active
    );

    if (!matchedUser) {
      setErrorMsg(
        'Credencial não localizada para o perfil selecionado. Verifique seu e-mail de acesso.'
      );
      return;
    }

    if (password.trim().length < 4) {
      setErrorMsg('Informe sua senha de acesso para prosseguir.');
      return;
    }

    loginAs(matchedUser.id);
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

      {/* Coluna Direita — Formulário de Login Limpo com Definição dos 3 Perfis */}
      <div className="lg:col-span-7 flex flex-col justify-between p-6 sm:p-12 xl:p-16 bg-[#F8F8F7] lg:bg-white">
        {/* Topo visível apenas no mobile */}
        <div className="flex items-center justify-between lg:hidden mb-8">
          <BrandLogo variant="light" size="md" />
        </div>

        {/* Container Central do Formulário */}
        <div className="w-full max-w-[420px] mx-auto my-auto bg-white lg:bg-transparent p-7 sm:p-8 lg:p-0 rounded-2xl lg:rounded-none border border-neutral-200/80 lg:border-0 shadow-xs lg:shadow-none">
          <div className="mb-6">
            <h2 className="font-display font-semibold text-2xl text-[#161316] tracking-tight">
              Acessar plataforma
            </h2>
            <p className="text-sm text-neutral-500 mt-1">
              Selecione seu perfil de acesso e informe suas credenciais.
            </p>
          </div>

          {/* Seletor Segmentado dos 3 Tipos de Usuário (Administrador, Operador, Corretor) */}
          <div className="mb-6">
            <label className="block text-xs font-semibold text-neutral-700 mb-2">
              Perfil de acesso
            </label>
            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-neutral-100 border border-neutral-200">
              {ROLE_OPTIONS.map((opt) => {
                const isSelected = selectedRole === opt.role;
                return (
                  <button
                    key={opt.role}
                    type="button"
                    onClick={() => handleSelectRole(opt.role)}
                    className={`py-2 px-2.5 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      isSelected
                        ? 'bg-[#161316] text-white shadow-xs font-semibold'
                        : 'text-neutral-600 hover:text-[#161316]'
                    }`}
                  >
                    {opt.role === 'ADMIN' && (
                      <ShieldCheck
                        className={`w-3.5 h-3.5 ${
                          isSelected ? 'text-[#FE4701]' : 'text-neutral-400'
                        }`}
                      />
                    )}
                    {opt.role === 'OPERATOR' && (
                      <Users
                        className={`w-3.5 h-3.5 ${
                          isSelected ? 'text-[#FE4701]' : 'text-neutral-400'
                        }`}
                      />
                    )}
                    {opt.role === 'BROKER' && (
                      <Briefcase
                        className={`w-3.5 h-3.5 ${
                          isSelected ? 'text-[#FE4701]' : 'text-neutral-400'
                        }`}
                      />
                    )}
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-neutral-500 mt-2 leading-relaxed">
              {activeRoleMeta.shortDesc}
            </p>
          </div>

          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 leading-relaxed">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="login-email"
                className="block text-xs font-semibold text-neutral-700 mb-1.5"
              >
                E-mail de acesso
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="login-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nome@dominio.com.br"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-lg bg-white border border-neutral-300 text-sm text-[#161316] placeholder:text-neutral-400 focus:border-[#161316] focus:ring-2 focus:ring-[#161316]/10 focus:outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="login-password"
                  className="block text-xs font-semibold text-neutral-700"
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
                  className="text-xs font-medium text-neutral-500 hover:text-[#161316] transition-colors"
                >
                  Esqueceu a senha?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-lg bg-white border border-neutral-300 text-sm text-[#161316] placeholder:text-neutral-400 focus:border-[#161316] focus:ring-2 focus:ring-[#161316]/10 focus:outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 p-1"
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-0.5">
              <label className="inline-flex items-center gap-2 text-xs text-neutral-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={keepSigned}
                  onChange={(e) => setKeepSigned(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-neutral-300 accent-[#161316]"
                />
                <span>Manter sessão conectada</span>
              </label>
            </div>

            <button
              type="submit"
              className="w-full bg-[#161316] hover:bg-neutral-800 text-white font-medium text-sm py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Entrar como {activeRoleMeta.label}</span>
              <ArrowRight className="w-4 h-4 text-[#FE4701]" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
