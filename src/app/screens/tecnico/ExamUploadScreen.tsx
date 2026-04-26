import React from 'react';
import { useNavigate } from 'react-router';
import { Upload, FileImage, X, CheckCircle2, Loader2, Image as ImageIcon } from 'lucide-react';
import { Button, Input, Select } from '../../components/scolio';

const recentUploads = [
  { id: 'EX-2026-0128', patient: 'Sofia Pereira', time: '09:48', status: 'A processar' },
  { id: 'EX-2026-0125', patient: 'João Santos', time: '09:08', status: 'A processar' },
  { id: 'EX-2026-0124', patient: 'Maria Silva', time: '08:42', status: 'Concluído' },
];

export default function ExamUploadScreen() {
  const navigate = useNavigate();
  const [file, setFile] = React.useState<{ name: string; size: string } | null>(null);
  const [dragOver, setDragOver] = React.useState(false);
  const [phase, setPhase] = React.useState<'idle' | 'uploading' | 'processing' | 'done'>('idle');
  const [patient, setPatient] = React.useState('PT-2024-0847 — Maria Silva');

  const submit = () => {
    setPhase('uploading');
    setTimeout(() => setPhase('processing'), 800);
    setTimeout(() => setPhase('done'), 2400);
  };

  return (
    <div className="p-8 space-y-6 overflow-auto h-full">
      <div>
        <h1 className="text-[var(--scolio-text-primary)]">Carregar novo exame</h1>
        <p className="text-[var(--scolio-text-secondary)] mt-1" style={{ fontSize: 'var(--text-body)' }}>
          Aceita ficheiros DICOM, PNG ou JPG. Tamanho máximo: 50&nbsp;MB.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Upload + form */}
        <div className="col-span-2 space-y-6">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const f = e.dataTransfer.files?.[0];
              if (f) setFile({ name: f.name, size: (f.size / 1024 / 1024).toFixed(1) + ' MB' });
            }}
            className={`bg-white rounded-[var(--radius-card)] border-2 border-dashed p-12 text-center transition-colors ${
              dragOver ? 'border-[var(--scolio-success-green)] bg-[var(--scolio-success-surface)]' : 'border-[var(--scolio-border-light)]'
            }`}
          >
            {!file ? (
              <>
                <div className="w-16 h-16 mx-auto rounded-full bg-[var(--scolio-success-surface)] flex items-center justify-center mb-4">
                  <Upload className="w-8 h-8 text-[var(--scolio-success-green)]" />
                </div>
                <p className="text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-h3)', fontWeight: 'var(--weight-medium)' }}>
                  Arrasta o ficheiro DICOM para aqui
                </p>
                <p className="text-[var(--scolio-text-secondary)] mt-1" style={{ fontSize: 'var(--text-body)' }}>
                  ou
                </p>
                <label className="inline-block mt-3">
                  <input
                    type="file"
                    accept=".dcm,.png,.jpg,.jpeg"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) setFile({ name: f.name, size: (f.size / 1024 / 1024).toFixed(1) + ' MB' });
                    }}
                  />
                  <span className="cursor-pointer inline-block px-4 py-2 bg-[var(--scolio-success-green)] text-white rounded-[var(--radius-component)] hover:opacity-90">
                    Selecionar ficheiro
                  </span>
                </label>
              </>
            ) : (
              <div className="flex items-center justify-between bg-[var(--scolio-page-surface)] p-4 rounded-[var(--radius-component)]">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-white border border-[var(--scolio-border-light)] flex items-center justify-center">
                    <FileImage className="w-6 h-6 text-[var(--scolio-success-green)]" />
                  </div>
                  <div className="text-left">
                    <p className="text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)' }}>{file.name}</p>
                    <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>{file.size}</p>
                  </div>
                </div>
                <button onClick={() => setFile(null)} className="p-2 hover:bg-white rounded">
                  <X className="w-5 h-5 text-[var(--scolio-text-secondary)]" />
                </button>
              </div>
            )}
          </div>

          {/* Form */}
          <div className="bg-white rounded-[var(--radius-card)] shadow-sm border border-[var(--scolio-border-light)] p-6 space-y-5">
            <h3 className="text-[var(--scolio-text-primary)]">Associação do exame</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[var(--scolio-text-primary)] mb-2" style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)' }}>Paciente</label>
                <input
                  type="text"
                  value={patient}
                  onChange={(e) => setPatient(e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--scolio-border-light)] rounded-[var(--radius-component)] focus:outline-none focus:ring-2 focus:ring-[var(--scolio-success-green)]"
                  placeholder="Pesquisar por nome ou ID..."
                />
                <button className="mt-2 text-[var(--scolio-success-green)] hover:underline" style={{ fontSize: 'var(--text-caption)' }}>
                  + Criar novo paciente
                </button>
              </div>
              <div>
                <label className="block text-[var(--scolio-text-primary)] mb-2" style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)' }}>Data do exame</label>
                <input type="date" defaultValue="2026-04-22" className="w-full px-3 py-2 border border-[var(--scolio-border-light)] rounded-[var(--radius-component)] focus:outline-none focus:ring-2 focus:ring-[var(--scolio-success-green)]" />
              </div>
              <div>
                <label className="block text-[var(--scolio-text-primary)] mb-2" style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)' }}>Equipamento</label>
                <select className="w-full px-3 py-2 border border-[var(--scolio-border-light)] rounded-[var(--radius-component)] focus:outline-none focus:ring-2 focus:ring-[var(--scolio-success-green)]">
                  <option>Siemens Ysio Max — Sala 3</option>
                  <option>Philips DigitalDiagnost C90 — Sala 1</option>
                  <option>GE Definium 8000 — Sala 5</option>
                </select>
              </div>
              <div>
                <label className="block text-[var(--scolio-text-primary)] mb-2" style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)' }}>Técnico responsável</label>
                <input type="text" value="Ricardo Sousa" disabled className="w-full px-3 py-2 border border-[var(--scolio-border-light)] rounded-[var(--radius-component)] bg-[var(--scolio-page-surface)] text-[var(--scolio-text-secondary)]" />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="secondary" onClick={() => navigate('/tecnico')}>Cancelar</Button>
              <Button variant="primary" onClick={submit} disabled={!file || phase !== 'idle'}>
                {phase === 'idle' && <>Submeter para análise IA</>}
                {phase === 'uploading' && <><Loader2 className="w-4 h-4 mr-2 inline animate-spin" /> A enviar...</>}
                {phase === 'processing' && <><Loader2 className="w-4 h-4 mr-2 inline animate-spin" /> A processar IA...</>}
                {phase === 'done' && <><CheckCircle2 className="w-4 h-4 mr-2 inline" /> Pronto para validação</>}
              </Button>
            </div>
          </div>

          {/* Skeleton IA */}
          {phase === 'processing' && (
            <div className="bg-white rounded-[var(--radius-card)] shadow-sm border border-[var(--scolio-border-light)] p-6">
              <div className="flex items-center gap-3 mb-4">
                <Loader2 className="w-5 h-5 text-[var(--scolio-primary-blue)] animate-spin" />
                <span className="text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)' }}>Análise IA em curso</span>
              </div>
              <div className="space-y-3">
                <div className="h-4 bg-[var(--scolio-page-surface)] rounded animate-pulse"></div>
                <div className="h-4 bg-[var(--scolio-page-surface)] rounded animate-pulse w-5/6"></div>
                <div className="h-4 bg-[var(--scolio-page-surface)] rounded animate-pulse w-4/6"></div>
              </div>
            </div>
          )}
        </div>

        {/* Right — preview + recent */}
        <div className="space-y-6">
          <div className="bg-white rounded-[var(--radius-card)] shadow-sm border border-[var(--scolio-border-light)] p-6">
            <h3 className="text-[var(--scolio-text-primary)] mb-4">Pré-visualização</h3>
            <div className="aspect-[3/4] rounded-[var(--radius-component)] bg-[var(--scolio-page-surface)] border border-dashed border-[var(--scolio-border-light)] flex flex-col items-center justify-center">
              <ImageIcon className="w-12 h-12 text-[var(--scolio-neutral-gray)]" />
              <p className="text-[var(--scolio-text-secondary)] mt-2" style={{ fontSize: 'var(--text-caption)' }}>
                {file ? 'Imagem DICOM carregada' : 'Sem imagem'}
              </p>
              {file && (
                <p className="font-mono text-[var(--scolio-text-secondary)] mt-1" style={{ fontSize: 'var(--text-caption)' }}>raio-X PA — coluna</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-[var(--radius-card)] shadow-sm border border-[var(--scolio-border-light)] p-6">
            <h3 className="text-[var(--scolio-text-primary)] mb-4">Uploads do turno</h3>
            <ul className="space-y-3">
              {recentUploads.map(r => (
                <li key={r.id} className="flex items-center justify-between">
                  <div>
                    <code className="px-2 py-0.5 bg-[var(--scolio-neutral-surface)] rounded" style={{ fontSize: 'var(--text-caption)' }}>{r.id}</code>
                    <p className="text-[var(--scolio-text-primary)] mt-1" style={{ fontSize: 'var(--text-caption)' }}>{r.patient}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>{r.time}</p>
                    <p className="text-[var(--scolio-success-green)]" style={{ fontSize: 'var(--text-caption)' }}>{r.status}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
