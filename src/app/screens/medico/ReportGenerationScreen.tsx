import React from 'react';
import { ArrowLeft, FileText, Shield, Check, Loader2, AlertCircle, Send } from 'lucide-react';
import { Button, Modal, Toast, Textarea } from '../../components/scolio';
import { useNavigate, useParams } from 'react-router';
import { useAuth } from '../../auth/AuthContext';
import { useTranslation } from 'react-i18next';
import { getDateLocale } from '../../../lib/dateLocale';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { getEstudoCompleto, getUrlImagemEstudo, guardarObservacoesMedico, guardarAssinaturaDocumento, enviarEstudoAoPaciente } from '../../../data/repository/estudos';
import { supabase } from '../../../lib/supabase';
import { getPaciente } from '../../../data/repository/pacientes';
import type { EstudoCompleto, PacienteDetalhe, MedicoEspecialista, VertebraDetetada, CobbMeasurementData } from '../../../data/types';
import { OverlayCobb } from '../../components/scolio';

const BUCKET_RELATORIOS = 'relatorios';

// ── Helper: gera SVG string do overlay Cobb para usar no template HTML do PDF ─
function gerarSvgOverlayCobb(
  natural: { w: number; h: number },
  vertebrae: VertebraDetetada[] | null,
  measurement: CobbMeasurementData | null,
  anguloCobb: number | null,
): string {
  const { w, h } = natural;
  const strokeBase = Math.max(2, Math.round(w * 0.002));
  const fontSize   = Math.max(18, Math.round(w * 0.025));

  const upperV = vertebrae && measurement ? vertebrae.find((v) => v.id === measurement.upperVertebraIndex) : null;
  const lowerV = vertebrae && measurement ? vertebrae.find((v) => v.id === measurement.lowerVertebraIndex) : null;

  function ext(x1: number, y1: number, x2: number, y2: number, f = 0.4) {
    const dx = x2 - x1, dy = y2 - y1;
    return { x1: x1 - dx * f, y1: y1 - dy * f, x2: x2 + dx * f, y2: y2 + dy * f };
  }

  const ul = upperV?.polygon ? ext(upperV.polygon[0][0], upperV.polygon[0][1], upperV.polygon[1][0], upperV.polygon[1][1]) : null;
  const ll = lowerV?.polygon ? ext(lowerV.polygon[3][0], lowerV.polygon[3][1], lowerV.polygon[2][0], lowerV.polygon[2][1]) : null;

  const labelX = w * 0.78;
  const labelY = upperV?.center && lowerV?.center ? (upperV.center[1] + lowerV.center[1]) / 2 : h / 2;

  const polys = (vertebrae ?? []).map((v) => {
    if (!v.polygon || v.polygon.length < 4) return '';
    const isCobb = measurement?.upperVertebraIndex === v.id || measurement?.lowerVertebraIndex === v.id;
    const stroke = isCobb ? '#F59E0B' : '#1A6FAF';
    const fill   = isCobb ? 'rgba(245,158,11,0.18)' : 'rgba(26,111,175,0.08)';
    const sw     = isCobb ? strokeBase * 1.8 : strokeBase;
    const pts    = v.polygon.map(([x, y]) => `${x},${y}`).join(' ');
    return `<polygon points="${pts}" stroke="${stroke}" stroke-width="${sw}" fill="${fill}"/>`;
  }).join('');

  const upperSvg = ul ? `<line x1="${ul.x1}" y1="${ul.y1}" x2="${ul.x2}" y2="${ul.y2}" stroke="#EF4444" stroke-width="${strokeBase * 1.6}" stroke-dasharray="${strokeBase * 3} ${strokeBase * 2}"/>` : '';
  const lowerSvg = ll ? `<line x1="${ll.x1}" y1="${ll.y1}" x2="${ll.x2}" y2="${ll.y2}" stroke="#EF4444" stroke-width="${strokeBase * 1.6}" stroke-dasharray="${strokeBase * 3} ${strokeBase * 2}"/>` : '';

  const labelSvg = anguloCobb !== null ? `
    <rect x="${labelX - fontSize * 1.6}" y="${labelY - fontSize * 0.9}" width="${fontSize * 3.2}" height="${fontSize * 1.4}" rx="${fontSize * 0.2}" fill="rgba(15,23,42,0.85)"/>
    <text x="${labelX}" y="${labelY + fontSize * 0.1}" fill="#FBBF24" font-size="${fontSize}" font-weight="700" text-anchor="middle" dominant-baseline="middle">${anguloCobb.toFixed(1)}°</text>
  ` : '';

  return `<svg style="position:absolute;inset:0;width:100%;height:100%;mix-blend-mode:screen;" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">${polys}${upperSvg}${lowerSvg}${labelSvg}</svg>`;
}
const MAX_PDF_SIZE = 10 * 1024 * 1024; // 10 MB

