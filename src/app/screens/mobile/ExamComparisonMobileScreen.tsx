import React from 'react';
import { X, ChevronDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '../../components/scolio';
import { useNavigate } from 'react-router';

const exams = [
  { id: '006', date: 'Apr 08, 2026', angle: 15.2, image: 'https://images.unsplash.com/photo-1728347053156-cf9066af4d9f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWRpY2FsJTIwc3BpbmUlMjB4cmF5fGVufDF8fHx8MTc3NTY2NTYzMHww&ixlib=rb-4.1.0&q=80&w=400' },
  { id: '005', date: 'Jan 18, 2026', angle: 16.1, image: 'https://images.unsplash.com/photo-1728347053156-cf9066af4d9f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWRpY2FsJTIwc3BpbmUlMjB4cmF5fGVufDF8fHx8MTc3NTY2NTYzMHww&ixlib=rb-4.1.0&q=80&w=400' },
  { id: '004', date: 'Oct 05, 2025', angle: 15.3, image: 'https://images.unsplash.com/photo-1728347053156-cf9066af4d9f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWRpY2FsJTIwc3BpbmUlMjB4cmF5fGVufDF8fHx8MTc3NTY2NTYzMHww&ixlib=rb-4.1.0&q=80&w=400' },
];

export default function ExamComparisonMobileScreen() {
  const navigate = useNavigate();
  const [examA, setExamA] = React.useState(exams[1]); // Jan 18, 2026
  const [examB, setExamB] = React.useState(exams[0]); // Apr 08, 2026

  const variation = examB.angle - examA.angle;
  const isImprovement = variation < 0;

  return (
    <div className="h-screen w-screen max-w-[390px] mx-auto bg-white flex flex-col overflow-hidden">
      {/* Status Bar Safe Area */}
      <div className="h-11 bg-white" />

      {/* Header */}
      <div className="bg-white px-4 py-3 border-b border-[var(--scolio-border-light)] flex items-center justify-between">
        <h3 className="text-[var(--scolio-text-primary)]">Compare exams</h3>
        <button onClick={() => navigate('/mobile/exam-detail')} className="p-1">
          <X className="w-6 h-6 text-[var(--scolio-text-primary)]" />
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Exam A - Top Half */}
        <div className="border-b border-[var(--scolio-border-light)]">
          {/* Exam A Header */}
          <div className="px-6 py-4 bg-[var(--scolio-page-surface)]">
            <label className="block text-[var(--scolio-text-secondary)] mb-2" style={{ fontSize: 'var(--text-caption)' }}>
              Exam A
            </label>
            <div className="relative">
              <select
                value={examA.id}
                onChange={(e) => {
                  const selected = exams.find(ex => ex.id === e.target.value);
                  if (selected) setExamA(selected);
                }}
                className="w-full px-4 py-2 pr-10 border border-[var(--scolio-border-light)] rounded-[var(--radius-component)] focus:outline-none focus:ring-2 focus:ring-[var(--scolio-primary-blue)] appearance-none"
                style={{ fontSize: 'var(--text-body)' }}
              >
                {exams.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.date} - {ex.angle}°
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--scolio-neutral-gray)] pointer-events-none" />
            </div>
          </div>

          {/* Exam A Image */}
          <div className="bg-black px-6 py-4" style={{ height: '220px' }}>
            <div className="w-full h-full flex items-center justify-center">
              <img
                src={examA.image}
                alt={`Exam ${examA.date}`}
                className="max-w-full max-h-full object-contain"
              />
            </div>
          </div>
        </div>

        {/* Central Evolution Badge */}
        <div className="relative py-6 bg-white">
          <div className="absolute inset-x-0 top-1/2 h-px bg-[var(--scolio-border-light)]" />
          <div className="relative flex justify-center">
            <div
              className={`px-6 py-3 rounded-full flex items-center gap-3 ${
                isImprovement
                  ? 'bg-[var(--scolio-success-surface)] border border-[var(--scolio-success-green)]'
                  : 'bg-[var(--scolio-danger-surface)] border border-[var(--scolio-danger-coral)]'
              }`}
            >
              {isImprovement ? (
                <ArrowDown className="w-6 h-6 text-[var(--scolio-success-green)]" strokeWidth={2.5} />
              ) : (
                <ArrowUp className="w-6 h-6 text-[var(--scolio-danger-coral)]" strokeWidth={2.5} />
              )}
              <div>
                <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>
                  Variation
                </p>
                <p
                  className={`font-semibold ${
                    isImprovement ? 'text-[var(--scolio-success-green)]' : 'text-[var(--scolio-danger-coral)]'
                  }`}
                  style={{ fontSize: 'var(--text-h3)' }}
                >
                  {variation > 0 ? '+' : ''}{variation.toFixed(1)}°
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Exam B - Bottom Half */}
        <div className="border-t border-[var(--scolio-border-light)]">
          {/* Exam B Header */}
          <div className="px-6 py-4 bg-[var(--scolio-page-surface)]">
            <label className="block text-[var(--scolio-text-secondary)] mb-2" style={{ fontSize: 'var(--text-caption)' }}>
              Exam B
            </label>
            <div className="relative">
              <select
                value={examB.id}
                onChange={(e) => {
                  const selected = exams.find(ex => ex.id === e.target.value);
                  if (selected) setExamB(selected);
                }}
                className="w-full px-4 py-2 pr-10 border border-[var(--scolio-border-light)] rounded-[var(--radius-component)] focus:outline-none focus:ring-2 focus:ring-[var(--scolio-primary-blue)] appearance-none"
                style={{ fontSize: 'var(--text-body)' }}
              >
                {exams.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.date} - {ex.angle}°
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--scolio-neutral-gray)] pointer-events-none" />
            </div>
          </div>

          {/* Exam B Image */}
          <div className="bg-black px-6 py-4" style={{ height: '220px' }}>
            <div className="w-full h-full flex items-center justify-center">
              <img
                src={examB.image}
                alt={`Exam ${examB.date}`}
                className="max-w-full max-h-full object-contain"
              />
            </div>
          </div>
        </div>

        {/* Comparison Data */}
        <div className="px-6 py-6 space-y-4">
          {/* Compact Table */}
          <div className="bg-[var(--scolio-page-surface)] rounded-[var(--radius-card)] overflow-hidden">
            <div className="grid grid-cols-3 gap-px bg-[var(--scolio-border-light)]">
              {/* Header Row */}
              <div className="bg-white px-4 py-3 text-center">
                <p className="text-[var(--scolio-text-secondary)] font-semibold" style={{ fontSize: 'var(--text-caption)' }}>
                  COBB A
                </p>
              </div>
              <div className="bg-white px-4 py-3 text-center">
                <p className="text-[var(--scolio-text-secondary)] font-semibold" style={{ fontSize: 'var(--text-caption)' }}>
                  VARIATION
                </p>
              </div>
              <div className="bg-white px-4 py-3 text-center">
                <p className="text-[var(--scolio-text-secondary)] font-semibold" style={{ fontSize: 'var(--text-caption)' }}>
                  COBB B
                </p>
              </div>
              
              {/* Data Row */}
              <div className="bg-white px-4 py-4 text-center">
                <p className="text-[var(--scolio-text-primary)] font-semibold" style={{ fontSize: 'var(--text-h3)' }}>
                  {examA.angle}°
                </p>
              </div>
              <div className="bg-white px-4 py-4 text-center">
                <p
                  className={`font-semibold ${
                    isImprovement ? 'text-[var(--scolio-success-green)]' : 'text-[var(--scolio-danger-coral)]'
                  }`}
                  style={{ fontSize: 'var(--text-h3)' }}
                >
                  {variation > 0 ? '+' : ''}{variation.toFixed(1)}°
                </p>
              </div>
              <div className="bg-white px-4 py-4 text-center">
                <p className="text-[var(--scolio-text-primary)] font-semibold" style={{ fontSize: 'var(--text-h3)' }}>
                  {examB.angle}°
                </p>
              </div>
            </div>
          </div>

          {/* AI Suggestion */}
          <div className="bg-[var(--scolio-light-blue-surface)] rounded-[var(--radius-card)] border border-[var(--scolio-primary-blue)] p-4">
            <p className="text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-body)', lineHeight: '1.6' }}>
              AI analysis suggests {isImprovement ? 'positive' : 'negative'} evolution based on {variation > 0 ? '+' : ''}{variation.toFixed(1)}° 
              variation in Cobb angle between these exams.
            </p>
          </div>

          {/* Action Button */}
          <Button variant="primary" className="w-full">
            View Exam B report
          </Button>
        </div>
      </div>

      {/* Home Indicator Safe Area */}
      <div className="h-8 bg-white" />
    </div>
  );
}
