import React from 'react';
import { useNavigate } from 'react-router';
import {
  Upload,
  Loader2,
  CheckCircle2,
  RotateCcw,
  AlertTriangle,
  Activity,
  TrendingUp,
  Clock3,
} from 'lucide-react';
import { Button, StatusBadge } from '../../components/scolio';

const kpis = [
  {
    icon: Upload,
    iconColor: 'var(--scolio-success-green)',
    iconBg: 'var(--scolio-success-surface)',
    label: 'Exames carregados hoje',
    value: '14',
    delta: '+3 vs ontem',
  },
  {
    icon: Loader2,
    iconColor: 'var(--scolio-primary-blue)',
    iconBg: 'var(--scolio-light-blue-surface)',
    label: 'Em processamento IA',
    value: '5',
    delta: 'Tempo médio: 2m 14s',
  },
  {
    icon: CheckCircle2,
    iconColor: 'var(--scolio-warning-amber)',
    iconBg: 'var(--scolio-warning-surface)',
    label: 'Prontos para validação',
    value: '9',
    delta: 'A aguardar médico',
  },
  {
    icon: RotateCcw,
    iconColor: 'var(--scolio-danger-coral)',
    iconBg: 'var(--scolio-danger-surface)',
    label: 'Devoluções',
    value: '2',
    delta: 'Requer correção',
  },
];

type QueueStatus = 'uploaded' | 'processing' | 'ready' | 'validated' | 'returned';

const queue: {
  id: string;
  patient: string;
  patientId: string;
  status: QueueStatus;
  time: string;
  confidence: number;
  doctor: string;
  slaWarning?: boolean;
}[] = [
  { id: 'EX-2026-0124', patient: 'Maria Silva', patientId: 'PT-2024-0847', status: 'ready', time: '08:42', confidence: 94, doctor: 'Dr. Ana Martins', slaWarning: true },
  { id: 'EX-2026-0125', patient: 'João Santos', patientId: 'PT-2024-0812', status: 'processing', time: '09:08', confidence: 0, doctor: 'Dr. Ana Martins' },
  { id: 'EX-2026-0126', patient: 'Ana Costa', patientId: 'PT-2024-0756', status: 'ready', time: '09:15', confidence: 68, doctor: 'Dr. Luísa Fernandes' },
  { id: 'EX-2026-0127', patient: 'Pedro Oliveira', patientId: 'PT-2024-0691', status: 'returned', time: '09:32', confidence: 87, doctor: 'Dr. Ana Martins' },
  { id: 'EX-2026-0128', patient: 'Sofia Pereira', patientId: 'PT-2024-0903', status: 'uploaded', time: '09:48', confidence: 0, doctor: 'Dr. Luísa Fernandes' },
  { id: 'EX-2026-0129', patient: 'Carlos Rodrigues', patientId: 'PT-2024-0521', status: 'validated', time: '10:02', confidence: 96, doctor: 'Dr. Ana Martins' },
];

const lowConfidence = queue.filter(q => q.confidence > 0 && q.confidence < 70);

const activity = [
  { time: '10:02', label: 'Exame EX-2026-0129 validado por Dr. Ana Martins', type: 'success' as const },
  { time: '09:48', label: 'Upload concluído para Sofia Pereira (PT-2024-0903)', type: 'info' as const },
  { time: '09:32', label: 'Exame EX-2026-0127 devolvido — vértebra apical mal identificada', type: 'warning' as const },
  { time: '09:15', label: 'Baixa confiança IA detectada em EX-2026-0126 (68%)', type: 'warning' as const },
  { time: '09:08', label: 'Processamento IA iniciado para EX-2026-0125', type: 'info' as const },
];

function statusToBadge(s: QueueStatus) {
  const map: Record<QueueStatus, { label: string; bg: string; fg: string }> = {
    uploaded: { label: 'Carregado', bg: 'var(--scolio-neutral-surface)', fg: 'var(--scolio-neutral-gray)' },
    processing: { label: 'A processar', bg: 'var(--scolio-light-blue-surface)', fg: 'var(--scolio-primary-blue)' },
    ready: { label: 'Pronto', bg: 'var(--scolio-warning-surface)', fg: 'var(--scolio-warning-amber)' },
    validated: { label: 'Validado', bg: 'var(--scolio-success-surface)', fg: 'var(--scolio-success-green)' },
    returned: { label: 'Devolvido', bg: 'var(--scolio-danger-surface)', fg: 'var(--scolio-danger-coral)' },
  };
  const c = map[s];
  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-full"
      style={{ backgroundColor: c.bg, color: c.fg, fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-medium)' }}
    >
      {c.label}
    </span>
  );
}

