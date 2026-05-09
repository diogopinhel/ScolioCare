import React from 'react';
import { Power, CheckCircle, XCircle, Filter } from 'lucide-react';
import { Button, Toast } from '../../components/scolio';
import { getUtilizadoresAdmin, toggleAtivoUtilizador, toggleBloqueioUtilizador } from '../../../data/repository/admin';
import type { UtilizadorAdmin } from '../../../data/types';
import { useTranslation } from 'react-i18next';

function perfilStyle(perfil: string, t: (key: string) => string) {
  const map: Record<string, { bg: string; fg: string; label: string }> = {
    MEDICO:   { bg: 'var(--scolio-light-blue-surface)', fg: 'var(--scolio-primary-blue)', label: t('admin.profileDoctor') },
    TECNICO:  { bg: 'var(--scolio-success-surface)', fg: 'var(--scolio-success-green)', label: t('admin.profileTechnician') },
    ADMIN:    { bg: 'var(--scolio-warning-surface)', fg: 'var(--scolio-warning-amber)', label: t('admin.profileAdmin') },
    PACIENTE: { bg: 'var(--scolio-neutral-surface)', fg: 'var(--scolio-neutral-gray)', label: t('admin.profilePatient') },
  };
  return map[perfil] ?? { bg: 'var(--scolio-neutral-surface)', fg: 'var(--scolio-neutral-gray)', label: perfil };
}

function iniciais(nome: string): string {
  return nome.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
}

