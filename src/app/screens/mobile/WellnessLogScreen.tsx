import React from 'react';
import { X, Calendar } from 'lucide-react';
import { Button, Textarea } from '../../components/scolio';
import { useNavigate } from 'react-router';

// Pain level emojis
const painEmojis = ['😊', '🙂', '😐', '😕', '😟', '😣', '😖', '😫', '😩', '😭'];

// Previous wellness entries
const previousEntries = [
  {
    id: 1,
    date: 'April 7, 2026',
    painLevel: 3,
    discomfort: 'Mild',
    notes: 'Feeling much better after the exercises. Pain has reduced significantly.',
  },
  {
    id: 2,
    date: 'April 4, 2026',
    painLevel: 5,
    discomfort: 'Moderate',
    notes: 'Some discomfort during brace wearing, but manageable.',
  },
  {
    id: 3,
    date: 'April 1, 2026',
    painLevel: 4,
    discomfort: 'Mild',
    notes: 'Good day overall. Exercises are getting easier.',
  },
];

export default function WellnessLogScreen() {
  const navigate = useNavigate();
  const [painLevel, setPainLevel] = React.useState<number | null>(null);
  const [discomfort, setDiscomfort] = React.useState<'none' | 'mild' | 'moderate' | 'intense' | null>(null);
  const [notes, setNotes] = React.useState('');
  const [date, setDate] = React.useState('2026-04-08');

  const handleSave = () => {
    // Save logic here
    navigate('/mobile/home');
  };

  return (
    <div className="h-screen w-screen max-w-[390px] mx-auto bg-white flex flex-col overflow-hidden">
      {/* Status Bar Safe Area */}
      <div className="h-11 bg-white" />

      {/* Header */}
      <div className="bg-white px-6 py-4 border-b border-[var(--scolio-border-light)] flex items-center justify-between">
        <h3 className="text-[var(--scolio-text-primary)]">Log wellness</h3>
        <button onClick={() => navigate('/mobile/home')} className="p-1">
          <X className="w-6 h-6 text-[var(--scolio-text-primary)]" />
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-6 py-6 space-y-6">
          {/* Pain Level */}
          <section>
            <label className="block text-[var(--scolio-text-primary)] mb-3" style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)' }}>
              How is your pain level today?
            </label>
            <p className="text-[var(--scolio-text-secondary)] mb-4" style={{ fontSize: 'var(--text-caption)' }}>
              Select a number from 1 (no pain) to 10 (severe pain)
            </p>
            
            <div className="grid grid-cols-5 gap-2 mb-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => (
                <button
                  key={level}
                  onClick={() => setPainLevel(level)}
                  className={`aspect-square rounded-full border-2 transition-all ${
                    painLevel === level
                      ? 'border-[var(--scolio-primary-blue)] bg-[var(--scolio-primary-blue)] text-white shadow-lg scale-110'
                      : 'border-[var(--scolio-border-light)] bg-white text-[var(--scolio-text-primary)] hover:border-[var(--scolio-primary-blue)]'
                  }`}
                >
                  <div className="flex flex-col items-center justify-center">
                    <span className="text-xl mb-1">{painEmojis[level - 1]}</span>
                    <span className="font-semibold" style={{ fontSize: '12px' }}>
                      {level}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* Treatment Discomfort */}
          <section>
            <label className="block text-[var(--scolio-text-primary)] mb-3" style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)' }}>
              Treatment discomfort
            </label>
            <p className="text-[var(--scolio-text-secondary)] mb-4" style={{ fontSize: 'var(--text-caption)' }}>
              How uncomfortable are you with your current treatment?
            </p>
            
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'none', label: 'None', color: 'var(--scolio-success-green)' },
                { value: 'mild', label: 'Mild', color: 'var(--scolio-primary-blue)' },
                { value: 'moderate', label: 'Moderate', color: 'var(--scolio-warning-amber)' },
                { value: 'intense', label: 'Intense', color: 'var(--scolio-danger-coral)' },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setDiscomfort(option.value as any)}
                  className={`py-4 px-4 rounded-[var(--radius-component)] border-2 transition-all ${
                    discomfort === option.value
                      ? 'border-current shadow-lg'
                      : 'border-[var(--scolio-border-light)] hover:border-current'
                  }`}
                  style={{
                    color: discomfort === option.value ? option.color : 'var(--scolio-text-secondary)',
                    fontWeight: discomfort === option.value ? 'var(--weight-semibold)' : 'var(--weight-normal)',
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </section>

          {/* Free Observations */}
          <section>
            <label className="block text-[var(--scolio-text-primary)] mb-3" style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)' }}>
              Additional notes (optional)
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="Share any observations about your wellness, mobility, or treatment..."
            />
          </section>

          {/* Date */}
          <section>
            <label className="block text-[var(--scolio-text-primary)] mb-3" style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)' }}>
              Date
            </label>
            <div className="relative">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-3 pl-12 border border-[var(--scolio-border-light)] rounded-[var(--radius-component)] focus:outline-none focus:ring-2 focus:ring-[var(--scolio-primary-blue)]"
                style={{ fontSize: 'var(--text-body)' }}
              />
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--scolio-neutral-gray)] pointer-events-none" />
            </div>
          </section>

          {/* Save Button */}
          <Button
            variant="primary"
            className="w-full"
            onClick={handleSave}
            disabled={painLevel === null || discomfort === null}
          >
            Save entry
          </Button>

          {/* Disclaimer */}
          <div className="bg-[var(--scolio-light-blue-surface)] rounded-[var(--radius-component)] border border-[var(--scolio-primary-blue)] p-4">
            <p className="text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-caption)', lineHeight: '1.5' }}>
              <strong>Privacy notice:</strong> This wellness record is shared with your responsible doctor 
              to help monitor your progress and adjust your treatment plan.
            </p>
          </div>

          {/* Previous Entries */}
          <section className="pt-4 border-t border-[var(--scolio-border-light)]">
            <h3 className="text-[var(--scolio-text-primary)] mb-4">Previous entries</h3>
            
            <div className="space-y-3">
              {previousEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="bg-[var(--scolio-page-surface)] rounded-[var(--radius-card)] p-4"
                >
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-[var(--scolio-text-primary)] font-medium" style={{ fontSize: 'var(--text-body)' }}>
                      {entry.date}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{painEmojis[entry.painLevel - 1]}</span>
                      <span className="text-[var(--scolio-text-primary)] font-semibold" style={{ fontSize: 'var(--text-body)' }}>
                        {entry.painLevel}/10
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>
                      Discomfort:
                    </span>
                    <span
                      className="px-2 py-1 rounded text-white"
                      style={{
                        fontSize: 'var(--text-caption)',
                        backgroundColor:
                          entry.discomfort === 'None'
                            ? 'var(--scolio-success-green)'
                            : entry.discomfort === 'Mild'
                            ? 'var(--scolio-primary-blue)'
                            : entry.discomfort === 'Moderate'
                            ? 'var(--scolio-warning-amber)'
                            : 'var(--scolio-danger-coral)',
                      }}
                    >
                      {entry.discomfort}
                    </span>
                  </div>

                  {entry.notes && (
                    <p className="text-[var(--scolio-text-secondary)] italic" style={{ fontSize: 'var(--text-caption)', lineHeight: '1.5' }}>
                      "{entry.notes}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* Home Indicator Safe Area */}
      <div className="h-8 bg-white" />
    </div>
  );
}
