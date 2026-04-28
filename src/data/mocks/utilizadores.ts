import type {
  Administrador,
  MedicoEspecialista,
  TecnicoSaude,
  Paciente,
  UtilizadorAutenticado,
} from '../types';

/**
 * Conjunto inicial de utilizadores mock — uma conta por perfil.
 *
 * Quando ligarmos à BD, esta lista deixa de ser usada: o mock_login()
 * em src/data/repository/auth.ts passará a chamar a API e a devolver
 * os mesmos shapes (UtilizadorAutenticado), sem que os ecrãs precisem
 * de mudar.
 */

export const adminMock: Administrador = {
  id: 'usr-admin-001',
  nomeCompleto: 'Paulo Oliveira',
  email: 'paulo.oliveira@scolio.pt',
  perfil: 'ADMIN',
  ativo: true,
  dataCriacao: '2024-09-01T09:00:00Z',
  ultimoLogin: '2026-04-25T18:42:00Z',
  idioma: 'pt',
  twoFactorAtivo: true,
  contaBloqueada: false,
  nivelAdmin: 1,
};

export const medicoMock: MedicoEspecialista = {
  id: 'usr-medico-001',
  nomeCompleto: 'Dr. Ana Martins',
  email: 'ana.martins@scolio.pt',
  perfil: 'MEDICO',
  ativo: true,
  dataCriacao: '2024-10-15T10:30:00Z',
  ultimoLogin: '2026-04-26T08:15:00Z',
  idioma: 'pt',
  twoFactorAtivo: true,
  contaBloqueada: false,
  cedulaProfissional: 'OM-48217',
  especialidade: 'Ortopedia',
  certDigitalEntidade: 'Cartão de Cidadão',
  certDigitalExpiracao: '2027-12-31T23:59:59Z',
};

export const tecnicoMock: TecnicoSaude = {
  id: 'usr-tecnico-001',
  nomeCompleto: 'Ricardo Sousa',
  email: 'ricardo.sousa@scolio.pt',
  perfil: 'TECNICO',
  ativo: true,
  dataCriacao: '2025-01-20T14:00:00Z',
  ultimoLogin: '2026-04-26T09:00:00Z',
  idioma: 'pt',
  twoFactorAtivo: false,
  contaBloqueada: false,
  codigoFuncionario: 'TR-1138',
  departamento: 'Imagiologia',
};

export const pacienteMock: Paciente = {
  id: 'usr-paciente-001',
  nomeCompleto: 'Maria Silva',
  email: 'maria.silva@scolio.pt',
  perfil: 'PACIENTE',
  ativo: true,
  dataCriacao: '2025-03-10T11:20:00Z',
  ultimoLogin: '2026-04-25T20:10:00Z',
  idioma: 'pt',
  twoFactorAtivo: false,
  contaBloqueada: false,
  dataNascimento: '2008-06-14',
  genero: 'F',
  numeroUtente: '123456789',
  contacto: '+351 912 345 678',
  morada: 'Rua das Acácias, 12, 5000-123 Vila Real',
  contaAtivada: true,
};

export const utilizadoresMock: UtilizadorAutenticado[] = [
  adminMock,
  medicoMock,
  tecnicoMock,
  pacienteMock,
];
