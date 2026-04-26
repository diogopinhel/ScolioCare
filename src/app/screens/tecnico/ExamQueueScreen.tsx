import React from 'react';
import { Filter, RotateCcw, Archive, Eye, Clock3 } from 'lucide-react';
import { Button } from '../../components/scolio';

type QueueStatus = 'uploaded' | 'processing' | 'ready' | 'validated' | 'returned';

const allExams: {
  id: string;
  patient: string;
  patientId: string;
  date: string;
  status: QueueStatus;
  confidence: number;
  doctor: string;
  technician: string;
  hoursWaiting: number;
}[] = [
  { id: 'EX-2026-0124', patient: 'Maria Silva', patientId: 'PT-2024-0847', date: '2026-04-22 08:42', status: 'ready', confidence: 94, doctor: 'Dr. Ana Martins', technician: 'Ricardo Sousa', hoursWaiting: 5 },
  { id: 'EX-2026-0125', patient: 'João Santos', patientId: 'PT-2024-0812', date: '2026-04-22 09:08', status: 'processing', confidence: 0, doctor: 'Dr. Ana Martins', technician: 'Ricardo Sousa', hoursWaiting: 0 },
  { id: 'EX-2026-0126', patient: 'Ana Costa', patientId: 'PT-2024-0756', date: '2026-04-22 09:15', status: 'ready', confidence: 68, doctor: 'Dr. Luísa Fernandes', technician: 'Ricardo Sousa', hoursWaiting: 4.5 },
  { id: 'EX-2026-0127', patient: 'Pedro Oliveira', patientId: 'PT-2024-0691', date: '2026-04-22 09:32', status: 'returned', confidence: 87, doctor: 'Dr. Ana Martins', technician: 'Ricardo Sousa', hoursWaiting: 0 },
  { id: 'EX-2026-0128', patient: 'Sofia Pereira', patientId: 'PT-2024-0903', date: '2026-04-22 09:48', status: 'uploaded', confidence: 0, doctor: 'Dr. Luísa Fernandes', technician: 'Ricardo Sousa', hoursWaiting: 0 },
  { id: 'EX-2026-0123', patient: 'Beatriz Almeida', patientId: 'PT-2024-0521', date: '2026-04-21 16:22', status: 'validated', confidence: 96, doctor: 'Dr. Ana Martins', technician: 'Catarina Silva', hoursWaiting: 0 },
  { id: 'EX-2026-0122', patient: 'Miguel Fernandes', patientId: 'PT-2024-0445', date: '2026-04-21 14:08', status: 'returned', confidence: 72, doctor: 'Dr. Luísa Fernandes', technician: 'Catarina Silva', hoursWaiting: 0 },
  { id: 'EX-2026-0121', patient: 'Laura Gomes', patientId: 'PT-2024-0398', date: '2026-04-21 11:50', status: 'ready', confidence: 91, doctor: 'Dr. Ana Martins', technician: 'Ricardo Sousa', hoursWaiting: 22 },
];

function statusBadge(s: QueueStatus) {
  const map: Record<QueueStatus, { label: string; bg: string; fg: string }> = {
    uploaded: { label: 'Carregado', bg: 'var(--scolio-neutral-surface)', fg: 'var(--scolio-neutral-gray)' },
    processing: { label: 'A processar', bg: 'var(--scolio-light-blue-surface)', fg: 'var(--scolio-primary-blue)' },
    ready: { label: 'Pronto', bg: 'var(--scolio-warning-surface)', fg: 'var(--scolio-warning-amber)' },
    validated: { label: 'Validado', bg: 'var(--scolio-success-surface)', fg: 'var(--scolio-success-green)' },
    returned: { label: 'Devolvido', bg: 'var(--scolio-danger-surface)', fg: 'var(--scolio-danger-coral)' },
  };
  const c = map[s];
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full" style={{ backgroundColor: c.bg, color: c.fg, fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-medium)' }}>
      {c.label}
    </span>
  );
}

