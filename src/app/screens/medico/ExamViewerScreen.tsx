import React from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  ZoomIn, ZoomOut, Move, RotateCcw, Sun,
  Eye, EyeOff, FileText, Download, GitCompare,
  Archive, Check, Edit3, ArrowLeft,
} from 'lucide-react';
import {
  Button, StatusBadge, Textarea, ProgressBar,
  Toast, Input, SkeletonBlock,
} from '../../components/scolio';
import type { BadgeStatus } from '../../components/scolio';
import { CobbAngleGauge } from '../../components/scolio';
import { useAuth } from '../../auth/AuthContext';
import type { EstudoCompleto, EstadoEstudo } from '../../../data/types';
import {
  getEstudoCompleto,
  getUrlImagemEstudo,
  confirmarMetricasIA,
  corrigirMetricasIA,
  guardarNotasClinicas,
  arquivarEstudoMedico,
} from '../../../data/repository/estudos';

// ─── Helper ─────────────────────────────────────────────────────────────────

function estadoParaBadge(estado: EstadoEstudo): BadgeStatus {
  switch (estado) {
    case 'UPLOADED':
    case 'PROCESSING':      return 'in-analysis';
    case 'PENDING_VALIDATION': return 'pending';
    case 'VALIDATED':
    case 'DIAGNOSED':
    case 'SENT':            return 'analyzed';
    case 'ARCHIVED':        return 'archived';
    default:                return 'pending';
  }
}

// ─── Ecrã principal ──────────────────────────────────────────────────────────

