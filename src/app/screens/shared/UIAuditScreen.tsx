import React from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Shield,
  Layers,
  Lock,
  ExternalLink,
  Info,
  Stethoscope
} from 'lucide-react';
import { useNavigate } from 'react-router';

type Severity = 'critical' | 'high' | 'medium' | 'low';
type Status = 'pass' | 'fail' | 'partial';

interface AuditItem {
  id: string;
  title: string;
  description: string;
  status: Status;
  severity?: Severity;
  recommendation?: string;
  route?: string;
  routeLabel?: string;
}

interface AuditCategory {
  id: string;
  label: string;
  icon: React.ElementType;
  iconColor: string;
  items: AuditItem[];
}

const auditData: AuditCategory[] = [
  {
    id: 'roles',
    label: 'Consistência de Funções (Dashboard Médico)',
    icon: Stethoscope,
    iconColor: 'var(--scolio-primary-blue)',
    items: [
      {
        id: 'r1',
        title: 'Comparação lado a lado de exames',
        description: 'ExamComparisonScreen.tsx implementado com dois visualizadores sincronizáveis, selecção de exame por dropdown, overlay IA individual por painel e tabela de delta de métricas.',
        status: 'pass',
      },
      {
        id: 'r2',
        title: 'Overlays IA de ângulo de Cobb',
        description: 'ExamViewerScreen.tsx e ExamComparisonScreen.tsx incluem overlay SVG com linhas de medição, círculos de vértebra coloridos e label do ângulo calculado.',
        status: 'pass',
      },
      {
        id: 'r3',
        title: "Protocolo de emergência 'Glass-Break'",
        description: "Sem ecrã, modal ou fluxo de acesso de emergência. Um médico não consegue aceder a dados de paciente fora do seu rol com registo de auditoria justificado. RGPD e normas hospitalares exigem este mecanismo.",
        status: 'fail',
        severity: 'critical',
        recommendation: "Criar GlassBreakScreen.tsx com: seleção de motivo clínico, campo de justificação obrigatório, confirmação dupla, registo automático em auditoria, banner de aviso persistente durante a sessão de acesso de emergência.",
        route: '/glass-break',
        routeLabel: 'Ver ecrã implementado →',
      },
      {
        id: 'r4',
        title: 'Skeleton loader durante processamento IA',
        description: "Os ecrãs ExamViewerScreen e ExamComparisonScreen não possuem estado de carregamento. O utilizador não recebe feedback visual enquanto a IA processa o exame.",
        status: 'fail',
        severity: 'high',
        recommendation: "Adicionar componente SkeletonLoader ao ExamViewerScreen com pulso animado nas áreas de métricas IA. Implementar estado 'processing' no StatusBadge que aciona o skeleton.",
        route: '/exam-viewer',
        routeLabel: 'Ver no ExamViewer →',
      },
    ],
  },
  {
    id: 'states',
    label: 'Estados em Falta',
    icon: Layers,
    iconColor: 'var(--scolio-warning-amber)',
    items: [
      {
        id: 's1',
        title: 'Estado vazio para novos pacientes',
        description: "PatientRecordScreen.tsx não tem estado para pacientes recém-criados sem exames. A tab 'Exames' ficaria em branco sem orientação para o utilizador.",
        status: 'fail',
        severity: 'high',
        recommendation: "Adicionar EmptyState component com ilustração, mensagem contextual e call-to-action primário ('Carregar primeiro exame') quando a lista de exames estiver vazia.",
        route: '/patients/new-empty',
        routeLabel: 'Ver estado vazio →',
      },
      {
        id: 's2',
        title: 'Página de erro 403 (Acesso Proibido)',
        description: "Sem página de erro para tentativas de acesso não autorizado. Um técnico que tente aceder ao painel de administração não recebe feedback adequado.",
        status: 'fail',
        severity: 'critical',
        recommendation: "Criar Error403Screen.tsx com mensagem clara de acesso negado, indicação do rol necessário, opção de contactar administrador e link de retorno seguro.",
        route: '/403',
        routeLabel: 'Ver página implementada →',
      },
      {
        id: 's3',
        title: 'Página de erro 404 (Não Encontrado)',
        description: "Rotas inválidas não têm tratamento. Qualquer URL incorreto resulta em ecrã branco sem orientação.",
        status: 'fail',
        severity: 'medium',
        recommendation: "Criar Error404Screen.tsx com mensagem amigável, sugestão de acções alternativas e navegação de retorno para o dashboard.",
        route: '/404',
        routeLabel: 'Ver página implementada →',
      },
    ],
  },
  {
    id: 'privacy',
    label: 'Sensibilidade de Dados & Privacidade',
    icon: Lock,
    iconColor: 'var(--scolio-danger-coral)',
    items: [
      {
        id: 'p1',
        title: 'Log de auditoria no perfil do paciente',
        description: "PatientRecordScreen.tsx tem tab 'Auditoria' com registo de ações por utilizador, data, hora e IP. AdminScreen.tsx tem painel de auditoria global com filtros e exportação.",
        status: 'pass',
      },
      {
        id: 'p2',
        title: 'Indicadores visuais de ações auditadas',
        description: "As ações de confirmar métricas IA e guardar notas clínicas não têm indicador visual de que foram registadas em auditoria. O clínico não tem feedback de que a sua ação ficou registada.",
        status: 'partial',
        severity: 'medium',
        recommendation: "Adicionar ícone de escudo/cadeado com tooltip 'Ação registada em auditoria' junto às ações sensíveis: confirmar métricas, guardar notas, gerar relatório, arquivar exame.",
      },
      {
        id: 'p3',
        title: 'Mascaramento de dados sensíveis',
        description: "Dados como NIF, número de utente, data de nascimento completa e contacto telefónico são exibidos sem mascaramento. Em contextos de demonstração ou acesso de baixo privilégio, estes dados devem ser parcialmente ocultados.",
        status: 'fail',
        severity: 'high',
        recommendation: "Implementar padrão de mascaramento: NIF → '***-***-***', Telefone → '9** *** **7', Data nascimento → 'Mar ****, 2008'. Adicionar botão 'Revelar' com registo em auditoria.",
      },
      {
        id: 'p4',
        title: 'Consentimento RGPD e marcação de dados',
        description: "Não existe indicação visual de nível de classificação dos dados (Público / Clínico Confidencial / Dados Pessoais Sensíveis). O formulário de novo paciente não tem checkbox de consentimento de tratamento de dados.",
        status: 'fail',
        severity: 'high',
        recommendation: "Adicionar badge de classificação nos cabeçalhos dos ecrãs clínicos. Incluir secção de consentimentos no NewPatientScreen.tsx com checkboxes RGPD obrigatórios.",
      },
    ],
  },
];

