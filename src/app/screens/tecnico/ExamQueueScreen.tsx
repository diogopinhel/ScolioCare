import React from 'react';
import { Eye, Archive, ChevronDown } from 'lucide-react';
import { Button, Toast } from '../../components/scolio';
import { useNavigate } from 'react-router';
import { useAuth } from '../../auth/AuthContext';
import { useTranslation } from 'react-i18next';
import { useDateLocale } from '../../../lib/dateLocale';
import { getFilaEstudos, arquivarEstudoTecnico } from '../../../data/repository/tecnico';
import type { EstudoFilaItem, EstadoEstudo } from '../../../data/types';

// ─── Helpers ────────────────────────────────────────────────────────────────

function estadoBadge(estado: EstadoEstudo, t: (key: string) => string) {
  const map: Record<string, { label: string; bg: string; fg: string }> = {
    UPLOADED:           { label: t('queue.statusUploaded'),   bg: 'var(--scolio-neutral-surface)',    fg: 'var(--scolio-neutral-gray)' },
    PROCESSING:         { label: t('queue.statusProcessing'), bg: 'var(--scolio-light-blue-surface)', fg: 'var(--scolio-primary-blue)' },
    PENDING_VALIDATION: { label: t('queue.statusReady'),      bg: 'var(--scolio-warning-surface)',    fg: 'var(--scolio-warning-amber)' },
    VALIDATED:          { label: t('queue.statusValidated'),  bg: 'var(--scolio-success-surface)',    fg: 'var(--scolio-success-green)' },
    DIAGNOSED:          { label: t('dashboard.statusDiagnosed'), bg: 'var(--scolio-success-surface)', fg: 'var(--scolio-success-green)' },
    SENT:               { label: t('dashboard.statusSent'),   bg: 'var(--scolio-success-surface)',    fg: 'var(--scolio-success-green)' },
    ARCHIVED:           { label: t('queue.statusArchived'),   bg: 'var(--scolio-neutral-surface)',    fg: 'var(--scolio-neutral-gray)' },
  };
  const c = map[estado] ?? map['UPLOADED'];
  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-full"
      style={{ backgroundColor: c.bg, color: c.fg, fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-medium)' }}
    >
      {c.label}
    </span>
  );
}

