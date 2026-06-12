import React from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router';
import { Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { Button, Input } from '../../components/scolio';
import { useAuth, rotaInicialPara } from '../../auth/AuthContext';
import { AuthenticationError } from '../../../data/repository/auth';
import type { Perfil } from '../../../data/types';
import { useTranslation } from 'react-i18next';

const prefixosPorPerfil: Record<Perfil, (p: string) => boolean> = {
  MEDICO:   (p) => p !== '/login' && p !== '/403' && !p.startsWith('/tecnico') && !p.startsWith('/admin-panel'),
  TECNICO:  (p) => p.startsWith('/tecnico'),
  ADMIN:    (p) => p.startsWith('/admin-panel'),
  PACIENTE: (_p) => false, // pacientes usam a app React Native — sem acesso web
};

function destinoSeguro(from: string | undefined, perfil: Perfil): string {
  if (from && prefixosPorPerfil[perfil](from)) return from;
  return rotaInicialPara(perfil);
}

export default function LoginScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, utilizador, estaAutenticado, pendente2FA, aCarregar } = useAuth();
  const { t } = useTranslation();

  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [erro, setErro] = React.useState<string | null>(null);
  const [aSubmeter, setASubmeter] = React.useState(false);
  const mensagemSucesso = (location.state as { mensagem?: string } | null)?.mensagem;

  // Enquanto a sessão carrega, mostrar spinner (evita o flash do formulário
  // seguido de redirect abrupto quando a sessão é restaurada do localStorage).
  if (aCarregar) {
    return (
      <div className="min-h-screen bg-[var(--scolio-light-blue-surface)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[var(--scolio-primary-blue)] border-t-transparent rounded-full animate-spin" />
          <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>
            {t('common.loading')}
          </p>
        </div>
      </div>
    );
  }

  // 2FA de login pendente? Redirecionar para a verificação.
  if (pendente2FA?.modo === 'login') {
    return <Navigate to="/auth/two-factor-verify" replace />;
  }

  // Já autenticado? Redirecionar para a área correcta.
  if (estaAutenticado && utilizador) {
    const from = (location.state as { from?: string } | null)?.from;
    return <Navigate to={destinoSeguro(from, utilizador.perfil)} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    setASubmeter(true);

    try {
      const resultado = await login(email, password);
      if (resultado.needsTwoFactor) {
        navigate('/auth/two-factor-verify', { replace: true });
      }
      // Caso contrário, o efeito de `<Navigate>` acima trata do redirect
      // depois de `utilizador` ser definido no contexto.
    } catch (err) {
      if (err instanceof AuthenticationError) {
        setErro(err.message);
      } else {
        setErro(t('auth.unexpectedError'));
      }
    } finally {
      setASubmeter(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--scolio-light-blue-surface)] flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        {/* Cartão de login */}
        <div className="bg-white rounded-[var(--radius-card)] shadow-lg p-8">
          {/* Logo e título */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-[var(--scolio-primary-blue)] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-3xl font-semibold">S</span>
            </div>
            <h1 className="text-[var(--scolio-text-primary)] mb-2">ScolioCare</h1>
            <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>
              {t('auth.subtitle')}
            </p>
          </div>

          {mensagemSucesso && (
            <div
              className="flex items-start gap-2 p-3 rounded-[var(--radius-component)] bg-[var(--scolio-success-surface)] border border-[var(--scolio-success-green)] mb-6"
              role="status"
            >
              <CheckCircle className="w-4 h-4 text-[var(--scolio-success-green)] mt-0.5 flex-shrink-0" />
              <span className="text-[var(--scolio-success-green)]" style={{ fontSize: 'var(--text-body)' }}>
                {mensagemSucesso}
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label={t('auth.emailLabel')}
              type="email"
              placeholder={t('auth.emailPlaceholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />

            <div className="flex flex-col gap-1.5">
              <label
                className="text-[var(--scolio-text-primary)]"
                style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)' }}
              >
                {t('auth.passwordLabel')}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t('auth.passwordPlaceholder')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="px-3 py-2 pr-10 w-full border border-[var(--scolio-border-light)] rounded-[var(--radius-component)] focus:outline-none focus:ring-2 focus:ring-[var(--scolio-primary-blue)] focus:border-transparent"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--scolio-neutral-gray)] hover:text-[var(--scolio-text-primary)]"
                  aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {erro && (
              <div
                className="flex items-start gap-2 p-3 rounded-[var(--radius-component)] bg-[var(--scolio-danger-surface)] border border-[var(--scolio-danger-coral)]"
                role="alert"
              >
                <AlertCircle className="w-4 h-4 text-[var(--scolio-danger-coral)] mt-0.5 flex-shrink-0" />
                <span className="text-[var(--scolio-danger-coral)]" style={{ fontSize: 'var(--text-body)' }}>
                  {erro}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-[var(--scolio-border-light)] text-[var(--scolio-primary-blue)] focus:ring-[var(--scolio-primary-blue)]"
                />
                <span className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>
                  {t('auth.rememberMe')}
                </span>
              </label>
              <button
                type="button"
                onClick={() => alert(t('common.contactAdmin'))}
                className="text-[var(--scolio-primary-blue)] hover:underline"
                style={{ fontSize: 'var(--text-body)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                {t('auth.forgotPassword')}
              </button>
            </div>

            <Button type="submit" variant="primary" className="w-full" disabled={aSubmeter}>
              {aSubmeter ? t('auth.loggingIn') : t('auth.loginButton')}
            </Button>
          </form>
        </div>

        {/* Cards de demonstração */}
        <div className="mt-6">
          <p className="text-center text-[var(--scolio-text-secondary)] mb-3" style={{ fontSize: 'var(--text-caption)' }}>
            {t('auth.demoCredentials')}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {credenciaisDemo.map((cred) => (
              <button
                key={cred.perfil}
                type="button"
                onClick={() => { setEmail(cred.email); setPassword(cred.password); setErro(null); }}
                className="text-left p-3 bg-white rounded-[var(--radius-component)] border border-[var(--scolio-border-light)] hover:border-[var(--scolio-primary-blue)] hover:shadow-sm transition-all"
              >
                <span
                  className="block font-medium mb-1"
                  style={{ fontSize: 'var(--text-caption)', color: cred.cor }}
                >
                  {t(cred.labelKey)}
                </span>
                <span className="block text-[var(--scolio-text-secondary)] truncate" style={{ fontSize: 'var(--text-caption)' }}>
                  {cred.email}
                </span>
                <span className="block text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>
                  {cred.password}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 text-center">
          <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>
            {t('common.copyright')}
          </p>
        </div>
      </div>
    </div>
  );
}

const credenciaisDemo = [
  { perfil: 'MEDICO',  labelKey: 'auth.demoDoctor',      email: 'ana.martins@scolio.pt',    password: 'medico123',  cor: 'var(--scolio-primary-blue)' },
  { perfil: 'TECNICO', labelKey: 'auth.demoTechnician',  email: 'ricardo.sousa@scolio.pt',  password: 'tecnico123', cor: 'var(--scolio-success-green)' },
  { perfil: 'ADMIN',   labelKey: 'auth.demoAdmin',       email: 'paulo.oliveira@scolio.pt', password: 'admin123',   cor: 'var(--scolio-warning-amber)' },
];
