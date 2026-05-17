import React, { useState, useEffect } from 'react';
import { Eye, Archive, ChevronLeft, ChevronRight, ChevronDown, ShieldAlert, Search, Loader2, Lock, UserCheck } from 'lucide-react';
import { Button, SearchBar, StatusBadge, TableSkeleton } from '../../components/scolio';
import type { BadgeStatus } from '../../components/scolio';
import { useNavigate } from 'react-router';
import { useAuth } from '../../auth/AuthContext';
import { useTranslation } from 'react-i18next';
import { useDateLocale } from '../../../lib/dateLocale';
import { getPacientesListagem, pesquisarPacientesGlobal } from '../../../data/repository/pacientes';
import type { PacienteListagem, EstadoEstudo } from '../../../data/types';
import type { PacienteResultadoGlobal } from '../../../data/repository/pacientes';

// ─── Helpers ────────────────────────────────────────────────────────────────

function exibirGenero(genero: string | null, t: (key: string) => string): string {
  if (!genero) return '—';
  const g = genero.toLowerCase();
  if (g.startsWith('f')) return t('patients.female');
  if (g.startsWith('m')) return t('patients.male');
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

function formatarData(iso: string | null, locale: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(locale, {
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
  const { t } = useTranslation();
  const dateLocale = useDateLocale();

  const [aCarregar, setACarregar] = useState(true);
  const [todosPacientes, setTodosPacientes] = useState<PacienteListagem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGender, setSelectedGender] = useState('all');
  const [selectedAgeRange, setSelectedAgeRange] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [perPage, setPerPage] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [patientToArchive, setPatientToArchive] = useState<{ id: string; nome: string } | null>(null);

  // ── Estado do painel de acesso de emergência ─────────────────────────────
  const [mostrarEmergencia, setMostrarEmergencia] = useState(false);
  const [pesquisaEmergencia, setPesquisaEmergencia] = useState('');
  const [resultadosEmergencia, setResultadosEmergencia] = useState<PacienteResultadoGlobal[]>([]);
  const [aCarregarEmergencia, setACarregarEmergencia] = useState(false);
  const [pesquisaEfetuada, setPesquisaEfetuada] = useState(false);

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
  useEffect(() => { setCurrentPage(1); }, [searchQuery, selectedGender, selectedAgeRange, sortBy, perPage]);

  // Filtro de idade — calcula a idade a partir de dataNascimento
  function calcularIdade(dataNasc: string | null): number | null {
    if (!dataNasc) return null;
    const nasc = new Date(dataNasc);
    const hoje = new Date();
    let idade = hoje.getFullYear() - nasc.getFullYear();
    const m = hoje.getMonth() - nasc.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
    return idade;
  }

  // Filtragem + ordenação client-side
  const filtrados = todosPacientes
    .filter((p) => {
      const matchPesquisa = !searchQuery ||
        p.nomeCompleto.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.numeroUtente.toLowerCase().includes(searchQuery.toLowerCase());
      const matchGenero = selectedGender === 'all' ||
        (selectedGender === 'f' && (p.genero?.toLowerCase().startsWith('f') ?? false)) ||
        (selectedGender === 'm' && (p.genero?.toLowerCase().startsWith('m') ?? false));
      const idade = calcularIdade(p.dataNascimento);
      const matchIdade = selectedAgeRange === 'all' || (() => {
        if (idade === null) return false;
        if (selectedAgeRange === '0-18') return idade <= 18;
        if (selectedAgeRange === '19-40') return idade >= 19 && idade <= 40;
        if (selectedAgeRange === '41-60') return idade >= 41 && idade <= 60;
        if (selectedAgeRange === '60+') return idade > 60;
        return true;
      })();
      return matchPesquisa && matchGenero && matchIdade;
    })
    .sort((a, b) => {
      if (sortBy === 'name') return a.nomeCompleto.localeCompare(b.nomeCompleto, 'pt');
      if (sortBy === 'date') {
        if (!a.ultimoExame && !b.ultimoExame) return 0;
        if (!a.ultimoExame) return 1;
        if (!b.ultimoExame) return -1;
        return new Date(b.ultimoExame).getTime() - new Date(a.ultimoExame).getTime();
      }
      if (sortBy === 'exams') return b.totalExames - a.totalExames;
      return 0;
    });

  const totalFiltrado = filtrados.length;
  const totalPaginas = Math.max(1, Math.ceil(totalFiltrado / perPage));
  const paginaAtual = Math.min(currentPage, totalPaginas);
  const from = (paginaAtual - 1) * perPage;
  const pacientesNaPagina = filtrados.slice(from, from + perPage);
  const paginasVisiveis = calcularPaginasVisiveis(paginaAtual, totalPaginas);

  // IDs dos pacientes já associados ao médico (para sinalizar no painel de emergência)
  const idsAssociados = React.useMemo(() => new Set(todosPacientes.map((p) => p.id)), [todosPacientes]);

  // Pesquisa global com debounce de 400 ms
  useEffect(() => {
    if (!pesquisaEmergencia.trim()) {
      setResultadosEmergencia([]);
      setPesquisaEfetuada(false);
      return;
    }
    const timer = window.setTimeout(async () => {
      setACarregarEmergencia(true);
      try {
        const res = await pesquisarPacientesGlobal(pesquisaEmergencia);
        setResultadosEmergencia(res);
        setPesquisaEfetuada(true);
      } finally {
        setACarregarEmergencia(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [pesquisaEmergencia]);

  const handleArchiveClick = (id: string, nome: string) => {
    setPatientToArchive({ id, nome });
    setShowArchiveModal(true);
  };

  const confirmArchive = () => {
    // A gestão de associações médico-paciente (encerrar data_fim em paciente_medico)
    // requer permissão de ADMIN. O médico deve contactar o administrador para
    // remover a associação ou desativar a conta do paciente.
    setShowArchiveModal(false);
    setPatientToArchive(null);
  };

  return (
    <div className="p-8 space-y-6 overflow-auto h-full">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <h1 className="text-[var(--scolio-text-primary)]">{t('patients.title')}</h1>
      </div>

      {/* Pesquisa e filtros */}
      <div className="bg-white rounded-[var(--radius-card)] shadow-sm border border-[var(--scolio-border-light)] p-6">
        <div className="flex gap-4">
          <div className="flex-1">
            <SearchBar
              placeholder={t('patients.searchPlaceholder')}
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
              <option value="all">{t('patients.allGenders')}</option>
              <option value="f">{t('patients.female')}</option>
              <option value="m">{t('patients.male')}</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--scolio-neutral-gray)] pointer-events-none" />
          </div>

          {/* Filtro de faixa etária */}
          <div className="w-40 relative">
            <select
              value={selectedAgeRange}
              onChange={(e) => setSelectedAgeRange(e.target.value)}
              className="w-full px-3 py-2 pr-10 border border-[var(--scolio-border-light)] rounded-[var(--radius-component)] focus:outline-none focus:ring-2 focus:ring-[var(--scolio-primary-blue)] focus:border-transparent appearance-none"
            >
              <option value="all">{t('patients.allAges')}</option>
              <option value="0-18">0–18</option>
              <option value="19-40">19–40</option>
              <option value="41-60">41–60</option>
              <option value="60+">60+</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--scolio-neutral-gray)] pointer-events-none" />
          </div>

          {/* Ordenação */}
          <div className="w-44 relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 pr-10 border border-[var(--scolio-border-light)] rounded-[var(--radius-component)] focus:outline-none focus:ring-2 focus:ring-[var(--scolio-primary-blue)] focus:border-transparent appearance-none"
            >
              <option value="name">{t('patients.sortByName')}</option>
              <option value="date">{t('patients.sortByLastExam')}</option>
              <option value="exams">{t('patients.sortByExamCount')}</option>
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
                {[t('patients.colPatient'), t('patients.colUtente'), t('patients.colDob'), t('patients.colGender'), t('patients.colDoctor'), t('patients.colExams'), t('patients.colLastExam'), t('patients.colStatus'), t('patients.colActions')].map((col) => (
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
                      ? t('patients.noMatchFilters')
                      : t('patients.noPatients')}
                  </td>
                </tr>
              ) : (
                pacientesNaPagina.map((patient) => (
                  <tr
                    key={patient.id}
                    className={`border-b border-[var(--scolio-border-light)] transition-colors cursor-pointer ${
                      hoveredRow === patient.id ? 'bg-[var(--scolio-light-blue-surface)]' : 'bg-white'
                    }`}
                    onMouseEnter={() => setHoveredRow(patient.id)}
                    onMouseLeave={() => setHoveredRow(null)}
                    onClick={() => navigate(`/patients/${patient.id}`)}
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
                      {formatarData(patient.dataNascimento, dateLocale)}
                    </td>
                    <td className="px-6 py-4 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>
                      {exibirGenero(patient.genero, t)}
                    </td>
                    <td className="px-6 py-4 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>
                      {nomeMedico}
                    </td>
                    <td className="px-6 py-4 text-[var(--scolio-text-primary)] font-medium" style={{ fontSize: 'var(--text-body)' }}>
                      {patient.totalExames}
                    </td>
                    <td className="px-6 py-4 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>
                      {formatarData(patient.ultimoExame, dateLocale)}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={badgeStatusPorEstado(patient.estadoUltimoExame)} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          className="p-1.5 text-[var(--scolio-text-secondary)] hover:text-[var(--scolio-primary-blue)] hover:bg-[var(--scolio-light-blue-surface)] rounded transition-colors"
                          title={t('patients.viewPatient')}
                          onClick={() => navigate(`/patients/${patient.id}`)}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          className="p-1.5 text-[var(--scolio-text-secondary)] hover:text-[var(--scolio-danger-coral)] hover:bg-[var(--scolio-danger-surface)] rounded transition-colors"
                          title={t('patients.archivePatient')}
                          onClick={(e) => { e.stopPropagation(); handleArchiveClick(patient.id, patient.nomeCompleto); }}
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
                ? t('common.loading')
                : totalFiltrado === 0
                ? t('common.noResults')
                : totalFiltrado === 1
                  ? t('patients.showing', { from: from + 1, to: Math.min(from + perPage, totalFiltrado), total: totalFiltrado })
                  : t('patients.showingPlural', { from: from + 1, to: Math.min(from + perPage, totalFiltrado), total: totalFiltrado })}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>{t('common.perPage')}</span>
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

      {/* ── Painel de acesso de emergência (Glass-Break) ── */}
      <div className="bg-white rounded-[var(--radius-card)] shadow-sm border border-[var(--scolio-border-light)] overflow-hidden">
        {/* Cabeçalho colapsável */}
        <button
          onClick={() => { setMostrarEmergencia(!mostrarEmergencia); setPesquisaEmergencia(''); setResultadosEmergencia([]); setPesquisaEfetuada(false); }}
          className="w-full flex items-center justify-between px-6 py-4 hover:bg-[var(--scolio-page-surface)] transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--scolio-danger-surface)] flex items-center justify-center">
              <ShieldAlert className="w-4 h-4 text-[var(--scolio-danger-coral)]" />
            </div>
            <div className="text-left">
              <p className="text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-semibold)' }}>
                {t('patients.emergencyAccess')}
              </p>
              <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>
                {t('patients.emergencyDesc')}
              </p>
            </div>
          </div>
          <ChevronDown className={`w-5 h-5 text-[var(--scolio-text-secondary)] transition-transform ${mostrarEmergencia ? 'rotate-180' : ''}`} />
        </button>

        {mostrarEmergencia && (
          <div className="border-t border-[var(--scolio-border-light)] p-6 space-y-5">
            {/* Aviso */}
            <div className="flex items-start gap-3 p-4 bg-[var(--scolio-warning-surface)] border border-[var(--scolio-warning-amber)] rounded-[var(--radius-component)]">
              <ShieldAlert className="w-5 h-5 text-[var(--scolio-warning-amber)] flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)' }}>
                  {t('patients.emergencyProtocol')}
                </p>
                <p className="text-[var(--scolio-text-secondary)] mt-1" style={{ fontSize: 'var(--text-caption)' }}>
                  {t('patients.emergencyWarning')}
                </p>
              </div>
            </div>

            {/* Pesquisa */}
            <div>
              <label className="block text-[var(--scolio-text-primary)] mb-2" style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)' }}>
                {t('patients.searchPatient')}
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--scolio-neutral-gray)]" />
                <input
                  type="search"
                  value={pesquisaEmergencia}
                  onChange={(e) => setPesquisaEmergencia(e.target.value)}
                  placeholder={t('patients.searchMinChars')}
                  className="w-full pl-10 pr-4 py-2 border border-[var(--scolio-border-light)] rounded-[var(--radius-component)] focus:outline-none focus:ring-2 focus:ring-[var(--scolio-danger-coral)]"
                />
                {aCarregarEmergencia && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-[var(--scolio-neutral-gray)]" />
                )}
              </div>
            </div>

            {/* Resultados */}
            {pesquisaEfetuada && (
              <div className="space-y-2">
                {resultadosEmergencia.length === 0 ? (
                  <p className="text-center text-[var(--scolio-text-secondary)] py-4" style={{ fontSize: 'var(--text-body)' }}>
                    {t('patients.noPatientFound')}
                  </p>
                ) : (
                  resultadosEmergencia.map((p) => {
                    const associado = idsAssociados.has(p.id);
                    const idade = p.dataNascimento
                      ? (() => {
                          const nasc = new Date(p.dataNascimento);
                          const hoje = new Date();
                          let i = hoje.getFullYear() - nasc.getFullYear();
                          if (hoje.getMonth() - nasc.getMonth() < 0) i--;
                          return `${i} anos`;
                        })()
                      : null;

                    return (
                      <div
                        key={p.id}
                        className={`flex items-center justify-between p-4 rounded-[var(--radius-component)] border ${
                          associado
                            ? 'border-[var(--scolio-border-light)] bg-[var(--scolio-page-surface)]'
                            : 'border-[var(--scolio-danger-coral)] border-opacity-40 bg-[var(--scolio-danger-surface)]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center text-white font-medium flex-shrink-0"
                            style={{ backgroundColor: associado ? 'var(--scolio-primary-blue)' : 'var(--scolio-danger-coral)', fontSize: 'var(--text-caption)' }}
                          >
                            {p.nomeCompleto.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)' }}>
                              {p.nomeCompleto}
                            </p>
                            <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>
                              {[p.numeroUtente, idade, p.genero].filter(Boolean).join(' · ')}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          {associado ? (
                            <>
                              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--scolio-success-surface)] text-[var(--scolio-success-green)]" style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-medium)' }}>
                                <UserCheck className="w-3.5 h-3.5" />
                                {t('patients.associated')}
                              </span>
                              <button
                                onClick={() => navigate(`/patients/${p.id}`)}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-[var(--scolio-primary-blue)] border border-[var(--scolio-primary-blue)] rounded-[var(--radius-component)] hover:bg-[var(--scolio-light-blue-surface)] transition-colors"
                                style={{ fontSize: 'var(--text-caption)' }}
                              >
                                <Eye className="w-3.5 h-3.5" />
                                {t('patients.viewRecord')}
                              </button>
                            </>
                          ) : (
                            <>
                              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--scolio-danger-surface)] text-[var(--scolio-danger-coral)]" style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-medium)' }}>
                                <Lock className="w-3.5 h-3.5" />
                                {t('patients.notAssociated')}
                              </span>
                              <button
                                onClick={() => navigate(`/glass-break/${p.id}`)}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-white bg-[var(--scolio-danger-coral)] rounded-[var(--radius-component)] hover:bg-[#C24D25] transition-colors"
                                style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-medium)' }}
                              >
                                <ShieldAlert className="w-3.5 h-3.5" />
                                {t('patients.emergencyAccessButton')}
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal de confirmação de arquivo */}
      {showArchiveModal && patientToArchive && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-[var(--radius-modal)] shadow-lg w-[480px] max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[var(--scolio-border-light)]">
              <h2 className="text-[var(--scolio-text-primary)]">{t('patients.archiveTitle')}</h2>
            </div>
            <div className="p-6 space-y-3">
              <p className="text-[var(--scolio-text-primary)] font-medium" style={{ fontSize: 'var(--text-body)' }}>
                {patientToArchive.nome}
              </p>
              <div className="p-4 bg-[var(--scolio-warning-surface)] border border-[var(--scolio-warning-amber)] rounded-[var(--radius-component)]">
                <p className="text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-body)' }}
                  dangerouslySetInnerHTML={{ __html: t('patients.archivePermission') }}
                />
              </div>
            </div>
            <div className="p-6 border-t border-[var(--scolio-border-light)] flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => { setShowArchiveModal(false); setPatientToArchive(null); }}
              >
                {t('common.close')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
