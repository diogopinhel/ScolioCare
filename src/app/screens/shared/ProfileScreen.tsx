import React from 'react';
import { useNavigate } from 'react-router';
import { ShieldCheck, ShieldOff, Mail, User, BadgeCheck, Clock } from 'lucide-react';
import { Button, Input, Modal, Toast } from '../../components/scolio';
import { useAuth } from '../../auth/AuthContext';
import { AuthenticationError } from '../../../data/repository/auth';
import { registarAcao } from '../../../data/repository/audit';
import { supabase } from '../../../lib/supabase';
import { useTranslation } from 'react-i18next';
import { useDateLocale } from '../../../lib/dateLocale';

function CampoSomenteLeitura({ icone, label, valor }: { icone: React.ReactNode; label: string; valor: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-full bg-[var(--scolio-light-blue-surface)] flex items-center justify-center text-[var(--scolio-primary-blue)] flex-shrink-0">
        {icone}
      </div>
      <div className="flex-1">
        <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>{label}</p>
        <p className="text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)' }}>{valor}</p>
      </div>
    </div>
  );
}

export default function ProfileScreen() {
  const { utilizador, iniciarAtivacao2FA, desativar2FA } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const dateLocale = useDateLocale();

  const [modalDesativar, setModalDesativar] = React.useState(false);
  const [aProcessar, setAProcessar] = React.useState(false);
  const [erro, setErro] = React.useState<string | null>(null);
  const [toast, setToast] = React.useState<string | null>(null);

  // Alterar password
  const [passwordAtual, setPasswordAtual] = React.useState('');
  const [novaPassword, setNovaPassword] = React.useState('');
  const [confirmarPassword, setConfirmarPassword] = React.useState('');
  const [erroPassword, setErroPassword] = React.useState<string | null>(null);
  const [aAlterarPassword, setAAlterarPassword] = React.useState(false);

  if (!utilizador) return null;

  const mostrarToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 3000);
  };

  const tratarAtivar = async () => {
    setErro(null);
    setAProcessar(true);
    try {
      await iniciarAtivacao2FA();
      navigate('/auth/two-factor-verify');
    } catch (err) {
      if (err instanceof AuthenticationError) setErro(err.message);
      else setErro(t('auth.unexpectedError'));
    } finally {
      setAProcessar(false);
    }
  };

  const tratarDesativar = async () => {
    setErro(null);
    setAProcessar(true);
    try {
      await desativar2FA();
      setModalDesativar(false);
      mostrarToast(t('profile.twoFactorDeactivated'));
    } catch (err) {
      if (err instanceof AuthenticationError) setErro(err.message);
      else setErro(t('auth.unexpectedError'));
    } finally {
      setAProcessar(false);
    }
  };

  const tratarAlterarPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroPassword(null);

    if (novaPassword.length < 8) {
      setErroPassword(t('profile.passwordTooShort'));
      return;
    }
    if (novaPassword !== confirmarPassword) {
      setErroPassword(t('profile.passwordMismatch'));
      return;
    }

    setAAlterarPassword(true);
    try {
      const { error: authErr } = await supabase.auth.signInWithPassword({
        email: utilizador.email,
        password: passwordAtual,
      });
      if (authErr) {
        setErroPassword(t('profile.currentPasswordIncorrect'));
        return;
      }

      const { error } = await supabase.auth.updateUser({ password: novaPassword });
      if (error) throw error;

      registarAcao('ALTERAR_PASSWORD', 'utilizadores', utilizador.id);
      setPasswordAtual('');
      setNovaPassword('');
      setConfirmarPassword('');
      mostrarToast(t('profile.passwordChanged'));
    } catch {
      setErroPassword(t('auth.unexpectedError'));
    } finally {
      setAAlterarPassword(false);
    }
  };

  const perfilLegivel = t(`profile.role_${utilizador.perfil.toLowerCase()}`);
  const ultimoLoginFormatado = utilizador.ultimoLogin
    ? new Date(utilizador.ultimoLogin).toLocaleString(dateLocale, {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : t('profile.lastLoginNever');

  return (
    <div className="p-8 space-y-6 overflow-auto h-full">
      <div>
        <h1 className="text-[var(--scolio-text-primary)]">{t('profile.title')}</h1>
        <p className="text-[var(--scolio-text-secondary)] mt-1" style={{ fontSize: 'var(--text-body)' }}>
          {t('profile.subtitle')}
        </p>
      </div>

      {/* Dados pessoais */}
      <section className="bg-white rounded-[var(--radius-card)] shadow-sm border border-[var(--scolio-border-light)] p-6">
        <h2 className="text-[var(--scolio-text-primary)] mb-4" style={{ fontSize: 'var(--text-h3)', fontWeight: 'var(--weight-semibold)' }}>
          {t('profile.personalData')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <CampoSomenteLeitura icone={<User className="w-4 h-4" />} label={t('profile.name')} valor={utilizador.nomeCompleto} />
          <CampoSomenteLeitura icone={<Mail className="w-4 h-4" />} label={t('profile.email')} valor={utilizador.email} />
          <CampoSomenteLeitura icone={<BadgeCheck className="w-4 h-4" />} label={t('profile.role')} valor={perfilLegivel} />
          <CampoSomenteLeitura icone={<Clock className="w-4 h-4" />} label={t('profile.lastLogin')} valor={ultimoLoginFormatado} />
        </div>
      </section>

      {/* 2FA */}
      <section className="bg-white rounded-[var(--radius-card)] shadow-sm border border-[var(--scolio-border-light)] p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-[var(--scolio-light-blue-surface)] flex items-center justify-center text-[var(--scolio-primary-blue)] flex-shrink-0">
            {utilizador.twoFactorAtivo ? <ShieldCheck className="w-6 h-6" /> : <ShieldOff className="w-6 h-6" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-h3)', fontWeight: 'var(--weight-semibold)' }}>
                {t('profile.twoFactorTitle')}
              </h2>
              <span
                className="inline-flex items-center px-2 py-0.5 rounded-full"
                style={{
                  fontSize: 'var(--text-caption)',
                  fontWeight: 'var(--weight-medium)',
                  backgroundColor: utilizador.twoFactorAtivo
                    ? 'var(--scolio-success-surface)'
                    : 'var(--scolio-warning-surface)',
                  color: utilizador.twoFactorAtivo
                    ? 'var(--scolio-success-green)'
                    : 'var(--scolio-warning-amber)',
                }}
              >
                {utilizador.twoFactorAtivo ? t('profile.twoFactorActive') : t('profile.twoFactorInactive')}
              </span>
            </div>
            <p className="text-[var(--scolio-text-secondary)] mb-4" style={{ fontSize: 'var(--text-body)' }}>
              {t('profile.twoFactorDescription')}
            </p>

            {erro && (
              <div className="flex items-start gap-2 p-3 rounded-[var(--radius-component)] bg-[var(--scolio-danger-surface)] border border-[var(--scolio-danger-coral)] mb-4" role="alert">
                <span className="text-[var(--scolio-danger-coral)]" style={{ fontSize: 'var(--text-body)' }}>{erro}</span>
              </div>
            )}

            {utilizador.twoFactorAtivo ? (
              <Button variant="secondary" onClick={() => setModalDesativar(true)} disabled={aProcessar}>
                {t('profile.deactivate')}
              </Button>
            ) : (
              <Button variant="primary" onClick={tratarAtivar} disabled={aProcessar}>
                {aProcessar ? t('profile.sendingCode') : t('profile.activate')}
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Alterar password */}
      <section className="bg-white rounded-[var(--radius-card)] shadow-sm border border-[var(--scolio-border-light)] p-6">
        <h2 className="text-[var(--scolio-text-primary)] mb-1" style={{ fontSize: 'var(--text-h3)', fontWeight: 'var(--weight-semibold)' }}>
          {t('profile.changePasswordTitle')}
        </h2>
        <p className="text-[var(--scolio-text-secondary)] mb-4" style={{ fontSize: 'var(--text-body)' }}>
          {t('profile.changePasswordDescription')}
        </p>

        {erroPassword && (
          <div className="flex items-start gap-2 p-3 rounded-[var(--radius-component)] bg-[var(--scolio-danger-surface)] border border-[var(--scolio-danger-coral)] mb-4" role="alert">
            <span className="text-[var(--scolio-danger-coral)]" style={{ fontSize: 'var(--text-body)' }}>{erroPassword}</span>
          </div>
        )}

        <form onSubmit={tratarAlterarPassword} className="space-y-4 max-w-sm">
          <Input
            label={t('profile.currentPassword')}
            type="password"
            autoComplete="current-password"
            required
            value={passwordAtual}
            onChange={(e) => setPasswordAtual(e.target.value)}
          />
          <Input
            label={t('profile.newPassword')}
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
            value={novaPassword}
            onChange={(e) => setNovaPassword(e.target.value)}
          />
          <Input
            label={t('profile.confirmPassword')}
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
            value={confirmarPassword}
            onChange={(e) => setConfirmarPassword(e.target.value)}
          />
          <Button type="submit" variant="primary" disabled={aAlterarPassword}>
            {aAlterarPassword ? t('profile.changingPassword') : t('profile.changePassword')}
          </Button>
        </form>
      </section>

      <Modal
        isOpen={modalDesativar}
        title={t('profile.twoFactorDeactivateTitle')}
        onClose={() => !aProcessar && setModalDesativar(false)}
        onConfirm={tratarDesativar}
        confirmLabel={aProcessar ? t('common.confirming') : t('profile.deactivate')}
        cancelLabel={t('common.cancel')}
        confirmVariant="danger"
      >
        <p className="text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-body)' }}>
          {t('profile.twoFactorDeactivateConfirm')}
        </p>
      </Modal>

      {toast && (
        <div className="fixed top-8 right-8 z-50">
          <Toast title={toast} type="success" onClose={() => setToast(null)} />
        </div>
      )}
    </div>
  );
}
