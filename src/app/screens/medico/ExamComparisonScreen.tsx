import React from 'react';
import {
  ZoomIn,
  ZoomOut,
  Move,
  RotateCcw,
  Eye,
  EyeOff,
  ChevronDown,
  ArrowDown,
  ArrowUp,
  Bot,
  Check,
  X,
  Link as LinkIcon,
  Unlink
} from 'lucide-react';
import { Button, StatusBadge, Textarea } from '../../components/scolio';
import { CobbAngleGauge } from '../../components/scolio';

// Mock exam data
const examsList = [
  { id: '006', date: 'Apr 08, 2026', angle: 15.7, apical: 'T8', thumbnail: 'https://images.unsplash.com/photo-1728347053156-cf9066af4d9f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWRpY2FsJTIwc3BpbmUlMjB4cmF5fGVufDF8fHx8MTc3NTY2NTYzMHww&ixlib=rb-4.1.0&q=80&w=400' },
  { id: '005', date: 'Jan 18, 2026', angle: 16.1, apical: 'T8', thumbnail: 'https://images.unsplash.com/photo-1728347053156-cf9066af4d9f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWRpY2FsJTIwc3BpbmUlMjB4cmF5fGVufDF8fHx8MTc3NTY2NTYzMHww&ixlib=rb-4.1.0&q=80&w=400' },
  { id: '004', date: 'Oct 05, 2025', angle: 15.3, apical: 'T8', thumbnail: 'https://images.unsplash.com/photo-1728347053156-cf9066af4d9f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWRpY2FsJTIwc3BpbmUlMjB4cmF5fGVufDF8fHx8MTc3NTY2NTYzMHww&ixlib=rb-4.1.0&q=80&w=400' },
  { id: '003', date: 'Jul 20, 2025', angle: 12.8, apical: 'T7', thumbnail: 'https://images.unsplash.com/photo-1728347053156-cf9066af4d9f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWRpY2FsJTIwc3BpbmUlMjB4cmF5fGVufDF8fHx8MTc3NTY2NTYzMHww&ixlib=rb-4.1.0&q=80&w=400' },
];

