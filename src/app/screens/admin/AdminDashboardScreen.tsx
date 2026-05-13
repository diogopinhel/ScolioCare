import React from 'react';
import { useNavigate } from 'react-router';
import { Users, Activity, ShieldAlert, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getMetricasDashboardAdmin, getUsoPorPerfil } from '../../../data/repository/admin';
import type { MetricasDashboardAdmin } from '../../../data/types';
import type { UsoSemanalDia } from '../../../data/repository/admin';
import { useTranslation } from 'react-i18next';

export default function AdminDashboardScreen() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [aCarregar, setACarregar] = React.useState(true);
  const [metricas, setMetricas] = React.useState<MetricasDashboardAdmin | null>(null);
  const [usageData, setUsageData] = React.useState<UsoSemanalDia[]>([]);

  React.useEffect(() => {
    let cancelado = false;
    Promise.all([getMetricasDashboardAdmin(), getUsoPorPerfil()])
      .then(([m, uso]) => {
        if (!cancelado) {
          setMetricas(m);
          setUsageData(uso);
        }
      })
      .finally(() => { if (!cancelado) setACarregar(false); });
    return () => { cancelado = true; };
  }, []);

  const kpis = metricas
    ? [
        {
          icon: Users,
          label: t('dashboard.activeUsers'),
          value: String(metricas.totalUtilizadoresAtivos),
          delta: t('dashboard.totalSystem'),
          color: 'var(--scolio-primary-blue)',
          bg: 'var(--scolio-light-blue-surface)',
        },
        {
          icon: Activity,
          label: t('dashboard.examsLast24h'),
          value: String(metricas.examesUltimas24h),
          delta: t('dashboard.newExams'),
          color: 'var(--scolio-success-green)',
          bg: 'var(--scolio-success-surface)',
        },
        {
          icon: ShieldAlert,
          label: t('dashboard.activeGlassBreak'),
          value: String(metricas.glassbreakAtivos),
          delta: t('dashboard.emergencySessions'),
          color: metricas.glassbreakAtivos > 0 ? 'var(--scolio-danger-coral)' : 'var(--scolio-success-green)',
          bg: metricas.glassbreakAtivos > 0 ? 'var(--scolio-danger-surface)' : 'var(--scolio-success-surface)',
        },
        {
          icon: AlertTriangle,
          label: t('dashboard.auditEvents24h'),
          value: String(metricas.alertasSeguranca),
          delta: t('dashboard.last24hours'),
          color: 'var(--scolio-warning-amber)',
          bg: 'var(--scolio-warning-surface)',
        },
      ]
    : [];

  return (
    <div className="p-8 space-y-6 overflow-auto h-full">
      <div>
        <h1 className="text-[var(--scolio-text-primary)]">{t('dashboard.adminTitle')}</h1>
        <p className="text-[var(--scolio-text-secondary)] mt-1" style={{ fontSize: 'var(--text-body)' }}>
          {t('dashboard.adminSubtitle')}
        </p>
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
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: k.bg }}>
                      <Icon className="w-6 h-6" style={{ color: k.color }} />
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

      <div className="grid grid-cols-3 gap-6">
        {/* Gráfico de uso */}
        <div className="col-span-2 bg-white rounded-[var(--radius-card)] shadow-sm border border-[var(--scolio-border-light)] p-6">
          <h3 className="text-[var(--scolio-text-primary)] mb-1">{t('dashboard.usageByModule')}</h3>
          <p className="text-[var(--scolio-text-secondary)] mb-4" style={{ fontSize: 'var(--text-caption)' }}>
            {t('dashboard.detailedMetricsSoon')}
          </p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={usageData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--scolio-border-light)" />
              <XAxis dataKey="dia" tick={{ fill: 'var(--scolio-text-secondary)', fontSize: 13 }} />
              <YAxis tick={{ fill: 'var(--scolio-text-secondary)', fontSize: 13 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid var(--scolio-border-light)',
                  borderRadius: 'var(--radius-component)',
                  fontSize: '13px',
                }}
              />
              <Bar dataKey="medico" stackId="a" fill="var(--scolio-primary-blue)" name="Médico" />
              <Bar dataKey="tecnico" stackId="a" fill="var(--scolio-success-green)" name="Técnico" />
              <Bar dataKey="admin" stackId="a" fill="var(--scolio-warning-amber)" name="Admin" />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-6 mt-4">
            {[
              { label: 'Médico', color: 'var(--scolio-primary-blue)' },
              { label: 'Técnico', color: 'var(--scolio-success-green)' },
              { label: 'Admin', color: 'var(--scolio-warning-amber)' },
            ].map((l) => (
              <span key={l.label} className="flex items-center gap-2" style={{ fontSize: 'var(--text-caption)' }}>
                <span className="w-3 h-3 rounded" style={{ backgroundColor: l.color }} />
                {l.label}
              </span>
            ))}
          </div>
        </div>

        {/* Atalhos */}
        <div className="bg-white rounded-[var(--radius-card)] shadow-sm border border-[var(--scolio-border-light)] p-6 space-y-3">
          <h3 className="text-[var(--scolio-text-primary)] mb-4">{t('dashboard.shortcuts')}</h3>
          {[
            { label: t('dashboard.shortcutUsers'), path: '/admin-panel/users' },
            { label: t('dashboard.shortcutAudit'), path: '/admin-panel/audit' },
            { label: t('dashboard.shortcutAIConfig'), path: '/admin-panel/ai' },
            { label: t('dashboard.shortcutRGPD'), path: '/admin-panel/compliance' },
          ].map((s) => (
            <button
              key={s.path}
              onClick={() => navigate(s.path)}
              className="w-full text-left px-4 py-3 rounded-[var(--radius-component)] bg-[var(--scolio-page-surface)] hover:bg-[var(--scolio-light-blue-surface)] text-[var(--scolio-primary-blue)] transition-colors"
              style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)' }}
            >
              {s.label} →
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
