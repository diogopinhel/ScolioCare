import React from 'react';
import { Search, Download, FileText, AlertTriangle } from 'lucide-react';
import { Button } from '../../components/scolio';

type AuditEvent = {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  resource: string;
  ip: string;
  category: 'auth' | 'data' | 'glassbreak' | 'config' | 'export';
};

const events: AuditEvent[] = [
  { id: 'EV-89421', timestamp: '2026-04-22 09:42:18', user: 'desconhecido@—', action: 'Login falhado (5 tentativas)', resource: 'auth/login', ip: '203.45.12.88', category: 'auth' },
  { id: 'EV-89420', timestamp: '2026-04-22 09:15:02', user: 'Dr. Ana Martins', action: 'Validação de exame', resource: 'exam/EX-2026-0124', ip: '192.168.1.45', category: 'data' },
  { id: 'EV-89419', timestamp: '2026-04-22 08:45:33', user: 'Dr. Ana Martins', action: 'Acesso Glass-Break a paciente', resource: 'patient/PT-2024-0756', ip: '192.168.1.45', category: 'glassbreak' },
  { id: 'EV-89418', timestamp: '2026-04-22 08:42:11', user: 'Ricardo Sousa', action: 'Upload de exame', resource: 'exam/EX-2026-0124', ip: '192.168.1.62', category: 'data' },
  { id: 'EV-89417', timestamp: '2026-04-22 08:30:45', user: 'Paulo Oliveira', action: 'Exportação de auditoria CSV', resource: 'audit/export', ip: '192.168.1.38', category: 'export' },
  { id: 'EV-89416', timestamp: '2026-04-22 07:58:22', user: 'Paulo Oliveira', action: 'Início de sessão', resource: 'auth/login', ip: '192.168.1.38', category: 'auth' },
  { id: 'EV-89415', timestamp: '2026-04-22 07:12:09', user: 'Dr. Luísa Fernandes', action: 'Alteração de relatório assinado', resource: 'report/RP-2026-0418', ip: '192.168.1.67', category: 'data' },
  { id: 'EV-89414', timestamp: '2026-04-21 18:42:00', user: 'Paulo Oliveira', action: 'Alteração de threshold IA (auto-aceitar)', resource: 'config/ai', ip: '192.168.1.38', category: 'config' },
  { id: 'EV-89413', timestamp: '2026-04-21 17:15:33', user: 'Dr. Luísa Fernandes', action: 'Acesso Glass-Break a paciente', resource: 'patient/PT-2024-0445', ip: '192.168.1.67', category: 'glassbreak' },
];

const categoryStyle = (cat: AuditEvent['category']) => {
  const map = {
    auth: { label: 'Autenticação', bg: 'var(--scolio-light-blue-surface)', fg: 'var(--scolio-primary-blue)' },
    data: { label: 'Dados clínicos', bg: 'var(--scolio-success-surface)', fg: 'var(--scolio-success-green)' },
    glassbreak: { label: 'Glass-Break', bg: 'var(--scolio-danger-surface)', fg: 'var(--scolio-danger-coral)' },
    config: { label: 'Configuração', bg: 'var(--scolio-warning-surface)', fg: 'var(--scolio-warning-amber)' },
    export: { label: 'Exportação', bg: 'var(--scolio-neutral-surface)', fg: 'var(--scolio-neutral-gray)' },
  };
  return map[cat];
};

