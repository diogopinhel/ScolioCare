import React from 'react';
import { Edit, FileText, Download, MapPin, Phone, Mail, Calendar, User, Stethoscope, Plus, FileDown } from 'lucide-react';
import { Button, StatusBadge, Textarea, Toast, ExamCard } from '../../components/scolio';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Dot } from 'recharts';
import { useNavigate, useParams } from 'react-router';

// Mock data for Cobb angle evolution
const cobbAngleData = [
  { date: 'Jan 15', angle: 8.5, examId: '001' },
  { date: 'Apr 12', angle: 10.2, examId: '002' },
  { date: 'Jul 20', angle: 12.8, examId: '003' },
  { date: 'Oct 05', angle: 15.3, examId: '004' },
  { date: 'Jan 18', angle: 16.1, examId: '005' },
  { date: 'Apr 08', angle: 15.7, examId: '006' },
];

type TabKey = 'overview' | 'exams' | 'reports' | 'evolution' | 'notes' | 'feedback' | 'audit';

// Mock exam data
const examsData = [
  { id: '006', date: 'Apr 08, 2026', angle: 15.7, apical: 'T8', status: 'analyzed' as const },
  { id: '005', date: 'Jan 18, 2026', angle: 16.1, apical: 'T8', status: 'analyzed' as const },
  { id: '004', date: 'Oct 05, 2025', angle: 15.3, apical: 'T8', status: 'analyzed' as const },
  { id: '003', date: 'Jul 20, 2025', angle: 12.8, apical: 'T7', status: 'analyzed' as const },
];

// Mock reports data
const reportsData = [
  { id: 1, date: '2026-04-08', type: 'Relatório clínico', status: 'Concluído', doctor: 'Dr. Ana Martins' },
  { id: 2, date: '2026-01-18', type: 'Relatório clínico', status: 'Concluído', doctor: 'Dr. Ana Martins' },
  { id: 3, date: '2025-10-05', type: 'Relatório clínico', status: 'Concluído', doctor: 'Dr. Ana Martins' },
];

// Mock clinical notes
const clinicalNotesData = [
  { id: 1, date: '2026-04-08 15:42', author: 'Dr. Ana Martins', note: 'Paciente apresenta melhoria relativamente ao exame anterior. Ângulo de Cobb diminuiu 0,4 graus. Recomendar continuar com plano de tratamento atual.' },
  { id: 2, date: '2026-01-18 14:20', author: 'Dr. Ana Martins', note: 'Ligeiro agravamento desde último exame. Reforçar fisioterapia e agendar reavaliação em 3 meses.' },
  { id: 3, date: '2025-10-05 16:10', author: 'Dr. Ana Martins', note: 'Evolução positiva. Paciente relata menos dor. Continuar monitorização.' },
];

// Mock wellness feedback
const wellnessFeedbackData = [
  { id: 1, date: '2026-04-07', painLevel: 3, comfort: 7, note: 'Sentindo-me muito melhor depois dos exercícios. A dor reduziu significativamente.' },
  { id: 2, date: '2026-04-01', painLevel: 5, comfort: 5, note: 'Algum desconforto após atividade física intensa.' },
  { id: 3, date: '2026-03-25', painLevel: 4, comfort: 6, note: 'Semana tranquila, mobilidade melhorada.' },
];

// Mock audit logs
const auditLogsData = [
  { id: 1, dateTime: '2026-04-08 15:42:18', user: 'Dr. Ana Martins', action: 'Validação de exame', resource: 'Exame #006', ip: '192.168.1.45' },
  { id: 2, dateTime: '2026-04-08 15:38:05', user: 'Ricardo Sousa', action: 'Upload de exame', resource: 'Exame #006', ip: '192.168.1.52' },
  { id: 3, dateTime: '2026-01-18 14:25:33', user: 'Dr. Ana Martins', action: 'Validação de exame', resource: 'Exame #005', ip: '192.168.1.45' },
];

