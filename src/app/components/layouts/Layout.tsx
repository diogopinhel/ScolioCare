import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router';
import {
  LayoutDashboard,
  Users,
  FileText,
  BarChart3,
  Search,
  Bell,
  Globe,
  ChevronDown,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';

function obterIniciais(nomeCompleto: string): string {
  const partes = nomeCompleto
    .replace(/^Dr\.?\s+/i, '')
    .replace(/^Dra\.?\s+/i, '')
    .trim()
    .split(/\s+/);
  if (partes.length === 0) return '?';
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

export default function Layout() {
  const [notificationCount] = React.useState(3);
  const { utilizador, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const nome = utilizador?.nomeCompleto ?? 'Utilizador';
  const iniciais = obterIniciais(nome);
  const especialidade =
    utilizador?.perfil === 'MEDICO' && 'especialidade' in utilizador
      ? (utilizador as { especialidade: string }).especialidade
      : 'Médico Especialista';

  return (
    <div className="flex h-screen bg-[var(--scolio-page-surface)] w-full">
      {/* Sidebar fixa - 240px */}
      <aside className="w-60 bg-white border-r border-[var(--scolio-border-light)] flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-[var(--scolio-border-light)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[var(--scolio-primary-blue)] rounded-lg flex items-center justify-center">
              <span className="text-white text-xl font-semibold">S</span>
            </div>
            <div>
              <h2
                className="text-[var(--scolio-text-primary)] font-semibold"
                style={{ fontSize: 'var(--text-h3)' }}
              >
                ScolioScan
              </h2>
            </div>
          </div>
        </div>

        {/* Navegação */}
        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            <li>
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-[var(--scolio-light-blue-surface)] text-[var(--scolio-primary-blue)]'
                      : 'text-[var(--scolio-text-secondary)] hover:bg-[var(--scolio-page-surface)]'
                  }`
                }
              >
                <LayoutDashboard className="w-5 h-5" />
                <span style={{ fontSize: 'var(--text-body)' }}>Painel</span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/patients"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-[var(--scolio-light-blue-surface)] text-[var(--scolio-primary-blue)]'
                      : 'text-[var(--scolio-text-secondary)] hover:bg-[var(--scolio-page-surface)]'
                  }`
                }
              >
                <Users className="w-5 h-5" />
                <span style={{ fontSize: 'var(--text-body)' }}>Pacientes</span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/exam-viewer"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-[var(--scolio-light-blue-surface)] text-[var(--scolio-primary-blue)]'
                      : 'text-[var(--scolio-text-secondary)] hover:bg-[var(--scolio-page-surface)]'
                  }`
                }
              >
                <FileText className="w-5 h-5" />
                <span style={{ fontSize: 'var(--text-body)' }}>Exames</span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/report-generation"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-[var(--scolio-light-blue-surface)] text-[var(--scolio-primary-blue)]'
                      : 'text-[var(--scolio-text-secondary)] hover:bg-[var(--scolio-page-surface)]'
                  }`
                }
              >
                <BarChart3 className="w-5 h-5" />
                <span style={{ fontSize: 'var(--text-body)' }}>Relatórios</span>
              </NavLink>
            </li>
          </ul>
        </nav>

        {/* Utilizador autenticado + sair */}
        <div className="p-4 border-t border-[var(--scolio-border-light)]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-[var(--scolio-primary-blue)] flex items-center justify-center text-white font-medium">
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
                {especialidade}
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

      {/* Conteúdo principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Cabeçalho */}
        <header className="bg-white border-b border-[var(--scolio-border-light)] px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="relative w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--scolio-neutral-gray)]" />
              <input
                type="search"
                placeholder="Pesquisar pacientes, exames, relatórios..."
                className="pl-10 pr-3 py-2 w-full border border-[var(--scolio-border-light)] rounded-[var(--radius-component)] focus:outline-none focus:ring-2 focus:ring-[var(--scolio-primary-blue)] focus:border-transparent"
              />
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

              <div className="w-9 h-9 rounded-full bg-[var(--scolio-primary-blue)] flex items-center justify-center text-white font-medium">
                {iniciais}
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
