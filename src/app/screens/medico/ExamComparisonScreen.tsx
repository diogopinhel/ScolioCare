import React from 'react';
import {
  ZoomIn, ZoomOut, Move, RotateCcw, Eye, EyeOff,
  ChevronDown, ArrowDown, ArrowUp, Bot, Check, X,
  Link as LinkIcon, Unlink, Loader2, ArrowLeft,
} from 'lucide-react';
import { Button, Textarea } from '../../components/scolio';
import { useNavigate, useParams } from 'react-router';
import { getEstudosParaComparacao } from '../../../data/repository/estudos';
import { getPaciente } from '../../../data/repository/pacientes';
import type { EstudoComparacao, PacienteDetalhe } from '../../../data/types';

export default function ExamComparisonScreen() {
  const navigate = useNavigate();
  const { pacienteId } = useParams<{ pacienteId: string }>();

  const [exames, setExames] = React.useState<EstudoComparacao[]>([]);
  const [paciente, setPaciente] = React.useState<PacienteDetalhe | null>(null);
  const [aCarregar, setACarregar] = React.useState(true);

  const [examA, setExamA] = React.useState<EstudoComparacao | null>(null);
  const [examB, setExamB] = React.useState<EstudoComparacao | null>(null);

  const [aiOverlayA, setAiOverlayA] = React.useState(true);
  const [aiOverlayB, setAiOverlayB] = React.useState(true);
  const [zoomA, setZoomA] = React.useState(100);
  const [zoomB, setZoomB] = React.useState(100);
  const [syncViewers, setSyncViewers] = React.useState(false);
  const [assessmentConfirmed, setAssessmentConfirmed] = React.useState(false);
  const [showCustomAssessment, setShowCustomAssessment] = React.useState(false);
  const [customAssessment, setCustomAssessment] = React.useState('');

  React.useEffect(() => {
    if (!pacienteId) { setACarregar(false); return; }

    Promise.all([
      getEstudosParaComparacao(pacienteId),
      getPaciente(pacienteId),
    ]).then(([lista, p]) => {
      setExames(lista);
      setPaciente(p);
      // Pré-seleccionar os dois exames mais recentes
      if (lista.length >= 2) {
        setExamA(lista[1]); // penúltimo
        setExamB(lista[0]); // mais recente
      } else if (lista.length === 1) {
        setExamA(lista[0]);
        setExamB(lista[0]);
      }
    }).finally(() => setACarregar(false));
  }, [pacienteId]);

  const handleZoomA = (v: number) => { setZoomA(v); if (syncViewers) setZoomB(v); };
  const handleZoomB = (v: number) => { setZoomB(v); if (syncViewers) setZoomA(v); };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (aCarregar) {
    return (
      <div className="p-8 flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--scolio-primary-blue)]" />
      </div>
    );
  }

  // ── Sem exames suficientes ───────────────────────────────────────────────
  if (exames.length < 2) {
    return (
      <div className="p-8 space-y-6">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-[var(--scolio-text-secondary)] hover:text-[var(--scolio-text-primary)] transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-[var(--scolio-text-primary)]">Comparação de exames</h1>
        </div>
        <div className="bg-white rounded-[var(--radius-card)] shadow-sm border border-[var(--scolio-border-light)] p-12 text-center">
          <p className="text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-h3)', fontWeight: 'var(--weight-semibold)' }}>
            Exames insuficientes
          </p>
          <p className="text-[var(--scolio-text-secondary)] mt-2" style={{ fontSize: 'var(--text-body)' }}>
            São necessários pelo menos 2 exames com ângulo de Cobb calculado para fazer a comparação.
          </p>
          <Button variant="secondary" className="mt-6" onClick={() => navigate(-1)}>Voltar</Button>
        </div>
      </div>
    );
  }

  if (!examA || !examB) return null;

  const variation = examB.anguloCobb - examA.anguloCobb;
  const isImprovement = variation < 0;

  const nomePaciente = paciente
    ? `${paciente.nomeCompleto}${paciente.numeroUtente ? ` — ${paciente.numeroUtente}` : ''}`
    : '—';

  return (
    <div className="p-8 space-y-6 overflow-auto h-full">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-[var(--scolio-text-secondary)] hover:text-[var(--scolio-text-primary)] transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-[var(--scolio-text-primary)]">Comparação de exames</h1>
            <p className="text-[var(--scolio-text-secondary)] mt-1" style={{ fontSize: 'var(--text-body)' }}>
              {nomePaciente}
            </p>
          </div>
        </div>
        <button
          onClick={() => setSyncViewers(!syncViewers)}
          className={`flex items-center gap-2 px-4 py-2 rounded-[var(--radius-component)] border transition-colors ${
            syncViewers
              ? 'bg-[var(--scolio-light-blue-surface)] border-[var(--scolio-primary-blue)] text-[var(--scolio-primary-blue)]'
              : 'bg-white border-[var(--scolio-border-light)] text-[var(--scolio-text-secondary)] hover:bg-[var(--scolio-page-surface)]'
          }`}
        >
          {syncViewers ? <LinkIcon className="w-4 h-4" /> : <Unlink className="w-4 h-4" />}
          <span style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)' }}>
            {syncViewers ? 'Visualizadores sincronizados' : 'Sincronizar visualizadores'}
          </span>
        </button>
      </div>

      {/* Layout de 3 colunas */}
      <div className="grid grid-cols-10 gap-6">
        {/* Exame A */}
        <div className="col-span-4 bg-white rounded-[var(--radius-card)] shadow-sm border border-[var(--scolio-border-light)] overflow-hidden">
          <ExamViewer
            label="Exame A (anterior)"
            exam={examA}
            examsList={exames}
            onExamChange={setExamA}
            aiOverlay={aiOverlayA}
            onAiOverlayToggle={() => setAiOverlayA(!aiOverlayA)}
            zoom={zoomA}
            onZoomChange={handleZoomA}
            onReset={() => { setZoomA(100); if (syncViewers) setZoomB(100); }}
          />
        </div>

        {/* Coluna central — evolução */}
        <div className="col-span-2 space-y-4">
          <div className="bg-white rounded-[var(--radius-card)] shadow-sm border border-[var(--scolio-border-light)] p-6">
            <h3 className="text-[var(--scolio-text-primary)] text-center mb-6">Evolução</h3>
            <div className="flex flex-col items-center gap-4">
              {isImprovement
                ? <ArrowDown className="w-20 h-20 text-[var(--scolio-success-green)]" strokeWidth={2.5} />
                : <ArrowUp className="w-20 h-20 text-[var(--scolio-danger-coral)]" strokeWidth={2.5} />}
              <div className="text-center">
                <p
                  className={isImprovement ? 'text-[var(--scolio-success-green)]' : 'text-[var(--scolio-danger-coral)]'}
                  style={{ fontSize: '32px', fontWeight: 'var(--weight-semibold)', lineHeight: '1' }}
                >
                  {variation > 0 ? '+' : ''}{variation.toFixed(1)}°
                </p>
                <p className="text-[var(--scolio-text-secondary)] mt-2" style={{ fontSize: 'var(--text-caption)' }}>
                  {isImprovement ? 'Melhoria' : 'Agravamento'}
                </p>
              </div>
            </div>
          </div>

          {/* Sugestão IA */}
          <div className="bg-[var(--scolio-light-blue-surface)] rounded-[var(--radius-card)] border border-[var(--scolio-primary-blue)] p-5">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-8 h-8 bg-[var(--scolio-primary-blue)] rounded-full flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <p className="text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-body)' }}>
                Variação de {variation > 0 ? '+' : ''}{variation.toFixed(1)}° no ângulo de Cobb entre os dois exames selecionados.
              </p>
            </div>

            {!assessmentConfirmed && !showCustomAssessment && (
              <div className="space-y-2">
                <Button variant="primary" className="w-full text-sm py-2" onClick={() => setAssessmentConfirmed(true)}>
                  <Check className="w-4 h-4 mr-2" />Confirmar avaliação
                </Button>
                <Button variant="ghost" className="w-full text-sm py-2" onClick={() => setShowCustomAssessment(true)}>
                  <X className="w-4 h-4 mr-2" />Escrever avaliação própria
                </Button>
              </div>
            )}
            {assessmentConfirmed && (
              <div className="flex items-center gap-2 p-3 bg-[var(--scolio-success-surface)] border border-[var(--scolio-success-green)] rounded-[var(--radius-component)]">
                <Check className="w-5 h-5 text-[var(--scolio-success-green)]" />
                <p className="text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-caption)' }}>
                  Avaliação confirmada em {new Date().toLocaleString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
            )}
            {showCustomAssessment && (
              <div className="space-y-3">
                <Textarea value={customAssessment} onChange={(e) => setCustomAssessment(e.target.value)} rows={4} placeholder="Escreva a sua avaliação clínica..." />
                <Button variant="primary" className="w-full text-sm py-2" onClick={() => setShowCustomAssessment(false)}>
                  Guardar avaliação
                </Button>
              </div>
            )}
          </div>

          {/* Tabela comparativa */}
          <div className="bg-white rounded-[var(--radius-card)] shadow-sm border border-[var(--scolio-border-light)] overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-[var(--scolio-page-surface)] border-b border-[var(--scolio-border-light)]">
                  <th className="text-left px-3 py-2 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-semibold)' }}>MÉTRICA</th>
                  <th className="text-center px-2 py-2 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-semibold)' }}>A</th>
                  <th className="text-center px-2 py-2 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-semibold)' }}>B</th>
                  <th className="text-center px-2 py-2 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-semibold)' }}>Δ</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-[var(--scolio-border-light)]">
                  <td className="px-3 py-3 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>Ângulo de Cobb</td>
                  <td className="px-2 py-3 text-center text-[var(--scolio-text-primary)] font-medium" style={{ fontSize: 'var(--text-caption)' }}>{examA.anguloCobb.toFixed(1)}°</td>
                  <td className="px-2 py-3 text-center text-[var(--scolio-text-primary)] font-medium" style={{ fontSize: 'var(--text-caption)' }}>{examB.anguloCobb.toFixed(1)}°</td>
                  <td className={`px-2 py-3 text-center font-semibold ${isImprovement ? 'text-[var(--scolio-success-green)]' : 'text-[var(--scolio-danger-coral)]'}`} style={{ fontSize: 'var(--text-caption)' }}>
                    {variation > 0 ? '+' : ''}{variation.toFixed(1)}°
                  </td>
                </tr>
                <tr className="border-b border-[var(--scolio-border-light)]">
                  <td className="px-3 py-3 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>Vértebra apical</td>
                  <td className="px-2 py-3 text-center text-[var(--scolio-text-primary)] font-medium" style={{ fontSize: 'var(--text-caption)' }}>{examA.nivelVertebras ?? '—'}</td>
                  <td className="px-2 py-3 text-center text-[var(--scolio-text-primary)] font-medium" style={{ fontSize: 'var(--text-caption)' }}>{examB.nivelVertebras ?? '—'}</td>
                  <td className="px-2 py-3 text-center text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>
                    {examA.nivelVertebras === examB.nivelVertebras ? '—' : '≠'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Exame B */}
        <div className="col-span-4 bg-white rounded-[var(--radius-card)] shadow-sm border border-[var(--scolio-border-light)] overflow-hidden">
          <ExamViewer
            label="Exame B (actual)"
            exam={examB}
            examsList={exames}
            onExamChange={setExamB}
            aiOverlay={aiOverlayB}
            onAiOverlayToggle={() => setAiOverlayB(!aiOverlayB)}
            zoom={zoomB}
            onZoomChange={handleZoomB}
            onReset={() => { setZoomB(100); if (syncViewers) setZoomA(100); }}
          />
        </div>
      </div>
    </div>
  );
}