export default function TecnicoDashboardScreen() {
  const navigate = useNavigate();
  const today = new Date().toLocaleDateString('pt-PT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="p-8 space-y-6 overflow-auto h-full">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-[var(--scolio-text-primary)]">Bom dia, Ricardo</h1>
          <p className="text-[var(--scolio-text-secondary)] mt-1" style={{ fontSize: 'var(--text-body)' }}>{today}</p>
        </div>
        <Button variant="primary" onClick={() => navigate('/tecnico/upload')}>
          <Upload className="w-4 h-4 mr-2 inline" />
          Carregar exame
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-6">
        {kpis.map(k => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="bg-white rounded-[var(--radius-card)] shadow-sm border border-[var(--scolio-border-light)] p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: k.iconBg }}>
                  <Icon className="w-6 h-6" style={{ color: k.iconColor }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>{k.label}</p>
                  <p className="text-[var(--scolio-text-primary)] font-semibold mt-1" style={{ fontSize: 'var(--text-h2)' }}>{k.value}</p>
                  <p className="text-[var(--scolio-text-secondary)] mt-1" style={{ fontSize: 'var(--text-caption)' }}>{k.delta}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Alerta baixa confiança */}
      {lowConfidence.length > 0 && (
        <div className="bg-white rounded-[var(--radius-card)] shadow-sm border border-[var(--scolio-warning-amber)] border-opacity-30 overflow-hidden">
          <div className="p-4 flex items-start gap-3 bg-[var(--scolio-warning-surface)]">
            <AlertTriangle className="w-5 h-5 text-[var(--scolio-warning-amber)] flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)' }}>
                {lowConfidence.length} exame{lowConfidence.length > 1 ? 's' : ''} com baixa confiança IA (&lt; 70%)
              </p>
              <p className="text-[var(--scolio-text-secondary)] mt-0.5" style={{ fontSize: 'var(--text-caption)' }}>
                Verifica a qualidade da imagem original antes de notificar o médico responsável.
              </p>
            </div>
          </div>
          <ul className="divide-y divide-[var(--scolio-border-light)]">
            {lowConfidence.map(ex => (
              <li key={ex.id} className="px-6 py-3 flex items-center gap-4">
                <code className="px-2 py-0.5 bg-[var(--scolio-neutral-surface)] rounded text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-caption)' }}>{ex.id}</code>
                <span className="text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-body)' }}>{ex.patient}</span>
                <span className="text-[var(--scolio-text-secondary)] ml-auto" style={{ fontSize: 'var(--text-caption)' }}>Confiança IA</span>
                <span className="text-[var(--scolio-warning-amber)] font-semibold" style={{ fontSize: 'var(--text-body)' }}>{ex.confidence}%</span>
                <Button variant="ghost" className="text-xs px-3 py-1" onClick={() => navigate('/tecnico/queue')}>Verificar</Button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-3 gap-6">
        {/* Fila de trabalho */}
        <div className="col-span-2 bg-white rounded-[var(--radius-card)] shadow-sm border border-[var(--scolio-border-light)] overflow-hidden">
          <div className="p-6 flex items-center justify-between">
            <h3 className="text-[var(--scolio-text-primary)]">Fila de trabalho</h3>
            <button onClick={() => navigate('/tecnico/queue')} className="text-[var(--scolio-success-green)] hover:underline" style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-medium)' }}>
              Ver tudo →
            </button>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-y border-[var(--scolio-border-light)] bg-[var(--scolio-page-surface)]">
                <th className="text-left px-6 py-3 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-semibold)' }}>EXAME</th>
                <th className="text-left px-6 py-3 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-semibold)' }}>PACIENTE</th>
                <th className="text-left px-6 py-3 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-semibold)' }}>ESTADO</th>
                <th className="text-left px-6 py-3 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-semibold)' }}>HORA</th>
              </tr>
            </thead>
            <tbody>
              {queue.slice(0, 6).map(q => (
                <tr key={q.id} className="border-b border-[var(--scolio-border-light)] hover:bg-[var(--scolio-page-surface)] transition-colors">
                  <td className="px-6 py-3">
                    <code className="px-2 py-0.5 bg-[var(--scolio-neutral-surface)] rounded text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-caption)' }}>{q.id}</code>
                  </td>
                  <td className="px-6 py-3 text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-body)' }}>{q.patient}</td>
                  <td className="px-6 py-3 flex items-center gap-2">
                    {statusToBadge(q.status)}
                    {q.slaWarning && (
                      <span className="inline-flex items-center gap-1 text-[var(--scolio-warning-amber)]" title="SLA: > 4h sem validação">
                        <Clock3 className="w-3.5 h-3.5" />
                        <span style={{ fontSize: 'var(--text-caption)' }}>SLA</span>
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-3 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>{q.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Actividade do turno */}
        <div className="bg-white rounded-[var(--radius-card)] shadow-sm border border-[var(--scolio-border-light)] p-6">
          <h3 className="text-[var(--scolio-text-primary)] mb-4">Actividade do turno</h3>
          <ul className="space-y-3">
            {activity.map((a, i) => {
              const color = a.type === 'success' ? 'var(--scolio-success-green)' :
                            a.type === 'warning' ? 'var(--scolio-warning-amber)' :
                            'var(--scolio-primary-blue)';
              const bg = a.type === 'success' ? 'var(--scolio-success-surface)' :
                         a.type === 'warning' ? 'var(--scolio-warning-surface)' :
                         'var(--scolio-light-blue-surface)';
              return (
                <li key={i} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: bg }}>
                    <Activity className="w-4 h-4" style={{ color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-body)' }}>{a.label}</p>
                    <p className="text-[var(--scolio-text-secondary)] mt-0.5" style={{ fontSize: 'var(--text-caption)' }}>{a.time}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
