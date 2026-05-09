import React from 'react';
import { Edit, FileText, Download, MapPin, Phone, Calendar, User, Stethoscope, Plus, FileDown, GitCompare, ShieldAlert, Lock } from 'lucide-react';
import { Button, StatusBadge, type BadgeStatus, Textarea, Toast, ExamCard, SkeletonBlock } from '../../components/scolio';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Dot } from 'recharts';
import { useNavigate, useParams } from 'react-router';
import { useAuth } from '../../auth/AuthContext';
import { getPaciente } from '../../../data/repository/pacientes';
import { getEstudosDoPaciente, getHistoricoEstadoDoPaciente } from '../../../data/repository/estudos';
import { supabase } from '../../../lib/supabase';
import { getWellnessLogDoPaciente } from '../../../data/repository/wellness';
import type { PacienteDetalhe, EstudoComResultado, WellnessLogEntry, HistoricoEstadoEntry, EstadoEstudo } from '../../../data/types';

type TabKey = 'overview' | 'exams' | 'reports' | 'evolution' | 'notes' | 'feedback' | 'audit';

function estadoParaBadge(estado: EstadoEstudo): BadgeStatus {
  switch (estado) {
    case 'UPLOADED':
    case 'PROCESSING':
      return 'in-analysis';
    case 'PENDING_VALIDATION':
      return 'pending';
    case 'VALIDATED':
    case 'DIAGNOSED':
    case 'SENT':
      return 'analyzed';
    case 'ARCHIVED':
      return 'archived';
    default:
      return 'pending';
  }
}

function calcularIdade(dataNascimento: string | null): string {
  if (!dataNascimento) return '—';
  const nascimento = new Date(dataNascimento);
  const hoje = new Date();
  let idade = hoje.getFullYear() - nascimento.getFullYear();
  const m = hoje.getMonth() - nascimento.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) idade--;
  return `${idade} anos`;
}

