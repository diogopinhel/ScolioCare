import React from 'react';
import { Eye, EyeOff, Fingerprint } from 'lucide-react';
import { Button, Input } from '../../components/scolio';
import { useNavigate } from 'react-router';

export default function MobileLoginScreen() {
  const navigate = useNavigate();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);

  const handleSignIn = () => {
    navigate('/mobile/home');
  };

  return (
    <div className="h-screen w-screen max-w-[390px] mx-auto bg-white flex flex-col">
      {/* Status Bar Safe Area */}
      <div className="h-11 bg-white" />

      {/* Content */}
      <div className="flex-1 flex flex-col px-6 py-8">
        {/* Logo */}
        <div className="flex justify-center mb-12 mt-8">
          <div className="flex flex-col items-center gap-4">
            <div className="w-20 h-20 bg-[var(--scolio-primary-blue)] rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-white text-4xl font-semibold">S</span>
            </div>
            <div className="text-center">
              <h2 className="text-[var(--scolio-text-primary)]">ScolioScan</h2>
              <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>
                Aplicação do Paciente
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="space-y-4 mb-6">
          {/* Email Field */}
          <div>
            <label className="block text-[var(--scolio-text-primary)] mb-2" style={{ fontSize: 'var(--text-body)' }}>
              Email
            </label>
            <Input
              type="email"
              placeholder="your.email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-[var(--scolio-text-primary)] mb-2" style={{ fontSize: 'var(--text-body)' }}>
              Password
            </label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Insira a sua password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--scolio-neutral-gray)] hover:text-[var(--scolio-primary-blue)]"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Forgot Password Link */}
          <div className="flex justify-end">
            <button
              className="text-[var(--scolio-primary-blue)] font-medium"
              style={{ fontSize: 'var(--text-body)' }}
            >
              Esqueci a password
            </button>
          </div>
        </div>

        {/* Sign In Button */}
        <Button variant="primary" className="w-full mb-6" onClick={handleSignIn}>
          Entrar
        </Button>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Biometric Banner */}
        <div className="bg-[var(--scolio-light-blue-surface)] border border-[var(--scolio-primary-blue)] rounded-[var(--radius-card)] p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[var(--scolio-primary-blue)] rounded-full flex items-center justify-center flex-shrink-0">
              <Fingerprint className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-[var(--scolio-text-primary)] font-medium mb-1" style={{ fontSize: 'var(--text-body)' }}>
                Ativar acesso biométrico
              </p>
              <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>
                Use Face ID ou impressão digital para entrar mais rapidamente
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Home Indicator Safe Area */}
      <div className="h-8 bg-white" />
    </div>
  );
}