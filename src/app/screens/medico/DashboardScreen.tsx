import React, { useState, useEffect } from 'react';
import { Users, FileText, CheckCircle2, FileBarChart, Upload, Activity, FileCheck } from 'lucide-react';
import { Button, StatusBadge, ExamListSkeleton, PatientCardSkeleton } from '../../components/scolio';
import type { BadgeStatus } from '../../components/scolio';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router';
import { useAuth } from '../../auth/AuthContext';
import { useTranslation } from 'react-i18next';
import {
  getMetricasDashboard,
  getEstudosPendentesValidacao,
  getExamesPorSemana,
  getAtividadeRecente,
} from '../../../data/repository/estudos';
import { getPacientesAssociados } from '../../../data/repository/pacientes';
import type {
  MetricasDashboardMedico,
  EstudoResumo,
  PacienteResumo,
  DadosSemanais,
  AtividadeResumo,
  EstadoEstudo,
} from '../../../data/types';

// ─── Helpers ────────────────────────────────────────────────────────────────

function semanasFallback(): DadosSemanais[] {
  return Array.from({ length: 8 }, (_, i) => ({ semana: `S${i + 1}`, exames: 0 }));
}

function tempoRelativo(dataISO: string, t: (key: string, opts?: Record<string, unknown>) => string): string {
  const diff = Date.now() - new Date(dataISO).getTime();
  const minutos = Math.floor(diff / 60000);
  if (minutos < 1) return t('dashboard.timeNow');
  if (minutos < 60) return t('dashboard.timeMinutes', { count: minutos });
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return horas === 1 ? t('dashboard.timeHour', { count: horas }) : t('dashboard.timeHours', { count: horas });
  const dias = Math.floor(horas / 24);
  if (dias === 1) return t('dashboard.timeYesterday');
  return t('dashboard.timeDays', { count: dias });
}

function formatarDataHora(iso: string): { data: string; hora: string } {
  const d = new Date(iso);
  return {
    data: d.toLocaleDateString('pt-PT'),
    hora: d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }),
  };
}

function badgeStatusPorEstado(estado: EstadoEstudo): BadgeStatus {
  switch (estado) {
    case 'UPLOADED':          return 'pending';
    case 'PROCESSING':        return 'in-analysis';
    case 'PENDING_VALIDATION':return 'analyzed';
    case 'VALIDATED':         return 'analyzed';
    case 'DIAGNOSED':         return 'analyzed';
    case 'SENT':              return 'analyzed';
    case 'ARCHIVED':          return 'archived';
    default:                  return 'pending';
  }
}

function iconePorEstado(estado: EstadoEstudo): React.ElementType {
  switch (estado) {
    case 'UPLOADED':          return Upload;
    case 'PROCESSING':        return Activity;
    case 'PENDING_VALIDATION':return Activity;
    case 'VALIDATED':         return FileCheck;
    case 'DIAGNOSED':         return FileText;
    case 'SENT':              return FileBarChart;
    case 'ARCHIVED':          return FileText;
    default:                  return Activity;
  }
}

function mensagemPorEstado(estado: EstadoEstudo, pacienteNome: string, t: (key: string, opts?: Record<string, unknown>) => string): string {
  switch (estado) {
    case 'UPLOADED':          return t('dashboard.activityUploaded', { name: pacienteNome });
    case 'PROCESSING':        return t('dashboard.activityProcessing', { name: pacienteNome });
    case 'PENDING_VALIDATION':return t('dashboard.activityPendingValidation', { name: pacienteNome });
    case 'VALIDATED':         return t('dashboard.activityValidated', { name: pacienteNome });
    case 'DIAGNOSED':         return t('dashboard.activityDiagnosed', { name: pacienteNome });
    case 'SENT':              return t('dashboard.activitySent', { name: pacienteNome });
    case 'ARCHIVED':          return t('dashboard.activityArchived', { name: pacienteNome });
    default:                  return t('dashboard.activityUpdate', { name: pacienteNome });
  }
}

// ─── Ecrã principal ─────────────────────────────────────────────────────────

