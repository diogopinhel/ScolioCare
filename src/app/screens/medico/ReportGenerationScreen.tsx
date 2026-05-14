import React from 'react';
import { ArrowLeft, FileText, Shield, Check, Loader2, AlertCircle, Send } from 'lucide-react';
import { Button, Modal, Toast, Textarea } from '../../components/scolio';
import { useNavigate, useParams } from 'react-router';
import { useAuth } from '../../auth/AuthContext';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { getEstudoCompleto, getUrlImagemEstudo, guardarObservacoesMedico, guardarAssinaturaDocumento, enviarEstudoAoPaciente } from '../../../data/repository/estudos';
import { supabase } from '../../../lib/supabase';
import { getPaciente } from '../../../data/repository/pacientes';
import type { EstudoCompleto, PacienteDetalhe, MedicoEspecialista } from '../../../data/types';

const BUCKET_RELATORIOS = 'relatorios';
const MAX_PDF_SIZE = 10 * 1024 * 1024; // 10 MB

async function calcularHashSHA256(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function formatarDataPT(isoDate: string | null): string {
  if (!isoDate) return '—';
  return new Date(isoDate).toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' });
}

function calcularIdade(dataNascimento: string | null): string {
  if (!dataNascimento) return '';
  const nasc = new Date(dataNascimento);
  const hoje = new Date();
  let idade = hoje.getFullYear() - nasc.getFullYear();
  const m = hoje.getMonth() - nasc.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
  return ` (${idade} anos)`;
}

export default function ReportGenerationScreen() {
  const navigate = useNavigate();
  const { estudoId } = useParams<{ estudoId: string }>();
  const { utilizador } = useAuth();

  const [estudo, setEstudo] = React.useState<EstudoCompleto | null>(null);
  const [paciente, setPaciente] = React.useState<PacienteDetalhe | null>(null);
  const [urlImagem, setUrlImagem] = React.useState<string | null>(null);
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
  const [idioma, setIdioma] = React.useState('pt');
  const [observacoesMedico, setObservacoesMedico] = React.useState('');
  const [hashDocumento, setHashDocumento] = React.useState<string | null>(null);
  const [dataAssinatura, setDataAssinatura] = React.useState<string | null>(null);
  const [aAssinar, setAAssinar] = React.useState(false);
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

  const handleGenerate = () => {
    if (!estudo) return;

    // ── Traduções PT / EN ──────────────────────────────────────────────────
    const tr = {
      pt: {
        title: 'Relatório Clínico de Escoliose', subtitle: 'Análise Clínica da Coluna Vertebral',
        patient: 'Informação do paciente', fullName: 'Nome completo', utente: 'Nº utente',
        dob: 'Data de nascimento', gender: 'Género',
        examDate: 'Data do exame', reportDate: 'Data do relatório',
        examImage: 'Imagem do exame', metrics: 'Métricas validadas',
        cobbAI: 'Ângulo de Cobb (IA)', cobbCorr: 'Ângulo de Cobb (corrigido)',
        vertebra: 'Vértebra apical', classif: 'Classificação',
        notes: 'Observações do médico', sig: 'Assinatura digital',
        sigBy: 'Médico', license: 'Cédula', specialty: 'Especialidade',
        pending: 'Documento por assinar',
        footer: 'Documento gerado automaticamente pelo ScolioScan — não substitui relatório clínico assinado.',
        metric: 'Métrica', value: 'Valor',
      },
      en: {
        title: 'Clinical Scoliosis Report', subtitle: 'Clinical Spine Analysis',
        patient: 'Patient information', fullName: 'Full name', utente: 'Patient ID',
        dob: 'Date of birth', gender: 'Gender',
        examDate: 'Exam date', reportDate: 'Report date',
        examImage: 'Exam image', metrics: 'Validated metrics',
        cobbAI: 'Cobb angle (AI)', cobbCorr: 'Cobb angle (corrected)',
        vertebra: 'Apical vertebra', classif: 'Classification',
        notes: "Doctor's observations", sig: 'Digital signature',
        sigBy: 'Physician', license: 'Medical license', specialty: 'Specialty',
        pending: 'Document pending signature',
        footer: 'Automatically generated document — does not replace a signed clinical report.',
        metric: 'Metric', value: 'Value',
      },
    } as const;

    const s = tr[idioma as 'pt' | 'en'] ?? tr.pt;
    const agora = new Date().toLocaleString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const dataExameStr = formatarDataPT(estudo.dataEstudo);
    const r = estudo.resultado;

    const secaoPaciente = includedSections.dadosPaciente ? `
      <h2>${s.patient}</h2>
      <div class="grid">
        <div class="field"><label>${s.fullName}</label><span>${estudo.pacienteNome}</span></div>
        ${paciente?.numeroUtente ? `<div class="field"><label>${s.utente}</label><span>${paciente.numeroUtente}</span></div>` : ''}
        ${paciente?.dataNascimento ? `<div class="field"><label>${s.dob}</label><span>${formatarDataPT(paciente.dataNascimento)}${calcularIdade(paciente.dataNascimento)}</span></div>` : ''}
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
          ${includedSections.overlayIA && r ? `
          <svg style="position:absolute;inset:0;width:100%;height:100%;mix-blend-mode:screen;" xmlns="http://www.w3.org/2000/svg">
            <line x1="30%" y1="30%" x2="70%" y2="30%" stroke="#1A6FAF" stroke-width="2" stroke-dasharray="3,3"/>
            <line x1="25%" y1="60%" x2="75%" y2="60%" stroke="#1A6FAF" stroke-width="2" stroke-dasharray="3,3"/>
            <text x="55%" y="45%" fill="#1A6FAF" font-size="12" font-weight="600">${r.anguloCobb.toFixed(1)}°</text>
          </svg>` : ''}
        </div>
      </div>` : '';

    const secaoMetricas = includedSections.metricasValidadas && r ? `
      <h2>${s.metrics}</h2>
      <table>
        <thead><tr><th>${s.metric}</th><th>${s.value}</th></tr></thead>
        <tbody>
          <tr><td>${s.cobbAI}</td><td><strong>${r.anguloCobb.toFixed(1)}°</strong></td></tr>
          ${r.anguloCobbCorrigido !== null ? `<tr><td>${s.cobbCorr}</td><td><strong>${r.anguloCobbCorrigido.toFixed(1)}°</strong></td></tr>` : ''}
          ${r.nivelVertebras ? `<tr><td>${s.vertebra}</td><td>${r.nivelVertebras}</td></tr>` : ''}
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
          ? `<div class="field" style="margin-top:8px"><label>Data</label><span>${new Date(dataAssinatura).toLocaleString('pt-PT')}</span></div>
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
      <div class="logo-box">S</div>
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

      // Capturar prévia e gerar PDF Blob
      const canvas = await html2canvas(previewRef.current, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = (canvas.height * pageWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, pageHeight);
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
      mostrarToast('Erro ao assinar o documento. Tenta novamente.', 'error');
    } finally {
      setAAssinar(false);
    }
  };

  const enviarAoPaciente = async () => {
    if (!estudo) return;
    setAEnviar(true);
    try {
      await enviarEstudoAoPaciente(estudo.id);
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
          <h1 className="text-[var(--scolio-text-primary)]">Geração de relatório</h1>
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
  const dataRelatorio = formatarDataPT(new Date().toISOString());
  const dataExame = formatarDataPT(estudo.dataEstudo);
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
            <h1 className="text-[var(--scolio-text-primary)]">Geração de relatório</h1>
            <p className="text-[var(--scolio-text-secondary)] mt-1" style={{ fontSize: 'var(--text-body)' }}>
              {estudo.pacienteNome} — Exame de {dataExame}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-10 gap-6">
        {/* Configuração (30%) */}
        <div className="col-span-3 space-y-6">
          <div className="bg-white rounded-[var(--radius-card)] shadow-sm border border-[var(--scolio-border-light)] p-6">
            <h3 className="text-[var(--scolio-text-primary)] mb-4">Secções incluídas</h3>
            <div className="space-y-3">
              <CheckboxItem label="Dados do paciente" checked={includedSections.dadosPaciente} onChange={() => toggleSection('dadosPaciente')} />
              <CheckboxItem label="Imagem do exame" checked={includedSections.imagemExame} onChange={() => toggleSection('imagemExame')} />
              <CheckboxItem label="Overlay IA" checked={includedSections.overlayIA} onChange={() => toggleSection('overlayIA')} disabled={!includedSections.imagemExame} />
              <CheckboxItem label="Métricas validadas" checked={includedSections.metricasValidadas} onChange={() => toggleSection('metricasValidadas')} />
              <CheckboxItem label="Observações do médico" checked={includedSections.observacoesMedico} onChange={() => toggleSection('observacoesMedico')} />
              <CheckboxItem label="Assinatura digital" checked={includedSections.assinaturaDigital} onChange={() => toggleSection('assinaturaDigital')} />
            </div>
          </div>

          {/* Observações do médico */}
          <div className="bg-white rounded-[var(--radius-card)] shadow-sm border border-[var(--scolio-border-light)] p-6">
            <h3 className="text-[var(--scolio-text-primary)] mb-1">Observações do médico</h3>
            <p className="text-[var(--scolio-text-secondary)] mb-3" style={{ fontSize: 'var(--text-caption)' }}>
              Texto visível ao paciente na app móvel e incluído no PDF.
            </p>
            <Textarea
              value={observacoesMedico}
              onChange={(e) => setObservacoesMedico(e.target.value)}
              rows={5}
              placeholder="Escreva aqui as observações a partilhar com o paciente…"
            />
          </div>

          <div className="bg-white rounded-[var(--radius-card)] shadow-sm border border-[var(--scolio-border-light)] p-6">
            <h3 className="text-[var(--scolio-text-primary)] mb-4">Idioma do relatório</h3>
            <div className="space-y-2">
              {[{ val: 'pt', label: 'Português (PT)' }, { val: 'en', label: 'English' }].map(({ val, label }) => (
                <label key={val} className="flex items-center gap-3 cursor-pointer">
                  <input type="radio" name="language" value={val} checked={idioma === val} onChange={() => setIdioma(val)} className="w-4 h-4 text-[var(--scolio-primary-blue)] focus:ring-[var(--scolio-primary-blue)]" />
                  <span className="text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-body)' }}>{label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Button variant="primary" className="w-full" onClick={handleGenerate}>
              <FileText className="w-4 h-4 mr-2" />Gerar PDF
            </Button>
            <Button
              variant="primary"
              className="w-full bg-[var(--scolio-success-green)] hover:bg-[#188D68]"
              onClick={enviarAoPaciente}
              disabled={aEnviar || !hashDocumento || foiEnviado}
            >
              <Send className="w-4 h-4 mr-2" />
              {foiEnviado ? '✓ Enviado ao paciente' : aEnviar ? 'A enviar…' : 'Enviar ao paciente'}
            </Button>
            <Button variant="secondary" className="w-full" onClick={() => setShowSignatureModal(true)} disabled={!includedSections.assinaturaDigital || aAssinar}>
              <Shield className="w-4 h-4 mr-2" />{aAssinar ? 'A assinar…' : 'Assinar digitalmente'}
            </Button>
          </div>

          <div className="bg-[var(--scolio-light-blue-surface)] rounded-[var(--radius-card)] border border-[var(--scolio-primary-blue)] p-4">
            <p className="text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-caption)' }}>
              O PDF abre numa nova janela de impressão. Selecciona <strong>"Guardar como PDF"</strong> no diálogo do browser.
            </p>
          </div>
        </div>

        {/* Prévia do documento (70%) */}
        <div className="col-span-7">
          <div className="bg-white rounded-[var(--radius-card)] shadow-sm border border-[var(--scolio-border-light)] overflow-hidden">
            <div className="px-6 py-4 bg-[var(--scolio-page-surface)] border-b border-[var(--scolio-border-light)] flex items-center justify-between">
              <h3 className="text-[var(--scolio-text-primary)]">Prévia do documento</h3>
              <span className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>Formato A4</span>
            </div>

            <div className="p-8 bg-[var(--scolio-page-surface)] flex justify-center">
              <div ref={previewRef} className="w-[595px] bg-white shadow-lg" style={{ minHeight: '842px' }}>
                <div className="p-12 space-y-6">
                  {/* Cabeçalho do documento */}
                  <div className="border-b border-[var(--scolio-border-light)] pb-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-[var(--scolio-primary-blue)] rounded-lg flex items-center justify-center">
                          <span className="text-white text-2xl font-semibold">S</span>
                        </div>
                        <div>
                          <h3 className="text-[var(--scolio-text-primary)] font-semibold" style={{ fontSize: 'var(--text-h3)' }}>ScolioScan</h3>
                          <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>Análise Clínica da Coluna Vertebral</p>
                        </div>
                      </div>
                    </div>
                    <h2 className="text-[var(--scolio-primary-blue)]">Relatório Clínico de Escoliose</h2>
                  </div>

                  {/* Dados do paciente */}
                  {includedSections.dadosPaciente && (
                    <section>
                      <h3 className="text-[var(--scolio-text-primary)] mb-3">Informação do paciente</h3>
                      <div className="bg-[var(--scolio-page-surface)] rounded-[var(--radius-component)] p-4 space-y-2">
                        <DataLine label="Nome completo" value={estudo.pacienteNome} />
                        {paciente?.numeroUtente && <DataLine label="Nº utente" value={paciente.numeroUtente} />}
                        {paciente?.dataNascimento && (
                          <DataLine label="Data de nascimento" value={`${formatarDataPT(paciente.dataNascimento)}${calcularIdade(paciente.dataNascimento)}`} />
                        )}
                        {paciente?.genero && <DataLine label="Género" value={paciente.genero} />}
                      </div>
                    </section>
                  )}

                  {/* Datas */}
                  <section className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-[var(--scolio-text-primary)] mb-2" style={{ fontSize: 'var(--text-body)' }}>Data do exame</h3>
                      <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>{dataExame}</p>
                    </div>
                    <div>
                      <h3 className="text-[var(--scolio-text-primary)] mb-2" style={{ fontSize: 'var(--text-body)' }}>Data do relatório</h3>
                      <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>{dataRelatorio}</p>
                    </div>
                  </section>

                  {/* Imagem */}
                  {includedSections.imagemExame && (
                    <section>
                      <h3 className="text-[var(--scolio-text-primary)] mb-3">Imagem do exame</h3>
                      <div className="bg-black rounded-[var(--radius-component)] p-4 flex justify-center">
                        <div className="relative w-48 h-64">
                          {urlImagem ? (
                            <>
                              <img src={urlImagem} alt="Exame" className="w-full h-full object-contain" />
                              {includedSections.overlayIA && resultado && (
                                <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ mixBlendMode: 'screen' }}>
                                  <line x1="30%" y1="30%" x2="70%" y2="30%" stroke="#1A6FAF" strokeWidth="2" strokeDasharray="3,3" />
                                  <line x1="25%" y1="60%" x2="75%" y2="60%" stroke="#1A6FAF" strokeWidth="2" strokeDasharray="3,3" />
                                  <text x="55%" y="45%" fill="#1A6FAF" fontSize="12" fontWeight="600">{resultado.anguloCobb.toFixed(1)}°</text>
                                </svg>
                              )}
                            </>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[var(--scolio-neutral-gray)]">
                              Sem imagem
                            </div>
                          )}
                        </div>
                      </div>
                    </section>
                  )}

                  {/* Métricas validadas */}
                  {includedSections.metricasValidadas && resultado && (
                    <section>
                      <h3 className="text-[var(--scolio-text-primary)] mb-3">Métricas validadas</h3>
                      <table className="w-full border border-[var(--scolio-border-light)] rounded-[var(--radius-component)] overflow-hidden">
                        <thead>
                          <tr className="bg-[var(--scolio-page-surface)]">
                            <th className="text-left px-4 py-2 border-b border-[var(--scolio-border-light)] text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-semibold)' }}>Métrica</th>
                            <th className="text-left px-4 py-2 border-b border-[var(--scolio-border-light)] text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-semibold)' }}>Valor</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="px-4 py-2 border-b border-[var(--scolio-border-light)] text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>Ângulo de Cobb (IA)</td>
                            <td className="px-4 py-2 border-b border-[var(--scolio-border-light)] text-[var(--scolio-text-primary)] font-semibold" style={{ fontSize: 'var(--text-caption)' }}>{resultado.anguloCobb.toFixed(1)}°</td>
                          </tr>
                          {resultado.anguloCobbCorrigido !== null && (
                            <tr>
                              <td className="px-4 py-2 border-b border-[var(--scolio-border-light)] text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>Ângulo de Cobb (corrigido)</td>
                              <td className="px-4 py-2 border-b border-[var(--scolio-border-light)] text-[var(--scolio-text-primary)] font-semibold" style={{ fontSize: 'var(--text-caption)' }}>{resultado.anguloCobbCorrigido.toFixed(1)}°</td>
                            </tr>
                          )}
                          {resultado.nivelVertebras && (
                            <tr>
                              <td className="px-4 py-2 border-b border-[var(--scolio-border-light)] text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>Vértebra apical</td>
                              <td className="px-4 py-2 border-b border-[var(--scolio-border-light)] text-[var(--scolio-text-primary)] font-medium" style={{ fontSize: 'var(--text-caption)' }}>{resultado.nivelVertebras}</td>
                            </tr>
                          )}
                          <tr>
                            <td className="px-4 py-2 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>Classificação</td>
                            <td className="px-4 py-2 text-[var(--scolio-text-primary)] font-medium" style={{ fontSize: 'var(--text-caption)' }}>{resultado.grauCurvatura}</td>
                          </tr>
                        </tbody>
                      </table>
                    </section>
                  )}

                  {/* Observações do médico */}
                  {includedSections.observacoesMedico && observacoesMedico && (
                    <section>
                      <h3 className="text-[var(--scolio-text-primary)] mb-3">Observações do médico</h3>
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
                      <h3 className="text-[var(--scolio-text-primary)] mb-3">Assinatura digital</h3>
                      {hashDocumento ? (
                        <div className="bg-[#f0faf5] border border-[var(--scolio-success-green)] rounded-[var(--radius-component)] p-4 space-y-2">
                          <div className="flex items-center gap-2">
                            <Check className="w-5 h-5 text-[var(--scolio-success-green)]" />
                            <span className="text-[var(--scolio-success-green)] font-semibold" style={{ fontSize: 'var(--text-body)' }}>Documento assinado digitalmente</span>
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
                            {dataAssinatura && (
                              <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>
                                <strong>Data:</strong> {new Date(dataAssinatura).toLocaleString('pt-PT')}
                              </p>
                            )}
                            <p className="text-[var(--scolio-text-secondary)] break-all font-mono" style={{ fontSize: '10px', marginTop: '6px' }}>
                              SHA-256: {hashDocumento}
                            </p>
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
        title="Confirmação de assinatura digital"
        confirmLabel="Assinar documento"
        cancelLabel="Cancelar"
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
                <p className="text-[var(--scolio-success-green)] font-medium mb-1" style={{ fontSize: 'var(--text-body)' }}>Documento já assinado</p>
                {dataAssinatura && (
                  <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>
                    Assinado em {new Date(dataAssinatura).toLocaleString('pt-PT')}
                  </p>
                )}
                <p className="text-[var(--scolio-text-secondary)] break-all font-mono mt-2" style={{ fontSize: '10px' }}>
                  SHA-256: {hashDocumento}
                </p>
                <p className="text-[var(--scolio-text-secondary)] mt-2" style={{ fontSize: 'var(--text-caption)' }}>
                  Confirmar irá gerar um novo PDF e substituir a assinatura existente.
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
              <DataLine label="Signatário" value={nomeMedico} />
              {medico.cedulaProfissional && <DataLine label="Cédula profissional" value={medico.cedulaProfissional} />}
              {medico.especialidade && <DataLine label="Especialidade" value={medico.especialidade} />}
            </div>
          )}
          <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>
            Ao confirmar, certifica que as informações neste relatório são precisas e completas.
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
