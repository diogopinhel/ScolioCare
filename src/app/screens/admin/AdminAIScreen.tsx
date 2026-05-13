import React from 'react';
import { Cpu, TrendingUp, Database, GitBranch, Info } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useTranslation } from 'react-i18next';

export default function AdminAIScreen() {
  const { t } = useTranslation();
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
        <h1 className="text-[var(--scolio-text-primary)]">{t('admin.aiTitle')}</h1>
        <p className="text-[var(--scolio-text-secondary)] mt-1" style={{ fontSize: 'var(--text-body)' }}>{t('admin.aiSubtitle')}</p>
      </div>

      {/* KPIs — modelo ML não está integrado, métricas indisponíveis */}
      <div className="grid grid-cols-4 gap-6">
        <Stat icon={Cpu}       label={t('admin.aiCurrentVersion')}   value="N/D" />
        <Stat icon={TrendingUp} label={t('admin.aiAccuracy')}         value="N/D" />
        <Stat icon={Database}  label={t('admin.aiTrainingExams')}     value="N/D" />
        <Stat icon={GitBranch} label={t('admin.aiRetrainingQueue')}   value="N/D" />
      </div>

      {/* Gráfico e thresholds — indisponíveis sem integração ML */}
      <div className="bg-white rounded-[var(--radius-card)] shadow-sm border border-[var(--scolio-border-light)] p-10 flex flex-col items-center justify-center gap-3 text-center">
        <Info className="w-8 h-8 text-[var(--scolio-neutral-gray)]" />
        <p className="text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-h3)', fontWeight: 'var(--weight-medium)' }}>
          {t('admin.aiNotIntegrated')}
        </p>
        <p className="text-[var(--scolio-text-secondary)] max-w-md" style={{ fontSize: 'var(--text-body)' }}>
          {t('admin.aiNotIntegratedDesc')}
        </p>
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

function Stat({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="bg-white rounded-[var(--radius-card)] shadow-sm border border-[var(--scolio-border-light)] p-6">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-[var(--scolio-light-blue-surface)] flex items-center justify-center">
          <Icon className="w-5 h-5 text-[var(--scolio-primary-blue)]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>{label}</p>
          <p className="text-[var(--scolio-text-secondary)] font-semibold mt-1" style={{ fontSize: 'var(--text-h2)' }}>{value}</p>
        </div>
      </div>
    </div>
  );
}
