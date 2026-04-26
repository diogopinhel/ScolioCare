import React from 'react';
import { Filter, ChevronRight, Download, RefreshCw } from 'lucide-react';
import { StatusBadge } from '../../components/scolio';
import BottomNavigation from '../../components/mobile/BottomNavigation';
import { useNavigate } from 'react-router';

// Mock exam data
const exams = [
  {
    id: '006',
    date: 'Apr 08, 2026',
    angle: 15.2,
    status: 'analyzed' as const,
    thumbnail: 'https://images.unsplash.com/photo-1728347053156-cf9066af4d9f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWRpY2FsJTIwc3BpbmUlMjB4cmF5fGVufDF8fHx8MTc3NTY2NTYzMHww&ixlib=rb-4.1.0&q=80&w=400',
    hasReport: true,
  },
  {
    id: '005',
    date: 'Jan 18, 2026',
    angle: 16.1,
    status: 'analyzed' as const,
    thumbnail: 'https://images.unsplash.com/photo-1728347053156-cf9066af4d9f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWRpY2FsJTIwc3BpbmUlMjB4cmF5fGVufDF8fHx8MTc3NTY2NTYzMHww&ixlib=rb-4.1.0&q=80&w=400',
    hasReport: true,
  },
  {
    id: '004',
    date: 'Oct 05, 2025',
    angle: 15.3,
    status: 'pending' as const,
    thumbnail: 'https://images.unsplash.com/photo-1728347053156-cf9066af4d9f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWRpY2FsJTIwc3BpbmUlMjB4cmF5fGVufDF8fHx8MTc3NTY2NTYzMHww&ixlib=rb-4.1.0&q=80&w=400',
    hasReport: false,
  },
  {
    id: '003',
    date: 'Jul 20, 2025',
    angle: 12.8,
    status: 'in-analysis' as const,
    thumbnail: 'https://images.unsplash.com/photo-1728347053156-cf9066af4d9f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWRpY2FsJTIwc3BpbmUlMjB4cmF5fGVufDF8fHx8MTc3NTY2NTYzMHww&ixlib=rb-4.1.0&q=80&w=400',
    hasReport: false,
  },
];

type FilterType = 'all' | 'report' | 'pending' | 'analyzing';

