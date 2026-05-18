import React from 'react';
import { Bell, ClipboardCheck, ShieldAlert, FileText, User, Settings, CheckCheck } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../auth/AuthContext';
import {
  getNotificacoesUtilizador,
  marcarComoLida,
  marcarTodasComoLidas,
  resolverLink,
  type NotificacaoItem,
  type TipoNotificacao,
} from '../../data/repository/notificacoes';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function tempoRelativo(dataISO: string, t: (k: string, opts?: Record<string, unknown>) => string): string {
  const diff = Date.now() - new Date(dataISO).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return t('common.timeJustNow');
  if (min < 60) return t('common.timeMinutes', { count: min });
  const h = Math.floor(min / 60);
  if (h < 24) return t('common.timeHours', { count: h });
  return t('common.timeDays', { count: Math.floor(h / 24) });
}

function iconePorTipo(tipo: TipoNotificacao) {
  switch (tipo) {
    case 'EXAME':      return <ClipboardCheck className="w-4 h-4 text-[var(--scolio-primary-blue)]" />;
    case 'RELATORIO':  return <FileText className="w-4 h-4 text-[var(--scolio-success-green)]" />;
    case 'GLASS_BREAK':return <ShieldAlert className="w-4 h-4 text-[var(--scolio-danger-coral)]" />;
    case 'PACIENTE':   return <User className="w-4 h-4 text-[var(--scolio-primary-blue)]" />;
    case 'SISTEMA':    return <Settings className="w-4 h-4 text-[var(--scolio-neutral-gray)]" />;
  }
}

// ─── Componente principal ─────────────────────────────────────────────────────

interface NotificationDropdownProps {
  /** Cor do outline ao abrir o dropdown (adapta ao layout) */
  focusColor?: string;
  /** Intervalo de refresh em ms (default 10 000) */
  intervalo?: number;
}

export function NotificationDropdown({
  focusColor = 'var(--scolio-primary-blue)',
  intervalo = 10_000,
}: NotificationDropdownProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { utilizador } = useAuth();
  const perfil = utilizador?.perfil ?? 'MEDICO';

  const [aberto, setAberto] = React.useState(false);
  const [notificacoes, setNotificacoes] = React.useState<NotificacaoItem[]>([]);
  const [aCarregar, setACarregar] = React.useState(true);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const carregar = React.useCallback(async () => {
    try {
      const dados = await getNotificacoesUtilizador();
      setNotificacoes(dados);
    } catch {
      // falha silenciosa — não interrompe a UI
    } finally {
      setACarregar(false);
    }
  }, []);

  // Fetch inicial + polling
  React.useEffect(() => {
    carregar();
    const timer = setInterval(carregar, intervalo);
    return () => clearInterval(timer);
  }, [carregar, intervalo]);

  // Fechar ao clicar fora
  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setAberto(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const naoLidas = notificacoes.filter((n) => !n.lida);
  const badgeCount = naoLidas.length > 9 ? '9+' : String(naoLidas.length);

  const handleClickNotificacao = async (n: NotificacaoItem) => {
    setAberto(false);
    if (!n.lida) {
      // Marca como lida localmente de imediato (optimistic update)
      setNotificacoes((prev) =>
        prev.map((item) => item.id === n.id ? { ...item, lida: true } : item),
      );
      await marcarComoLida(n.id);
    }
    const link = resolverLink(n.referenciaEntidade, n.referenciaId, perfil);
    navigate(link);
  };

  const handleMarcarTodas = async () => {
    setNotificacoes((prev) => prev.map((n) => ({ ...n, lida: true })));
    await marcarTodasComoLidas();
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* Botão sino */}
      <button
        type="button"
        onClick={() => setAberto((prev) => !prev)}
        className="relative p-2 text-[var(--scolio-text-secondary)] hover:text-[var(--scolio-text-primary)] transition-colors rounded-lg hover:bg-[var(--scolio-page-surface)]"
        aria-label={t('common.notifications')}
        style={{ outline: aberto ? `2px solid ${focusColor}` : undefined }}
      >
        <Bell className="w-5 h-5" />
        {naoLidas.length > 0 && (
          <span
            className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-0.5 bg-[var(--scolio-danger-coral)] text-white font-bold rounded-full flex items-center justify-center"
            style={{ fontSize: '10px' }}
          >
            {badgeCount}
          </span>
        )}
      </button>

      {/* Painel dropdown */}
      {aberto && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-[var(--radius-card)] shadow-xl border border-[var(--scolio-border-light)] z-50 overflow-hidden">

          {/* Cabeçalho */}
          <div className="px-4 py-3 border-b border-[var(--scolio-border-light)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3
                className="text-[var(--scolio-text-primary)]"
                style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-semibold)' }}
              >
                {t('common.notifications')}
              </h3>
              {naoLidas.length > 0 && (
                <span
                  className="px-2 py-0.5 bg-[var(--scolio-danger-surface)] text-[var(--scolio-danger-coral)] rounded-full font-semibold"
                  style={{ fontSize: '10px' }}
                >
                  {t('common.unreadCount', { count: naoLidas.length })}
                </span>
              )}
            </div>
            {naoLidas.length > 0 && (
              <button
                onClick={handleMarcarTodas}
                className="flex items-center gap-1 text-[var(--scolio-primary-blue)] hover:opacity-80 transition-opacity"
                style={{ fontSize: 'var(--text-caption)' }}
                title="Marcar todas como lidas"
              >
                <CheckCheck className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Lista */}
          <div className="max-h-[400px] overflow-y-auto divide-y divide-[var(--scolio-border-light)]">
            {aCarregar ? (
              <div
                className="p-6 text-center text-[var(--scolio-text-secondary)]"
                style={{ fontSize: 'var(--text-body)' }}
              >
                {t('common.loading')}
              </div>
            ) : notificacoes.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <Bell className="w-8 h-8 text-[var(--scolio-neutral-gray)] mx-auto" />
                <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>
                  {t('common.noNotifications')}
                </p>
              </div>
            ) : (
              notificacoes.map((n) => (
                <button
                  key={n.id}
                  className={`w-full text-left px-4 py-3 transition-colors flex items-start gap-3 ${
                    n.lida
                      ? 'hover:bg-[var(--scolio-page-surface)]'
                      : 'bg-[var(--scolio-light-blue-surface)] hover:bg-blue-50'
                  }`}
                  onClick={() => handleClickNotificacao(n)}
                >
                  {/* Ícone + ponto não lida */}
                  <div className="relative mt-0.5 flex-shrink-0">
                    {iconePorTipo(n.tipo)}
                    {!n.lida && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-[var(--scolio-danger-coral)] rounded-full" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p
                      className="text-[var(--scolio-text-primary)] truncate"
                      style={{
                        fontSize: 'var(--text-body)',
                        fontWeight: n.lida ? 'var(--weight-normal)' : 'var(--weight-semibold)',
                      }}
                    >
                      {n.titulo}
                    </p>
                    <p
                      className="text-[var(--scolio-text-secondary)] line-clamp-2 mt-0.5"
                      style={{ fontSize: 'var(--text-caption)', lineHeight: '1.4' }}
                    >
                      {n.mensagem}
                    </p>
                  </div>

                  <span
                    className="text-[var(--scolio-text-secondary)] flex-shrink-0 mt-0.5"
                    style={{ fontSize: 'var(--text-caption)' }}
                  >
                    {tempoRelativo(n.dataEnvio, t)}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
