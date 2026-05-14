import React from 'react';
import { useNavigate } from 'react-router';
import { Search, UserPlus, UserCog } from 'lucide-react';
import { Button, Modal, Select } from '../../components/scolio';
import { getPacientesTecnico, alterarMedicoPaciente } from '../../../data/repository/tecnico';
import { getMedicos } from '../../../data/repository/pacientes';
import type { PacienteTecnico, MedicoResumo } from '../../../data/types';
import { useTranslation } from 'react-i18next';

function formatarData(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-PT');
}

function exibirGenero(genero: string | null): string {
  if (!genero) return '—';
  const g = genero.toLowerCase();
  if (g.startsWith('f')) return 'F';
  if (g.startsWith('m')) return 'M';
  return genero;
}

function calcularIdade(dataNascimento: string | null): string {
  if (!dataNascimento) return '—';
  const nasc = new Date(dataNascimento);
  const hoje = new Date();
  let idade = hoje.getFullYear() - nasc.getFullYear();
  const m = hoje.getMonth() - nasc.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
  return `${idade} anos`;
}

interface EstadoModal {
  paciente: PacienteTecnico;
}

export default function TecnicoPatientsScreen() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [pacientes, setPacientes] = React.useState<PacienteTecnico[]>([]);
  const [aCarregar, setACarregar] = React.useState(true);
  const [search, setSearch] = React.useState('');

  // Estado do modal de alteração de médico
  const [modal, setModal] = React.useState<EstadoModal | null>(null);
  const [medicos, setMedicos] = React.useState<MedicoResumo[]>([]);
  const [novoMedicoId, setNovoMedicoId] = React.useState('');
  const [aGuardar, setAGuardar] = React.useState(false);
  const [erroModal, setErroModal] = React.useState<string | null>(null);
  const [sucessoId, setSucessoId] = React.useState<string | null>(null);

  React.useEffect(() => {
    getPacientesTecnico()
      .then(setPacientes)
      .finally(() => setACarregar(false));
  }, []);

  const filtrados = pacientes.filter(
    (p) =>
      p.nomeCompleto.toLowerCase().includes(search.toLowerCase()) ||
      (p.numeroUtente ?? '').toLowerCase().includes(search.toLowerCase()),
  );

  function abrirModal(paciente: PacienteTecnico) {
    setModal({ paciente });
    setNovoMedicoId('');
    setErroModal(null);
    setSucessoId(null);
    // Carregar lista de médicos apenas uma vez
    if (medicos.length === 0) {
      getMedicos().then(setMedicos);
    }
  }

  function fecharModal() {
    setModal(null);
    setErroModal(null);
  }

  async function confirmarAlteracaoMedico() {
    if (!modal || !novoMedicoId) return;
    setAGuardar(true);
    setErroModal(null);
    try {
      await alterarMedicoPaciente(modal.paciente.id, novoMedicoId);
      const medicoSelecionado = medicos.find((m) => m.id === novoMedicoId);
      // Atualizar estado local para refletir a mudança sem recarregar
      setPacientes((prev) =>
        prev.map((p) =>
          p.id === modal.paciente.id
            ? { ...p, medicoId: novoMedicoId, medicoNome: medicoSelecionado?.nomeCompleto ?? null }
            : p,
        ),
      );
      setSucessoId(modal.paciente.id);
      fecharModal();
    } catch (err) {
      setErroModal(err instanceof Error ? err.message : t('patients.changeDoctorError'));
    } finally {
      setAGuardar(false);
    }
  }

  const opcoesSelect = [
    { value: '', label: t('patients.selectDoctorPlaceholder') },
    ...medicos.map((m) => ({
      value: m.id,
      label: m.especialidade ? `${m.nomeCompleto} — ${m.especialidade}` : m.nomeCompleto,
    })),
  ];

  const colunas = [
    t('patients.colName'),
    t('patients.colUtenteShort'),
    t('patients.colAge'),
    t('patients.colGender'),
    t('patients.colAssignedDoctor'),
    t('patients.colLastExamShort'),
    t('patients.colExamCount'),
    t('patients.colActions'),
  ];

  return (
    <div className="p-8 space-y-6 overflow-auto h-full">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-[var(--scolio-text-primary)]">{t('patients.title')}</h1>
          <p className="text-[var(--scolio-text-secondary)] mt-1" style={{ fontSize: 'var(--text-body)' }}>
            {t('patients.operationalView')}
          </p>
        </div>
        <Button variant="primary" onClick={() => navigate('/tecnico/patients/new')}>
          <UserPlus className="w-4 h-4 mr-2" />
          {t('patients.newPatient')}
        </Button>
      </div>

      {/* Pesquisa */}
      <div className="bg-white rounded-[var(--radius-card)] shadow-sm border border-[var(--scolio-border-light)] p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--scolio-neutral-gray)]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            type="search"
            placeholder={t('patients.searchPlaceholder')}
            className="w-full pl-10 pr-3 py-2 border border-[var(--scolio-border-light)] rounded-[var(--radius-component)] focus:outline-none focus:ring-2 focus:ring-[var(--scolio-success-green)]"
          />
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-[var(--radius-card)] shadow-sm border border-[var(--scolio-border-light)] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--scolio-border-light)] bg-[var(--scolio-page-surface)]">
              {colunas.map((h) => (
                <th key={h} className="text-left px-4 py-3 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-semibold)' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {aCarregar ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-[var(--scolio-border-light)]">
                  {Array.from({ length: 8 }).map((__, j) => (
                    <td key={j} className="px-4 py-4">
                      <div className="h-4 bg-[var(--scolio-page-surface)] rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : filtrados.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>
                  {search ? t('patients.noMatchSearch') : t('patients.noRegistered')}
                </td>
              </tr>
            ) : (
              filtrados.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-[var(--scolio-border-light)] hover:bg-[var(--scolio-page-surface)] transition-colors"
                  style={sucessoId === p.id ? { backgroundColor: 'var(--scolio-success-surface)' } : undefined}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-white font-medium flex-shrink-0"
                        style={{ backgroundColor: 'var(--scolio-success-green)', fontSize: 'var(--text-caption)' }}
                      >
                        {p.nomeCompleto.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <span className="text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-body)' }}>{p.nomeCompleto}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>
                    {p.numeroUtente ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>
                    {calcularIdade(p.dataNascimento)}
                  </td>
                  <td className="px-4 py-3 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>
                    {exibirGenero(p.genero)}
                  </td>
                  <td className="px-4 py-3" style={{ fontSize: 'var(--text-body)' }}>
                    {p.medicoNome ? (
                      <span className="text-[var(--scolio-text-primary)]">{p.medicoNome}</span>
                    ) : (
                      <span className="text-[var(--scolio-text-secondary)] italic">{t('patients.noDoctor')}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>
                    {formatarData(p.ultimoExame)}
                  </td>
                  <td className="px-4 py-3 text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-body)' }}>
                    {p.totalExames}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigate('/tecnico/upload')}
                        className="px-3 py-1 text-[var(--scolio-success-green)] border border-[var(--scolio-success-green)] rounded-[var(--radius-component)] hover:bg-[var(--scolio-success-surface)] transition-colors"
                        style={{ fontSize: 'var(--text-caption)' }}
                      >
                        {t('patients.newExamButton')}
                      </button>
                      <button
                        onClick={() => abrirModal(p)}
                        className="px-3 py-1 text-[var(--scolio-text-secondary)] border border-[var(--scolio-border-light)] rounded-[var(--radius-component)] hover:bg-[var(--scolio-page-surface)] transition-colors flex items-center gap-1"
                        style={{ fontSize: 'var(--text-caption)' }}
                        title={t('patients.changeDoctor')}
                      >
                        <UserCog className="w-3.5 h-3.5" />
                        {t('patients.changeDoctor')}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de alteração de médico */}
      <Modal
        isOpen={modal !== null}
        onClose={fecharModal}
        title={t('patients.changeDoctorTitle')}
        confirmLabel={aGuardar ? t('common.saving') : t('common.confirm')}
        cancelLabel={t('common.cancel')}
        onConfirm={confirmarAlteracaoMedico}
        confirmVariant="primary"
      >
        {modal && (
          <div className="space-y-4">
            {/* Informação readonly do paciente */}
            <div className="bg-[var(--scolio-page-surface)] rounded-[var(--radius-component)] p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>{t('patients.colName')}</span>
                <span className="text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)' }}>{modal.paciente.nomeCompleto}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>{t('patients.colUtenteShort')}</span>
                <span className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>{modal.paciente.numeroUtente ?? '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>{t('patients.colAge')}</span>
                <span className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>{calcularIdade(modal.paciente.dataNascimento)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>{t('patients.colGender')}</span>
                <span className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>{exibirGenero(modal.paciente.genero)}</span>
              </div>
            </div>

            {/* Médico atual */}
            <div>
              <p className="text-[var(--scolio-text-secondary)] mb-1" style={{ fontSize: 'var(--text-caption)' }}>{t('patients.currentDoctor')}</p>
              <p className="text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)' }}>
                {modal.paciente.medicoNome ?? <span className="italic text-[var(--scolio-text-secondary)]">{t('patients.noDoctor')}</span>}
              </p>
            </div>

            {/* Seleção do novo médico */}
            <Select
              label={t('patients.newDoctorLabel')}
              value={novoMedicoId}
              onChange={(e) => { setNovoMedicoId(e.target.value); setErroModal(null); }}
              options={opcoesSelect}
              error={erroModal ?? undefined}
              disabled={aGuardar}
            />
          </div>
        )}
      </Modal>
    </div>
  );
}