export default function ExamListScreen() {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = React.useState<FilterType>('all');
  const [swipedCard, setSwipedCard] = React.useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [pullDistance, setPullDistance] = React.useState(0);
  const startY = React.useRef(0);
  const scrollContainer = React.useRef<HTMLDivElement>(null);

  const filters = [
    { id: 'all' as FilterType, label: 'All' },
    { id: 'report' as FilterType, label: 'Report available' },
    { id: 'pending' as FilterType, label: 'Pending' },
    { id: 'analyzing' as FilterType, label: 'In analysis' },
  ];

  const getAngleColor = (angle: number) => {
    if (angle < 10) return 'var(--scolio-success-green)';
    if (angle < 25) return 'var(--scolio-warning-amber)';
    if (angle < 40) return 'var(--scolio-warning-amber)';
    return 'var(--scolio-danger-coral)';
  };

  const filteredExams = exams.filter((exam) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'report') return exam.hasReport;
    if (activeFilter === 'pending') return exam.status === 'pending';
    if (activeFilter === 'analyzing') return exam.status === 'in-analysis';
    return true;
  });

  const handleTouchStart = (e: React.TouchEvent) => {
    if (scrollContainer.current && scrollContainer.current.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (scrollContainer.current && scrollContainer.current.scrollTop === 0 && !isRefreshing) {
      const currentY = e.touches[0].clientY;
      const distance = Math.max(0, Math.min(currentY - startY.current, 80));
      setPullDistance(distance);
    }
  };

  const handleTouchEnd = () => {
    if (pullDistance > 60) {
      setIsRefreshing(true);
      setPullDistance(0);
      // Simulate refresh
      setTimeout(() => {
        setIsRefreshing(false);
      }, 1500);
    } else {
      setPullDistance(0);
    }
  };

  return (
    <div className="h-screen w-screen max-w-[390px] mx-auto bg-[var(--scolio-page-surface)] flex flex-col">
      {/* Status Bar Safe Area */}
      <div className="h-11 bg-white" />

      {/* Header */}
      <div className="bg-white px-6 py-4 border-b border-[var(--scolio-border-light)]">
        <div className="flex items-center justify-between">
          <h2 className="text-[var(--scolio-text-primary)]">My exams</h2>
          <button className="p-2 -mr-2">
            <Filter className="w-5 h-5 text-[var(--scolio-text-primary)]" />
          </button>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="bg-white px-6 py-3 border-b border-[var(--scolio-border-light)] overflow-x-auto">
        <div className="flex gap-2">
          {filters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={`px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
                activeFilter === filter.id
                  ? 'bg-[var(--scolio-primary-blue)] text-white'
                  : 'bg-[var(--scolio-page-surface)] text-[var(--scolio-text-secondary)] border border-[var(--scolio-border-light)]'
              }`}
              style={{ fontSize: 'var(--text-body)' }}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Pull to Refresh Indicator */}
      {(pullDistance > 0 || isRefreshing) && (
        <div className="bg-white flex justify-center py-3">
          <RefreshCw
            className={`w-5 h-5 text-[var(--scolio-primary-blue)] ${isRefreshing ? 'animate-spin' : ''}`}
            style={{
              transform: isRefreshing ? 'none' : `rotate(${pullDistance * 4}deg)`,
              opacity: Math.min(pullDistance / 60, 1),
            }}
          />
        </div>
      )}

      {/* Exam List */}
      <div
        ref={scrollContainer}
        className="flex-1 overflow-y-auto px-6 py-4"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="space-y-3">
          {filteredExams.map((exam) => (
            <div key={exam.id} className="relative">
              {/* Swipe Action Background */}
              {swipedCard === exam.id && exam.hasReport && (
                <div className="absolute inset-0 bg-[var(--scolio-primary-blue)] rounded-[var(--radius-card)] flex items-center justify-end px-6">
                  <div className="flex items-center gap-2 text-white">
                    <Download className="w-5 h-5" />
                    <span style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)' }}>
                      Download PDF
                    </span>
                  </div>
                </div>
              )}

              {/* Exam Card */}
              <div
                className="bg-white rounded-[var(--radius-card)] border border-[var(--scolio-border-light)] p-4 flex items-center gap-4 relative touch-pan-y"
                onClick={() => navigate('/mobile/exam-detail')}
                onTouchStart={(e) => {
                  const touch = e.touches[0];
                  (e.currentTarget as any).startX = touch.clientX;
                }}
                onTouchMove={(e) => {
                  if (!exam.hasReport) return;
                  const touch = e.touches[0];
                  const startX = (e.currentTarget as any).startX;
                  if (startX) {
                    const diff = startX - touch.clientX;
                    if (diff > 50) {
                      setSwipedCard(exam.id);
                    } else if (diff < -10) {
                      setSwipedCard(null);
                    }
                  }
                }}
                onTouchEnd={() => {
                  setTimeout(() => setSwipedCard(null), 2000);
                }}
              >
                {/* Thumbnail */}
                <div className="w-20 h-20 bg-black rounded-lg overflow-hidden flex-shrink-0">
                  <img
                    src={exam.thumbnail}
                    alt={`Exam ${exam.date}`}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Content */}
                <div className="flex-1">
                  <p className="text-[var(--scolio-text-primary)] font-semibold mb-1" style={{ fontSize: 'var(--text-body)' }}>
                    {exam.date}
                  </p>
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: getAngleColor(exam.angle) }}
                    />
                    <span className="text-[var(--scolio-text-primary)] font-medium" style={{ fontSize: 'var(--text-body)' }}>
                      {exam.angle}°
                    </span>
                  </div>
                  <StatusBadge status={exam.status} />
                </div>

                {/* Chevron */}
                <ChevronRight className="w-5 h-5 text-[var(--scolio-neutral-gray)] flex-shrink-0" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />

      {/* Home Indicator Safe Area */}
      <div className="h-8 bg-white" />
    </div>
  );
}