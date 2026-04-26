import React from 'react';
import { useNavigate } from 'react-router';
import { Search, UserPlus, Lock } from 'lucide-react';
import { Button } from '../../components/scolio';

const patients = [
  { id: 'PT-2024-0847', name: 'Maria Silva', age: 17, gender: 'F', lastExam: '2026-04-22', examsCount: 4 },
  { id: 'PT-2024-0812', name: 'João Santos', age: 14, gender: 'M', lastExam: '2026-04-22', examsCount: 2 },
  { id: 'PT-2024-0756', name: 'Ana Costa', age: 16, gender: 'F', lastExam: '2026-04-22', examsCount: 3 },
  { id: 'PT-2024-0691', name: 'Pedro Oliveira', age: 15, gender: 'M', lastExam: '2026-04-22', examsCount: 1 },
  { id: 'PT-2024-0903', name: 'Sofia Pereira', age: 13, gender: 'F', lastExam: '2026-04-22', examsCount: 1 },
  { id: 'PT-2024-0521', name: 'Beatriz Almeida', age: 16, gender: 'F', lastExam: '2026-04-21', examsCount: 5 },
  { id: 'PT-2024-0445', name: 'Miguel Fernandes', age: 12, gender: 'M', lastExam: '2026-04-21', examsCount: 2 },
];

export default function TecnicoPatientsScreen() {
  const [search, setSearch] = React.useState('');
  const [showCreate, setShowCreate] = React.useState(false);

  const filtered = patients.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 space-y-6 overflow-auto h-full">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-[var(--scolio-text-primary)]">Pacientes</h1>
          <p className="text-[var(--scolio-text-secondary)] mt-1" style={{ fontSize: 'var(--text-body)' }}>
            Vista operacional. Notas clínicas e relatórios estão restritos ao médico.
          </p>
        </div>
        <Button variant="primary" onClick={() => setShowCreate(true)}>
          <UserPlus className="w-4 h-4 mr-2 inline" />
          Novo paciente
        </Button>
      </div>

      {/* Restricted notice */}
      <div className="bg-[var(--scolio-light-blue-surface)] border border-[var(--scolio-primary-blue)] border-opacity-20 rounded-[var(--radius-card)] p-4 flex items-start gap-3">
        <Lock className="w-5 h-5 text-[var(--scolio-primary-blue)] flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)' }}>
            Acesso limitado às funções operacionais
          </p>
          <p className="text-[var(--scolio-text-secondary)] mt-0.5" style={{ fontSize: 'var(--text-caption)' }}>
            Apenas dados básicos do paciente. Para histórico clínico, evolução ou relatórios, contacta o médico responsável.
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-[var(--radius-card)] shadow-sm border border-[var(--scolio-border-light)] p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--scolio-neutral-gray)]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            type="search"
            placeholder="Pesquisar por nome ou ID (PT-AAAA-XXXX)..."
            className="w-full pl-10 pr-3 py-2 border border-[var(--scolio-border-light)] rounded-[var(--radius-component)] focus:outline-none focus:ring-2 focus:ring-[var(--scolio-success-green)]"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[var(--radius-card)] shadow-sm border border-[var(--scolio-border-light)] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--scolio-border-light)] bg-[var(--scolio-page-surface)]">
              <th className="text-left px-4 py-3 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-semibold)' }}>ID</th>
              <th className="text-left px-4 py-3 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-semibold)' }}>NOME</th>
              <th className="text-left px-4 py-3 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-semibold)' }}>IDADE</th>
              <th className="text-left px-4 py-3 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-semibold)' }}>GÉNERO</th>
              <th className="text-left px-4 py-3 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-semibold)' }}>ÚLTIMO EXAME</th>
              <th className="text-left px-4 py-3 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-semibold)' }}>Nº EXAMES</th>
              <th className="text-left px-4 py-3 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-semibold)' }}>AÇÕES</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p.id} className="border-b border-[var(--scolio-border-light)] hover:bg-[var(--scolio-page-surface)] transition-colors">
                <td className="px-4 py-3">
                  <code className="px-2 py-0.5 bg-[var(--scolio-neutral-surface)] rounded text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-caption)' }}>{p.id}</code>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[var(--scolio-success-green)] flex items-center justify-center text-white font-medium" style={{ fontSize: 'var(--text-caption)' }}>
                      {p.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <span className="text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-body)' }}>{p.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>{p.age} anos</td>
                <td className="px-4 py-3 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>{p.gender}</td>
                <td className="px-4 py-3 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>{p.lastExam}</td>
                <td className="px-4 py-3 text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-body)' }}>{p.examsCount}</td>
                <td className="px-4 py-3">
                  <Button variant="ghost" className="text-xs px-3 py-1">Associar exame</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-[var(--radius-modal)] w-[520px] overflow-hidden">
            <div className="p-6 border-b border-[var(--scolio-border-light)]">
              <h2 className="text-[var(--scolio-text-primary)]">Novo paciente</h2>
              <p className="text-[var(--scolio-text-secondary)] mt-1" style={{ fontSize: 'var(--text-caption)' }}>
                Formulário simplificado. Notas clínicas serão preenchidas pelo médico responsável.
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[var(--scolio-text-primary)] mb-2" style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)' }}>Nome completo</label>
                  <input type="text" placeholder="Ex: Maria Silva" className="w-full px-3 py-2 border border-[var(--scolio-border-light)] rounded-[var(--radius-component)] focus:outline-none focus:ring-2 focus:ring-[var(--scolio-success-green)]" />
                </div>
                <div>
                  <label className="block text-[var(--scolio-text-primary)] mb-2" style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)' }}>Data de nascimento</label>
                  <input type="date" className="w-full px-3 py-2 border border-[var(--scolio-border-light)] rounded-[var(--radius-component)] focus:outline-none focus:ring-2 focus:ring-[var(--scolio-success-green)]" />
                </div>
                <div>
                  <label className="block text-[var(--scolio-text-primary)] mb-2" style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)' }}>Género</label>
                  <select className="w-full px-3 py-2 border border-[var(--scolio-border-light)] rounded-[var(--radius-component)] focus:outline-none focus:ring-2 focus:ring-[var(--scolio-success-green)]">
                    <option>Feminino</option>
                    <option>Masculino</option>
                    <option>Outro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[var(--scolio-text-primary)] mb-2" style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)' }}>ID clínico</label>
                  <input type="text" placeholder="PT-2026-XXXX" className="w-full px-3 py-2 border border-[var(--scolio-border-light)] rounded-[var(--radius-component)] focus:outline-none focus:ring-2 focus:ring-[var(--scolio-success-green)]" />
                </div>
                <div className="col-span-2">
                  <label className="block text-[var(--scolio-text-primary)] mb-2" style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)' }}>Médico responsável</label>
                  <select className="w-full px-3 py-2 border border-[var(--scolio-border-light)] rounded-[var(--radius-component)] focus:outline-none focus:ring-2 focus:ring-[var(--scolio-success-green)]">
                    <option>Dr. Ana Martins</option>
                    <option>Dr. Luísa Fernandes</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-[var(--scolio-border-light)] flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancelar</Button>
              <Button variant="primary" onClick={() => setShowCreate(false)}>Criar paciente</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
