import React from 'react';
import {
  ZoomIn,
  ZoomOut,
  Move,
  RotateCcw,
  Sun,
  Eye,
  EyeOff,
  FileText,
  Download,
  GitCompare,
  Archive,
  Check,
  Edit3
} from 'lucide-react';
import { Button, StatusBadge, Textarea, ProgressBar, Toast, Input } from '../../components/scolio';
import { CobbAngleGauge } from '../../components/scolio';
import { useNavigate } from 'react-router';

// Mock exam images
const examImages = [
  'https://images.unsplash.com/photo-1728347053156-cf9066af4d9f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWRpY2FsJTIwc3BpbmUlMjB4cmF5fGVufDF8fHx8MTc3NTY2NTYzMHww&ixlib=rb-4.1.0&q=80&w=400',
  'https://images.unsplash.com/photo-1728347053156-cf9066af4d9f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWRpY2FsJTIwc3BpbmUlMjB4cmF5fGVufDF8fHx8MTc3NTY2NTYzMHww&ixlib=rb-4.1.0&q=80&w=400',
  'https://images.unsplash.com/photo-1728347053156-cf9066af4d9f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWRpY2FsJTIwc3BpbmUlMjB4cmF5fGVufDF8fHx8MTc3NTY2NTYzMHww&ixlib=rb-4.1.0&q=80&w=400',
];

