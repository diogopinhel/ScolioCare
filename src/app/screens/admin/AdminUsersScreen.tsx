import React from 'react';
import { UserPlus, Edit2, Power, KeyRound, ShieldOff, MonitorSmartphone, CheckCircle, XCircle, Filter } from 'lucide-react';
import { Button } from '../../components/scolio';

type UserRow = {
  id: number;
  name: string;
  email: string;
  role: 'Médico' | 'Técnico' | 'Administrador';
  hospital: string;
  status: boolean;
  twoFactor: boolean;
  lastAccess: string;
  avatar: string;
};

const initialUsers: UserRow[] = [
  { id: 1, name: 'Dr. Ana Martins', email: 'ana.martins@chuln.pt', role: 'Médico', hospital: 'CHULN — Ortopedia', status: true, twoFactor: true, lastAccess: '2026-04-22 09:15', avatar: 'AM' },
  { id: 2, name: 'Ricardo Sousa', email: 'ricardo.sousa@chuln.pt', role: 'Técnico', hospital: 'CHULN — Imagiologia', status: true, twoFactor: true, lastAccess: '2026-04-22 08:42', avatar: 'RS' },
  { id: 3, name: 'Dr. Luísa Fernandes', email: 'luisa.fernandes@chuln.pt', role: 'Médico', hospital: 'CHULN — Ortopedia', status: true, twoFactor: false, lastAccess: '2026-04-21 17:30', avatar: 'LF' },
  { id: 4, name: 'Paulo Oliveira', email: 'paulo.oliveira@chuln.pt', role: 'Administrador', hospital: 'CHULN — TI', status: true, twoFactor: true, lastAccess: '2026-04-22 07:58', avatar: 'PO' },
  { id: 5, name: 'Catarina Silva', email: 'catarina.silva@chuln.pt', role: 'Técnico', hospital: 'CHULN — Imagiologia', status: false, twoFactor: false, lastAccess: '2026-04-15 14:22', avatar: 'CS' },
];