// ── Sub-componente: visualizador de um exame ─────────────────────────────────

interface ExamViewerProps {
  label: string;
  exam: EstudoComparacao;
  examsList: EstudoComparacao[];
  onExamChange: (e: EstudoComparacao) => void;
  aiOverlay: boolean;
  onAiOverlayToggle: () => void;
  zoom: number;
  onZoomChange: (z: number) => void;
  onReset: () => void;
}

function ExamViewer({ label, exam, examsList, onExamChange, aiOverlay, onAiOverlayToggle, zoom, onZoomChange, onReset }: ExamViewerProps) {
  const dataFormatada = new Date(exam.dataEstudo).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="flex flex-col h-full">
      {/* Cabeçalho + selector */}
      <div className="p-4 border-b border-[var(--scolio-border-light)]">
        <h3 className="text-[var(--scolio-text-primary)] mb-3">{label}</h3>
        <div className="relative">
          <select
            value={exam.id}
            onChange={(e) => {
              const sel = examsList.find((ex) => ex.id === e.target.value);
              if (sel) onExamChange(sel);
            }}
            className="w-full px-3 py-2 pr-10 border border-[var(--scolio-border-light)] rounded-[var(--radius-component)] focus:outline-none focus:ring-2 focus:ring-[var(--scolio-primary-blue)] appearance-none"
          >
            {examsList.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {new Date(ex.dataEstudo).toLocaleDateString('pt-PT')} — {ex.anguloCobb.toFixed(1)}°
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--scolio-neutral-gray)] pointer-events-none" />
        </div>
        {/* Thumbnail */}
        <div className="mt-3 w-full h-16 bg-black rounded overflow-hidden">
          {exam.urlImagem
            ? <img src={exam.urlImagem} alt={`Exame ${dataFormatada}`} className="w-full h-full object-cover opacity-70" />
            : <div className="w-full h-full flex items-center justify-center text-[var(--scolio-neutral-gray)]" style={{ fontSize: 'var(--text-caption)' }}>Sem imagem</div>
          }
        </div>
      </div>

      {/* Barra de ferramentas */}
      <div className="px-4 py-3 bg-[var(--scolio-page-surface)] border-b border-[var(--scolio-border-light)]">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button onClick={() => onZoomChange(Math.max(25, zoom - 25))} className="p-1.5 text-[var(--scolio-text-secondary)] hover:text-[var(--scolio-primary-blue)] hover:bg-white rounded transition-colors">
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-[var(--scolio-text-primary)] text-xs min-w-12 text-center">{zoom}%</span>
            <button onClick={() => onZoomChange(Math.min(400, zoom + 25))} className="p-1.5 text-[var(--scolio-text-secondary)] hover:text-[var(--scolio-primary-blue)] hover:bg-white rounded transition-colors">
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-1">
            <button className="p-1.5 text-[var(--scolio-text-secondary)] hover:text-[var(--scolio-primary-blue)] hover:bg-white rounded transition-colors">
              <Move className="w-4 h-4" />
            </button>
            <button onClick={onReset} className="p-1.5 text-[var(--scolio-text-secondary)] hover:text-[var(--scolio-primary-blue)] hover:bg-white rounded transition-colors">
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={onAiOverlayToggle}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded transition-colors ${aiOverlay ? 'bg-[var(--scolio-primary-blue)] text-white' : 'bg-white text-[var(--scolio-text-secondary)] hover:bg-[var(--scolio-light-blue-surface)]'}`}
          >
            {aiOverlay ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span className="text-xs font-medium">IA</span>
          </button>
        </div>
      </div>

      {/* Imagem */}
      <div className="flex-1 bg-black flex items-center justify-center p-4 min-h-[300px]">
        {exam.urlImagem ? (
          <div className="relative max-w-full max-h-full" style={{ transform: `scale(${zoom / 100})`, transition: 'transform 0.2s' }}>
            <img src={exam.urlImagem} alt={`Exame ${dataFormatada}`} className="max-w-full max-h-full object-contain" />
            {aiOverlay && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ mixBlendMode: 'screen' }}>
                <line x1="30%" y1="25%" x2="70%" y2="25%" stroke="#1A6FAF" strokeWidth="2" strokeDasharray="5,5" />
                <line x1="25%" y1="65%" x2="75%" y2="65%" stroke="#1A6FAF" strokeWidth="2" strokeDasharray="5,5" />
                <text x="55%" y="45%" fill="#1A6FAF" fontSize="14" fontWeight="600">{exam.anguloCobb.toFixed(1)}°</text>
              </svg>
            )}
          </div>
        ) : (
          <p className="text-[var(--scolio-neutral-gray)]" style={{ fontSize: 'var(--text-body)' }}>Sem imagem disponível</p>
        )}
      </div>

      {/* Métricas */}
      <div className="p-4 bg-[var(--scolio-page-surface)] border-t border-[var(--scolio-border-light)] space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>Ângulo de Cobb</span>
          <span className="text-[var(--scolio-text-primary)] font-semibold" style={{ fontSize: 'var(--text-h3)' }}>{exam.anguloCobb.toFixed(1)}°</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>Vértebra apical</span>
          <span className="text-[var(--scolio-text-primary)] font-medium" style={{ fontSize: 'var(--text-body)' }}>{exam.nivelVertebras ?? '—'}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>Data</span>
          <span className="text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-body)' }}>{dataFormatada}</span>
        </div>
      </div>
    </div>
  );
}