export default function ExamComparisonScreen() {
  const [examA, setExamA] = React.useState(examsList[1]); // Jan 18, 2026
  const [examB, setExamB] = React.useState(examsList[0]); // Apr 08, 2026
  const [aiOverlayA, setAiOverlayA] = React.useState(true);
  const [aiOverlayB, setAiOverlayB] = React.useState(true);
  const [zoomA, setZoomA] = React.useState(100);
  const [zoomB, setZoomB] = React.useState(100);
  const [syncViewers, setSyncViewers] = React.useState(false);
  const [assessmentConfirmed, setAssessmentConfirmed] = React.useState(false);
  const [showCustomAssessment, setShowCustomAssessment] = React.useState(false);
  const [customAssessment, setCustomAssessment] = React.useState('');

  // Calculate evolution
  const variation = examB.angle - examA.angle;
  const isImprovement = variation < 0;

  const handleZoomA = (newZoom: number) => {
    setZoomA(newZoom);
    if (syncViewers) setZoomB(newZoom);
  };

  const handleZoomB = (newZoom: number) => {
    setZoomB(newZoom);
    if (syncViewers) setZoomA(newZoom);
  };

  const handleResetA = () => {
    setZoomA(100);
    if (syncViewers) setZoomB(100);
  };

  const handleResetB = () => {
    setZoomB(100);
    if (syncViewers) setZoomA(100);
  };

  return (
    <div className="p-8 space-y-6 overflow-auto h-full">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[var(--scolio-text-primary)]">Comparação de exames</h1>
          <p className="text-[var(--scolio-text-secondary)] mt-1" style={{ fontSize: 'var(--text-body)' }}>
            Maria Silva - PT-2024-0847
          </p>
        </div>
        
        {/* Sync Toggle */}
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

      {/* Three-Column Layout */}
      <div className="grid grid-cols-10 gap-6">
        {/* Left Column - Exam A (40%) */}
        <div className="col-span-4 bg-white rounded-[var(--radius-card)] shadow-sm border border-[var(--scolio-border-light)] overflow-hidden">
          <ExamViewer
            label="Exam A"
            exam={examA}
            examsList={examsList}
            onExamChange={setExamA}
            aiOverlay={aiOverlayA}
            onAiOverlayToggle={() => setAiOverlayA(!aiOverlayA)}
            zoom={zoomA}
            onZoomChange={handleZoomA}
            onReset={handleResetA}
          />
        </div>

        {/* Center Column - Evolution Analysis (20%) */}
        <div className="col-span-2 space-y-4">
          {/* Evolution Header */}
          <div className="bg-white rounded-[var(--radius-card)] shadow-sm border border-[var(--scolio-border-light)] p-6">
            <h3 className="text-[var(--scolio-text-primary)] text-center mb-6">Evolução</h3>
            
            {/* Large Arrow with Variation */}
            <div className="flex flex-col items-center gap-4">
              {isImprovement ? (
                <ArrowDown className="w-20 h-20 text-[var(--scolio-success-green)]" strokeWidth={2.5} />
              ) : (
                <ArrowUp className="w-20 h-20 text-[var(--scolio-danger-coral)]" strokeWidth={2.5} />
              )}
              
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

          {/* AI Suggestion Card */}
          <div className="bg-[var(--scolio-light-blue-surface)] rounded-[var(--radius-card)] border border-[var(--scolio-primary-blue)] p-5">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-8 h-8 bg-[var(--scolio-primary-blue)] rounded-full flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-body)' }}>
                  A IA sugere uma evolução {isImprovement ? 'positiva' : 'negativa'} baseada numa variação de {variation > 0 ? '+' : ''}{variation.toFixed(1)}° no ângulo de Cobb.
                </p>
              </div>
            </div>

            {!assessmentConfirmed && !showCustomAssessment && (
              <div className="space-y-2">
                <Button
                  variant="primary"
                  className="w-full text-sm py-2"
                  onClick={() => setAssessmentConfirmed(true)}
                >
                  <Check className="w-4 h-4 mr-2" />
                  Confirmar avaliação IA
                </Button>
                <Button
                  variant="ghost"
                  className="w-full text-sm py-2"
                  onClick={() => setShowCustomAssessment(true)}
                >
                  <X className="w-4 h-4 mr-2" />
                  Rejeitar e escrever avaliação própria
                </Button>
              </div>
            )}

            {assessmentConfirmed && (
              <div className="flex items-center gap-2 p-3 bg-[var(--scolio-success-surface)] border border-[var(--scolio-success-green)] rounded-[var(--radius-component)]">
                <Check className="w-5 h-5 text-[var(--scolio-success-green)]" />
                <div className="flex-1">
                  <p className="text-[var(--scolio-text-primary)] font-medium" style={{ fontSize: 'var(--text-caption)' }}>
                    Avaliação confirmada
                  </p>
                  <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>
                    {new Date().toLocaleString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            )}

            {showCustomAssessment && (
              <div className="space-y-3">
                <Textarea
                  value={customAssessment}
                  onChange={(e) => setCustomAssessment(e.target.value)}
                  rows={4}
                  placeholder="Escreva a sua avaliação clínica..."
                />
                <Button
                  variant="primary"
                  className="w-full text-sm py-2"
                  onClick={() => setShowCustomAssessment(false)}
                >
                  Guardar avaliação própria
                </Button>
              </div>
            )}
          </div>

          {/* Comparison Table */}
          <div className="bg-white rounded-[var(--radius-card)] shadow-sm border border-[var(--scolio-border-light)] overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-[var(--scolio-page-surface)] border-b border-[var(--scolio-border-light)]">
                  <th className="text-left px-3 py-2 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-semibold)' }}>
                    MÉTRICA
                  </th>
                  <th className="text-center px-2 py-2 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-semibold)' }}>
                    A
                  </th>
                  <th className="text-center px-2 py-2 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-semibold)' }}>
                    B
                  </th>
                  <th className="text-center px-2 py-2 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-semibold)' }}>
                    Δ
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-[var(--scolio-border-light)]">
                  <td className="px-3 py-3 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>
                    Ângulo de Cobb
                  </td>
                  <td className="px-2 py-3 text-center text-[var(--scolio-text-primary)] font-medium" style={{ fontSize: 'var(--text-caption)' }}>
                    {examA.angle}°
                  </td>
                  <td className="px-2 py-3 text-center text-[var(--scolio-text-primary)] font-medium" style={{ fontSize: 'var(--text-caption)' }}>
                    {examB.angle}°
                  </td>
                  <td
                    className={`px-2 py-3 text-center font-semibold ${
                      isImprovement ? 'text-[var(--scolio-success-green)]' : 'text-[var(--scolio-danger-coral)]'
                    }`}
                    style={{ fontSize: 'var(--text-caption)' }}
                  >
                    {variation > 0 ? '+' : ''}{variation.toFixed(1)}°
                  </td>
                </tr>
                <tr className="border-b border-[var(--scolio-border-light)]">
                  <td className="px-3 py-3 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>
                    Vértebra apical
                  </td>
                  <td className="px-2 py-3 text-center text-[var(--scolio-text-primary)] font-medium" style={{ fontSize: 'var(--text-caption)' }}>
                    {examA.apical}
                  </td>
                  <td className="px-2 py-3 text-center text-[var(--scolio-text-primary)] font-medium" style={{ fontSize: 'var(--text-caption)' }}>
                    {examB.apical}
                  </td>
                  <td className="px-2 py-3 text-center text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>
                    {examA.apical === examB.apical ? '—' : '≠'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column - Exam B (40%) */}
        <div className="col-span-4 bg-white rounded-[var(--radius-card)] shadow-sm border border-[var(--scolio-border-light)] overflow-hidden">
          <ExamViewer
            label="Exam B"
            exam={examB}
            examsList={examsList}
            onExamChange={setExamB}
            aiOverlay={aiOverlayB}
            onAiOverlayToggle={() => setAiOverlayB(!aiOverlayB)}
            zoom={zoomB}
            onZoomChange={handleZoomB}
            onReset={handleResetB}
          />
        </div>
      </div>
    </div>
  );
}

