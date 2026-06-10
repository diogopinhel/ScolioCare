import React from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Search, Edit, Plus } from 'lucide-react';
import { Modal, Select } from '../../components/scolio';
import { getPacientesTecnico, alterarMedicoPaciente } from '../../../data/repository/tecnico';
import { getMedicos } from '../../../data/repository/pacientes';
import type { PacienteTecnico, MedicoResumo } from '../../../data/types';
import { useTranslation } from 'react-i18next';
import { useDateLocale } from '../../../lib/dateLocale';

function formatarData(iso: string | null, locale: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(locale);
}

function exibirGenero(genero: string | null): string {
  if (!genero) return '—';
  const g = genero.toLowerCase();
  if (g.startsWith('f')) return 'F';
  if (g.startsWith('m')) return 'M';
  return genero;
}

function calcularIdade(dataNascimento: string | null, ageLabel: (age: number) => string): string {
  if (!dataNascimento) return '—';
  const nasc = new Date(dataNascimento);
  const hoje = new Date();
  let idade = hoje.getFullYear() - nasc.getFullYear();
  const m = hoje.getMonth() - nasc.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
  return ageLabel(idade);
}

export default function TecnicoPatientsScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();
  const dateLocale = useDateLocale();
  const [pacientes, setPacientes] = React.useState<PacienteTecnico[]>([]);
  const [aCarregar, setACarregar] = React.useState(true);
  const [search, setSearch] = React.useState(() => searchParams.get('q') ?? '');
  const [tabAtiva, setTabAtiva] = React.useState<'todos' | 'pendentes'>('todos');

  // Modal de atribuição de médico (apenas para pendentes)
  const [modalPaciente, setModalPaciente] = React.useState<PacienteTecnico | null>(null);
  const [medicos, setMedicos] = React.useState<MedicoResumo[]>([]);
  const [medicoSelecionadoId, setMedicoSelecionadoId] = React.useState('');
  const [aGuardar, setAGuardar] = React.useState(false);
  const [erroModal, setErroModal] = React.useState<string | null>(null);

  React.useEffect(() => {
    getPacientesTecnico()
      .then(setPacientes)
      .finally(() => setACarregar(false));
  }, []);

  const correspondePesquisa = (p: PacienteTecnico) =>
    p.nomeCompleto.toLowerCase().includes(search.toLowerCase()) ||
    (p.numeroUtente ?? '').toLowerCase().includes(search.toLowerCase());

  const pendentes = pacientes.filter((p) => !p.contaAtivada && correspondePesquisa(p));
  const ativos = pacientes.filter((p) => p.contaAtivada && correspondePesquisa(p));
  const filtrados = tabAtiva === 'pendentes' ? pendentes : ativos;

  function abrirModalAtribuir(paciente: PacienteTecnico) {
    setModalPaciente(paciente);
    setMedicoSelecionadoId('');
    setErroModal(null);
    if (medicos.length === 0) getMedicos().then(setMedicos);
  }

  function fecharModal() {
    setModalPaciente(null);
    setErroModal(null);
  }

  async function confirmarAtribuicao() {
    if (!modalPaciente || !medicoSelecionadoId) return;
    setAGuardar(true);
    setErroModal(null);
    try {
      await alterarMedicoPaciente(modalPaciente.id, medicoSelecionadoId);
      const medicoSelecionado = medicos.find((m) => m.id === medicoSelecionadoId);
      setPacientes((prev) =>
        prev.map((p) =>
          p.id === modalPaciente.id
            ? { ...p, medicoId: medicoSelecionadoId, medicoNome: medicoSelecionado?.nomeCompleto ?? null, contaAtivada: true }
            : p,
        ),
      );
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
      <div>
        <h1 className="text-[var(--scolio-text-primary)]">{t('patients.title')}</h1>
        <p className="text-[var(--scolio-text-secondary)] mt-1" style={{ fontSize: 'var(--text-body)' }}>
          {t('patients.operationalView')}
        </p>
      </div>

      {/* Tabs: Todos / Pendentes */}
      <div className="flex items-center gap-1 border-b border-[var(--scolio-border-light)]">
        <button
          onClick={() => setTabAtiva('todos')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            tabAtiva === 'todos'
              ? 'border-[var(--scolio-success-green)] text-[var(--scolio-success-green)]'
              : 'border-transparent text-[var(--scolio-text-secondary)] hover:text-[var(--scolio-text-primary)]'
          }`}
        >
          {t('patients.tabAll')}
        </button>
        <button
          onClick={() => setTabAtiva('pendentes')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-2 ${
            tabAtiva === 'pendentes'
              ? 'border-[var(--scolio-success-green)] text-[var(--scolio-success-green)]'
              : 'border-transparent text-[var(--scolio-text-secondary)] hover:text-[var(--scolio-text-primary)]'
          }`}
        >
          {t('patients.tabPending')}
          {!aCarregar && pendentes.length > 0 && (
            <span
              className="inline-flex items-center justify-center w-5 h-5 rounded-full text-white font-bold"
              style={{ backgroundColor: '#f59e0b', fontSize: '11px' }}
            >
              {pendentes.length}
            </span>
          )}
        </button>
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
                    {calcularIdade(p.dataNascimento, (age) => t('patients.yearsOld', { age }))}
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
                    {formatarData(p.ultimoExame, dateLocale)}
                  </td>
                  <td className="px-4 py-3 text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-body)' }}>
                    {p.totalExames}
                  </td>
                  <td className="px-4 py-3">
                    {p.contaAtivada ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => navigate('/tecnico/upload')}
                          className="px-3 py-1 text-white rounded-[var(--radius-component)] transition-colors hover:opacity-90 flex items-center gap-1"
                          style={{ fontSize: 'var(--text-caption)', backgroundColor: 'var(--scolio-success-green)' }}
                        >
                          <Plus className="w-3.5 h-3.5" />
                          {t('patients.newExamButton')}
                        </button>
                        <button
                          onClick={() => navigate(`/tecnico/patients/${p.id}/edit`)}
                          className="px-3 py-1 text-[var(--scolio-primary-blue)] border border-[var(--scolio-primary-blue)] rounded-[var(--radius-component)] hover:bg-[var(--scolio-light-blue-surface)] transition-colors flex items-center gap-1"
                          style={{ fontSize: 'var(--text-caption)' }}
                        >
                          <Edit className="w-3.5 h-3.5" />
                          {t('patients.editPatient')}
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => abrirModalAtribuir(p)}
                        className="px-3 py-1 text-white rounded-[var(--radius-component)] transition-colors hover:opacity-90"
                        style={{ fontSize: 'var(--text-caption)', backgroundColor: 'var(--scolio-success-green)' }}
                      >
                        {t('patients.assignDoctor')}
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de atribuição de médico (pendentes) */}
      <Modal
        isOpen={modalPaciente !== null}
        onClose={fecharModal}
        title={t('patients.assignDoctorTitle')}
        confirmLabel={aGuardar ? t('common.saving') : t('common.confirm')}
        cancelLabel={t('common.cancel')}
        onConfirm={confirmarAtribuicao}
        confirmVariant="primary"
      >
        {modalPaciente && (
          <div className="space-y-4">
            <div className="bg-[var(--scolio-page-surface)] rounded-[var(--radius-component)] p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>{t('patients.colName')}</span>
                <span className="text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)' }}>{modalPaciente.nomeCompleto}</span>
              </div>
              {modalPaciente.numeroUtente && (
                <div className="flex justify-between">
                  <span className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>{t('patients.colUtenteShort')}</span>
                  <span className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>{modalPaciente.numeroUtente}</span>
                </div>
              )}
            </div>
            <Select
              label={t('patients.newDoctorLabel')}
              value={medicoSelecionadoId}
              onChange={(e) => { setMedicoSelecionadoId(e.target.value); setErroModal(null); }}
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