function formatarData(iso: string, locale: string): string {
  return new Date(iso).toLocaleString(locale, {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ─── Ecrã ────────────────────────────────────────────────────────────────────

// State options are built inside the component using t()

export default function ExamQueueScreen() {
  const navigate = useNavigate();
  const { utilizador } = useAuth();
  const { t } = useTranslation();
  const dateLocale = useDateLocale();

  const ESTADOS_OPCOES = [
    { label: t('queue.statusAll'), value: 'all' },
    { label: t('queue.statusUploaded'), value: 'UPLOADED' },
    { label: t('queue.statusProcessing'), value: 'PROCESSING' },
    { label: t('queue.statusReady'), value: 'PENDING_VALIDATION' },
    { label: t('queue.statusValidated'), value: 'VALIDATED' },
    { label: t('queue.statusArchived'), value: 'ARCHIVED' },
  ];

  const [aCarregar, setACarregar] = React.useState(true);
  const [todosExames, setTodosExames] = React.useState<EstudoFilaItem[]>([]);
  const [estadoFiltro, setEstadoFiltro] = React.useState('all');
  const [pesquisa, setPesquisa] = React.useState('');

  // Modal de arquivo
  const [archiveModal, setArchiveModal] = React.useState<{ id: string; estado: EstadoEstudo } | null>(null);
  const [archiveReason, setArchiveReason] = React.useState('');
  const [aArquivar, setAArquivar] = React.useState(false);

  // Toast
  const [toast, setToast] = React.useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const mostrarToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const carregar = React.useCallback(async () => {
    setACarregar(true);
    try {
      const dados = await getFilaEstudos();
      setTodosExames(dados);
    } finally {
      setACarregar(false);
    }
  }, []);

  React.useEffect(() => { carregar(); }, [carregar]);

  // Filtragem client-side
  const filtrados = todosExames.filter((ex) => {
    const matchEstado = estadoFiltro === 'all' || ex.estado === estadoFiltro;
    const matchPesquisa =
      !pesquisa ||
      ex.pacienteNome.toLowerCase().includes(pesquisa.toLowerCase()) ||
      ex.id.toLowerCase().includes(pesquisa.toLowerCase());
    return matchEstado && matchPesquisa;
  });

  const handleArquivar = async () => {
    if (!archiveModal || !utilizador || archiveReason.trim().length < 10) return;
    setAArquivar(true);
    try {
      await arquivarEstudoTecnico(
        archiveModal.id,
        archiveReason.trim(),
        utilizador.id,
        utilizador.nomeCompleto,
        archiveModal.estado,
      );
      setTodosExames((prev) => prev.filter((e) => e.id !== archiveModal.id));
      setArchiveModal(null);
      setArchiveReason('');
      mostrarToast(t('queue.archiveSuccess'));
    } catch {
      mostrarToast(t('queue.archiveError'), 'error');
    } finally {
      setAArquivar(false);
    }
  };

  return (
    <div className="p-8 space-y-6 overflow-auto h-full">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-[var(--scolio-text-primary)]">{t('queue.title')}</h1>
          <p className="text-[var(--scolio-text-secondary)] mt-1" style={{ fontSize: 'var(--text-body)' }}>
            {aCarregar ? t('common.loading') : t('queue.subtitle', { filtered: filtrados.length, total: todosExames.length })}
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-[var(--radius-card)] shadow-sm border border-[var(--scolio-border-light)] p-4">
        <div className="flex gap-4">
          {/* Pesquisa */}
          <div className="flex-1 relative">
            <input
              type="search"
              value={pesquisa}
              onChange={(e) => setPesquisa(e.target.value)}
              placeholder={t('queue.searchPlaceholder')}
              className="w-full px-3 py-2 border border-[var(--scolio-border-light)] rounded-[var(--radius-component)] focus:outline-none focus:ring-2 focus:ring-[var(--scolio-success-green)]"
            />
          </div>
          {/* Estado */}
          <div className="w-52 relative">
            <select
              value={estadoFiltro}
              onChange={(e) => setEstadoFiltro(e.target.value)}
              className="w-full px-3 py-2 pr-10 border border-[var(--scolio-border-light)] rounded-[var(--radius-component)] focus:outline-none focus:ring-2 focus:ring-[var(--scolio-success-green)] appearance-none"
            >
              {ESTADOS_OPCOES.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--scolio-neutral-gray)] pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-[var(--radius-card)] shadow-sm border border-[var(--scolio-border-light)] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--scolio-border-light)] bg-[var(--scolio-page-surface)]">
              {[t('queue.colPatient'), t('queue.colExamDate'), t('queue.colSubmitted'), t('queue.colStatus'), t('queue.colActions')].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-semibold)' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {aCarregar ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="border-b border-[var(--scolio-border-light)]">
                  {Array.from({ length: 5 }).map((__, j) => (
                    <td key={j} className="px-4 py-4">
                      <div className="h-4 bg-[var(--scolio-page-surface)] rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : filtrados.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>
                  {pesquisa || estadoFiltro !== 'all' ? t('queue.noMatchFilters') : t('queue.noExams')}
                </td>
              </tr>
            ) : (
              filtrados.map((ex) => (
                <tr
                  key={ex.id}
                  className="border-b border-[var(--scolio-border-light)] hover:bg-[var(--scolio-page-surface)] transition-colors"
                >
                  <td className="px-4 py-3">
                    <p className="text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-body)' }}>{ex.pacienteNome}</p>
                  </td>
                  <td className="px-4 py-3 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>
                    {new Date(ex.dataEstudo).toLocaleDateString(dateLocale)}
                  </td>
                  <td className="px-4 py-3 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>
                    {formatarData(ex.dataSubmissao, dateLocale)}
                  </td>
                  <td className="px-4 py-3">{estadoBadge(ex.estado, t)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        title={t('queue.viewExam')}
                        onClick={() => navigate(`/exam-viewer/${ex.id}`)}
                        className="p-2 text-[var(--scolio-text-secondary)] hover:text-[var(--scolio-success-green)] hover:bg-[var(--scolio-success-surface)] rounded transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {ex.estado !== 'ARCHIVED' && (
                        <button
                          title={t('queue.archiveExam')}
                          onClick={() => setArchiveModal({ id: ex.id, estado: ex.estado })}
                          className="p-2 text-[var(--scolio-text-secondary)] hover:text-[var(--scolio-danger-coral)] hover:bg-[var(--scolio-danger-surface)] rounded transition-colors"
                        >
                          <Archive className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de arquivo */}
      {archiveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-[var(--radius-modal)] w-[500px] overflow-hidden">
            <div className="p-6 border-b border-[var(--scolio-border-light)]">
              <h2 className="text-[var(--scolio-text-primary)]">{t('queue.archiveTitle')}</h2>
              <p className="text-[var(--scolio-text-secondary)] mt-1" style={{ fontSize: 'var(--text-body)' }}>
                {t('queue.archiveSubtitle')}
              </p>
            </div>
            <div className="p-6">
              <label className="block text-[var(--scolio-text-primary)] mb-2" style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)' }}>
                {t('queue.archiveReasonLabel')}
              </label>
              <textarea
                value={archiveReason}
                onChange={(e) => setArchiveReason(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-[var(--scolio-border-light)] rounded-[var(--radius-component)] focus:outline-none focus:ring-2 focus:ring-[var(--scolio-success-green)]"
                placeholder={t('queue.archiveReasonPlaceholder')}
              />
              <p
                className="mt-1"
                style={{
                  fontSize: 'var(--text-caption)',
                  color: archiveReason.trim().length >= 10 ? 'var(--scolio-success-green)' : 'var(--scolio-text-secondary)',
                }}
              >
                {t('queue.archiveMinChars', { count: archiveReason.trim().length })}
              </p>
            </div>
            <div className="p-6 border-t border-[var(--scolio-border-light)] flex justify-end gap-3">
              <Button variant="secondary" onClick={() => { setArchiveModal(null); setArchiveReason(''); }} disabled={aArquivar}>
                {t('common.cancel')}
              </Button>
              <Button
                variant="primary"
                className="bg-[var(--scolio-danger-coral)] hover:bg-[#C24D25]"
                onClick={handleArquivar}
                disabled={archiveReason.trim().length < 10 || aArquivar}
              >
                {aArquivar ? t('common.archiving') : t('common.archive')}
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
