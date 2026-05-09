import React from 'react';
import { useNavigate } from 'react-router';
import { Search, UserPlus } from 'lucide-react';
import { Button } from '../../components/scolio';
import { getPacientesTecnico } from '../../../data/repository/tecnico';
import type { PacienteTecnico } from '../../../data/types';

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

export default function TecnicoPatientsScreen() {
  const navigate = useNavigate();
  const [pacientes, setPacientes] = React.useState<PacienteTecnico[]>([]);
  const [aCarregar, setACarregar] = React.useState(true);
  const [search, setSearch] = React.useState('');

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

  return (
    <div className="p-8 space-y-6 overflow-auto h-full">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-[var(--scolio-text-primary)]">Pacientes</h1>
          <p className="text-[var(--scolio-text-secondary)] mt-1" style={{ fontSize: 'var(--text-body)' }}>
            Vista operacional. Notas clínicas e relatórios estão restritos ao médico.
          </p>
        </div>
        <Button variant="primary" onClick={() => navigate('/tecnico/patients/new')}>
          <UserPlus className="w-4 h-4 mr-2" />
          Novo paciente
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
            placeholder="Pesquisar por nome ou nº utente..."
            className="w-full pl-10 pr-3 py-2 border border-[var(--scolio-border-light)] rounded-[var(--radius-component)] focus:outline-none focus:ring-2 focus:ring-[var(--scolio-success-green)]"
          />
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-[var(--radius-card)] shadow-sm border border-[var(--scolio-border-light)] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--scolio-border-light)] bg-[var(--scolio-page-surface)]">
              {['NOME', 'Nº UTENTE', 'IDADE', 'GÉNERO', 'ÚLTIMO EXAME', 'Nº EXAMES', 'AÇÕES'].map((h) => (
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
                  {search ? 'Nenhum paciente corresponde à pesquisa.' : 'Sem pacientes registados.'}
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
                    {calcularIdade(p.dataNascimento)}
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
                    <button
                      onClick={() => navigate('/tecnico/upload')}
                      className="px-3 py-1 text-[var(--scolio-success-green)] border border-[var(--scolio-success-green)] rounded-[var(--radius-component)] hover:bg-[var(--scolio-success-surface)] transition-colors"
                      style={{ fontSize: 'var(--text-caption)' }}
                    >
                      Novo exame
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
