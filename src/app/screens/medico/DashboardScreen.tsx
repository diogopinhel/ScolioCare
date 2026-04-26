import React from 'react';
import { Users, FileText, CheckCircle2, FileBarChart, Upload, Activity, FileCheck } from 'lucide-react';
import { Button, StatusBadge } from '../../components/scolio';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router';

// Mock data for the chart
const weeklyExamsData = [
  { week: 'W1', exams: 12, id: 'w1' },
  { week: 'W2', exams: 19, id: 'w2' },
  { week: 'W3', exams: 15, id: 'w3' },
  { week: 'W4', exams: 22, id: 'w4' },
  { week: 'W5', exams: 18, id: 'w5' },
  { week: 'W6', exams: 25, id: 'w6' },
  { week: 'W7', exams: 21, id: 'w7' },
  { week: 'W8', exams: 28, id: 'w8' },
];

// Mock data for awaiting validation
const awaitingValidation = [
  { id: 1, name: 'Maria Silva', date: '2026-04-08', time: '14:30', status: 'analyzed' as const },
  { id: 2, name: 'João Santos', date: '2026-04-08', time: '13:15', status: 'analyzed' as const },
  { id: 3, name: 'Ana Costa', date: '2026-04-07', time: '16:45', status: 'analyzed' as const },
  { id: 4, name: 'Pedro Oliveira', date: '2026-04-07', time: '11:20', status: 'analyzed' as const },
  { id: 5, name: 'Sofia Pereira', date: '2026-04-06', time: '15:00', status: 'analyzed' as const },
];

// Mock data for recently accessed patients
const recentPatients = [
  { id: 1, name: 'Carlos Rodrigues', patientId: 'PT-2024-0847', lastAccess: 'há 2 horas' },
  { id: 2, name: 'Beatriz Almeida', patientId: 'PT-2024-0812', lastAccess: 'há 3 horas' },
  { id: 3, name: 'Miguel Fernandes', patientId: 'PT-2024-0756', lastAccess: 'há 5 horas' },
  { id: 4, name: 'Laura Gomes', patientId: 'PT-2024-0691', lastAccess: 'Ontem' },
];

// Mock data for activity feed
const activityFeed = [
  { id: 1, type: 'upload', message: 'Novo exame carregado para Maria Silva', time: 'há 15 min', icon: Upload },
  { id: 2, type: 'complete', message: 'Análise IA concluída para João Santos', time: 'há 32 min', icon: Activity },
  { id: 3, type: 'report', message: 'Relatório emitido para Ana Costa', time: 'há 1 hora', icon: FileCheck },
  { id: 4, type: 'upload', message: 'Novo exame carregado para Pedro Oliveira', time: 'há 2 horas', icon: Upload },
  { id: 5, type: 'complete', message: 'Análise IA concluída para Sofia Pereira', time: 'há 3 horas', icon: Activity },
];

