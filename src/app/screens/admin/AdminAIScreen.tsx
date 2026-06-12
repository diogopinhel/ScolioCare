import React from 'react';
import { Cpu, TrendingUp, Database, CheckCircle, Info, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { supabase } from '../../../lib/supabase';
import { getMetricasIA } from '../../../data/repository/admin';
import type { MetricasIA } from '../../../data/repository/admin';
import { useTranslation } from 'react-i18next';

const GRAU_CORES: Record<string, string> = {
  LEVE:        'var(--scolio-success-green)',
  MODERADA:    'var(--scolio-warning-amber)',
  GRAVE:       'var(--scolio-danger-coral)',
  DESCONHECIDO: 'var(--scolio-neutral-gray)',
};

export default function AdminAIScreen() {
  const { t } = useTranslation();
  const [metricas, setMetricas] = React.useState<MetricasIA | null>(null);
  const [totalPacientes, setTotalPacientes] = React.useState<number | null>(null);
  const [aCarregar, setACarregar] = React.useState(true);

  React.useEffect(() => {
    Promise.all([
      getMetricasIA(),
      supabase
        .from('utilizadores')
        .select('*', { count: 'exact', head: true })
        .eq('perfil', 'PACIENTE')
        .eq('ativo', true)
        .then(({ count }) => count ?? 0),
    ]).then(([m, count]) => {
      setMetricas(m);
      setTotalPacientes(count);
    }).finally(() => setACarregar(false));
  }, []);

  if (aCarregar) {
    return (
      <div className="p-8 flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--scolio-primary-blue)]" />
      </div>
    );
  }

  const semDados = !metricas || metricas.totalAnalises === 0;
  const taxaAceitacao = metricas && metricas.analisesValidadas > 0
    ? Math.round((metricas.analisesAceites / metricas.analisesValidadas) * 100)
    : null;

  const versaoActiva = metricas?.versaoAtiva && metricas.versaoAtiva !== '—'
    ? metricas.versaoAtiva.replace(/phase\d+_/g, '').substring(0, 22)
    : '—';

  const graficoData = metricas?.distribuicaoGrau.map((d) => ({
    ...d,
    label: grauLabel(d.grau, t),
  })) ?? [];

  return (
    <div className="p-8 space-y-6 overflow-auto h-full">
      <div>
        <h1 className="text-[var(--scolio-text-primary)]">{t('admin.aiTitle')}</h1>
        <p className="text-[var(--scolio-text-secondary)] mt-1" style={{ fontSize: 'var(--text-body)' }}>
          {t('admin.aiSubtitle')}
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-6">
        <Stat icon={Cpu}         label={t('admin.aiCurrentVersion')}  value={versaoActiva} mono />
        <Stat icon={TrendingUp}  label={t('admin.aiAccuracy')}        value={semDados ? '—' : `${Math.round((metricas!.confiancaMedia) * 100)}%`} />
        <Stat icon={Database}    label={t('admin.aiTrainingExams')}   value={semDados ? '—' : String(metricas!.totalAnalises)} />
        <Stat icon={CheckCircle} label={t('admin.aiRetrainingQueue')} value={taxaAceitacao != null ? `${taxaAceitacao}%` : '—'} />
      </div>

      {/* Gráfico de distribuição de severidade */}
      <div className="bg-white rounded-[var(--radius-card)] shadow-sm border border-[var(--scolio-border-light)] p-6">
        <div className="mb-4">
          <h3 className="text-[var(--scolio-text-primary)]">{t('admin.aiSeverityDistribution')}</h3>
          {!semDados && (
            <p className="text-[var(--scolio-text-secondary)] mt-1" style={{ fontSize: 'var(--text-caption)' }}>
              {metricas!.analisesValidadas} {t('admin.aiValidated')}
            </p>
          )}
        </div>

        {semDados ? (
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <Info className="w-8 h-8 text-[var(--scolio-neutral-gray)]" />
            <p className="text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-h3)', fontWeight: 'var(--weight-medium)' }}>
              {t('admin.aiNoData')}
            </p>
            <p className="text-[var(--scolio-text-secondary)] max-w-md" style={{ fontSize: 'var(--text-body)' }}>
              {t('admin.aiNoDataDesc')}
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={graficoData} barSize={48}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--scolio-border-light)" />
              <XAxis dataKey="label" tick={{ fontSize: 13, fill: 'var(--scolio-text-secondary)' }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: 'var(--scolio-text-secondary)' }} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(value: number) => [value, '']}
                contentStyle={{ borderRadius: 8, border: '1px solid var(--scolio-border-light)', fontSize: 13 }}
              />
              <Bar dataKey="contagem" radius={[4, 4, 0, 0]}>
                {graficoData.map((entry, i) => (
                  <Cell key={i} fill={GRAU_CORES[entry.grau] ?? GRAU_CORES.DESCONHECIDO} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Consentimentos de treino */}
      <div className="bg-white rounded-[var(--radius-card)] shadow-sm border border-[var(--scolio-border-light)] p-6">
        <div className="mb-4">
          <h3 className="text-[var(--scolio-text-primary)]">{t('admin.aiConsents')}</h3>
          <p className="text-[var(--scolio-text-secondary)] mt-1" style={{ fontSize: 'var(--text-caption)' }}>
            {totalPacientes !== null ? t('admin.totalActivePatients', { count: totalPacientes }) : t('admin.loadingCount')}
          </p>
        </div>
        <div className="flex items-start gap-3 p-4 bg-[var(--scolio-light-blue-surface)] border border-[var(--scolio-primary-blue)] rounded-[var(--radius-component)]">
          <Info className="w-5 h-5 text-[var(--scolio-primary-blue)] flex-shrink-0 mt-0.5" />
          <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>
            {t('admin.aiConsentNote')}
          </p>
        </div>
      </div>
    </div>
  );
}

function grauLabel(grau: string, t: ReturnType<typeof useTranslation>['t']): string {
  if (grau === 'LEVE')     return t('severity.mild');
  if (grau === 'MODERADA') return t('severity.moderate');
  if (grau === 'GRAVE')    return t('severity.severe');
  return grau;
}

function Stat({
  icon: Icon, label, value, mono = false,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="bg-white rounded-[var(--radius-card)] shadow-sm border border-[var(--scolio-border-light)] p-6">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-[var(--scolio-light-blue-surface)] flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 text-[var(--scolio-primary-blue)]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>{label}</p>
          <p
            className={`text-[var(--scolio-text-primary)] font-semibold mt-1 truncate ${mono ? 'font-mono text-xs' : ''}`}
            style={{ fontSize: mono ? undefined : 'var(--text-h2)' }}
            title={value}
          >
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}
