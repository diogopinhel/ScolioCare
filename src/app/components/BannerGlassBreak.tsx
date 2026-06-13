import React from 'react';
import { useNavigate, useLocation } from 'react-router';
import { ShieldAlert, LogOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  getSessoesGlassBreakAtivas,
  encerrarGlassBreak,
  getResumoGlassBreak,
  type SessaoGlassBreak,
  type ResumoGlassBreak,
} from '../../data/repository/pacientes';
import { ResumoGlassBreakModal } from './ResumoGlassBreakModal';

function formatarRestante(dataExpiracao: string, agora: number): string {
  const restante = Math.max(0, Math.floor((new Date(dataExpiracao).getTime() - agora) / 1000));
  const m = String(Math.floor(restante / 60)).padStart(2, '0');
  const s = String(restante % 60).padStart(2, '0');
  return `${m}:${s}`;
}

const chaveSessao = (s: SessaoGlassBreak) => `${s.pacienteId}|${s.dataExpiracao}`;

/**
 * Banner global de acesso de emergência (glass-break). Renderizado no Layout do
 * médico, fica visível em TODOS os ecrãs enquanto houver uma sessão ativa — sem
 * isto, o "protocolo" desaparecia ao navegar para fora do GlassBreakScreen.
 *
 * Lê `glassbreak_log` via RPC e mostra o tempo real restante até `data_expiracao`
 * (fonte única de verdade). Permite terminar a sessão antes dos 15 min, e quando
 * a sessão acaba (manualmente ou por expiração) mostra um modal com o resumo das
 * ações realizadas durante o acesso.
 */
export function BannerGlassBreak() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const [sessoes, setSessoes] = React.useState<SessaoGlassBreak[]>([]);
  const [agora, setAgora] = React.useState(() => Date.now());
  const [aEncerrar, setAEncerrar] = React.useState<string | null>(null);
  const [resumo, setResumo] = React.useState<ResumoGlassBreak | null>(null);
  // Sessões cujo resumo já foi mostrado — evita reabrir o modal a cada tick.
  const resumosMostrados = React.useRef<Set<string>>(new Set());

  // Recarrega ao navegar — apanha uma sessão acabada de iniciar quando o médico
  // sai do GlassBreakScreen. RPC barato (indexado por medico_id).
  React.useEffect(() => {
    let cancelado = false;
    getSessoesGlassBreakAtivas()
      .then((s) => { if (!cancelado) setSessoes(s); })
      .catch(() => { /* best-effort — não bloqueia o Layout */ });
    return () => { cancelado = true; };
  }, [location.pathname]);

  // Tick de 1s: atualiza o contador e deteta a expiração.
  React.useEffect(() => {
    const id = setInterval(() => setAgora(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Quando uma sessão expira (sem ter sido terminada à mão), mostra o resumo e
  // tira o médico da ficha/visualizador do paciente — o acesso terminou.
  React.useEffect(() => {
    sessoes.forEach((s) => {
      if (new Date(s.dataExpiracao).getTime() <= agora && !resumosMostrados.current.has(chaveSessao(s))) {
        resumosMostrados.current.add(chaveSessao(s));
        navigate('/', { replace: true });
        getResumoGlassBreak(s.pacienteId).then((r) => { if (r) setResumo(r); }).catch(() => {});
      }
    });
  }, [agora, sessoes, navigate]);

  const terminar = async (s: SessaoGlassBreak) => {
    setAEncerrar(s.pacienteId);
    try {
      await encerrarGlassBreak(s.pacienteId);
      resumosMostrados.current.add(chaveSessao(s)); // não duplicar com a expiração
      setSessoes((prev) => prev.filter((x) => x.pacienteId !== s.pacienteId));
      // Sair já da ficha/visualizador do paciente — o acesso terminou.
      navigate('/', { replace: true });
      const r = await getResumoGlassBreak(s.pacienteId);
      if (r) setResumo(r);
    } catch {
      /* best-effort */
    } finally {
      setAEncerrar(null);
    }
  };

  const naGlassBreak = location.pathname.startsWith('/glass-break');
  const ativas = sessoes.filter((s) => new Date(s.dataExpiracao).getTime() > agora);

  return (
    <>
      {/* No próprio ecrã do protocolo não duplicar — ele já tem o seu banner. */}
      {!naGlassBreak && ativas.length > 0 && (
        <div className="flex flex-col">
          {ativas.map((s) => (
            <div
              key={s.pacienteId}
              className="w-full flex items-center gap-3 px-8 py-2.5 bg-[var(--scolio-danger-coral)] text-white"
            >
              <ShieldAlert className="w-4 h-4 flex-shrink-0" />
              <button
                type="button"
                onClick={() => navigate(`/patients/${s.pacienteId}`)}
                title={t('glassBreak.globalBannerOpenRecord')}
                className="flex-1 text-left hover:underline"
                style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)' }}
              >
                {t('glassBreak.globalBannerActive', {
                  name: s.pacienteNome,
                  time: formatarRestante(s.dataExpiracao, agora),
                })}
              </button>
              <button
                type="button"
                onClick={() => terminar(s)}
                disabled={aEncerrar === s.pacienteId}
                className="flex items-center gap-1.5 px-3 py-1 rounded bg-white/20 hover:bg-white/30 disabled:opacity-60 transition-colors flex-shrink-0"
                style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-medium)' }}
              >
                <LogOut className="w-3.5 h-3.5" />
                {aEncerrar === s.pacienteId ? t('glassBreak.globalBannerEnding') : t('glassBreak.globalBannerEnd')}
              </button>
            </div>
          ))}
        </div>
      )}

      {resumo && <ResumoGlassBreakModal resumo={resumo} onClose={() => setResumo(null)} />}
    </>
  );
}
