import React from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Button, Input } from '../../components/scolio';
import { useAuth, rotaInicialPara } from '../../auth/AuthContext';
import { AuthenticationError } from '../../../data/repository/auth';
import type { Perfil } from '../../../data/types';

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
  const { login, utilizador, estaAutenticado, aCarregar } = useAuth();

  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [erro, setErro] = React.useState<string | null>(null);
  const [aSubmeter, setASubmeter] = React.useState(false);

  // Já autenticado? Mandar para a área respectiva. (Usar Navigate em
  // vez de useEffect+navigate evita um flicker quando a sessão é
  // restaurada do localStorage.)
  if (!aCarregar && estaAutenticado && utilizador) {
    const from = (location.state as { from?: string } | null)?.from;
    return <Navigate to={destinoSeguro(from, utilizador.perfil)} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    setASubmeter(true);

    try {
      const u = await login(email, password);
      const from = (location.state as { from?: string } | null)?.from;
      navigate(destinoSeguro(from, u.perfil), { replace: true });
    } catch (err) {
      if (err instanceof AuthenticationError) {
        setErro(err.message);
      } else {
        setErro('Ocorreu um erro inesperado. Tente novamente.');
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
              Plataforma clínica para gestão de escoliose
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Email"
              type="email"
              placeholder="seu.email@scolio.pt"
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
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Insira a sua password"
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
                  aria-label={showPassword ? 'Ocultar password' : 'Mostrar password'}
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
                  Lembrar-me
                </span>
              </label>
              <a
                href="#"
                className="text-[var(--scolio-primary-blue)] hover:underline"
                style={{ fontSize: 'var(--text-body)' }}
              >
                Esqueci a password
              </a>
            </div>

            <Button type="submit" variant="primary" className="w-full" disabled={aSubmeter}>
              {aSubmeter ? 'A entrar...' : 'Entrar'}
            </Button>
          </form>
        </div>

        {/* Cards de demonstração */}
        <div className="mt-6">
          <p className="text-center text-[var(--scolio-text-secondary)] mb-3" style={{ fontSize: 'var(--text-caption)' }}>
            Credenciais de demonstração — clique para preencher
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
                  {cred.label}
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
            © 2026 ScolioScan. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}

const credenciaisDemo = [
  { perfil: 'MEDICO',  label: 'Médico',   email: 'ana.martins@scolio.pt',    password: 'medico123',  cor: 'var(--scolio-primary-blue)' },
  { perfil: 'TECNICO', label: 'Técnico',  email: 'ricardo.sousa@scolio.pt',  password: 'tecnico123', cor: 'var(--scolio-success-green)' },
  { perfil: 'ADMIN',   label: 'Admin',    email: 'paulo.oliveira@scolio.pt', password: 'admin123',   cor: 'var(--scolio-warning-amber)' },
];