export default function AdminAuditScreen() {
  const [search, setSearch] = React.useState('');
  const filtered = events.filter(e =>
    e.user.toLowerCase().includes(search.toLowerCase()) ||
    e.action.toLowerCase().includes(search.toLowerCase()) ||
    e.resource.toLowerCase().includes(search.toLowerCase()) ||
    e.ip.includes(search)
  );

  return (
    <div className="p-8 space-y-6 overflow-auto h-full">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-[var(--scolio-text-primary)]">Auditoria global</h1>
          <p className="text-[var(--scolio-text-secondary)] mt-1" style={{ fontSize: 'var(--text-body)' }}>{filtered.length} de {events.length} eventos · período: últimas 24h</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary"><Download className="w-4 h-4 mr-2 inline" /> Exportar CSV</Button>
          <Button variant="primary"><FileText className="w-4 h-4 mr-2 inline" /> Exportar PDF</Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-[var(--radius-card)] shadow-sm border border-[var(--scolio-border-light)] p-4 grid grid-cols-6 gap-4">
        <div className="col-span-2">
          <label className="block text-[var(--scolio-text-secondary)] mb-2" style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-medium)' }}>PESQUISA</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--scolio-neutral-gray)]" />
            <input value={search} onChange={e => setSearch(e.target.value)} type="search" placeholder="Utilizador, ação, recurso, IP..." className="w-full pl-10 pr-3 py-2 border border-[var(--scolio-border-light)] rounded-[var(--radius-component)] focus:outline-none focus:ring-2 focus:ring-[var(--scolio-primary-blue)]" />
          </div>
        </div>
        <div>
          <label className="block text-[var(--scolio-text-secondary)] mb-2" style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-medium)' }}>CATEGORIA</label>
          <select className="w-full px-3 py-2 border border-[var(--scolio-border-light)] rounded-[var(--radius-component)]"><option>Todas</option><option>Autenticação</option><option>Dados clínicos</option><option>Glass-Break</option><option>Configuração</option><option>Exportação</option></select>
        </div>
        <div>
          <label className="block text-[var(--scolio-text-secondary)] mb-2" style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-medium)' }}>DESDE</label>
          <input type="date" defaultValue="2026-04-21" className="w-full px-3 py-2 border border-[var(--scolio-border-light)] rounded-[var(--radius-component)]" />
        </div>
        <div>
          <label className="block text-[var(--scolio-text-secondary)] mb-2" style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-medium)' }}>ATÉ</label>
          <input type="date" defaultValue="2026-04-22" className="w-full px-3 py-2 border border-[var(--scolio-border-light)] rounded-[var(--radius-component)]" />
        </div>
        <div>
          <label className="block text-[var(--scolio-text-secondary)] mb-2" style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-medium)' }}>IP</label>
          <input type="text" placeholder="192.168.x.x" className="w-full px-3 py-2 border border-[var(--scolio-border-light)] rounded-[var(--radius-component)]" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[var(--radius-card)] shadow-sm border border-[var(--scolio-border-light)] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--scolio-border-light)] bg-[var(--scolio-page-surface)]">
              <th className="text-left px-4 py-3 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-semibold)' }}>ID</th>
              <th className="text-left px-4 py-3 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-semibold)' }}>TIMESTAMP</th>
              <th className="text-left px-4 py-3 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-semibold)' }}>UTILIZADOR</th>
              <th className="text-left px-4 py-3 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-semibold)' }}>AÇÃO</th>
              <th className="text-left px-4 py-3 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-semibold)' }}>RECURSO</th>
              <th className="text-left px-4 py-3 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-semibold)' }}>CATEGORIA</th>
              <th className="text-left px-4 py-3 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-semibold)' }}>IP</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(ev => {
              const cs = categoryStyle(ev.category);
              const isGB = ev.category === 'glassbreak';
              return (
                <tr key={ev.id} className={`border-b border-[var(--scolio-border-light)] ${isGB ? 'bg-[var(--scolio-danger-surface)]' : 'hover:bg-[var(--scolio-page-surface)]'}`}>
                  <td className="px-4 py-3"><code className="px-2 py-0.5 bg-[var(--scolio-neutral-surface)] rounded" style={{ fontSize: 'var(--text-caption)' }}>{ev.id}</code></td>
                  <td className="px-4 py-3 text-[var(--scolio-text-secondary)] font-mono" style={{ fontSize: 'var(--text-caption)' }}>{ev.timestamp}</td>
                  <td className="px-4 py-3 text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-body)' }}>{ev.user}</td>
                  <td className="px-4 py-3 text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-body)' }}>
                    <div className="flex items-center gap-2">
                      {isGB && <AlertTriangle className="w-4 h-4 text-[var(--scolio-danger-coral)]" />}
                      {ev.action}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[var(--scolio-text-secondary)] font-mono" style={{ fontSize: 'var(--text-caption)' }}>{ev.resource}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full" style={{ backgroundColor: cs.bg, color: cs.fg, fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-medium)' }}>{cs.label}</span>
                  </td>
                  <td className="px-4 py-3 text-[var(--scolio-text-secondary)] font-mono" style={{ fontSize: 'var(--text-caption)' }}>{ev.ip}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
