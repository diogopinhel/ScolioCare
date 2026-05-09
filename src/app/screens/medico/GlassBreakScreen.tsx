import React from 'react';
import {
  AlertTriangle, Shield, ShieldAlert, FileText,
  Clock, ChevronRight, Check, Eye, Lock, User, LogOut,
} from 'lucide-react';
import { Button, Input, Textarea } from '../../components/scolio';
import { useNavigate, useParams } from 'react-router';
import { useAuth } from '../../auth/AuthContext';
import { supabase } from '../../../lib/supabase';

const EMERGENCY_REASONS = [
  { id: 'r1', label: 'Emergência clínica urgente — paciente em risco imediato' },
  { id: 'r2', label: 'Cobertura de turno — médico titular indisponível' },
  { id: 'r3', label: 'Solicitação do paciente com consentimento verbal' },
  { id: 'r4', label: 'Continuidade de cuidados — transferência hospitalar' },
  { id: 'r5', label: 'Outro motivo clínico justificado' },
];

type Step = 'warning' | 'justify' | 'confirm' | 'access';

interface PacienteBasico {
  nomeCompleto: string;
  numeroUtente: string | null;
  dataNascimento: string | null;
  genero: string | null;
}

export default function GlassBreakScreen() {
  const navigate = useNavigate();
  const { pacienteId } = useParams<{ pacienteId: string }>();
  const { utilizador } = useAuth();

  const [step, setStep] = React.useState<Step>('warning');
  const [selectedReason, setSelectedReason] = React.useState('');
  const [justification, setJustification] = React.useState('');
  const [acknowledged, setAcknowledged] = React.useState(false);
  const [timeRemaining, setTimeRemaining] = React.useState(900); // 15 min
  const [accessGrantedAt] = React.useState(new Date());
  const [aConfirmar, setAConfirmar] = React.useState(false);
  const [erroConfirmacao, setErroConfirmacao] = React.useState('');

  // Dados do paciente — só disponíveis após confirmação
  const [paciente, setPaciente] = React.useState<PacienteBasico | null>(null);

  // Countdown durante a fase de acesso
  React.useEffect(() => {
    if (step !== 'access') return;
    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          navigate('/patients');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [step, navigate]);

  // Carregar dados do paciente DEPOIS de o acesso ser concedido
  React.useEffect(() => {
    if (step !== 'access' || !pacienteId) return;
    supabase
      .from('utilizadores')
      .select('nome_completo, numero_utente, data_nascimento, genero')
      .eq('id', pacienteId)
      .single()
      .then(({ data }) => {
        if (data) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const row = data as any;
          setPaciente({
            nomeCompleto: row.nome_completo as string,
            numeroUtente: row.numero_utente as string | null,
            dataNascimento: row.data_nascimento as string | null,
            genero: row.genero as string | null,
          });
        }
      });
  }, [step, pacienteId]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const calcularIdade = (dataNasc: string | null): string => {
    if (!dataNasc) return '—';
    const nasc = new Date(dataNasc);
    const hoje = new Date();
    let idade = hoje.getFullYear() - nasc.getFullYear();
    if (hoje.getMonth() - nasc.getMonth() < 0) idade--;
    return `${idade} anos`;
  };

  const canProceed = selectedReason && justification.trim().length >= 20 && acknowledged;

  const confirmarAcesso = async () => {
    if (!canProceed || !utilizador || !pacienteId) return;
    setAConfirmar(true);
    setErroConfirmacao('');
    try {
      const { error } = await supabase.from('glassbreak_log').insert({
        medico_id: utilizador.id,
        paciente_id: pacienteId,
        medico_nome: utilizador.nomeCompleto,
        paciente_nome: '—', // será preenchido após acesso
        motivo_categoria: selectedReason,
        justificacao: justification.trim(),
        data_expiracao: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // preenchido também pelo trigger
      });
      if (error) throw error;
      setStep('access');
    } catch (err) {
      console.error('Erro ao registar glass-break:', err);
      setErroConfirmacao('Não foi possível registar o acesso de emergência. Tente novamente.');
    } finally {
      setAConfirmar(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-[var(--scolio-page-surface)]">

      {/* Banner de emergência */}
      <div className="bg-[var(--scolio-danger-coral)] px-6 py-3 flex items-center gap-3">
        <ShieldAlert className="w-5 h-5 text-white flex-shrink-0" />
        <p className="text-white flex-1" style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)' }}>
          PROTOCOLO GLASS-BREAK ATIVO — Todos os acessos são registados e auditados em tempo real
        </p>
        {step === 'access' && (
          <div className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded">
            <Clock className="w-4 h-4 text-white" />
            <span className="text-white font-semibold" style={{ fontSize: 'var(--text-body)' }}>
              {formatTime(timeRemaining)}
            </span>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-auto flex items-start justify-center py-8 px-6">
        <div className="w-full max-w-2xl space-y-6">

          {/* Step 1 — Aviso */}
          {step === 'warning' && (
            <div className="bg-white rounded-[var(--radius-card)] border-2 border-[var(--scolio-danger-coral)] overflow-hidden">
              <div className="p-6 bg-[var(--scolio-danger-surface)] flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-[var(--scolio-danger-coral)] flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-[var(--scolio-text-primary)] mb-1">Acesso de emergência a dados clínicos</h2>
                  <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>
                    Está a tentar aceder ao registo clínico de um paciente que não está atribuído à sua lista de utentes.
                  </p>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3 p-4 bg-[var(--scolio-page-surface)] rounded-[var(--radius-component)]">
                  <User className="w-5 h-5 text-[var(--scolio-neutral-gray)]" />
                  <div>
                    <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>Paciente solicitado</p>
                    <p className="text-[var(--scolio-text-primary)] font-medium" style={{ fontSize: 'var(--text-body)' }}>
                      ●●●●● ●●●●●● · {pacienteId ? `ID: ${pacienteId.slice(0, 8)}…` : 'ID desconhecido'}
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  {[
                    'O seu acesso ficará registado com data, hora, IP e justificação.',
                    'O responsável clínico do paciente será notificado automaticamente.',
                    'O acesso expira ao fim de 15 minutos, podendo ser renovado.',
                    'Este evento ficará visível no log de auditoria do paciente e no painel de administração.',
                  ].map((t) => (
                    <div key={t} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-2" style={{ background: 'var(--scolio-text-secondary)' }} />
                      <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>{t}</p>
                    </div>
                  ))}
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-2" style={{ background: 'var(--scolio-danger-coral)' }} />
                    <p className="text-[var(--scolio-danger-coral)] font-medium" style={{ fontSize: 'var(--text-body)' }}>
                      Uso indevido deste protocolo está sujeito a processo disciplinar e legal.
                    </p>
                  </div>
                </div>
              </div>
              <div className="px-6 pb-6 flex gap-3">
                <Button variant="secondary" className="flex-1" onClick={() => navigate(-1)}>
                  Cancelar — voltar atrás
                </Button>
                <Button
                  variant="primary"
                  className="flex-1 bg-[var(--scolio-danger-coral)] hover:bg-[#C24D25]"
                  onClick={() => setStep('justify')}
                >
                  Compreendo — continuar
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 2 — Justificação */}
          {step === 'justify' && (
            <div className="bg-white rounded-[var(--radius-card)] border border-[var(--scolio-border-light)] overflow-hidden">
              <div className="p-6 border-b border-[var(--scolio-border-light)]">
                <h2 className="text-[var(--scolio-text-primary)] mb-1">Justificação clínica obrigatória</h2>
                <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>
                  Selecione o motivo e descreva a situação clínica que justifica este acesso de emergência.
                </p>
              </div>
              <div className="p-6 space-y-6">
                {/* Motivo */}
                <div>
                  <label className="block text-[var(--scolio-text-primary)] mb-3">Motivo do acesso de emergência *</label>
                  <div className="space-y-2">
                    {EMERGENCY_REASONS.map((reason) => (
                      <button
                        key={reason.id}
                        onClick={() => setSelectedReason(reason.id)}
                        className={`w-full flex items-center gap-3 p-3 rounded-[var(--radius-component)] border text-left transition-colors ${
                          selectedReason === reason.id
                            ? 'border-[var(--scolio-primary-blue)] bg-[var(--scolio-light-blue-surface)]'
                            : 'border-[var(--scolio-border-light)] hover:bg-[var(--scolio-page-surface)]'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                          selectedReason === reason.id
                            ? 'border-[var(--scolio-primary-blue)] bg-[var(--scolio-primary-blue)]'
                            : 'border-[var(--scolio-border-light)]'
                        }`}>
                          {selectedReason === reason.id && <div className="w-2 h-2 bg-white rounded-full" />}
                        </div>
                        <span className="text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-body)' }}>{reason.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                {/* Justificação livre */}
                <div>
                  <label className="block text-[var(--scolio-text-primary)] mb-2">Descrição detalhada *</label>
                  <Textarea
                    value={justification}
                    onChange={(e) => setJustification(e.target.value)}
                    rows={4}
                    placeholder="Descreva a situação clínica (mínimo 20 caracteres)..."
                  />
                  <p className={`mt-1 ${justification.length >= 20 ? 'text-[var(--scolio-success-green)]' : 'text-[var(--scolio-text-secondary)]'}`} style={{ fontSize: 'var(--text-caption)' }}>
                    {justification.length} / 20 caracteres mínimos
                  </p>
                </div>
                {/* Declaração */}
                <button
                  onClick={() => setAcknowledged(!acknowledged)}
                  className="flex items-start gap-3 p-4 rounded-[var(--radius-component)] border border-[var(--scolio-border-light)] hover:bg-[var(--scolio-page-surface)] w-full text-left transition-colors"
                >
                  <div className={`w-5 h-5 rounded border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors ${
                    acknowledged ? 'border-[var(--scolio-danger-coral)] bg-[var(--scolio-danger-coral)]' : 'border-[var(--scolio-border-light)]'
                  }`}>
                    {acknowledged && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <p className="text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-body)' }}>
                    Declaro que este acesso de emergência é clinicamente justificado, que compreendo as implicações legais e éticas, e que aceito a responsabilidade pela minha ação.
                  </p>
                </button>
              </div>
              <div className="px-6 pb-6 flex gap-3">
                <Button variant="secondary" className="flex-1" onClick={() => setStep('warning')}>Voltar</Button>
                <Button
                  variant="primary"
                  className={`flex-1 ${canProceed ? 'bg-[var(--scolio-danger-coral)] hover:bg-[#C24D25]' : 'opacity-50 cursor-not-allowed'}`}
                  onClick={() => canProceed && setStep('confirm')}
                >
                  Confirmar justificação
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3 — Confirmação final */}
          {step === 'confirm' && (
            <div className="bg-white rounded-[var(--radius-card)] border border-[var(--scolio-border-light)] overflow-hidden">
              <div className="p-6 border-b border-[var(--scolio-border-light)]">
                <h2 className="text-[var(--scolio-text-primary)] mb-1">Confirmação final de acesso</h2>
                <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>
                  Reveja o registo de auditoria que será criado ao confirmar.
                </p>
              </div>
              <div className="p-6 space-y-4">
                <div className="bg-[var(--scolio-page-surface)] rounded-[var(--radius-component)] p-4 space-y-3 border border-[var(--scolio-border-light)]">
                  <p className="text-[var(--scolio-text-secondary)] font-medium uppercase" style={{ fontSize: 'var(--text-caption)', letterSpacing: '0.05em' }}>
                    Registo de auditoria
                  </p>
                  {[
                    { label: 'Médico', value: utilizador?.nomeCompleto ?? '—' },
                    { label: 'Data e hora', value: new Date().toLocaleString('pt-PT') },
                    { label: 'Motivo', value: EMERGENCY_REASONS.find((r) => r.id === selectedReason)?.label ?? '' },
                    { label: 'Justificação', value: justification },
                    { label: 'Duração máxima', value: '15 minutos' },
                  ].map((row) => (
                    <div key={row.label} className="flex items-start gap-4">
                      <span className="text-[var(--scolio-text-secondary)] flex-shrink-0 w-28" style={{ fontSize: 'var(--text-caption)' }}>{row.label}</span>
                      <span className="text-[var(--scolio-text-primary)] font-medium line-clamp-2" style={{ fontSize: 'var(--text-caption)' }}>{row.value}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-start gap-3 p-4 bg-[var(--scolio-warning-surface)] border border-[var(--scolio-warning-amber)] rounded-[var(--radius-component)]">
                  <AlertTriangle className="w-5 h-5 text-[var(--scolio-warning-amber)] flex-shrink-0 mt-0.5" />
                  <p className="text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-caption)' }}>
                    Este registo não pode ser apagado. O médico responsável pelo paciente será notificado automaticamente.
                  </p>
                </div>
                {erroConfirmacao && (
                  <p className="text-[var(--scolio-danger-coral)]" style={{ fontSize: 'var(--text-body)' }}>
                    {erroConfirmacao}
                  </p>
                )}
              </div>
              <div className="px-6 pb-6 flex gap-3">
                <Button variant="secondary" className="flex-1" onClick={() => setStep('justify')} disabled={aConfirmar}>
                  Voltar
                </Button>
                <Button
                  variant="primary"
                  className="flex-1 bg-[var(--scolio-danger-coral)] hover:bg-[#C24D25]"
                  onClick={confirmarAcesso}
                  disabled={aConfirmar}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  {aConfirmar ? 'A registar acesso...' : 'Confirmar acesso de emergência'}
                </Button>
              </div>
            </div>
          )}

          {/* Step 4 — Acesso concedido */}
          {step === 'access' && (
            <div className="space-y-4">
              <div className="bg-[var(--scolio-danger-surface)] border-2 border-[var(--scolio-danger-coral)] rounded-[var(--radius-card)] p-5 flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-[var(--scolio-danger-coral)] flex items-center justify-center flex-shrink-0">
                  <ShieldAlert className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-[var(--scolio-text-primary)] font-semibold mb-0.5" style={{ fontSize: 'var(--text-body)' }}>
                    Acesso de emergência ativo
                  </p>
                  <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>
                    Iniciado às {accessGrantedAt.toLocaleTimeString('pt-PT')} · Expira em{' '}
                    <span className="font-semibold text-[var(--scolio-danger-coral)]">{formatTime(timeRemaining)}</span>
                  </p>
                </div>
                <Button
                  variant="ghost"
                  className="text-[var(--scolio-danger-coral)] hover:bg-[var(--scolio-danger-surface)]"
                  onClick={() => navigate('/patients')}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Terminar acesso
                </Button>
              </div>

              {/* Dados do paciente */}
              <div className="bg-white rounded-[var(--radius-card)] border border-[var(--scolio-border-light)] overflow-hidden">
                <div className="p-5 border-b border-[var(--scolio-border-light)] flex items-center justify-between">
                  <div>
                    <h2 className="text-[var(--scolio-text-primary)]">
                      {paciente ? paciente.nomeCompleto : 'A carregar dados do paciente…'}
                    </h2>
                    {paciente && (
                      <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>
                        {paciente.numeroUtente ?? '—'} · {calcularIdade(paciente.dataNascimento)} · {paciente.genero ?? '—'}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--scolio-danger-surface)] border border-[var(--scolio-danger-coral)] rounded-[var(--radius-component)]">
                    <Lock className="w-4 h-4 text-[var(--scolio-danger-coral)]" />
                    <span className="text-[var(--scolio-danger-coral)] font-medium" style={{ fontSize: 'var(--text-caption)' }}>
                      Acesso de emergência
                    </span>
                  </div>
                </div>
                {pacienteId && (
                  <div className="px-5 pb-5 pt-4">
                    <Button
                      variant="primary"
                      className="w-full"
                      onClick={() => navigate(`/patients/${pacienteId}`)}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Abrir ficha do paciente
                    </Button>
                  </div>
                )}
              </div>

              {/* Registo de auditoria da sessão */}
              <div className="bg-white rounded-[var(--radius-card)] border border-[var(--scolio-border-light)] p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="w-4 h-4 text-[var(--scolio-primary-blue)]" />
                  <p className="text-[var(--scolio-text-primary)] font-medium" style={{ fontSize: 'var(--text-body)' }}>
                    Registo de auditoria desta sessão
                  </p>
                </div>
                <div className="space-y-2">
                  {[
                    { time: accessGrantedAt, action: 'Acesso de emergência registado em glassbreak_log' },
                    { time: new Date(accessGrantedAt.getTime() + 2000), action: 'Perfil do paciente visualizado' },
                  ].map((entry, i) => (
                    <div key={i} className="flex items-center gap-3 py-2 border-b border-[var(--scolio-border-light)] last:border-0">
                      <div className="w-2 h-2 rounded-full bg-[var(--scolio-danger-coral)] flex-shrink-0" />
                      <span className="text-[var(--scolio-text-secondary)] w-20 flex-shrink-0" style={{ fontSize: 'var(--text-caption)' }}>
                        {entry.time.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                      <span className="text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-caption)' }}>{entry.action}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
