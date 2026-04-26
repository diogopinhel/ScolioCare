import React from 'react';
import { ArrowLeft, Download, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '../../components/scolio';
import { CobbAngleGauge } from '../../components/scolio';
import { useNavigate } from 'react-router';

export default function ExamDetailScreen() {
  const navigate = useNavigate();
  const [showAIAnalysis, setShowAIAnalysis] = React.useState(false);
  const [zoom, setZoom] = React.useState(1);
  const [position, setPosition] = React.useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragStart, setDragStart] = React.useState({ x: 0, y: 0 });
  const [showDownloadModal, setShowDownloadModal] = React.useState(false);

  const cobbAngle = 15.2;
  const apicalVertebra = 'T8';
  const doctorName = 'Dr. Ana Martins';
  const validationDate = 'April 8, 2026';

  const getSeverityText = (angle: number) => {
    if (angle < 10) return 'normal spinal alignment';
    if (angle < 25) return 'mild spinal curvature';
    if (angle < 40) return 'moderate spinal curvature';
    return 'severe spinal curvature';
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y,
      });
    } else if (e.touches.length === 2) {
      // Pinch to zoom gesture (simplified)
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      (e.currentTarget as any).lastDistance = distance;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isDragging && zoom > 1) {
      setPosition({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y,
      });
    } else if (e.touches.length === 2) {
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const lastDistance = (e.currentTarget as any).lastDistance;
      if (lastDistance) {
        const delta = distance - lastDistance;
        setZoom((prev) => Math.max(1, Math.min(3, prev + delta * 0.01)));
      }
      (e.currentTarget as any).lastDistance = distance;
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  return (
    <div className="h-screen w-screen max-w-[390px] mx-auto bg-white flex flex-col overflow-hidden">
      {/* Status Bar Safe Area */}
      <div className="h-11 bg-white" />

      {/* Header */}
      <div className="bg-white px-4 py-3 border-b border-[var(--scolio-border-light)] flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <button onClick={() => navigate('/mobile/exams')} className="p-1 -ml-1">
            <ArrowLeft className="w-6 h-6 text-[var(--scolio-text-primary)]" />
          </button>
          <h3 className="text-[var(--scolio-text-primary)]">Exam — Apr 08, 2026</h3>
        </div>
        <button className="p-2 -mr-2">
          <Download className="w-5 h-5 text-[var(--scolio-primary-blue)]" />
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Image Viewer */}
        <div className="relative bg-black" style={{ aspectRatio: '4/3' }}>
          <div
            className="w-full h-full overflow-hidden touch-none"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div
              className="w-full h-full flex items-center justify-center transition-transform"
              style={{
                transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
              }}
            >
              <img
                src="https://images.unsplash.com/photo-1728347053156-cf9066af4d9f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWRpY2FsJTIwc3BpbmUlMjB4cmF5fGVufDF8fHx8MTc3NTY2NTYzMHww&ixlib=rb-4.1.0&q=80&w=400"
                alt="Medical exam"
                className="max-w-full max-h-full object-contain select-none"
                draggable={false}
              />
              
              {/* AI Overlay */}
              {showAIAnalysis && (
                <svg
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  style={{ mixBlendMode: 'screen' }}
                >
                  <line x1="30%" y1="25%" x2="70%" y2="25%" stroke="#1A6FAF" strokeWidth="2" strokeDasharray="5,5" />
                  <line x1="25%" y1="65%" x2="75%" y2="65%" stroke="#1A6FAF" strokeWidth="2" strokeDasharray="5,5" />
                  <circle cx="50%" cy="30%" r="6" fill="#1D9E75" opacity="0.8" />
                  <text x="50%" y="30%" fill="white" fontSize="10" textAnchor="middle" dy="3">T7</text>
                  <circle cx="50%" cy="45%" r="6" fill="#BA7517" opacity="0.8" />
                  <text x="50%" y="45%" fill="white" fontSize="10" textAnchor="middle" dy="3">T8</text>
                  <circle cx="50%" cy="60%" r="6" fill="#1D9E75" opacity="0.8" />
                  <text x="50%" y="60%" fill="white" fontSize="10" textAnchor="middle" dy="3">T9</text>
                  <text x="55%" y="45%" fill="#1A6FAF" fontSize="16" fontWeight="600">{cobbAngle}°</text>
                </svg>
              )}
            </div>
          </div>

          {/* Zoom Controls Overlay */}
          <div className="absolute bottom-4 right-4 flex flex-col gap-2">
            <button
              onClick={() => setZoom((z) => Math.min(3, z + 0.5))}
              className="w-10 h-10 bg-black/70 backdrop-blur-sm text-white rounded-full flex items-center justify-center"
            >
              <ZoomIn className="w-5 h-5" />
            </button>
            <button
              onClick={() => {
                setZoom((z) => Math.max(1, z - 0.5));
                if (zoom <= 1.5) setPosition({ x: 0, y: 0 });
              }}
              className="w-10 h-10 bg-black/70 backdrop-blur-sm text-white rounded-full flex items-center justify-center"
            >
              <ZoomOut className="w-5 h-5" />
            </button>
          </div>

          {/* AI Analysis Toggle Pill */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2">
            <button
              onClick={() => setShowAIAnalysis(!showAIAnalysis)}
              className={`px-4 py-2 rounded-full backdrop-blur-sm transition-colors ${
                showAIAnalysis
                  ? 'bg-[var(--scolio-primary-blue)] text-white'
                  : 'bg-black/70 text-white'
              }`}
              style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)' }}
            >
              View AI analysis
            </button>
          </div>
        </div>

        {/* Metrics Section */}
        <div className="px-6 py-6 bg-white">
          <h3 className="text-[var(--scolio-text-primary)] mb-4">Metrics</h3>
          
          <div className="bg-[var(--scolio-page-surface)] rounded-[var(--radius-card)] p-5 mb-4">
            {/* Cobb Angle */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-[var(--scolio-text-secondary)] mb-2" style={{ fontSize: 'var(--text-caption)' }}>
                  Cobb angle
                </p>
                <p className="text-[var(--scolio-text-primary)] font-semibold mb-1" style={{ fontSize: '42px', lineHeight: '1' }}>
                  {cobbAngle}°
                </p>
              </div>
              <CobbAngleGauge angle={cobbAngle} size={100} />
            </div>

            {/* Apical Vertebra */}
            <div className="flex items-center justify-between py-3 border-t border-[var(--scolio-border-light)] mb-4">
              <span className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>
                Apical vertebra
              </span>
              <span className="text-[var(--scolio-text-primary)] font-semibold" style={{ fontSize: 'var(--text-h3)' }}>
                {apicalVertebra}
              </span>
            </div>

            {/* Accessible Explanation */}
            <div className="bg-[var(--scolio-light-blue-surface)] rounded-[var(--radius-component)] p-4">
              <p className="text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-body)', lineHeight: '1.6' }}>
                An angle of <strong>{cobbAngle}°</strong> indicates <strong>{getSeverityText(cobbAngle)}</strong>.
              </p>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="bg-[var(--scolio-warning-surface)] border border-[var(--scolio-warning-amber)] rounded-[var(--radius-component)] p-4 mb-6">
            <p className="text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-caption)', lineHeight: '1.5' }}>
              <strong>Validated by {doctorName} on {validationDate}.</strong> This information does not replace a medical consultation.
            </p>
          </div>

          {/* Doctor's Observations */}
          <div className="mb-6">
            <h3 className="text-[var(--scolio-text-primary)] mb-3">Doctor's observations</h3>
            <div className="bg-[var(--scolio-page-surface)] rounded-[var(--radius-card)] p-4">
              <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)', lineHeight: '1.6' }}>
                Patient shows improvement from previous exam. Cobb angle decreased by 0.4 degrees. 
                Recommend continuing current treatment plan with physical therapy and monitoring 
                progression every 3 months. Patient reports reduced pain levels and improved mobility.
              </p>
            </div>
          </div>

          {/* Download Report Button */}
          <Button variant="primary" className="w-full mb-4" onClick={() => setShowDownloadModal(true)}>
            <Download className="w-5 h-5 mr-2" />
            Descarregar relatório clínico em PDF
          </Button>

          {/* Compare Button */}
          <button
            onClick={() => navigate('/mobile/exam-comparison')}
            className="w-full text-[var(--scolio-primary-blue)] font-medium py-3"
            style={{ fontSize: 'var(--text-body)' }}
          >
            Comparar com outro exame
          </button>
        </div>
      </div>

      {/* Home Indicator Safe Area */}
      <div className="h-8 bg-white" />

      {/* Download Confirmation Modal */}
      {showDownloadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-6">
          <div className="bg-white rounded-[var(--radius-modal)] shadow-lg w-full max-w-sm">
            <div className="p-6 border-b border-[var(--scolio-border-light)]">
              <h2 className="text-[var(--scolio-text-primary)]">Descarregar relatório</h2>
            </div>

            <div className="p-6">
              <p className="text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-body)' }}>
                Pretende descarregar o relatório clínico em PDF?
              </p>
            </div>

            <div className="p-6 border-t border-[var(--scolio-border-light)] flex gap-3">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setShowDownloadModal(false)}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                onClick={() => {
                  setShowDownloadModal(false);
                  // Simular download
                }}
              >
                Descarregar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
