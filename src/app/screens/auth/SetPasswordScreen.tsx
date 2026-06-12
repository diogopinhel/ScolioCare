import React from 'react';
import { useNavigate } from 'react-router';
import { KeyRound, AlertCircle } from 'lucide-react';
import { Button, Input } from '../../components/scolio';
import { supabase } from '../../../lib/supabase';
import { useTranslation } from 'react-i18next';

export default function SetPasswordScreen() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [aCarregar, setACarregar] = React.useState(true);
  const [sessaoValida, setSessaoValida] = React.useState(false);
  const [novaPassword, setNovaPassword] = React.useState('');
  const [confirmarPassword, setConfirmarPassword] = React.useState('');
  const [erro, setErro] = React.useState<string | null>(null);
  const [aGuardar, setAGuardar] = React.useState(false);

  // O link de convite do Supabase autentica o utilizador via tokens na URL
  // (detectSessionInUrl). Lemos a sessão diretamente em vez de passar pelo
  // AuthContext, que ignora o evento SIGNED_IN.
  React.useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSessaoValida(!!data.session);
      setACarregar(false);
    });
  }, []);

  const tratarSubmeter = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    if (novaPassword.length < 8) {
      setErro(t('profile.passwordTooShort'));
      return;
    }
    if (novaPassword !== confirmarPassword) {
      setErro(t('profile.passwordMismatch'));
      return;
    }

    setAGuardar(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: novaPassword });
      if (error) throw error;

      // Termina a sessão criada pelo link de convite — o utilizador inicia
      // sessão de novo pelo fluxo normal, já com a password definida.
      await supabase.auth.signOut();
      navigate('/login', { replace: true, state: { mensagem: t('setPassword.success') } });
    } catch (err) {
      console.error('SetPasswordScreen: falha ao definir password', err);
      setErro(t('auth.unexpectedError'));
      setAGuardar(false);
    }
  };

  if (aCarregar) {
    return (
      <div className="min-h-screen bg-[var(--scolio-light-blue-surface)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[var(--scolio-primary-blue)] border-t-transparent rounded-full animate-spin" />
          <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>
            {t('common.loading')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--scolio-light-blue-surface)] flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-[var(--radius-card)] shadow-lg p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-[var(--scolio-light-blue-surface)] rounded-full flex items-center justify-center mx-auto mb-4">
              <KeyRound className="w-8 h-8 text-[var(--scolio-primary-blue)]" />
            </div>
            <h1 className="text-[var(--scolio-text-primary)] mb-2">{t('setPassword.title')}</h1>
            <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>
              {t('setPassword.subtitle')}
            </p>
          </div>

          {!sessaoValida ? (
            <>
              <div
                className="flex items-start gap-2 p-3 rounded-[var(--radius-component)] bg-[var(--scolio-danger-surface)] border border-[var(--scolio-danger-coral)] mb-4"
                role="alert"
              >
                <AlertCircle className="w-4 h-4 text-[var(--scolio-danger-coral)] mt-0.5 flex-shrink-0" />
                <span className="text-[var(--scolio-danger-coral)]" style={{ fontSize: 'var(--text-body)' }}>
                  {t('setPassword.invalidLink')}
                </span>
              </div>
              <Button type="button" variant="primary" className="w-full" onClick={() => navigate('/login', { replace: true })}>
                {t('setPassword.backToLogin')}
              </Button>
            </>
          ) : (
            <form onSubmit={tratarSubmeter} className="space-y-4">
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

              {erro && (
                <div
                  className="flex items-start gap-2 p-3 rounded-[var(--radius-component)] bg-[var(--scolio-danger-surface)] border border-[var(--scolio-danger-coral)]"
                  role="alert"
                >
                  <AlertCircle className="w-4 h-4 text-[var(--scolio-danger-coral)] mt-0.5 flex-shrink-0" />
                  <span className="text-[var(--scolio-danger-coral)]" style={{ fontSize: 'var(--text-body)' }}>
                    {erro}
                  </span>
                </div>
              )}

              <Button type="submit" variant="primary" className="w-full" disabled={aGuardar}>
                {aGuardar ? t('setPassword.submitting') : t('setPassword.submitButton')}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
