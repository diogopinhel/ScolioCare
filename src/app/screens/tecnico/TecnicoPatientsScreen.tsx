import React from 'react';
import { useNavigate } from 'react-router';
import { Search, UserPlus, UserCog } from 'lucide-react';
import { Button, Toast } from '../../components/scolio';
import { getPacientesTecnico } from '../../../data/repository/tecnico';
import { getMedicos, reatribuirMedico } from '../../../data/repository/pacientes';
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
  const { t } = useTranslation();
  const [pacientes, setPacientes] = React.useState<PacienteTecnico[]>([]);
  const [aCarregar, setACarregar] = React.useState(true);
  const [search, setSearch] = React.useState('');

  // Modal de reatribuição
  const [pacienteReatribuir, setPacienteReatribuir] = React.useState<PacienteTecnico | null>(null);
  const [medicos, setMedicos] = React.useState<MedicoResumo[]>([]);
  const [novoMedicoId, setNovoMedicoId] = React.useState('');
  const [aReatribuir, setAReatribuir] = React.useState(false);
  const [toast, setToast] = React.useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const mostrarToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  React.useEffect(() => {
    getPacientesTecnico()
      .then(setPacientes)
      .finally(() => setACarregar(false));
  }, []);

  const abrirReatribuicao = async (p: PacienteTecnico) => {
    setPacienteReatribuir(p);
    setNovoMedicoId('');
    if (medicos.length === 0) {
      const lista = await getMedicos();
      setMedicos(lista);
    }
  };

  const confirmarReatribuicao = async () => {
    if (!pacienteReatribuir || !novoMedicoId) return;
    setAReatribuir(true);
    try {
      await reatribuirMedico(pacienteReatribuir.id, novoMedicoId);
      mostrarToast(t('patients.reassignSuccess'));
      setPacienteReatribuir(null);
    } catch (err) {
      mostrarToast(err instanceof Error ? err.message : t('patients.reassignError'), 'error');
    } finally {
      setAReatribuir(false);
    }
  };

  const filtrados = pacientes.filter(
    (p) =>
      p.nomeCompleto.toLowerCase().includes(search.toLowerCase()) ||
      (p.numeroUtente ?? '').toLowerCase().includes(search.toLowerCase()),
  );

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
              {[t('patients.colName'), t('patients.colUtenteShort'), t('patients.colAge'), t('patients.colGender'), t('patients.colLastExamShort'), t('patients.colExamCount'), t('patients.colActions')].map((h) => (
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
                  {Array.from({ length: 7 }).map((__, j) => (
                    <td key={j} className="px-4 py-4">
                      <div className="h-4 bg-[var(--scolio-page-surface)] rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : filtrados.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>
                  {search ? t('patients.noMatchSearch') : t('patients.noRegistered')}
                </td>
              </tr>
            ) : (
              filtrados.map((p) => (
                <tr key={p.id} className="border-b border-[var(--scolio-border-light)] hover:bg-[var(--scolio-page-surface)] transition-colors">
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
                        title={t('patients.reassignDoctor')}
                        onClick={() => abrirReatribuicao(p)}
                        className="p-1.5 text-[var(--scolio-text-secondary)] hover:text-[var(--scolio-success-green)] hover:bg-[var(--scolio-success-surface)] rounded transition-colors"
                      >
                        <UserCog className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {/* Modal reatribuição de médico */}
      {pacienteReatribuir && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[var(--radius-modal)] w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-[var(--scolio-border-light)]">
              <h2 className="text-[var(--scolio-text-primary)]">{t('patients.reassignDoctor')}</h2>
              <p className="text-[var(--scolio-text-secondary)] mt-1" style={{ fontSize: 'var(--text-body)' }}>
                {pacienteReatribuir.nomeCompleto}
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)' }}>
                  {t('patients.newDoctor')}
                </label>
                <select
                  value={novoMedicoId}
                  onChange={(e) => setNovoMedicoId(e.target.value)}
                  className="px-3 py-2 border border-[var(--scolio-border-light)] rounded-[var(--radius-component)] focus:outline-none focus:ring-2 focus:ring-[var(--scolio-success-green)]"
                >
                  <option value="">{t('newPatient.selectDoctor')}</option>
                  {medicos.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nomeCompleto}{m.especialidade ? ` — ${m.especialidade}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="p-6 border-t border-[var(--scolio-border-light)] flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setPacienteReatribuir(null)} disabled={aReatribuir}>
                {t('common.cancel')}
              </Button>
              <Button variant="primary" onClick={confirmarReatribuicao} disabled={!novoMedicoId || aReatribuir}>
                {aReatribuir ? t('common.saving') : t('common.confirm')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed top-8 right-8 z-50">
          <Toast title={toast.msg} type={toast.type} onClose={() => setToast(null)} />
        </div>
      )}
    </div>
  );
}
