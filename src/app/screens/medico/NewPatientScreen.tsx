import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button, Input, Textarea } from '../../components/scolio';
import { useNavigate } from 'react-router';

export default function NewPatientScreen() {
  const navigate = useNavigate();
  const [formData, setFormData] = React.useState({
    fullName: '',
    birthDate: '',
    gender: '',
    clinicalId: '',
    responsibleDoctor: '',
    initialNotes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate patient creation
    navigate('/patients');
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="p-8 space-y-6 overflow-auto h-full">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/patients')}
          className="p-2 -ml-2 text-[var(--scolio-text-secondary)] hover:text-[var(--scolio-text-primary)] transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-[var(--scolio-text-primary)]">Novo paciente</h1>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-[var(--radius-card)] shadow-sm border border-[var(--scolio-border-light)] p-6">
          <div className="space-y-6">
            {/* Full Name */}
            <div>
              <label className="block text-[var(--scolio-text-primary)] mb-2" style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)' }}>
                Nome completo
              </label>
              <Input
                type="text"
                value={formData.fullName}
                onChange={(e) => handleChange('fullName', e.target.value)}
                placeholder="Ex: Maria Silva"
                required
              />
            </div>

            {/* Birth Date */}
            <div>
              <label className="block text-[var(--scolio-text-primary)] mb-2" style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)' }}>
                Data de nascimento
              </label>
              <Input
                type="date"
                value={formData.birthDate}
                onChange={(e) => handleChange('birthDate', e.target.value)}
                required
              />
            </div>

            {/* Gender */}
            <div>
              <label className="block text-[var(--scolio-text-primary)] mb-2" style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)' }}>
                Género
              </label>
              <select
                value={formData.gender}
                onChange={(e) => handleChange('gender', e.target.value)}
                className="w-full px-3 py-2 border border-[var(--scolio-border-light)] rounded-[var(--radius-component)] focus:outline-none focus:ring-2 focus:ring-[var(--scolio-primary-blue)]"
                required
              >
                <option value="">Selecionar género...</option>
                <option value="female">Feminino</option>
                <option value="male">Masculino</option>
                <option value="other">Outro</option>
              </select>
            </div>

            {/* Clinical ID */}
            <div>
              <label className="block text-[var(--scolio-text-primary)] mb-2" style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)' }}>
                Número de identificação clínica
              </label>
              <Input
                type="text"
                value={formData.clinicalId}
                onChange={(e) => handleChange('clinicalId', e.target.value)}
                placeholder="Ex: PT-2024-0848"
                required
              />
            </div>

            {/* Responsible Doctor */}
            <div>
              <label className="block text-[var(--scolio-text-primary)] mb-2" style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)' }}>
                Médico responsável
              </label>
              <select
                value={formData.responsibleDoctor}
                onChange={(e) => handleChange('responsibleDoctor', e.target.value)}
                className="w-full px-3 py-2 border border-[var(--scolio-border-light)] rounded-[var(--radius-component)] focus:outline-none focus:ring-2 focus:ring-[var(--scolio-primary-blue)]"
                required
              >
                <option value="">Selecionar médico...</option>
                <option value="dr-ana-martins">Dr. Ana Martins</option>
                <option value="dr-carlos-mendes">Dr. Carlos Mendes</option>
                <option value="dr-sofia-reis">Dr. Sofia Reis</option>
              </select>
            </div>

            {/* Initial Notes */}
            <div>
              <label className="block text-[var(--scolio-text-primary)] mb-2" style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)' }}>
                Notas iniciais
              </label>
              <Textarea
                value={formData.initialNotes}
                onChange={(e) => handleChange('initialNotes', e.target.value)}
                rows={4}
                placeholder="Observações iniciais sobre o paciente (opcional)"
              />
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-3 mt-6">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate('/patients')}
          >
            Cancelar
          </Button>
          <Button type="submit" variant="primary">
            Criar paciente
          </Button>
        </div>
      </form>
    </div>
  );
}