const severityConfig: Record<Severity, { label: string; color: string; bg: string }> = {
  critical: { label: 'Crítico', color: 'var(--scolio-danger-coral)', bg: 'var(--scolio-danger-surface)' },
  high: { label: 'Alto', color: '#C05700', bg: '#FEF3E2' },
  medium: { label: 'Médio', color: 'var(--scolio-warning-amber)', bg: 'var(--scolio-warning-surface)' },
  low: { label: 'Baixo', color: 'var(--scolio-neutral-gray)', bg: 'var(--scolio-neutral-surface)' },
};

const statusConfig: Record<Status, { icon: React.ElementType; color: string; label: string }> = {
  pass: { icon: CheckCircle2, color: 'var(--scolio-success-green)', label: 'Conforme' },
  fail: { icon: XCircle, color: 'var(--scolio-danger-coral)', label: 'Não conforme' },
  partial: { icon: AlertTriangle, color: 'var(--scolio-warning-amber)', label: 'Parcial' },
};

export default function UIAuditScreen() {
  const navigate = useNavigate();
  const [expandedItems, setExpandedItems] = React.useState<Set<string>>(new Set());
  const [expandedCategories, setExpandedCategories] = React.useState<Set<string>>(
    new Set(auditData.map(c => c.id))
  );

  const toggleItem = (id: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleCategory = (id: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Stats
  const allItems = auditData.flatMap(c => c.items);
  const passCount = allItems.filter(i => i.status === 'pass').length;
  const failCount = allItems.filter(i => i.status === 'fail').length;
  const partialCount = allItems.filter(i => i.status === 'partial').length;
  const criticalCount = allItems.filter(i => i.severity === 'critical').length;
  const score = Math.round((passCount / allItems.length) * 100);

  return (
    <div className="p-8 space-y-8 overflow-auto h-full">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-[var(--scolio-primary-blue)] rounded-[var(--radius-component)] flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-[var(--scolio-text-primary)]">Relatório de Auditoria UI/UX</h1>
              <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>
                ScolioCare · Avaliação de conformidade funcional · 22 de abril de 2026
              </p>
            </div>
          </div>
        </div>
        <div
          className="flex items-center gap-3 px-5 py-3 rounded-[var(--radius-card)] border-2"
          style={{
            borderColor: score >= 80 ? 'var(--scolio-success-green)' : score >= 60 ? 'var(--scolio-warning-amber)' : 'var(--scolio-danger-coral)',
            background: score >= 80 ? 'var(--scolio-success-surface)' : score >= 60 ? 'var(--scolio-warning-surface)' : 'var(--scolio-danger-surface)',
          }}
        >
          <div>
            <p className="text-[var(--scolio-text-secondary)] text-xs mb-0.5">Pontuação de conformidade</p>
            <p
              className="font-semibold"
              style={{
                fontSize: '32px',
                lineHeight: 1,
                color: score >= 80 ? 'var(--scolio-success-green)' : score >= 60 ? 'var(--scolio-warning-amber)' : 'var(--scolio-danger-coral)',
              }}
            >
              {score}%
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <SummaryCard
          icon={CheckCircle2}
          iconColor="var(--scolio-success-green)"
          bg="var(--scolio-success-surface)"
          label="Conformes"
          value={passCount}
          total={allItems.length}
        />
        <SummaryCard
          icon={AlertTriangle}
          iconColor="var(--scolio-warning-amber)"
          bg="var(--scolio-warning-surface)"
          label="Parciais"
          value={partialCount}
          total={allItems.length}
        />
        <SummaryCard
          icon={XCircle}
          iconColor="var(--scolio-danger-coral)"
          bg="var(--scolio-danger-surface)"
          label="Não conformes"
          value={failCount}
          total={allItems.length}
        />
        <SummaryCard
          icon={Shield}
          iconColor="#C05700"
          bg="#FEF3E2"
          label="Itens críticos"
          value={criticalCount}
          total={allItems.length}
          highlightValue
        />
      </div>

      {/* Progress Bar */}
      <div className="bg-white rounded-[var(--radius-card)] border border-[var(--scolio-border-light)] p-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[var(--scolio-text-primary)] font-medium" style={{ fontSize: 'var(--text-body)' }}>
            Conformidade global
          </p>
          <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>
            {passCount} de {allItems.length} critérios conformes
          </p>
        </div>
        <div className="h-3 bg-[var(--scolio-border-light)] rounded-full overflow-hidden flex">
          <div
            className="h-full transition-all duration-700"
            style={{ width: `${(passCount / allItems.length) * 100}%`, background: 'var(--scolio-success-green)' }}
          />
          <div
            className="h-full transition-all duration-700"
            style={{ width: `${(partialCount / allItems.length) * 100}%`, background: 'var(--scolio-warning-amber)' }}
          />
          <div
            className="h-full transition-all duration-700"
            style={{ width: `${(failCount / allItems.length) * 100}%`, background: 'var(--scolio-danger-coral)' }}
          />
        </div>
        <div className="flex gap-5 mt-3">
          <LegendItem color="var(--scolio-success-green)" label="Conforme" />
          <LegendItem color="var(--scolio-warning-amber)" label="Parcial" />
          <LegendItem color="var(--scolio-danger-coral)" label="Não conforme" />
        </div>
      </div>

      {/* Audit Categories */}
      <div className="space-y-4">
        {auditData.map((category) => {
          const CategoryIcon = category.icon;
          const isExpanded = expandedCategories.has(category.id);
          const catPass = category.items.filter(i => i.status === 'pass').length;
          const catTotal = category.items.length;

          return (
            <div
              key={category.id}
              className="bg-white rounded-[var(--radius-card)] border border-[var(--scolio-border-light)] overflow-hidden"
            >
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(category.id)}
                className="w-full flex items-center justify-between p-5 hover:bg-[var(--scolio-page-surface)] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-[var(--radius-component)] flex items-center justify-center"
                    style={{ background: `${category.iconColor}18` }}
                  >
                    <CategoryIcon className="w-5 h-5" style={{ color: category.iconColor }} />
                  </div>
                  <div className="text-left">
                    <p className="text-[var(--scolio-text-primary)] font-medium" style={{ fontSize: 'var(--text-body)' }}>
                      {category.label}
                    </p>
                    <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>
                      {catPass}/{catTotal} critérios conformes
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex gap-1.5">
                    {category.items.map(item => {
                      const cfg = statusConfig[item.status];
                      const Icon = cfg.icon;
                      return (
                        <Icon key={item.id} className="w-4 h-4" style={{ color: cfg.color }} />
                      );
                    })}
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-[var(--scolio-neutral-gray)]" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-[var(--scolio-neutral-gray)]" />
                  )}
                </div>
              </button>

              {/* Items */}
              {isExpanded && (
                <div className="divide-y divide-[var(--scolio-border-light)] border-t border-[var(--scolio-border-light)]">
                  {category.items.map((item) => {
                    const statusCfg = statusConfig[item.status];
                    const StatusIcon = statusCfg.icon;
                    const isItemExpanded = expandedItems.has(item.id);
                    const hasFinding = item.status !== 'pass';

                    return (
                      <div key={item.id} className="bg-white">
                        <button
                          onClick={() => hasFinding && toggleItem(item.id)}
                          className={`w-full flex items-start gap-4 p-5 text-left transition-colors ${hasFinding ? 'hover:bg-[var(--scolio-page-surface)] cursor-pointer' : 'cursor-default'}`}
                        >
                          <StatusIcon className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: statusCfg.color }} />
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                              <p className="text-[var(--scolio-text-primary)] font-medium" style={{ fontSize: 'var(--text-body)' }}>
                                {item.title}
                              </p>
                              {item.severity && (
                                <span
                                  className="px-2 py-0.5 rounded text-xs font-semibold"
                                  style={{
                                    color: severityConfig[item.severity].color,
                                    background: severityConfig[item.severity].bg,
                                  }}
                                >
                                  {severityConfig[item.severity].label}
                                </span>
                              )}
                              <span
                                className="px-2 py-0.5 rounded text-xs font-medium"
                                style={{ color: statusCfg.color, background: `${statusCfg.color}18` }}
                              >
                                {statusCfg.label}
                              </span>
                            </div>
                            <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>
                              {item.description}
                            </p>
                          </div>
                          {hasFinding && (
                            isItemExpanded ? (
                              <ChevronUp className="w-4 h-4 text-[var(--scolio-neutral-gray)] flex-shrink-0 mt-0.5" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-[var(--scolio-neutral-gray)] flex-shrink-0 mt-0.5" />
                            )
                          )}
                        </button>

                        {/* Recommendation Drawer */}
                        {hasFinding && isItemExpanded && item.recommendation && (
                          <div className="mx-5 mb-5 p-4 bg-[var(--scolio-light-blue-surface)] border border-[var(--scolio-primary-blue)] rounded-[var(--radius-component)]">
                            <div className="flex items-start gap-2 mb-3">
                              <Info className="w-4 h-4 text-[var(--scolio-primary-blue)] mt-0.5 flex-shrink-0" />
                              <p className="text-[var(--scolio-text-primary)] font-medium" style={{ fontSize: 'var(--text-caption)' }}>
                                Recomendação de implementação
                              </p>
                            </div>
                            <p className="text-[var(--scolio-text-secondary)] ml-6" style={{ fontSize: 'var(--text-caption)' }}>
                              {item.recommendation}
                            </p>
                            {item.route && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(item.route!);
                                }}
                                className="flex items-center gap-1.5 mt-3 ml-6 text-[var(--scolio-primary-blue)] hover:underline"
                                style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-medium)' }}
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                {item.routeLabel}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Implementation Roadmap */}
      <div className="bg-white rounded-[var(--radius-card)] border border-[var(--scolio-border-light)] p-6">
        <h2 className="text-[var(--scolio-text-primary)] mb-5">Plano de implementação por prioridade</h2>
        <div className="space-y-3">
          {[
            { priority: 'P0 · Crítico', items: ["Protocolo Glass-Break (GlassBreakScreen.tsx)", "Página 403 Acesso Proibido (Error403Screen.tsx)"], color: 'var(--scolio-danger-coral)', bg: 'var(--scolio-danger-surface)' },
            { priority: 'P1 · Alto', items: ["Skeleton loader para processamento IA", "Fluxo de configuração 2FA mobile (TwoFactorSetupScreen.tsx)", "Estado vazio para pacientes sem exames", "Mascaramento de dados sensíveis (NIF, telefone, etc.)"], color: '#C05700', bg: '#FEF3E2' },
            { priority: 'P2 · Médio', items: ["Página 404 Não Encontrado (Error404Screen.tsx)", "Tradução completa do ProfileScreen.tsx", "Indicadores de ação auditada nas ações sensíveis"], color: 'var(--scolio-warning-amber)', bg: 'var(--scolio-warning-surface)' },
            { priority: 'P3 · Baixo', items: ["Badges de classificação RGPD nos ecrãs clínicos", "Checkboxes de consentimento no NewPatientScreen.tsx"], color: 'var(--scolio-neutral-gray)', bg: 'var(--scolio-neutral-surface)' },
          ].map((row) => (
            <div key={row.priority} className="flex gap-4 p-4 rounded-[var(--radius-component)]" style={{ background: row.bg }}>
              <span
                className="flex-shrink-0 text-xs font-semibold px-2 py-1 rounded h-fit"
                style={{ color: row.color, background: 'white' }}
              >
                {row.priority}
              </span>
              <ul className="space-y-1">
                {row.items.map(item => (
                  <li key={item} className="text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-caption)' }}>
                    · {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  iconColor,
  bg,
  label,
  value,
  total,
  highlightValue,
}: {
  icon: React.ElementType;
  iconColor: string;
  bg: string;
  label: string;
  value: number;
  total: number;
  highlightValue?: boolean;
}) {
  return (
    <div className="bg-white rounded-[var(--radius-card)] border border-[var(--scolio-border-light)] p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="w-9 h-9 rounded-[var(--radius-component)] flex items-center justify-center" style={{ background: bg }}>
          <Icon className="w-5 h-5" style={{ color: iconColor }} />
        </div>
      </div>
      <p
        className="mb-0.5 font-semibold"
        style={{
          fontSize: '32px',
          lineHeight: 1,
          color: highlightValue && value > 0 ? iconColor : 'var(--scolio-text-primary)',
        }}
      >
        {value}
      </p>
      <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>
        {label} <span className="text-[var(--scolio-border-light)]">· de {total}</span>
      </p>
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-3 h-3 rounded-full" style={{ background: color }} />
      <span className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>
        {label}
      </span>
    </div>
  );
}