function formatarData(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('pt-PT', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

type ConfirmAction = { kind: 'toggle_ativo' | 'toggle_bloqueio'; user: UtilizadorAdmin };

export default function AdminUsersScreen() {
  const { t } = useTranslation();
  const [utilizadores, setUtilizadores] = React.useState<UtilizadorAdmin[]>([]);
  const [aCarregar, setACarregar] = React.useState(true);

  // Filtros
  const [perfilFiltro, setPerfilFiltro] = React.useState('all');
  const [estadoFiltro, setEstadoFiltro] = React.useState('all');
  const [pesquisa, setPesquisa] = React.useState('');

  // Modal de confirmação
  const [confirm, setConfirm] = React.useState<ConfirmAction | null>(null);
  const [aConfirmar, setAConfirmar] = React.useState(false);

  // Toast
  const [toast, setToast] = React.useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const mostrarToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  React.useEffect(() => {
    getUtilizadoresAdmin()
      .then(setUtilizadores)
      .finally(() => setACarregar(false));
  }, []);

  const filtrados = utilizadores.filter((u) => {
    const matchPerfil = perfilFiltro === 'all' || u.perfil === perfilFiltro;
    const matchEstado =
      estadoFiltro === 'all' ||
      (estadoFiltro === 'ativo' && u.ativo) ||
      (estadoFiltro === 'inativo' && !u.ativo);
    const matchPesquisa =
      !pesquisa || u.nomeCompleto.toLowerCase().includes(pesquisa.toLowerCase());
    return matchPerfil && matchEstado && matchPesquisa;
  });

  const executarConfirmacao = async () => {
    if (!confirm) return;
    setAConfirmar(true);
    try {
      const u = confirm.user;
      if (confirm.kind === 'toggle_ativo') {
        await toggleAtivoUtilizador(u.id, !u.ativo);
        setUtilizadores((prev) =>
          prev.map((x) => x.id === u.id ? { ...x, ativo: !u.ativo } : x),
        );
        mostrarToast(!u.ativo ? t('admin.activateSuccess') : t('admin.deactivateSuccess'));
      } else {
        await toggleBloqueioUtilizador(u.id, !u.contaBloqueada);
        setUtilizadores((prev) =>
          prev.map((x) => x.id === u.id ? { ...x, contaBloqueada: !u.contaBloqueada } : x),
        );
        mostrarToast(!u.contaBloqueada ? t('admin.blockSuccess') : t('admin.unblockSuccess'));
      }
      setConfirm(null);
    } catch {
      mostrarToast(t('admin.updateError'), 'error');
    } finally {
      setAConfirmar(false);
    }
  };

  return (
    <div className="p-8 space-y-6 overflow-auto h-full">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-[var(--scolio-text-primary)]">{t('admin.usersTitle')}</h1>
          <p className="text-[var(--scolio-text-secondary)] mt-1" style={{ fontSize: 'var(--text-body)' }}>
            {aCarregar ? t('common.loading') : t('admin.usersSubtitle', { filtered: filtrados.length, total: utilizadores.length })}
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-[var(--radius-card)] shadow-sm border border-[var(--scolio-border-light)] p-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <input
              value={pesquisa}
              onChange={(e) => setPesquisa(e.target.value)}
              type="search"
              placeholder={t('admin.searchUsers')}
              className="w-full px-3 py-2 border border-[var(--scolio-border-light)] rounded-[var(--radius-component)] focus:outline-none focus:ring-2 focus:ring-[var(--scolio-primary-blue)]"
            />
          </div>
          <select
            value={perfilFiltro}
            onChange={(e) => setPerfilFiltro(e.target.value)}
            className="w-36 px-3 py-2 border border-[var(--scolio-border-light)] rounded-[var(--radius-component)]"
          >
            <option value="all">{t('common.allProfiles')}</option>
            <option value="MEDICO">{t('admin.profileDoctor')}</option>
            <option value="TECNICO">{t('admin.profileTechnician')}</option>
            <option value="ADMIN">{t('admin.profileAdmin')}</option>
            <option value="PACIENTE">{t('admin.profilePatient')}</option>
          </select>
          <select
            value={estadoFiltro}
            onChange={(e) => setEstadoFiltro(e.target.value)}
            className="w-36 px-3 py-2 border border-[var(--scolio-border-light)] rounded-[var(--radius-component)]"
          >
            <option value="all">{t('common.allStatuses')}</option>
            <option value="ativo">{t('common.active')}</option>
            <option value="inativo">{t('common.inactive')}</option>
          </select>
          <Button variant="secondary">
            <Filter className="w-4 h-4 mr-2 inline" />{t('common.apply')}
          </Button>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-[var(--radius-card)] shadow-sm border border-[var(--scolio-border-light)] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--scolio-border-light)] bg-[var(--scolio-page-surface)]">
              {[t('admin.colUser'), t('admin.colProfile'), t('admin.colStatus'), t('admin.col2FA'), t('admin.colLastAccess'), t('admin.colCreatedAt'), t('common.actions')].map((h) => (
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
                  {t('admin.noMatchUsers')}
                </td>
              </tr>
            ) : (
              filtrados.map((u) => {
                const ps = perfilStyle(u.perfil, t);
                return (
                  <tr key={u.id} className="border-b border-[var(--scolio-border-light)] hover:bg-[var(--scolio-page-surface)]">
                    {/* Nome */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center text-white font-medium flex-shrink-0"
                          style={{ backgroundColor: 'var(--scolio-primary-blue)', fontSize: 'var(--text-caption)' }}
                        >
                          {iniciais(u.nomeCompleto)}
                        </div>
                        <div>
                          <p className="text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-body)' }}>
                            {u.nomeCompleto}
                          </p>
                          <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>
                            {u.contaBloqueada ? t('admin.blocked') : ''}
                          </p>
                        </div>
                      </div>
                    </td>
                    {/* Perfil */}
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center px-3 py-1 rounded-full"
                        style={{ backgroundColor: ps.bg, color: ps.fg, fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-medium)' }}
                      >
                        {ps.label}
                      </span>
                    </td>
                    {/* Toggle ativo */}
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setConfirm({ kind: 'toggle_ativo', user: u })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          u.ativo ? 'bg-[var(--scolio-success-green)]' : 'bg-[var(--scolio-neutral-gray)]'
                        }`}
                        title={u.ativo ? t('admin.clickDeactivate') : t('admin.clickActivate')}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            u.ativo ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </td>
                    {/* 2FA */}
                    <td className="px-4 py-3">
                      {u.twoFactorAtivo
                        ? <CheckCircle className="w-5 h-5 text-[var(--scolio-success-green)]" />
                        : <XCircle className="w-5 h-5 text-[var(--scolio-neutral-gray)]" />}
                    </td>
                    {/* Último acesso */}
                    <td className="px-4 py-3 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>
                      {formatarData(u.ultimoLogin)}
                    </td>
                    {/* Criado em */}
                    <td className="px-4 py-3 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>
                      {formatarData(u.dataCriacao)}
                    </td>
                    {/* Ações */}
                    <td className="px-4 py-3">
                      <button
                        title={u.contaBloqueada ? t('admin.clickUnblock') : t('admin.clickBlock')}
                        onClick={() => setConfirm({ kind: 'toggle_bloqueio', user: u })}
                        className={`p-2 rounded transition-colors ${
                          u.contaBloqueada
                            ? 'text-[var(--scolio-danger-coral)] hover:bg-[var(--scolio-danger-surface)]'
                            : 'text-[var(--scolio-text-secondary)] hover:text-[var(--scolio-danger-coral)] hover:bg-[var(--scolio-danger-surface)]'
                        }`}
                      >
                        <Power className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de confirmação */}
      {confirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-[var(--radius-modal)] w-[460px] overflow-hidden">
            <div className="p-6">
              <h2 className="text-[var(--scolio-text-primary)] mb-2">
                {confirm.kind === 'toggle_ativo'
                  ? (confirm.user.ativo ? t('admin.deactivateTitle') : t('admin.activateTitle'))
                  : (confirm.user.contaBloqueada ? t('admin.unblockTitle') : t('admin.blockTitle'))}
              </h2>
              <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>
                {confirm.kind === 'toggle_ativo'
                  ? (confirm.user.ativo ? t('admin.deactivateMsg', { name: confirm.user.nomeCompleto }) : t('admin.activateMsg', { name: confirm.user.nomeCompleto }))
                  : (confirm.user.contaBloqueada ? t('admin.unblockMsg', { name: confirm.user.nomeCompleto }) : t('admin.blockMsg', { name: confirm.user.nomeCompleto }))}
              </p>
            </div>
            <div className="p-6 border-t border-[var(--scolio-border-light)] flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setConfirm(null)} disabled={aConfirmar}>
                {t('common.cancel')}
              </Button>
              <Button
                variant="primary"
                className={
                  (confirm.kind === 'toggle_ativo' && confirm.user.ativo) ||
                  (confirm.kind === 'toggle_bloqueio' && !confirm.user.contaBloqueada)
                    ? 'bg-[var(--scolio-danger-coral)] hover:bg-[#C24D25]'
                    : ''
                }
                onClick={executarConfirmacao}
                disabled={aConfirmar}
              >
                {aConfirmar ? t('common.confirming') : t('common.confirm')}
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
