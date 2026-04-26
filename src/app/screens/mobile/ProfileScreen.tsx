import React from 'react';
import { ChevronDown, ChevronRight, LogOut } from 'lucide-react';
import { Button } from '../../components/scolio';
import BottomNavigation from '../../components/mobile/BottomNavigation';
import { useNavigate } from 'react-router';

export default function ProfileScreen() {
  const navigate = useNavigate();
  const [twoFactorEnabled, setTwoFactorEnabled] = React.useState(true);
  const [pushNotifications, setPushNotifications] = React.useState(true);
  const [language, setLanguage] = React.useState('PT');
  const [wellnessFrequency, setWellnessFrequency] = React.useState('Diário');
  const [aiTrainingConsent, setAiTrainingConsent] = React.useState(false);

  const handleSignOut = () => {
    navigate('/mobile/login');
  };

  return (
    <div className="h-screen w-screen max-w-[390px] mx-auto bg-[var(--scolio-page-surface)] flex flex-col overflow-hidden">
      {/* Status Bar Safe Area */}
      <div className="h-11 bg-white" />

      {/* Header */}
      <div className="bg-white px-6 py-4 border-b border-[var(--scolio-border-light)]">
        <h2 className="text-[var(--scolio-text-primary)]">Perfil</h2>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Avatar Section */}
        <div className="bg-white px-6 py-8 border-b border-[var(--scolio-border-light)] flex flex-col items-center">
          <div className="w-24 h-24 bg-[var(--scolio-primary-blue)] rounded-full flex items-center justify-center mb-4">
            <span className="text-white text-4xl font-semibold">MS</span>
          </div>
          <h2 className="text-[var(--scolio-text-primary)] mb-1">Maria Silva</h2>
          <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>
            maria.silva@example.com
          </p>
        </div>

        {/* My Data Section */}
        <section className="mb-2">
          <div className="px-6 py-3 bg-white border-b border-[var(--scolio-border-light)]">
            <h3 className="text-[var(--scolio-text-primary)]">Os meus dados</h3>
          </div>
          <div className="bg-white">
            <div className="px-6 py-4 flex items-center justify-between">
              <span className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>
                Nome completo
              </span>
              <span className="text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-body)' }}>
                Maria Silva
              </span>
            </div>
            <div className="mx-6 h-px bg-[var(--scolio-border-light)]" />
            <div className="px-6 py-4 flex items-center justify-between">
              <span className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>
                Data de nascimento
              </span>
              <span className="text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-body)' }}>
                15 de março de 2008
              </span>
            </div>
            <div className="mx-6 h-px bg-[var(--scolio-border-light)]" />
            <div className="px-6 py-4 flex items-center justify-between">
              <span className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>
                Género
              </span>
              <span className="text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-body)' }}>
                Feminino
              </span>
            </div>
            <div className="mx-6 h-px bg-[var(--scolio-border-light)]" />
            <div className="px-6 py-4 flex items-center justify-between">
              <span className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>
                Médico responsável
              </span>
              <span className="text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-body)' }}>
                Dr. Ana Martins
              </span>
            </div>
          </div>
        </section>

        {/* Security Section */}
        <section className="mb-2">
          <div className="px-6 py-3 bg-white border-b border-[var(--scolio-border-light)]">
            <h3 className="text-[var(--scolio-text-primary)]">Segurança</h3>
          </div>
          <div className="bg-white">
            <button className="w-full px-6 py-4 flex items-center justify-between hover:bg-[var(--scolio-page-surface)] transition-colors">
              <span className="text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-body)' }}>
                Alterar palavra-passe
              </span>
              <ChevronRight className="w-5 h-5 text-[var(--scolio-neutral-gray)]" />
            </button>
            <div className="mx-6 h-px bg-[var(--scolio-border-light)]" />
            <div className="px-6 py-4 flex items-center justify-between">
              <div className="flex-1">
                <p className="text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-body)' }}>
                  Autenticação de dois fatores
                </p>
                {!twoFactorEnabled && (
                  <p className="text-[var(--scolio-warning-amber)]" style={{ fontSize: 'var(--text-caption)' }}>
                    Recomendado — a sua conta está menos protegida
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                {twoFactorEnabled && (
                  <button
                    onClick={() => navigate('/mobile/2fa-setup')}
                    className="text-[var(--scolio-primary-blue)] underline"
                    style={{ fontSize: 'var(--text-caption)' }}
                  >
                    Configurar
                  </button>
                )}
                <button
                  onClick={() => {
                    if (!twoFactorEnabled) {
                      navigate('/mobile/2fa-setup');
                    } else {
                      setTwoFactorEnabled(false);
                    }
                  }}
                  className={`w-12 h-7 rounded-full transition-colors relative ${
                    twoFactorEnabled ? 'bg-[var(--scolio-success-green)]' : 'bg-[var(--scolio-neutral-gray)]'
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-transform ${
                      twoFactorEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
            <div className="mx-6 h-px bg-[var(--scolio-border-light)]" />
            <button className="w-full px-6 py-4 flex items-center justify-between hover:bg-[var(--scolio-page-surface)] transition-colors">
              <div>
                <p className="text-[var(--scolio-text-primary)] text-left mb-1" style={{ fontSize: 'var(--text-body)' }}>
                  Sessões ativas
                </p>
                <p className="text-[var(--scolio-text-secondary)] text-left" style={{ fontSize: 'var(--text-caption)' }}>
                  2 dispositivos com sessão iniciada
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-[var(--scolio-neutral-gray)]" />
            </button>
          </div>
        </section>

        {/* Preferences Section */}
        <section className="mb-2">
          <div className="px-6 py-3 bg-white border-b border-[var(--scolio-border-light)]">
            <h3 className="text-[var(--scolio-text-primary)]">Preferências</h3>
          </div>
          <div className="bg-white">
            <div className="px-6 py-4">
              <label className="block text-[var(--scolio-text-primary)] mb-2" style={{ fontSize: 'var(--text-body)' }}>
                Idioma
              </label>
              <div className="relative">
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-4 py-2 pr-10 border border-[var(--scolio-border-light)] rounded-[var(--radius-component)] focus:outline-none focus:ring-2 focus:ring-[var(--scolio-primary-blue)] appearance-none"
                  style={{ fontSize: 'var(--text-body)' }}
                >
                  <option value="PT">Português</option>
                  <option value="EN">English</option>
                  <option value="ZH">中文</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--scolio-neutral-gray)] pointer-events-none" />
              </div>
            </div>
            <div className="mx-6 h-px bg-[var(--scolio-border-light)]" />
            <div className="px-6 py-4 flex items-center justify-between">
              <span className="text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-body)' }}>
                Notificações push
              </span>
              <button
                onClick={() => setPushNotifications(!pushNotifications)}
                className={`w-12 h-7 rounded-full transition-colors relative ${
                  pushNotifications ? 'bg-[var(--scolio-success-green)]' : 'bg-[var(--scolio-neutral-gray)]'
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-transform ${
                    pushNotifications ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            <div className="mx-6 h-px bg-[var(--scolio-border-light)]" />
            <div className="px-6 py-4">
              <label className="block text-[var(--scolio-text-primary)] mb-2" style={{ fontSize: 'var(--text-body)' }}>
                Frequência do registo de bem-estar
              </label>
              <div className="relative">
                <select
                  value={wellnessFrequency}
                  onChange={(e) => setWellnessFrequency(e.target.value)}
                  className="w-full px-4 py-2 pr-10 border border-[var(--scolio-border-light)] rounded-[var(--radius-component)] focus:outline-none focus:ring-2 focus:ring-[var(--scolio-primary-blue)] appearance-none"
                  style={{ fontSize: 'var(--text-body)' }}
                >
                  <option value="Diário">Diário</option>
                  <option value="De 2 em 2 dias">De 2 em 2 dias</option>
                  <option value="Semanal">Semanal</option>
                  <option value="Nunca">Nunca</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--scolio-neutral-gray)] pointer-events-none" />
              </div>
            </div>
          </div>
        </section>

        {/* Privacy & Consents Section */}
        <section className="mb-2">
          <div className="px-6 py-3 bg-white border-b border-[var(--scolio-border-light)]">
            <h3 className="text-[var(--scolio-text-primary)]">Privacidade e consentimentos</h3>
          </div>
          <div className="bg-white px-6 py-4">
            <div className="flex items-start gap-3 mb-3">
              <button
                onClick={() => setAiTrainingConsent(!aiTrainingConsent)}
                className={`w-12 h-7 rounded-full transition-colors relative flex-shrink-0 mt-1 ${
                  aiTrainingConsent ? 'bg-[var(--scolio-success-green)]' : 'bg-[var(--scolio-neutral-gray)]'
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-transform ${
                    aiTrainingConsent ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <div className="flex-1">
                <p className="text-[var(--scolio-text-primary)] mb-1" style={{ fontSize: 'var(--text-body)' }}>
                  Consentimento de dados para treino de IA
                </p>
                <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)', lineHeight: '1.5' }}>
                  Permitir que os seus dados clínicos anonimizados sejam utilizados para melhorar os modelos de análise IA.
                  A sua identidade nunca será partilhada. Pode revogar este consentimento a qualquer momento.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section className="mb-2">
          <div className="px-6 py-3 bg-white border-b border-[var(--scolio-border-light)]">
            <h3 className="text-[var(--scolio-text-primary)]">Acerca</h3>
          </div>
          <div className="bg-white">
            <div className="px-6 py-4 flex items-center justify-between">
              <span className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>
                Versão da app
              </span>
              <span className="text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-body)' }}>
                2.4.1
              </span>
            </div>
            <div className="mx-6 h-px bg-[var(--scolio-border-light)]" />
            <button className="w-full px-6 py-4 flex items-center justify-between hover:bg-[var(--scolio-page-surface)] transition-colors">
              <span className="text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-body)' }}>
                Política de privacidade
              </span>
              <ChevronRight className="w-5 h-5 text-[var(--scolio-neutral-gray)]" />
            </button>
            <div className="mx-6 h-px bg-[var(--scolio-border-light)]" />
            <button className="w-full px-6 py-4 flex items-center justify-between hover:bg-[var(--scolio-page-surface)] transition-colors">
              <span className="text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-body)' }}>
                Termos e condições
              </span>
              <ChevronRight className="w-5 h-5 text-[var(--scolio-neutral-gray)]" />
            </button>
          </div>
        </section>

        {/* Sign Out Button */}
        <div className="px-6 py-6">
          <Button
            variant="ghost"
            className="w-full border-2 border-[var(--scolio-danger-coral)] text-[var(--scolio-danger-coral)] hover:bg-[var(--scolio-danger-surface)]"
            onClick={handleSignOut}
          >
            <LogOut className="w-5 h-5 mr-2" />
            Terminar sessão
          </Button>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />

      {/* Home Indicator Safe Area */}
      <div className="h-8 bg-white" />
    </div>
  );
}