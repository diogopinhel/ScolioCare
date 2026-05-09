import React from 'react';
import { Search, Download, ChevronDown } from 'lucide-react';
import { Button, Toast } from '../../components/scolio';
import { getAuditLog } from '../../../data/repository/admin';
import type { AuditLogEntry } from '../../../data/types';
import { useTranslation } from 'react-i18next';

function formatarDataHora(iso: string): string {
  return new Date(iso).toLocaleString('pt-PT', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

function categoriaDaTipoAcao(tipoAcao: string): string {
  const t = tipoAcao.toLowerCase();
  if (t.includes('login') || t.includes('logout') || t.includes('auth')) return 'AUTH';
  if (t.includes('glass') || t.includes('break')) return 'GLASSBREAK';
  if (t.includes('export')) return 'EXPORT';
  if (t.includes('config')) return 'CONFIG';
  return 'ESTUDO';
}

function categoriaStyle(cat: string, t: (key: string) => string) {
  const map: Record<string, { label: string; bg: string; fg: string }> = {
    AUTH:       { label: t('admin.catAuth'),       bg: 'var(--scolio-light-blue-surface)', fg: 'var(--scolio-primary-blue)' },
    ESTUDO:     { label: t('admin.catClinical'),   bg: 'var(--scolio-success-surface)',    fg: 'var(--scolio-success-green)' },
    GLASSBREAK: { label: t('admin.catGlassBreak'), bg: 'var(--scolio-danger-surface)',     fg: 'var(--scolio-danger-coral)' },
    CONFIG:     { label: t('admin.catConfig'),     bg: 'var(--scolio-warning-surface)',    fg: 'var(--scolio-warning-amber)' },
    EXPORT:     { label: t('admin.catExport'),     bg: 'var(--scolio-neutral-surface)',    fg: 'var(--scolio-neutral-gray)' },
  };
  return map[cat] ?? map['ESTUDO'];
}

export default function AdminAuditScreen() {
  const { t } = useTranslation();
  const [eventos, setEventos] = React.useState<AuditLogEntry[]>([]);
  const [aCarregar, setACarregar] = React.useState(true);
  const [pesquisa, setPesquisa] = React.useState('');
  const [categoriaFiltro, setCategoriaFiltro] = React.useState('all');
  const [toast, setToast] = React.useState<string | null>(null);

  const CATEGORIAS = [
    { label: t('admin.filterAll'), value: 'all' },
    { label: t('admin.filterAuth'), value: 'AUTH' },
    { label: t('admin.filterClinical'), value: 'ESTUDO' },
    { label: t('admin.filterGlassBreak'), value: 'GLASSBREAK' },
    { label: t('admin.filterConfig'), value: 'CONFIG' },
    { label: t('admin.filterExport'), value: 'EXPORT' },
  ];

  const mostrarToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  React.useEffect(() => {
    let cancelado = false;
    setACarregar(true);
    getAuditLog(undefined, 200)
      .then((data) => { if (!cancelado) setEventos(data); })
      .finally(() => { if (!cancelado) setACarregar(false); });
    return () => { cancelado = true; };
  }, []);

  // Filtragem client-side
  const filtrados = eventos.filter((e) => {
    const cat = categoriaDaTipoAcao(e.tipoAcao);
    const matchCat = categoriaFiltro === 'all' || cat === categoriaFiltro;
    const termo = pesquisa.toLowerCase();
    const matchPesquisa =
      !pesquisa ||
      (e.utilizadorSnapshot?.nome ?? '').toLowerCase().includes(termo) ||
      e.tipoAcao.toLowerCase().includes(termo) ||
      e.entidadeAfetada.toLowerCase().includes(termo) ||
      (e.ipOrigem ?? '').includes(pesquisa);
    return matchCat && matchPesquisa;
  });

  const exportarCSV = () => {
    const linhas = [
      ['ID', 'Data/Hora', 'Utilizador', 'Tipo de ação', 'Entidade', 'IP'].join(','),
      ...filtrados.map((e) => [
        e.id,
        e.dataHora,
        e.utilizadorSnapshot?.nome ?? '—',
        e.tipoAcao,
        e.entidadeAfetada,
        e.ipOrigem ?? '—',
      ].map((v) => `"${v}"`).join(',')),
    ];
    const blob = new Blob([linhas.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `auditoria-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    mostrarToast(t('admin.exportSuccess'));
  };

  return (
    <div className="p-8 space-y-6 overflow-auto h-full">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-[var(--scolio-text-primary)]">{t('admin.auditTitle')}</h1>
          <p className="text-[var(--scolio-text-secondary)] mt-1" style={{ fontSize: 'var(--text-body)' }}>
            {aCarregar ? t('common.loading') : t('admin.auditSubtitle', { filtered: filtrados.length, total: eventos.length })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={exportarCSV}>
            <Download className="w-4 h-4 mr-2 inline" /> {t('common.export')}
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-[var(--radius-card)] shadow-sm border border-[var(--scolio-border-light)] p-4">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--scolio-neutral-gray)]" />
            <input
              value={pesquisa}
              onChange={(e) => setPesquisa(e.target.value)}
              type="search"
              placeholder={t('admin.auditSearchPlaceholder')}
              className="w-full pl-10 pr-3 py-2 border border-[var(--scolio-border-light)] rounded-[var(--radius-component)] focus:outline-none focus:ring-2 focus:ring-[var(--scolio-primary-blue)]"
            />
          </div>
          <div className="w-48 relative">
            <select
              value={categoriaFiltro}
              onChange={(e) => setCategoriaFiltro(e.target.value)}
              className="w-full px-3 py-2 pr-10 border border-[var(--scolio-border-light)] rounded-[var(--radius-component)] focus:outline-none focus:ring-2 focus:ring-[var(--scolio-primary-blue)] appearance-none"
            >
              {CATEGORIAS.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
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
              {[t('admin.colDateTime'), t('admin.colUser'), t('admin.colActionType'), t('admin.colEntity'), t('admin.colIP'), t('admin.colCategory')].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-semibold)' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {aCarregar ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="border-b border-[var(--scolio-border-light)]">
                  {Array.from({ length: 6 }).map((__, j) => (
                    <td key={j} className="px-4 py-4">
                      <div className="h-4 bg-[var(--scolio-page-surface)] rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : filtrados.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>
                  {pesquisa || categoriaFiltro !== 'all' ? t('admin.noMatchEvents') : t('admin.noEvents')}
                </td>
              </tr>
            ) : (
              filtrados.map((e) => {
                const cat = categoriaDaTipoAcao(e.tipoAcao);
                const style = categoriaStyle(cat, t);
                return (
                  <tr key={e.id} className="border-b border-[var(--scolio-border-light)] hover:bg-[var(--scolio-page-surface)] transition-colors">
                    <td className="px-4 py-3 text-[var(--scolio-text-secondary)] font-mono" style={{ fontSize: 'var(--text-caption)' }}>
                      {formatarDataHora(e.dataHora)}
                    </td>
                    <td className="px-4 py-3 text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-body)' }}>
                      {e.utilizadorSnapshot?.nome ?? '—'}
                      {e.utilizadorSnapshot?.perfil && (
                        <span className="ml-2 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>
                          ({e.utilizadorSnapshot.perfil})
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-body)' }}>
                      {e.tipoAcao}
                    </td>
                    <td className="px-4 py-3 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>
                      {e.entidadeAfetada}
                      {e.entidadeId && (
                        <span className="ml-1 font-mono">·{e.entidadeId.slice(0, 8)}…</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[var(--scolio-text-secondary)] font-mono" style={{ fontSize: 'var(--text-caption)' }}>
                      {e.ipOrigem ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center px-2.5 py-1 rounded-full"
                        style={{ backgroundColor: style.bg, color: style.fg, fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-medium)' }}
                      >
                        {style.label}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {toast && (
        <div className="fixed top-8 right-8 z-50">
          <Toast title={toast} type="success" onClose={() => setToast(null)} />
        </div>
      )}
    </div>
  );
}
