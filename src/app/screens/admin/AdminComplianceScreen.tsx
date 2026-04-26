import React from 'react';
import { FileSearch, Trash2, FileText, ShieldCheck, AlertTriangle } from 'lucide-react';
import { Button } from '../../components/scolio';

type Request = {
  id: string;
  type: 'access' | 'erasure';
  patient: string;
  patientId: string;
  submitted: string;
  deadline: string;
  status: 'pending' | 'in-review' | 'approved' | 'rejected';
  impact?: 'low' | 'medium' | 'high';
};

const requests: Request[] = [
  { id: 'RGPD-2026-018', type: 'access', patient: 'Maria Silva', patientId: 'PT-2024-0847', submitted: '2026-04-18', deadline: '2026-05-18', status: 'in-review' },
  { id: 'RGPD-2026-017', type: 'erasure', patient: 'Pedro Oliveira', patientId: 'PT-2024-0691', submitted: '2026-04-12', deadline: '2026-05-12', status: 'pending', impact: 'high' },
  { id: 'RGPD-2026-016', type: 'access', patient: 'Sofia Pereira', patientId: 'PT-2024-0903', submitted: '2026-04-08', deadline: '2026-05-08', status: 'approved' },
  { id: 'RGPD-2026-015', type: 'erasure', patient: 'Beatriz Almeida', patientId: 'PT-2024-0521', submitted: '2026-03-22', deadline: '2026-04-22', status: 'rejected', impact: 'high' },
  { id: 'RGPD-2026-014', type: 'access', patient: 'Miguel Fernandes', patientId: 'PT-2024-0445', submitted: '2026-03-18', deadline: '2026-04-18', status: 'approved' },
];

const dataClasses = [
  { label: 'Identificadores directos', count: 1284, color: 'var(--scolio-danger-coral)', bg: 'var(--scolio-danger-surface)' },
  { label: 'Dados de saúde', count: 12847, color: 'var(--scolio-warning-amber)', bg: 'var(--scolio-warning-surface)' },
  { label: 'Dados pseudonimizados', count: 8921, color: 'var(--scolio-primary-blue)', bg: 'var(--scolio-light-blue-surface)' },
  { label: 'Dados anonimizados', count: 4502, color: 'var(--scolio-success-green)', bg: 'var(--scolio-success-surface)' },
];

const statusStyle = (s: Request['status']) => {
  const map = {
    pending: { label: 'Pendente', bg: 'var(--scolio-warning-surface)', fg: 'var(--scolio-warning-amber)' },
    'in-review': { label: 'Em análise', bg: 'var(--scolio-light-blue-surface)', fg: 'var(--scolio-primary-blue)' },
    approved: { label: 'Aprovado', bg: 'var(--scolio-success-surface)', fg: 'var(--scolio-success-green)' },
    rejected: { label: 'Rejeitado', bg: 'var(--scolio-danger-surface)', fg: 'var(--scolio-danger-coral)' },
  };
  return map[s];
};

