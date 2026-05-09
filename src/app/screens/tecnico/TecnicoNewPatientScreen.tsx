import React from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button, Input } from '../../components/scolio';
import { useNavigate } from 'react-router';
import { Toast } from '../../components/scolio';
import { getMedicos, criarPaciente } from '../../../data/repository/pacientes';
import type { MedicoResumo } from '../../../data/types';

export default function TecnicoNewPatientScreen() {
  const navigate = useNavigate();

  const [medicos, setMedicos] = React.useState<MedicoResumo[]>([]);
  const [aCarregarMedicos, setACarregarMedicos] = React.useState(true);

  const [formData, setFormData] = React.useState({
    nomeCompleto: '',
    email: '',
    dataNascimento: '',
    genero: '',
    numeroUtente: '',
    medicoId: '',
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
      mostrarToast('Paciente criado com sucesso.');
      setTimeout(() => navigate('/tecnico/patients'), 1500);
    } catch (err) {
      mostrarToast(
        err instanceof Error ? err.message : 'Erro ao criar paciente. Tente novamente.',
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
        <h1 className="text-[var(--scolio-text-primary)]">Novo paciente</h1>
      </div>

      {/* Formulário */}
      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-[var(--radius-card)] shadow-sm border border-[var(--scolio-border-light)] p-6">
          <div className="space-y-6">
            {/* Nome completo */}
            <div>
              <label className="block text-[var(--scolio-text-primary)] mb-2" style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)' }}>
                Nome completo *
              </label>
              <Input
                type="text"
                value={formData.nomeCompleto}
                onChange={(e) => handleChange('nomeCompleto', e.target.value)}
                placeholder="Ex: Maria Silva"
                required
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-[var(--scolio-text-primary)] mb-2" style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)' }}>
                Email *
              </label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="Ex: maria.silva@email.com"
                required
              />
              <p className="text-[var(--scolio-text-secondary)] mt-1" style={{ fontSize: 'var(--text-caption)' }}>
                Usado pelo paciente para aceder à aplicação móvel.
              </p>
            </div>

            {/* Data de nascimento */}
            <div>
              <label className="block text-[var(--scolio-text-primary)] mb-2" style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)' }}>
                Data de nascimento *
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
                Género *
              </label>
              <select
                value={formData.genero}
                onChange={(e) => handleChange('genero', e.target.value)}
                className="w-full px-3 py-2 border border-[var(--scolio-border-light)] rounded-[var(--radius-component)] focus:outline-none focus:ring-2 focus:ring-[var(--scolio-success-green)]"
                required
              >
                <option value="">Selecionar género...</option>
                <option value="female">Feminino</option>
                <option value="male">Masculino</option>
                <option value="other">Outro</option>
              </select>
            </div>

            {/* Número de utente */}
            <div>
              <label className="block text-[var(--scolio-text-primary)] mb-2" style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)' }}>
                Número de identificação clínica
              </label>
              <Input
                type="text"
                value={formData.numeroUtente}
                onChange={(e) => handleChange('numeroUtente', e.target.value)}
                placeholder="Ex: PT-2024-0848"
              />
            </div>

            {/* Médico responsável */}
            <div>
              <label className="block text-[var(--scolio-text-primary)] mb-2" style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)' }}>
                Médico responsável *
              </label>
              {aCarregarMedicos ? (
                <div className="flex items-center gap-2 px-3 py-2 border border-[var(--scolio-border-light)] rounded-[var(--radius-component)] text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  A carregar médicos...
                </div>
              ) : (
                <select
                  value={formData.medicoId}
                  onChange={(e) => handleChange('medicoId', e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--scolio-border-light)] rounded-[var(--radius-component)] focus:outline-none focus:ring-2 focus:ring-[var(--scolio-success-green)]"
                  required
                >
                  <option value="">Selecionar médico...</option>
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
            Cancelar
          </Button>
          <Button type="submit" variant="primary" disabled={aSubmeter || aCarregarMedicos}>
            {aSubmeter ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                A criar...
              </span>
            ) : (
              'Criar paciente'
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
