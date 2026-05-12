import React from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button, Input } from '../../components/scolio';
import { useNavigate } from 'react-router';
import { Toast } from '../../components/scolio';
import { getMedicos, criarPaciente } from '../../../data/repository/pacientes';
import type { MedicoResumo } from '../../../data/types';
import { useTranslation } from 'react-i18next';

export default function TecnicoNewPatientScreen() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [medicos, setMedicos] = React.useState<MedicoResumo[]>([]);
  const [aCarregarMedicos, setACarregarMedicos] = React.useState(true);

  const [formData, setFormData] = React.useState({
    nomeCompleto: '',
    email: '',
    dataNascimento: '',
    genero: '',
    numeroUtente: '',
    medicoId: '',
    contacto: '',
    morada: '',
    cartaoCidadao: '',
  });

  const [aSubmeter, setASubmeter] = React.useState(false);
  const [toast, setToast] = React.useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const mostrarToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 5000);
  };

  React.useEffect(() => {
    getMedicos()
      .then(setMedicos)
      .finally(() => setACarregarMedicos(false));
  }, []);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (aSubmeter) return;
    setASubmeter(true);

    try {
      await criarPaciente(formData);
      mostrarToast(t('newPatient.successToast'));
      setTimeout(() => navigate('/tecnico/patients'), 1500);
    } catch (err) {
      mostrarToast(
        err instanceof Error ? err.message : t('newPatient.errorToast'),
        'error',
      );
      setASubmeter(false);
    }
  };

  return (
    <div className="p-8 space-y-6 overflow-auto h-full">
      {/* Cabeçalho */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/tecnico/patients')}
          className="p-2 -ml-2 text-[var(--scolio-text-secondary)] hover:text-[var(--scolio-text-primary)] transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-[var(--scolio-text-primary)]">{t('newPatient.title')}</h1>
      </div>

      {/* Formulário */}
      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-[var(--radius-card)] shadow-sm border border-[var(--scolio-border-light)] p-6">
          <div className="space-y-6">
            {/* Nome completo */}
            <div>
              <label className="block text-[var(--scolio-text-primary)] mb-2" style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)' }}>
                {t('newPatient.fullName')}
              </label>
              <Input
                type="text"
                value={formData.nomeCompleto}
                onChange={(e) => handleChange('nomeCompleto', e.target.value)}
                placeholder={t('newPatient.fullNamePlaceholder')}
                required
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-[var(--scolio-text-primary)] mb-2" style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)' }}>
                {t('newPatient.email')}
              </label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder={t('newPatient.emailPlaceholder')}
                required
              />
              <p className="text-[var(--scolio-text-secondary)] mt-1" style={{ fontSize: 'var(--text-caption)' }}>
                {t('newPatient.emailNote')}
              </p>
            </div>

            {/* Data de nascimento */}
            <div>
              <label className="block text-[var(--scolio-text-primary)] mb-2" style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)' }}>
                {t('newPatient.dob')}
              </label>
              <Input
                type="date"
                value={formData.dataNascimento}
                onChange={(e) => handleChange('dataNascimento', e.target.value)}
                required
              />
            </div>

            {/* Género */}
            <div>
              <label className="block text-[var(--scolio-text-primary)] mb-2" style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)' }}>
                {t('newPatient.gender')}
              </label>
              <select
                value={formData.genero}
                onChange={(e) => handleChange('genero', e.target.value)}
                className="w-full px-3 py-2 border border-[var(--scolio-border-light)] rounded-[var(--radius-component)] focus:outline-none focus:ring-2 focus:ring-[var(--scolio-success-green)]"
                required
              >
                <option value="">{t('newPatient.genderSelect')}</option>
                <option value="female">{t('newPatient.genderFemale')}</option>
                <option value="male">{t('newPatient.genderMale')}</option>
                <option value="other">{t('newPatient.genderOther')}</option>
              </select>
            </div>

            {/* Número de utente */}
            <div>
              <label className="block text-[var(--scolio-text-primary)] mb-2" style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)' }}>
                {t('newPatient.clinicalId')}
              </label>
              <Input
                type="text"
                value={formData.numeroUtente}
                onChange={(e) => handleChange('numeroUtente', e.target.value)}
                placeholder={t('newPatient.clinicalIdPlaceholder')}
              />
            </div>

            {/* Cartão de cidadão */}
            <div>
              <label className="block text-[var(--scolio-text-primary)] mb-2" style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)' }}>
                {t('newPatient.citizenCard')}
              </label>
              <Input
                type="text"
                value={formData.cartaoCidadao}
                onChange={(e) => handleChange('cartaoCidadao', e.target.value)}
                placeholder={t('newPatient.citizenCardPlaceholder')}
              />
            </div>

            {/* Contacto */}
            <div>
              <label className="block text-[var(--scolio-text-primary)] mb-2" style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)' }}>
                {t('newPatient.phone')}
              </label>
              <Input
                type="tel"
                value={formData.contacto}
                onChange={(e) => handleChange('contacto', e.target.value)}
                placeholder={t('newPatient.phonePlaceholder')}
              />
            </div>

            {/* Morada */}
            <div>
              <label className="block text-[var(--scolio-text-primary)] mb-2" style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)' }}>
                {t('newPatient.address')}
              </label>
              <Input
                type="text"
                value={formData.morada}
                onChange={(e) => handleChange('morada', e.target.value)}
                placeholder={t('newPatient.addressPlaceholder')}
              />
            </div>

            {/* Médico responsável */}
            <div>
              <label className="block text-[var(--scolio-text-primary)] mb-2" style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)' }}>
                {t('newPatient.responsibleDoctor')}
              </label>
              {aCarregarMedicos ? (
                <div className="flex items-center gap-2 px-3 py-2 border border-[var(--scolio-border-light)] rounded-[var(--radius-component)] text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t('newPatient.loadingDoctors')}
                </div>
              ) : (
                <select
                  value={formData.medicoId}
                  onChange={(e) => handleChange('medicoId', e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--scolio-border-light)] rounded-[var(--radius-component)] focus:outline-none focus:ring-2 focus:ring-[var(--scolio-success-green)]"
                  required
                >
                  <option value="">{t('newPatient.selectDoctor')}</option>
                  {medicos.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nomeCompleto}{m.especialidade ? ` — ${m.especialidade}` : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>

        {/* Acções */}
        <div className="flex justify-end gap-3 mt-6">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate('/tecnico/patients')}
            disabled={aSubmeter}
          >
            {t('common.cancel')}
          </Button>
          <Button type="submit" variant="primary" disabled={aSubmeter || aCarregarMedicos}>
            {aSubmeter ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                {t('newPatient.creating')}
              </span>
            ) : (
              t('newPatient.create')
            )}
          </Button>
        </div>
      </form>

      {toast && (
        <div className="fixed top-8 right-8 z-50">
          <Toast title={toast.msg} type={toast.type} onClose={() => setToast(null)} />
        </div>
      )}
    </div>
  );
}
