import React from 'react';
import { Save, Building2, Lock, Plug, Wrench, Loader2 } from 'lucide-react';
import { Button, Toast } from '../../components/scolio';
import { useTranslation } from 'react-i18next';
import { getSystemSettings, saveSystemSettings } from '../../../data/repository/admin';
import type { SystemSettings } from '../../../data/types';

export default function AdminSettingsScreen() {
  const { t } = useTranslation();
  const [aCarregar, setACarregar] = React.useState(true);
  const [aGuardar, setAGuardar] = React.useState(false);
  const [settings, setSettings] = React.useState<SystemSettings | null>(null);
  const [toast, setToast] = React.useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const mostrarToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  React.useEffect(() => {
    getSystemSettings()
      .then(setSettings)
      .finally(() => setACarregar(false));
  }, []);

  const set = <K extends keyof SystemSettings>(key: K, value: SystemSettings[K]) =>
    setSettings((prev) => prev ? { ...prev, [key]: value } : prev);

  const handleGuardar = async () => {
    if (!settings) return;
    setAGuardar(true);
    try {
      await saveSystemSettings(settings);
      mostrarToast(t('admin.settingsSaved'));
    } catch {
      mostrarToast(t('admin.settingsSaveError'), 'error');
    } finally {
      setAGuardar(false);
    }
  };

  if (aCarregar) {
    return (
      <div className="p-8 flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--scolio-primary-blue)]" />
      </div>
    );
  }

  if (!settings) return null;

  return (
    <div className="p-8 space-y-6 overflow-auto h-full">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-[var(--scolio-text-primary)]">{t('admin.settingsTitle')}</h1>
          <p className="text-[var(--scolio-text-secondary)] mt-1" style={{ fontSize: 'var(--text-body)' }}>{t('admin.settingsSubtitle')}</p>
        </div>
        <Button variant="primary" onClick={handleGuardar} disabled={aGuardar}>
          <Save className="w-4 h-4 mr-2 inline" />
          {aGuardar ? t('common.saving') : t('admin.saveSettings')}
        </Button>
      </div>

      {/* Hospital */}
      <Section icon={Building2} title={t('admin.hospitalConfig')}>
        <Grid2>
          <Field label={t('admin.institutionName')} value={settings.instituicao} onChange={(v) => set('instituicao', v)} />
          <Field label={t('admin.nif')} value={settings.nif} onChange={(v) => set('nif', v)} />
          <Field label={t('admin.rgpdContact')} value={settings.rgpdContact} onChange={(v) => set('rgpdContact', v)} />
          <Field label={t('admin.institutionalLogo')} type="file" disabled />
        </Grid2>
      </Section>

      {/* Segurança */}
      <Section icon={Lock} title={t('admin.securityPolicies')}>
        <Grid2>
          <Field label={t('admin.sessionTimeout')} value={String(settings.timeoutSessao)} type="number" onChange={(v) => set('timeoutSessao', Number(v))} />
          <Field label={t('admin.loginAttempts')} value={String(settings.tentativasLogin)} type="number" onChange={(v) => set('tentativasLogin', Number(v))} />
          <Field label={t('admin.minPasswordLength')} value={String(settings.minPasswordLength)} type="number" onChange={(v) => set('minPasswordLength', Number(v))} />
          <Field label={t('admin.passwordValidity')} value={String(settings.validadePassword)} type="number" onChange={(v) => set('validadePassword', Number(v))} />
        </Grid2>
        <div className="mt-5 pt-5 border-t border-[var(--scolio-border-light)]">
          <p className="text-[var(--scolio-text-primary)] mb-3" style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)' }}>{t('admin.force2FA')}</p>
          <div className="space-y-2">
            {([
              { key: 'force2faMedico' as const,  label: t('admin.profileDoctor') },
              { key: 'force2faTecnico' as const, label: t('admin.profileTechnician') },
              { key: 'force2faAdmin' as const,   label: t('nav.administrator') },
            ]).map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between p-3 bg-[var(--scolio-page-surface)] rounded-[var(--radius-component)]">
                <span className="text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-body)' }}>{label}</span>
                <button
                  onClick={() => set(key, !settings[key])}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings[key] ? 'bg-[var(--scolio-success-green)]' : 'bg-[var(--scolio-neutral-gray)]'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings[key] ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* Integrações */}
      <Section icon={Plug} title={t('admin.integrations')}>
        <Grid2>
          <Field label="DICOM server URL" value="dicom://pacs.chuln.pt:11112" disabled />
          <Field label="HIS endpoint"     value="https://his.chuln.pt/api/v3"  disabled />
          <Field label="RIS endpoint"     value="https://ris.chuln.pt/api/v2"  disabled />
          <Field label="Notificações (SMTP)" value="smtp.chuln.pt:587"         disabled />
        </Grid2>
      </Section>

      {/* Manutenção */}
      <Section icon={Wrench} title={t('admin.maintenance')}>
        <div className="flex items-center justify-between p-4 bg-[var(--scolio-page-surface)] rounded-[var(--radius-component)]">
          <div>
            <p className="text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)' }}>{t('admin.maintenanceMode')}</p>
            <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>{t('admin.maintenanceModeDesc')}</p>
          </div>
          <button
            onClick={() => set('modoManutencao', !settings.modoManutencao)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.modoManutencao ? 'bg-[var(--scolio-warning-amber)]' : 'bg-[var(--scolio-neutral-gray)]'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.modoManutencao ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>
        <Grid2 className="mt-4">
          <Field label={t('admin.backupSchedule')} value={settings.backupSchedule} onChange={(v) => set('backupSchedule', v)} />
          <Field label={t('admin.backupRetention')} value={String(settings.backupRetencao)} type="number" onChange={(v) => set('backupRetencao', Number(v))} />
        </Grid2>
      </Section>

      {toast && (
        <div className="fixed top-8 right-8 z-50">
          <Toast title={toast.msg} type={toast.type} onClose={() => setToast(null)} />
        </div>
      )}
    </div>
  );
}

function Section({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-[var(--radius-card)] shadow-sm border border-[var(--scolio-border-light)] p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-lg bg-[var(--scolio-light-blue-surface)] flex items-center justify-center">
          <Icon className="w-5 h-5 text-[var(--scolio-primary-blue)]" />
        </div>
        <h3 className="text-[var(--scolio-text-primary)]">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function Grid2({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`grid grid-cols-2 gap-4 ${className}`}>{children}</div>;
}

function Field({
  label, value, type = 'text', onChange, disabled = false,
}: {
  label: string;
  value?: string;
  type?: string;
  onChange?: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="block text-[var(--scolio-text-primary)] mb-2" style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)' }}>
        {label}
      </label>
      <input
        type={type}
        value={value ?? ''}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        readOnly={!onChange}
        disabled={disabled}
        className="w-full px-3 py-2 border border-[var(--scolio-border-light)] rounded-[var(--radius-component)] focus:outline-none focus:ring-2 focus:ring-[var(--scolio-primary-blue)] disabled:opacity-50 disabled:bg-[var(--scolio-page-surface)]"
      />
    </div>
  );
}