export default function DashboardScreen() {
  const currentDate = new Date().toLocaleDateString('pt-PT', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const navigate = useNavigate();

  return (
    <div className="p-8 space-y-6 overflow-auto h-full">
      {/* Welcome Header */}
      <div>
        <h1 className="text-[var(--scolio-text-primary)]">Bom dia, Dr. Ana Martins</h1>
        <p className="text-[var(--scolio-text-secondary)] mt-1" style={{ fontSize: 'var(--text-body)' }}>
          {currentDate}
        </p>
      </div>

      {/* Metrics Cards Row */}
      <div className="grid grid-cols-4 gap-6">
        <MetricCard
          icon={Users}
          iconColor="var(--scolio-primary-blue)"
          iconBg="var(--scolio-light-blue-surface)"
          label="Total de pacientes ativos"
          value="847"
        />
        <MetricCard
          icon={CheckCircle2}
          iconColor="var(--scolio-warning-amber)"
          iconBg="var(--scolio-warning-surface)"
          label="Exames pendentes de validação"
          value="23"
        />
        <MetricCard
          icon={FileText}
          iconColor="var(--scolio-success-green)"
          iconBg="var(--scolio-success-surface)"
          label="Exames analisados esta semana"
          value="128"
        />
        <MetricCard
          icon={FileBarChart}
          iconColor="var(--scolio-primary-blue)"
          iconBg="var(--scolio-light-blue-surface)"
          label="Relatórios gerados este mês"
          value="342"
        />
      </div>

      {/* Chart and Validation List Row */}
      <div className="grid grid-cols-5 gap-6">
        {/* Chart - 60% width (3 columns) */}
        <div className="col-span-3 bg-white rounded-[var(--radius-card)] shadow-sm border border-[var(--scolio-border-light)] p-6">
          <h3 className="text-[var(--scolio-text-primary)] mb-6">Exames por semana (últimas 8 semanas)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={weeklyExamsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--scolio-border-light)" />
              <XAxis 
                dataKey="week" 
                tick={{ fill: 'var(--scolio-text-secondary)', fontSize: 13 }}
              />
              <YAxis 
                tick={{ fill: 'var(--scolio-text-secondary)', fontSize: 13 }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white',
                  border: '1px solid var(--scolio-border-light)',
                  borderRadius: 'var(--radius-component)',
                  fontSize: '13px'
                }}
              />
              <Bar 
                dataKey="exams" 
                fill="var(--scolio-primary-blue)" 
                radius={[4, 4, 0, 0]}
                key="exams-bar"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Awaiting Validation - 40% width (2 columns) */}
        <div className="col-span-2 bg-white rounded-[var(--radius-card)] shadow-sm border border-[var(--scolio-border-light)] p-6">
          <h3 className="text-[var(--scolio-text-primary)] mb-6">À espera de validação</h3>
          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {awaitingValidation.map((exam) => (
              <div
                key={exam.id}
                className="flex items-center justify-between p-3 bg-[var(--scolio-page-surface)] rounded-[var(--radius-component)] hover:bg-[var(--scolio-light-blue-surface)] transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-[var(--scolio-text-primary)] font-medium truncate" style={{ fontSize: 'var(--text-body)' }}>
                    {exam.name}
                  </p>
                  <p className="text-[var(--scolio-text-secondary)] mt-0.5" style={{ fontSize: 'var(--text-caption)' }}>
                    {exam.date} às {exam.time}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-3">
                  <StatusBadge status={exam.status} />
                  <Button
                    variant="primary"
                    className="text-xs px-3 py-1"
                    onClick={() => navigate('/exam-viewer')}
                  >
                    Validar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recently Accessed and Activity Feed Row */}
      <div className="grid grid-cols-2 gap-6">
        {/* Recently Accessed Patients */}
        <div className="bg-white rounded-[var(--radius-card)] shadow-sm border border-[var(--scolio-border-light)] p-6">
          <h3 className="text-[var(--scolio-text-primary)] mb-6">Pacientes acedidos recentemente</h3>
          <div className="space-y-3">
            {recentPatients.map((patient) => (
              <div
                key={patient.id}
                className="flex items-center gap-3 p-3 hover:bg-[var(--scolio-page-surface)] rounded-[var(--radius-component)] transition-colors cursor-pointer"
                onClick={() => navigate(`/patients/${patient.patientId}`)}
              >
                <div className="w-10 h-10 rounded-full bg-[var(--scolio-primary-blue)] flex items-center justify-center text-white font-medium">
                  {patient.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[var(--scolio-text-primary)] font-medium truncate" style={{ fontSize: 'var(--text-body)' }}>
                    {patient.name}
                  </p>
                  <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>
                    {patient.patientId}
                  </p>
                </div>
                <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>
                  {patient.lastAccess}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Activity Feed */}
        <div className="bg-white rounded-[var(--radius-card)] shadow-sm border border-[var(--scolio-border-light)] p-6">
          <h3 className="text-[var(--scolio-text-primary)] mb-6">Atividade recente</h3>
          <div className="space-y-4">
            {activityFeed.map((activity) => {
              const Icon = activity.icon;
              return (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-[var(--scolio-light-blue-surface)] flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-[var(--scolio-primary-blue)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-body)' }}>
                      {activity.message}
                    </p>
                    <p className="text-[var(--scolio-text-secondary)] mt-0.5" style={{ fontSize: 'var(--text-caption)' }}>
                      {activity.time}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// Metric Card Component
interface MetricCardProps {
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  label: string;
  value: string;
}

function MetricCard({ icon: Icon, iconColor, iconBg, label, value }: MetricCardProps) {
  return (
    <div className="bg-white rounded-[var(--radius-card)] shadow-sm border border-[var(--scolio-border-light)] p-6">
      <div className="flex items-center gap-4">
        <div 
          className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: iconBg }}
        >
          <Icon className="w-6 h-6" style={{ color: iconColor }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>
            {label}
          </p>
          <p className="text-[var(--scolio-text-primary)] font-semibold mt-1" style={{ fontSize: 'var(--text-h2)' }}>
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}