import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router';
import {
  LayoutDashboard,
  Upload,
  ListChecks,
  Users,
  Search,
  Bell,
  Globe,
  ChevronDown,
  Clock,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';

function obterIniciais(nomeCompleto: string): string {
  const partes = nomeCompleto.trim().split(/\s+/);
  if (partes.length === 0) return '?';
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

export default function TecnicoLayout() {
  const [notificationCount] = React.useState(2);
  const navigate = useNavigate();
  const { utilizador, logout } = useAuth();

  const nome = utilizador?.nomeCompleto ?? 'Técnico';
  const iniciais = obterIniciais(nome);
  const departamento =
    utilizador?.perfil === 'TECNICO' && 'departamento' in utilizador
      ? (utilizador as { departamento: string }).departamento
      : 'Técnico de saúde';

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const navItem = (
    to: string,
    icon: React.ElementType,
    label: string,
    end = false,
  ) => {
    const Icon = icon;
    return (
      <li>
        <NavLink
          to={to}
          end={end}
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
              isActive
                ? 'bg-[var(--scolio-success-surface)] text-[var(--scolio-success-green)]'
                : 'text-[var(--scolio-text-secondary)] hover:bg-[var(--scolio-page-surface)]'
            }`
          }
        >
          <Icon className="w-5 h-5" />
          <span style={{ fontSize: 'var(--text-body)' }}>{label}</span>
        </NavLink>
      </li>
    );
  };

  return (
    <div className="flex h-screen bg-[var(--scolio-page-surface)] w-[1440px] mx-auto">
      <aside className="w-60 bg-white border-r border-[var(--scolio-border-light)] flex flex-col">
        <div className="p-6 border-b border-[var(--scolio-border-light)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[var(--scolio-success-green)] rounded-lg flex items-center justify-center">
              <span className="text-white text-xl font-semibold">S</span>
            </div>
            <div>
              <h2
                className="text-[var(--scolio-text-primary)] font-semibold"
                style={{ fontSize: 'var(--text-h3)' }}
              >
                ScolioScan
              </h2>
              <p
                className="text-[var(--scolio-text-secondary)]"
                style={{ fontSize: 'var(--text-caption)' }}
              >
                Painel do Técnico
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {navItem('/tecnico', LayoutDashboard, 'Painel', true)}
            {navItem('/tecnico/upload', Upload, 'Carregar exame')}
            {navItem('/tecnico/queue', ListChecks, 'Fila de exames')}
            {navItem('/tecnico/patients', Users, 'Pacientes')}
          </ul>
        </nav>

        <div className="p-4 border-t border-[var(--scolio-border-light)]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-[var(--scolio-success-green)] flex items-center justify-center text-white font-medium">
              {iniciais}
            </div>
            <div className="flex-1 min-w-0">
              <p
                className="text-[var(--scolio-text-primary)] font-medium truncate"
                style={{ fontSize: 'var(--text-body)' }}
              >
                {nome}
              </p>
              <p
                className="text-[var(--scolio-text-secondary)] truncate"
                style={{ fontSize: 'var(--text-caption)' }}
              >
                {departamento}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-[var(--radius-component)] text-[var(--scolio-text-secondary)] hover:bg-[var(--scolio-page-surface)] hover:text-[var(--scolio-text-primary)] transition-colors"
            style={{ fontSize: 'var(--text-body)' }}
          >
            <LogOut className="w-4 h-4" />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-[var(--scolio-border-light)] px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="relative w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--scolio-neutral-gray)]" />
                <input
                  type="search"
                  placeholder="Pesquisar exames, pacientes..."
                  className="pl-10 pr-3 py-2 w-full border border-[var(--scolio-border-light)] rounded-[var(--radius-component)] focus:outline-none focus:ring-2 focus:ring-[var(--scolio-success-green)] focus:border-transparent"
                />
              </div>

              <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--scolio-success-surface)] rounded-[var(--radius-component)]">
                <Clock className="w-4 h-4 text-[var(--scolio-success-green)]" />
                <span
                  className="text-[var(--scolio-success-green)]"
                  style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-medium)' }}
                >
                  Turno activo · 08:00 – 16:00
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                type="button"
                className="flex items-center gap-2 px-3 py-2 text-[var(--scolio-text-secondary)] hover:text-[var(--scolio-text-primary)] transition-colors"
              >
                <Globe className="w-5 h-5" />
                <span style={{ fontSize: 'var(--text-body)' }}>PT</span>
                <ChevronDown className="w-4 h-4" />
              </button>

              <button
                type="button"
                className="relative p-2 text-[var(--scolio-text-secondary)] hover:text-[var(--scolio-text-primary)] transition-colors"
                aria-label="Notificações"
              >
                <Bell className="w-5 h-5" />
                {notificationCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-[var(--scolio-danger-coral)] text-white rounded-full flex items-center justify-center text-xs font-medium">
                    {notificationCount}
                  </span>
                )}
              </button>

              <div className="flex items-center gap-2">
                <div className="text-right">
                  <p
                    className="text-[var(--scolio-text-primary)] font-medium"
                    style={{ fontSize: 'var(--text-caption)' }}
                  >
                    {nome}
                  </p>
                  <p
                    className="text-[var(--scolio-text-secondary)]"
                    style={{ fontSize: 'var(--text-caption)' }}
                  >
                    Técnico
                  </p>
                </div>
                <div className="w-9 h-9 rounded-full bg-[var(--scolio-success-green)] flex items-center justify-center text-white font-medium">
                  {iniciais}
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
