import React from 'react';
import { useNavigate } from 'react-router';
import { Upload, FileImage, X, CheckCircle2, Loader2, Image as ImageIcon, Search } from 'lucide-react';
import { Button, Toast } from '../../components/scolio';
import { useAuth } from '../../auth/AuthContext';
import { useTranslation } from 'react-i18next';
import {
  getPacientesTecnico,
  getMedicoResponsavelDoPaciente,
  criarEstudo,
  uploadImagemEstudo,
} from '../../../data/repository/tecnico';
import type { PacienteTecnico } from '../../../data/types';

export default function ExamUploadScreen() {
  const navigate = useNavigate();
  const { utilizador } = useAuth();
  const { t } = useTranslation();

  const [ficheiro, setFicheiro] = React.useState<File | null>(null);
  const [dragOver, setDragOver] = React.useState(false);
  const [fase, setFase] = React.useState<'idle' | 'uploading' | 'done' | 'erro'>('idle');

  // Seleção de paciente
  const [pacientes, setPacientes] = React.useState<PacienteTecnico[]>([]);
  const [aCarregarPacientes, setACarregarPacientes] = React.useState(true);
  const [pesquisaPaciente, setPesquisaPaciente] = React.useState('');
  const [pacienteSelecionado, setPacienteSelecionado] = React.useState<PacienteTecnico | null>(null);
  const [mostrarDropdown, setMostrarDropdown] = React.useState(false);

  // Outros campos
  const [dataEstudo, setDataEstudo] = React.useState(new Date().toISOString().split('T')[0]);

  // Toast
  const [toast, setToast] = React.useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const mostrarToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  React.useEffect(() => {
    getPacientesTecnico()
      .then(setPacientes)
      .finally(() => setACarregarPacientes(false));
  }, []);

  const pacientesFiltrados = pacientes.filter((p) =>
    p.nomeCompleto.toLowerCase().includes(pesquisaPaciente.toLowerCase()) ||
    (p.numeroUtente ?? '').toLowerCase().includes(pesquisaPaciente.toLowerCase()),
  );

  const handleFicheiro = (f: File) => setFicheiro(f);

  const podeSubmeter = ficheiro && pacienteSelecionado && dataEstudo && fase === 'idle';

  const submeter = async () => {
    if (!podeSubmeter || !utilizador) return;
    setFase('uploading');
    try {
      // 1. Descobrir o médico responsável pelo paciente
      const medicoId = await getMedicoResponsavelDoPaciente(pacienteSelecionado.id);
      if (!medicoId) {
        mostrarToast(t('upload.noMedicoError'), 'error');
        setFase('erro');
        return;
      }

      // 2. Criar o estudo
      const estudoId = await criarEstudo(
        pacienteSelecionado.id,
        medicoId,
        utilizador.id,
        dataEstudo,
        'Radiografia — Coluna vertebral AP',
      );

      // 3. Fazer upload da imagem e registar metadados
      await uploadImagemEstudo(estudoId, pacienteSelecionado.id, ficheiro!);

      setFase('done');
      mostrarToast(t('upload.successToast'));

      // Navegar para a fila após 2 s
      setTimeout(() => navigate('/tecnico/queue'), 2000);
    } catch (err) {
      console.error('Erro ao submeter exame:', err);
      mostrarToast(t('upload.uploadError'), 'error');
      setFase('erro');
    }
  };

  return (
    <div className="p-8 space-y-6 overflow-auto h-full">
      <div>
        <h1 className="text-[var(--scolio-text-primary)]">{t('upload.title')}</h1>
        <p className="text-[var(--scolio-text-secondary)] mt-1" style={{ fontSize: 'var(--text-body)' }}>
          {t('upload.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Upload + formulário */}
        <div className="col-span-2 space-y-6">
          {/* Zona de drop */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const f = e.dataTransfer.files?.[0];
              if (f) handleFicheiro(f);
            }}
            className={`bg-white rounded-[var(--radius-card)] border-2 border-dashed p-12 text-center transition-colors ${
              dragOver ? 'border-[var(--scolio-success-green)] bg-[var(--scolio-success-surface)]' : 'border-[var(--scolio-border-light)]'
            }`}
          >
            {!ficheiro ? (
              <>
                <div className="w-16 h-16 mx-auto rounded-full bg-[var(--scolio-success-surface)] flex items-center justify-center mb-4">
                  <Upload className="w-8 h-8 text-[var(--scolio-success-green)]" />
                </div>
                <p className="text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-h3)', fontWeight: 'var(--weight-medium)' }}>
                  {t('upload.dragHere')}
                </p>
                <p className="text-[var(--scolio-text-secondary)] mt-1" style={{ fontSize: 'var(--text-body)' }}>{t('upload.or')}</p>
                <label className="inline-block mt-3">
                  <input
                    type="file"
                    accept=".dcm,.png,.jpg,.jpeg"
                    className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFicheiro(f); }}
                  />
                  <span className="cursor-pointer inline-block px-4 py-2 bg-[var(--scolio-success-green)] text-white rounded-[var(--radius-component)] hover:opacity-90">
                    {t('upload.selectFile')}
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
                    <p className="text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)' }}>
                      {ficheiro.name}
                    </p>
                    <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>
                      {(ficheiro.size / 1024 / 1024).toFixed(1)} MB
                    </p>
                  </div>
                </div>
                <button onClick={() => setFicheiro(null)} className="p-2 hover:bg-white rounded">
                  <X className="w-5 h-5 text-[var(--scolio-text-secondary)]" />
                </button>
              </div>
            )}
          </div>

          {/* Formulário de associação */}
          <div className="bg-white rounded-[var(--radius-card)] shadow-sm border border-[var(--scolio-border-light)] p-6 space-y-5">
            <h3 className="text-[var(--scolio-text-primary)]">{t('upload.examAssociation')}</h3>

            <div className="grid grid-cols-2 gap-4">
              {/* Seleção de paciente */}
              <div className="col-span-2">
                <label className="block text-[var(--scolio-text-primary)] mb-2" style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)' }}>
                  {t('upload.patientLabel')}
                </label>
                <div className="relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--scolio-neutral-gray)]" />
                    <input
                      type="text"
                      value={pacienteSelecionado ? pacienteSelecionado.nomeCompleto : pesquisaPaciente}
                      onChange={(e) => {
                        if (pacienteSelecionado) setPacienteSelecionado(null);
                        setPesquisaPaciente(e.target.value);
                        setMostrarDropdown(true);
                      }}
                      onFocus={() => setMostrarDropdown(true)}
                      placeholder={aCarregarPacientes ? t('upload.loadingPatients') : t('upload.searchPatientPlaceholder')}
                      className="w-full pl-10 pr-3 py-2 border border-[var(--scolio-border-light)] rounded-[var(--radius-component)] focus:outline-none focus:ring-2 focus:ring-[var(--scolio-success-green)]"
                      disabled={aCarregarPacientes}
                    />
                  </div>
                  {mostrarDropdown && !pacienteSelecionado && pesquisaPaciente.length > 0 && (
                    <div className="absolute z-10 w-full bg-white border border-[var(--scolio-border-light)] rounded-[var(--radius-component)] shadow-lg mt-1 max-h-48 overflow-y-auto">
                      {pacientesFiltrados.length === 0 ? (
                        <p className="px-3 py-2 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>
                          {t('upload.noPatientFound')}
                        </p>
                      ) : (
                        pacientesFiltrados.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              setPacienteSelecionado(p);
                              setPesquisaPaciente('');
                              setMostrarDropdown(false);
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-[var(--scolio-page-surface)] transition-colors"
                          >
                            <p className="text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-body)' }}>
                              {p.nomeCompleto}
                            </p>
                            <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>
                              {p.numeroUtente ?? '—'}
                            </p>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
                {pacienteSelecionado && (
                  <div className="flex items-center gap-2 mt-2 px-3 py-2 bg-[var(--scolio-success-surface)] rounded-[var(--radius-component)]">
                    <CheckCircle2 className="w-4 h-4 text-[var(--scolio-success-green)]" />
                    <span className="text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-caption)' }}>
                      {pacienteSelecionado.nomeCompleto} · {pacienteSelecionado.numeroUtente ?? '—'}
                    </span>
                    <button
                      type="button"
                      onClick={() => { setPacienteSelecionado(null); setPesquisaPaciente(''); }}
                      className="ml-auto"
                    >
                      <X className="w-3.5 h-3.5 text-[var(--scolio-text-secondary)]" />
                    </button>
                  </div>
                )}
              </div>

              {/* Data do exame */}
              <div>
                <label className="block text-[var(--scolio-text-primary)] mb-2" style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)' }}>
                  {t('upload.examDateLabel')}
                </label>
                <input
                  type="date"
                  value={dataEstudo}
                  onChange={(e) => setDataEstudo(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-[var(--scolio-border-light)] rounded-[var(--radius-component)] focus:outline-none focus:ring-2 focus:ring-[var(--scolio-success-green)]"
                />
              </div>

              {/* Técnico responsável (read-only) */}
              <div>
                <label className="block text-[var(--scolio-text-primary)] mb-2" style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)' }}>
                  {t('upload.responsibleTech')}
                </label>
                <input
                  type="text"
                  value={utilizador?.nomeCompleto ?? '—'}
                  disabled
                  className="w-full px-3 py-2 border border-[var(--scolio-border-light)] rounded-[var(--radius-component)] bg-[var(--scolio-page-surface)] text-[var(--scolio-text-secondary)]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="secondary" onClick={() => navigate('/tecnico')}>{t('common.cancel')}</Button>
              <Button
                variant="primary"
                onClick={submeter}
                disabled={!podeSubmeter || fase !== 'idle'}
              >
                {fase === 'idle' && t('upload.submitIdle')}
                {fase === 'uploading' && <><Loader2 className="w-4 h-4 mr-2 inline animate-spin" />{t('upload.submitting')}</>}
                {fase === 'done' && <><CheckCircle2 className="w-4 h-4 mr-2 inline" />{t('upload.submitDone')}</>}
                {fase === 'erro' && t('upload.submitError')}
              </Button>
            </div>
          </div>
        </div>

        {/* Pré-visualização */}
        <div className="space-y-6">
          <div className="bg-white rounded-[var(--radius-card)] shadow-sm border border-[var(--scolio-border-light)] p-6">
            <h3 className="text-[var(--scolio-text-primary)] mb-4">{t('upload.preview')}</h3>
            <div className="aspect-[3/4] rounded-[var(--radius-component)] bg-[var(--scolio-page-surface)] border border-dashed border-[var(--scolio-border-light)] flex flex-col items-center justify-center">
              {ficheiro && ficheiro.type.startsWith('image/') ? (
                <img
                  src={URL.createObjectURL(ficheiro)}
                  alt="Pré-visualização"
                  className="w-full h-full object-contain rounded-[var(--radius-component)]"
                />
              ) : (
                <>
                  <ImageIcon className="w-12 h-12 text-[var(--scolio-neutral-gray)]" />
                  <p className="text-[var(--scolio-text-secondary)] mt-2" style={{ fontSize: 'var(--text-caption)' }}>
                    {ficheiro ? t('upload.dicomFile') : t('upload.noImage')}
                  </p>
                  {ficheiro && (
                    <p className="font-mono text-[var(--scolio-text-secondary)] mt-1" style={{ fontSize: 'var(--text-caption)' }}>
                      {ficheiro.name}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {toast && (
        <div className="fixed top-8 right-8 z-50">
          <Toast title={toast.msg} type={toast.type} onClose={() => setToast(null)} />
        </div>
      )}
    </div>
  );
}