export default function AdminComplianceScreen() {
  const [period, setPeriod] = React.useState<'30' | '90' | '365'>('90');

  const accessReqs = requests.filter(r => r.type === 'access');
  const erasureReqs = requests.filter(r => r.type === 'erasure');

  return (
    <div className="p-8 space-y-6 overflow-auto h-full">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-[var(--scolio-text-primary)]">Compliance &amp; RGPD</h1>
          <p className="text-[var(--scolio-text-secondary)] mt-1" style={{ fontSize: 'var(--text-body)' }}>Pedidos de titulares de dados, classificação e relatórios automáticos</p>
        </div>
        <Button variant="primary"><FileText className="w-4 h-4 mr-2 inline" /> Gerar relatório de compliance</Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-6">
        <KPI icon={FileSearch} color="var(--scolio-primary-blue)" bg="var(--scolio-light-blue-surface)" label="Pedidos Art. 15 (Acesso)" value={accessReqs.length.toString()} sub={`${accessReqs.filter(r => r.status !== 'approved' && r.status !== 'rejected').length} em curso`} />
        <KPI icon={Trash2} color="var(--scolio-danger-coral)" bg="var(--scolio-danger-surface)" label="Pedidos Art. 17 (Apagamento)" value={erasureReqs.length.toString()} sub={`${erasureReqs.filter(r => r.status === 'pending').length} a aguardar avaliação`} />
        <KPI icon={ShieldCheck} color="var(--scolio-success-green)" bg="var(--scolio-success-surface)" label="Conformidade" value="98.4%" sub="últimos 90 dias" />
        <KPI icon={AlertTriangle} color="var(--scolio-warning-amber)" bg="var(--scolio-warning-surface)" label="Prazos a expirar" value="2" sub="próximos 7 dias" />
      </div>

      {/* Requests table */}
      <div className="bg-white rounded-[var(--radius-card)] shadow-sm border border-[var(--scolio-border-light)] overflow-hidden">
        <div className="p-6">
          <h3 className="text-[var(--scolio-text-primary)]">Pedidos de titulares de dados</h3>
          <p className="text-[var(--scolio-text-secondary)] mt-1" style={{ fontSize: 'var(--text-caption)' }}>RGPD Art. 15 (acesso) e Art. 17 (apagamento). Prazo legal: 30 dias.</p>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-y border-[var(--scolio-border-light)] bg-[var(--scolio-page-surface)]">
              <th className="text-left px-6 py-3 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-semibold)' }}>ID</th>
              <th className="text-left px-6 py-3 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-semibold)' }}>TIPO</th>
              <th className="text-left px-6 py-3 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-semibold)' }}>PACIENTE</th>
              <th className="text-left px-6 py-3 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-semibold)' }}>SUBMETIDO</th>
              <th className="text-left px-6 py-3 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-semibold)' }}>PRAZO</th>
              <th className="text-left px-6 py-3 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-semibold)' }}>IMPACTO CLÍNICO</th>
              <th className="text-left px-6 py-3 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-semibold)' }}>ESTADO</th>
              <th className="text-left px-6 py-3 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-semibold)' }}>AÇÕES</th>
            </tr>
          </thead>
          <tbody>
            {requests.map(r => {
              const ss = statusStyle(r.status);
              return (
                <tr key={r.id} className="border-b border-[var(--scolio-border-light)] hover:bg-[var(--scolio-page-surface)]">
                  <td className="px-6 py-3"><code className="px-2 py-0.5 bg-[var(--scolio-neutral-surface)] rounded" style={{ fontSize: 'var(--text-caption)' }}>{r.id}</code></td>
                  <td className="px-6 py-3">
                    <span className="inline-flex items-center gap-2 text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-body)' }}>
                      {r.type === 'access' ? <FileSearch className="w-4 h-4 text-[var(--scolio-primary-blue)]" /> : <Trash2 className="w-4 h-4 text-[var(--scolio-danger-coral)]" />}
                      {r.type === 'access' ? 'Acesso (Art. 15)' : 'Apagamento (Art. 17)'}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <p className="text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-body)' }}>{r.patient}</p>
                    <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>{r.patientId}</p>
                  </td>
                  <td className="px-6 py-3 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>{r.submitted}</td>
                  <td className="px-6 py-3 text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-body)' }}>{r.deadline}</td>
                  <td className="px-6 py-3">
                    {r.impact ? (
                      <span style={{ color: r.impact === 'high' ? 'var(--scolio-danger-coral)' : r.impact === 'medium' ? 'var(--scolio-warning-amber)' : 'var(--scolio-success-green)', fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)' }}>
                        {r.impact === 'high' ? 'Alto' : r.impact === 'medium' ? 'Médio' : 'Baixo'}
                      </span>
                    ) : <span className="text-[var(--scolio-text-secondary)]">—</span>}
                  </td>
                  <td className="px-6 py-3">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full" style={{ backgroundColor: ss.bg, color: ss.fg, fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-medium)' }}>{ss.label}</span>
                  </td>
                  <td className="px-6 py-3"><Button variant="ghost" className="text-xs px-3 py-1">Avaliar</Button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Data classification */}
        <div className="bg-white rounded-[var(--radius-card)] shadow-sm border border-[var(--scolio-border-light)] p-6">
          <h3 className="text-[var(--scolio-text-primary)] mb-4">Classificação de dados</h3>
          <div className="space-y-3">
            {dataClasses.map(d => {
              const total = dataClasses.reduce((s, x) => s + x.count, 0);
              const pct = (d.count / total) * 100;
              return (
                <div key={d.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full" style={{ backgroundColor: d.bg, color: d.color, fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-medium)' }}>{d.label}</span>
                    <span className="text-[var(--scolio-text-primary)] font-semibold" style={{ fontSize: 'var(--text-body)' }}>{d.count.toLocaleString('pt-PT')}</span>
                  </div>
                  <div className="h-2 bg-[var(--scolio-page-surface)] rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: d.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Compliance report */}
        <div className="bg-white rounded-[var(--radius-card)] shadow-sm border border-[var(--scolio-border-light)] p-6">
          <h3 className="text-[var(--scolio-text-primary)] mb-4">Relatório automático de compliance</h3>
          <div className="flex items-center gap-2 mb-5">
            {(['30', '90', '365'] as const).map(p => (
              <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1.5 rounded-[var(--radius-component)] transition-colors ${period === p ? 'bg-[var(--scolio-primary-blue)] text-white' : 'bg-[var(--scolio-page-surface)] text-[var(--scolio-text-secondary)]'}`} style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-medium)' }}>
                {p === '365' ? 'Último ano' : `Últimos ${p} dias`}
              </button>
            ))}
          </div>
          <ul className="space-y-3">
            <Row label="Pedidos respondidos no prazo legal" value="14 / 14" success />
            <Row label="Eventos de Glass-Break revistos" value="8 / 9" warn />
            <Row label="Consentimentos de treino actualizados" value="98.4%" success />
            <Row label="Acessos não autorizados detectados" value="0" success />
            <Row label="Auditorias de segurança concluídas" value="3 / 3" success />
          </ul>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, success, warn }: { label: string; value: string; success?: boolean; warn?: boolean }) {
  const color = success ? 'var(--scolio-success-green)' : warn ? 'var(--scolio-warning-amber)' : 'var(--scolio-danger-coral)';
  return (
    <li className="flex items-center justify-between p-3 bg-[var(--scolio-page-surface)] rounded-[var(--radius-component)]">
      <span className="text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-body)' }}>{label}</span>
      <span className="font-semibold" style={{ color, fontSize: 'var(--text-body)' }}>{value}</span>
    </li>
  );
}

function KPI({ icon: Icon, color, bg, label, value, sub }: { icon: any; color: string; bg: string; label: string; value: string; sub: string }) {
  return (
    <div className="bg-white rounded-[var(--radius-card)] shadow-sm border border-[var(--scolio-border-light)] p-6">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: bg }}><Icon className="w-6 h-6" style={{ color }} /></div>
        <div className="flex-1 min-w-0">
          <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>{label}</p>
          <p className="text-[var(--scolio-text-primary)] font-semibold mt-1" style={{ fontSize: 'var(--text-h2)' }}>{value}</p>
          <p className="text-[var(--scolio-text-secondary)] mt-1" style={{ fontSize: 'var(--text-caption)' }}>{sub}</p>
        </div>
      </div>
    </div>
  );
}
