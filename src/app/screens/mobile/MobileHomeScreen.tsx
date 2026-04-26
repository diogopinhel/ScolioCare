import React from 'react';
import { Bell, ChevronRight, Activity, FileText, Calendar, TrendingDown } from 'lucide-react';
import { Button, StatusBadge } from '../../components/scolio';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import BottomNavigation from '../../components/mobile/BottomNavigation';
import { useNavigate } from 'react-router';

// Mock data for mini evolution chart
const evolutionData = [
  { exam: 'E1', angle: 16.1 },
  { exam: 'E2', angle: 15.7 },
  { exam: 'E3', angle: 15.3 },
  { exam: 'E4', angle: 14.9 },
  { exam: 'E5', angle: 15.2 },
];

// Mock notifications
const notifications = [
  {
    id: 1,
    icon: FileText,
    title: 'Novo relatório de exame disponível',
    timestamp: 'há 2 horas',
    color: 'var(--scolio-primary-blue)',
  },
  {
    id: 2,
    icon: Calendar,
    title: 'Lembrete de consulta: 15 de abril',
    timestamp: 'há 1 dia',
    color: 'var(--scolio-warning-amber)',
  },
  {
    id: 3,
    icon: Activity,
    title: 'Hora de registar o seu bem-estar',
    timestamp: 'há 3 dias',
    color: 'var(--scolio-success-green)',
  },
];

export default function MobileHomeScreen() {
  const navigate = useNavigate();

  return (
    <div className="h-screen w-screen max-w-[390px] mx-auto bg-[var(--scolio-page-surface)] flex flex-col overflow-hidden">
      {/* Status Bar Safe Area */}
      <div className="h-11 bg-white" />

      {/* Header */}
      <div className="bg-white px-6 py-5 border-b border-[var(--scolio-border-light)]">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <h2 className="text-[var(--scolio-text-primary)] mb-1">Olá, Maria</h2>
            <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>
              Quarta-feira, 8 de abril de 2026
            </p>
          </div>
          <button className="relative" onClick={() => navigate('/mobile/notifications')}>
            <Bell className="w-6 h-6 text-[var(--scolio-text-primary)]" />
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-[var(--scolio-danger-coral)] rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-semibold">3</span>
            </div>
          </button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-6 py-6 space-y-6">
          {/* Latest Exam Card */}
          <div className="bg-[var(--scolio-light-blue-surface)] border border-[var(--scolio-primary-blue)] rounded-[var(--radius-card)] p-5">
            <p className="text-[var(--scolio-primary-blue)] font-medium mb-4" style={{ fontSize: 'var(--text-body)' }}>
              O seu último exame
            </p>
            
            <div className="space-y-4">
              <div>
                <p className="text-[var(--scolio-text-secondary)] mb-1" style={{ fontSize: 'var(--text-caption)' }}>
                  Data do exame
                </p>
                <p className="text-[var(--scolio-text-primary)] font-medium" style={{ fontSize: 'var(--text-body)' }}>
                  8 de abril de 2026
                </p>
              </div>

              <div>
                <p className="text-[var(--scolio-text-secondary)] mb-2" style={{ fontSize: 'var(--text-caption)' }}>
                  Ângulo de Cobb
                </p>
                <div className="flex items-end gap-2">
                  <p className="text-[var(--scolio-text-primary)] font-semibold" style={{ fontSize: '48px', lineHeight: '1' }}>
                    15.2°
                  </p>
                  <div className="flex items-center gap-1 mb-2">
                    <TrendingDown className="w-4 h-4 text-[var(--scolio-success-green)]" />
                    <span className="text-[var(--scolio-success-green)] font-medium" style={{ fontSize: 'var(--text-caption)' }}>
                      Melhoria
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <StatusBadge status="analyzed" />
                <span className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>
                  Relatório disponível
                </span>
              </div>

              <Button variant="ghost" className="w-full" onClick={() => navigate('/mobile/exam-detail')}>
                Ver exame
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>

          {/* Recent Evolution */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[var(--scolio-text-primary)]">Evolução recente</h3>
              <button
                className="text-[var(--scolio-primary-blue)] font-medium"
                style={{ fontSize: 'var(--text-body)' }}
                onClick={() => navigate('/mobile/exams')}
              >
                Ver histórico completo
              </button>
            </div>

            <div className="bg-white rounded-[var(--radius-card)] border border-[var(--scolio-border-light)] p-4">
              <p className="text-[var(--scolio-text-secondary)] mb-3" style={{ fontSize: 'var(--text-caption)' }}>
                Ângulo de Cobb - Últimos 5 exames
              </p>
              <ResponsiveContainer width="100%" height={120}>
                <LineChart data={evolutionData}>
                  <XAxis
                    dataKey="exam"
                    tick={{ fill: 'var(--scolio-text-secondary)', fontSize: 11 }}
                    axisLine={{ stroke: 'var(--scolio-border-light)' }}
                  />
                  <YAxis
                    tick={{ fill: 'var(--scolio-text-secondary)', fontSize: 11 }}
                    axisLine={{ stroke: 'var(--scolio-border-light)' }}
                    domain={[14, 17]}
                  />
                  <Line
                    type="monotone"
                    dataKey="angle"
                    stroke="var(--scolio-primary-blue)"
                    strokeWidth={2}
                    dot={{ r: 4, fill: 'var(--scolio-primary-blue)' }}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Notifications */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[var(--scolio-text-primary)]">Notificações</h3>
              <button
                className="text-[var(--scolio-primary-blue)] font-medium"
                style={{ fontSize: 'var(--text-body)' }}
                onClick={() => navigate('/mobile/notifications')}
              >
                Ver todas
              </button>
            </div>

            <div className="space-y-3">
              {notifications.map((notification) => {
                const Icon = notification.icon;
                return (
                  <div
                    key={notification.id}
                    className="bg-white rounded-[var(--radius-card)] border border-[var(--scolio-border-light)] p-4 flex items-start gap-3"
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${notification.color}15` }}
                    >
                      <Icon className="w-5 h-5" style={{ color: notification.color }} />
                    </div>
                    <div className="flex-1">
                      <p className="text-[var(--scolio-text-primary)] font-medium mb-1" style={{ fontSize: 'var(--text-body)' }}>
                        {notification.title}
                      </p>
                      <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>
                        {notification.timestamp}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-[var(--scolio-neutral-gray)] flex-shrink-0" />
                  </div>
                );
              })}
            </div>
          </section>

          {/* My Wellness */}
          <section className="pb-6">
            <h3 className="text-[var(--scolio-text-primary)] mb-4">O meu bem-estar</h3>
            
            <div className="bg-[var(--scolio-success-surface)] border border-[var(--scolio-success-green)] rounded-[var(--radius-card)] p-5">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 bg-[var(--scolio-success-green)] rounded-full flex items-center justify-center flex-shrink-0">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-[var(--scolio-text-primary)] font-medium mb-1" style={{ fontSize: 'var(--text-body)' }}>
                    Como se sente hoje?
                  </p>
                  <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>
                    Registe o seu nível de dor, mobilidade e bem-estar geral
                  </p>
                </div>
              </div>
              
              <Button variant="primary" className="w-full bg-[var(--scolio-success-green)] hover:bg-[#188D68]" onClick={() => navigate('/mobile/wellness-log')}>
                Registar bem-estar
              </Button>
            </div>
          </section>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />

      {/* Home Indicator Safe Area */}
      <div className="h-8 bg-white" />
    </div>
  );
}