function iniciaisDe(nome: string): string {
  return nome
    .split(' ')
    .filter(Boolean)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function formatarDataPT(isoDate: string | null): string {
  if (!isoDate) return '—';
  return new Date(isoDate).toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatarDataHoraPT(isoDateTime: string): string {
  return new Date(isoDateTime).toLocaleString('pt-PT', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

function estadoParaTexto(estado: string): string {
  const mapa: Record<string, string> = {
    UPLOADED: 'Carregado',
    PROCESSING: 'Em processamento',
    PENDING_VALIDATION: 'Pendente de validação',
    VALIDATED: 'Validado',
    DIAGNOSED: 'Diagnosticado',
    SENT: 'Enviado',
    ARCHIVED: 'Arquivado',
  };
  return mapa[estado] ?? estado;
}

function calcularLimitePeriodo(periodo: '3m' | '6m' | '1y' | 'all'): Date | null {
  if (periodo === 'all') return null;
  const limite = new Date();
  if (periodo === '3m') limite.setMonth(limite.getMonth() - 3);
  else if (periodo === '6m') limite.setMonth(limite.getMonth() - 6);
  else limite.setFullYear(limite.getFullYear() - 1);
  return limite;
}

export default function PatientRecordScreen() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { utilizador } = useAuth();

  const [activeTab, setActiveTab] = React.useState<TabKey>('overview');
  const [showToast, setShowToast] = React.useState(false);
  const [toastMsg, setToastMsg] = React.useState('');
  const [evolutionPeriod, setEvolutionPeriod] = React.useState<'3m' | '6m' | '1y' | 'all'>('all');
  const [newNote, setNewNote] = React.useState('');

  const [paciente, setPaciente] = React.useState<PacienteDetalhe | null>(null);
  const [estudos, setEstudos] = React.useState<EstudoComResultado[]>([]);
  const [wellnessLog, setWellnessLog] = React.useState<WellnessLogEntry[]>([]);
  const [historico, setHistorico] = React.useState<HistoricoEstadoEntry[]>([]);
  const [aCarregar, setACarregar] = React.useState(true);
  // null = ainda a verificar; true = associado; false = não associado (glass-break ativo ou necessário)
  const [estaAssociado, setEstaAssociado] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    if (!id) {
      setACarregar(false);
      return;
    }

    let cancelado = false;
    setACarregar(true);

    const timeout = window.setTimeout(() => {
      if (!cancelado) setACarregar(false);
    }, 15000);

    // Verificar associação médico-paciente e carregar dados em paralelo
    const verificarAssociacao = supabase
      .from('paciente_medico')
      .select('paciente_id', { count: 'exact', head: true })
      .eq('paciente_id', id)
      .is('data_fim', null);

    Promise.all([
      getPaciente(id),
      getEstudosDoPaciente(id),
      getWellnessLogDoPaciente(id),
      getHistoricoEstadoDoPaciente(id),
      verificarAssociacao,
    ]).then(([p, e, w, h, assoc]) => {
      if (!cancelado) {
        clearTimeout(timeout);
        setPaciente(p);
        setEstudos(e);
        setWellnessLog(w);
        setHistorico(h);
        setEstaAssociado((assoc.count ?? 0) > 0);
        setACarregar(false);
      }
    }).catch(() => {
      if (!cancelado) {
        clearTimeout(timeout);
        setACarregar(false);
      }
    });

    return () => {
      cancelado = true;
      clearTimeout(timeout);
    };
  }, [id]);

  const mostrarToast = (msg: string) => {
    setToastMsg(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleExport = () => mostrarToast('Exportação iniciada...');

  const handleSaveNote = () => {
    setNewNote('');
    mostrarToast('Nota guardada com sucesso.');
  };

  const tabs = [
    { key: 'overview' as TabKey, label: 'Visão geral' },
    { key: 'exams' as TabKey, label: 'Exames' },
    { key: 'reports' as TabKey, label: 'Relatórios' },
    { key: 'evolution' as TabKey, label: 'Histórico de evolução' },
    { key: 'notes' as TabKey, label: 'Notas clínicas' },
    { key: 'feedback' as TabKey, label: 'Feedback do paciente' },
    { key: 'audit' as TabKey, label: 'Auditoria' },
  ];

  // Derived data
  const ultimoExame = estudos[0] ?? null;
  const ultimoWellness = wellnessLog[0] ?? null;
  const nomeMedico = utilizador ? `Dr. ${utilizador.nomeCompleto}` : '—';

  const cobbData = estudos
    .filter((e) => e.resultado !== null)
    .map((e) => ({
      estudoId: e.id,
      rawDate: e.dataEstudo,
      date: new Date(e.dataEstudo).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' }),
      angle: e.resultado!.anguloCobbCorrigido ?? e.resultado!.anguloCobb,
    }))
    .reverse();

  const limitePeriodo = calcularLimitePeriodo(evolutionPeriod);
  const cobbDataFiltrado = limitePeriodo
    ? cobbData.filter((d) => new Date(d.rawDate) >= limitePeriodo)
    : cobbData;

  const diagnostico = ultimoExame?.resultado
    ? [ultimoExame.resultado.grauCurvatura, ultimoExame.resultado.localizacaoCurva]
        .filter(Boolean)
        .join(' — ')
    : null;

  const dataInicioTratamento =
    estudos.length > 0 ? formatarDataPT(estudos[estudos.length - 1].dataEstudo) : null;

  const handleChartClick = (data: any) => {
    const estudoId = data?.activePayload?.[0]?.payload?.estudoId as string | undefined;
    if (estudoId) navigate(`/exam-viewer/${estudoId}`);
  };

  // ─── Loading ──────────────────────────────────────────────────────
  if (aCarregar) {
    return (
      <div className="p-8 space-y-6">
        <div className="bg-white rounded-[var(--radius-card)] shadow-sm border border-[var(--scolio-border-light)] p-6">
          <SkeletonBlock height="80px" />
        </div>
        <div className="bg-white rounded-[var(--radius-card)] shadow-sm border border-[var(--scolio-border-light)] p-6">
          <SkeletonBlock height="400px" />
        </div>
      </div>
    );
  }

  // ─── Paciente não encontrado ──────────────────────────────────────
  if (!paciente) {
    return (
      <div className="p-8 flex items-center justify-center h-full">
        <div className="text-center">
          <p
            className="text-[var(--scolio-text-primary)] mb-2"
            style={{ fontSize: 'var(--text-h3)', fontWeight: 'var(--weight-semibold)' }}
          >
            Paciente não encontrado
          </p>
          <p className="text-[var(--scolio-text-secondary)] mb-4" style={{ fontSize: 'var(--text-body)' }}>
            O paciente solicitado não existe ou não tem acesso a este registo.
          </p>
          <Button variant="secondary" onClick={() => navigate(-1)}>Voltar</Button>
        </div>
      </div>
    );
  }

  const badgeStatus: BadgeStatus = ultimoExame ? estadoParaBadge(ultimoExame.estado) : 'pending';

  return (
    <div className="p-8 space-y-6 overflow-auto h-full">

      {/* Banner de acesso de emergência — visível quando não associado */}
      {estaAssociado === false && (
        <div className="flex items-center justify-between gap-4 px-5 py-4 bg-[var(--scolio-danger-surface)] border border-[var(--scolio-danger-coral)] rounded-[var(--radius-card)]">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-[var(--scolio-danger-coral)] flex-shrink-0" />
            <div>
              <p className="text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-semibold)' }}>
                Acesso de emergência ativo
              </p>
              <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>
                Este paciente não está associado à sua lista. O acesso foi permitido via protocolo Glass-Break e está a ser auditado.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-[var(--scolio-danger-coral)] rounded-[var(--radius-component)] flex-shrink-0">
            <Lock className="w-4 h-4 text-[var(--scolio-danger-coral)]" />
            <span className="text-[var(--scolio-danger-coral)]" style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-medium)' }}>Glass-Break</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-[var(--radius-card)] shadow-sm border border-[var(--scolio-border-light)] p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-[var(--scolio-primary-blue)] flex items-center justify-center text-white text-3xl font-semibold">
              {iniciaisDe(paciente.nomeCompleto)}
            </div>
            <div className="space-y-2">
              <h1 className="text-[var(--scolio-text-primary)]">{paciente.nomeCompleto}</h1>
              <div className="flex items-center gap-6 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>
                {paciente.numeroUtente && (
                  <span className="font-medium">Nº Utente: {paciente.numeroUtente}</span>
                )}
                {paciente.genero && <span>{paciente.genero}</span>}
                <span>{calcularIdade(paciente.dataNascimento)}</span>
                <StatusBadge status={badgeStatus} />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={() => navigate(`/patients/${id}/edit`)}>
              <Edit className="w-4 h-4 mr-2" />
              Editar dados
            </Button>
            <Button variant="primary" onClick={() => navigate('/tecnico/upload')}>
              <FileText className="w-4 h-4 mr-2" />
              Novo exame
            </Button>
            <Button variant="ghost" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Exportar ficha
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-[var(--radius-card)] shadow-sm border border-[var(--scolio-border-light)]">
        <div className="border-b border-[var(--scolio-border-light)]">
          <nav className="flex">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-6 py-4 transition-colors relative ${
                  activeTab === tab.key
                    ? 'text-[var(--scolio-primary-blue)]'
                    : 'text-[var(--scolio-text-secondary)] hover:text-[var(--scolio-text-primary)]'
                }`}
                style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)' }}
              >
                {tab.label}
                {activeTab === tab.key && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--scolio-primary-blue)]" />
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* ── Tab: Visão Geral ── */}
        {activeTab === 'overview' && (
          <div className="p-6">
            <div className="grid grid-cols-5 gap-6">
              <div className="col-span-3 space-y-6">
                <section>
                  <h3 className="text-[var(--scolio-text-primary)] mb-4">Dados demográficos</h3>
                  <div className="bg-[var(--scolio-page-surface)] rounded-[var(--radius-component)] p-5 space-y-4">
                    <DataRow icon={MapPin} label="Morada" value={paciente.morada || '—'} />
                    <DataRow icon={Phone} label="Contacto" value={paciente.contacto || '—'} />
                    <DataRow icon={Calendar} label="Data de nascimento" value={formatarDataPT(paciente.dataNascimento)} />
                  </div>
                </section>

                <section>
                  <h3 className="text-[var(--scolio-text-primary)] mb-4">Dados clínicos</h3>
                  <div className="bg-[var(--scolio-page-surface)] rounded-[var(--radius-component)] p-5 space-y-4">
                    <DataRow icon={Stethoscope} label="Diagnóstico" value={diagnostico || '—'} />
                    <DataRow icon={User} label="Médico responsável" value={nomeMedico} />
                    {dataInicioTratamento && (
                      <DataRow icon={Calendar} label="Primeiro exame" value={dataInicioTratamento} />
                    )}
                  </div>
                </section>

                <section>
                  <h3 className="text-[var(--scolio-text-primary)] mb-4">Evolução do ângulo de Cobb ao longo do tempo</h3>
                  {cobbData.length > 0 ? (
                    <div className="bg-white border border-[var(--scolio-border-light)] rounded-[var(--radius-component)] p-5">
                      <ResponsiveContainer width="100%" height={320}>
                        <LineChart data={cobbData} onClick={handleChartClick}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--scolio-border-light)" />
                          <XAxis
                            dataKey="date"
                            tick={{ fill: 'var(--scolio-text-secondary)', fontSize: 13 }}
                            label={{ value: 'Datas dos exames', position: 'insideBottom', offset: -5, fill: 'var(--scolio-text-secondary)' }}
                          />
                          <YAxis
                            tick={{ fill: 'var(--scolio-text-secondary)', fontSize: 13 }}
                            label={{ value: 'Graus', angle: -90, position: 'insideLeft', fill: 'var(--scolio-text-secondary)' }}
                            domain={[0, 'auto']}
                          />
                          <Tooltip
                            contentStyle={{ backgroundColor: 'white', border: '1px solid var(--scolio-border-light)', borderRadius: 'var(--radius-component)', fontSize: '13px' }}
                            formatter={(value: any) => [`${value}°`, 'Ângulo de Cobb']}
                          />
                          <ReferenceLine y={10} stroke="var(--scolio-warning-amber)" strokeDasharray="5 5" strokeWidth={2}>
                            <text x="50%" y={10} dy={-10} textAnchor="middle" fill="var(--scolio-warning-amber)" fontSize={13} fontWeight={500}>
                              Limiar de escoliose
                            </text>
                          </ReferenceLine>
                          <Line
                            type="monotone"
                            dataKey="angle"
                            stroke="var(--scolio-primary-blue)"
                            strokeWidth={3}
                            dot={<Dot r={6} fill="var(--scolio-primary-blue)" cursor="pointer" />}
                            activeDot={{ r: 8, cursor: 'pointer' }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="bg-[var(--scolio-page-surface)] rounded-[var(--radius-component)] p-8 text-center">
                      <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>
                        Sem exames com ângulo de Cobb registado.
                      </p>
                    </div>
                  )}
                </section>
              </div>

              <div className="col-span-2 space-y-6">
                <section>
                  <h3 className="text-[var(--scolio-text-primary)] mb-4">Último exame</h3>
                  {ultimoExame ? (
                    <div className="bg-white border border-[var(--scolio-border-light)] rounded-[var(--radius-card)] p-5 space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>
                            Data do exame
                          </span>
                          <span className="text-[var(--scolio-text-primary)] font-medium" style={{ fontSize: 'var(--text-body)' }}>
                            {new Date(ultimoExame.dataEstudo).toLocaleDateString('pt-PT')}
                          </span>
                        </div>
                        {ultimoExame.resultado && (
                          <>
                            <div className="flex items-center justify-between">
                              <span className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>
                                Ângulo de Cobb
                              </span>
                              <span className="text-[var(--scolio-text-primary)] font-semibold" style={{ fontSize: 'var(--text-h3)' }}>
                                {(ultimoExame.resultado.anguloCobbCorrigido ?? ultimoExame.resultado.anguloCobb).toFixed(1)}°
                              </span>
                            </div>
                            {ultimoExame.resultado.nivelVertebras && (
                              <div className="flex items-center justify-between">
                                <span className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>
                                  Nível vertebral
                                </span>
                                <span className="text-[var(--scolio-text-primary)] font-medium" style={{ fontSize: 'var(--text-body)' }}>
                                  {ultimoExame.resultado.nivelVertebras}
                                </span>
                              </div>
                            )}
                          </>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>Estado</span>
                          <StatusBadge status={estadoParaBadge(ultimoExame.estado)} />
                        </div>
                      </div>
                      <button
                        onClick={() => navigate(`/exam-viewer/${ultimoExame.id}`)}
                        className="w-full text-[var(--scolio-primary-blue)] hover:underline text-center"
                        style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)' }}
                      >
                        Ver exame →
                      </button>
                    </div>
                  ) : (
                    <div className="bg-[var(--scolio-page-surface)] rounded-[var(--radius-card)] p-5 text-center">
                      <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>
                        Sem exames registados.
                      </p>
                    </div>
                  )}
                </section>

                <section>
                  <h3 className="text-[var(--scolio-text-primary)] mb-4">Resumo de bem-estar</h3>
                  {ultimoWellness ? (
                    <div className="bg-[var(--scolio-success-surface)] border border-[var(--scolio-success-green)] rounded-[var(--radius-card)] p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>Último registo</span>
                        <span className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>
                          {new Date(ultimoWellness.dataRegisto).toLocaleDateString('pt-PT')}
                        </span>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>Nível de dor</p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-3 bg-white rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[var(--scolio-success-green)] rounded-full"
                              style={{ width: `${(ultimoWellness.nivelDor / 9) * 100}%` }}
                            />
                          </div>
                          <span className="text-[var(--scolio-success-green)] font-semibold" style={{ fontSize: 'var(--text-h3)' }}>
                            {ultimoWellness.nivelDor}/9
                          </span>
                        </div>
                      </div>
                      {ultimoWellness.notas && (
                        <p className="text-[var(--scolio-text-secondary)] italic" style={{ fontSize: 'var(--text-body)' }}>
                          "{ultimoWellness.notas}"
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="bg-[var(--scolio-page-surface)] rounded-[var(--radius-card)] p-5 text-center">
                      <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>
                        Sem registos de bem-estar.
                      </p>
                    </div>
                  )}
                </section>
              </div>
            </div>
          </div>
        )}

        {/* ── Tab: Exames ── */}
        {activeTab === 'exams' && (
          <div className="p-6 space-y-6">
            <div className="flex justify-end">
              <Button variant="primary" onClick={() => navigate('/tecnico/upload')}>
                <Plus className="w-4 h-4 mr-2" />
                Novo exame
              </Button>
            </div>
            {estudos.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {estudos.map((exame) => (
                  <ExamCard
                    key={exame.id}
                    date={new Date(exame.dataEstudo).toLocaleDateString('pt-PT')}
                    cobbAngle={exame.resultado ? (exame.resultado.anguloCobbCorrigido ?? exame.resultado.anguloCobb) : 0}
                    apicalVertebra={exame.resultado?.nivelVertebras ?? undefined}
                    status={estadoParaBadge(exame.estado)}
                    onClick={() => navigate(`/exam-viewer/${exame.id}`)}
                  />
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>
                  Sem exames registados para este paciente.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Tab: Relatórios ── */}
        {activeTab === 'reports' && (
          <div className="p-6">
            {estudos.length > 0 ? (
              <div className="bg-white rounded-[var(--radius-card)] border border-[var(--scolio-border-light)] overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[var(--scolio-border-light)] bg-[var(--scolio-page-surface)]">
                      {['DATA DO EXAME', 'TIPO', 'ESTADO', 'MÉDICO', 'AÇÕES'].map((h) => (
                        <th key={h} className="text-left p-4 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-medium)' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {estudos.map((exame) => (
                      <tr key={exame.id} className="border-b border-[var(--scolio-border-light)] hover:bg-[var(--scolio-page-surface)] transition-colors">
                        <td className="p-4 text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-body)' }}>
                          {new Date(exame.dataEstudo).toLocaleDateString('pt-PT')}
                        </td>
                        <td className="p-4 text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-body)' }}>
                          Relatório clínico
                        </td>
                        <td className="p-4">
                          {exame.ficheiroPdf ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-[var(--scolio-success-surface)] text-[var(--scolio-success-green)]" style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-medium)' }}>
                              PDF gerado
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-[var(--scolio-page-surface)] text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-medium)' }}>
                              Por gerar
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>
                          {nomeMedico}
                        </td>
                        <td className="p-4 flex items-center gap-3">
                          <button
                            onClick={() => navigate(`/report-generation/${exame.id}`)}
                            className="flex items-center gap-2 text-[var(--scolio-primary-blue)] hover:underline"
                            style={{ fontSize: 'var(--text-body)' }}
                          >
                            <FileText className="w-4 h-4" />
                            Gerar relatório
                          </button>
                          {exame.ficheiroPdf && (
                            <button
                              onClick={() => window.open(exame.ficheiroPdf!, '_blank')}
                              className="flex items-center gap-2 text-[var(--scolio-text-secondary)] hover:underline"
                              style={{ fontSize: 'var(--text-body)' }}
                            >
                              <FileDown className="w-4 h-4" />
                              Descarregar
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center">
                <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>
                  Sem exames registados. Os relatórios são gerados por exame.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Tab: Histórico de Evolução ── */}
        {activeTab === 'evolution' && (
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              {estudos.filter((e) => e.resultado !== null).length >= 2 && (
                <Button variant="secondary" onClick={() => navigate(`/exam-comparison/${id}`)}>
                  <GitCompare className="w-4 h-4 mr-2" />
                  Comparar exames
                </Button>
              )}
              <div className="flex gap-2 ml-auto">
              {(['3m', '6m', '1y', 'all'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setEvolutionPeriod(p)}
                  className={`px-4 py-2 rounded-[var(--radius-component)] transition-colors ${
                    evolutionPeriod === p
                      ? 'bg-[var(--scolio-primary-blue)] text-white'
                      : 'bg-white border border-[var(--scolio-border-light)] text-[var(--scolio-text-secondary)] hover:bg-[var(--scolio-page-surface)]'
                  }`}
                  style={{ fontSize: 'var(--text-body)' }}
                >
                  {p === '3m' ? '3 meses' : p === '6m' ? '6 meses' : p === '1y' ? '1 ano' : 'Tudo'}
                </button>
              ))}
              </div>
            </div>
            <div className="bg-white border border-[var(--scolio-border-light)] rounded-[var(--radius-card)] p-6">
              <h3 className="text-[var(--scolio-text-primary)] mb-6">Evolução do ângulo de Cobb ao longo do tempo</h3>
              {cobbDataFiltrado.length > 0 ? (
                <ResponsiveContainer width="100%" height={480}>
                  <LineChart data={cobbDataFiltrado}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--scolio-border-light)" />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: 'var(--scolio-text-secondary)', fontSize: 13 }}
                      label={{ value: 'Datas dos exames', position: 'insideBottom', offset: -5, fill: 'var(--scolio-text-secondary)' }}
                    />
                    <YAxis
                      tick={{ fill: 'var(--scolio-text-secondary)', fontSize: 13 }}
                      label={{ value: 'Graus', angle: -90, position: 'insideLeft', fill: 'var(--scolio-text-secondary)' }}
                      domain={[0, 'auto']}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'white', border: '1px solid var(--scolio-border-light)', borderRadius: 'var(--radius-component)', fontSize: '13px' }}
                      formatter={(value: any) => [`${value}°`, 'Ângulo de Cobb']}
                    />
                    <ReferenceLine y={10} stroke="var(--scolio-warning-amber)" strokeDasharray="5 5" strokeWidth={2}>
                      <text x="50%" y={10} dy={-10} textAnchor="middle" fill="var(--scolio-warning-amber)" fontSize={13} fontWeight={500}>
                        Limiar de escoliose
                      </text>
                    </ReferenceLine>
                    <Line
                      type="monotone"
                      dataKey="angle"
                      stroke="var(--scolio-primary-blue)"
                      strokeWidth={3}
                      dot={<Dot r={6} fill="var(--scolio-primary-blue)" cursor="pointer" />}
                      activeDot={{ r: 8, cursor: 'pointer' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="py-12 text-center">
                  <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>
                    Sem dados de ângulo de Cobb no período selecionado.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Tab: Notas Clínicas ── */}
        {activeTab === 'notes' && (
          <div className="p-6 space-y-6">
            <div className="bg-white rounded-[var(--radius-card)] border border-[var(--scolio-border-light)] p-6">
              <h3 className="text-[var(--scolio-text-primary)] mb-4">Adicionar nova nota</h3>
              <Textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                rows={4}
                placeholder="Escreva a sua nota clínica..."
              />
              <div className="mt-3">
                <Button variant="primary" onClick={handleSaveNote}>Guardar nota</Button>
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-[var(--scolio-text-primary)]">Notas anteriores</h3>
              {(() => {
                const notasExames = estudos.filter((e) => e.notasClinicas);
                return notasExames.length > 0 ? (
                  notasExames.map((exame) => (
                    <div key={exame.id} className="bg-white rounded-[var(--radius-card)] border border-[var(--scolio-border-light)] p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="text-[var(--scolio-text-primary)] font-medium" style={{ fontSize: 'var(--text-body)' }}>
                            {nomeMedico}
                          </p>
                          <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>
                            {new Date(exame.dataEstudo).toLocaleDateString('pt-PT')}
                          </p>
                        </div>
                      </div>
                      <p className="text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-body)', lineHeight: '1.6' }}>
                        {exame.notasClinicas}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center">
                    <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>
                      Sem notas clínicas registadas.
                    </p>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* ── Tab: Feedback do Paciente ── */}
        {activeTab === 'feedback' && (
          <div className="p-6 space-y-4">
            <h3 className="text-[var(--scolio-text-primary)]">Registos de bem-estar do paciente</h3>
            {wellnessLog.length > 0 ? (
              wellnessLog.map((fb) => (
                <div key={fb.id} className="bg-white rounded-[var(--radius-card)] border border-[var(--scolio-border-light)] p-5">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>
                      {new Date(fb.dataRegisto).toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-[var(--scolio-text-secondary)] mb-2" style={{ fontSize: 'var(--text-caption)' }}>Nível de dor</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-[var(--scolio-page-surface)] rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${fb.nivelDor <= 3 ? 'bg-[var(--scolio-success-green)]' : fb.nivelDor <= 6 ? 'bg-[var(--scolio-warning-amber)]' : 'bg-[var(--scolio-danger-coral)]'}`}
                            style={{ width: `${(fb.nivelDor / 9) * 100}%` }}
                          />
                        </div>
                        <span className="text-[var(--scolio-text-primary)] font-semibold" style={{ fontSize: 'var(--text-body)' }}>
                          {fb.nivelDor}/9
                        </span>
                      </div>
                    </div>
                    {fb.desconforto && (
                      <div>
                        <p className="text-[var(--scolio-text-secondary)] mb-2" style={{ fontSize: 'var(--text-caption)' }}>Desconforto</p>
                        <p className="text-[var(--scolio-text-primary)] font-medium" style={{ fontSize: 'var(--text-body)' }}>
                          {fb.desconforto === 'none' ? 'Nenhum' : fb.desconforto === 'mild' ? 'Ligeiro' : fb.desconforto === 'moderate' ? 'Moderado' : 'Intenso'}
                        </p>
                      </div>
                    )}
                  </div>
                  {fb.notas && (
                    <p className="text-[var(--scolio-text-secondary)] italic" style={{ fontSize: 'var(--text-body)' }}>
                      "{fb.notas}"
                    </p>
                  )}
                </div>
              ))
            ) : (
              <div className="py-12 text-center">
                <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>
                  Sem registos de bem-estar do paciente.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Tab: Auditoria ── */}
        {activeTab === 'audit' && (
          <div className="p-6">
            {historico.length > 0 ? (
              <div className="bg-white rounded-[var(--radius-card)] border border-[var(--scolio-border-light)] overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[var(--scolio-border-light)] bg-[var(--scolio-page-surface)]">
                      {['DATA/HORA', 'UTILIZADOR', 'ESTADO ANTERIOR', 'ESTADO NOVO', 'OBSERVAÇÃO'].map((h) => (
                        <th key={h} className="text-left p-4 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-medium)' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {historico.map((entrada) => (
                      <tr key={entrada.id} className="border-b border-[var(--scolio-border-light)] hover:bg-[var(--scolio-page-surface)] transition-colors">
                        <td className="p-4 text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-body)' }}>
                          {formatarDataHoraPT(entrada.dataTransicao)}
                        </td>
                        <td className="p-4 text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-body)' }}>
                          {entrada.utilizadorNome}
                        </td>
                        <td className="p-4 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>
                          {entrada.estadoAnterior ? estadoParaTexto(entrada.estadoAnterior) : '—'}
                        </td>
                        <td className="p-4 text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-body)' }}>
                          {estadoParaTexto(entrada.estadoNovo)}
                        </td>
                        <td className="p-4 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>
                          {entrada.observacao || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center">
                <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>
                  Sem registos de auditoria para este paciente.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {showToast && (
        <div className="fixed top-8 right-8 z-50">
          <Toast title={toastMsg} type="success" onClose={() => setShowToast(false)} />
        </div>
      )}
    </div>
  );
}

interface DataRowProps {
  icon: React.ElementType;
  label: string;
  value: string;
}

function DataRow({ icon: Icon, label, value }: DataRowProps) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="w-5 h-5 text-[var(--scolio-neutral-gray)] flex-shrink-0 mt-0.5" />
      <div className="flex-1 grid grid-cols-2 gap-4">
        <span className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>
          {label}
        </span>
        <span className="text-[var(--scolio-text-primary)] font-medium" style={{ fontSize: 'var(--text-body)' }}>
          {value}
        </span>
      </div>
    </div>
  );
}