export default function ExamQueueScreen() {
  const [statusFilter, setStatusFilter] = React.useState<string>('all');
  const [archiveModal, setArchiveModal] = React.useState<string | null>(null);
  const [archiveReason, setArchiveReason] = React.useState('');

  const filtered = statusFilter === 'all' ? allExams : allExams.filter(e => e.status === statusFilter);

  return (
    <div className="p-8 space-y-6 overflow-auto h-full">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-[var(--scolio-text-primary)]">Fila de exames</h1>
          <p className="text-[var(--scolio-text-secondary)] mt-1" style={{ fontSize: 'var(--text-body)' }}>
            {filtered.length} de {allExams.length} exames
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-[var(--radius-card)] shadow-sm border border-[var(--scolio-border-light)] p-4">
        <div className="grid grid-cols-5 gap-4">
          <div>
            <label className="block text-[var(--scolio-text-secondary)] mb-2" style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-medium)' }}>ESTADO</label>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-full px-3 py-2 border border-[var(--scolio-border-light)] rounded-[var(--radius-component)] focus:outline-none focus:ring-2 focus:ring-[var(--scolio-success-green)]">
              <option value="all">Todos</option>
              <option value="uploaded">Carregado</option>
              <option value="processing">A processar</option>
              <option value="ready">Pronto</option>
              <option value="validated">Validado</option>
              <option value="returned">Devolvido</option>
            </select>
          </div>
          <div>
            <label className="block text-[var(--scolio-text-secondary)] mb-2" style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-medium)' }}>DATA DESDE</label>
            <input type="date" defaultValue="2026-04-21" className="w-full px-3 py-2 border border-[var(--scolio-border-light)] rounded-[var(--radius-component)] focus:outline-none focus:ring-2 focus:ring-[var(--scolio-success-green)]" />
          </div>
          <div>
            <label className="block text-[var(--scolio-text-secondary)] mb-2" style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-medium)' }}>MÉDICO</label>
            <select className="w-full px-3 py-2 border border-[var(--scolio-border-light)] rounded-[var(--radius-component)] focus:outline-none focus:ring-2 focus:ring-[var(--scolio-success-green)]">
              <option>Todos</option>
              <option>Dr. Ana Martins</option>
              <option>Dr. Luísa Fernandes</option>
            </select>
          </div>
          <div>
            <label className="block text-[var(--scolio-text-secondary)] mb-2" style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-medium)' }}>TÉCNICO</label>
            <select className="w-full px-3 py-2 border border-[var(--scolio-border-light)] rounded-[var(--radius-component)] focus:outline-none focus:ring-2 focus:ring-[var(--scolio-success-green)]">
              <option>Todos</option>
              <option>Ricardo Sousa</option>
              <option>Catarina Silva</option>
            </select>
          </div>
          <div className="flex items-end">
            <Button variant="secondary" className="w-full"><Filter className="w-4 h-4 mr-2 inline" />Aplicar filtros</Button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[var(--radius-card)] shadow-sm border border-[var(--scolio-border-light)] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--scolio-border-light)] bg-[var(--scolio-page-surface)]">
              <th className="text-left px-4 py-3 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-semibold)' }}>EXAME</th>
              <th className="text-left px-4 py-3 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-semibold)' }}>PACIENTE</th>
              <th className="text-left px-4 py-3 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-semibold)' }}>DATA</th>
              <th className="text-left px-4 py-3 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-semibold)' }}>ESTADO</th>
              <th className="text-left px-4 py-3 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-semibold)' }}>CONFIANÇA IA</th>
              <th className="text-left px-4 py-3 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-semibold)' }}>MÉDICO</th>
              <th className="text-left px-4 py-3 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-semibold)' }}>AÇÕES</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(ex => {
              const slaWarn = ex.status === 'ready' && ex.hoursWaiting > 4;
              const lowConf = ex.confidence > 0 && ex.confidence < 70;
              return (
                <tr key={ex.id} className={`border-b border-[var(--scolio-border-light)] transition-colors ${slaWarn ? 'bg-[var(--scolio-warning-surface)]' : 'hover:bg-[var(--scolio-page-surface)]'}`}>
                  <td className="px-4 py-3">
                    <code className="px-2 py-0.5 bg-[var(--scolio-neutral-surface)] rounded text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-caption)' }}>{ex.id}</code>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-body)' }}>{ex.patient}</p>
                    <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>{ex.patientId}</p>
                  </td>
                  <td className="px-4 py-3 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>{ex.date}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {statusBadge(ex.status)}
                      {slaWarn && (
                        <span className="inline-flex items-center gap-1 text-[var(--scolio-warning-amber)]" title={`${ex.hoursWaiting}h sem validação`}>
                          <Clock3 className="w-3.5 h-3.5" />
                          <span style={{ fontSize: 'var(--text-caption)' }}>SLA {ex.hoursWaiting}h</span>
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {ex.confidence === 0 ? (
                      <span className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>—</span>
                    ) : (
                      <span className={lowConf ? 'text-[var(--scolio-warning-amber)] font-semibold' : 'text-[var(--scolio-text-primary)]'} style={{ fontSize: 'var(--text-body)' }}>
                        {ex.confidence}%
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>{ex.doctor}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button title="Ver detalhe (apenas leitura)" className="p-2 text-[var(--scolio-text-secondary)] hover:text-[var(--scolio-success-green)] hover:bg-[var(--scolio-success-surface)] rounded transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                      {ex.status === 'returned' && (
                        <button title="Reenviar para médico" className="p-2 text-[var(--scolio-text-secondary)] hover:text-[var(--scolio-primary-blue)] hover:bg-[var(--scolio-light-blue-surface)] rounded transition-colors">
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      )}
                      <button onClick={() => setArchiveModal(ex.id)} title="Arquivar exame" className="p-2 text-[var(--scolio-text-secondary)] hover:text-[var(--scolio-danger-coral)] hover:bg-[var(--scolio-danger-surface)] rounded transition-colors">
                        <Archive className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {archiveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-[var(--radius-modal)] w-[500px] overflow-hidden">
            <div className="p-6 border-b border-[var(--scolio-border-light)]">
              <h2 className="text-[var(--scolio-text-primary)]">Arquivar exame {archiveModal}</h2>
              <p className="text-[var(--scolio-text-secondary)] mt-1" style={{ fontSize: 'var(--text-body)' }}>É obrigatório indicar o motivo. Esta ação fica registada na auditoria.</p>
            </div>
            <div className="p-6">
              <label className="block text-[var(--scolio-text-primary)] mb-2" style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)' }}>Motivo do arquivamento</label>
              <textarea value={archiveReason} onChange={e => setArchiveReason(e.target.value)} rows={4} className="w-full px-3 py-2 border border-[var(--scolio-border-light)] rounded-[var(--radius-component)] focus:outline-none focus:ring-2 focus:ring-[var(--scolio-success-green)]" placeholder="Ex: Imagem com artefacto, paciente não compareceu para repetição..." />
            </div>
            <div className="p-6 border-t border-[var(--scolio-border-light)] flex justify-end gap-3">
              <Button variant="secondary" onClick={() => { setArchiveModal(null); setArchiveReason(''); }}>Cancelar</Button>
              <Button variant="danger" onClick={() => { setArchiveModal(null); setArchiveReason(''); }} disabled={archiveReason.trim().length < 10}>
                Arquivar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
