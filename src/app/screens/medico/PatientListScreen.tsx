import React from 'react';
import { Eye, Edit, Archive, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { Button, SearchBar, StatusBadge } from '../../components/scolio';
import { useNavigate } from 'react-router';

// Mock patient data
const patientsData = [
  {
    id: 1,
    name: 'Maria Silva',
    patientId: 'PT-2024-0847',
    birthDate: '1985-03-15',
    gender: 'Female',
    doctor: 'Dr. Ana Martins',
    examsCount: 12,
    lastExam: '2026-04-05',
    status: 'analyzed' as const,
  },
  {
    id: 2,
    name: 'João Santos',
    patientId: 'PT-2024-0846',
    birthDate: '1992-07-22',
    gender: 'Male',
    doctor: 'Dr. Carlos Mendes',
    examsCount: 8,
    lastExam: '2026-04-07',
    status: 'pending' as const,
  },
  {
    id: 3,
    name: 'Ana Costa',
    patientId: 'PT-2024-0845',
    birthDate: '1978-11-30',
    gender: 'Female',
    doctor: 'Dr. Ana Martins',
    examsCount: 15,
    lastExam: '2026-04-02',
    status: 'analyzed' as const,
  },
  {
    id: 4,
    name: 'Pedro Oliveira',
    patientId: 'PT-2024-0844',
    birthDate: '2005-05-18',
    gender: 'Male',
    doctor: 'Dr. Sofia Reis',
    examsCount: 5,
    lastExam: '2026-04-08',
    status: 'in-analysis' as const,
  },
  {
    id: 5,
    name: 'Sofia Pereira',
    patientId: 'PT-2024-0843',
    birthDate: '1995-09-12',
    gender: 'Female',
    doctor: 'Dr. Ana Martins',
    examsCount: 10,
    lastExam: '2026-04-06',
    status: 'analyzed' as const,
  },
  {
    id: 6,
    name: 'Carlos Rodrigues',
    patientId: 'PT-2024-0842',
    birthDate: '1988-02-28',
    gender: 'Male',
    doctor: 'Dr. Carlos Mendes',
    examsCount: 7,
    lastExam: '2026-03-29',
    status: 'analyzed' as const,
  },
  {
    id: 7,
    name: 'Beatriz Almeida',
    patientId: 'PT-2024-0841',
    birthDate: '2010-12-05',
    gender: 'Female',
    doctor: 'Dr. Sofia Reis',
    examsCount: 3,
    lastExam: '2026-04-04',
    status: 'pending' as const,
  },
  {
    id: 8,
    name: 'Miguel Fernandes',
    patientId: 'PT-2024-0840',
    birthDate: '1982-06-17',
    gender: 'Male',
    doctor: 'Dr. Ana Martins',
    examsCount: 11,
    lastExam: '2026-04-01',
    status: 'analyzed' as const,
  },
  {
    id: 9,
    name: 'Laura Gomes',
    patientId: 'PT-2024-0839',
    birthDate: '1999-04-09',
    gender: 'Female',
    doctor: 'Dr. Carlos Mendes',
    examsCount: 6,
    lastExam: '2026-03-28',
    status: 'archived' as const,
  },
  {
    id: 10,
    name: 'Ricardo Lopes',
    patientId: 'PT-2024-0838',
    birthDate: '1990-08-23',
    gender: 'Male',
    doctor: 'Dr. Sofia Reis',
    examsCount: 9,
    lastExam: '2026-04-03',
    status: 'analyzed' as const,
  },
  {
    id: 11,
    name: 'Inês Martins',
    patientId: 'PT-2024-0837',
    birthDate: '2008-01-14',
    gender: 'Female',
    doctor: 'Dr. Ana Martins',
    examsCount: 4,
    lastExam: '2026-03-30',
    status: 'pending' as const,
  },
  {
    id: 12,
    name: 'Tiago Sousa',
    patientId: 'PT-2024-0836',
    birthDate: '1987-10-07',
    gender: 'Male',
    doctor: 'Dr. Carlos Mendes',
    examsCount: 13,
    lastExam: '2026-04-07',
    status: 'analyzed' as const,
  },
  {
    id: 13,
    name: 'Catarina Dias',
    patientId: 'PT-2024-0835',
    birthDate: '1993-03-25',
    gender: 'Female',
    doctor: 'Dr. Sofia Reis',
    examsCount: 8,
    lastExam: '2026-04-05',
    status: 'in-analysis' as const,
  },
  {
    id: 14,
    name: 'Gonçalo Ferreira',
    patientId: 'PT-2024-0834',
    birthDate: '2012-07-19',
    gender: 'Male',
    doctor: 'Dr. Ana Martins',
    examsCount: 2,
    lastExam: '2026-03-26',
    status: 'analyzed' as const,
  },
  {
    id: 15,
    name: 'Mariana Nunes',
    patientId: 'PT-2024-0833',
    birthDate: '1981-11-02',
    gender: 'Female',
    doctor: 'Dr. Carlos Mendes',
    examsCount: 14,
    lastExam: '2026-04-08',
    status: 'analyzed' as const,
  },
  {
    id: 16,
    name: 'André Pinto',
    patientId: 'PT-2024-0832',
    birthDate: '1996-05-31',
    gender: 'Male',
    doctor: 'Dr. Sofia Reis',
    examsCount: 7,
    lastExam: '2026-04-02',
    status: 'pending' as const,
  },
  {
    id: 17,
    name: 'Rita Carvalho',
    patientId: 'PT-2024-0831',
    birthDate: '2006-09-16',
    gender: 'Female',
    doctor: 'Dr. Ana Martins',
    examsCount: 5,
    lastExam: '2026-03-31',
    status: 'analyzed' as const,
  },
  {
    id: 18,
    name: 'Diogo Correia',
    patientId: 'PT-2024-0830',
    birthDate: '1989-12-08',
    gender: 'Male',
    doctor: 'Dr. Carlos Mendes',
    examsCount: 10,
    lastExam: '2026-04-06',
    status: 'analyzed' as const,
  },
  {
    id: 19,
    name: 'Leonor Ramos',
    patientId: 'PT-2024-0829',
    birthDate: '1994-02-21',
    gender: 'Female',
    doctor: 'Dr. Sofia Reis',
    examsCount: 6,
    lastExam: '2026-04-04',
    status: 'in-analysis' as const,
  },
  {
    id: 20,
    name: 'Rui Henriques',
    patientId: 'PT-2024-0828',
    birthDate: '1986-08-13',
    gender: 'Male',
    doctor: 'Dr. Ana Martins',
    examsCount: 11,
    lastExam: '2026-04-01',
    status: 'analyzed' as const,
  },
];

export default function PatientListScreen() {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedGender, setSelectedGender] = React.useState('all');
  const [selectedDoctor, setSelectedDoctor] = React.useState('all');
  const [perPage, setPerPage] = React.useState('20');
  const [hoveredRow, setHoveredRow] = React.useState<number | null>(null);
  const [showArchiveModal, setShowArchiveModal] = React.useState(false);
  const [patientToArchive, setPatientToArchive] = React.useState<{id: number, name: string} | null>(null);

  const totalPatients = 847;

  const navigate = useNavigate();

  const handleArchiveClick = (patient: { id: number, name: string }) => {
    setPatientToArchive(patient);
    setShowArchiveModal(true);
  };

  const confirmArchive = () => {
    // Here you would implement the actual archive logic
    setShowArchiveModal(false);
    setPatientToArchive(null);
  };

  return (
    <div className="p-8 space-y-6 overflow-auto h-full">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-[var(--scolio-text-primary)]">Pacientes</h1>
        <Button variant="primary" onClick={() => navigate('/patients/new')}>Novo paciente</Button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-[var(--radius-card)] shadow-sm border border-[var(--scolio-border-light)] p-6">
        <div className="flex gap-4">
          {/* Search Bar */}
          <div className="flex-1">
            <SearchBar
              placeholder="Pesquisar por nome ou número de ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Gender Filter */}
          <div className="w-40 relative">
            <select
              value={selectedGender}
              onChange={(e) => setSelectedGender(e.target.value)}
              className="w-full px-3 py-2 pr-10 border border-[var(--scolio-border-light)] rounded-[var(--radius-component)] focus:outline-none focus:ring-2 focus:ring-[var(--scolio-primary-blue)] focus:border-transparent appearance-none"
            >
              <option value="all">Todos os géneros</option>
              <option value="female">Feminino</option>
              <option value="male">Masculino</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--scolio-neutral-gray)] pointer-events-none" />
          </div>

          {/* Age Range Filter */}
          <div className="w-40 relative">
            <select
              className="w-full px-3 py-2 pr-10 border border-[var(--scolio-border-light)] rounded-[var(--radius-component)] focus:outline-none focus:ring-2 focus:ring-[var(--scolio-primary-blue)] focus:border-transparent appearance-none"
            >
              <option value="all">Todas as idades</option>
              <option value="0-18">0-18 anos</option>
              <option value="19-40">19-40 anos</option>
              <option value="41-60">41-60 anos</option>
              <option value="60+">60+ anos</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--scolio-neutral-gray)] pointer-events-none" />
          </div>

          {/* Doctor Filter */}
          <div className="w-48 relative">
            <select
              value={selectedDoctor}
              onChange={(e) => setSelectedDoctor(e.target.value)}
              className="w-full px-3 py-2 pr-10 border border-[var(--scolio-border-light)] rounded-[var(--radius-component)] focus:outline-none focus:ring-2 focus:ring-[var(--scolio-primary-blue)] focus:border-transparent appearance-none"
            >
              <option value="all">Todos os médicos</option>
              <option value="martins">Dr. Ana Martins</option>
              <option value="mendes">Dr. Carlos Mendes</option>
              <option value="reis">Dr. Sofia Reis</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--scolio-neutral-gray)] pointer-events-none" />
          </div>

          {/* Sort Controls */}
          <div className="w-44 relative">
            <select
              className="w-full px-3 py-2 pr-10 border border-[var(--scolio-border-light)] rounded-[var(--radius-component)] focus:outline-none focus:ring-2 focus:ring-[var(--scolio-primary-blue)] focus:border-transparent appearance-none"
            >
              <option value="name">Ordenar por nome</option>
              <option value="id">Ordenar por ID</option>
              <option value="date">Ordenar por último exame</option>
              <option value="exams">Ordenar por número de exames</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--scolio-neutral-gray)] pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-[var(--radius-card)] shadow-sm border border-[var(--scolio-border-light)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[var(--scolio-page-surface)] border-b border-[var(--scolio-border-light)]">
                <th className="text-left px-6 py-3 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-semibold)' }}>
                  PACIENTE
                </th>
                <th className="text-left px-6 py-3 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-semibold)' }}>
                  NÚMERO DE ID
                </th>
                <th className="text-left px-6 py-3 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-semibold)' }}>
                  DATA DE NASCIMENTO
                </th>
                <th className="text-left px-6 py-3 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-semibold)' }}>
                  GÊNERO
                </th>
                <th className="text-left px-6 py-3 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-semibold)' }}>
                  MÉDICO
                </th>
                <th className="text-left px-6 py-3 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-semibold)' }}>
                  EXAMES
                </th>
                <th className="text-left px-6 py-3 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-semibold)' }}>
                  ÚLTIMO EXAME
                </th>
                <th className="text-left px-6 py-3 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-semibold)' }}>
                  STATUS
                </th>
                <th className="text-left px-6 py-3 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-semibold)' }}>
                  AÇÕES
                </th>
              </tr>
            </thead>
            <tbody>
              {patientsData.map((patient) => (
                <tr
                  key={patient.id}
                  className={`border-b border-[var(--scolio-border-light)] transition-colors ${
                    hoveredRow === patient.id ? 'bg-[var(--scolio-light-blue-surface)]' : 'bg-white'
                  }`}
                  onMouseEnter={() => setHoveredRow(patient.id)}
                  onMouseLeave={() => setHoveredRow(null)}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[var(--scolio-primary-blue)] flex items-center justify-center text-white font-medium flex-shrink-0">
                        {patient.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span className="text-[var(--scolio-text-primary)] font-medium" style={{ fontSize: 'var(--text-body)' }}>
                        {patient.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>
                    {patient.patientId}
                  </td>
                  <td className="px-6 py-4 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>
                    {new Date(patient.birthDate).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </td>
                  <td className="px-6 py-4 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>
                    {patient.gender}
                  </td>
                  <td className="px-6 py-4 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>
                    {patient.doctor}
                  </td>
                  <td className="px-6 py-4 text-[var(--scolio-text-primary)] font-medium" style={{ fontSize: 'var(--text-body)' }}>
                    {patient.examsCount}
                  </td>
                  <td className="px-6 py-4 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>
                    {new Date(patient.lastExam).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={patient.status} />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button 
                        className="p-1.5 text-[var(--scolio-text-secondary)] hover:text-[var(--scolio-primary-blue)] hover:bg-[var(--scolio-light-blue-surface)] rounded transition-colors"
                        title="View patient"
                        onClick={() => navigate(`/patients/${patient.id}`)}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        className="p-1.5 text-[var(--scolio-text-secondary)] hover:text-[var(--scolio-primary-blue)] hover:bg-[var(--scolio-light-blue-surface)] rounded transition-colors"
                        title="Edit patient"
                        onClick={() => navigate(`/patients/${patient.id}/edit`)}
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        className="p-1.5 text-[var(--scolio-text-secondary)] hover:text-[var(--scolio-danger-coral)] hover:bg-[var(--scolio-danger-surface)] rounded transition-colors"
                        title="Archive patient"
                        onClick={() => handleArchiveClick({ id: patient.id, name: patient.name })}
                      >
                        <Archive className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer Pagination */}
        <div className="flex items-center justify-between px-6 py-4 bg-[var(--scolio-page-surface)] border-t border-[var(--scolio-border-light)]">
          <div className="flex items-center gap-4">
            <span className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>
              Mostrando 1–20 de {totalPatients} pacientes
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>
                Por página:
              </span>
              <select
                value={perPage}
                onChange={(e) => setPerPage(e.target.value)}
                className="w-20 px-3 py-2 pr-8 border border-[var(--scolio-border-light)] rounded-[var(--radius-component)] focus:outline-none focus:ring-2 focus:ring-[var(--scolio-primary-blue)] focus:border-transparent appearance-none"
              >
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="secondary" className="px-3 py-2">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-1">
              <button className="px-3 py-2 bg-[var(--scolio-primary-blue)] text-white rounded-[var(--radius-component)]" style={{ fontSize: 'var(--text-body)' }}>
                1
              </button>
              <button className="px-3 py-2 text-[var(--scolio-text-secondary)] hover:bg-[var(--scolio-page-surface)] rounded-[var(--radius-component)]" style={{ fontSize: 'var(--text-body)' }}>
                2
              </button>
              <button className="px-3 py-2 text-[var(--scolio-text-secondary)] hover:bg-[var(--scolio-page-surface)] rounded-[var(--radius-component)]" style={{ fontSize: 'var(--text-body)' }}>
                3
              </button>
              <span className="px-2 text-[var(--scolio-text-secondary)]">...</span>
              <button className="px-3 py-2 text-[var(--scolio-text-secondary)] hover:bg-[var(--scolio-page-surface)] rounded-[var(--radius-component)]" style={{ fontSize: 'var(--text-body)' }}>
                43
              </button>
            </div>
            <Button variant="secondary" className="px-3 py-2">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Archive Confirmation Modal */}
      {showArchiveModal && patientToArchive && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-[var(--radius-modal)] shadow-lg w-[480px] max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[var(--scolio-border-light)]">
              <h2 className="text-[var(--scolio-text-primary)]">Arquivar paciente</h2>
            </div>

            <div className="p-6">
              <p className="text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-body)' }}>
                Tem a certeza que pretende arquivar este paciente?
              </p>
              <p className="text-[var(--scolio-text-secondary)] mt-2" style={{ fontSize: 'var(--text-body)' }}>
                <strong>{patientToArchive.name}</strong>
              </p>
            </div>

            <div className="p-6 border-t border-[var(--scolio-border-light)] flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowArchiveModal(false);
                  setPatientToArchive(null);
                }}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={confirmArchive}
                className="bg-[var(--scolio-danger-coral)] hover:bg-[#C24D25]"
              >
                Arquivar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}