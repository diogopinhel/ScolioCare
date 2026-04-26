import React from 'react';
import { Cpu, TrendingUp, Database, GitBranch } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Button } from '../../components/scolio';

const accuracyHistory = [
  { v: 'v3.0', acc: 87.2 },
  { v: 'v3.1', acc: 89.4 },
  { v: 'v3.2', acc: 91.1 },
  { v: 'v3.3', acc: 92.8 },
  { v: 'v3.4', acc: 94.3 },
];

const ageGroups = [
  { range: '10–12 anos', precision: 92.4, recall: 90.1, f1: 91.2 },
  { range: '13–15 anos', precision: 95.1, recall: 93.7, f1: 94.4 },
  { range: '16–17 anos', precision: 94.8, recall: 92.9, f1: 93.8 },
];

const consents = [
  { name: 'Maria Silva', id: 'PT-2024-0847', given: true, date: '2026-01-12' },
  { name: 'João Santos', id: 'PT-2024-0812', given: true, date: '2026-02-08' },
  { name: 'Ana Costa', id: 'PT-2024-0756', given: false, date: '2026-03-22' },
  { name: 'Pedro Oliveira', id: 'PT-2024-0691', given: true, date: '2026-01-05' },
  { name: 'Sofia Pereira', id: 'PT-2024-0903', given: false, date: '2026-04-01' },
];

