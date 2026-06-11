import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router';
import {
  LayoutDashboard,
  Upload,
  ListChecks,
  Users,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../LanguageSwitcher';
import { NotificationDropdown } from '../NotificationDropdown';

function obterIniciais(nomeCompleto: string): string {
  const partes = nomeCompleto.trim().split(/\s+/);
  if (partes.length === 0) return '?';
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

export default function TecnicoLayout() {
  const navigate = useNavigate();
  const { utilizador, logout } = useAuth();
  const { t } = useTranslation();

  const nome = utilizador?.nomeCompleto ?? 'Técnico';
  const iniciais = obterIniciais(nome);
  const departamento =
    utilizador?.perfil === 'TECNICO' && 'departamento' in utilizador
      ? (utilizador as { departamento: string }).departamento
      : t('nav.healthTechnician');

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
    <div className="flex h-screen bg-[var(--scolio-page-surface)] w-full">
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
                {t('nav.technicianPanel')}
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {navItem('/tecnico', LayoutDashboard, t('nav.dashboard'), true)}
            {navItem('/tecnico/upload', Upload, t('nav.upload'))}
            {navItem('/tecnico/queue', ListChecks, t('nav.queue'))}
            {navItem('/tecnico/patients', Users, t('nav.patients'))}
          </ul>
        </nav>

        <div className="p-4 border-t border-[var(--scolio-border-light)]">
          <NavLink
            to="/tecnico/perfil"
            className={({ isActive }) =>
              `flex items-center gap-3 mb-3 p-2 rounded-lg transition-colors ${
                isActive
                  ? 'bg-[var(--scolio-success-surface)]'
                  : 'hover:bg-[var(--scolio-page-surface)]'
              }`
            }
            title={t('profile.title')}
          >
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
          </NavLink>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-[var(--radius-component)] text-[var(--scolio-text-secondary)] hover:bg-[var(--scolio-page-surface)] hover:text-[var(--scolio-text-primary)] transition-colors"
            style={{ fontSize: 'var(--text-body)' }}
          >
            <LogOut className="w-4 h-4" />
            <span>{t('common.logout')}</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-[var(--scolio-border-light)] px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <form
                className="relative w-80"
                onSubmit={(e) => {
                  e.preventDefault();
                  const q = (e.currentTarget.elements.namedItem('q') as HTMLInputElement).value.trim();
                  if (q) navigate(`/tecnico/patients?q=${encodeURIComponent(q)}`);
                }}
              >
                <input
                  name="q"
                  type="search"
                  placeholder={t('nav.searchPatientsExams')}
                  className="pl-10 pr-3 py-2 w-full border border-[var(--scolio-border-light)] rounded-[var(--radius-component)] focus:outline-none focus:ring-2 focus:ring-[var(--scolio-success-green)] focus:border-transparent"
                />
              </form>

            </div>

            <div className="flex items-center gap-4">
              <LanguageSwitcher />

              <NotificationDropdown focusColor="var(--scolio-success-green)" />

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
                    {t('nav.technician')}
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
