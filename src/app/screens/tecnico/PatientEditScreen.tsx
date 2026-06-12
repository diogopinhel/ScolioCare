import React from 'react';
import { ArrowLeft, Loader2, User, Phone, MapPin, Calendar, CreditCard, UserCog } from 'lucide-react';
import { Button, Input, Select, Toast } from '../../components/scolio';
import { useNavigate, useParams } from 'react-router';
import { getPaciente, atualizarPaciente, getMedicos, alterarMedicoPaciente } from '../../../data/repository/pacientes';
import { getMedicoResponsavelDoPaciente } from '../../../data/repository/tecnico';
import type { PacienteDetalhe, MedicoResumo } from '../../../data/types';
import { useTranslation } from 'react-i18next';

export default function PatientEditScreen() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();

  const [aCarregar, setACarregar] = React.useState(true);
  const [aSubmeter, setASubmeter] = React.useState(false);
  const [pacienteOriginal, setPacienteOriginal] = React.useState<PacienteDetalhe | null>(null);
  const [toast, setToast] = React.useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const [formData, setFormData] = React.useState({
    nomeCompleto: '',
    dataNascimento: '',
    genero: '',
    numeroUtente: '',
    contacto: '',
    morada: '',
    cartaoCidadao: '',
  });

  // Estado do médico responsável
  const [medicos, setMedicos] = React.useState<MedicoResumo[]>([]);
  const [medicoAtualId, setMedicoAtualId] = React.useState<string | null>(null);
  const [medicoSelecionadoId, setMedicoSelecionadoId] = React.useState('');

  const mostrarToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 5000);
  };

  React.useEffect(() => {
    if (!id) { setACarregar(false); return; }

    Promise.all([
      getPaciente(id),
      getMedicoResponsavelDoPaciente(id),
      getMedicos(),
    ]).then(([paciente, medicoId, listaMedicos]) => {
      if (paciente) {
        setPacienteOriginal(paciente);
        setFormData({
          nomeCompleto: paciente.nomeCompleto ?? '',
          dataNascimento: paciente.dataNascimento ?? '',
          genero: paciente.genero ?? '',
          numeroUtente: paciente.numeroUtente ?? '',
          contacto: paciente.contacto ?? '',
          morada: paciente.morada ?? '',
          cartaoCidadao: paciente.cartaoCidadao ?? '',
        });
      }
      setMedicoAtualId(medicoId);
      setMedicoSelecionadoId(medicoId ?? '');
      setMedicos(listaMedicos);
    }).finally(() => setACarregar(false));
  }, [id]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || aSubmeter) return;
    setASubmeter(true);

    try {
      await atualizarPaciente({
        pacienteId: id,
        nomeCompleto: formData.nomeCompleto,
        dataNascimento: formData.dataNascimento,
        genero: formData.genero,
        numeroUtente: formData.numeroUtente,
        contacto: formData.contacto,
        morada: formData.morada,
        cartaoCidadao: formData.cartaoCidadao,
      });

      // Atribuir/alterar médico apenas se mudou
      if (medicoSelecionadoId && medicoSelecionadoId !== medicoAtualId) {
        await alterarMedicoPaciente(id, medicoSelecionadoId);
      }

      mostrarToast(t('patientEdit.successMessage'));
      setTimeout(() => navigate('/tecnico/patients'), 1500);
    } catch (err) {
      mostrarToast(
        err instanceof Error ? err.message : t('patientEdit.errorMessage'),
        'error',
      );
      setASubmeter(false);
    }
  };

  const opcoesSelect = [
    { value: '', label: t('patients.selectDoctorPlaceholder') },
    ...medicos.map((m) => ({
      value: m.id,
      label: m.especialidade ? `${m.nomeCompleto} — ${m.especialidade}` : m.nomeCompleto,
    })),
  ];

  const medicoAtualNome = medicos.find((m) => m.id === medicoAtualId)?.nomeCompleto ?? null;

  // ── Loading ──────────────────────────────────────────────────────────────
  if (aCarregar) {
    return (
      <div className="p-8 flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--scolio-primary-blue)]" />
      </div>
    );
  }

  if (!pacienteOriginal) {
    return (
      <div className="p-8 flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-[var(--scolio-text-primary)] mb-4" style={{ fontSize: 'var(--text-h3)', fontWeight: 'var(--weight-semibold)' }}>
            {t('patients.notFoundTitle')}
          </p>
          <Button variant="secondary" onClick={() => navigate(-1)}>{t('common.back')}</Button>
        </div>
      </div>
    );
  }

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
        <div>
          <h1 className="text-[var(--scolio-text-primary)]">{t('patientEdit.title')}</h1>
          <p className="text-[var(--scolio-text-secondary)] mt-1" style={{ fontSize: 'var(--text-body)' }}>
            {pacienteOriginal.nomeCompleto}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Secção: Dados pessoais */}
        <div className="bg-white rounded-[var(--radius-card)] shadow-sm border border-[var(--scolio-border-light)] p-6 space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-[var(--scolio-border-light)]">
            <div className="w-8 h-8 rounded-lg bg-[var(--scolio-light-blue-surface)] flex items-center justify-center">
              <User className="w-4 h-4 text-[var(--scolio-primary-blue)]" />
            </div>
            <h3 className="text-[var(--scolio-text-primary)]">{t('patientEdit.personalData')}</h3>
          </div>

          {/* Nome completo */}
          <div>
            <label className="block text-[var(--scolio-text-primary)] mb-2" style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)' }}>
              {t('patientEdit.fullName')}
            </label>
            <Input
              type="text"
              value={formData.nomeCompleto}
              onChange={(e) => handleChange('nomeCompleto', e.target.value)}
              placeholder={t('patientEdit.fullNamePlaceholder')}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-5">
            {/* Data de nascimento */}
            <div>
              <label className="block text-[var(--scolio-text-primary)] mb-2" style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)' }}>
                {t('patientEdit.dob')}
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--scolio-neutral-gray)] pointer-events-none" />
                <input
                  type="date"
                  value={formData.dataNascimento}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={(e) => handleChange('dataNascimento', e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-[var(--scolio-border-light)] rounded-[var(--radius-component)] focus:outline-none focus:ring-2 focus:ring-[var(--scolio-primary-blue)]"
                />
              </div>
            </div>

            {/* Género */}
            <div>
              <label className="block text-[var(--scolio-text-primary)] mb-2" style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)' }}>
                {t('patientEdit.gender')}
              </label>
              <select
                value={formData.genero}
                onChange={(e) => handleChange('genero', e.target.value)}
                className="w-full px-3 py-2 border border-[var(--scolio-border-light)] rounded-[var(--radius-component)] focus:outline-none focus:ring-2 focus:ring-[var(--scolio-primary-blue)]"
              >
                <option value="">{t('patientEdit.genderUnspecified')}</option>
                <option value="female">{t('patientEdit.genderFemale')}</option>
                <option value="male">{t('patientEdit.genderMale')}</option>
                <option value="other">{t('patientEdit.genderOther')}</option>
              </select>
            </div>
          </div>

          {/* Número de utente */}
          <div>
            <label className="block text-[var(--scolio-text-primary)] mb-2" style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)' }}>
              {t('patientEdit.clinicalId')}
            </label>
            <Input
              type="text"
              inputMode="numeric"
              maxLength={9}
              value={formData.numeroUtente}
              onChange={(e) => handleChange('numeroUtente', e.target.value.replace(/\D/g, '').slice(0, 9))}
              placeholder={t('patientEdit.clinicalIdPlaceholder')}
            />
          </div>
        </div>

        {/* Secção: Contacto */}
        <div className="bg-white rounded-[var(--radius-card)] shadow-sm border border-[var(--scolio-border-light)] p-6 space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-[var(--scolio-border-light)]">
            <div className="w-8 h-8 rounded-lg bg-[var(--scolio-light-blue-surface)] flex items-center justify-center">
              <Phone className="w-4 h-4 text-[var(--scolio-primary-blue)]" />
            </div>
            <h3 className="text-[var(--scolio-text-primary)]">{t('patientEdit.contactSection')}</h3>
          </div>

          <div className="grid grid-cols-2 gap-5">
            {/* Contacto */}
            <div>
              <label className="block text-[var(--scolio-text-primary)] mb-2" style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)' }}>
                {t('patientEdit.phone')}
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--scolio-neutral-gray)] pointer-events-none" />
                <input
                  type="tel"
                  maxLength={16}
                  value={formData.contacto}
                  onChange={(e) => handleChange('contacto', e.target.value.replace(/[^\d+ ]/g, '').slice(0, 16))}
                  placeholder={t('patientEdit.phonePlaceholder')}
                  className="w-full pl-10 pr-3 py-2 border border-[var(--scolio-border-light)] rounded-[var(--radius-component)] focus:outline-none focus:ring-2 focus:ring-[var(--scolio-primary-blue)]"
                />
              </div>
            </div>

            {/* Morada */}
            <div>
              <label className="block text-[var(--scolio-text-primary)] mb-2" style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)' }}>
                {t('patientEdit.address')}
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--scolio-neutral-gray)] pointer-events-none" />
                <input
                  type="text"
                  value={formData.morada}
                  onChange={(e) => handleChange('morada', e.target.value)}
                  placeholder={t('patientEdit.addressPlaceholder')}
                  className="w-full pl-10 pr-3 py-2 border border-[var(--scolio-border-light)] rounded-[var(--radius-component)] focus:outline-none focus:ring-2 focus:ring-[var(--scolio-primary-blue)]"
                />
              </div>
            </div>
          </div>

          {/* Cartão de cidadão */}
          <div>
            <label className="block text-[var(--scolio-text-primary)] mb-2" style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)' }}>
              {t('patientEdit.citizenCard')}
            </label>
            <div className="relative">
              <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--scolio-neutral-gray)] pointer-events-none" />
              <input
                type="text"
                maxLength={14}
                value={formData.cartaoCidadao}
                onChange={(e) => handleChange('cartaoCidadao', e.target.value.toUpperCase().replace(/[^0-9A-Z ]/g, '').slice(0, 14))}
                placeholder={t('patientEdit.citizenCardPlaceholder')}
                className="w-full pl-10 pr-3 py-2 border border-[var(--scolio-border-light)] rounded-[var(--radius-component)] focus:outline-none focus:ring-2 focus:ring-[var(--scolio-primary-blue)]"
              />
            </div>
          </div>
        </div>

        {/* Secção: Médico responsável */}
        <div className="bg-white rounded-[var(--radius-card)] shadow-sm border border-[var(--scolio-border-light)] p-6 space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-[var(--scolio-border-light)]">
            <div className="w-8 h-8 rounded-lg bg-[var(--scolio-light-blue-surface)] flex items-center justify-center">
              <UserCog className="w-4 h-4 text-[var(--scolio-primary-blue)]" />
            </div>
            <h3 className="text-[var(--scolio-text-primary)]">{t('patientEdit.responsibleDoctorSection')}</h3>
          </div>

          {/* Médico atual (só aparece se já houver um) */}
          {medicoAtualId && (
            <div>
              <p className="text-[var(--scolio-text-secondary)] mb-1" style={{ fontSize: 'var(--text-caption)' }}>
                {t('patientEdit.currentDoctorLabel')}
              </p>
              <p className="text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)' }}>
                {medicoAtualNome ?? '—'}
              </p>
            </div>
          )}

          <Select
            label={t('patientEdit.changeDoctorLabel')}
            value={medicoSelecionadoId}
            onChange={(e) => setMedicoSelecionadoId(e.target.value)}
            options={opcoesSelect}
            disabled={aSubmeter}
          />
        </div>

        {/* Nota sobre campos não editáveis */}
        <div className="flex items-start gap-3 p-4 bg-[var(--scolio-light-blue-surface)] border border-[var(--scolio-primary-blue)] rounded-[var(--radius-component)]">
          <div className="w-2 h-2 rounded-full bg-[var(--scolio-primary-blue)] flex-shrink-0 mt-2" />
          <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>
            {t('patientEdit.emailNote')}
          </p>
        </div>

        {/* Acções */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate('/tecnico/patients')}
            disabled={aSubmeter}
          >
            {t('common.cancel')}
          </Button>
          <Button type="submit" variant="primary" disabled={aSubmeter}>
            {aSubmeter ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                {t('patientEdit.saving')}
              </span>
            ) : (
              t('common.save')
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