// Exam Viewer Component
interface ExamViewerProps {
  label: string;
  exam: typeof examsList[0];
  examsList: typeof examsList;
  onExamChange: (exam: typeof examsList[0]) => void;
  aiOverlay: boolean;
  onAiOverlayToggle: () => void;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  onReset: () => void;
}

function ExamViewer({
  label,
  exam,
  examsList,
  onExamChange,
  aiOverlay,
  onAiOverlayToggle,
  zoom,
  onZoomChange,
  onReset
}: ExamViewerProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Header with Selector */}
      <div className="p-4 border-b border-[var(--scolio-border-light)]">
        <h3 className="text-[var(--scolio-text-primary)] mb-3">{label}</h3>
        
        {/* Exam Selector Dropdown */}
        <div className="relative">
          <select
            value={exam.id}
            onChange={(e) => {
              const selected = examsList.find(ex => ex.id === e.target.value);
              if (selected) onExamChange(selected);
            }}
            className="w-full px-3 py-2 pr-10 border border-[var(--scolio-border-light)] rounded-[var(--radius-component)] focus:outline-none focus:ring-2 focus:ring-[var(--scolio-primary-blue)] focus:border-transparent appearance-none"
          >
            {examsList.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.date} - {ex.angle}°
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--scolio-neutral-gray)] pointer-events-none" />
        </div>

        {/* Thumbnail */}
        <div className="mt-3 w-full h-16 bg-black rounded overflow-hidden">
          <img
            src={exam.thumbnail}
            alt={`Exam ${exam.date}`}
            className="w-full h-full object-cover opacity-70"
          />
        </div>
      </div>

      {/* Toolbar */}
      <div className="px-4 py-3 bg-[var(--scolio-page-surface)] border-b border-[var(--scolio-border-light)]">
        <div className="flex items-center justify-between gap-2">
          {/* Zoom Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onZoomChange(Math.max(25, zoom - 25))}
              className="p-1.5 text-[var(--scolio-text-secondary)] hover:text-[var(--scolio-primary-blue)] hover:bg-white rounded transition-colors"
              title="Zoom out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-[var(--scolio-text-primary)] text-xs min-w-12 text-center">
              {zoom}%
            </span>
            <button
              onClick={() => onZoomChange(Math.min(400, zoom + 25))}
              className="p-1.5 text-[var(--scolio-text-secondary)] hover:text-[var(--scolio-primary-blue)] hover:bg-white rounded transition-colors"
              title="Zoom in"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          {/* Pan & Reset */}
          <div className="flex items-center gap-1">
            <button
              className="p-1.5 text-[var(--scolio-text-secondary)] hover:text-[var(--scolio-primary-blue)] hover:bg-white rounded transition-colors"
              title="Pan"
            >
              <Move className="w-4 h-4" />
            </button>
            <button
              onClick={onReset}
              className="p-1.5 text-[var(--scolio-text-secondary)] hover:text-[var(--scolio-primary-blue)] hover:bg-white rounded transition-colors"
              title="Reset"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* AI Overlay Toggle */}
          <button
            onClick={onAiOverlayToggle}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded transition-colors ${
              aiOverlay
                ? 'bg-[var(--scolio-primary-blue)] text-white'
                : 'bg-white text-[var(--scolio-text-secondary)] hover:bg-[var(--scolio-light-blue-surface)]'
            }`}
          >
            {aiOverlay ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span className="text-xs font-medium">AI</span>
          </button>
        </div>
      </div>

      {/* Image Viewer */}
      <div className="flex-1 bg-black flex items-center justify-center p-4 min-h-[300px]">
        <div
          className="relative max-w-full max-h-full"
          style={{
            transform: `scale(${zoom / 100})`,
            transition: 'transform 0.2s'
          }}
        >
          <img
            src={exam.thumbnail}
            alt={`Exam ${exam.date}`}
            className="max-w-full max-h-full object-contain"
          />
          
          {/* AI Overlay - Simulated */}
          {aiOverlay && (
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{ mixBlendMode: 'screen' }}
            >
              <line x1="30%" y1="25%" x2="70%" y2="25%" stroke="#1A6FAF" strokeWidth="2" strokeDasharray="5,5" />
              <line x1="25%" y1="65%" x2="75%" y2="65%" stroke="#1A6FAF" strokeWidth="2" strokeDasharray="5,5" />
              <circle cx="50%" cy="45%" r="4" fill="#BA7517" opacity="0.8" />
              <text x="55%" y="45%" fill="#1A6FAF" fontSize="14" fontWeight="600">{exam.angle}°</text>
            </svg>
          )}
        </div>
      </div>

      {/* Metrics */}
      <div className="p-4 bg-[var(--scolio-page-surface)] border-t border-[var(--scolio-border-light)] space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>
            Ângulo de Cobb
          </span>
          <span className="text-[var(--scolio-text-primary)] font-semibold" style={{ fontSize: 'var(--text-h3)' }}>
            {exam.angle}°
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>
            Vértebra apical
          </span>
          <span className="text-[var(--scolio-text-primary)] font-medium" style={{ fontSize: 'var(--text-body)' }}>
            {exam.apical}
          </span>
        </div>
      </div>
    </div>
  );
}