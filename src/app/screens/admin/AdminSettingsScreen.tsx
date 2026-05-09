import React from 'react';
import { Save, Building2, Lock, Plug, Wrench } from 'lucide-react';
import { Button, Toast } from '../../components/scolio';

export default function AdminSettingsScreen() {
  const [maintenance, setMaintenance] = React.useState(false);
  const [force2FA, setForce2FA] = React.useState({ medico: true, tecnico: true, admin: true });
  const [toast, setToast] = React.useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const handleGuardar = () => {
    setToast({ msg: 'Persistência de configurações em desenvolvimento — as alterações não foram gravadas.', type: 'error' });
    setTimeout(() => setToast(null), 5000);
  };

  return (
    <div className="p-8 space-y-6 overflow-auto h-full">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-[var(--scolio-text-primary)]">Definições do sistema</h1>
          <p className="text-[var(--scolio-text-secondary)] mt-1" style={{ fontSize: 'var(--text-body)' }}>Configurações hospitalares, segurança e integrações</p>
        </div>
        <Button variant="primary" onClick={handleGuardar}><Save className="w-4 h-4 mr-2 inline" /> Guardar alterações</Button>
      </div>

      {/* Hospital */}
      <Section icon={Building2} title="Configurações hospitalares">
        <Grid2>
          <Field label="Nome da instituição" defaultValue="Centro Hospitalar Universitário de Lisboa Norte, EPE" />
          <Field label="NIF" defaultValue="503007088" />
          <Field label="Contacto RGPD (DPO)" defaultValue="dpo@chuln.pt" />
          <Field label="Logo institucional" type="file" />
        </Grid2>
      </Section>

      {/* Security */}
      <Section icon={Lock} title="Políticas de segurança">
        <Grid2>
          <Field label="Tempo de sessão (minutos)" defaultValue="30" type="number" />
          <Field label="Tentativas de login antes de bloqueio" defaultValue="5" type="number" />
          <Field label="Comprimento mínimo de palavra-passe" defaultValue="12" type="number" />
          <Field label="Validade da palavra-passe (dias)" defaultValue="90" type="number" />
        </Grid2>
        <div className="mt-5 pt-5 border-t border-[var(--scolio-border-light)]">
          <p className="text-[var(--scolio-text-primary)] mb-3" style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)' }}>2FA obrigatório por função</p>
          <div className="space-y-2">
            {(['medico', 'tecnico', 'admin'] as const).map(role => (
              <div key={role} className="flex items-center justify-between p-3 bg-[var(--scolio-page-surface)] rounded-[var(--radius-component)]">
                <span className="text-[var(--scolio-text-primary)] capitalize" style={{ fontSize: 'var(--text-body)' }}>{role === 'medico' ? 'Médico' : role === 'tecnico' ? 'Técnico' : 'Administrador'}</span>
                <button onClick={() => setForce2FA({ ...force2FA, [role]: !force2FA[role] })} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${force2FA[role] ? 'bg-[var(--scolio-success-green)]' : 'bg-[var(--scolio-neutral-gray)]'}`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${force2FA[role] ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* Integrations */}
      <Section icon={Plug} title="Integrações">
        <Grid2>
          <Field label="DICOM server URL" defaultValue="dicom://pacs.chuln.pt:11112" />
          <Field label="HIS endpoint" defaultValue="https://his.chuln.pt/api/v3" />
          <Field label="RIS endpoint" defaultValue="https://ris.chuln.pt/api/v2" />
          <Field label="Notificações (SMTP)" defaultValue="smtp.chuln.pt:587" />
        </Grid2>
      </Section>

      {/* Maintenance */}
      <Section icon={Wrench} title="Manutenção">
        <div className="flex items-center justify-between p-4 bg-[var(--scolio-page-surface)] rounded-[var(--radius-component)]">
          <div>
            <p className="text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)' }}>Modo de manutenção</p>
            <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>Bloqueia o acesso a todos os utilizadores excepto administradores.</p>
          </div>
          <button onClick={() => setMaintenance(!maintenance)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${maintenance ? 'bg-[var(--scolio-warning-amber)]' : 'bg-[var(--scolio-neutral-gray)]'}`}>
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${maintenance ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>
        <Grid2 className="mt-4">
          <Field label="Schedule de backup (cron)" defaultValue="0 3 * * *" />
          <Field label="Retenção de backups (dias)" defaultValue="30" type="number" />
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

function Section({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-[var(--radius-card)] shadow-sm border border-[var(--scolio-border-light)] p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-lg bg-[var(--scolio-light-blue-surface)] flex items-center justify-center"><Icon className="w-5 h-5 text-[var(--scolio-primary-blue)]" /></div>
        <h3 className="text-[var(--scolio-text-primary)]">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function Grid2({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`grid grid-cols-2 gap-4 ${className}`}>{children}</div>;
}

function Field({ label, defaultValue, type = 'text' }: { label: string; defaultValue?: string; type?: string }) {
  return (
    <div>
      <label className="block text-[var(--scolio-text-primary)] mb-2" style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)' }}>{label}</label>
      <input type={type} defaultValue={defaultValue} className="w-full px-3 py-2 border border-[var(--scolio-border-light)] rounded-[var(--radius-component)] focus:outline-none focus:ring-2 focus:ring-[var(--scolio-primary-blue)]" />
    </div>
  );
}
