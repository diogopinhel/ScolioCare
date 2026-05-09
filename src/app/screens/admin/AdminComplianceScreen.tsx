import React from 'react';
import { FileSearch, Trash2, FileText, ShieldCheck, AlertTriangle, Info } from 'lucide-react';
import { Button } from '../../components/scolio';
import { useTranslation } from 'react-i18next';

// Nota: a tabela rgpd_pedidos ainda não existe na base de dados.
// Quando for criada, substituir os 0s por queries reais.

export default function AdminComplianceScreen() {
  const { t } = useTranslation();
  const [period, setPeriod] = React.useState<'30' | '90' | '365'>('90');

  const accessReqs = 0;
  const erasureReqs = 0;

  return (
    <div className="p-8 space-y-6 overflow-auto h-full">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-[var(--scolio-text-primary)]">{t('admin.complianceTitle')}</h1>
          <p className="text-[var(--scolio-text-secondary)] mt-1" style={{ fontSize: 'var(--text-body)' }}>{t('admin.complianceSubtitle')}</p>
        </div>
        <Button variant="primary"><FileText className="w-4 h-4 mr-2 inline" /> {t('admin.generateReport')}</Button>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-4 gap-6">
        <KPI icon={FileSearch} color="var(--scolio-primary-blue)" bg="var(--scolio-light-blue-surface)" label={t('admin.artAccess')} value={accessReqs.toString()} sub={t('admin.inProgress')} />
        <KPI icon={Trash2} color="var(--scolio-danger-coral)" bg="var(--scolio-danger-surface)" label={t('admin.artErasure')} value={erasureReqs.toString()} sub={t('admin.awaitingEval')} />
        <KPI icon={ShieldCheck} color="var(--scolio-success-green)" bg="var(--scolio-success-surface)" label={t('admin.conformity')} value="—" sub={t('admin.noSufficientData')} />
        <KPI icon={AlertTriangle} color="var(--scolio-warning-amber)" bg="var(--scolio-warning-surface)" label={t('admin.expiringDeadlines')} value="0" sub={t('admin.next7days')} />
      </div>

      {/* Tabela de pedidos */}
      <div className="bg-white rounded-[var(--radius-card)] shadow-sm border border-[var(--scolio-border-light)] overflow-hidden">
        <div className="p-6">
          <h3 className="text-[var(--scolio-text-primary)]">{t('admin.dataRequests')}</h3>
          <p className="text-[var(--scolio-text-secondary)] mt-1" style={{ fontSize: 'var(--text-caption)' }}>{t('admin.dataRequestsDesc')}</p>
        </div>
        <div className="flex items-start gap-3 mx-6 mb-6 p-4 bg-[var(--scolio-light-blue-surface)] border border-[var(--scolio-primary-blue)] rounded-[var(--radius-component)]">
          <Info className="w-5 h-5 text-[var(--scolio-primary-blue)] flex-shrink-0 mt-0.5" />
          <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>
            {t('admin.rgpdNote')}
          </p>
        </div>
        <div className="px-6 pb-12 text-center">
          <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>
            {t('admin.noRequests')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Classificação de dados */}
        <div className="bg-white rounded-[var(--radius-card)] shadow-sm border border-[var(--scolio-border-light)] p-6">
          <h3 className="text-[var(--scolio-text-primary)] mb-4">{t('admin.dataClassification')}</h3>
          <div className="flex items-start gap-3 p-4 bg-[var(--scolio-light-blue-surface)] border border-[var(--scolio-primary-blue)] rounded-[var(--radius-component)]">
            <Info className="w-5 h-5 text-[var(--scolio-primary-blue)] flex-shrink-0 mt-0.5" />
            <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>
              {t('admin.dataClassNote')}
            </p>
          </div>
        </div>

        {/* Relatório de compliance */}
        <div className="bg-white rounded-[var(--radius-card)] shadow-sm border border-[var(--scolio-border-light)] p-6">
          <h3 className="text-[var(--scolio-text-primary)] mb-4">{t('admin.autoReport')}</h3>
          <div className="flex items-center gap-2 mb-5">
            {(['30', '90', '365'] as const).map(p => (
              <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1.5 rounded-[var(--radius-component)] transition-colors ${period === p ? 'bg-[var(--scolio-primary-blue)] text-white' : 'bg-[var(--scolio-page-surface)] text-[var(--scolio-text-secondary)]'}`} style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-medium)' }}>
                {p === '365' ? t('admin.lastYear') : p === '90' ? t('admin.last90days') : t('admin.last30days')}
              </button>
            ))}
          </div>
          <p className="text-[var(--scolio-text-secondary)] text-center py-6" style={{ fontSize: 'var(--text-body)' }}>
            {t('admin.noDataPeriod')}
          </p>
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
