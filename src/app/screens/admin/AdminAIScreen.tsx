import React from 'react';
import { Cpu, TrendingUp, Database, GitBranch, Info } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Button } from '../../components/scolio';
import { supabase } from '../../../lib/supabase';

// Métricas estáticas do pipeline ML (não estão na DB — vêm do sistema de treino externo)
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

export default function AdminAIScreen() {
  const [autoAccept, setAutoAccept] = React.useState(95);
  const [minDisplay, setMinDisplay] = React.useState(70);
  const [totalPacientes, setTotalPacientes] = React.useState<number | null>(null);

  React.useEffect(() => {
    supabase
      .from('utilizadores')
      .select('*', { count: 'exact', head: true })
      .eq('perfil', 'PACIENTE')
      .eq('ativo', true)
      .then(({ count }) => setTotalPacientes(count ?? 0));
  }, []);

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

      {/* Consentimentos de treino */}
      <div className="bg-white rounded-[var(--radius-card)] shadow-sm border border-[var(--scolio-border-light)] p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-[var(--scolio-text-primary)]">Consentimentos de treino IA</h3>
            <p className="text-[var(--scolio-text-secondary)] mt-1" style={{ fontSize: 'var(--text-caption)' }}>
              {totalPacientes !== null ? `${totalPacientes} pacientes activos no sistema` : 'A carregar...'}
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3 p-4 bg-[var(--scolio-light-blue-surface)] border border-[var(--scolio-primary-blue)] rounded-[var(--radius-component)]">
          <Info className="w-5 h-5 text-[var(--scolio-primary-blue)] flex-shrink-0 mt-0.5" />
          <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>
            O rastreio individual de consentimento de treino por paciente requer uma tabela dedicada
            (<code>consentimentos_ia</code>) que ainda não está configurada na base de dados.
            Quando disponível, esta secção listará cada paciente com o seu estado de consentimento e data.
          </p>
        </div>
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
