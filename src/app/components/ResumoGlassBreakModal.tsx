import React from 'react';
import { Clock, FileText } from 'lucide-react';
import { Modal, Button } from './scolio';
import { useTranslation } from 'react-i18next';
import { useDateLocale } from '../../lib/dateLocale';
import type { ResumoGlassBreak } from '../../data/repository/pacientes';

// tipo_acao → chave i18n legível; cai no código cru se não mapeado.
const ACAO_LABEL_KEYS: Record<string, string> = {
  VALIDAR_EXAME: 'glassBreak.acoes.VALIDAR_EXAME',
  CORRIGIR_EXAME: 'glassBreak.acoes.CORRIGIR_EXAME',
  ARQUIVAR_EXAME: 'glassBreak.acoes.ARQUIVAR_EXAME',
  ENVIAR_RELATORIO: 'glassBreak.acoes.ENVIAR_RELATORIO',
  REGISTAR_MEDIDAS: 'glassBreak.acoes.REGISTAR_MEDIDAS',
  EDITAR_PACIENTE: 'glassBreak.acoes.EDITAR_PACIENTE',
  CRIAR_ESTUDO: 'glassBreak.acoes.CRIAR_ESTUDO',
};

interface Props {
  resumo: ResumoGlassBreak;
  onClose: () => void;
}

/**
 * Modal de resumo de um acesso glass-break terminado: metadados da sessão +
 * lista de ações que o médico realizou durante a janela de emergência.
 */
export function ResumoGlassBreakModal({ resumo, onClose }: Props) {
  const { t } = useTranslation();
  const dateLocale = useDateLocale();

  const inicio = new Date(resumo.dataInicio);
  const fim = new Date(resumo.dataFim);
  const duracaoMin = Math.max(1, Math.round((fim.getTime() - inicio.getTime()) / 60000));
  const horas = (d: Date) => d.toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit' });

  const rotuloAcao = (tipo: string) =>
    ACAO_LABEL_KEYS[tipo] ? t(ACAO_LABEL_KEYS[tipo]) : tipo;

  return (
    <Modal isOpen onClose={onClose} title={t('glassBreak.resumoTitle')} className="max-w-lg">
      <div className="space-y-5">
        {/* Metadados da sessão */}
        <div className="bg-[var(--scolio-page-surface)] rounded-[var(--radius-component)] p-4 space-y-2 border border-[var(--scolio-border-light)]">
          {[
            { label: t('glassBreak.resumoPatient'), value: resumo.pacienteNome },
            { label: t('glassBreak.auditReason'), value: t(`glassBreak.reasons.${resumo.motivoCategoria}`) },
            { label: t('glassBreak.auditJustification'), value: resumo.justificacao },
            {
              label: t('glassBreak.resumoDuration'),
              value: `${horas(inicio)} – ${horas(fim)} · ${t('glassBreak.resumoMinutes', { count: duracaoMin })}`,
            },
            {
              label: t('glassBreak.resumoEndedBy'),
              value: resumo.encerradoManualmente ? t('glassBreak.resumoEndedManually') : t('glassBreak.resumoExpired'),
            },
          ].map((row) => (
            <div key={row.label} className="flex items-start gap-4">
              <span className="text-[var(--scolio-text-secondary)] flex-shrink-0 w-28" style={{ fontSize: 'var(--text-caption)' }}>
                {row.label}
              </span>
              <span className="text-[var(--scolio-text-primary)] font-medium" style={{ fontSize: 'var(--text-caption)' }}>
                {row.value}
              </span>
            </div>
          ))}
        </div>

        {/* Lista de ações */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-4 h-4 text-[var(--scolio-primary-blue)]" />
            <p className="text-[var(--scolio-text-primary)] font-medium" style={{ fontSize: 'var(--text-body)' }}>
              {t('glassBreak.resumoActions', { count: resumo.acoes.length })}
            </p>
          </div>

          {resumo.acoes.length === 0 ? (
            <p className="text-[var(--scolio-text-secondary)] py-2" style={{ fontSize: 'var(--text-body)' }}>
              {t('glassBreak.resumoNoActions')}
            </p>
          ) : (
            <div className="max-h-64 overflow-y-auto divide-y divide-[var(--scolio-border-light)]">
              {resumo.acoes.map((a, i) => (
                <div key={i} className="flex items-center gap-3 py-2">
                  <div className="w-2 h-2 rounded-full bg-[var(--scolio-danger-coral)] flex-shrink-0" />
                  <Clock className="w-3.5 h-3.5 text-[var(--scolio-text-secondary)] flex-shrink-0" />
                  <span className="text-[var(--scolio-text-secondary)] flex-shrink-0" style={{ fontSize: 'var(--text-caption)' }}>
                    {horas(new Date(a.dataHora))}
                  </span>
                  <span className="text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-caption)' }}>
                    {rotuloAcao(a.tipoAcao)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <Button variant="primary" onClick={onClose}>
            {t('common.close')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
