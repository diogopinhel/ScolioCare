import React from 'react';
import { Power, CheckCircle, XCircle, UserPlus, Eye, EyeOff, Pencil, Loader2 } from 'lucide-react';
import { Button, Toast } from '../../components/scolio';
import {
  getUtilizadoresAdmin,
  toggleAtivoUtilizador,
  toggleBloqueioUtilizador,
  criarUtilizador,
  getUtilizadorCompleto,
  editarUtilizadorAdmin,
} from '../../../data/repository/admin';
import { getMedicos, alterarMedicoPaciente } from '../../../data/repository/pacientes';
import { supabase } from '../../../lib/supabase';
import type { DadosCriarUtilizador, CamposEdicaoUtilizador } from '../../../data/repository/admin';
import type { UtilizadorAdmin, UtilizadorAdminCompleto, MedicoResumo } from '../../../data/types';
import { useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useDateLocale } from '../../../lib/dateLocale';

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

function formatarData(iso: string | null, locale: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(locale, {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

type ConfirmAction = { kind: 'toggle_ativo' | 'toggle_bloqueio'; user: UtilizadorAdmin };

export default function AdminUsersScreen() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const dateLocale = useDateLocale();
  const [utilizadores, setUtilizadores] = React.useState<UtilizadorAdmin[]>([]);
  const [aCarregar, setACarregar] = React.useState(true);

  // Filtros
  const [perfilFiltro, setPerfilFiltro] = React.useState('all');
  const [estadoFiltro, setEstadoFiltro] = React.useState('all');
  const [pesquisa, setPesquisa] = React.useState(() => searchParams.get('q') ?? '');

  // Modal de confirmação (toggle ativo/bloqueio)
  const [confirm, setConfirm] = React.useState<ConfirmAction | null>(null);
  const [aConfirmar, setAConfirmar] = React.useState(false);

  // Modal de edição
  const [utilizadorEditar, setUtilizadorEditar] = React.useState<UtilizadorAdminCompleto | null>(null);
  const [aCarregarEditar, setACarregarEditar] = React.useState(false);
  const [aGuardar, setAGuardar] = React.useState(false);
  const [formEditar, setFormEditar] = React.useState<CamposEdicaoUtilizador>({ nomeCompleto: '' });
  // Reatribuição de médico (só para PACIENTE)
  const [medicos, setMedicos] = React.useState<MedicoResumo[]>([]);
  const [medicoIdOriginal, setMedicoIdOriginal] = React.useState<string>('');
  const [medicoIdSelecionado, setMedicoIdSelecionado] = React.useState<string>('');

  const abrirEditar = async (u: UtilizadorAdmin) => {
    setACarregarEditar(true);
    try {
      const [completo, listaMedicos] = await Promise.all([
        getUtilizadorCompleto(u.id),
        u.perfil === 'PACIENTE' ? getMedicos() : Promise.resolve([] as MedicoResumo[]),
      ]);
      if (completo) {
        setUtilizadorEditar(completo);
        setFormEditar({
          nomeCompleto:      completo.nomeCompleto ?? '',
          cedulaProfissional: completo.cedulaProfissional ?? '',
          especialidade:      completo.especialidade ?? '',
          codigoFuncionario:  completo.codigoFuncionario ?? '',
          departamento:       completo.departamento ?? '',
          dataNascimento:     completo.dataNascimento ?? '',
          genero:             completo.genero ?? '',
          numeroUtente:       completo.numeroUtente ?? '',
          contacto:           completo.contacto ?? '',
          morada:             completo.morada ?? '',
          cartaoCidadao:      completo.cartaoCidadao ?? '',
        });
        if (u.perfil === 'PACIENTE') {
          setMedicos(listaMedicos);
          // Carregar médico actual
          const { data } = await supabase.rpc('get_medico_responsavel', { p_paciente_id: u.id });
          const medicoAtual = (data as string | null) ?? '';
          setMedicoIdOriginal(medicoAtual);
          setMedicoIdSelecionado(medicoAtual);
        }
      }
    } finally {
      setACarregarEditar(false);
    }
  };

  const fecharEditar = () => {
    setUtilizadorEditar(null);
    setFormEditar({ nomeCompleto: '' });
    setMedicoIdOriginal('');
    setMedicoIdSelecionado('');
  };

  const submeterEdicao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!utilizadorEditar) return;
    setAGuardar(true);
    try {
      await editarUtilizadorAdmin(utilizadorEditar.id, utilizadorEditar.perfil, formEditar);
      // Reatribuir médico se mudou (só para PACIENTE)
      if (utilizadorEditar.perfil === 'PACIENTE' && medicoIdSelecionado && medicoIdSelecionado !== medicoIdOriginal) {
        await alterarMedicoPaciente(utilizadorEditar.id, medicoIdSelecionado);
      }
      setUtilizadores((prev) =>
        prev.map((u) => u.id === utilizadorEditar.id ? { ...u, nomeCompleto: formEditar.nomeCompleto } : u),
      );
      mostrarToast(t('admin.editSuccess'));
      fecharEditar();
    } catch {
      mostrarToast(t('admin.editError'), 'error');
    } finally {
      setAGuardar(false);
    }
  };

  // Modal de criação de utilizador
  const [modalAberto, setModalAberto] = React.useState(false);
  const [aCriar, setACriar] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const formularioVazio: DadosCriarUtilizador = {
    perfil: 'MEDICO',
    nomeCompleto: '',
    email: '',
    password: '',
    cedulaProfissional: '',
    especialidade: '',
    codigoFuncionario: '',
    departamento: '',
  };
  const [form, setForm] = React.useState<DadosCriarUtilizador>(formularioVazio);

  const fecharModal = () => {
    setModalAberto(false);
    setForm(formularioVazio);
    setShowPassword(false);
  };

  const submeterNovoUtilizador = async (e: React.FormEvent) => {
    e.preventDefault();
    setACriar(true);
    try {
      const { id } = await criarUtilizador(form);
      const novoUtilizador: UtilizadorAdmin = {
        id,
        nomeCompleto: form.nomeCompleto,
        perfil: form.perfil,
        ativo: true,
        contaBloqueada: false,
        twoFactorAtivo: false,
        ultimoLogin: null,
        dataCriacao: new Date().toISOString(),
      };
      setUtilizadores((prev) => [novoUtilizador, ...prev]);
      mostrarToast(t('admin.createSuccess'));
      fecharModal();
    } catch (err) {
      mostrarToast(err instanceof Error ? err.message : t('admin.createError'), 'error');
    } finally {
      setACriar(false);
    }
  };

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
        <Button variant="primary" onClick={() => setModalAberto(true)}>
          <UserPlus className="w-4 h-4 mr-2 inline" />
          {t('admin.newUser')}
        </Button>
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
                      {formatarData(u.ultimoLogin, dateLocale)}
                    </td>
                    {/* Criado em */}
                    <td className="px-4 py-3 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>
                      {formatarData(u.dataCriacao, dateLocale)}
                    </td>
                    {/* Ações */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          title={t('admin.editUser')}
                          onClick={() => abrirEditar(u)}
                          className="p-2 rounded text-[var(--scolio-text-secondary)] hover:text-[var(--scolio-primary-blue)] hover:bg-[var(--scolio-light-blue-surface)] transition-colors"
                        >
                          {aCarregarEditar ? <Loader2 className="w-4 h-4 animate-spin" /> : <Pencil className="w-4 h-4" />}
                        </button>
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
                      </div>
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

      {/* Modal editar utilizador */}
      {utilizadorEditar && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[var(--radius-modal)] w-full max-w-lg overflow-hidden">
            <div className="p-6 border-b border-[var(--scolio-border-light)]">
              <h2 className="text-[var(--scolio-text-primary)]">{t('admin.editUserTitle')}</h2>
              <p className="text-[var(--scolio-text-secondary)] mt-1" style={{ fontSize: 'var(--text-body)' }}>
                {utilizadorEditar.nomeCompleto}
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                  style={{ backgroundColor: 'var(--scolio-light-blue-surface)', color: 'var(--scolio-primary-blue)' }}>
                  {utilizadorEditar.perfil}
                </span>
              </p>
            </div>

            <form onSubmit={submeterEdicao}>
              <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                {/* Nome completo — todos os perfis */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)' }}>
                    {t('admin.fieldName')}
                  </label>
                  <input
                    required
                    type="text"
                    value={formEditar.nomeCompleto}
                    onChange={(e) => setFormEditar((f) => ({ ...f, nomeCompleto: e.target.value }))}
                    className="px-3 py-2 border border-[var(--scolio-border-light)] rounded-[var(--radius-component)] focus:outline-none focus:ring-2 focus:ring-[var(--scolio-primary-blue)]"
                  />
                </div>

                {/* MEDICO */}
                {utilizadorEditar.perfil === 'MEDICO' && (
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-[var(--scolio-border-light)]">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)' }}>
                        {t('admin.fieldCedula')}
                      </label>
                      <input type="text" value={formEditar.cedulaProfissional ?? ''}
                        onChange={(e) => setFormEditar((f) => ({ ...f, cedulaProfissional: e.target.value }))}
                        className="px-3 py-2 border border-[var(--scolio-border-light)] rounded-[var(--radius-component)] focus:outline-none focus:ring-2 focus:ring-[var(--scolio-primary-blue)]" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)' }}>
                        {t('admin.fieldEspecialidade')}
                      </label>
                      <input type="text" value={formEditar.especialidade ?? ''}
                        onChange={(e) => setFormEditar((f) => ({ ...f, especialidade: e.target.value }))}
                        className="px-3 py-2 border border-[var(--scolio-border-light)] rounded-[var(--radius-component)] focus:outline-none focus:ring-2 focus:ring-[var(--scolio-primary-blue)]" />
                    </div>
                  </div>
                )}

                {/* TECNICO */}
                {utilizadorEditar.perfil === 'TECNICO' && (
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-[var(--scolio-border-light)]">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)' }}>
                        {t('admin.fieldCodigoFuncionario')}
                      </label>
                      <input type="text" value={formEditar.codigoFuncionario ?? ''}
                        onChange={(e) => setFormEditar((f) => ({ ...f, codigoFuncionario: e.target.value }))}
                        className="px-3 py-2 border border-[var(--scolio-border-light)] rounded-[var(--radius-component)] focus:outline-none focus:ring-2 focus:ring-[var(--scolio-primary-blue)]" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)' }}>
                        {t('admin.fieldDepartamento')}
                      </label>
                      <input type="text" value={formEditar.departamento ?? ''}
                        onChange={(e) => setFormEditar((f) => ({ ...f, departamento: e.target.value }))}
                        className="px-3 py-2 border border-[var(--scolio-border-light)] rounded-[var(--radius-component)] focus:outline-none focus:ring-2 focus:ring-[var(--scolio-primary-blue)]" />
                    </div>
                  </div>
                )}

                {/* PACIENTE */}
                {utilizadorEditar.perfil === 'PACIENTE' && (
                  <div className="space-y-4 pt-2 border-t border-[var(--scolio-border-light)]">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)' }}>
                          {t('patientEdit.dob')}
                        </label>
                        <input type="date" value={formEditar.dataNascimento ?? ''}
                          onChange={(e) => setFormEditar((f) => ({ ...f, dataNascimento: e.target.value }))}
                          className="px-3 py-2 border border-[var(--scolio-border-light)] rounded-[var(--radius-component)] focus:outline-none focus:ring-2 focus:ring-[var(--scolio-primary-blue)]" />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)' }}>
                          {t('patientEdit.gender')}
                        </label>
                        <select value={formEditar.genero ?? ''}
                          onChange={(e) => setFormEditar((f) => ({ ...f, genero: e.target.value }))}
                          className="px-3 py-2 border border-[var(--scolio-border-light)] rounded-[var(--radius-component)] focus:outline-none focus:ring-2 focus:ring-[var(--scolio-primary-blue)]">
                          <option value="">{t('patientEdit.genderUnspecified')}</option>
                          <option value="female">{t('patientEdit.genderFemale')}</option>
                          <option value="male">{t('patientEdit.genderMale')}</option>
                          <option value="other">{t('patientEdit.genderOther')}</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)' }}>
                          {t('patientEdit.clinicalId')}
                        </label>
                        <input type="text" value={formEditar.numeroUtente ?? ''}
                          onChange={(e) => setFormEditar((f) => ({ ...f, numeroUtente: e.target.value }))}
                          className="px-3 py-2 border border-[var(--scolio-border-light)] rounded-[var(--radius-component)] focus:outline-none focus:ring-2 focus:ring-[var(--scolio-primary-blue)]" />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)' }}>
                          {t('patientEdit.citizenCard')}
                        </label>
                        <input type="text" value={formEditar.cartaoCidadao ?? ''}
                          onChange={(e) => setFormEditar((f) => ({ ...f, cartaoCidadao: e.target.value }))}
                          className="px-3 py-2 border border-[var(--scolio-border-light)] rounded-[var(--radius-component)] focus:outline-none focus:ring-2 focus:ring-[var(--scolio-primary-blue)]" />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)' }}>
                        {t('patientEdit.phone')}
                      </label>
                      <input type="tel" value={formEditar.contacto ?? ''}
                        onChange={(e) => setFormEditar((f) => ({ ...f, contacto: e.target.value }))}
                        className="px-3 py-2 border border-[var(--scolio-border-light)] rounded-[var(--radius-component)] focus:outline-none focus:ring-2 focus:ring-[var(--scolio-primary-blue)]" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)' }}>
                        {t('patientEdit.address')}
                      </label>
                      <input type="text" value={formEditar.morada ?? ''}
                        onChange={(e) => setFormEditar((f) => ({ ...f, morada: e.target.value }))}
                        className="px-3 py-2 border border-[var(--scolio-border-light)] rounded-[var(--radius-component)] focus:outline-none focus:ring-2 focus:ring-[var(--scolio-primary-blue)]" />
                    </div>
                    {/* Médico responsável */}
                    <div className="flex flex-col gap-1.5 pt-2 border-t border-[var(--scolio-border-light)]">
                      <label className="text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)' }}>
                        {t('patients.responsibleDoctor')}
                      </label>
                      <select
                        value={medicoIdSelecionado}
                        onChange={(e) => setMedicoIdSelecionado(e.target.value)}
                        className="px-3 py-2 border border-[var(--scolio-border-light)] rounded-[var(--radius-component)] focus:outline-none focus:ring-2 focus:ring-[var(--scolio-primary-blue)]"
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
                )}
              </div>

              <div className="p-6 border-t border-[var(--scolio-border-light)] flex justify-end gap-3">
                <Button type="button" variant="secondary" onClick={fecharEditar} disabled={aGuardar}>
                  {t('common.cancel')}
                </Button>
                <Button type="submit" variant="primary" disabled={aGuardar}>
                  {aGuardar ? t('common.saving') : t('common.save')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal criar utilizador */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[var(--radius-modal)] w-full max-w-lg overflow-hidden">
            <div className="p-6 border-b border-[var(--scolio-border-light)]">
              <h2 className="text-[var(--scolio-text-primary)]">{t('admin.newUserTitle')}</h2>
              <p className="text-[var(--scolio-text-secondary)] mt-1" style={{ fontSize: 'var(--text-body)' }}>
                {t('admin.newUserSubtitle')}
              </p>
            </div>

            <form onSubmit={submeterNovoUtilizador}>
              <div className="p-6 space-y-4">

                {/* Perfil */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)' }}>
                    {t('admin.fieldProfile')}
                  </label>
                  <select
                    required
                    value={form.perfil}
                    onChange={(e) => setForm((f) => ({ ...f, perfil: e.target.value as DadosCriarUtilizador['perfil'] }))}
                    className="px-3 py-2 border border-[var(--scolio-border-light)] rounded-[var(--radius-component)] focus:outline-none focus:ring-2 focus:ring-[var(--scolio-primary-blue)]"
                  >
                    <option value="MEDICO">{t('admin.profileDoctor')}</option>
                    <option value="TECNICO">{t('admin.profileTechnician')}</option>
                    <option value="ADMIN">{t('admin.profileAdmin')}</option>
                  </select>
                </div>

                {/* Nome completo */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)' }}>
                    {t('admin.fieldName')}
                  </label>
                  <input
                    required
                    type="text"
                    value={form.nomeCompleto}
                    onChange={(e) => setForm((f) => ({ ...f, nomeCompleto: e.target.value }))}
                    className="px-3 py-2 border border-[var(--scolio-border-light)] rounded-[var(--radius-component)] focus:outline-none focus:ring-2 focus:ring-[var(--scolio-primary-blue)]"
                  />
                </div>

                {/* Email */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)' }}>
                    {t('admin.fieldEmail')}
                  </label>
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    className="px-3 py-2 border border-[var(--scolio-border-light)] rounded-[var(--radius-component)] focus:outline-none focus:ring-2 focus:ring-[var(--scolio-primary-blue)]"
                  />
                </div>

                {/* Password */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)' }}>
                    {t('admin.fieldPassword')}
                  </label>
                  <div className="relative">
                    <input
                      required
                      minLength={8}
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                      className="px-3 py-2 pr-10 w-full border border-[var(--scolio-border-light)] rounded-[var(--radius-component)] focus:outline-none focus:ring-2 focus:ring-[var(--scolio-primary-blue)]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--scolio-neutral-gray)] hover:text-[var(--scolio-text-primary)]"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Campos específicos — MEDICO */}
                {form.perfil === 'MEDICO' && (
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-[var(--scolio-border-light)]">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)' }}>
                        {t('admin.fieldCedula')}
                      </label>
                      <input
                        type="text"
                        value={form.cedulaProfissional}
                        onChange={(e) => setForm((f) => ({ ...f, cedulaProfissional: e.target.value }))}
                        className="px-3 py-2 border border-[var(--scolio-border-light)] rounded-[var(--radius-component)] focus:outline-none focus:ring-2 focus:ring-[var(--scolio-primary-blue)]"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)' }}>
                        {t('admin.fieldEspecialidade')}
                      </label>
                      <input
                        type="text"
                        value={form.especialidade}
                        onChange={(e) => setForm((f) => ({ ...f, especialidade: e.target.value }))}
                        className="px-3 py-2 border border-[var(--scolio-border-light)] rounded-[var(--radius-component)] focus:outline-none focus:ring-2 focus:ring-[var(--scolio-primary-blue)]"
                      />
                    </div>
                  </div>
                )}

                {/* Campos específicos — TECNICO */}
                {form.perfil === 'TECNICO' && (
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-[var(--scolio-border-light)]">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)' }}>
                        {t('admin.fieldCodigoFuncionario')}
                      </label>
                      <input
                        type="text"
                        value={form.codigoFuncionario}
                        onChange={(e) => setForm((f) => ({ ...f, codigoFuncionario: e.target.value }))}
                        className="px-3 py-2 border border-[var(--scolio-border-light)] rounded-[var(--radius-component)] focus:outline-none focus:ring-2 focus:ring-[var(--scolio-primary-blue)]"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)' }}>
                        {t('admin.fieldDepartamento')}
                      </label>
                      <input
                        type="text"
                        value={form.departamento}
                        onChange={(e) => setForm((f) => ({ ...f, departamento: e.target.value }))}
                        className="px-3 py-2 border border-[var(--scolio-border-light)] rounded-[var(--radius-component)] focus:outline-none focus:ring-2 focus:ring-[var(--scolio-primary-blue)]"
                      />
                    </div>
                  </div>
                )}

              </div>

              <div className="p-6 border-t border-[var(--scolio-border-light)] flex justify-end gap-3">
                <Button type="button" variant="secondary" onClick={fecharModal} disabled={aCriar}>
                  {t('common.cancel')}
                </Button>
                <Button type="submit" variant="primary" disabled={aCriar}>
                  {aCriar ? t('admin.creating') : t('admin.newUser')}
                </Button>
              </div>
            </form>
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
