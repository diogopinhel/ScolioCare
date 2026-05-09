import React from 'react';
import { ArrowLeft, FileText, Shield, Check, Loader2, AlertCircle } from 'lucide-react';
import { Button, Modal, Toast } from '../../components/scolio';
import { useNavigate, useParams } from 'react-router';
import { useAuth } from '../../auth/AuthContext';
import { getEstudoCompleto, getUrlImagemEstudo } from '../../../data/repository/estudos';
import { getPaciente } from '../../../data/repository/pacientes';
import type { EstudoCompleto, PacienteDetalhe, MedicoEspecialista } from '../../../data/types';

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

  const [includedSections, setIncludedSections] = React.useState({
    dadosPaciente: true,
    imagemExame: true,
    overlayIA: true,
    metricasValidadas: true,
    notasClinicas: true,
    assinaturaDigital: true,
  });
  const [idioma, setIdioma] = React.useState('pt');
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

  const handleGenerate = () =>
    mostrarToast('Geração de PDF em desenvolvimento. Por enquanto use Ctrl+P para imprimir esta prévia.', 'error');

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
              <CheckboxItem label="Notas clínicas" checked={includedSections.notasClinicas} onChange={() => toggleSection('notasClinicas')} />
              <CheckboxItem label="Assinatura digital" checked={includedSections.assinaturaDigital} onChange={() => toggleSection('assinaturaDigital')} />
            </div>
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
            <Button variant="secondary" className="w-full" onClick={() => setShowSignatureModal(true)} disabled={!includedSections.assinaturaDigital}>
              <Shield className="w-4 h-4 mr-2" />Assinar digitalmente
            </Button>
          </div>

          <div className="bg-[var(--scolio-light-blue-surface)] rounded-[var(--radius-card)] border border-[var(--scolio-primary-blue)] p-4">
            <p className="text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-caption)' }}>
              A geração de PDF estará disponível numa próxima versão. Use Ctrl+P para imprimir a prévia.
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
              <div className="w-[595px] bg-white shadow-lg" style={{ minHeight: '842px' }}>
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

                  {/* Notas clínicas */}
                  {includedSections.notasClinicas && estudo.notasClinicas && (
                    <section>
                      <h3 className="text-[var(--scolio-text-primary)] mb-3">Observações do médico</h3>
                      <div className="bg-[var(--scolio-page-surface)] rounded-[var(--radius-component)] p-4">
                        <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)', lineHeight: '1.6' }}>
                          {estudo.notasClinicas}
                        </p>
                      </div>
                    </section>
                  )}

                  {/* Assinatura digital */}
                  {includedSections.assinaturaDigital && medico && (
                    <section className="mt-8 pt-6 border-t-2 border-[var(--scolio-border-light)]">
                      <h3 className="text-[var(--scolio-text-primary)] mb-3">Assinatura digital</h3>
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
          mostrarToast('Assinatura digital em desenvolvimento.', 'error');
        }}
      >
        <div className="space-y-4">
          <div className="bg-[var(--scolio-light-blue-surface)] rounded-[var(--radius-component)] p-4 flex items-start gap-3">
            <Shield className="w-6 h-6 text-[var(--scolio-primary-blue)] flex-shrink-0" />
            <div>
              <p className="text-[var(--scolio-text-primary)] font-medium mb-2" style={{ fontSize: 'var(--text-body)' }}>Assinatura digital qualificada</p>
              <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>
                O documento será assinado com o seu certificado digital qualificado, garantindo validade legal e autenticidade.
              </p>
            </div>
          </div>
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
