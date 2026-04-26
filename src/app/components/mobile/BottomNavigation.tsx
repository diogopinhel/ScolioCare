import React from 'react';
import { Home, FileText, MessageCircle, User } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router';

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  path: string;
}

const navItems: NavItem[] = [
  { id: 'home', label: 'Início', icon: Home, path: '/mobile/home' },
  { id: 'exams', label: 'Os meus exames', icon: FileText, path: '/mobile/exams' },
  { id: 'assistant', label: 'Assistente', icon: MessageCircle, path: '/mobile/assistant' },
  { id: 'profile', label: 'Perfil', icon: User, path: '/mobile/profile' },
];

export default function BottomNavigation() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="bg-white border-t border-[var(--scolio-border-light)] px-2 py-2">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors ${
                isActive
                  ? 'text-[var(--scolio-primary-blue)]'
                  : 'text-[var(--scolio-neutral-gray)] hover:text-[var(--scolio-text-primary)]'
              }`}
            >
              <Icon className="w-6 h-6" strokeWidth={isActive ? 2.5 : 2} />
              <span
                className={isActive ? 'font-semibold' : 'font-normal'}
                style={{ fontSize: '11px' }}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}