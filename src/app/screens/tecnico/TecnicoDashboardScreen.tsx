import React from 'react';
import { useNavigate } from 'react-router';
import { Upload, Loader2, CheckCircle2, Archive, Activity } from 'lucide-react';
import { Button } from '../../components/scolio';
import { useAuth } from '../../auth/AuthContext';
import {
  getMetricasDashboardTecnico,
  getFilaEstudos,
  getAtividadeRecenteTecnico,
} from '../../../data/repository/tecnico';
import type {
  MetricasDashboardTecnico,
  EstudoFilaItem,
  AtividadeResumo,
  EstadoEstudo,
} from '../../../data/types';

// ─── Helpers ────────────────────────────────────────────────────────────────

function tempoRelativo(dataISO: string): string {
  const diff = Date.now() - new Date(dataISO).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'agora mesmo';
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h}h`;
  return `há ${Math.floor(h / 24)} dias`;
}

function estadoBadge(estado: EstadoEstudo) {
  const map: Record<string, { label: string; bg: string; fg: string }> = {
    UPLOADED:           { label: 'Carregado',   bg: 'var(--scolio-neutral-surface)',    fg: 'var(--scolio-neutral-gray)' },
    PROCESSING:         { label: 'A processar', bg: 'var(--scolio-light-blue-surface)', fg: 'var(--scolio-primary-blue)' },
    PENDING_VALIDATION: { label: 'Pronto',      bg: 'var(--scolio-warning-surface)',    fg: 'var(--scolio-warning-amber)' },
    VALIDATED:          { label: 'Validado',    bg: 'var(--scolio-success-surface)',    fg: 'var(--scolio-success-green)' },
    ARCHIVED:           { label: 'Arquivado',   bg: 'var(--scolio-neutral-surface)',    fg: 'var(--scolio-neutral-gray)' },
  };
  const c = map[estado] ?? map['UPLOADED'];
  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-full"
      style={{ backgroundColor: c.bg, color: c.fg, fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-medium)' }}
    >
      {c.label}
    </span>
  );
}

// ─── Ecrã ────────────────────────────────────────────────────────────────────

export default function TecnicoDashboardScreen() {
  const navigate = useNavigate();
  const { utilizador } = useAuth();

  const [aCarregar, setACarregar] = React.useState(true);
  const [metricas, setMetricas] = React.useState<MetricasDashboardTecnico | null>(null);
  const [fila, setFila] = React.useState<EstudoFilaItem[]>([]);
  const [atividade, setAtividade] = React.useState<AtividadeResumo[]>([]);

  const hoje = new Date().toLocaleDateString('pt-PT', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  const nomeTecnico = utilizador?.nomeCompleto ?? 'Técnico';
  const primeiroNome = nomeTecnico.split(' ')[0];

  React.useEffect(() => {
    let cancelado = false;
    async function carregar() {
      setACarregar(true);
      try {
        const [m, f, a] = await Promise.all([
          getMetricasDashboardTecnico(),
          getFilaEstudos(),
          getAtividadeRecenteTecnico(),
        ]);
        if (!cancelado) {
          setMetricas(m);
          setFila(f);
          setAtividade(a);
        }
      } finally {
        if (!cancelado) setACarregar(false);
      }
    }
    carregar();
    return () => { cancelado = true; };
  }, []);

  const kpis = metricas
    ? [
        { icon: Upload, color: 'var(--scolio-success-green)', bg: 'var(--scolio-success-surface)', label: 'Exames carregados hoje', value: String(metricas.carregadosHoje) },
        { icon: Loader2, color: 'var(--scolio-primary-blue)', bg: 'var(--scolio-light-blue-surface)', label: 'Em processamento IA', value: String(metricas.emProcessamento) },
        { icon: CheckCircle2, color: 'var(--scolio-warning-amber)', bg: 'var(--scolio-warning-surface)', label: 'Prontos para validação', value: String(metricas.prontoValidacao) },
        { icon: Archive, color: 'var(--scolio-neutral-gray)', bg: 'var(--scolio-neutral-surface)', label: 'Arquivados', value: String(metricas.arquivados) },
      ]
    : [];

  return (
    <div className="p-8 space-y-6 overflow-auto h-full">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-[var(--scolio-text-primary)]">Bom dia, {primeiroNome}</h1>
          <p className="text-[var(--scolio-text-secondary)] mt-1" style={{ fontSize: 'var(--text-body)' }}>{hoje}</p>
        </div>
        <Button variant="primary" onClick={() => navigate('/tecnico/upload')}>
          <Upload className="w-4 h-4 mr-2 inline" />
          Carregar exame
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-6">
        {aCarregar
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-[var(--radius-card)] shadow-sm border border-[var(--scolio-border-light)] p-6 animate-pulse h-24" />
            ))
          : kpis.map((k) => {
              const Icon = k.icon;
              return (
                <div key={k.label} className="bg-white rounded-[var(--radius-card)] shadow-sm border border-[var(--scolio-border-light)] p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: k.bg }}>
                      <Icon className="w-6 h-6" style={{ color: k.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>{k.label}</p>
                      <p className="text-[var(--scolio-text-primary)] font-semibold mt-1" style={{ fontSize: 'var(--text-h2)' }}>{k.value}</p>
                    </div>
                  </div>
                </div>
              );
            })}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Fila de trabalho */}
        <div className="col-span-2 bg-white rounded-[var(--radius-card)] shadow-sm border border-[var(--scolio-border-light)] overflow-hidden">
          <div className="p-6 flex items-center justify-between">
            <h3 className="text-[var(--scolio-text-primary)]">Fila de trabalho</h3>
            <button
              onClick={() => navigate('/tecnico/queue')}
              className="text-[var(--scolio-success-green)] hover:underline"
              style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-medium)' }}
            >
              Ver tudo →
            </button>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-y border-[var(--scolio-border-light)] bg-[var(--scolio-page-surface)]">
                {['PACIENTE', 'DATA DO EXAME', 'ESTADO', 'SUBMETIDO'].map((h) => (
                  <th key={h} className="text-left px-6 py-3 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-semibold)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {aCarregar ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-[var(--scolio-border-light)]">
                    {Array.from({ length: 4 }).map((__, j) => (
                      <td key={j} className="px-6 py-4">
                        <div className="h-4 bg-[var(--scolio-page-surface)] rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : fila.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>
                    Sem exames na fila
                  </td>
                </tr>
              ) : (
                fila.slice(0, 6).map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-[var(--scolio-border-light)] hover:bg-[var(--scolio-page-surface)] transition-colors cursor-pointer"
                    onClick={() => navigate(`/exam-viewer/${item.id}`)}
                  >
                    <td className="px-6 py-3 text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-body)' }}>
                      {item.pacienteNome}
                    </td>
                    <td className="px-6 py-3 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>
                      {new Date(item.dataEstudo).toLocaleDateString('pt-PT')}
                    </td>
                    <td className="px-6 py-3">{estadoBadge(item.estado)}</td>
                    <td className="px-6 py-3 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>
                      {tempoRelativo(item.dataSubmissao)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Atividade recente */}
        <div className="bg-white rounded-[var(--radius-card)] shadow-sm border border-[var(--scolio-border-light)] p-6">
          <h3 className="text-[var(--scolio-text-primary)] mb-4">Atividade recente</h3>
          {aCarregar ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 bg-[var(--scolio-page-surface)] rounded animate-pulse" />
              ))}
            </div>
          ) : atividade.length === 0 ? (
            <p className="text-[var(--scolio-text-secondary)] text-center py-8" style={{ fontSize: 'var(--text-body)' }}>
              Sem atividade recente
            </p>
          ) : (
            <ul className="space-y-3">
              {atividade.map((a) => (
                <li key={a.id} className="flex items-start gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: 'var(--scolio-light-blue-surface)' }}
                  >
                    <Activity className="w-4 h-4" style={{ color: 'var(--scolio-primary-blue)' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-body)' }}>
                      {a.pacienteNome}
                    </p>
                    <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>
                      {tempoRelativo(a.dataTransicao)} · {a.utilizadorNome}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