export default function ExamViewerScreen() {
  const { estudoId } = useParams<{ estudoId: string }>();
  const navigate = useNavigate();
  const { utilizador } = useAuth();

  // ── Dados ──────────────────────────────────────────────────────────────────
  const [estudo, setEstudo] = React.useState<EstudoCompleto | null>(null);
  const [imageUrls, setImageUrls] = React.useState<string[]>([]);
  const [aCarregar, setACarregar] = React.useState(true);
  const [erroDados, setErroDados] = React.useState(false);

  // ── Visualizador ───────────────────────────────────────────────────────────
  const [selectedImage, setSelectedImage] = React.useState(0);
  const [aiOverlay, setAiOverlay] = React.useState(true);
  const [zoom, setZoom] = React.useState(100);
  const [brightness, setBrightness] = React.useState(100);
  const [contrast, setContrast] = React.useState(100);

  // ── Notas clínicas ─────────────────────────────────────────────────────────
  const [clinicalNotes, setClinicalNotes] = React.useState('');
  const [aGuardarNotas, setAGuardarNotas] = React.useState(false);

  // ── Modal de correção ──────────────────────────────────────────────────────
  const [showCorrectModal, setShowCorrectModal] = React.useState(false);
  const [correctedAngle, setCorrectedAngle] = React.useState('');
  const [correctedVertebra, setCorrectedVertebra] = React.useState('');
  const [correctionJustification, setCorrectionJustification] = React.useState('');
  const [aCorrigir, setACorrigir] = React.useState(false);

  // ── Modal de arquivo ───────────────────────────────────────────────────────
  const [showArchiveModal, setShowArchiveModal] = React.useState(false);
  const [aArquivar, setAArquivar] = React.useState(false);

  // ── Confirmação IA ─────────────────────────────────────────────────────────
  const [aConfirmar, setAConfirmar] = React.useState(false);

  // ── Toast ──────────────────────────────────────────────────────────────────
  const [toast, setToast] = React.useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const mostrarToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Carregar dados ─────────────────────────────────────────────────────────
  React.useEffect(() => {
    if (!estudoId) {
      setErroDados(true);
      setACarregar(false);
      return;
    }

    let cancelado = false;
    setACarregar(true);

    async function carregar() {
      try {
        const dados = await getEstudoCompleto(estudoId!);
        if (cancelado) return;
        if (!dados) { setErroDados(true); return; }

        setEstudo(dados);
        setClinicalNotes(dados.notasClinicas ?? '');

        if (dados.resultado) {
          const r = dados.resultado;
          setCorrectedAngle(String(r.anguloCobbCorrigido ?? r.anguloCobb));
          setCorrectedVertebra(r.nivelVertebras ?? '');
        }

        // Gerar URLs assinadas para as imagens
        if (dados.imagens.length > 0) {
          const urls = await Promise.all(
            dados.imagens.map((img) => getUrlImagemEstudo(img.caminhoArmazenamento)),
          );
          if (!cancelado) setImageUrls(urls.filter(Boolean) as string[]);
        }
      } catch {
        if (!cancelado) setErroDados(true);
      } finally {
        if (!cancelado) setACarregar(false);
      }
    }

    carregar();
    return () => { cancelado = true; };
  }, [estudoId]);

  // ── Acções ─────────────────────────────────────────────────────────────────

  const handleConfirmar = async () => {
    if (!estudo?.resultado || !utilizador) return;
    setAConfirmar(true);
    try {
      await confirmarMetricasIA(
        estudo.resultado.id,
        estudo.id,
        utilizador.id,
        utilizador.nomeCompleto,
        utilizador.perfil,
        estudo.estado,
      );
      setEstudo((prev) => prev
        ? { ...prev, estado: 'VALIDATED', resultado: { ...prev.resultado!, decisao: 'ACEITE', dataValidacao: new Date().toISOString() } }
        : prev,
      );
      mostrarToast('Métricas confirmadas com sucesso.');
    } catch {
      mostrarToast('Erro ao confirmar métricas. Tente novamente.', 'error');
    } finally {
      setAConfirmar(false);
    }
  };

  const handleCorrigir = async () => {
    if (!estudo?.resultado || !utilizador) return;
    const angulo = parseFloat(correctedAngle);
    if (isNaN(angulo) || angulo < 0 || angulo > 180) {
      mostrarToast('Ângulo de Cobb inválido (0–180°).', 'error');
      return;
    }
    setACorrigir(true);
    try {
      await corrigirMetricasIA(
        estudo.resultado.id,
        estudo.id,
        utilizador.id,
        utilizador.nomeCompleto,
        utilizador.perfil,
        estudo.estado,
        angulo,
        correctedVertebra.trim() || null,
        correctionJustification.trim() || `Ângulo corrigido para ${angulo}°`,
      );
      setEstudo((prev) => prev
        ? {
            ...prev,
            estado: 'VALIDATED',
            resultado: {
              ...prev.resultado!,
              decisao: 'CORRIGIDO',
              anguloCobbCorrigido: angulo,
              nivelVertebras: correctedVertebra.trim() || prev.resultado!.nivelVertebras,
              dataValidacao: new Date().toISOString(),
            },
          }
        : prev,
      );
      setShowCorrectModal(false);
      mostrarToast('Métricas corrigidas com sucesso.');
    } catch {
      mostrarToast('Erro ao guardar correção. Tente novamente.', 'error');
    } finally {
      setACorrigir(false);
    }
  };

  const handleGuardarNotas = async () => {
    if (!estudo) return;
    setAGuardarNotas(true);
    try {
      await guardarNotasClinicas(estudo.id, clinicalNotes);
      mostrarToast('Notas clínicas guardadas.');
    } catch {
      mostrarToast('Erro ao guardar notas. Tente novamente.', 'error');
    } finally {
      setAGuardarNotas(false);
    }
  };

  const handleArquivar = async () => {
    if (!estudo || !utilizador) return;
    setAArquivar(true);
    try {
      await arquivarEstudoMedico(
        estudo.id,
        utilizador.id,
        utilizador.nomeCompleto,
        utilizador.perfil,
        estudo.estado,
      );
      navigate(-1);
    } catch {
      mostrarToast('Erro ao arquivar exame. Tente novamente.', 'error');
      setAArquivar(false);
    }
  };

  // ── Loading ────────────────────────────────────────────────────────────────

  if (aCarregar) {
    return (
      <div className="h-full flex bg-[var(--scolio-page-surface)]">
        <div className="flex-[65] bg-black flex items-center justify-center">
          <div className="w-48 space-y-3 opacity-30">
            <SkeletonBlock height="400px" />
          </div>
        </div>
        <div className="flex-[35] bg-white p-6 space-y-6">
          <SkeletonBlock height="56px" />
          <SkeletonBlock height="220px" />
          <SkeletonBlock height="140px" />
          <SkeletonBlock height="80px" />
        </div>
      </div>
    );
  }

  if (erroDados || !estudo) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-[var(--scolio-text-primary)] mb-2" style={{ fontSize: 'var(--text-h3)', fontWeight: 'var(--weight-semibold)' }}>
            Exame não encontrado
          </p>
          <p className="text-[var(--scolio-text-secondary)] mb-4" style={{ fontSize: 'var(--text-body)' }}>
            O exame solicitado não existe ou não tem permissão para o visualizar.
          </p>
          <Button variant="secondary" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  // ── Dados derivados ────────────────────────────────────────────────────────

  const resultado = estudo.resultado;
  const anguloFinal = resultado
    ? (resultado.anguloCobbCorrigido ?? resultado.anguloCobb)
    : null;
  const temImagens = imageUrls.length > 0;
  const jaValidado = resultado?.decisao !== null;
  const emProcessamento = estudo.estado === 'PROCESSING' || estudo.estado === 'UPLOADED';

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="h-full flex bg-[var(--scolio-page-surface)]">

      {/* ── Coluna esquerda — Visualizador de imagem (65%) ─────────────────── */}
      <div className="flex-[65] flex flex-col bg-black">

        {/* Toolbar clínica */}
        <div className="bg-[#1a1a1a] border-b border-gray-800 px-6 py-3">
          <div className="flex items-center justify-between">
            {/* Controlos esquerda */}
            <div className="flex items-center gap-4">
              {/* Zoom */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setZoom(Math.max(25, zoom - 25))}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                  title="Zoom out"
                >
                  <ZoomOut className="w-5 h-5" />
                </button>
                <span className="text-white min-w-16 text-center" style={{ fontSize: 'var(--text-body)' }}>
                  {zoom}%
                </span>
                <button
                  onClick={() => setZoom(Math.min(400, zoom + 25))}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                  title="Zoom in"
                >
                  <ZoomIn className="w-5 h-5" />
                </button>
              </div>

              <div className="w-px h-6 bg-gray-700" />

              <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors" title="Pan">
                <Move className="w-5 h-5" />
              </button>
              <button
                onClick={() => { setZoom(100); setBrightness(100); setContrast(100); }}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                title="Repor vista"
              >
                <RotateCcw className="w-5 h-5" />
              </button>

              <div className="w-px h-6 bg-gray-700" />

              {/* Brilho */}
              <div className="flex items-center gap-3">
                <Sun className="w-4 h-4 text-gray-400" />
                <input
                  type="range" min="0" max="200" value={brightness}
                  onChange={(e) => setBrightness(Number(e.target.value))}
                  className="w-24 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[var(--scolio-primary-blue)]"
                  title="Brilho"
                />
                <span className="text-gray-400 text-xs min-w-8">{brightness}%</span>
              </div>

              {/* Contraste */}
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-gradient-to-r from-gray-600 to-white rounded" />
                <input
                  type="range" min="0" max="200" value={contrast}
                  onChange={(e) => setContrast(Number(e.target.value))}
                  className="w-24 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[var(--scolio-primary-blue)]"
                  title="Contraste"
                />
                <span className="text-gray-400 text-xs min-w-8">{contrast}%</span>
              </div>
            </div>

            {/* Toggle overlay IA */}
            <button
              onClick={() => setAiOverlay(!aiOverlay)}
              className={`flex items-center gap-2 px-4 py-2 rounded-[var(--radius-component)] transition-colors ${
                aiOverlay
                  ? 'bg-[var(--scolio-primary-blue)] text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {aiOverlay ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              <span style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)' }}>
                AI Overlay {aiOverlay ? 'ON' : 'OFF'}
              </span>
            </button>
          </div>
        </div>

        {/* Área de imagem */}
        <div className="flex-1 flex items-center justify-center p-8 overflow-hidden">
          {temImagens ? (
            <div
              className="relative max-w-full max-h-full"
              style={{
                transform: `scale(${zoom / 100})`,
                filter: `brightness(${brightness}%) contrast(${contrast}%)`,
                transition: 'transform 0.2s, filter 0.2s',
              }}
            >
              <img
                src={imageUrls[selectedImage]}
                alt="Radiografia da coluna"
                className="max-w-full max-h-full object-contain"
              />

              {/* Overlay SVG gerado com coordenadas do modelo (overlay_json) */}
              {aiOverlay && resultado && anguloFinal !== null && (
                <svg
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  style={{ mixBlendMode: 'screen' }}
                >
                  {/* Linhas do ângulo de Cobb — coordenadas base até overlay_json do ML ser parseado */}
                  <line x1="30%" y1="25%" x2="70%" y2="25%" stroke="#1A6FAF" strokeWidth="2" strokeDasharray="5,5" />
                  <line x1="25%" y1="65%" x2="75%" y2="65%" stroke="#1A6FAF" strokeWidth="2" strokeDasharray="5,5" />
                  <line x1="50%" y1="25%" x2="50%" y2="65%" stroke="#1A6FAF" strokeWidth="3" />
                  {resultado.nivelVertebras && (
                    <>
                      <circle cx="50%" cy="45%" r="6" fill="#BA7517" opacity="0.8" />
                      <text x="50%" y="45%" fill="white" fontSize="10" textAnchor="middle" dy="3">
                        {resultado.nivelVertebras}
                      </text>
                    </>
                  )}
                  <text x="55%" y="42%" fill="#1A6FAF" fontSize="16" fontWeight="600">
                    {anguloFinal.toFixed(1)}°
                  </text>
                </svg>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 text-gray-500">
              {emProcessamento ? (
                <>
                  <div className="w-12 h-12 border-4 border-gray-600 border-t-[var(--scolio-primary-blue)] rounded-full animate-spin" />
                  <p style={{ fontSize: 'var(--text-body)' }}>
                    {estudo.estado === 'PROCESSING'
                      ? 'Modelo IA a processar imagem...'
                      : 'A aguardar upload de imagem'}
                  </p>
                </>
              ) : (
                <p style={{ fontSize: 'var(--text-body)' }}>Sem imagem disponível</p>
              )}
            </div>
          )}
        </div>

        {/* Tira de miniaturas */}
        {temImagens && (
          <div className="bg-[#1a1a1a] border-t border-gray-800 px-6 py-4">
            <div className="flex gap-3 justify-center">
              {imageUrls.map((url, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`w-20 h-20 rounded border-2 overflow-hidden transition-all ${
                    selectedImage === idx
                      ? 'border-[var(--scolio-primary-blue)] opacity-100'
                      : 'border-gray-700 opacity-50 hover:opacity-75'
                  }`}
                >
                  <img
                    src={url}
                    alt={`Vista ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Coluna direita — Painel de informação (35%) ────────────────────── */}
      <div className="flex-[35] bg-white overflow-y-auto">
        <div className="p-6 space-y-6">

          {/* Cabeçalho */}
          <div className="pb-4 border-b border-[var(--scolio-border-light)]">
            <h2 className="text-[var(--scolio-text-primary)] mb-1">{estudo.pacienteNome}</h2>
            <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>
              Data do exame:{' '}
              {new Date(estudo.dataEstudo).toLocaleDateString('pt-PT', {
                day: 'numeric', month: 'long', year: 'numeric',
              })}
            </p>
            {estudo.geradoPorIA && (
              <span
                className="inline-flex items-center px-2 py-0.5 rounded-full bg-[var(--scolio-light-blue-surface)] text-[var(--scolio-primary-blue)] mt-1"
                style={{ fontSize: 'var(--text-caption)' }}
              >
                IA assistida
              </span>
            )}
          </div>

          {/* Métricas IA */}
          <section>
            <h3 className="text-[var(--scolio-text-primary)] mb-4">Métricas IA</h3>
            {resultado ? (
              <div className="bg-[var(--scolio-page-surface)] rounded-[var(--radius-card)] p-5 space-y-5">

                {/* Ângulo de Cobb */}
                <div>
                  <p className="text-[var(--scolio-text-secondary)] mb-3" style={{ fontSize: 'var(--text-body)' }}>
                    Ângulo de Cobb
                    {resultado.decisao === 'CORRIGIDO' ? ' (corrigido pelo médico)' : ''}
                  </p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p
                        className="text-[var(--scolio-text-primary)] font-semibold mb-1"
                        style={{ fontSize: '48px', lineHeight: '1' }}
                      >
                        {anguloFinal!.toFixed(1)}°
                      </p>
                      <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>
                        {resultado.grauCurvatura}
                      </p>
                    </div>
                    <CobbAngleGauge angle={anguloFinal!} size={120} />
                  </div>
                  {resultado.decisao === 'CORRIGIDO' && (
                    <p className="text-[var(--scolio-text-secondary)] mt-1" style={{ fontSize: 'var(--text-caption)' }}>
                      Original IA: {resultado.anguloCobb.toFixed(1)}°
                    </p>
                  )}
                </div>

                {/* Vértebra apical */}
                {resultado.nivelVertebras && (
                  <div className="flex items-center justify-between py-3 border-t border-[var(--scolio-border-light)]">
                    <span className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>
                      Vértebra apical
                    </span>
                    <span
                      className="text-[var(--scolio-text-primary)] font-semibold"
                      style={{ fontSize: 'var(--text-h3)' }}
                    >
                      {resultado.nivelVertebras}
                    </span>
                  </div>
                )}

                {/* Localização */}
                {resultado.localizacaoCurva && (
                  <div className="flex items-center justify-between py-2 border-t border-[var(--scolio-border-light)]">
                    <span className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>
                      Localização
                    </span>
                    <span className="text-[var(--scolio-text-primary)] font-medium" style={{ fontSize: 'var(--text-body)' }}>
                      {resultado.localizacaoCurva}
                    </span>
                  </div>
                )}

                {/* Confiança do modelo */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>
                      Confiança IA
                    </span>
                    <span
                      className="font-semibold"
                      style={{
                        fontSize: 'var(--text-body)',
                        color: resultado.confiancaModelo >= 0.8
                          ? 'var(--scolio-success-green)'
                          : resultado.confiancaModelo >= 0.6
                          ? 'var(--scolio-warning-amber)'
                          : 'var(--scolio-danger-coral)',
                      }}
                    >
                      {Math.round(resultado.confiancaModelo * 100)}%
                    </span>
                  </div>
                  <ProgressBar progress={Math.round(resultado.confiancaModelo * 100)} showLabel={false} />
                </div>

                {/* Estado de validação */}
                {resultado.decisao && (
                  <div
                    className={`flex items-center gap-2 p-3 rounded-[var(--radius-component)] border ${
                      resultado.decisao === 'ACEITE'
                        ? 'bg-[var(--scolio-success-surface)] border-[var(--scolio-success-green)]'
                        : resultado.decisao === 'CORRIGIDO'
                        ? 'bg-[var(--scolio-warning-surface)] border-[var(--scolio-warning-amber)]'
                        : 'bg-[var(--scolio-danger-surface)] border-[var(--scolio-danger-coral)]'
                    }`}
                  >
                    <Check
                      className="w-4 h-4 flex-shrink-0"
                      style={{
                        color: resultado.decisao === 'ACEITE'
                          ? 'var(--scolio-success-green)'
                          : resultado.decisao === 'CORRIGIDO'
                          ? 'var(--scolio-warning-amber)'
                          : 'var(--scolio-danger-coral)',
                      }}
                    />
                    <p className="text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-medium)' }}>
                      {resultado.decisao === 'ACEITE'
                        ? 'Métricas aceites pelo médico'
                        : resultado.decisao === 'CORRIGIDO'
                        ? 'Métricas corrigidas pelo médico'
                        : 'Métricas rejeitadas'}
                      {resultado.dataValidacao && (
                        <> · {new Date(resultado.dataValidacao).toLocaleDateString('pt-PT')}</>
                      )}
                    </p>
                  </div>
                )}

                {/* Botões de acção — apenas se ainda não validado */}
                {!jaValidado && (
                  <div className="flex gap-2 pt-3">
                    <Button
                      variant="primary"
                      className="flex-1 bg-[var(--scolio-success-green)] hover:bg-[#188D68]"
                      onClick={handleConfirmar}
                      disabled={aConfirmar}
                    >
                      <Check className="w-4 h-4 mr-2" />
                      {aConfirmar ? 'A confirmar...' : 'Confirmar métricas IA'}
                    </Button>
                    <Button
                      variant="ghost"
                      className="flex-1"
                      onClick={() => setShowCorrectModal(true)}
                      disabled={aConfirmar}
                    >
                      <Edit3 className="w-4 h-4 mr-2" />
                      Corrigir métricas
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              /* Sem resultado IA ainda */
              <div className="bg-[var(--scolio-page-surface)] rounded-[var(--radius-card)] p-8 text-center">
                {estudo.estado === 'PROCESSING' ? (
                  <div className="flex flex-col items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full border-4 border-[var(--scolio-border-light)] border-t-[var(--scolio-primary-blue)] animate-spin"
                    />
                    <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>
                      Modelo IA a processar…
                    </p>
                  </div>
                ) : (
                  <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>
                    Sem resultados disponíveis
                  </p>
                )}
              </div>
            )}
          </section>

          {/* Notas clínicas */}
          <section>
            <h3 className="text-[var(--scolio-text-primary)] mb-4">Notas clínicas</h3>
            <div className="space-y-3">
              <Textarea
                value={clinicalNotes}
                onChange={(e) => setClinicalNotes(e.target.value)}
                rows={6}
                placeholder="Introduza observações clínicas..."
              />
              <Button
                variant="primary"
                className="w-full"
                onClick={handleGuardarNotas}
                disabled={aGuardarNotas}
              >
                {aGuardarNotas ? 'A guardar...' : 'Guardar notas'}
              </Button>
            </div>
          </section>

          {/* Estado do exame */}
          <section>
            <h3 className="text-[var(--scolio-text-primary)] mb-4">Estado do exame</h3>
            <div className="bg-[var(--scolio-page-surface)] rounded-[var(--radius-card)] p-5">
              <div className="flex items-center justify-between">
                <span className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>
                  Estado atual
                </span>
                <StatusBadge status={estadoParaBadge(estudo.estado)} />
              </div>
              <p className="text-[var(--scolio-text-secondary)] mt-2" style={{ fontSize: 'var(--text-caption)' }}>
                Versão do modelo: {resultado?.versaoModelo ?? '—'}
              </p>
            </div>
          </section>

          {/* Acções finais */}
          <div className="space-y-3 pt-4 border-t border-[var(--scolio-border-light)]">
            <Button
              variant="primary"
              className="w-full"
              onClick={() => navigate('/report-generation')}
              disabled={!resultado || emProcessamento}
            >
              <FileText className="w-4 h-4 mr-2" />
              Gerar relatório PDF
            </Button>
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => navigate('/exam-comparison')}
            >
              <GitCompare className="w-4 h-4 mr-2" />
              Comparar com outro exame
            </Button>
            <Button
              variant="ghost"
              className="w-full text-[var(--scolio-danger-coral)] hover:bg-[var(--scolio-danger-surface)]"
              onClick={() => setShowArchiveModal(true)}
              disabled={estudo.arquivado || aArquivar}
            >
              <Archive className="w-4 h-4 mr-2" />
              {estudo.arquivado ? 'Exame arquivado' : 'Arquivar exame'}
            </Button>
          </div>
        </div>
      </div>

      {/* ── Modal: Corrigir métricas ────────────────────────────────────────── */}
      {showCorrectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-[var(--radius-modal)] shadow-lg w-[480px]">
            <div className="p-6 border-b border-[var(--scolio-border-light)]">
              <h2 className="text-[var(--scolio-text-primary)]">Corrigir métricas</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label
                  className="block text-[var(--scolio-text-primary)] mb-2"
                  style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)' }}
                >
                  Ângulo de Cobb (graus)
                </label>
                <Input
                  type="number"
                  value={correctedAngle}
                  onChange={(e) => setCorrectedAngle(e.target.value)}
                  placeholder="Ex: 15.7"
                />
              </div>
              <div>
                <label
                  className="block text-[var(--scolio-text-primary)] mb-2"
                  style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)' }}
                >
                  Vértebra apical
                </label>
                <Input
                  type="text"
                  value={correctedVertebra}
                  onChange={(e) => setCorrectedVertebra(e.target.value)}
                  placeholder="Ex: T8"
                />
              </div>
              <div>
                <label
                  className="block text-[var(--scolio-text-primary)] mb-2"
                  style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)' }}
                >
                  Justificação <span className="text-[var(--scolio-text-secondary)] font-normal">(opcional)</span>
                </label>
                <Textarea
                  value={correctionJustification}
                  onChange={(e) => setCorrectionJustification(e.target.value)}
                  rows={3}
                  placeholder="Motivo da correção..."
                />
              </div>
            </div>
            <div className="p-6 border-t border-[var(--scolio-border-light)] flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setShowCorrectModal(false)} disabled={aCorrigir}>
                Cancelar
              </Button>
              <Button variant="primary" onClick={handleCorrigir} disabled={aCorrigir}>
                {aCorrigir ? 'A guardar...' : 'Guardar correção'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Arquivar exame ───────────────────────────────────────────── */}
      {showArchiveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-[var(--radius-modal)] shadow-lg w-[480px]">
            <div className="p-6 border-b border-[var(--scolio-border-light)]">
              <h2 className="text-[var(--scolio-text-primary)]">Arquivar exame</h2>
            </div>
            <div className="p-6">
              <p className="text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-body)' }}>
                Tem a certeza que pretende arquivar este exame? Esta ação fica registada
                na auditoria e não pode ser desfeita.
              </p>
            </div>
            <div className="p-6 border-t border-[var(--scolio-border-light)] flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setShowArchiveModal(false)} disabled={aArquivar}>
                Cancelar
              </Button>
              <Button
                variant="primary"
                className="bg-[var(--scolio-danger-coral)] hover:bg-[#C24D25]"
                onClick={handleArquivar}
                disabled={aArquivar}
              >
                {aArquivar ? 'A arquivar...' : 'Arquivar'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast ──────────────────────────────────────────────────────────── */}
      {toast && (
        <div className="fixed top-8 right-8 z-50">
          <Toast
            title={toast.msg}
            type={toast.type === 'error' ? 'error' : 'success'}
            onClose={() => setToast(null)}
          />
        </div>
      )}
    </div>
  );
}