export default function PatientRecordScreen() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [activeTab, setActiveTab] = React.useState<TabKey>('overview');
  const [showToast, setShowToast] = React.useState(false);
  const [evolutionPeriod, setEvolutionPeriod] = React.useState<'3m' | '6m' | '1y' | 'all'>('all');
  const [newNote, setNewNote] = React.useState('');

  const handleExport = () => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleSaveNote = () => {
    setNewNote('');
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
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

  const handleChartClick = (data: any) => {
    if (data && data.activePayload) {
      // Navigate to exam viewer
      navigate('/exam-viewer');
    }
  };

  return (
    <div className="p-8 space-y-6 overflow-auto h-full">
      {/* Large Header */}
      <div className="bg-white rounded-[var(--radius-card)] shadow-sm border border-[var(--scolio-border-light)] p-6">
        <div className="flex items-start justify-between">
          {/* Patient Info */}
          <div className="flex items-center gap-6">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-full bg-[var(--scolio-primary-blue)] flex items-center justify-center text-white text-3xl font-semibold">
              MS
            </div>
            
            {/* Details */}
            <div className="space-y-2">
              <h1 className="text-[var(--scolio-text-primary)]">Maria Silva</h1>
              <div className="flex items-center gap-6 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>
                <span className="font-medium">ID: PT-2024-0847</span>
                <span>Female</span>
                <span>41 years old</span>
                <StatusBadge status="analyzed" />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={() => navigate(`/patients/${id}/edit`)}>
              <Edit className="w-4 h-4 mr-2" />
              Editar dados
            </Button>
            <Button variant="primary" onClick={() => navigate('/exam-viewer')}>
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

      {/* Tab Navigation */}
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

        {/* Tab Content - Overview */}
        {activeTab === 'overview' && (
          <div className="p-6">
            <div className="grid grid-cols-5 gap-6">
              {/* Left Column - 60% (3 columns) */}
              <div className="col-span-3 space-y-6">
                {/* Demographic Data Section */}
                <section>
                  <h3 className="text-[var(--scolio-text-primary)] mb-4">Dados demográficos</h3>
                  <div className="bg-[var(--scolio-page-surface)] rounded-[var(--radius-component)] p-5 space-y-4">
                    <DataRow
                      icon={MapPin}
                      label="Morada"
                      value="Rua das Flores, 123, 4º Andar, Lisboa, 1200-001"
                    />
                    <DataRow
                      icon={Phone}
                      label="Telefone de contacto"
                      value="+351 912 345 678"
                    />
                    <DataRow
                      icon={Mail}
                      label="Email"
                      value="maria.silva@email.com"
                    />
                    <DataRow
                      icon={FileText}
                      label="Número de seguro"
                      value="123456789"
                    />
                  </div>
                </section>

                {/* Clinical Data Section */}
                <section>
                  <h3 className="text-[var(--scolio-text-primary)] mb-4">Dados clínicos</h3>
                  <div className="bg-[var(--scolio-page-surface)] rounded-[var(--radius-component)] p-5 space-y-4">
                    <DataRow
                      icon={Stethoscope}
                      label="Diagnóstico"
                      value="Escoliose idiopática - curva torácica"
                    />
                    <DataRow
                      icon={User}
                      label="Médico responsável"
                      value="Dr. Ana Martins (Ortopedista)"
                    />
                    <DataRow
                      icon={Calendar}
                      label="Data de início do tratamento"
                      value="15 de janeiro de 2024"
                    />
                  </div>
                </section>

                {/* Cobb Angle Evolution Chart */}
                <section>
                  <h3 className="text-[var(--scolio-text-primary)] mb-4">Evolução do ângulo de Cobb ao longo do tempo</h3>
                  <div className="bg-white border border-[var(--scolio-border-light)] rounded-[var(--radius-component)] p-5">
                    <ResponsiveContainer width="100%" height={320}>
                      <LineChart 
                        data={cobbAngleData}
                        onClick={handleChartClick}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--scolio-border-light)" />
                        <XAxis
                          dataKey="date"
                          tick={{ fill: 'var(--scolio-text-secondary)', fontSize: 13 }}
                          label={{ value: 'Exam dates', position: 'insideBottom', offset: -5, fill: 'var(--scolio-text-secondary)' }}
                        />
                        <YAxis
                          tick={{ fill: 'var(--scolio-text-secondary)', fontSize: 13 }}
                          label={{ value: 'Degrees', angle: -90, position: 'insideLeft', fill: 'var(--scolio-text-secondary)' }}
                          domain={[0, 20]}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid var(--scolio-border-light)',
                            borderRadius: 'var(--radius-component)',
                            fontSize: '13px'
                          }}
                          formatter={(value: any) => [`${value}°`, 'Cobb angle']}
                        />
                        <ReferenceLine
                          y={10}
                          stroke="var(--scolio-warning-amber)"
                          strokeDasharray="5 5"
                          strokeWidth={2}
                        >
                          <text
                            x="50%"
                            y={10}
                            dy={-10}
                            textAnchor="middle"
                            fill="var(--scolio-warning-amber)"
                            fontSize={13}
                            fontWeight={500}
                          >
                            Scoliosis threshold
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
                </section>
              </div>

              {/* Right Column - 40% (2 columns) */}
              <div className="col-span-2 space-y-6">
                {/* Last Exam Summary Card */}
                <section>
                  <h3 className="text-[var(--scolio-text-primary)] mb-4">Last exam summary</h3>
                  <div className="bg-white border border-[var(--scolio-border-light)] rounded-[var(--radius-card)] p-5 space-y-4">
                    {/* Image Thumbnail */}
                    <div className="w-full h-48 bg-black rounded-[var(--radius-component)] overflow-hidden">
                      <img
                        src="https://images.unsplash.com/photo-1728347053156-cf9066af4d9f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWRpY2FsJTIwc3BpbmUlMjB4cmF5fGVufDF8fHx8MTc3NTY2NTYzMHww&ixlib=rb-4.1.0&q=80&w=400"
                        alt="Last exam"
                        className="w-full h-full object-contain"
                      />
                    </div>

                    {/* Metrics */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>
                          Exam date
                        </span>
                        <span className="text-[var(--scolio-text-primary)] font-medium" style={{ fontSize: 'var(--text-body)' }}>
                          April 8, 2026
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>
                          Cobb angle
                        </span>
                        <span className="text-[var(--scolio-text-primary)] font-semibold" style={{ fontSize: 'var(--text-h3)' }}>
                          15.7°
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>
                          Apical vertebra
                        </span>
                        <span className="text-[var(--scolio-text-primary)] font-medium" style={{ fontSize: 'var(--text-body)' }}>
                          T8
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>
                          Status
                        </span>
                        <StatusBadge status="analyzed" />
                      </div>
                    </div>

                    {/* View Exam Link */}
                    <button
                      onClick={() => navigate('/exam-viewer')}
                      className="w-full text-[var(--scolio-primary-blue)] hover:underline text-center"
                      style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)' }}
                    >
                      View exam →
                    </button>
                  </div>
                </section>

                {/* Patient Feedback Summary */}
                <section>
                  <h3 className="text-[var(--scolio-text-primary)] mb-4">Patient feedback summary</h3>
                  <div className="bg-[var(--scolio-success-surface)] border border-[var(--scolio-success-green)] rounded-[var(--radius-card)] p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>
                        Last wellness entry
                      </span>
                      <span className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>
                        April 7, 2026
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>
                        Pain level
                      </p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-3 bg-white rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[var(--scolio-success-green)] rounded-full"
                            style={{ width: '30%' }}
                          />
                        </div>
                        <span className="text-[var(--scolio-success-green)] font-semibold" style={{ fontSize: 'var(--text-h3)' }}>
                          3/10
                        </span>
                      </div>
                    </div>

                    <p className="text-[var(--scolio-text-secondary)] italic" style={{ fontSize: 'var(--text-body)' }}>
                      "Feeling much better after the exercises. Pain has reduced significantly."
                    </p>
                  </div>
                </section>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content - Exams */}
        {activeTab === 'exams' && (
          <div className="p-6 space-y-6">
            <div className="flex justify-end">
              <Button variant="primary" onClick={() => navigate('/exam-viewer')}>
                <Plus className="w-4 h-4 mr-2" />
                Novo exame
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {examsData.map((exam) => (
                <ExamCard
                  key={exam.id}
                  date={exam.date}
                  cobbAngle={exam.angle}
                  apicalVertebra={exam.apical}
                  status={exam.status}
                  onClick={() => navigate('/exam-viewer')}
                />
              ))}
            </div>
          </div>
        )}

        {/* Tab Content - Reports */}
        {activeTab === 'reports' && (
          <div className="p-6">
            <div className="bg-white rounded-[var(--radius-card)] border border-[var(--scolio-border-light)] overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--scolio-border-light)] bg-[var(--scolio-page-surface)]">
                    <th className="text-left p-4 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-medium)' }}>
                      DATA
                    </th>
                    <th className="text-left p-4 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-medium)' }}>
                      TIPO
                    </th>
                    <th className="text-left p-4 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-medium)' }}>
                      ESTADO
                    </th>
                    <th className="text-left p-4 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-medium)' }}>
                      MÉDICO
                    </th>
                    <th className="text-left p-4 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-medium)' }}>
                      AÇÕES
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {reportsData.map((report) => (
                    <tr key={report.id} className="border-b border-[var(--scolio-border-light)] hover:bg-[var(--scolio-page-surface)] transition-colors">
                      <td className="p-4 text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-body)' }}>
                        {new Date(report.date).toLocaleDateString('pt-PT')}
                      </td>
                      <td className="p-4 text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-body)' }}>
                        {report.type}
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-[var(--scolio-success-surface)] text-[var(--scolio-success-green)]" style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-medium)' }}>
                          {report.status}
                        </span>
                      </td>
                      <td className="p-4 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>
                        {report.doctor}
                      </td>
                      <td className="p-4">
                        <button className="flex items-center gap-2 text-[var(--scolio-primary-blue)] hover:underline">
                          <FileDown className="w-4 h-4" />
                          Descarregar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab Content - Evolution */}
        {activeTab === 'evolution' && (
          <div className="p-6 space-y-6">
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setEvolutionPeriod('3m')}
                className={`px-4 py-2 rounded-[var(--radius-component)] transition-colors ${evolutionPeriod === '3m' ? 'bg-[var(--scolio-primary-blue)] text-white' : 'bg-white border border-[var(--scolio-border-light)] text-[var(--scolio-text-secondary)] hover:bg-[var(--scolio-page-surface)]'}`}
              >
                3 meses
              </button>
              <button
                onClick={() => setEvolutionPeriod('6m')}
                className={`px-4 py-2 rounded-[var(--radius-component)] transition-colors ${evolutionPeriod === '6m' ? 'bg-[var(--scolio-primary-blue)] text-white' : 'bg-white border border-[var(--scolio-border-light)] text-[var(--scolio-text-secondary)] hover:bg-[var(--scolio-page-surface)]'}`}
              >
                6 meses
              </button>
              <button
                onClick={() => setEvolutionPeriod('1y')}
                className={`px-4 py-2 rounded-[var(--radius-component)] transition-colors ${evolutionPeriod === '1y' ? 'bg-[var(--scolio-primary-blue)] text-white' : 'bg-white border border-[var(--scolio-border-light)] text-[var(--scolio-text-secondary)] hover:bg-[var(--scolio-page-surface)]'}`}
              >
                1 ano
              </button>
              <button
                onClick={() => setEvolutionPeriod('all')}
                className={`px-4 py-2 rounded-[var(--radius-component)] transition-colors ${evolutionPeriod === 'all' ? 'bg-[var(--scolio-primary-blue)] text-white' : 'bg-white border border-[var(--scolio-border-light)] text-[var(--scolio-text-secondary)] hover:bg-[var(--scolio-page-surface)]'}`}
              >
                Tudo
              </button>
            </div>

            <div className="bg-white border border-[var(--scolio-border-light)] rounded-[var(--radius-card)] p-6">
              <h3 className="text-[var(--scolio-text-primary)] mb-6">Evolução do ângulo de Cobb ao longo do tempo</h3>
              <ResponsiveContainer width="100%" height={480}>
                <LineChart data={cobbAngleData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--scolio-border-light)" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: 'var(--scolio-text-secondary)', fontSize: 13 }}
                    label={{ value: 'Datas dos exames', position: 'insideBottom', offset: -5, fill: 'var(--scolio-text-secondary)' }}
                  />
                  <YAxis
                    tick={{ fill: 'var(--scolio-text-secondary)', fontSize: 13 }}
                    label={{ value: 'Graus', angle: -90, position: 'insideLeft', fill: 'var(--scolio-text-secondary)' }}
                    domain={[0, 20]}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid var(--scolio-border-light)',
                      borderRadius: 'var(--radius-component)',
                      fontSize: '13px'
                    }}
                    formatter={(value: any) => [`${value}°`, 'Ângulo de Cobb']}
                  />
                  <ReferenceLine
                    y={10}
                    stroke="var(--scolio-warning-amber)"
                    strokeDasharray="5 5"
                    strokeWidth={2}
                  >
                    <text
                      x="50%"
                      y={10}
                      dy={-10}
                      textAnchor="middle"
                      fill="var(--scolio-warning-amber)"
                      fontSize={13}
                      fontWeight={500}
                    >
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
          </div>
        )}

        {/* Tab Content - Clinical Notes */}
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
                <Button variant="primary" onClick={handleSaveNote}>
                  Guardar nota
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-[var(--scolio-text-primary)]">Notas anteriores</h3>
              {clinicalNotesData.map((note) => (
                <div key={note.id} className="bg-white rounded-[var(--radius-card)] border border-[var(--scolio-border-light)] p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-[var(--scolio-text-primary)] font-medium" style={{ fontSize: 'var(--text-body)' }}>
                        {note.author}
                      </p>
                      <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>
                        {note.date}
                      </p>
                    </div>
                  </div>
                  <p className="text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-body)', lineHeight: '1.6' }}>
                    {note.note}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab Content - Patient Feedback */}
        {activeTab === 'feedback' && (
          <div className="p-6 space-y-4">
            <h3 className="text-[var(--scolio-text-primary)]">Registos de bem-estar do paciente</h3>
            {wellnessFeedbackData.map((feedback) => (
              <div key={feedback.id} className="bg-white rounded-[var(--radius-card)] border border-[var(--scolio-border-light)] p-5">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>
                    {new Date(feedback.date).toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-[var(--scolio-text-secondary)] mb-2" style={{ fontSize: 'var(--text-caption)' }}>
                      Nível de dor
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-[var(--scolio-page-surface)] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${feedback.painLevel <= 3 ? 'bg-[var(--scolio-success-green)]' : feedback.painLevel <= 6 ? 'bg-[var(--scolio-warning-amber)]' : 'bg-[var(--scolio-danger-coral)]'}`}
                          style={{ width: `${(feedback.painLevel / 10) * 100}%` }}
                        />
                      </div>
                      <span className="text-[var(--scolio-text-primary)] font-semibold" style={{ fontSize: 'var(--text-body)' }}>
                        {feedback.painLevel}/10
                      </span>
                    </div>
                  </div>

                  <div>
                    <p className="text-[var(--scolio-text-secondary)] mb-2" style={{ fontSize: 'var(--text-caption)' }}>
                      Conforto
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-[var(--scolio-page-surface)] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[var(--scolio-primary-blue)] rounded-full"
                          style={{ width: `${(feedback.comfort / 10) * 100}%` }}
                        />
                      </div>
                      <span className="text-[var(--scolio-text-primary)] font-semibold" style={{ fontSize: 'var(--text-body)' }}>
                        {feedback.comfort}/10
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-[var(--scolio-text-secondary)] italic" style={{ fontSize: 'var(--text-body)' }}>
                  "{feedback.note}"
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Tab Content - Audit */}
        {activeTab === 'audit' && (
          <div className="p-6">
            <div className="bg-white rounded-[var(--radius-card)] border border-[var(--scolio-border-light)] overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--scolio-border-light)] bg-[var(--scolio-page-surface)]">
                    <th className="text-left p-4 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-medium)' }}>
                      DATA/HORA
                    </th>
                    <th className="text-left p-4 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-medium)' }}>
                      UTILIZADOR
                    </th>
                    <th className="text-left p-4 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-medium)' }}>
                      AÇÃO
                    </th>
                    <th className="text-left p-4 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-medium)' }}>
                      RECURSO AFETADO
                    </th>
                    <th className="text-left p-4 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-medium)' }}>
                      ENDEREÇO IP
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogsData.map((log) => (
                    <tr key={log.id} className="border-b border-[var(--scolio-border-light)] hover:bg-[var(--scolio-page-surface)] transition-colors">
                      <td className="p-4 text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-body)' }}>
                        {log.dateTime}
                      </td>
                      <td className="p-4 text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-body)' }}>
                        {log.user}
                      </td>
                      <td className="p-4 text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-body)' }}>
                        {log.action}
                      </td>
                      <td className="p-4 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>
                        {log.resource}
                      </td>
                      <td className="p-4 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>
                        {log.ip}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-8 right-8 z-50">
          <Toast
            title="Exportação iniciada..."
            type="success"
            onClose={() => setShowToast(false)}
          />
        </div>
      )}
    </div>
  );
}

// Data Row Component
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