async function calcularHashSHA256(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function formatarData(isoDate: string | null, locale: string): string {
  if (!isoDate) return '—';
  return new Date(isoDate).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
}

let logoDataUrlPromise: Promise<string | null> | null = null;

async function obterLogoDataUrl(): Promise<string | null> {
  if (!logoDataUrlPromise) {
    logoDataUrlPromise = fetch('/logo.png')
      .then(async (res) => {
        if (!res.ok) return null;
        const blob = await res.blob();
        const buffer = await blob.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        let binary = '';

        for (let i = 0; i < bytes.length; i += 0x8000) {
          binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
        }

        return `data:${blob.type || 'image/png'};base64,${btoa(binary)}`;
      })
      .catch(() => null);
  }

  return logoDataUrlPromise;
}

// ── Traduções PT / EN do documento (usadas no PDF e na prévia) ────────────────
const REPORT_TR = {
  pt: {
    title: 'Relatório Clínico de Escoliose', subtitle: 'Análise Clínica da Coluna Vertebral',
    patient: 'Informação do paciente', fullName: 'Nome completo', utente: 'Nº utente',
    dob: 'Data de nascimento', gender: 'Género',
    examDate: 'Data do exame', reportDate: 'Data do relatório',
    examImage: 'Imagem do exame', noImage: 'Sem imagem', metrics: 'Métricas validadas',
    cobbAI: 'Ângulo de Cobb (IA)', cobbCorr: 'Ângulo de Cobb (corrigido)',
    classif: 'Classificação',
    notes: 'Observações do médico', sig: 'Assinatura digital',
    sigBy: 'Médico', license: 'Cédula', specialty: 'Especialidade',
    pending: 'Documento por assinar',
    footer: 'Documento gerado automaticamente pelo ScolioCare — não substitui relatório clínico assinado.',
    metric: 'Métrica', value: 'Valor', yearsUnit: 'anos',
  },
  en: {
    title: 'Clinical Scoliosis Report', subtitle: 'Clinical Spine Analysis',
    patient: 'Patient information', fullName: 'Full name', utente: 'Patient ID',
    dob: 'Date of birth', gender: 'Gender',
    examDate: 'Exam date', reportDate: 'Report date',
    examImage: 'Exam image', noImage: 'No image', metrics: 'Validated metrics',
    cobbAI: 'Cobb angle (AI)', cobbCorr: 'Cobb angle (corrected)',
    classif: 'Classification',
    notes: "Doctor's observations", sig: 'Digital signature',
    sigBy: 'Physician', license: 'Medical license', specialty: 'Specialty',
    pending: 'Document pending signature',
    footer: 'Automatically generated document — does not replace a signed clinical report.',
    metric: 'Metric', value: 'Value', yearsUnit: 'years',
  },
} as const;

function computeAge(dataNascimento: string | null): number | null {
  if (!dataNascimento) return null;
  const nasc = new Date(dataNascimento);
  const hoje = new Date();
  let idade = hoje.getFullYear() - nasc.getFullYear();
  const m = hoje.getMonth() - nasc.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
  return idade;
}

export default function ReportGenerationScreen() {
  const navigate = useNavigate();
  const { estudoId } = useParams<{ estudoId: string }>();
  const { utilizador } = useAuth();
  const { t, i18n } = useTranslation();

  const [estudo, setEstudo] = React.useState<EstudoCompleto | null>(null);
  const [paciente, setPaciente] = React.useState<PacienteDetalhe | null>(null);
  const [urlImagem, setUrlImagem] = React.useState<string | null>(null);
  const [logoDataUrl, setLogoDataUrl] = React.useState<string | null>(null);
  const [imgNaturalSize, setImgNaturalSize] = React.useState<{ w: number; h: number } | null>(null);
  const [aCarregar, setACarregar] = React.useState(true);
  const [erroCarregamento, setErroCarregamento] = React.useState(false);

  const previewRef = React.useRef<HTMLDivElement>(null);

  const [includedSections, setIncludedSections] = React.useState({
    dadosPaciente: true,
    imagemExame: true,
    overlayIA: true,
    metricasValidadas: true,
    observacoesMedico: true,
    assinaturaDigital: true,
  });
  const [idioma, setIdioma] = React.useState(i18n.language === 'en' ? 'en' : 'pt');
  const idiomaEscolhidoManualmente = React.useRef(false);
  // Acompanha a língua da interface até o utilizador escolher explicitamente
  // a língua do relatório no painel "Idioma do relatório".
  React.useEffect(() => {
    if (!idiomaEscolhidoManualmente.current) {
      setIdioma(i18n.language === 'en' ? 'en' : 'pt');
    }
  }, [i18n.language]);
  const escolherIdioma = (val: string) => {
    idiomaEscolhidoManualmente.current = true;
    setIdioma(val);
  };
  const ps = REPORT_TR[idioma as 'pt' | 'en'] ?? REPORT_TR.pt;
  const dateLocale = getDateLocale(idioma);
  const [observacoesMedico, setObservacoesMedico] = React.useState('');
  const [hashDocumento, setHashDocumento] = React.useState<string | null>(null);
  const [dataAssinatura, setDataAssinatura] = React.useState<string | null>(null);
  const [aAssinar, setAAssinar] = React.useState(false);
  const [captureMode, setCaptureMode] = React.useState(false);
  const pendingCapture = React.useRef<(() => void) | null>(null);

  React.useEffect(() => {
    if (captureMode && pendingCapture.current) {
      pendingCapture.current();
      pendingCapture.current = null;
    }
  }, [captureMode]);

  React.useEffect(() => {
    let cancelado = false;
    obterLogoDataUrl().then((logo) => {
      if (!cancelado) setLogoDataUrl(logo);
    });

    return () => {
      cancelado = true;
    };
  }, []);

  const [aEnviar, setAEnviar] = React.useState(false);
  const [foiEnviado, setFoiEnviado] = React.useState(false);
  const [showSignatureModal, setShowSignatureModal] = React.useState(false);
  const [toast, setToast] = React.useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const mostrarToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  React.useEffect(() => {
    if (!estudoId) { setACarregar(false); return; }

    getEstudoCompleto(estudoId).then(async (e) => {
      if (!e) { setErroCarregamento(true); setACarregar(false); return; }
      setEstudo(e);
      setObservacoesMedico(e.resultado?.observacoesMedico ?? '');
      setHashDocumento(e.hashDocumento);
      setDataAssinatura(e.dataAssinatura);
      setFoiEnviado(e.estado === 'SENT');

      const [p, url] = await Promise.all([
        getPaciente(e.pacienteId),
        e.imagens[0] ? getUrlImagemEstudo(e.imagens[0].caminhoArmazenamento) : Promise.resolve(null),
      ]);
      setPaciente(p);
      setUrlImagem(url);
      setACarregar(false);
    }).catch(() => { setErroCarregamento(true); setACarregar(false); });
  }, [estudoId]);

  const toggleSection = (s: keyof typeof includedSections) =>
    setIncludedSections((prev) => ({ ...prev, [s]: !prev[s] }));

  const handleGenerate = async () => {
    if (!estudo) return;

    const s = REPORT_TR[idioma as 'pt' | 'en'] ?? REPORT_TR.pt;
    const agora = new Date().toLocaleString(dateLocale, { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const dataExameStr = formatarData(estudo.dataEstudo, dateLocale);
    const r = estudo.resultado;
    const idadePaciente = computeAge(paciente?.dataNascimento ?? null);
    const logoDataUrl = await obterLogoDataUrl();

    const secaoPaciente = includedSections.dadosPaciente ? `
      <h2>${s.patient}</h2>
      <div class="grid">
        <div class="field"><label>${s.fullName}</label><span>${estudo.pacienteNome}</span></div>
        ${paciente?.numeroUtente ? `<div class="field"><label>${s.utente}</label><span>${paciente.numeroUtente}</span></div>` : ''}
        ${paciente?.dataNascimento ? `<div class="field"><label>${s.dob}</label><span>${formatarData(paciente.dataNascimento, dateLocale)}${idadePaciente !== null ? ` (${idadePaciente} ${s.yearsUnit})` : ''}</span></div>` : ''}
        ${paciente?.genero ? `<div class="field"><label>${s.gender}</label><span>${paciente.genero}</span></div>` : ''}
      </div>` : '';

    const secaoDatas = `
      <div class="grid2">
        <div><h4>${s.examDate}</h4><p>${dataExameStr}</p></div>
        <div><h4>${s.reportDate}</h4><p>${agora}</p></div>
      </div>`;

    const secaoImagem = includedSections.imagemExame && urlImagem ? `
      <h2>${s.examImage}</h2>
      <div style="background:#000;padding:16px;border-radius:6px;display:flex;justify-content:center;">
        <div style="position:relative;width:192px;height:256px;">
          <img src="${urlImagem}" alt="Exame" style="width:100%;height:100%;object-fit:contain;" />
          ${includedSections.overlayIA && r && imgNaturalSize
            ? gerarSvgOverlayCobb(
                imgNaturalSize,
                r.pontosAnatomicos,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (r.cobbAnglesData as any)?.measurement ?? null,
                r.anguloCobbCorrigido ?? r.anguloCobb,
              )
            : ''}
        </div>
      </div>` : '';

    const secaoMetricas = includedSections.metricasValidadas && r ? `
      <h2>${s.metrics}</h2>
      <table>
        <thead><tr><th>${s.metric}</th><th>${s.value}</th></tr></thead>
        <tbody>
          <tr><td>${s.cobbAI}</td><td><strong>${r.anguloCobb.toFixed(1)}°</strong></td></tr>
          ${r.anguloCobbCorrigido !== null ? `<tr><td>${s.cobbCorr}</td><td><strong>${r.anguloCobbCorrigido.toFixed(1)}°</strong></td></tr>` : ''}
          <tr><td>${s.classif}</td><td>${r.grauCurvatura}</td></tr>
        </tbody>
      </table>` : '';

    const secaoNotas = includedSections.observacoesMedico && observacoesMedico ? `
      <h2>${s.notes}</h2>
      <div class="notes-box">${observacoesMedico}</div>` : '';

    const secaoAssinatura = includedSections.assinaturaDigital ? `
      <div class="sig-block" style="${hashDocumento ? 'background:#f0faf5;border-color:#22c55e' : ''}">
        <div class="sig-header" style="color:${hashDocumento ? '#16a34a' : '#1a6faf'}">
          ${hashDocumento ? '✔ ' : '🔒 '}${s.sig}
        </div>
        <div class="field"><label>${s.sigBy}</label><span>${nomeMedico}</span></div>
        ${medico?.cedulaProfissional ? `<div class="field"><label>${s.license}</label><span>${medico.cedulaProfissional}</span></div>` : ''}
        ${medico?.especialidade ? `<div class="field"><label>${s.specialty}</label><span>${medico.especialidade}</span></div>` : ''}
        ${hashDocumento && dataAssinatura
          ? `<div class="field" style="margin-top:8px"><label>Data</label><span>${new Date(dataAssinatura).toLocaleString(dateLocale)}</span></div>
             <p style="font-size:10px;color:#666;margin-top:6px;font-family:monospace;word-break:break-all">SHA-256: ${hashDocumento}</p>`
          : `<p style="font-size:11px;color:#999;margin-top:8px">${s.pending}</p>`
        }
      </div>` : '';

    const html = `<!DOCTYPE html>
<html lang="${idioma}">
<head>
  <meta charset="UTF-8"/>
  <title>${s.title} — ${estudo.pacienteNome}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Segoe UI',Arial,sans-serif;font-size:13px;color:#1a1a2e;line-height:1.5;padding:32px}
    h2{font-size:13px;font-weight:600;color:#1a6faf;margin:20px 0 8px;border-bottom:1px solid #e0e6f0;padding-bottom:4px;text-transform:uppercase;letter-spacing:.04em}
    h4{font-size:12px;font-weight:600;color:#444;margin-bottom:4px}
    .header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #1a6faf;padding-bottom:12px;margin-bottom:4px}
    .logo{display:flex;align-items:center;gap:10px}
    .logo-box{width:40px;height:40px;background:#1a6faf;border-radius:8px;display:flex;align-items:center;justify-content:center;color:white;font-size:22px;font-weight:700}
    .logo-img{width:40px;height:40px;object-fit:contain;display:block;border-radius:8px}
    .doc-title{font-size:20px;font-weight:700;color:#1a6faf;margin-top:8px}
    .meta{text-align:right;font-size:11px;color:#666}
    .grid{display:grid;grid-template-columns:1fr 1fr;gap:4px 24px}
    .grid2{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:8px}
    .field{display:flex;gap:8px;padding:3px 0}
    .field label{color:#666;min-width:120px;flex-shrink:0;font-size:12px}
    .field span{font-weight:500}
    table{width:100%;border-collapse:collapse;margin-top:4px}
    th{background:#f0f4fa;text-align:left;padding:6px 10px;font-size:11px;font-weight:600;color:#555;text-transform:uppercase}
    td{padding:6px 10px;border-bottom:1px solid #eef1f7}
    tr:last-child td{border-bottom:none}
    .notes-box{background:#f8fafc;border:1px solid #e0e6f0;border-radius:6px;padding:12px;white-space:pre-wrap;font-size:12px;color:#444;line-height:1.7}
    .sig-block{margin-top:24px;padding:12px 16px;border:1px solid #1a6faf;border-radius:6px;background:#f0f6ff}
    .sig-header{font-weight:600;color:#1a6faf;margin-bottom:8px}
    .footer{margin-top:32px;padding-top:12px;border-top:1px solid #e0e6f0;font-size:10px;color:#aaa;text-align:center}
    p{color:#555;font-size:12px}
    @media print{body{padding:0}@page{margin:1.5cm}}
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">
      ${logoDataUrl ? `<img src="${logoDataUrl}" alt="ScolioCare" class="logo-img" />` : `<div class="logo-box">S</div>`}
      <div>
        <div style="font-size:13px;color:#666">${s.subtitle}</div>
        <div class="doc-title">${s.title}</div>
      </div>
    </div>
    <div class="meta">
      <div>${s.reportDate}: ${agora}</div>
      <div>${s.sigBy}: ${nomeMedico}</div>
    </div>
  </div>
  ${secaoPaciente}
  ${secaoDatas}
  ${secaoImagem}
  ${secaoMetricas}
  ${secaoNotas}
  ${secaoAssinatura}
  <div class="footer">${s.footer}</div>
  <script>window.onload=()=>window.print()</script>
</body>
</html>`;

    const janela = window.open('', '_blank', 'width=900,height=750');
    if (janela) {
      janela.document.write(html);
      janela.document.close();
    } else {
      mostrarToast('O browser bloqueou o pop-up. Permite pop-ups para este site e tenta novamente.', 'error');
    }
  };

  const assinar = async () => {
    if (!estudo || !previewRef.current) return;
    setAAssinar(true);
    try {
      // Guardar observações na BD antes de gerar o PDF
      if (estudo.resultado) {
        await guardarObservacoesMedico(estudo.resultado.id, observacoesMedico);
      }

      // Activar captureMode para que o bloco de assinatura apareça no PDF
      await new Promise<void>((resolve) => {
        pendingCapture.current = resolve;
        setCaptureMode(true);
      });

      // Scroll ao topo do container antes de capturar para garantir que o html2canvas
      // calcula as coordenadas correctas e não corta secções abaixo do fold
      const scrollContainer = previewRef.current.closest('.overflow-auto') as HTMLElement | null;
      const prevScroll = scrollContainer?.scrollTop ?? 0;
      if (scrollContainer) scrollContainer.scrollTop = 0;
      await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));

      // Capturar prévia e gerar PDF Blob
      const canvas = await html2canvas(previewRef.current, { scale: 2, useCORS: true });
      if (scrollContainer) scrollContainer.scrollTop = prevScroll;
      setCaptureMode(false);

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeightA4 = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      let heightLeft = imgHeight - pageHeightA4;
      let pageNum = 1;
      while (heightLeft > 0) {
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, -(pageNum * pageHeightA4), imgWidth, imgHeight);
        heightLeft -= pageHeightA4;
        pageNum++;
      }

      const blob = pdf.output('blob');

      // Validar tamanho e tipo
      if (blob.size > MAX_PDF_SIZE) {
        mostrarToast('O PDF gerado excede os 10 MB. Reduz as secções incluídas e tenta novamente.', 'error');
        return;
      }
      if (blob.type !== 'application/pdf') {
        mostrarToast('Tipo de ficheiro inválido. Só são aceites ficheiros PDF.', 'error');
        return;
      }

      // Calcular hash SHA-256 do conteúdo do PDF
      const hash = await calcularHashSHA256(blob);
      const agora = new Date().toISOString();
      const assinatura = [
        `SHA256:${hash}`,
        `MEDICO_ID:${utilizador?.id ?? ''}`,
        `CEDULA:${medico?.cedulaProfissional ?? ''}`,
        `TS:${agora}`,
      ].join('|');

      // Upload para Supabase Storage
      const path = `${estudo.pacienteId}/${estudo.id}.pdf`;
      const { error: uploadError } = await supabase.storage
        .from(BUCKET_RELATORIOS)
        .upload(path, blob, { contentType: 'application/pdf', upsert: true });
      if (uploadError) throw uploadError;

      // Guardar path, hash e assinatura na BD
      await guardarAssinaturaDocumento(estudo.id, path, hash, assinatura, agora);

      setHashDocumento(hash);
      setDataAssinatura(agora);
      mostrarToast('Documento assinado com sucesso.');
    } catch {
      setCaptureMode(false);
      mostrarToast('Erro ao assinar o documento. Tenta novamente.', 'error');
    } finally {
      setAAssinar(false);
    }
  };

  const enviarAoPaciente = async () => {
    if (!estudo) return;
    setAEnviar(true);
    try {
      await enviarEstudoAoPaciente(estudo.id, estudo.pacienteId);
      setFoiEnviado(true);
      mostrarToast('Relatório enviado ao paciente com sucesso.');
    } catch {
      mostrarToast('Erro ao enviar o relatório. Tenta novamente.', 'error');
    } finally {
      setAEnviar(false);
    }
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (aCarregar) {
    return (
      <div className="p-8 flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--scolio-primary-blue)]" />
      </div>
    );
  }

  if (erroCarregamento || !estudo) {
    return (
      <div className="p-8 space-y-6">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-[var(--scolio-text-secondary)] hover:text-[var(--scolio-text-primary)] transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-[var(--scolio-text-primary)]">{t('report.pageTitle')}</h1>
        </div>
        <div className="bg-white rounded-[var(--radius-card)] shadow-sm border border-[var(--scolio-border-light)] p-12 text-center">
          <AlertCircle className="w-12 h-12 text-[var(--scolio-danger-coral)] mx-auto mb-4" />
          <p className="text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-h3)', fontWeight: 'var(--weight-semibold)' }}>
            Exame não encontrado
          </p>
          <Button variant="secondary" className="mt-6" onClick={() => navigate(-1)}>Voltar</Button>
        </div>
      </div>
    );
  }

  const medico = utilizador?.perfil === 'MEDICO' ? (utilizador as MedicoEspecialista) : null;
  const nomeMedico = medico ? `Dr. ${medico.nomeCompleto}` : (utilizador?.nomeCompleto ?? '—');
  const dataRelatorio = formatarData(new Date().toISOString(), dateLocale);
  const dataExame = formatarData(estudo.dataEstudo, dateLocale);
  const dataExameUI = formatarData(estudo.dataEstudo, getDateLocale(i18n.language));
  const resultado = estudo.resultado;

  return (
    <div className="p-8 space-y-6 overflow-auto h-full">
      {/* Cabeçalho */}
      <div className="flex items-end justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-[var(--scolio-text-secondary)] hover:text-[var(--scolio-text-primary)] transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-[var(--scolio-text-primary)]">{t('report.pageTitle')}</h1>
            <p className="text-[var(--scolio-text-secondary)] mt-1" style={{ fontSize: 'var(--text-body)' }}>
              {estudo.pacienteNome} — {t('patientRecord.examOf', { date: dataExameUI })}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-10 gap-6">
        {/* Configuração (30%) */}
        <div className="col-span-3 space-y-6">
          <div className="bg-white rounded-[var(--radius-card)] shadow-sm border border-[var(--scolio-border-light)] p-6">
            <h3 className="text-[var(--scolio-text-primary)] mb-4">{t('report.sectionsTitle')}</h3>
            <div className="space-y-3">
              <CheckboxItem label={t('report.sectionPatientInfo')} checked={includedSections.dadosPaciente} onChange={() => toggleSection('dadosPaciente')} />
              <CheckboxItem label={t('report.sectionExamImage')} checked={includedSections.imagemExame} onChange={() => toggleSection('imagemExame')} />
              <CheckboxItem label={t('report.overlayAI')} checked={includedSections.overlayIA} onChange={() => toggleSection('overlayIA')} disabled={!includedSections.imagemExame} />
              <CheckboxItem label={t('report.sectionMetrics')} checked={includedSections.metricasValidadas} onChange={() => toggleSection('metricasValidadas')} />
              <CheckboxItem label={t('report.sectionNotes')} checked={includedSections.observacoesMedico} onChange={() => toggleSection('observacoesMedico')} />
              <CheckboxItem label={t('report.sectionSignature')} checked={includedSections.assinaturaDigital} onChange={() => toggleSection('assinaturaDigital')} />
            </div>
          </div>

          {/* Observações do médico */}
          <div className="bg-white rounded-[var(--radius-card)] shadow-sm border border-[var(--scolio-border-light)] p-6">
            <h3 className="text-[var(--scolio-text-primary)] mb-1">{t('report.sectionNotes')}</h3>
            <p className="text-[var(--scolio-text-secondary)] mb-3" style={{ fontSize: 'var(--text-caption)' }}>
              {t('report.observationsHint')}
            </p>
            <Textarea
              value={observacoesMedico}
              onChange={(e) => setObservacoesMedico(e.target.value)}
              rows={5}
              placeholder={t('report.observationsPlaceholder')}
            />
          </div>

          <div className="bg-white rounded-[var(--radius-card)] shadow-sm border border-[var(--scolio-border-light)] p-6">
            <h3 className="text-[var(--scolio-text-primary)] mb-4">{t('report.languageTitle')}</h3>
            <div className="space-y-2">
              {[{ val: 'pt', label: t('report.langPT') }, { val: 'en', label: t('report.langEN') }].map(({ val, label }) => (
                <label key={val} className="flex items-center gap-3 cursor-pointer">
                  <input type="radio" name="language" value={val} checked={idioma === val} onChange={() => escolherIdioma(val)} className="w-4 h-4 text-[var(--scolio-primary-blue)] focus:ring-[var(--scolio-primary-blue)]" />
                  <span className="text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-body)' }}>{label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Button variant="primary" className="w-full" onClick={handleGenerate}>
              <FileText className="w-4 h-4 mr-2" />{t('report.generatePdf')}
            </Button>
            <Button
              variant="primary"
              className="w-full bg-[var(--scolio-success-green)] hover:bg-[#188D68]"
              onClick={enviarAoPaciente}
              disabled={aEnviar || !hashDocumento || foiEnviado}
            >
              <Send className="w-4 h-4 mr-2" />
              {foiEnviado ? `✓ ${t('report.sendToPatient')}` : aEnviar ? t('report.sending') : t('report.sendToPatient')}
            </Button>
            <Button variant="secondary" className="w-full" onClick={() => setShowSignatureModal(true)} disabled={!includedSections.assinaturaDigital || aAssinar}>
              <Shield className="w-4 h-4 mr-2" />{aAssinar ? t('report.signing') : t('report.signDigitally')}
            </Button>
          </div>

          <div className="bg-[var(--scolio-light-blue-surface)] rounded-[var(--radius-card)] border border-[var(--scolio-primary-blue)] p-4">
            <p className="text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-caption)' }}>
              {t('report.pdfHintBefore')} <strong>&quot;{t('report.pdfHintSaveAsPdf')}&quot;</strong> {t('report.pdfHintAfter')}
            </p>
          </div>
        </div>

        {/* Prévia do documento (70%) */}
        <div className="col-span-7">
          <div className="bg-white rounded-[var(--radius-card)] shadow-sm border border-[var(--scolio-border-light)] overflow-hidden">
            <div className="px-6 py-4 bg-[var(--scolio-page-surface)] border-b border-[var(--scolio-border-light)] flex items-center justify-between">
              <h3 className="text-[var(--scolio-text-primary)]">{t('report.documentPreview')}</h3>
              <span className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>{t('report.formatA4')}</span>
            </div>

            <div className="p-8 bg-[var(--scolio-page-surface)] flex justify-center">
              <div ref={previewRef} className="w-[595px] bg-white shadow-lg" style={{ minHeight: '842px' }}>
                <div className="p-12 space-y-6">
                  {/* Cabeçalho do documento */}
                  <div className="border-b border-[var(--scolio-border-light)] pb-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        {logoDataUrl ? (
                          <img src={logoDataUrl} alt="ScolioCare" className="w-12 h-12 rounded-lg object-contain" />
                        ) : (
                          <div className="w-12 h-12 bg-[var(--scolio-primary-blue)] rounded-lg flex items-center justify-center">
                            <span className="text-white text-2xl font-semibold">S</span>
                          </div>
                        )}
                        <div>
                          <h3 className="text-[var(--scolio-text-primary)] font-semibold" style={{ fontSize: 'var(--text-h3)' }}>ScolioCare</h3>
                          <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>{ps.subtitle}</p>
                        </div>
                      </div>
                    </div>
                    <h2 className="text-[var(--scolio-primary-blue)]">{ps.title}</h2>
                  </div>

                  {/* Dados do paciente */}
                  {includedSections.dadosPaciente && (
                    <section>
                      <h3 className="text-[var(--scolio-text-primary)] mb-3">{ps.patient}</h3>
                      <div className="bg-[var(--scolio-page-surface)] rounded-[var(--radius-component)] p-4 space-y-2">
                        <DataLine label={ps.fullName} value={estudo.pacienteNome} />
                        {paciente?.numeroUtente && <DataLine label={ps.utente} value={paciente.numeroUtente} />}
                        {paciente?.dataNascimento && (
                          <DataLine label={ps.dob} value={`${formatarData(paciente.dataNascimento, dateLocale)}${computeAge(paciente.dataNascimento) !== null ? ` (${computeAge(paciente.dataNascimento)} ${ps.yearsUnit})` : ''}`} />
                        )}
                        {paciente?.genero && <DataLine label={ps.gender} value={paciente.genero} />}
                      </div>
                    </section>
                  )}

                  {/* Datas */}
                  <section className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-[var(--scolio-text-primary)] mb-2" style={{ fontSize: 'var(--text-body)' }}>{ps.examDate}</h3>
                      <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>{dataExame}</p>
                    </div>
                    <div>
                      <h3 className="text-[var(--scolio-text-primary)] mb-2" style={{ fontSize: 'var(--text-body)' }}>{ps.reportDate}</h3>
                      <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>{dataRelatorio}</p>
                    </div>
                  </section>

                  {/* Imagem */}
                  {includedSections.imagemExame && (
                    <section>
                      <h3 className="text-[var(--scolio-text-primary)] mb-3">{ps.examImage}</h3>
                      <div className="bg-black rounded-[var(--radius-component)] p-4 flex justify-center">
                        <div className="relative w-48 h-64">
                          {urlImagem ? (
                            <>
                              <img
                                src={urlImagem}
                                alt="Exame"
                                className="w-full h-full object-contain"
                                onLoad={(e) => {
                                  const img = e.currentTarget;
                                  setImgNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
                                }}
                              />
                              {includedSections.overlayIA && resultado && imgNaturalSize && (
                                <OverlayCobb
                                  natural={imgNaturalSize}
                                  vertebrae={resultado.pontosAnatomicos}
                                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                  measurement={(resultado.cobbAnglesData as any)?.measurement ?? null}
                                  anguloCobb={resultado.anguloCobbCorrigido ?? resultado.anguloCobb}
                                />
                              )}
                            </>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[var(--scolio-neutral-gray)]">
                              {ps.noImage}
                            </div>
                          )}
                        </div>
                      </div>
                    </section>
                  )}

                  {/* Métricas validadas */}
                  {includedSections.metricasValidadas && resultado && (
                    <section>
                      <h3 className="text-[var(--scolio-text-primary)] mb-3">{ps.metrics}</h3>
                      <table className="w-full border border-[var(--scolio-border-light)] rounded-[var(--radius-component)] overflow-hidden">
                        <thead>
                          <tr className="bg-[var(--scolio-page-surface)]">
                            <th className="text-left px-4 py-2 border-b border-[var(--scolio-border-light)] text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-semibold)' }}>{ps.metric}</th>
                            <th className="text-left px-4 py-2 border-b border-[var(--scolio-border-light)] text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-semibold)' }}>{ps.value}</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="px-4 py-2 border-b border-[var(--scolio-border-light)] text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>{ps.cobbAI}</td>
                            <td className="px-4 py-2 border-b border-[var(--scolio-border-light)] text-[var(--scolio-text-primary)] font-semibold" style={{ fontSize: 'var(--text-caption)' }}>{resultado.anguloCobb.toFixed(1)}°</td>
                          </tr>
                          {resultado.anguloCobbCorrigido !== null && (
                            <tr>
                              <td className="px-4 py-2 border-b border-[var(--scolio-border-light)] text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>{ps.cobbCorr}</td>
                              <td className="px-4 py-2 border-b border-[var(--scolio-border-light)] text-[var(--scolio-text-primary)] font-semibold" style={{ fontSize: 'var(--text-caption)' }}>{resultado.anguloCobbCorrigido.toFixed(1)}°</td>
                            </tr>
                          )}
                          <tr>
                            <td className="px-4 py-2 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>{ps.classif}</td>
                            <td className="px-4 py-2 text-[var(--scolio-text-primary)] font-medium" style={{ fontSize: 'var(--text-caption)' }}>{resultado.grauCurvatura}</td>
                          </tr>
                        </tbody>
                      </table>
                    </section>
                  )}

                  {/* Observações do médico */}
                  {includedSections.observacoesMedico && observacoesMedico && (
                    <section>
                      <h3 className="text-[var(--scolio-text-primary)] mb-3">{ps.notes}</h3>
                      <div className="bg-[var(--scolio-page-surface)] rounded-[var(--radius-component)] p-4">
                        <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                          {observacoesMedico}
                        </p>
                      </div>
                    </section>
                  )}

                  {/* Assinatura digital */}
                  {includedSections.assinaturaDigital && medico && (
                    <section className="mt-8 pt-6 border-t-2 border-[var(--scolio-border-light)]">
                      <h3 className="text-[var(--scolio-text-primary)] mb-3">{ps.sig}</h3>
                      {(hashDocumento || captureMode) ? (
                        <div className="bg-[#f0faf5] border border-[var(--scolio-success-green)] rounded-[var(--radius-component)] p-4 space-y-2">
                          <div className="flex items-center gap-2">
                            <Check className="w-5 h-5 text-[var(--scolio-success-green)]" />
                            <span className="text-[var(--scolio-success-green)] font-semibold" style={{ fontSize: 'var(--text-body)' }}>{t('report.signedDigitally')}</span>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>
                              <strong>{ps.sigBy}:</strong> {nomeMedico}
                            </p>
                            {medico.cedulaProfissional && (
                              <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>
                                <strong>Cédula:</strong> {medico.cedulaProfissional}
                              </p>
                            )}
                            {medico.especialidade && (
                              <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>
                                <strong>{ps.specialty}:</strong> {medico.especialidade}
                              </p>
                            )}
                            <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>
                              <strong>Data:</strong> {new Date(dataAssinatura ?? new Date().toISOString()).toLocaleString(dateLocale)}
                            </p>
                            {!captureMode && hashDocumento && (
                              <p className="text-[var(--scolio-text-secondary)] break-all font-mono" style={{ fontSize: '10px', marginTop: '6px' }}>
                                SHA-256: {hashDocumento}
                              </p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="bg-[var(--scolio-light-blue-surface)] border border-[var(--scolio-primary-blue)] rounded-[var(--radius-component)] p-4 space-y-2">
                          <div className="flex items-center gap-2">
                            <Shield className="w-5 h-5 text-[var(--scolio-primary-blue)]" />
                            <span className="text-[var(--scolio-primary-blue)] font-semibold" style={{ fontSize: 'var(--text-body)' }}>Documento por assinar</span>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>
                              <strong>Médico:</strong> {nomeMedico}
                            </p>
                            {medico.cedulaProfissional && (
                              <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>
                                <strong>Cédula:</strong> {medico.cedulaProfissional}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </section>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de assinatura */}
      <Modal
        isOpen={showSignatureModal}
        onClose={() => setShowSignatureModal(false)}
        title={t('report.signConfirmTitle')}
        confirmLabel={t('report.signConfirmButton')}
        cancelLabel={t('common.cancel')}
        onConfirm={() => {
          setShowSignatureModal(false);
          assinar();
        }}
      >
        <div className="space-y-4">
          {hashDocumento ? (
            <div className="bg-[#f0faf5] rounded-[var(--radius-component)] p-4 flex items-start gap-3">
              <Check className="w-6 h-6 text-[var(--scolio-success-green)] flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-[var(--scolio-success-green)] font-medium mb-1" style={{ fontSize: 'var(--text-body)' }}>{t('report.signedDigitally')}</p>
                {dataAssinatura && (
                  <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>
                    {t('report.signedAt')} {new Date(dataAssinatura).toLocaleString(dateLocale)}
                  </p>
                )}
                <p className="text-[var(--scolio-text-secondary)] break-all font-mono mt-2" style={{ fontSize: '10px' }}>
                  SHA-256: {hashDocumento}
                </p>
                <p className="text-[var(--scolio-text-secondary)] mt-2" style={{ fontSize: 'var(--text-caption)' }}>
                  {t('report.signReplace')}
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-[var(--scolio-light-blue-surface)] rounded-[var(--radius-component)] p-4 flex items-start gap-3">
              <Shield className="w-6 h-6 text-[var(--scolio-primary-blue)] flex-shrink-0" />
              <div>
                <p className="text-[var(--scolio-text-primary)] font-medium mb-2" style={{ fontSize: 'var(--text-body)' }}>Assinatura com hash de integridade</p>
                <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>
                  O PDF será gerado, e um hash SHA-256 do seu conteúdo será calculado e guardado na base de dados, vinculando o documento ao médico signatário.
                </p>
              </div>
            </div>
          )}
          {medico && (
            <div className="space-y-2">
              <DataLine label={t('report.signatory')} value={nomeMedico} />
              {medico.cedulaProfissional && <DataLine label={ps.license} value={medico.cedulaProfissional} />}
              {medico.especialidade && <DataLine label={ps.specialty} value={medico.especialidade} />}
            </div>
          )}
          <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>
            {t('report.signCertify')}
          </p>
        </div>
      </Modal>

      {toast && (
        <div className="fixed top-8 right-8 z-50">
          <Toast title={toast.msg} type={toast.type} onClose={() => setToast(null)} />
        </div>
      )}
    </div>
  );
}

function CheckboxItem({ label, checked, onChange, disabled }: { label: string; checked: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <label className={`flex items-center gap-3 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
      <input type="checkbox" checked={checked} onChange={onChange} disabled={disabled} className="w-4 h-4 rounded border-[var(--scolio-border-light)] text-[var(--scolio-primary-blue)] focus:ring-[var(--scolio-primary-blue)] disabled:cursor-not-allowed" />
      <span className="text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-body)' }}>{label}</span>
    </label>
  );
}

function DataLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>{label}</span>
      <span className="text-[var(--scolio-text-primary)] font-medium" style={{ fontSize: 'var(--text-caption)' }}>{value}</span>
    </div>
  );
}

// Confirmar ícone de check na prévia de avaliação (reutilizado no UI interno)
export { Check };
