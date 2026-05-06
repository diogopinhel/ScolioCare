import React, { useState, useEffect } from 'react';
import { Eye, Edit, Archive, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { Button, SearchBar, StatusBadge, TableSkeleton } from '../../components/scolio';
import type { BadgeStatus } from '../../components/scolio';
import { useNavigate } from 'react-router';
import { useAuth } from '../../auth/AuthContext';
import { getPacientesListagem } from '../../../data/repository/pacientes';
import type { PacienteListagem, EstadoEstudo } from '../../../data/types';

// ─── Helpers ────────────────────────────────────────────────────────────────

function exibirGenero(genero: string | null): string {
  if (!genero) return '—';
  const g = genero.toLowerCase();
  if (g.startsWith('f')) return 'Feminino';
  if (g.startsWith('m')) return 'Masculino';
  return genero;
}

function badgeStatusPorEstado(estado: EstadoEstudo | null): BadgeStatus {
  if (!estado) return 'pending';
  switch (estado) {
    case 'UPLOADED':           return 'pending';
    case 'PROCESSING':         return 'in-analysis';
    case 'PENDING_VALIDATION': return 'analyzed';
    case 'VALIDATED':          return 'analyzed';
    case 'DIAGNOSED':          return 'analyzed';
    case 'SENT':               return 'analyzed';
    case 'ARCHIVED':           return 'archived';
    default:                   return 'pending';
  }
}

function formatarData(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-PT', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function calcularPaginasVisiveis(pagAtual: number, totalPags: number): (number | '...')[] {
  if (totalPags <= 7) return Array.from({ length: totalPags }, (_, i) => i + 1);
  const items: (number | '...')[] = [1];
  if (pagAtual > 3) items.push('...');
  for (let i = Math.max(2, pagAtual - 1); i <= Math.min(totalPags - 1, pagAtual + 1); i++) {
    items.push(i);
  }
  if (pagAtual < totalPags - 2) items.push('...');
  items.push(totalPags);
  return items;
}

// ─── Ecrã principal ─────────────────────────────────────────────────────────

export default function PatientListScreen() {
  const { utilizador } = useAuth();
  const navigate = useNavigate();

  const [aCarregar, setACarregar] = useState(true);
  const [todosPacientes, setTodosPacientes] = useState<PacienteListagem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGender, setSelectedGender] = useState('all');
  const [perPage, setPerPage] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [patientToArchive, setPatientToArchive] = useState<{ id: string; nome: string } | null>(null);

  const nomeMedico = utilizador ? `Dr. ${utilizador.nomeCompleto}` : '—';

  useEffect(() => {
    let cancelado = false;

    // Timeout de segurança: se o Supabase demorar mais de 15 s (cold start ou
    // renovação de token em curso), para o carregamento em vez de ficar preso.
    const timeout = window.setTimeout(() => {
      if (!cancelado) setACarregar(false);
    }, 15000);

    async function carregar() {
      setACarregar(true);
      try {
        const lista = await getPacientesListagem();
        if (!cancelado) setTodosPacientes(lista);
      } finally {
        clearTimeout(timeout);
        if (!cancelado) setACarregar(false);
      }
    }

    carregar();
    return () => {
      cancelado = true;
      clearTimeout(timeout);
    };
  }, []);

  // Repõe a página 1 sempre que os filtros ou o número por página mudam
  useEffect(() => { setCurrentPage(1); }, [searchQuery, selectedGender, perPage]);

  // Filtragem client-side
  const filtrados = todosPacientes.filter((p) => {
    const matchPesquisa = !searchQuery ||
      p.nomeCompleto.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.numeroUtente.toLowerCase().includes(searchQuery.toLowerCase());
    const matchGenero = selectedGender === 'all' ||
      (selectedGender === 'f' && (p.genero?.toLowerCase().startsWith('f') ?? false)) ||
      (selectedGender === 'm' && (p.genero?.toLowerCase().startsWith('m') ?? false));
    return matchPesquisa && matchGenero;
  });

  const totalFiltrado = filtrados.length;
  const totalPaginas = Math.max(1, Math.ceil(totalFiltrado / perPage));
  const paginaAtual = Math.min(currentPage, totalPaginas);
  const from = (paginaAtual - 1) * perPage;
  const pacientesNaPagina = filtrados.slice(from, from + perPage);
  const paginasVisiveis = calcularPaginasVisiveis(paginaAtual, totalPaginas);

  const handleArchiveClick = (id: string, nome: string) => {
    setPatientToArchive({ id, nome });
    setShowArchiveModal(true);
  };

  const confirmArchive = () => {
    setShowArchiveModal(false);
    setPatientToArchive(null);
  };

  return (
    <div className="p-8 space-y-6 overflow-auto h-full">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <h1 className="text-[var(--scolio-text-primary)]">Pacientes</h1>
        <Button variant="primary" onClick={() => navigate('/patients/new')}>Novo paciente</Button>
      </div>

      {/* Pesquisa e filtros */}
      <div className="bg-white rounded-[var(--radius-card)] shadow-sm border border-[var(--scolio-border-light)] p-6">
        <div className="flex gap-4">
          <div className="flex-1">
            <SearchBar
              placeholder="Pesquisar por nome ou número de utente..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Filtro de género */}
          <div className="w-40 relative">
            <select
              value={selectedGender}
              onChange={(e) => setSelectedGender(e.target.value)}
              className="w-full px-3 py-2 pr-10 border border-[var(--scolio-border-light)] rounded-[var(--radius-component)] focus:outline-none focus:ring-2 focus:ring-[var(--scolio-primary-blue)] focus:border-transparent appearance-none"
            >
              <option value="all">Todos os géneros</option>
              <option value="f">Feminino</option>
              <option value="m">Masculino</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--scolio-neutral-gray)] pointer-events-none" />
          </div>

          {/* Filtro de faixa etária */}
          <div className="w-40 relative">
            <select className="w-full px-3 py-2 pr-10 border border-[var(--scolio-border-light)] rounded-[var(--radius-component)] focus:outline-none focus:ring-2 focus:ring-[var(--scolio-primary-blue)] focus:border-transparent appearance-none">
              <option value="all">Todas as idades</option>
              <option value="0-18">0–18 anos</option>
              <option value="19-40">19–40 anos</option>
              <option value="41-60">41–60 anos</option>
              <option value="60+">60+ anos</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--scolio-neutral-gray)] pointer-events-none" />
          </div>

          {/* Ordenação */}
          <div className="w-44 relative">
            <select className="w-full px-3 py-2 pr-10 border border-[var(--scolio-border-light)] rounded-[var(--radius-component)] focus:outline-none focus:ring-2 focus:ring-[var(--scolio-primary-blue)] focus:border-transparent appearance-none">
              <option value="name">Ordenar por nome</option>
              <option value="id">Ordenar por ID</option>
              <option value="date">Ordenar por último exame</option>
              <option value="exams">Ordenar por número de exames</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--scolio-neutral-gray)] pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Tabela de dados */}
      <div className="bg-white rounded-[var(--radius-card)] shadow-sm border border-[var(--scolio-border-light)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[var(--scolio-page-surface)] border-b border-[var(--scolio-border-light)]">
                {['PACIENTE', 'NÚMERO DE UTENTE', 'DATA DE NASCIMENTO', 'GÉNERO', 'MÉDICO', 'EXAMES', 'ÚLTIMO EXAME', 'ESTADO', 'AÇÕES'].map((col) => (
                  <th
                    key={col}
                    className="text-left px-6 py-3 text-[var(--scolio-text-secondary)]"
                    style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-semibold)' }}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {aCarregar ? (
                <tr>
                  <td colSpan={9} className="px-6 py-6">
                    <TableSkeleton rows={8} cols={9} />
                  </td>
                </tr>
              ) : pacientesNaPagina.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-6 py-12 text-center text-[var(--scolio-text-secondary)]"
                    style={{ fontSize: 'var(--text-body)' }}
                  >
                    {searchQuery || selectedGender !== 'all'
                      ? 'Nenhum paciente corresponde aos filtros aplicados.'
                      : 'Sem pacientes associados.'}
                  </td>
                </tr>
              ) : (
                pacientesNaPagina.map((patient) => (
                  <tr
                    key={patient.id}
                    className={`border-b border-[var(--scolio-border-light)] transition-colors ${
                      hoveredRow === patient.id ? 'bg-[var(--scolio-light-blue-surface)]' : 'bg-white'
                    }`}
                    onMouseEnter={() => setHoveredRow(patient.id)}
                    onMouseLeave={() => setHoveredRow(null)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[var(--scolio-primary-blue)] flex items-center justify-center text-white font-medium flex-shrink-0">
                          {patient.nomeCompleto.split(' ').map((n) => n[0]).join('')}
                        </div>
                        <span className="text-[var(--scolio-text-primary)] font-medium" style={{ fontSize: 'var(--text-body)' }}>
                          {patient.nomeCompleto}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>
                      {patient.numeroUtente}
                    </td>
                    <td className="px-6 py-4 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>
                      {formatarData(patient.dataNascimento)}
                    </td>
                    <td className="px-6 py-4 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>
                      {exibirGenero(patient.genero)}
                    </td>
                    <td className="px-6 py-4 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>
                      {nomeMedico}
                    </td>
                    <td className="px-6 py-4 text-[var(--scolio-text-primary)] font-medium" style={{ fontSize: 'var(--text-body)' }}>
                      {patient.totalExames}
                    </td>
                    <td className="px-6 py-4 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>
                      {formatarData(patient.ultimoExame)}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={badgeStatusPorEstado(patient.estadoUltimoExame)} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          className="p-1.5 text-[var(--scolio-text-secondary)] hover:text-[var(--scolio-primary-blue)] hover:bg-[var(--scolio-light-blue-surface)] rounded transition-colors"
                          title="Ver paciente"
                          onClick={() => navigate(`/patients/${patient.id}`)}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          className="p-1.5 text-[var(--scolio-text-secondary)] hover:text-[var(--scolio-primary-blue)] hover:bg-[var(--scolio-light-blue-surface)] rounded transition-colors"
                          title="Editar paciente"
                          onClick={() => navigate(`/patients/${patient.id}/edit`)}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          className="p-1.5 text-[var(--scolio-text-secondary)] hover:text-[var(--scolio-danger-coral)] hover:bg-[var(--scolio-danger-surface)] rounded transition-colors"
                          title="Arquivar paciente"
                          onClick={() => handleArchiveClick(patient.id, patient.nomeCompleto)}
                        >
                          <Archive className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Rodapé de paginação */}
        <div className="flex items-center justify-between px-6 py-4 bg-[var(--scolio-page-surface)] border-t border-[var(--scolio-border-light)]">
          <div className="flex items-center gap-4">
            <span className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>
              {aCarregar
                ? 'A carregar...'
                : totalFiltrado === 0
                ? 'Sem resultados'
                : `Mostrando ${from + 1}–${Math.min(from + perPage, totalFiltrado)} de ${totalFiltrado} paciente${totalFiltrado !== 1 ? 's' : ''}`}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>Por página:</span>
              <select
                value={perPage}
                onChange={(e) => setPerPage(Number(e.target.value))}
                className="w-20 px-3 py-2 pr-8 border border-[var(--scolio-border-light)] rounded-[var(--radius-component)] focus:outline-none focus:ring-2 focus:ring-[var(--scolio-primary-blue)] focus:border-transparent appearance-none"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          {!aCarregar && totalPaginas > 1 && (
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                className="px-3 py-2"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div className="flex items-center gap-1">
                {paginasVisiveis.map((item, idx) =>
                  item === '...' ? (
                    <span key={`ellipsis-${idx}`} className="px-2 text-[var(--scolio-text-secondary)]">...</span>
                  ) : (
                    <button
                      key={item}
                      onClick={() => setCurrentPage(item as number)}
                      className={`px-3 py-2 rounded-[var(--radius-component)] ${
                        item === paginaAtual
                          ? 'bg-[var(--scolio-primary-blue)] text-white'
                          : 'text-[var(--scolio-text-secondary)] hover:bg-[var(--scolio-page-surface)]'
                      }`}
                      style={{ fontSize: 'var(--text-body)' }}
                    >
                      {item}
                    </button>
                  )
                )}
              </div>
              <Button
                variant="secondary"
                className="px-3 py-2"
                onClick={() => setCurrentPage((p) => Math.min(totalPaginas, p + 1))}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Modal de confirmação de arquivo */}
      {showArchiveModal && patientToArchive && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-[var(--radius-modal)] shadow-lg w-[480px] max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[var(--scolio-border-light)]">
              <h2 className="text-[var(--scolio-text-primary)]">Arquivar paciente</h2>
            </div>
            <div className="p-6">
              <p className="text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-body)' }}>
                Tem a certeza que pretende arquivar este paciente?
              </p>
              <p className="text-[var(--scolio-text-secondary)] mt-2" style={{ fontSize: 'var(--text-body)' }}>
                <strong>{patientToArchive.nome}</strong>
              </p>
            </div>
            <div className="p-6 border-t border-[var(--scolio-border-light)] flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => { setShowArchiveModal(false); setPatientToArchive(null); }}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={confirmArchive}
                className="bg-[var(--scolio-danger-coral)] hover:bg-[#C24D25]"
              >
                Arquivar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