export default function ExamViewerScreen() {
  const [selectedImage, setSelectedImage] = React.useState(0);
  const [aiOverlay, setAiOverlay] = React.useState(true);
  const [zoom, setZoom] = React.useState(100);
  const [brightness, setBrightness] = React.useState(100);
  const [contrast, setContrast] = React.useState(100);
  const [clinicalNotes, setClinicalNotes] = React.useState(
    'O paciente apresenta melhoria relativamente ao exame anterior. O ângulo de Cobb diminuiu 0,4 graus. Recomenda-se continuar com o plano de tratamento atual.'
  );
  const [metricsConfirmed, setMetricsConfirmed] = React.useState(false);
  const [showMetricsToast, setShowMetricsToast] = React.useState(false);
  const [showNotesToast, setShowNotesToast] = React.useState(false);
  const [showCorrectModal, setShowCorrectModal] = React.useState(false);
  const [showArchiveModal, setShowArchiveModal] = React.useState(false);
  const [correctedAngle, setCorrectedAngle] = React.useState('15.7');
  const [correctedVertebra, setCorrectedVertebra] = React.useState('T8');

  const handleReset = () => {
    setZoom(100);
    setBrightness(100);
    setContrast(100);
  };

  const navigate = useNavigate();

  return (
    <div className="h-full flex bg-[var(--scolio-page-surface)]">
      {/* Left Column - Image Viewer (65%) */}
      <div className="flex-[65] flex flex-col bg-black">
        {/* Clinical Toolbar */}
        <div className="bg-[#1a1a1a] border-b border-gray-800 px-6 py-3">
          <div className="flex items-center justify-between">
            {/* Left Side Tools */}
            <div className="flex items-center gap-4">
              {/* Zoom Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setZoom(Math.max(25, zoom - 25))}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                  title="Zoom out"
                >
                  <ZoomOut className="w-5 h-5" />
                </button>
                <span className="text-white min-w-16 text-center" style={{ fontSize: 'var(--text-body)' }}>
                  {zoom}%
                </span>
                <button
                  onClick={() => setZoom(Math.min(400, zoom + 25))}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                  title="Zoom in"
                >
                  <ZoomIn className="w-5 h-5" />
                </button>
              </div>

              <div className="w-px h-6 bg-gray-700" />

              {/* Pan */}
              <button
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                title="Pan"
              >
                <Move className="w-5 h-5" />
              </button>

              {/* Reset */}
              <button
                onClick={handleReset}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                title="Reset view"
              >
                <RotateCcw className="w-5 h-5" />
              </button>

              <div className="w-px h-6 bg-gray-700" />

              {/* Brightness */}
              <div className="flex items-center gap-3">
                <Sun className="w-4 h-4 text-gray-400" />
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={brightness}
                  onChange={(e) => setBrightness(Number(e.target.value))}
                  className="w-24 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[var(--scolio-primary-blue)]"
                  title="Brightness"
                />
                <span className="text-gray-400 text-xs min-w-8">{brightness}%</span>
              </div>

              {/* Contrast */}
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-gradient-to-r from-gray-600 to-white rounded" />
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={contrast}
                  onChange={(e) => setContrast(Number(e.target.value))}
                  className="w-24 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[var(--scolio-primary-blue)]"
                  title="Contrast"
                />
                <span className="text-gray-400 text-xs min-w-8">{contrast}%</span>
              </div>
            </div>

            {/* AI Overlay Toggle */}
            <button
              onClick={() => setAiOverlay(!aiOverlay)}
              className={`flex items-center gap-2 px-4 py-2 rounded-[var(--radius-component)] transition-colors ${
                aiOverlay
                  ? 'bg-[var(--scolio-primary-blue)] text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {aiOverlay ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              <span style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)' }}>
                AI Overlay {aiOverlay ? 'ON' : 'OFF'}
              </span>
            </button>
          </div>
        </div>

        {/* Image Display Area */}
        <div className="flex-1 flex items-center justify-center p-8 overflow-hidden">
          <div
            className="relative max-w-full max-h-full"
            style={{
              transform: `scale(${zoom / 100})`,
              filter: `brightness(${brightness}%) contrast(${contrast}%)`,
              transition: 'transform 0.2s, filter 0.2s'
            }}
          >
            <img
              src={examImages[selectedImage]}
              alt="Medical spine X-ray"
              className="max-w-full max-h-full object-contain"
            />
            
            {/* AI Overlay - Simulated */}
            {aiOverlay && (
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none"
                style={{ mixBlendMode: 'screen' }}
              >
                {/* Cobb angle lines (simulated) */}
                <line x1="30%" y1="25%" x2="70%" y2="25%" stroke="#1A6FAF" strokeWidth="2" strokeDasharray="5,5" />
                <line x1="25%" y1="65%" x2="75%" y2="65%" stroke="#1A6FAF" strokeWidth="2" strokeDasharray="5,5" />
                <line x1="50%" y1="25%" x2="50%" y2="65%" stroke="#1A6FAF" strokeWidth="3" />
                
                {/* Vertebra labels */}
                <circle cx="50%" cy="30%" r="6" fill="#1D9E75" opacity="0.8" />
                <text x="50%" y="30%" fill="white" fontSize="10" textAnchor="middle" dy="3">T7</text>
                
                <circle cx="50%" cy="45%" r="6" fill="#BA7517" opacity="0.8" />
                <text x="50%" y="45%" fill="white" fontSize="10" textAnchor="middle" dy="3">T8</text>
                
                <circle cx="50%" cy="60%" r="6" fill="#1D9E75" opacity="0.8" />
                <text x="50%" y="60%" fill="white" fontSize="10" textAnchor="middle" dy="3">T9</text>

                {/* Angle measurement */}
                <text x="55%" y="45%" fill="#1A6FAF" fontSize="16" fontWeight="600">15.7°</text>
              </svg>
            )}
          </div>
        </div>

        {/* Thumbnail Strip */}
        <div className="bg-[#1a1a1a] border-t border-gray-800 px-6 py-4">
          <div className="flex gap-3 justify-center">
            {examImages.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedImage(idx)}
                className={`w-20 h-20 rounded border-2 overflow-hidden transition-all ${
                  selectedImage === idx
                    ? 'border-[var(--scolio-primary-blue)] opacity-100'
                    : 'border-gray-700 opacity-50 hover:opacity-75'
                }`}
              >
                <img
                  src={img}
                  alt={`Exam view ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right Column - Information Panel (35%) */}
      <div className="flex-[35] bg-white overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Patient & Exam Header */}
          <div className="pb-4 border-b border-[var(--scolio-border-light)]">
            <h2 className="text-[var(--scolio-text-primary)] mb-1">Maria Silva</h2>
            <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>
              Data do exame: 8 de abril de 2026
            </p>
          </div>

          {/* AI Metrics Section */}
          <section>
            <h3 className="text-[var(--scolio-text-primary)] mb-4">Métricas IA</h3>
            <div className="bg-[var(--scolio-page-surface)] rounded-[var(--radius-card)] p-5 space-y-5">
              {/* Cobb Angle - Large Value + Gauge */}
              <div>
                <p className="text-[var(--scolio-text-secondary)] mb-3" style={{ fontSize: 'var(--text-body)' }}>
                  Ângulo de Cobb
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[var(--scolio-text-primary)] font-semibold mb-1" style={{ fontSize: '48px', lineHeight: '1' }}>
                      15.7°
                    </p>
                    <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>
                      Escoliose moderada
                    </p>
                  </div>
                  <CobbAngleGauge angle={15.7} size={120} />
                </div>
              </div>

              {/* Apical Vertebra */}
              <div className="flex items-center justify-between py-3 border-t border-[var(--scolio-border-light)]">
                <span className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>
                  Vértebra apical
                </span>
                <span className="text-[var(--scolio-text-primary)] font-semibold" style={{ fontSize: 'var(--text-h3)' }}>
                  T8
                </span>
              </div>

              {/* Confidence Score */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>
                    Confiança IA
                  </span>
                  <span className="text-[var(--scolio-success-green)] font-semibold" style={{ fontSize: 'var(--text-body)' }}>
                    94%
                  </span>
                </div>
                <ProgressBar progress={94} showLabel={false} />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-3">
                <Button
                  variant="primary"
                  className="flex-1 bg-[var(--scolio-success-green)] hover:bg-[#188D68]"
                  onClick={() => {
                    setMetricsConfirmed(true);
                    setShowMetricsToast(true);
                    setTimeout(() => setShowMetricsToast(false), 3000);
                  }}
                >
                  <Check className="w-4 h-4 mr-2" />
                  Confirmar métricas IA
                </Button>
                <Button variant="ghost" className="flex-1" onClick={() => setShowCorrectModal(true)}>
                  <Edit3 className="w-4 h-4 mr-2" />
                  Corrigir métricas
                </Button>
              </div>
            </div>
          </section>

          {/* Clinical Notes Section */}
          <section>
            <h3 className="text-[var(--scolio-text-primary)] mb-4">Notas clínicas</h3>
            <div className="space-y-3">
              <Textarea
                value={clinicalNotes}
                onChange={(e) => setClinicalNotes(e.target.value)}
                rows={6}
                placeholder="Introduza observações clínicas..."
              />
              <Button
                variant="primary"
                className="w-full"
                onClick={() => {
                  setShowNotesToast(true);
                  setTimeout(() => setShowNotesToast(false), 3000);
                }}
              >
                Guardar notas
              </Button>
            </div>
          </section>

          {/* Exam Status Section */}
          <section>
            <h3 className="text-[var(--scolio-text-primary)] mb-4">Estado do exame</h3>
            <div className="bg-[var(--scolio-page-surface)] rounded-[var(--radius-card)] p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>
                  Estado actual
                </span>
                <StatusBadge status="analyzed" />
              </div>

              {/* Status History Timeline */}
              <div className="space-y-3 pt-3 border-t border-[var(--scolio-border-light)]">
                <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>
                  Histórico de estados
                </p>
                <div className="space-y-3">
                  <StatusTimelineItem
                    status="Analisado"
                    date="8 abr. 2026"
                    time="15:42"
                    color="var(--scolio-success-green)"
                  />
                  <StatusTimelineItem
                    status="Em análise"
                    date="8 abr. 2026"
                    time="15:38"
                    color="var(--scolio-primary-blue)"
                  />
                  <StatusTimelineItem
                    status="Carregado"
                    date="8 abr. 2026"
                    time="15:35"
                    color="var(--scolio-neutral-gray)"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Footer Action Buttons */}
          <div className="space-y-3 pt-4 border-t border-[var(--scolio-border-light)]">
            <Button variant="primary" className="w-full" onClick={() => navigate('/report-generation')}>
              <FileText className="w-4 h-4 mr-2" />
              Gerar relatório PDF
            </Button>
            <Button variant="secondary" className="w-full" onClick={() => navigate('/exam-comparison')}>
              <GitCompare className="w-4 h-4 mr-2" />
              Comparar com outro exame
            </Button>
            <Button
              variant="ghost"
              className="w-full text-[var(--scolio-danger-coral)] hover:bg-[var(--scolio-danger-surface)]"
              onClick={() => setShowArchiveModal(true)}
            >
              <Archive className="w-4 h-4 mr-2" />
              Arquivar exame
            </Button>
          </div>
        </div>
      </div>

      {/* Correct Metrics Modal */}
      {showCorrectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-[var(--radius-modal)] shadow-lg w-[480px]">
            <div className="p-6 border-b border-[var(--scolio-border-light)]">
              <h2 className="text-[var(--scolio-text-primary)]">Corrigir métricas</h2>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[var(--scolio-text-primary)] mb-2" style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)' }}>
                  Ângulo de Cobb (graus)
                </label>
                <Input
                  type="number"
                  value={correctedAngle}
                  onChange={(e) => setCorrectedAngle(e.target.value)}
                  placeholder="15.7"
                />
              </div>

              <div>
                <label className="block text-[var(--scolio-text-primary)] mb-2" style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)' }}>
                  Vértebra apical
                </label>
                <Input
                  type="text"
                  value={correctedVertebra}
                  onChange={(e) => setCorrectedVertebra(e.target.value)}
                  placeholder="T8"
                />
              </div>
            </div>

            <div className="p-6 border-t border-[var(--scolio-border-light)] flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setShowCorrectModal(false)}>
                Cancelar
              </Button>
              <Button variant="primary" onClick={() => setShowCorrectModal(false)}>
                Guardar correção
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Archive Confirmation Modal */}
      {showArchiveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-[var(--radius-modal)] shadow-lg w-[480px]">
            <div className="p-6 border-b border-[var(--scolio-border-light)]">
              <h2 className="text-[var(--scolio-text-primary)]">Arquivar exame</h2>
            </div>

            <div className="p-6">
              <p className="text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-body)' }}>
                Tem a certeza que pretende arquivar este exame? Esta ação não pode ser desfeita.
              </p>
            </div>

            <div className="p-6 border-t border-[var(--scolio-border-light)] flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setShowArchiveModal(false)}>
                Cancelar
              </Button>
              <Button
                variant="primary"
                className="bg-[var(--scolio-danger-coral)] hover:bg-[#C24D25]"
                onClick={() => setShowArchiveModal(false)}
              >
                Arquivar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      {showMetricsToast && (
        <div className="fixed top-8 right-8 z-50">
          <Toast
            title="Métricas confirmadas com sucesso."
            type="success"
            onClose={() => setShowMetricsToast(false)}
          />
        </div>
      )}

      {showNotesToast && (
        <div className="fixed top-8 right-8 z-50">
          <Toast
            title="Notas clínicas guardadas."
            type="success"
            onClose={() => setShowNotesToast(false)}
          />
        </div>
      )}
    </div>
  );
}

// Status Timeline Item Component
interface StatusTimelineItemProps {
  status: string;
  date: string;
  time: string;
  color: string;
}

function StatusTimelineItem({ status, date, time, color }: StatusTimelineItemProps) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex flex-col items-center">
        <div
          className="w-3 h-3 rounded-full flex-shrink-0 mt-1"
          style={{ backgroundColor: color }}
        />
        <div className="w-0.5 h-full bg-[var(--scolio-border-light)] mt-1" />
      </div>
      <div className="flex-1 pb-2">
        <p className="text-[var(--scolio-text-primary)] font-medium" style={{ fontSize: 'var(--text-body)' }}>
          {status}
        </p>
        <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>
          {date} às {time}
        </p>
      </div>
    </div>
  );
}