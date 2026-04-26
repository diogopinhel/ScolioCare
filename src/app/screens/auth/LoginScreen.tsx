import React from 'react';
import { useNavigate } from 'react-router';
import { Eye, EyeOff } from 'lucide-react';
import { Button, Input } from '../../components/scolio';
import { OTPInput } from 'input-otp';

export default function LoginScreen() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = React.useState(false);
  const [show2FA, setShow2FA] = React.useState(false);
  const [otp, setOtp] = React.useState('');
  const [countdown, setCountdown] = React.useState(60);

  // Countdown timer for OTP
  React.useEffect(() => {
    if (show2FA && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [show2FA, countdown]);

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!show2FA) {
      // Show 2FA step
      setShow2FA(true);
      setCountdown(60);
    } else {
      // Verify OTP and navigate to dashboard
      navigate('/');
    }
  };

  const handleResend = () => {
    setCountdown(60);
    setOtp('');
  };

  return (
    <div className="min-h-screen bg-[var(--scolio-light-blue-surface)] flex items-center justify-center p-8 w-[1440px] mx-auto">
      <div className="w-full max-w-md">
        {/* Login Card */}
        <div className="bg-white rounded-[var(--radius-card)] shadow-lg p-8">
          {/* Logo & Title */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-[var(--scolio-primary-blue)] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-3xl font-semibold">S</span>
            </div>
            <h1 className="text-[var(--scolio-text-primary)] mb-2">ScolioScan</h1>
            <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>
              Plataforma clínica para gestão de escoliose
            </p>
          </div>

          {!show2FA ? (
            /* Email & Password Form */
            <form onSubmit={handleSignIn} className="space-y-6">
              <Input
                label="Email"
                type="email"
                placeholder="seu.email@hospital.com"
                required
              />

              <div className="flex flex-col gap-1.5">
                <label className="text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)' }}>
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Insira a sua password"
                    className="px-3 py-2 pr-10 w-full border border-[var(--scolio-border-light)] rounded-[var(--radius-component)] focus:outline-none focus:ring-2 focus:ring-[var(--scolio-primary-blue)] focus:border-transparent"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--scolio-neutral-gray)] hover:text-[var(--scolio-text-primary)]"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-[var(--scolio-border-light)] text-[var(--scolio-primary-blue)] focus:ring-[var(--scolio-primary-blue)]"
                  />
                  <span className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>
                    Lembrar-me
                  </span>
                </label>
                <a
                  href="#"
                  className="text-[var(--scolio-primary-blue)] hover:underline"
                  style={{ fontSize: 'var(--text-body)' }}
                >
                  Esqueci a password
                </a>
              </div>

              <Button type="submit" variant="primary" className="w-full">
                Entrar
              </Button>
            </form>
          ) : (
            /* 2FA Verification Step */
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-[var(--scolio-text-primary)] mb-2">Autenticação de dois fatores</h3>
                <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>
                  Insira o código de 6 dígitos enviado para o seu email
                </p>
              </div>

              <form onSubmit={handleSignIn} className="space-y-6">
                {/* OTP Input */}
                <div className="flex justify-center">
                  <OTPInput
                    maxLength={6}
                    value={otp}
                    onChange={setOtp}
                    render={({ slots }) => (
                      <div className="flex gap-2">
                        {slots.map((slot, idx) => (
                          <div
                            key={idx}
                            className="w-12 h-14 border-2 border-[var(--scolio-border-light)] rounded-[var(--radius-component)] flex items-center justify-center text-xl font-semibold text-[var(--scolio-text-primary)] focus-within:border-[var(--scolio-primary-blue)] transition-colors"
                          >
                            <input
                              {...slot}
                              className="w-full h-full text-center bg-transparent outline-none"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  />
                </div>

                {/* Countdown Timer */}
                <div className="text-center">
                  {countdown > 0 ? (
                    <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>
                      O código expira em {countdown}s
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResend}
                      className="text-[var(--scolio-primary-blue)] hover:underline"
                      style={{ fontSize: 'var(--text-body)' }}
                    >
                      Reenviar código
                    </button>
                  )}
                </div>

                <Button type="submit" variant="primary" className="w-full" disabled={otp.length !== 6}>
                  Verificar e entrar
                </Button>

                <button
                  type="button"
                  onClick={() => setShow2FA(false)}
                  className="w-full text-[var(--scolio-text-secondary)] hover:text-[var(--scolio-text-primary)] transition-colors"
                  style={{ fontSize: 'var(--text-body)' }}
                >
                  Voltar
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>
            © 2026 ScolioScan. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}
