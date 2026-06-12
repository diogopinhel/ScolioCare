import React from 'react';
import { useNavigate, useParams } from 'react-router';
import { Upload, FileImage, X, CheckCircle2, Loader2, Image as ImageIcon } from 'lucide-react';
import { Button, Toast } from '../../components/scolio';
import { useAuth } from '../../auth/AuthContext';
import { useTranslation } from 'react-i18next';
import { getPacientesAssociados, getPaciente } from '../../../data/repository/pacientes';
import { criarEstudo, uploadImagemEstudo } from '../../../data/repository/tecnico';
import { registarAcao } from '../../../data/repository/audit';
import { supabase } from '../../../lib/supabase';
import { validarFicheiroExame, mensagemErroFicheiroExame } from '../../../lib/validarFicheiroExame';
import { hojeLocalISO } from '../../../lib/camposPaciente';
import type { PacienteResumo } from '../../../data/types';

export default function ExamUploadMedicoScreen() {
  const { pacienteId } = useParams<{ pacienteId: string }>();
  const navigate = useNavigate();
  const { utilizador } = useAuth();
  const { t } = useTranslation();

  const [ficheiro, setFicheiro] = React.useState<File | null>(null);
  const [dragOver, setDragOver] = React.useState(false);
  const [fase, setFase] = React.useState<'idle' | 'uploading' | 'done' | 'erro'>('idle');

  const [pacientes, setPacientes] = React.useState<PacienteResumo[]>([]);
  const [aCarregarPacientes, setACarregarPacientes] = React.useState(true);
  const [pacienteSelecionado, setPacienteSelecionado] = React.useState<PacienteResumo | null>(null);

  const [dataEstudo, setDataEstudo] = React.useState(hojeLocalISO());

  const [toast, setToast] = React.useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const mostrarToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  React.useEffect(() => {
    getPacientesAssociados().then(async (lista) => {
      setPacientes(lista);
      if (pacienteId) {
        const associado = lista.find((p) => p.id === pacienteId) ?? null;
        if (associado) {
          setPacienteSelecionado(associado);
        } else {
          // Paciente não está na lista — acesso via glass-break
          const p = await getPaciente(pacienteId);
          if (p) {
            setPacienteSelecionado({
              id: p.id,
              nomeCompleto: p.nomeCompleto,
              numeroUtente: p.numeroUtente ?? '—',
              dataAssociacao: '',
            });
          }
        }
      }
    }).finally(() => setACarregarPacientes(false));
  }, [pacienteId]);

  const handleFicheiro = (f: File) => {
    const erro = validarFicheiroExame(f);
    if (erro) {
      const { chave, params } = mensagemErroFicheiroExame(erro);
      mostrarToast(t(chave, params), 'error');
      return;
    }
    setFicheiro(f);
  };

  const podeSubmeter = ficheiro && pacienteSelecionado && dataEstudo && fase === 'idle';

  const submeter = async () => {
    if (!podeSubmeter || !utilizador) return;
    setFase('uploading');
    try {
      const estudoId = await criarEstudo(
        pacienteSelecionado.id,
        utilizador.id,
        utilizador.id,
        dataEstudo,
        'Radiografia — Coluna vertebral AP',
      );
      try {
        await uploadImagemEstudo(estudoId, pacienteSelecionado.id, ficheiro!);
      } catch (uploadErr) {
        // Rollback: arquivar o estudo (historico_estado é imutável, DELETE não é possível)
        await supabase.from('estudos').update({ arquivado: true }).eq('id', estudoId);
        throw uploadErr;
      }
      registarAcao('CRIAR_ESTUDO', 'estudos', estudoId);
      setFase('done');
      mostrarToast(t('upload.successToast'));
      setTimeout(() => navigate(`/patients/${pacienteSelecionado.id}`), 2000);
    } catch (err) {
      console.error('Erro ao submeter exame:', err);
      mostrarToast(t('upload.uploadError'), 'error');
      setFase('erro');
    }
  };

  const destino = pacienteId ? `/patients/${pacienteId}` : '/patients';

  return (
    <div className="p-8 space-y-6 overflow-auto h-full">
      <div>
        <h1 className="text-[var(--scolio-text-primary)]">{t('upload.title')}</h1>
        <p className="text-[var(--scolio-text-secondary)] mt-1" style={{ fontSize: 'var(--text-body)' }}>
          {t('upload.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-6">
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
              dragOver ? 'border-[var(--scolio-primary-blue)] bg-[var(--scolio-light-blue-surface)]' : 'border-[var(--scolio-border-light)]'
            }`}
          >
            {!ficheiro ? (
              <>
                <div className="w-16 h-16 mx-auto rounded-full bg-[var(--scolio-light-blue-surface)] flex items-center justify-center mb-4">
                  <Upload className="w-8 h-8 text-[var(--scolio-primary-blue)]" />
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
                  <span className="cursor-pointer inline-block px-4 py-2 bg-[var(--scolio-primary-blue)] text-white rounded-[var(--radius-component)] hover:opacity-90">
                    {t('upload.selectFile')}
                  </span>
                </label>
              </>
            ) : (
              <div className="flex items-center justify-between bg-[var(--scolio-page-surface)] p-4 rounded-[var(--radius-component)]">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-white border border-[var(--scolio-border-light)] flex items-center justify-center">
                    <FileImage className="w-6 h-6 text-[var(--scolio-primary-blue)]" />
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

          {/* Associação */}
          <div className="bg-white rounded-[var(--radius-card)] shadow-sm border border-[var(--scolio-border-light)] p-6 space-y-5">
            <h3 className="text-[var(--scolio-text-primary)]">{t('upload.examAssociation')}</h3>

            <div className="grid grid-cols-2 gap-4">
              {/* Paciente */}
              <div className="col-span-2">
                <label className="block text-[var(--scolio-text-primary)] mb-2" style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)' }}>
                  {t('upload.patientLabel')}
                </label>
                {aCarregarPacientes ? (
                  <div className="flex items-center gap-2 px-3 py-2 border border-[var(--scolio-border-light)] rounded-[var(--radius-component)] text-[var(--scolio-text-secondary)]">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t('common.loading')}
                  </div>
                ) : pacienteSelecionado ? (
                  <div className="flex items-center gap-2 px-3 py-2 bg-[var(--scolio-light-blue-surface)] rounded-[var(--radius-component)]">
                    <CheckCircle2 className="w-4 h-4 text-[var(--scolio-primary-blue)]" />
                    <span className="text-[var(--scolio-text-primary)] flex-1" style={{ fontSize: 'var(--text-body)' }}>
                      {pacienteSelecionado.nomeCompleto} · {pacienteSelecionado.numeroUtente}
                    </span>
                    {!pacienteId && (
                      <button type="button" onClick={() => setPacienteSelecionado(null)}>
                        <X className="w-3.5 h-3.5 text-[var(--scolio-text-secondary)]" />
                      </button>
                    )}
                  </div>
                ) : (
                  <select
                    value=""
                    onChange={(e) => {
                      const p = pacientes.find((x) => x.id === e.target.value) ?? null;
                      setPacienteSelecionado(p);
                    }}
                    className="w-full px-3 py-2 border border-[var(--scolio-border-light)] rounded-[var(--radius-component)] focus:outline-none focus:ring-2 focus:ring-[var(--scolio-primary-blue)]"
                  >
                    <option value="">{t('upload.searchPatientPlaceholder')}</option>
                    {pacientes.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nomeCompleto} — {p.numeroUtente}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Data */}
              <div>
                <label className="block text-[var(--scolio-text-primary)] mb-2" style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)' }}>
                  {t('upload.examDateLabel')}
                </label>
                <input
                  type="date"
                  value={dataEstudo}
                  onChange={(e) => setDataEstudo(e.target.value)}
                  max={hojeLocalISO()}
                  className="w-full px-3 py-2 border border-[var(--scolio-border-light)] rounded-[var(--radius-component)] focus:outline-none focus:ring-2 focus:ring-[var(--scolio-primary-blue)]"
                />
              </div>

              {/* Médico (read-only) */}
              <div>
                <label className="block text-[var(--scolio-text-primary)] mb-2" style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)' }}>
                  {t('upload.responsibleDoctor')}
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
              <Button variant="secondary" onClick={() => navigate(destino)} disabled={fase === 'uploading'}>
                {t('common.cancel')}
              </Button>
              <Button variant="primary" onClick={submeter} disabled={!podeSubmeter || fase !== 'idle'}>
                {fase === 'idle' && t('upload.submitIdle')}
                {fase === 'uploading' && <><Loader2 className="w-4 h-4 mr-2 inline animate-spin" />{t('upload.submitting')}</>}
                {fase === 'done' && <><CheckCircle2 className="w-4 h-4 mr-2 inline" />{t('upload.submitDone')}</>}
                {fase === 'erro' && t('upload.submitError')}
              </Button>
            </div>
          </div>
        </div>

        {/* Pré-visualização */}
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

      {toast && (
        <div className="fixed top-8 right-8 z-50">
          <Toast title={toast.msg} type={toast.type} onClose={() => setToast(null)} />
        </div>
      )}
    </div>
  );
}
