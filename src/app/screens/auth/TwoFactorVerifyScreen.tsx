import React from 'react';
import { Navigate, useNavigate } from 'react-router';
import { ShieldCheck, AlertCircle, Mail } from 'lucide-react';
import { Button } from '../../components/scolio';
import { useAuth } from '../../auth/AuthContext';
import { AuthenticationError } from '../../../data/repository/auth';
import { useTranslation } from 'react-i18next';

// Tem de bater certo com a definição "Email OTP Length" do projeto Supabase
// (Authentication → Providers → Email). Se mudares lá, muda aqui.
const NUM_DIGITOS = 8;
const COOLDOWN_REENVIO_S = 60;

export default function TwoFactorVerifyScreen() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const {
    pendente2FA,
    verificar2FA,
    verificarEAtivar2FA,
    reenviarOtp,
    cancelarPendente2FA,
  } = useAuth();

  const [digitos, setDigitos] = React.useState<string[]>(() => Array(NUM_DIGITOS).fill(''));
  const [erro, setErro] = React.useState<string | null>(null);
  const [aSubmeter, setASubmeter] = React.useState(false);
  const [cooldown, setCooldown] = React.useState(0);
  const [aReenviar, setAReenviar] = React.useState(false);
  const [mensagemReenvio, setMensagemReenvio] = React.useState<string | null>(null);
  const inputsRef = React.useRef<(HTMLInputElement | null)[]>([]);

  // Cooldown countdown
  React.useEffect(() => {
    if (cooldown <= 0) return;
    const id = window.setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => window.clearTimeout(id);
  }, [cooldown]);

  // Auto-focus no primeiro input
  React.useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  // Sem nada pendente — fora daqui.
  if (!pendente2FA) {
    return <Navigate to="/login" replace />;
  }

  const submeterCodigo = async (codigo: string) => {
    if (codigo.length !== NUM_DIGITOS || aSubmeter) return;
    setASubmeter(true);
    setErro(null);
    setMensagemReenvio(null);
    try {
      if (pendente2FA.modo === 'login') {
        await verificar2FA(codigo);
        // ProtectedRoute / LoginScreen tratam do redirect via estado autenticado
      } else {
        await verificarEAtivar2FA(codigo);
        navigate(-1);
      }
    } catch (err) {
      if (err instanceof AuthenticationError) setErro(err.message);
      else setErro(t('auth.unexpectedError'));
      setDigitos(Array(NUM_DIGITOS).fill(''));
      inputsRef.current[0]?.focus();
    } finally {
      setASubmeter(false);
    }
  };

  const tratarMudanca = (idx: number, valor: string) => {
    // Suporte a paste: se vier mais do que 1 dígito, distribui pelos campos.
    if (valor.length > 1) {
      const colado = valor.replace(/\D/g, '').slice(0, NUM_DIGITOS);
      if (!colado) return;
      const proximos = Array(NUM_DIGITOS).fill('');
      for (let i = 0; i < colado.length; i++) proximos[i] = colado[i];
      setDigitos(proximos);
      const ultimoIdx = Math.min(colado.length, NUM_DIGITOS) - 1;
      inputsRef.current[ultimoIdx]?.focus();
      if (colado.length === NUM_DIGITOS) submeterCodigo(colado);
      return;
    }

    const limpo = valor.replace(/\D/g, '').slice(0, 1);
    const proximos = [...digitos];
    proximos[idx] = limpo;
    setDigitos(proximos);

    if (limpo && idx < NUM_DIGITOS - 1) {
      inputsRef.current[idx + 1]?.focus();
    }
    if (limpo && idx === NUM_DIGITOS - 1 && proximos.every((d) => d !== '')) {
      submeterCodigo(proximos.join(''));
    }
  };

  const tratarTecla = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digitos[idx] && idx > 0) {
      e.preventDefault();
      inputsRef.current[idx - 1]?.focus();
      const proximos = [...digitos];
      proximos[idx - 1] = '';
      setDigitos(proximos);
    }
  };

  const tratarReenvio = async () => {
    if (cooldown > 0 || aReenviar) return;
    setAReenviar(true);
    setErro(null);
    setMensagemReenvio(null);
    try {
      await reenviarOtp();
      setCooldown(COOLDOWN_REENVIO_S);
      setMensagemReenvio(t('twoFactor.resendSuccess'));
    } catch (err) {
      if (err instanceof AuthenticationError) setErro(err.message);
      else setErro(t('auth.unexpectedError'));
    } finally {
      setAReenviar(false);
    }
  };

  const tratarCancelar = async () => {
    const modo = pendente2FA.modo;
    await cancelarPendente2FA();
    if (modo === 'login') {
      navigate('/login', { replace: true });
    } else {
      navigate(-1);
    }
  };

  const tituloKey = pendente2FA.modo === 'login' ? 'twoFactor.titleLogin' : 'twoFactor.titleActivate';
  const subtituloKey =
    pendente2FA.modo === 'login' ? 'twoFactor.subtitleLogin' : 'twoFactor.subtitleActivate';

  return (
    <div className="min-h-screen bg-[var(--scolio-light-blue-surface)] flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-[var(--radius-card)] shadow-lg p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-[var(--scolio-light-blue-surface)] rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="w-8 h-8 text-[var(--scolio-primary-blue)]" />
            </div>
            <h1 className="text-[var(--scolio-text-primary)] mb-2">{t(tituloKey)}</h1>
            <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>
              {t(subtituloKey)}
            </p>
            <p className="mt-2 inline-flex items-center gap-2 text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-body)' }}>
              <Mail className="w-4 h-4 text-[var(--scolio-neutral-gray)]" />
              <span className="font-medium">{pendente2FA.email}</span>
            </p>
          </div>

          {/* Caixas do código — paste é tratado por `tratarMudanca` quando o valor tem >1 char */}
          <div className="flex justify-center gap-1.5 mb-6">
            {digitos.map((d, idx) => (
              <input
                key={idx}
                ref={(el) => { inputsRef.current[idx] = el; }}
                type="text"
                inputMode="numeric"
                autoComplete={idx === 0 ? 'one-time-code' : 'off'}
                maxLength={NUM_DIGITOS}
                value={d}
                onChange={(e) => tratarMudanca(idx, e.target.value)}
                onKeyDown={(e) => tratarTecla(idx, e)}
                disabled={aSubmeter}
                aria-label={t('twoFactor.digitLabel', { n: idx + 1 })}
                className="w-10 h-12 text-center text-xl font-semibold border border-[var(--scolio-border-light)] rounded-[var(--radius-component)] focus:outline-none focus:ring-2 focus:ring-[var(--scolio-primary-blue)] focus:border-transparent disabled:opacity-60"
              />
            ))}
          </div>

          {erro && (
            <div
              className="flex items-start gap-2 p-3 rounded-[var(--radius-component)] bg-[var(--scolio-danger-surface)] border border-[var(--scolio-danger-coral)] mb-4"
              role="alert"
            >
              <AlertCircle className="w-4 h-4 text-[var(--scolio-danger-coral)] mt-0.5 flex-shrink-0" />
              <span className="text-[var(--scolio-danger-coral)]" style={{ fontSize: 'var(--text-body)' }}>{erro}</span>
            </div>
          )}

          {mensagemReenvio && !erro && (
            <p
              className="text-center text-[var(--scolio-success-green)] mb-4"
              style={{ fontSize: 'var(--text-body)' }}
              role="status"
            >
              {mensagemReenvio}
            </p>
          )}

          <Button
            type="button"
            variant="primary"
            className="w-full"
            disabled={aSubmeter || digitos.some((d) => d === '')}
            onClick={() => submeterCodigo(digitos.join(''))}
          >
            {aSubmeter ? t('twoFactor.verifying') : t('twoFactor.verifyButton')}
          </Button>

          <div className="flex items-center justify-between mt-4 text-center">
            <button
              type="button"
              onClick={tratarCancelar}
              className="text-[var(--scolio-text-secondary)] hover:underline"
              style={{ fontSize: 'var(--text-body)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              {t('common.cancel')}
            </button>
            <button
              type="button"
              onClick={tratarReenvio}
              disabled={cooldown > 0 || aReenviar}
              className="text-[var(--scolio-primary-blue)] hover:underline disabled:text-[var(--scolio-neutral-gray)] disabled:no-underline disabled:cursor-not-allowed"
              style={{ fontSize: 'var(--text-body)', background: 'none', border: 'none', padding: 0, cursor: cooldown > 0 ? 'not-allowed' : 'pointer' }}
            >
              {cooldown > 0
                ? t('twoFactor.resendCooldown', { s: cooldown })
                : aReenviar
                  ? t('twoFactor.resending')
                  : t('twoFactor.resend')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
