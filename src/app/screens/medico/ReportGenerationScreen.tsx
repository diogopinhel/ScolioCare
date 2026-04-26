import React from 'react';
import { FileText, Download, Shield, Check } from 'lucide-react';
import { Button, Modal } from '../../components/scolio';

export default function ReportGenerationScreen() {
  const [includedSections, setIncludedSections] = React.useState({
    patientData: true,
    examImage: true,
    aiOverlay: true,
    validatedMetrics: true,
    clinicalNotes: true,
    historicalComparison: true,
    digitalSignature: true,
  });
  const [language, setLanguage] = React.useState('en');
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [showSignatureModal, setShowSignatureModal] = React.useState(false);

  const handleGenerate = () => {
    setIsGenerating(true);
    // Simulate PDF generation
    setTimeout(() => {
      setIsGenerating(false);
    }, 2000);
  };

  const toggleSection = (section: keyof typeof includedSections) => {
    setIncludedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <div className="p-8 space-y-6 overflow-auto h-full">
      {/* Page Header */}
      <div>
        <h1 className="text-[var(--scolio-text-primary)]">Report generation & preview</h1>
        <p className="text-[var(--scolio-text-secondary)] mt-1" style={{ fontSize: 'var(--text-body)' }}>
          Maria Silva - Exam: April 8, 2026
        </p>
      </div>

      {/* Two-Column Layout */}
      <div className="grid grid-cols-10 gap-6">
        {/* Left Sidebar - Configuration (30%) */}
        <div className="col-span-3 space-y-6">
          {/* Included Sections */}
          <div className="bg-white rounded-[var(--radius-card)] shadow-sm border border-[var(--scolio-border-light)] p-6">
            <h3 className="text-[var(--scolio-text-primary)] mb-4">Included sections</h3>
            
            <div className="space-y-3">
              <CheckboxItem
                label="Patient data"
                checked={includedSections.patientData}
                onChange={() => toggleSection('patientData')}
              />
              <CheckboxItem
                label="Exam image"
                checked={includedSections.examImage}
                onChange={() => toggleSection('examImage')}
              />
              <CheckboxItem
                label="AI overlay"
                checked={includedSections.aiOverlay}
                onChange={() => toggleSection('aiOverlay')}
                disabled={!includedSections.examImage}
              />
              <CheckboxItem
                label="Validated metrics"
                checked={includedSections.validatedMetrics}
                onChange={() => toggleSection('validatedMetrics')}
              />
              <CheckboxItem
                label="Clinical notes"
                checked={includedSections.clinicalNotes}
                onChange={() => toggleSection('clinicalNotes')}
              />
              <CheckboxItem
                label="Historical comparison"
                checked={includedSections.historicalComparison}
                onChange={() => toggleSection('historicalComparison')}
              />
              <CheckboxItem
                label="Digital signature"
                checked={includedSections.digitalSignature}
                onChange={() => toggleSection('digitalSignature')}
              />
            </div>
          </div>

          {/* Language Selector */}
          <div className="bg-white rounded-[var(--radius-card)] shadow-sm border border-[var(--scolio-border-light)] p-6">
            <h3 className="text-[var(--scolio-text-primary)] mb-4">Report language</h3>
            
            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="language"
                  value="en"
                  checked={language === 'en'}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-4 h-4 text-[var(--scolio-primary-blue)] focus:ring-[var(--scolio-primary-blue)]"
                />
                <span className="text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-body)' }}>
                  English
                </span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="language"
                  value="pt"
                  checked={language === 'pt'}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-4 h-4 text-[var(--scolio-primary-blue)] focus:ring-[var(--scolio-primary-blue)]"
                />
                <span className="text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-body)' }}>
                  Portuguese (PT)
                </span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="language"
                  value="zh"
                  checked={language === 'zh'}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-4 h-4 text-[var(--scolio-primary-blue)] focus:ring-[var(--scolio-primary-blue)]"
                />
                <span className="text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-body)' }}>
                  Chinese (ZH)
                </span>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              variant="primary"
              className="w-full"
              onClick={handleGenerate}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Generate PDF
                </>
              )}
            </Button>
            
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => setShowSignatureModal(true)}
              disabled={!includedSections.digitalSignature}
            >
              <Shield className="w-4 h-4 mr-2" />
              Sign digitally
            </Button>
          </div>

          {/* Info Box */}
          <div className="bg-[var(--scolio-light-blue-surface)] rounded-[var(--radius-card)] border border-[var(--scolio-primary-blue)] p-4">
            <p className="text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-caption)' }}>
              <strong>Note:</strong> The digital signature will be applied automatically when generating the PDF if enabled.
            </p>
          </div>
        </div>

        {/* Right Area - PDF Preview (70%) */}
        <div className="col-span-7">
          <div className="bg-white rounded-[var(--radius-card)] shadow-sm border border-[var(--scolio-border-light)] overflow-hidden">
            {/* Preview Header */}
            <div className="px-6 py-4 bg-[var(--scolio-page-surface)] border-b border-[var(--scolio-border-light)] flex items-center justify-between">
              <h3 className="text-[var(--scolio-text-primary)]">PDF Preview</h3>
              <span className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>
                A4 Document Preview
              </span>
            </div>

            {/* A4 Document Preview */}
            <div className="p-8 bg-[var(--scolio-page-surface)] flex justify-center">
              <div className="w-[595px] bg-white shadow-lg" style={{ minHeight: '842px' }}>
                {/* Document Content */}
                <div className="p-12 space-y-6">
                  {/* Header with Logo & Title */}
                  <div className="border-b border-[var(--scolio-border-light)] pb-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-[var(--scolio-primary-blue)] rounded-lg flex items-center justify-center">
                          <span className="text-white text-2xl font-semibold">S</span>
                        </div>
                        <div>
                          <h3 className="text-[var(--scolio-text-primary)] font-semibold" style={{ fontSize: 'var(--text-h3)' }}>
                            ScolioScan
                          </h3>
                          <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>
                            Clinical Spine Analysis
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>
                          Hospital Central de Lisboa
                        </p>
                        <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>
                          Dept. of Orthopedics
                        </p>
                      </div>
                    </div>
                    <h2 className="text-[var(--scolio-primary-blue)]">Clinical Scoliosis Report</h2>
                  </div>

                  {/* Patient Data Section */}
                  {includedSections.patientData && (
                    <section>
                      <h3 className="text-[var(--scolio-text-primary)] mb-3">Patient information</h3>
                      <div className="bg-[var(--scolio-page-surface)] rounded-[var(--radius-component)] p-4 space-y-2">
                        <DataLine label="Full name" value="Maria Silva" />
                        <DataLine label="Patient ID" value="PT-2024-0847" />
                        <DataLine label="Date of birth" value="March 15, 1985 (41 years)" />
                        <DataLine label="Gender" value="Female" />
                      </div>
                    </section>
                  )}

                  {/* Exam Date and Report Date */}
                  <section className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-[var(--scolio-text-primary)] mb-2" style={{ fontSize: 'var(--text-body)' }}>
                        Exam date
                      </h3>
                      <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>
                        April 8, 2026
                      </p>
                    </div>
                    <div>
                      <h3 className="text-[var(--scolio-text-primary)] mb-2" style={{ fontSize: 'var(--text-body)' }}>
                        Report date
                      </h3>
                      <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>
                        April 8, 2026
                      </p>
                    </div>
                  </section>

                  {/* Exam Image */}
                  {includedSections.examImage && (
                    <section>
                      <h3 className="text-[var(--scolio-text-primary)] mb-3">Exam image</h3>
                      <div className="bg-black rounded-[var(--radius-component)] p-4 flex justify-center">
                        <div className="relative w-48 h-64">
                          <img
                            src="https://images.unsplash.com/photo-1728347053156-cf9066af4d9f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWRpY2FsJTIwc3BpbmUlMjB4cmF5fGVufDF8fHx8MTc3NTY2NTYzMHww&ixlib=rb-4.1.0&q=80&w=400"
                            alt="Exam"
                            className="w-full h-full object-contain"
                          />
                          {includedSections.aiOverlay && (
                            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ mixBlendMode: 'screen' }}>
                              <line x1="30%" y1="30%" x2="70%" y2="30%" stroke="#1A6FAF" strokeWidth="2" strokeDasharray="3,3" />
                              <line x1="25%" y1="60%" x2="75%" y2="60%" stroke="#1A6FAF" strokeWidth="2" strokeDasharray="3,3" />
                              <text x="55%" y="45%" fill="#1A6FAF" fontSize="12" fontWeight="600">15.7°</text>
                            </svg>
                          )}
                        </div>
                      </div>
                    </section>
                  )}

                  {/* Validated Metrics */}
                  {includedSections.validatedMetrics && (
                    <section>
                      <h3 className="text-[var(--scolio-text-primary)] mb-3">Validated metrics</h3>
                      <table className="w-full border border-[var(--scolio-border-light)] rounded-[var(--radius-component)] overflow-hidden">
                        <thead>
                          <tr className="bg-[var(--scolio-page-surface)]">
                            <th className="text-left px-4 py-2 border-b border-[var(--scolio-border-light)] text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-semibold)' }}>
                              Metric
                            </th>
                            <th className="text-left px-4 py-2 border-b border-[var(--scolio-border-light)] text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-semibold)' }}>
                              Value
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="px-4 py-2 border-b border-[var(--scolio-border-light)] text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>
                              Cobb angle
                            </td>
                            <td className="px-4 py-2 border-b border-[var(--scolio-border-light)] text-[var(--scolio-text-primary)] font-semibold" style={{ fontSize: 'var(--text-caption)' }}>
                              15.7°
                            </td>
                          </tr>
                          <tr>
                            <td className="px-4 py-2 border-b border-[var(--scolio-border-light)] text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>
                              Apical vertebra
                            </td>
                            <td className="px-4 py-2 border-b border-[var(--scolio-border-light)] text-[var(--scolio-text-primary)] font-medium" style={{ fontSize: 'var(--text-caption)' }}>
                              T8
                            </td>
                          </tr>
                          <tr>
                            <td className="px-4 py-2 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>
                              Classification
                            </td>
                            <td className="px-4 py-2 text-[var(--scolio-text-primary)] font-medium" style={{ fontSize: 'var(--text-caption)' }}>
                              Moderate scoliosis
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </section>
                  )}

                  {/* Clinical Notes */}
                  {includedSections.clinicalNotes && (
                    <section>
                      <h3 className="text-[var(--scolio-text-primary)] mb-3">Doctor's observations</h3>
                      <div className="bg-[var(--scolio-page-surface)] rounded-[var(--radius-component)] p-4">
                        <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)', lineHeight: '1.6' }}>
                          Patient shows improvement from previous exam. Cobb angle decreased by 0.4 degrees. 
                          Recommend continuing current treatment plan with physical therapy and monitoring 
                          progression every 3 months. Patient reports reduced pain levels and improved mobility.
                        </p>
                      </div>
                    </section>
                  )}

                  {/* Historical Comparison */}
                  {includedSections.historicalComparison && (
                    <section>
                      <h3 className="text-[var(--scolio-text-primary)] mb-3">Evolution comparison</h3>
                      <div className="bg-[var(--scolio-success-surface)] border border-[var(--scolio-success-green)] rounded-[var(--radius-component)] p-4 flex items-center gap-3">
                        <div className="w-10 h-10 bg-[var(--scolio-success-green)] rounded-full flex items-center justify-center flex-shrink-0">
                          <Check className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="text-[var(--scolio-success-green)] font-semibold" style={{ fontSize: 'var(--text-body)' }}>
                            Positive evolution
                          </p>
                          <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>
                            Cobb angle variation: −0.4° compared to previous exam (Jan 18, 2026)
                          </p>
                        </div>
                      </div>
                    </section>
                  )}

                  {/* Digital Signature Block */}
                  {includedSections.digitalSignature && (
                    <section className="mt-8 pt-6 border-t-2 border-[var(--scolio-border-light)]">
                      <h3 className="text-[var(--scolio-text-primary)] mb-3">Digital signature</h3>
                      <div className="bg-[var(--scolio-light-blue-surface)] border border-[var(--scolio-primary-blue)] rounded-[var(--radius-component)] p-4 space-y-2">
                        <div className="flex items-center gap-2">
                          <Shield className="w-5 h-5 text-[var(--scolio-primary-blue)]" />
                          <span className="text-[var(--scolio-primary-blue)] font-semibold" style={{ fontSize: 'var(--text-body)' }}>
                            Digitally signed document
                          </span>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>
                            <strong>Signed by:</strong> Dr. Ana Martins
                          </p>
                          <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>
                            <strong>License:</strong> OM 45678
                          </p>
                          <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>
                            <strong>Date:</strong> April 8, 2026, 16:42:15 UTC
                          </p>
                          <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>
                            <strong>Certificate expires:</strong> December 31, 2026
                          </p>
                          <p className="text-[var(--scolio-text-secondary)] font-mono break-all" style={{ fontSize: '10px' }}>
                            <strong>Verification hash:</strong> SHA-256: a3f5c9d2e8b1f4a6c7d9e2f8b3c5a1d4e7f9b2c8a5d1e6f3b9c4a7d2e8f1b5c3
                          </p>
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

      {/* Digital Signature Modal */}
      <Modal
        isOpen={showSignatureModal}
        onClose={() => setShowSignatureModal(false)}
        title="Digital signature confirmation"
        confirmLabel="Sign document"
        cancelLabel="Cancel"
        onConfirm={() => {
          setShowSignatureModal(false);
          handleGenerate();
        }}
      >
        <div className="space-y-4">
          <div className="bg-[var(--scolio-light-blue-surface)] rounded-[var(--radius-component)] p-4 flex items-start gap-3">
            <Shield className="w-6 h-6 text-[var(--scolio-primary-blue)] flex-shrink-0" />
            <div>
              <p className="text-[var(--scolio-text-primary)] font-medium mb-2" style={{ fontSize: 'var(--text-body)' }}>
                Qualified digital signature
              </p>
              <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>
                This document will be signed with your qualified digital certificate, 
                ensuring legal validity and authenticity.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <DataLine label="Signer" value="Dr. Ana Martins" />
            <DataLine label="Medical license" value="OM 45678" />
            <DataLine label="Certificate issuer" value="Portuguese Medical Association" />
            <DataLine label="Certificate valid until" value="December 31, 2026" />
          </div>

          <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>
            By confirming, you certify that the information in this report is accurate and complete 
            according to your professional assessment.
          </p>
        </div>
      </Modal>
    </div>
  );
}

// Checkbox Item Component
interface CheckboxItemProps {
  label: string;
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}

function CheckboxItem({ label, checked, onChange, disabled }: CheckboxItemProps) {
  return (
    <label className={`flex items-center gap-3 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="w-4 h-4 rounded border-[var(--scolio-border-light)] text-[var(--scolio-primary-blue)] focus:ring-[var(--scolio-primary-blue)] disabled:cursor-not-allowed"
      />
      <span className="text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-body)' }}>
        {label}
      </span>
    </label>
  );
}

// Data Line Component
interface DataLineProps {
  label: string;
  value: string;
}

function DataLine({ label, value }: DataLineProps) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>
        {label}
      </span>
      <span className="text-[var(--scolio-text-primary)] font-medium" style={{ fontSize: 'var(--text-caption)' }}>
        {value}
      </span>
    </div>
  );
}
