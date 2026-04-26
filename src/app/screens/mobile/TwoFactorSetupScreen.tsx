import React from 'react';
import {
  Shield,
  ChevronRight,
  ChevronLeft,
  Smartphone,
  QrCode,
  CheckCircle2,
  Copy,
  Eye,
  EyeOff,
  Check,
  AlertTriangle
} from 'lucide-react';
import { useNavigate } from 'react-router';
import BottomNavigation from '../../components/mobile/BottomNavigation';

type Step = 1 | 2 | 3 | 4;

const BACKUP_CODES = [
  'A3K8-XW12', 'B7P2-NQ45', 'C1R9-LM67', 'D5T4-HJ89',
  'E6U3-GK23', 'F0V7-FI56', 'G9W1-EH78', 'H2Y8-DC90',
];

const AUTHENTICATOR_APPS = [
  { name: 'Google Authenticator', platform: 'iOS & Android', color: '#4285F4' },
  { name: 'Microsoft Authenticator', platform: 'iOS & Android', color: '#00A4EF' },
  { name: 'Authy', platform: 'iOS, Android & Desktop', color: '#EF3B3B' },
];

export default function TwoFactorSetupScreen() {
  const navigate = useNavigate();
  const [step, setStep] = React.useState<Step>(1);
  const [otpCode, setOtpCode] = React.useState('');
  const [copiedCode, setCopiedCode] = React.useState<string | null>(null);
  const [allCopied, setAllCopied] = React.useState(false);
  const [showSecret, setShowSecret] = React.useState(false);
  const [verificationError, setVerificationError] = React.useState(false);

  const SECRET_KEY = 'JBSWY3DPEHPK3PXP';

  const handleCopyCode = (code: string) => {
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleCopyAll = () => {
    setAllCopied(true);
    setTimeout(() => setAllCopied(false), 2000);
  };

  const handleVerify = () => {
    // Simulate: accept any 6-digit code
    if (otpCode.length === 6) {
      setVerificationError(false);
      setStep(4);
    } else {
      setVerificationError(true);
    }
  };

  const steps = [
    { n: 1, label: 'Instalar app' },
    { n: 2, label: 'Digitalizar' },
    { n: 3, label: 'Verificar' },
    { n: 4, label: 'Concluído' },
  ];

  return (
    <div className="h-screen w-screen max-w-[390px] mx-auto bg-[var(--scolio-page-surface)] flex flex-col overflow-hidden">
      {/* Status Bar */}
      <div className="h-11 bg-white" />

      {/* Header */}
      <div className="bg-white px-4 py-4 border-b border-[var(--scolio-border-light)]">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => step > 1 ? setStep((step - 1) as Step) : navigate('/mobile/profile')}
            className="p-2 rounded-[var(--radius-component)] hover:bg-[var(--scolio-page-surface)] transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-[var(--scolio-text-primary)]" />
          </button>
          <div className="flex-1">
            <h2 className="text-[var(--scolio-text-primary)]">Configurar autenticação 2FA</h2>
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-1">
          {steps.map((s, idx) => (
            <React.Fragment key={s.n}>
              <div className="flex flex-col items-center gap-1">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                    step > s.n
                      ? 'bg-[var(--scolio-success-green)]'
                      : step === s.n
                      ? 'bg-[var(--scolio-primary-blue)]'
                      : 'bg-[var(--scolio-border-light)]'
                  }`}
                >
                  {step > s.n ? (
                    <Check className="w-3.5 h-3.5 text-white" />
                  ) : (
                    <span className="text-white" style={{ fontSize: '11px', fontWeight: 600 }}>{s.n}</span>
                  )}
                </div>
                <span
                  className={step === s.n ? 'text-[var(--scolio-primary-blue)]' : 'text-[var(--scolio-text-secondary)]'}
                  style={{ fontSize: '10px', fontWeight: step === s.n ? 600 : 400, whiteSpace: 'nowrap' }}
                >
                  {s.label}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div
                  className="flex-1 h-0.5 mb-4 transition-colors"
                  style={{ background: step > s.n ? 'var(--scolio-success-green)' : 'var(--scolio-border-light)' }}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">

        {/* Step 1 — Install App */}
        {step === 1 && (
          <div className="p-5 space-y-5">
            <div className="flex items-start gap-3 p-4 bg-[var(--scolio-light-blue-surface)] rounded-[var(--radius-card)]">
              <Shield className="w-5 h-5 text-[var(--scolio-primary-blue)] flex-shrink-0 mt-0.5" />
              <p className="text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-caption)' }}>
                A autenticação de dois fatores protege a sua conta mesmo que a sua palavra-passe seja comprometida. Vai precisar de uma app autenticadora no seu telemóvel.
              </p>
            </div>

            <div>
              <p className="text-[var(--scolio-text-primary)] font-medium mb-3" style={{ fontSize: 'var(--text-body)' }}>
                Apps recomendadas
              </p>
              <div className="space-y-3">
                {AUTHENTICATOR_APPS.map(app => (
                  <div
                    key={app.name}
                    className="bg-white rounded-[var(--radius-card)] border border-[var(--scolio-border-light)] p-4 flex items-center gap-3"
                  >
                    <div
                      className="w-10 h-10 rounded-[var(--radius-component)] flex items-center justify-center flex-shrink-0"
                      style={{ background: app.color }}
                    >
                      <Smartphone className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[var(--scolio-text-primary)] font-medium" style={{ fontSize: 'var(--text-body)' }}>
                        {app.name}
                      </p>
                      <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>
                        {app.platform}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[var(--scolio-neutral-gray)]" />
                  </div>
                ))}
              </div>
            </div>

            <p className="text-[var(--scolio-text-secondary)] text-center" style={{ fontSize: 'var(--text-caption)' }}>
              Se já tem uma app instalada, avance para o passo seguinte.
            </p>
          </div>
        )}

        {/* Step 2 — Scan QR */}
        {step === 2 && (
          <div className="p-5 space-y-5">
            <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>
              Abra a app autenticadora e digitalize o código QR abaixo. Se não conseguir digitalizar, introduza a chave secreta manualmente.
            </p>

            {/* QR Code (simulated) */}
            <div className="flex justify-center">
              <div className="w-52 h-52 bg-white border-2 border-[var(--scolio-border-light)] rounded-[var(--radius-card)] flex items-center justify-center">
                <div className="relative">
                  {/* Simulated QR pattern */}
                  <QrCode className="w-40 h-40 text-[var(--scolio-text-primary)]" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-10 h-10 bg-white rounded flex items-center justify-center">
                      <div className="w-7 h-7 bg-[var(--scolio-primary-blue)] rounded" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Manual entry */}
            <div className="bg-[var(--scolio-page-surface)] rounded-[var(--radius-card)] p-4 space-y-2">
              <p className="text-[var(--scolio-text-secondary)] font-medium" style={{ fontSize: 'var(--text-caption)' }}>
                Chave secreta manual
              </p>
              <div className="flex items-center gap-2">
                <code
                  className="flex-1 bg-white border border-[var(--scolio-border-light)] rounded px-3 py-2 font-mono text-[var(--scolio-text-primary)]"
                  style={{ fontSize: 'var(--text-caption)' }}
                >
                  {showSecret ? SECRET_KEY : '●●●● ●●●● ●●●● ●●●●'}
                </code>
                <button
                  onClick={() => setShowSecret(!showSecret)}
                  className="p-2 text-[var(--scolio-neutral-gray)] hover:text-[var(--scolio-primary-blue)]"
                >
                  {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => handleCopyCode(SECRET_KEY)}
                  className="p-2 text-[var(--scolio-neutral-gray)] hover:text-[var(--scolio-primary-blue)]"
                >
                  {copiedCode === SECRET_KEY ? (
                    <Check className="w-4 h-4 text-[var(--scolio-success-green)]" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
              <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>
                Conta: maria.silva@scolioscan.pt · Emissor: ScolioScan
              </p>
            </div>
          </div>
        )}

        {/* Step 3 — Verify OTP */}
        {step === 3 && (
          <div className="p-5 space-y-5">
            <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>
              Abra a app autenticadora e introduza o código de 6 dígitos que aparece para a conta ScolioScan.
            </p>

            <div className="flex justify-center">
              <div className="w-16 h-16 bg-[var(--scolio-light-blue-surface)] rounded-full flex items-center justify-center">
                <Shield className="w-8 h-8 text-[var(--scolio-primary-blue)]" />
              </div>
            </div>

            {/* OTP Input */}
            <div>
              <label className="block text-[var(--scolio-text-primary)] font-medium mb-3" style={{ fontSize: 'var(--text-body)' }}>
                Código de verificação
              </label>
              <div className="flex gap-2 justify-center">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-11 h-14 border-2 rounded-[var(--radius-component)] flex items-center justify-center text-xl font-semibold text-[var(--scolio-text-primary)] ${
                      verificationError
                        ? 'border-[var(--scolio-danger-coral)] bg-[var(--scolio-danger-surface)]'
                        : otpCode.length > i
                        ? 'border-[var(--scolio-primary-blue)] bg-[var(--scolio-light-blue-surface)]'
                        : 'border-[var(--scolio-border-light)] bg-white'
                    }`}
                  >
                    {otpCode[i] || ''}
                  </div>
                ))}
              </div>

              {/* Hidden input trick for mobile keyboard */}
              <input
                type="number"
                maxLength={6}
                value={otpCode}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setOtpCode(val);
                  setVerificationError(false);
                }}
                className="sr-only"
                autoFocus
              />

              <div className="mt-3 grid grid-cols-3 gap-2">
                {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((key) => (
                  <button
                    key={key}
                    onClick={() => {
                      if (key === '⌫') {
                        setOtpCode(prev => prev.slice(0, -1));
                      } else if (key && otpCode.length < 6) {
                        setOtpCode(prev => prev + key);
                        setVerificationError(false);
                      }
                    }}
                    className={`h-12 rounded-[var(--radius-component)] text-xl font-medium transition-colors ${
                      key
                        ? 'bg-white border border-[var(--scolio-border-light)] text-[var(--scolio-text-primary)] hover:bg-[var(--scolio-light-blue-surface)] active:bg-[var(--scolio-primary-blue)] active:text-white'
                        : ''
                    }`}
                  >
                    {key}
                  </button>
                ))}
              </div>
            </div>

            {verificationError && (
              <div className="flex items-center gap-2 p-3 bg-[var(--scolio-danger-surface)] border border-[var(--scolio-danger-coral)] rounded-[var(--radius-component)]">
                <AlertTriangle className="w-4 h-4 text-[var(--scolio-danger-coral)]" />
                <p className="text-[var(--scolio-danger-coral)]" style={{ fontSize: 'var(--text-caption)' }}>
                  Código incorreto. Verifique a app autenticadora e tente novamente.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Step 4 — Backup Codes */}
        {step === 4 && (
          <div className="p-5 space-y-5">
            <div className="flex items-center gap-3 p-4 bg-[var(--scolio-success-surface)] border border-[var(--scolio-success-green)] rounded-[var(--radius-card)]">
              <CheckCircle2 className="w-5 h-5 text-[var(--scolio-success-green)] flex-shrink-0" />
              <p className="text-[var(--scolio-text-primary)] font-medium" style={{ fontSize: 'var(--text-body)' }}>
                Autenticação 2FA ativada com sucesso!
              </p>
            </div>

            <div>
              <p className="text-[var(--scolio-text-primary)] font-medium mb-1" style={{ fontSize: 'var(--text-body)' }}>
                Códigos de recuperação
              </p>
              <p className="text-[var(--scolio-text-secondary)] mb-3" style={{ fontSize: 'var(--text-caption)' }}>
                Guarde estes códigos num local seguro. Cada código só pode ser usado uma vez e servirá para aceder à conta caso perca o acesso à app autenticadora.
              </p>

              <div className="bg-white border border-[var(--scolio-border-light)] rounded-[var(--radius-card)] overflow-hidden">
                <div className="grid grid-cols-2 divide-x divide-y divide-[var(--scolio-border-light)]">
                  {BACKUP_CODES.map(code => (
                    <div key={code} className="flex items-center justify-between px-4 py-3">
                      <code
                        className="text-[var(--scolio-text-primary)] font-mono"
                        style={{ fontSize: 'var(--text-caption)' }}
                      >
                        {code}
                      </code>
                      <button
                        onClick={() => handleCopyCode(code)}
                        className="ml-2 text-[var(--scolio-neutral-gray)] hover:text-[var(--scolio-primary-blue)]"
                      >
                        {copiedCode === code ? (
                          <Check className="w-3.5 h-3.5 text-[var(--scolio-success-green)]" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={handleCopyAll}
                  className="w-full p-3 border-t border-[var(--scolio-border-light)] flex items-center justify-center gap-2 text-[var(--scolio-primary-blue)] hover:bg-[var(--scolio-light-blue-surface)] transition-colors"
                  style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-medium)' }}
                >
                  {allCopied ? (
                    <>
                      <Check className="w-4 h-4 text-[var(--scolio-success-green)]" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copiar todos os códigos
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-[var(--scolio-warning-surface)] border border-[var(--scolio-warning-amber)] rounded-[var(--radius-card)]">
              <AlertTriangle className="w-4 h-4 text-[var(--scolio-warning-amber)] flex-shrink-0 mt-0.5" />
              <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>
                Estes códigos não serão mostrados novamente. Se os perder, precisará de contactar o administrador para repor o acesso.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer CTA */}
      <div className="bg-white border-t border-[var(--scolio-border-light)] p-4">
        {step < 4 ? (
          <button
            onClick={() => {
              if (step === 3) {
                handleVerify();
              } else {
                setStep((step + 1) as Step);
              }
            }}
            disabled={step === 3 && otpCode.length !== 6}
            className={`w-full py-4 rounded-[var(--radius-component)] flex items-center justify-center gap-2 transition-colors font-medium ${
              step === 3 && otpCode.length !== 6
                ? 'bg-[var(--scolio-border-light)] text-[var(--scolio-neutral-gray)] cursor-not-allowed'
                : 'bg-[var(--scolio-primary-blue)] text-white hover:bg-[#155E97] active:bg-[#0F4D7E]'
            }`}
            style={{ fontSize: 'var(--text-body)' }}
          >
            {step === 3 ? 'Verificar código' : step === 1 ? 'Já tenho uma app instalada' : 'Já digitalizei o código'}
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={() => navigate('/mobile/profile')}
            className="w-full py-4 rounded-[var(--radius-component)] bg-[var(--scolio-success-green)] text-white flex items-center justify-center gap-2 hover:bg-[#188D68] transition-colors"
            style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)' }}
          >
            <CheckCircle2 className="w-4 h-4" />
            Concluir configuração
          </button>
        )}
      </div>
    </div>
  );
}
