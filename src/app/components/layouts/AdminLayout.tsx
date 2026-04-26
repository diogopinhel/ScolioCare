import React from 'react';
import { Outlet, NavLink, useLocation } from 'react-router';
import {
  LayoutDashboard,
  Users,
  ScrollText,
  Settings,
  Cpu,
  ShieldCheck,
  Bell,
  ChevronRight,
  Search,
} from 'lucide-react';

const breadcrumbMap: Record<string, string> = {
  '/admin-panel': 'Painel',
  '/admin-panel/users': 'Gestão de utilizadores',
  '/admin-panel/audit': 'Auditoria global',
  '/admin-panel/settings': 'Definições do sistema',
  '/admin-panel/ai': 'IA & Dados',
  '/admin-panel/compliance': 'Compliance & RGPD',
};

export default function AdminLayout() {
  const [notificationCount] = React.useState(4);
  const location = useLocation();

  const currentLabel =
    breadcrumbMap[location.pathname.replace(/\/$/, '')] || 'Painel';

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
                ? 'bg-[var(--scolio-primary-blue)] text-white'
                : 'text-[#B8B7B0] hover:bg-[#2A2A2A] hover:text-white'
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
      {/* Dark Sidebar */}
      <aside
        className="w-60 flex flex-col"
        style={{ backgroundColor: '#1A1A1A' }}
      >
        {/* Logo */}
        <div
          className="p-6 border-b"
          style={{ borderColor: '#2A2A2A' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[var(--scolio-primary-blue)] rounded-lg flex items-center justify-center">
              <span className="text-white text-xl font-semibold">S</span>
            </div>
            <div>
              <h2
                className="text-white font-semibold"
                style={{ fontSize: 'var(--text-h3)' }}
              >
                ScolioScan
              </h2>
              <p
                className="text-[#888780]"
                style={{ fontSize: 'var(--text-caption)' }}
              >
                Administração
              </p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4">
          <p
            className="px-4 mb-2 uppercase tracking-wider text-[#666660]"
            style={{ fontSize: '11px', fontWeight: 'var(--weight-semibold)' }}
          >
            Geral
          </p>
          <ul className="space-y-1 mb-6">
            {navItem('/admin-panel', LayoutDashboard, 'Painel', true)}
          </ul>

          <p
            className="px-4 mb-2 uppercase tracking-wider text-[#666660]"
            style={{ fontSize: '11px', fontWeight: 'var(--weight-semibold)' }}
          >
            Acessos
          </p>
          <ul className="space-y-1 mb-6">
            {navItem('/admin-panel/users', Users, 'Utilizadores')}
            {navItem('/admin-panel/audit', ScrollText, 'Auditoria')}
          </ul>

          <p
            className="px-4 mb-2 uppercase tracking-wider text-[#666660]"
            style={{ fontSize: '11px', fontWeight: 'var(--weight-semibold)' }}
          >
            Sistema
          </p>
          <ul className="space-y-1 mb-6">
            {navItem('/admin-panel/settings', Settings, 'Definições')}
            {navItem('/admin-panel/ai', Cpu, 'IA & Dados')}
            {navItem('/admin-panel/compliance', ShieldCheck, 'Compliance')}
          </ul>
        </nav>

        {/* User */}
        <div className="p-4 border-t" style={{ borderColor: '#2A2A2A' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[var(--scolio-primary-blue)] flex items-center justify-center text-white font-medium">
              PO
            </div>
            <div className="flex-1 min-w-0">
              <p
                className="text-white font-medium truncate"
                style={{ fontSize: 'var(--text-body)' }}
              >
                Paulo Oliveira
              </p>
              <p
                className="text-[#888780] truncate"
                style={{ fontSize: 'var(--text-caption)' }}
              >
                Administrador
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-[var(--scolio-border-light)] px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2">
              <span
                className="text-[var(--scolio-text-secondary)]"
                style={{ fontSize: 'var(--text-body)' }}
              >
                Administração
              </span>
              <ChevronRight className="w-4 h-4 text-[var(--scolio-neutral-gray)]" />
              <span
                className="text-[var(--scolio-text-primary)]"
                style={{
                  fontSize: 'var(--text-body)',
                  fontWeight: 'var(--weight-medium)',
                }}
              >
                {currentLabel}
              </span>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--scolio-neutral-gray)]" />
                <input
                  type="search"
                  placeholder="Pesquisar utilizadores, eventos..."
                  className="pl-10 pr-3 py-2 w-full border border-[var(--scolio-border-light)] rounded-[var(--radius-component)] focus:outline-none focus:ring-2 focus:ring-[var(--scolio-primary-blue)] focus:border-transparent"
                />
              </div>

              <button className="relative p-2 text-[var(--scolio-text-secondary)] hover:text-[var(--scolio-text-primary)] transition-colors">
                <Bell className="w-5 h-5" />
                {notificationCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-[var(--scolio-danger-coral)] text-white rounded-full flex items-center justify-center text-xs font-medium">
                    {notificationCount}
                  </span>
                )}
              </button>

              <div className="w-9 h-9 rounded-full bg-[var(--scolio-primary-blue)] flex items-center justify-center text-white font-medium">
                PO
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