export default function DashboardScreen() {
  const { utilizador } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [aCarregar, setACarregar] = useState(true);
  const [metricas, setMetricas] = useState<MetricasDashboardMedico | null>(null);
  const [pendentes, setPendentes] = useState<EstudoResumo[]>([]);
  const [pacientes, setPacientes] = useState<PacienteResumo[]>([]);
  const [semanal, setSemanal] = useState<DadosSemanais[]>(semanasFallback());
  const [atividade, setAtividade] = useState<AtividadeResumo[]>([]);

  useEffect(() => {
    let cancelado = false;

    async function carregar() {
      setACarregar(true);
      try {
        const [m, p, pa, s, a] = await Promise.all([
          getMetricasDashboard(),
          getEstudosPendentesValidacao(),
          getPacientesAssociados(),
          getExamesPorSemana(),
          getAtividadeRecente(),
        ]);
        if (!cancelado) {
          setMetricas(m);
          setPendentes(p);
          setPacientes(pa);
          setSemanal(s);
          setAtividade(a);
        }
      } catch {
        // dados ficam nos valores iniciais
      } finally {
        if (!cancelado) setACarregar(false);
      }
    }

    carregar();
    return () => { cancelado = true; };
  }, []);

  const currentDate = new Date().toLocaleDateString('pt-PT', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const nomeMedico = utilizador ? `Dr. ${utilizador.nomeCompleto}` : 'Médico';

  return (
    <div className="p-8 space-y-6 overflow-auto h-full">
      {/* Cabeçalho de boas-vindas */}
      <div>
        <h1 className="text-[var(--scolio-text-primary)]">{t('dashboard.goodMorning', { name: nomeMedico })}</h1>
        <p className="text-[var(--scolio-text-secondary)] mt-1" style={{ fontSize: 'var(--text-body)' }}>
          {currentDate}
        </p>
      </div>

      {/* Cartões de métricas */}
      <div className="grid grid-cols-4 gap-6">
        <MetricCard
          icon={Users}
          iconColor="var(--scolio-primary-blue)"
          iconBg="var(--scolio-light-blue-surface)"
          label={t('dashboard.totalActivePatients')}
          value={aCarregar ? '—' : String(metricas?.totalPacientes ?? 0)}
        />
        <MetricCard
          icon={CheckCircle2}
          iconColor="var(--scolio-warning-amber)"
          iconBg="var(--scolio-warning-surface)"
          label={t('dashboard.examsPendingValidation')}
          value={aCarregar ? '—' : String(metricas?.examesPendentesValidacao ?? 0)}
        />
        <MetricCard
          icon={FileText}
          iconColor="var(--scolio-success-green)"
          iconBg="var(--scolio-success-surface)"
          label={t('dashboard.examsAnalyzedThisWeek')}
          value={aCarregar ? '—' : String(metricas?.examesAnalisadosEstaSemana ?? 0)}
        />
        <MetricCard
          icon={FileBarChart}
          iconColor="var(--scolio-primary-blue)"
          iconBg="var(--scolio-light-blue-surface)"
          label={t('dashboard.reportsGeneratedThisMonth')}
          value={aCarregar ? '—' : String(metricas?.relatoriosGeradosEsteMes ?? 0)}
        />
      </div>

      {/* Gráfico + lista de validação pendente */}
      <div className="grid grid-cols-5 gap-6">
        {/* Gráfico — 60% */}
        <div className="col-span-3 bg-white rounded-[var(--radius-card)] shadow-sm border border-[var(--scolio-border-light)] p-6">
          <h3 className="text-[var(--scolio-text-primary)] mb-6">{t('dashboard.examsPerWeek')}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={semanal}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--scolio-border-light)" />
              <XAxis
                dataKey="semana"
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
                  fontSize: '13px',
                }}
              />
              <Bar
                dataKey="exames"
                fill="var(--scolio-primary-blue)"
                radius={[4, 4, 0, 0]}
                key="exames-bar"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* À espera de validação — 40% */}
        <div className="col-span-2 bg-white rounded-[var(--radius-card)] shadow-sm border border-[var(--scolio-border-light)] p-6">
          <h3 className="text-[var(--scolio-text-primary)] mb-6">{t('dashboard.awaitingValidation')}</h3>
          {aCarregar ? (
            <ExamListSkeleton count={4} />
          ) : pendentes.length === 0 ? (
            <p
              className="text-[var(--scolio-text-secondary)] text-center py-8"
              style={{ fontSize: 'var(--text-body)' }}
            >
              {t('dashboard.noExamsPending')}
            </p>
          ) : (
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {pendentes.map((exam) => {
                const { data, hora } = formatarDataHora(exam.dataSubmissao);
                return (
                  <div
                    key={exam.id}
                    className="flex items-center justify-between p-3 bg-[var(--scolio-page-surface)] rounded-[var(--radius-component)] hover:bg-[var(--scolio-light-blue-surface)] transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-[var(--scolio-text-primary)] font-medium truncate"
                        style={{ fontSize: 'var(--text-body)' }}
                      >
                        {exam.pacienteNome}
                      </p>
                      <p
                        className="text-[var(--scolio-text-secondary)] mt-0.5"
                        style={{ fontSize: 'var(--text-caption)' }}
                      >
                        {data} {t('dashboard.at')} {hora}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-3">
                      <StatusBadge status={badgeStatusPorEstado(exam.estado)} />
                      <Button
                        variant="primary"
                        className="text-xs px-3 py-1"
                        onClick={() => navigate(`/exam-viewer/${exam.id}`)}
                      >
                        {t('dashboard.validate')}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Pacientes associados + atividade recente */}
      <div className="grid grid-cols-2 gap-6">
        {/* Pacientes associados */}
        <div className="bg-white rounded-[var(--radius-card)] shadow-sm border border-[var(--scolio-border-light)] p-6">
          <h3 className="text-[var(--scolio-text-primary)] mb-6">{t('dashboard.associatedPatients')}</h3>
          {aCarregar ? (
            <PatientCardSkeleton count={4} />
          ) : pacientes.length === 0 ? (
            <p
              className="text-[var(--scolio-text-secondary)] text-center py-8"
              style={{ fontSize: 'var(--text-body)' }}
            >
              {t('dashboard.noAssociatedPatients')}
            </p>
          ) : (
            <div className="space-y-3">
              {pacientes.map((patient) => (
                <div
                  key={patient.id}
                  className="flex items-center gap-3 p-3 hover:bg-[var(--scolio-page-surface)] rounded-[var(--radius-component)] transition-colors cursor-pointer"
                  onClick={() => navigate(`/patients/${patient.id}`)}
                >
                  <div className="w-10 h-10 rounded-full bg-[var(--scolio-primary-blue)] flex items-center justify-center text-white font-medium">
                    {patient.nomeCompleto.split(' ').map((n) => n[0]).join('')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-[var(--scolio-text-primary)] font-medium truncate"
                      style={{ fontSize: 'var(--text-body)' }}
                    >
                      {patient.nomeCompleto}
                    </p>
                    <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>
                      {patient.numeroUtente}
                    </p>
                  </div>
                  <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>
                    {tempoRelativo(patient.dataAssociacao, t)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Atividade recente */}
        <div className="bg-white rounded-[var(--radius-card)] shadow-sm border border-[var(--scolio-border-light)] p-6">
          <h3 className="text-[var(--scolio-text-primary)] mb-6">{t('dashboard.recentActivity')}</h3>
          {aCarregar ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3 animate-pulse">
                  <div className="w-8 h-8 rounded-full bg-[var(--scolio-border-light)] flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-[var(--scolio-border-light)] rounded w-3/4" />
                    <div className="h-3 bg-[var(--scolio-border-light)] rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : atividade.length === 0 ? (
            <p
              className="text-[var(--scolio-text-secondary)] text-center py-8"
              style={{ fontSize: 'var(--text-body)' }}
            >
              {t('dashboard.noRecentActivity')}
            </p>
          ) : (
            <div className="space-y-4">
              {atividade.map((item) => {
                const Icon = iconePorEstado(item.estadoNovo);
                return (
                  <div key={item.id} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-[var(--scolio-light-blue-surface)] flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-[var(--scolio-primary-blue)]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-body)' }}>
                        {mensagemPorEstado(item.estadoNovo, item.pacienteNome, t)}
                      </p>
                      <p
                        className="text-[var(--scolio-text-secondary)] mt-0.5"
                        style={{ fontSize: 'var(--text-caption)' }}
                      >
                        {tempoRelativo(item.dataTransicao, t)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Cartão de métrica ───────────────────────────────────────────────────────

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
          <p
            className="text-[var(--scolio-text-primary)] font-semibold mt-1"
            style={{ fontSize: 'var(--text-h2)' }}
          >
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}
