import React from 'react';
import { FileSearch, Trash2, FileText, ShieldCheck, AlertTriangle, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';
import { Button, Modal, Toast } from '../../components/scolio';
import { useTranslation } from 'react-i18next';
import { useDateLocale } from '../../../lib/dateLocale';
import { getRgpdPedidos, atualizarRgpdPedido } from '../../../data/repository/admin';
import type { RgpdPedido, EstadoRgpdPedido } from '../../../data/types';

const TIPO_LABEL: Record<string, string> = {
  ACESSO:        'Acesso (Art.º 15)',
  APAGAMENTO:    'Apagamento (Art.º 17)',
  PORTABILIDADE: 'Portabilidade (Art.º 20)',
  RETIFICACAO:   'Retificação (Art.º 16)',
};

const ESTADO_CONFIG: Record<EstadoRgpdPedido, { label: string; color: string; icon: React.ElementType }> = {
  PENDENTE:    { label: 'Pendente',    color: 'var(--scolio-warning-amber)', icon: Clock },
  EM_ANALISE:  { label: 'Em análise', color: 'var(--scolio-primary-blue)',  icon: FileSearch },
  CONCLUIDO:   { label: 'Concluído',  color: 'var(--scolio-success-green)', icon: CheckCircle },
  REJEITADO:   { label: 'Rejeitado',  color: 'var(--scolio-danger-coral)',  icon: XCircle },
};

function diasRestantes(prazo: string): number {
  return Math.ceil((new Date(prazo).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export default function AdminComplianceScreen() {
  const { t } = useTranslation();
  const dateLocale = useDateLocale();
  const [pedidos, setPedidos] = React.useState<RgpdPedido[]>([]);
  const [aCarregar, setACarregar] = React.useState(true);
  const [filtroEstado, setFiltroEstado] = React.useState<EstadoRgpdPedido | 'TODOS'>('TODOS');
  const [period, setPeriod] = React.useState<'30' | '90' | '365'>('90');
  const [modal, setModal] = React.useState<{ pedido: RgpdPedido; notas: string } | null>(null);
  const [aAtualizar, setAAtualizar] = React.useState(false);
  const [toast, setToast] = React.useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const mostrarToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const carregar = React.useCallback(() => {
    setACarregar(true);
    getRgpdPedidos()
      .then(setPedidos)
      .finally(() => setACarregar(false));
  }, []);

  React.useEffect(() => { carregar(); }, [carregar]);

  const pedidosFiltrados = pedidos.filter((p) => {
    if (filtroEstado !== 'TODOS' && p.estado !== filtroEstado) return false;
    const dias = Number(period);
    const limite = new Date(Date.now() - dias * 24 * 60 * 60 * 1000).toISOString();
    return p.dataPedido >= limite;
  });

  const pendentes   = pedidos.filter((p) => p.estado === 'PENDENTE').length;
  const emAnalise   = pedidos.filter((p) => p.estado === 'EM_ANALISE').length;
  const aExpirar    = pedidos.filter((p) => ['PENDENTE', 'EM_ANALISE'].includes(p.estado) && diasRestantes(p.prazo) <= 7).length;
  const conformidade = pedidos.length === 0 ? '—' : `${Math.round((pedidos.filter((p) => p.estado === 'CONCLUIDO').length / pedidos.length) * 100)}%`;

  const handleAtualizar = async (estado: EstadoRgpdPedido) => {
    if (!modal) return;
    setAAtualizar(true);
    try {
      await atualizarRgpdPedido(modal.pedido.id, estado, modal.notas || undefined);
      mostrarToast('Estado do pedido atualizado com sucesso.');
      setModal(null);
      carregar();
    } catch {
      mostrarToast('Erro ao atualizar o pedido. Tenta novamente.', 'error');
    } finally {
      setAAtualizar(false);
    }
  };

  return (
    <div className="p-8 space-y-6 overflow-auto h-full">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-[var(--scolio-text-primary)]">{t('admin.complianceTitle')}</h1>
          <p className="text-[var(--scolio-text-secondary)] mt-1" style={{ fontSize: 'var(--text-body)' }}>{t('admin.complianceSubtitle')}</p>
        </div>
        <Button variant="primary" onClick={carregar} disabled={aCarregar}>
          <FileText className="w-4 h-4 mr-2 inline" />{t('admin.generateReport')}
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-6">
        <KPI icon={FileSearch}    color="var(--scolio-primary-blue)"  bg="var(--scolio-light-blue-surface)" label={t('admin.artAccess')}          value={String(pendentes)}    sub={t('admin.inProgress')} />
        <KPI icon={Trash2}        color="var(--scolio-danger-coral)"  bg="var(--scolio-danger-surface)"     label={t('admin.artErasure')}         value={String(emAnalise)}    sub={t('admin.awaitingEval')} />
        <KPI icon={ShieldCheck}   color="var(--scolio-success-green)" bg="var(--scolio-success-surface)"    label={t('admin.conformity')}         value={conformidade}         sub={pedidos.length === 0 ? t('admin.noSufficientData') : 'pedidos concluídos'} />
        <KPI icon={AlertTriangle} color="var(--scolio-warning-amber)" bg="var(--scolio-warning-surface)"   label={t('admin.expiringDeadlines')}  value={String(aExpirar)}     sub={t('admin.next7days')} />
      </div>

      {/* Tabela de pedidos */}
      <div className="bg-white rounded-[var(--radius-card)] shadow-sm border border-[var(--scolio-border-light)] overflow-hidden">
        <div className="p-6 flex items-start justify-between">
          <div>
            <h3 className="text-[var(--scolio-text-primary)]">{t('admin.dataRequests')}</h3>
            <p className="text-[var(--scolio-text-secondary)] mt-1" style={{ fontSize: 'var(--text-caption)' }}>{t('admin.dataRequestsDesc')}</p>
          </div>
          {/* Filtro de estado */}
          <div className="flex items-center gap-2">
            {(['TODOS', 'PENDENTE', 'EM_ANALISE', 'CONCLUIDO', 'REJEITADO'] as const).map((e) => (
              <button
                key={e}
                onClick={() => setFiltroEstado(e)}
                className={`px-3 py-1.5 rounded-[var(--radius-component)] transition-colors ${filtroEstado === e ? 'bg-[var(--scolio-primary-blue)] text-white' : 'bg-[var(--scolio-page-surface)] text-[var(--scolio-text-secondary)]'}`}
                style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-medium)' }}
              >
                {e === 'TODOS' ? 'Todos' : ESTADO_CONFIG[e as EstadoRgpdPedido].label}
              </button>
            ))}
          </div>
        </div>

        {aCarregar ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-[var(--scolio-primary-blue)]" />
          </div>
        ) : pedidosFiltrados.length === 0 ? (
          <div className="px-6 pb-12 text-center">
            <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>
              {t('admin.noRequests')}
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-t border-[var(--scolio-border-light)] bg-[var(--scolio-page-surface)]">
                {['Paciente', 'Tipo', 'Estado', 'Data pedido', 'Prazo (dias)', ''].map((h) => (
                  <th key={h} className="px-6 py-3 text-left text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-semibold)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pedidosFiltrados.map((p) => {
                const cfg = ESTADO_CONFIG[p.estado];
                const EstadoIcon = cfg.icon;
                const dias = diasRestantes(p.prazo);
                const prazoUrgente = dias <= 7 && ['PENDENTE', 'EM_ANALISE'].includes(p.estado);
                return (
                  <tr key={p.id} className="border-t border-[var(--scolio-border-light)] hover:bg-[var(--scolio-page-surface)] transition-colors">
                    <td className="px-6 py-4 text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)' }}>{p.pacienteNome}</td>
                    <td className="px-6 py-4 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>{TIPO_LABEL[p.tipo] ?? p.tipo}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full" style={{ backgroundColor: `${cfg.color}18`, color: cfg.color, fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-medium)' }}>
                        <EstadoIcon className="w-3 h-3" />{cfg.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>
                      {new Date(p.dataPedido).toLocaleDateString(dateLocale)}
                    </td>
                    <td className="px-6 py-4" style={{ fontSize: 'var(--text-body)', color: prazoUrgente ? 'var(--scolio-danger-coral)' : 'var(--scolio-text-secondary)', fontWeight: prazoUrgente ? 'var(--weight-semibold)' : undefined }}>
                      {['CONCLUIDO', 'REJEITADO'].includes(p.estado) ? '—' : `${dias}d`}
                    </td>
                    <td className="px-6 py-4">
                      {!['CONCLUIDO', 'REJEITADO'].includes(p.estado) && (
                        <Button variant="secondary" onClick={() => setModal({ pedido: p, notas: p.notasAdmin ?? '' })}>
                          Gerir
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Relatório de compliance */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-[var(--radius-card)] shadow-sm border border-[var(--scolio-border-light)] p-6">
          <h3 className="text-[var(--scolio-text-primary)] mb-4">{t('admin.dataClassification')}</h3>
          <div className="space-y-2">
            {[
              { label: 'Dados de saúde (Art.º 9 RGPD)', value: 'Categoria especial', color: 'var(--scolio-danger-coral)' },
              { label: 'Dados de identificação', value: 'Dados pessoais', color: 'var(--scolio-warning-amber)' },
              { label: 'Dados de auditoria', value: 'Dados internos', color: 'var(--scolio-success-green)' },
              { label: 'Imagens de exame', value: 'Dados de saúde', color: 'var(--scolio-danger-coral)' },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex items-center justify-between p-3 bg-[var(--scolio-page-surface)] rounded-[var(--radius-component)]">
                <span className="text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-body)' }}>{label}</span>
                <span className="font-medium" style={{ fontSize: 'var(--text-caption)', color }}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-[var(--radius-card)] shadow-sm border border-[var(--scolio-border-light)] p-6">
          <h3 className="text-[var(--scolio-text-primary)] mb-4">{t('admin.autoReport')}</h3>
          <div className="flex items-center gap-2 mb-5">
            {(['30', '90', '365'] as const).map((p) => (
              <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1.5 rounded-[var(--radius-component)] transition-colors ${period === p ? 'bg-[var(--scolio-primary-blue)] text-white' : 'bg-[var(--scolio-page-surface)] text-[var(--scolio-text-secondary)]'}`} style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-medium)' }}>
                {p === '365' ? t('admin.lastYear') : p === '90' ? t('admin.last90days') : t('admin.last30days')}
              </button>
            ))}
          </div>
          <div className="space-y-2">
            {[
              { label: 'Pedidos recebidos', value: pedidosFiltrados.length },
              { label: 'Concluídos',        value: pedidosFiltrados.filter((p) => p.estado === 'CONCLUIDO').length },
              { label: 'Rejeitados',        value: pedidosFiltrados.filter((p) => p.estado === 'REJEITADO').length },
              { label: 'Pendentes',         value: pedidosFiltrados.filter((p) => p.estado === 'PENDENTE').length },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between p-3 bg-[var(--scolio-page-surface)] rounded-[var(--radius-component)]">
                <span className="text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-body)' }}>{label}</span>
                <span className="text-[var(--scolio-text-primary)] font-semibold" style={{ fontSize: 'var(--text-body)' }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal de gestão */}
      {modal && (
        <Modal
          isOpen
          onClose={() => setModal(null)}
          title={`Gerir pedido — ${TIPO_LABEL[modal.pedido.tipo] ?? modal.pedido.tipo}`}
          confirmLabel={aAtualizar ? 'A guardar…' : 'Concluir'}
          cancelLabel="Fechar"
          onConfirm={() => handleAtualizar('CONCLUIDO')}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[var(--scolio-text-secondary)] mb-1" style={{ fontSize: 'var(--text-caption)' }}>Paciente</p>
                <p className="text-[var(--scolio-text-primary)] font-medium" style={{ fontSize: 'var(--text-body)' }}>{modal.pedido.pacienteNome}</p>
              </div>
              <div>
                <p className="text-[var(--scolio-text-secondary)] mb-1" style={{ fontSize: 'var(--text-caption)' }}>Data do pedido</p>
                <p className="text-[var(--scolio-text-primary)] font-medium" style={{ fontSize: 'var(--text-body)' }}>{new Date(modal.pedido.dataPedido).toLocaleDateString(dateLocale)}</p>
              </div>
            </div>
            {modal.pedido.descricao && (
              <div>
                <p className="text-[var(--scolio-text-secondary)] mb-1" style={{ fontSize: 'var(--text-caption)' }}>Descrição do pedido</p>
                <p className="text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-body)' }}>{modal.pedido.descricao}</p>
              </div>
            )}
            <div>
              <label className="block text-[var(--scolio-text-primary)] mb-2" style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)' }}>
                Notas internas
              </label>
              <textarea
                value={modal.notas}
                onChange={(e) => setModal({ ...modal, notas: e.target.value })}
                rows={3}
                placeholder="Observações sobre o tratamento deste pedido…"
                className="w-full px-3 py-2 border border-[var(--scolio-border-light)] rounded-[var(--radius-component)] focus:outline-none focus:ring-2 focus:ring-[var(--scolio-primary-blue)] resize-none"
                style={{ fontSize: 'var(--text-body)' }}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={() => handleAtualizar('EM_ANALISE')} disabled={aAtualizar}>
                Marcar em análise
              </Button>
              <Button variant="secondary" className="flex-1 !text-[var(--scolio-danger-coral)] !border-[var(--scolio-danger-coral)]" onClick={() => handleAtualizar('REJEITADO')} disabled={aAtualizar}>
                Rejeitar
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {toast && (
        <div className="fixed top-8 right-8 z-50">
          <Toast title={toast.msg} type={toast.type} onClose={() => setToast(null)} />
        </div>
      )}
    </div>
  );
}

function KPI({ icon: Icon, color, bg, label, value, sub }: { icon: React.ElementType; color: string; bg: string; label: string; value: string; sub: string }) {
  return (
    <div className="bg-white rounded-[var(--radius-card)] shadow-sm border border-[var(--scolio-border-light)] p-6">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: bg }}>
          <Icon className="w-6 h-6" style={{ color }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>{label}</p>
          <p className="text-[var(--scolio-text-primary)] font-semibold mt-1" style={{ fontSize: 'var(--text-h2)' }}>{value}</p>
          <p className="text-[var(--scolio-text-secondary)] mt-1" style={{ fontSize: 'var(--text-caption)' }}>{sub}</p>
        </div>
      </div>
    </div>
  );
}
