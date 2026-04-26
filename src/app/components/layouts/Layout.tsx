import React from 'react';
import { Outlet, NavLink, Link } from 'react-router';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  BarChart3, 
  Settings, 
  Search,
  Bell,
  Globe,
  ChevronDown,
  LogOut,
  ShieldCheck
} from 'lucide-react';

export default function Layout() {
  const [notificationCount] = React.useState(3);

  return (
    <div className="flex h-screen bg-[var(--scolio-page-surface)] w-[1440px] mx-auto">
      {/* Fixed Left Sidebar - 240px */}
      <aside className="w-60 bg-white border-r border-[var(--scolio-border-light)] flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-[var(--scolio-border-light)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[var(--scolio-primary-blue)] rounded-lg flex items-center justify-center">
              <span className="text-white text-xl font-semibold">S</span>
            </div>
            <div>
              <h2 className="text-[var(--scolio-text-primary)] font-semibold" style={{ fontSize: 'var(--text-h3)' }}>
                ScolioScan
              </h2>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
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
            <li>
              <NavLink
                to="/admin-panel"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-[var(--scolio-light-blue-surface)] text-[var(--scolio-primary-blue)]'
                      : 'text-[var(--scolio-text-secondary)] hover:bg-[var(--scolio-page-surface)]'
                  }`
                }
              >
                <Settings className="w-5 h-5" />
                <span style={{ fontSize: 'var(--text-body)' }}>Administração</span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/ui-audit"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-[var(--scolio-light-blue-surface)] text-[var(--scolio-primary-blue)]'
                      : 'text-[var(--scolio-text-secondary)] hover:bg-[var(--scolio-page-surface)]'
                  }`
                }
              >
                <ShieldCheck className="w-5 h-5" />
                <span style={{ fontSize: 'var(--text-body)' }}>Auditoria UI/UX</span>
              </NavLink>
            </li>
          </ul>
        </nav>

        {/* User Info at Bottom */}
        <div className="p-4 border-t border-[var(--scolio-border-light)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[var(--scolio-primary-blue)] flex items-center justify-center text-white font-medium">
              AM
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[var(--scolio-text-primary)] font-medium truncate" style={{ fontSize: 'var(--text-body)' }}>
                Dr. Ana Martins
              </p>
              <p className="text-[var(--scolio-text-secondary)] truncate" style={{ fontSize: 'var(--text-caption)' }}>
                Ortopedista
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="bg-white border-b border-[var(--scolio-border-light)] px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Global Search */}
            <div className="relative w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--scolio-neutral-gray)]" />
              <input
                type="search"
                placeholder="Pesquisar pacientes, exames, relatórios..."
                className="pl-10 pr-3 py-2 w-full border border-[var(--scolio-border-light)] rounded-[var(--radius-component)] focus:outline-none focus:ring-2 focus:ring-[var(--scolio-primary-blue)] focus:border-transparent"
              />
            </div>

            {/* Right Side Controls */}
            <div className="flex items-center gap-4">
              {/* Language Selector */}
              <button className="flex items-center gap-2 px-3 py-2 text-[var(--scolio-text-secondary)] hover:text-[var(--scolio-text-primary)] transition-colors">
                <Globe className="w-5 h-5" />
                <span style={{ fontSize: 'var(--text-body)' }}>PT</span>
                <ChevronDown className="w-4 h-4" />
              </button>

              {/* Notifications */}
              <button className="relative p-2 text-[var(--scolio-text-secondary)] hover:text-[var(--scolio-text-primary)] transition-colors">
                <Bell className="w-5 h-5" />
                {notificationCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-[var(--scolio-danger-coral)] text-white rounded-full flex items-center justify-center text-xs font-medium">
                    {notificationCount}
                  </span>
                )}
              </button>

              {/* User Avatar */}
              <div className="w-9 h-9 rounded-full bg-[var(--scolio-primary-blue)] flex items-center justify-center text-white font-medium">
                AM
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}