export default function AdminAIScreen() {
  const [autoAccept, setAutoAccept] = React.useState(95);
  const [minDisplay, setMinDisplay] = React.useState(70);

  const totalGiven = consents.filter(c => c.given).length;

  return (
    <div className="p-8 space-y-6 overflow-auto h-full">
      <div>
        <h1 className="text-[var(--scolio-text-primary)]">IA &amp; Dados</h1>
        <p className="text-[var(--scolio-text-secondary)] mt-1" style={{ fontSize: 'var(--text-body)' }}>Gestão do modelo de detecção do ângulo de Cobb e dados de treino</p>
      </div>

      {/* Model status */}
      <div className="grid grid-cols-4 gap-6">
        <Stat icon={Cpu} label="Versão actual" value="v3.4" sub="desde 12/03/2026" />
        <Stat icon={TrendingUp} label="Accuracy global" value="94.3%" sub="+1.5pp vs v3.3" />
        <Stat icon={Database} label="Exames de treino" value="12 847" sub="último: 18/03/2026" />
        <Stat icon={GitBranch} label="Em fila para re-treino" value="284" sub="aprovados pelo médico" />
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Accuracy chart */}
        <div className="col-span-2 bg-white rounded-[var(--radius-card)] shadow-sm border border-[var(--scolio-border-light)] p-6">
          <h3 className="text-[var(--scolio-text-primary)] mb-4">Evolução da accuracy por versão</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={accuracyHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--scolio-border-light)" />
              <XAxis dataKey="v" tick={{ fill: 'var(--scolio-text-secondary)', fontSize: 13 }} />
              <YAxis domain={[80, 100]} tick={{ fill: 'var(--scolio-text-secondary)', fontSize: 13 }} />
              <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid var(--scolio-border-light)', borderRadius: 'var(--radius-component)' }} />
              <Line type="monotone" dataKey="acc" stroke="var(--scolio-primary-blue)" strokeWidth={2.5} dot={{ r: 5, fill: 'var(--scolio-primary-blue)' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Thresholds */}
        <div className="bg-white rounded-[var(--radius-card)] shadow-sm border border-[var(--scolio-border-light)] p-6">
          <h3 className="text-[var(--scolio-text-primary)] mb-4">Thresholds de confiança</h3>
          <div className="space-y-5">
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)' }}>Auto-aceitar acima de</label>
                <span className="text-[var(--scolio-primary-blue)] font-semibold">{autoAccept}%</span>
              </div>
              <input type="range" min={80} max={99} value={autoAccept} onChange={e => setAutoAccept(+e.target.value)} className="w-full accent-[var(--scolio-primary-blue)]" />
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)' }}>Mínimo para exibir</label>
                <span className="text-[var(--scolio-warning-amber)] font-semibold">{minDisplay}%</span>
              </div>
              <input type="range" min={50} max={90} value={minDisplay} onChange={e => setMinDisplay(+e.target.value)} className="w-full accent-[var(--scolio-warning-amber)]" />
            </div>
            <Button variant="primary" className="w-full">Aplicar thresholds</Button>
          </div>
        </div>
      </div>

      {/* Performance by age */}
      <div className="bg-white rounded-[var(--radius-card)] shadow-sm border border-[var(--scolio-border-light)] overflow-hidden">
        <div className="p-6"><h3 className="text-[var(--scolio-text-primary)]">Métricas de performance por faixa etária</h3></div>
        <table className="w-full">
          <thead>
            <tr className="border-y border-[var(--scolio-border-light)] bg-[var(--scolio-page-surface)]">
              <th className="text-left px-6 py-3 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-semibold)' }}>FAIXA</th>
              <th className="text-left px-6 py-3 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-semibold)' }}>PRECISION</th>
              <th className="text-left px-6 py-3 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-semibold)' }}>RECALL</th>
              <th className="text-left px-6 py-3 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-semibold)' }}>F1</th>
            </tr>
          </thead>
          <tbody>
            {ageGroups.map(g => (
              <tr key={g.range} className="border-b border-[var(--scolio-border-light)]">
                <td className="px-6 py-3 text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-body)' }}>{g.range}</td>
                <td className="px-6 py-3 text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-body)' }}>{g.precision}%</td>
                <td className="px-6 py-3 text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-body)' }}>{g.recall}%</td>
                <td className="px-6 py-3 text-[var(--scolio-success-green)] font-semibold" style={{ fontSize: 'var(--text-body)' }}>{g.f1}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Consents */}
      <div className="bg-white rounded-[var(--radius-card)] shadow-sm border border-[var(--scolio-border-light)] overflow-hidden">
        <div className="p-6 flex items-center justify-between">
          <div>
            <h3 className="text-[var(--scolio-text-primary)]">Consentimentos de treino IA</h3>
            <p className="text-[var(--scolio-text-secondary)] mt-1" style={{ fontSize: 'var(--text-caption)' }}>{totalGiven} de {consents.length} pacientes deste ecrã com consentimento dado</p>
          </div>
          <Button variant="secondary">Ver todos os consentimentos</Button>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-y border-[var(--scolio-border-light)] bg-[var(--scolio-page-surface)]">
              <th className="text-left px-6 py-3 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-semibold)' }}>PACIENTE</th>
              <th className="text-left px-6 py-3 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-semibold)' }}>ID</th>
              <th className="text-left px-6 py-3 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-semibold)' }}>CONSENTIMENTO</th>
              <th className="text-left px-6 py-3 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-semibold)' }}>DATA</th>
            </tr>
          </thead>
          <tbody>
            {consents.map(c => (
              <tr key={c.id} className="border-b border-[var(--scolio-border-light)]">
                <td className="px-6 py-3 text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-body)' }}>{c.name}</td>
                <td className="px-6 py-3"><code className="px-2 py-0.5 bg-[var(--scolio-neutral-surface)] rounded" style={{ fontSize: 'var(--text-caption)' }}>{c.id}</code></td>
                <td className="px-6 py-3">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full" style={{ backgroundColor: c.given ? 'var(--scolio-success-surface)' : 'var(--scolio-neutral-surface)', color: c.given ? 'var(--scolio-success-green)' : 'var(--scolio-neutral-gray)', fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-medium)' }}>
                    {c.given ? 'Dado' : 'Revogado'}
                  </span>
                </td>
                <td className="px-6 py-3 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>{c.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, sub }: { icon: any; label: string; value: string; sub: string }) {
  return (
    <div className="bg-white rounded-[var(--radius-card)] shadow-sm border border-[var(--scolio-border-light)] p-6">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-[var(--scolio-light-blue-surface)] flex items-center justify-center"><Icon className="w-5 h-5 text-[var(--scolio-primary-blue)]" /></div>
        <div className="flex-1 min-w-0">
          <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>{label}</p>
          <p className="text-[var(--scolio-text-primary)] font-semibold mt-1" style={{ fontSize: 'var(--text-h2)' }}>{value}</p>
          <p className="text-[var(--scolio-text-secondary)] mt-1" style={{ fontSize: 'var(--text-caption)' }}>{sub}</p>
        </div>
      </div>
    </div>
  );
}
