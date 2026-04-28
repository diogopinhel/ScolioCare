import React from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Button, Input } from '../../components/scolio';
import { useAuth, rotaInicialPara } from '../../auth/AuthContext';
import { AuthenticationError } from '../../../data/repository/auth';

/**
 * Lista de contas mock visíveis no fundo do ecrã para facilitar a demo.
 * Carregar numa entrada preenche os campos automaticamente.
 */
const contasDemo = [
  { perfil: 'Médico', email: 'ana.martins@scolio.pt', password: 'medico123' },
  { perfil: 'Técnico', email: 'ricardo.sousa@scolio.pt', password: 'tecnico123' },
  { perfil: 'Administrador', email: 'paulo.oliveira@scolio.pt', password: 'admin123' },
  { perfil: 'Paciente', email: 'maria.silva@scolio.pt', password: 'paciente123' },
];

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
    const destino =
      (location.state as { from?: string } | null)?.from ??
      rotaInicialPara(utilizador.perfil);
    return <Navigate to={destino} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    setASubmeter(true);

    try {
      const u = await login(email, password);
      const destino =
        (location.state as { from?: string } | null)?.from ??
        rotaInicialPara(u.perfil);
      navigate(destino, { replace: true });
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

  const preencherConta = (conta: typeof contasDemo[number]) => {
    setEmail(conta.email);
    setPassword(conta.password);
    setErro(null);
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
            <h1 className="text-[var(--scolio-text-primary)] mb-2">ScolioScan</h1>
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

        {/* Contas de demonstração */}
        <div className="mt-6 bg-white rounded-[var(--radius-card)] shadow-sm p-5 border border-[var(--scolio-border-light)]">
          <p
            className="text-[var(--scolio-text-secondary)] mb-3"
            style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-medium)' }}
          >
            Contas de demonstração (clique para preencher)
          </p>
          <div className="grid grid-cols-2 gap-2">
            {contasDemo.map((conta) => (
              <button
                key={conta.email}
                type="button"
                onClick={() => preencherConta(conta)}
                className="text-left px-3 py-2 rounded-[var(--radius-component)] border border-[var(--scolio-border-light)] hover:border-[var(--scolio-primary-blue)] hover:bg-[var(--scolio-light-blue-surface)] transition-colors"
              >
                <span
                  className="block text-[var(--scolio-text-primary)]"
                  style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)' }}
                >
                  {conta.perfil}
                </span>
                <span
                  className="block text-[var(--scolio-text-secondary)] truncate"
                  style={{ fontSize: 'var(--text-caption)' }}
                >
                  {conta.email}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>
            © 2026 ScolioScan. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}