export default function AdminUsersScreen() {
  const [users, setUsers] = React.useState(initialUsers);
  const [showCreate, setShowCreate] = React.useState(false);
  const [editing, setEditing] = React.useState<UserRow | null>(null);
  const [confirm, setConfirm] = React.useState<{ kind: 'toggle' | 'reset' | 'revoke2fa'; user: UserRow } | null>(null);
  const [sessionsOpen, setSessionsOpen] = React.useState<UserRow | null>(null);

  const roleStyle = (role: string) => {
    const map: Record<string, { bg: string; fg: string }> = {
      'Médico': { bg: 'var(--scolio-light-blue-surface)', fg: 'var(--scolio-primary-blue)' },
      'Técnico': { bg: 'var(--scolio-success-surface)', fg: 'var(--scolio-success-green)' },
      'Administrador': { bg: 'var(--scolio-warning-surface)', fg: 'var(--scolio-warning-amber)' },
    };
    return map[role];
  };

  return (
    <div className="p-8 space-y-6 overflow-auto h-full">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-[var(--scolio-text-primary)]">Gestão de utilizadores</h1>
          <p className="text-[var(--scolio-text-secondary)] mt-1" style={{ fontSize: 'var(--text-body)' }}>{users.length} utilizadores no sistema</p>
        </div>
        <Button variant="primary" onClick={() => setShowCreate(true)}>
          <UserPlus className="w-4 h-4 mr-2 inline" /> Novo utilizador
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-[var(--radius-card)] shadow-sm border border-[var(--scolio-border-light)] p-4 grid grid-cols-5 gap-4">
        <div>
          <label className="block text-[var(--scolio-text-secondary)] mb-2" style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-medium)' }}>FUNÇÃO</label>
          <select className="w-full px-3 py-2 border border-[var(--scolio-border-light)] rounded-[var(--radius-component)]"><option>Todas</option><option>Médico</option><option>Técnico</option><option>Administrador</option></select>
        </div>
        <div>
          <label className="block text-[var(--scolio-text-secondary)] mb-2" style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-medium)' }}>ESTADO</label>
          <select className="w-full px-3 py-2 border border-[var(--scolio-border-light)] rounded-[var(--radius-component)]"><option>Todos</option><option>Activo</option><option>Inactivo</option></select>
        </div>
        <div>
          <label className="block text-[var(--scolio-text-secondary)] mb-2" style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-medium)' }}>HOSPITAL</label>
          <select className="w-full px-3 py-2 border border-[var(--scolio-border-light)] rounded-[var(--radius-component)]"><option>Todos</option><option>CHULN — Ortopedia</option><option>CHULN — Imagiologia</option><option>CHULN — TI</option></select>
        </div>
        <div>
          <label className="block text-[var(--scolio-text-secondary)] mb-2" style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-medium)' }}>ÚLTIMO ACESSO</label>
          <select className="w-full px-3 py-2 border border-[var(--scolio-border-light)] rounded-[var(--radius-component)]"><option>Qualquer altura</option><option>Últimas 24h</option><option>Últimos 7 dias</option><option>Há mais de 30 dias</option></select>
        </div>
        <div className="flex items-end"><Button variant="secondary" className="w-full"><Filter className="w-4 h-4 mr-2 inline" />Aplicar</Button></div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[var(--radius-card)] shadow-sm border border-[var(--scolio-border-light)] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--scolio-border-light)] bg-[var(--scolio-page-surface)]">
              <th className="text-left px-4 py-3 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-semibold)' }}>UTILIZADOR</th>
              <th className="text-left px-4 py-3 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-semibold)' }}>FUNÇÃO</th>
              <th className="text-left px-4 py-3 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-semibold)' }}>HOSPITAL / UNIDADE</th>
              <th className="text-left px-4 py-3 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-semibold)' }}>ESTADO</th>
              <th className="text-left px-4 py-3 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-semibold)' }}>2FA</th>
              <th className="text-left px-4 py-3 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-semibold)' }}>ÚLTIMO ACESSO</th>
              <th className="text-left px-4 py-3 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-semibold)' }}>AÇÕES</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => {
              const rs = roleStyle(u.role);
              return (
                <tr key={u.id} className="border-b border-[var(--scolio-border-light)] hover:bg-[var(--scolio-page-surface)]">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[var(--scolio-primary-blue)] flex items-center justify-center text-white font-medium" style={{ fontSize: 'var(--text-caption)' }}>{u.avatar}</div>
                      <div>
                        <p className="text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-body)' }}>{u.name}</p>
                        <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-3 py-1 rounded-full" style={{ backgroundColor: rs.bg, color: rs.fg, fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-medium)' }}>{u.role}</span>
                  </td>
                  <td className="px-4 py-3 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>{u.hospital}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => setConfirm({ kind: 'toggle', user: u })} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${u.status ? 'bg-[var(--scolio-success-green)]' : 'bg-[var(--scolio-neutral-gray)]'}`}>
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${u.status ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    {u.twoFactor ? <CheckCircle className="w-5 h-5 text-[var(--scolio-success-green)]" /> : <XCircle className="w-5 h-5 text-[var(--scolio-neutral-gray)]" />}
                  </td>
                  <td className="px-4 py-3 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>{u.lastAccess}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button title="Editar" onClick={() => setEditing(u)} className="p-2 text-[var(--scolio-text-secondary)] hover:text-[var(--scolio-primary-blue)] hover:bg-[var(--scolio-light-blue-surface)] rounded"><Edit2 className="w-4 h-4" /></button>
                      <button title="Reset password" onClick={() => setConfirm({ kind: 'reset', user: u })} className="p-2 text-[var(--scolio-text-secondary)] hover:text-[var(--scolio-warning-amber)] hover:bg-[var(--scolio-warning-surface)] rounded"><KeyRound className="w-4 h-4" /></button>
                      <button title="Revogar 2FA" onClick={() => setConfirm({ kind: 'revoke2fa', user: u })} className="p-2 text-[var(--scolio-text-secondary)] hover:text-[var(--scolio-danger-coral)] hover:bg-[var(--scolio-danger-surface)] rounded"><ShieldOff className="w-4 h-4" /></button>
                      <button title="Sessões activas" onClick={() => setSessionsOpen(u)} className="p-2 text-[var(--scolio-text-secondary)] hover:text-[var(--scolio-primary-blue)] hover:bg-[var(--scolio-light-blue-surface)] rounded"><MonitorSmartphone className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {(showCreate || editing) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-[var(--radius-modal)] w-[560px] overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-[var(--scolio-border-light)]">
              <h2 className="text-[var(--scolio-text-primary)]">{editing ? 'Editar utilizador' : 'Novo utilizador'}</h2>
            </div>
            <div className="p-6 space-y-4 overflow-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[var(--scolio-text-primary)] mb-2" style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)' }}>Nome completo</label>
                  <input defaultValue={editing?.name} type="text" className="w-full px-3 py-2 border border-[var(--scolio-border-light)] rounded-[var(--radius-component)]" placeholder="Ex: Dr. João Silva" />
                </div>
                <div>
                  <label className="block text-[var(--scolio-text-primary)] mb-2" style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)' }}>Email institucional</label>
                  <input defaultValue={editing?.email} type="email" className="w-full px-3 py-2 border border-[var(--scolio-border-light)] rounded-[var(--radius-component)]" placeholder="joao.silva@chuln.pt" />
                </div>
                <div>
                  <label className="block text-[var(--scolio-text-primary)] mb-2" style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)' }}>Função</label>
                  <select defaultValue={editing?.role} className="w-full px-3 py-2 border border-[var(--scolio-border-light)] rounded-[var(--radius-component)]"><option>Médico</option><option>Técnico</option><option>Administrador</option></select>
                </div>
                <div>
                  <label className="block text-[var(--scolio-text-primary)] mb-2" style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)' }}>Hospital</label>
                  <select className="w-full px-3 py-2 border border-[var(--scolio-border-light)] rounded-[var(--radius-component)]"><option>CHULN</option></select>
                </div>
                <div className="col-span-2">
                  <label className="block text-[var(--scolio-text-primary)] mb-2" style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)' }}>Unidade</label>
                  <select className="w-full px-3 py-2 border border-[var(--scolio-border-light)] rounded-[var(--radius-component)]"><option>Ortopedia</option><option>Imagiologia</option><option>TI</option></select>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-[var(--scolio-page-surface)] rounded-[var(--radius-component)]">
                <input type="checkbox" id="force2fa" defaultChecked className="w-4 h-4" />
                <label htmlFor="force2fa" className="text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-body)' }}>Forçar 2FA obrigatório</label>
              </div>
            </div>
            <div className="p-6 border-t border-[var(--scolio-border-light)] flex justify-end gap-3">
              <Button variant="secondary" onClick={() => { setShowCreate(false); setEditing(null); }}>Cancelar</Button>
              <Button variant="primary" onClick={() => { setShowCreate(false); setEditing(null); }}>{editing ? 'Guardar' : 'Criar utilizador'}</Button>
            </div>
          </div>
        </div>
      )}

      {confirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-[var(--radius-modal)] w-[460px] overflow-hidden">
            <div className="p-6">
              <h2 className="text-[var(--scolio-text-primary)] mb-2">
                {confirm.kind === 'toggle' && (confirm.user.status ? 'Desactivar conta?' : 'Activar conta?')}
                {confirm.kind === 'reset' && 'Repor palavra-passe?'}
                {confirm.kind === 'revoke2fa' && 'Revogar 2FA?'}
              </h2>
              <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>
                {confirm.kind === 'toggle' && `${confirm.user.name} ${confirm.user.status ? 'deixará de poder iniciar sessão' : 'volta a ter acesso ao sistema'}.`}
                {confirm.kind === 'reset' && `Será enviado um email para ${confirm.user.email} com instruções de reposição.`}
                {confirm.kind === 'revoke2fa' && `O segundo factor de ${confirm.user.name} será removido. Esta acção fica registada na auditoria como evento de segurança.`}
              </p>
            </div>
            <div className="p-6 border-t border-[var(--scolio-border-light)] flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setConfirm(null)}>Cancelar</Button>
              <Button variant={confirm.kind === 'revoke2fa' ? 'danger' : 'primary'} onClick={() => {
                if (confirm.kind === 'toggle') setUsers(users.map(u => u.id === confirm.user.id ? { ...u, status: !u.status } : u));
                if (confirm.kind === 'revoke2fa') setUsers(users.map(u => u.id === confirm.user.id ? { ...u, twoFactor: false } : u));
                setConfirm(null);
              }}>Confirmar</Button>
            </div>
          </div>
        </div>
      )}

      {sessionsOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-[var(--radius-modal)] w-[560px] overflow-hidden">
            <div className="p-6 border-b border-[var(--scolio-border-light)]">
              <h2 className="text-[var(--scolio-text-primary)]">Sessões activas — {sessionsOpen.name}</h2>
            </div>
            <div className="p-6 space-y-3">
              {[
                { device: 'MacBook Pro · Chrome 124', ip: '192.168.1.45', loc: 'Lisboa, PT', since: 'Hoje, 09:15' },
                { device: 'iPhone 14 · Safari', ip: '192.168.1.78', loc: 'Lisboa, PT', since: 'Hoje, 07:42' },
              ].map((s, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-[var(--scolio-page-surface)] rounded-[var(--radius-component)]">
                  <div>
                    <p className="text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)' }}>{s.device}</p>
                    <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>{s.ip} · {s.loc} · desde {s.since}</p>
                  </div>
                  <Button variant="ghost" className="text-xs px-3 py-1">Terminar</Button>
                </div>
              ))}
            </div>
            <div className="p-6 border-t border-[var(--scolio-border-light)] flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setSessionsOpen(null)}>Fechar</Button>
              <Button variant="danger">Terminar todas</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
