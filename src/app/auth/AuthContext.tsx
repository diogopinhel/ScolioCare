import React, { createContext, useContext, useEffect, useState } from 'react';
import type { UtilizadorAutenticado, Perfil } from '../../data/types';
import * as authRepo from '../../data/repository/auth';

/**
 * Contexto de autenticação.
 *
 * A sessão é gerida pelo Supabase SDK (persiste em localStorage automaticamente).
 * `onAuthStateChange` dispara no arranque (restauro de sessão) e em qualquer
 * mudança posterior (login, logout, expiração). Os ecrãs não precisam de mudar.
 *
 * Estado `pendente2FA`: usado para o fluxo de 2FA por OTP via email.
 * - modo `'login'`: a sessão Supabase já existe mas o OTP da segunda etapa
 *   ainda não foi verificado — `estaAutenticado` é `false` até verificação.
 * - modo `'ativar'`: o utilizador está autenticado e pediu para ativar 2FA;
 *   o OTP foi enviado e a confirmação está pendente. Não bloqueia acesso.
 *
 * O estado é persistido em `localStorage` (fail-closed): como a sessão
 * Supabase também vive em localStorage, fechar a tab a meio da verificação
 * NÃO pode desbloquear o acesso — o gate tem de sobreviver ao mesmo tempo
 * que a sessão. Quando a sessão morre (logout/expiração), o gate de login
 * pendente é limpo por já não proteger nada.
 */

export type ModoPendente2FA = 'login' | 'ativar';

export interface Pendente2FAState {
  email: string;
  modo: ModoPendente2FA;
}

interface AuthContextValue {
  utilizador: UtilizadorAutenticado | null;
  estaAutenticado: boolean;
  pendente2FA: Pendente2FAState | null;
  aCarregar: boolean;
  login: (email: string, password: string) => Promise<{ needsTwoFactor: boolean }>;
  logout: () => Promise<void>;
  iniciarAtivacao2FA: () => Promise<void>;
  verificar2FA: (token: string) => Promise<void>;
  verificarEAtivar2FA: (token: string) => Promise<void>;
  desativar2FA: () => Promise<void>;
  reenviarOtp: () => Promise<void>;
  cancelarPendente2FA: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const LS_KEY_PENDENTE_2FA = 'scolio.pendente2FA';

function lerPendenteDeStorage(): Pendente2FAState | null {
  try {
    const raw = localStorage.getItem(LS_KEY_PENDENTE_2FA);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Pendente2FAState>;
    if (typeof parsed.email !== 'string') return null;
    if (parsed.modo !== 'login' && parsed.modo !== 'ativar') return null;
    return { email: parsed.email, modo: parsed.modo };
  } catch {
    return null;
  }
}

// ─── Provider ──────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [utilizador, setUtilizador] = useState<UtilizadorAutenticado | null>(null);
  const [pendente2FA, setPendente2FA] = useState<Pendente2FAState | null>(
    lerPendenteDeStorage,
  );
  const [aCarregar, setACarregar] = useState(true);

  // Sincroniza o estado pendente com o localStorage (ver doc acima).
  useEffect(() => {
    try {
      if (pendente2FA) localStorage.setItem(LS_KEY_PENDENTE_2FA, JSON.stringify(pendente2FA));
      else localStorage.removeItem(LS_KEY_PENDENTE_2FA);
    } catch {
      // localStorage indisponível (private mode estrito) — gate fica só em memória
    }
  }, [pendente2FA]);

  useEffect(() => {
    let ativo = true;

    // Fallback: se o Supabase não responder em 5 s (rede lenta ou down),
    // assume sem sessão para não deixar o ecrã em branco indefinidamente.
    const timeout = window.setTimeout(() => {
      if (ativo) setACarregar(false);
    }, 5000);

    const cancelar = authRepo.subscribeToMudancasAuth((u) => {
      if (ativo) {
        clearTimeout(timeout);
        setUtilizador(u);
        if (u === null) {
          // Sem sessão o gate de login pendente não protege nada — limpá-lo
          // evita que um estado órfão mande o utilizador para o ecrã de
          // verificação sem haver login em curso.
          setPendente2FA((atual) => (atual?.modo === 'login' ? null : atual));
        }
        setACarregar(false);
      }
    });

    return () => {
      ativo = false;
      clearTimeout(timeout);
      cancelar();
    };
  }, []);

  const fazerLogin = async (email: string, password: string) => {
    const resultado = await authRepo.login(email, password);
    if (resultado.needsTwoFactor) {
      setPendente2FA({ email: resultado.email, modo: 'login' });
      return { needsTwoFactor: true };
    }
    setUtilizador(resultado.utilizador);
    return { needsTwoFactor: false };
  };

  const fazerLogout = async () => {
    setPendente2FA(null);
    await authRepo.logout();
    // O subscriber irá limpar utilizador quando onAuthStateChange disparar.
  };

  const iniciarAtivacao2FA = async () => {
    if (!utilizador) throw new Error('Não autenticado.');
    await authRepo.enviarOtpEmail(utilizador.email);
    setPendente2FA({ email: utilizador.email, modo: 'ativar' });
  };

  const verificar2FA = async (token: string) => {
    if (!pendente2FA || pendente2FA.modo !== 'login') {
      throw new Error('Nenhuma verificação de login pendente.');
    }
    const u = await authRepo.verificarOtpEmail(pendente2FA.email, token, {
      marcarComoLogin: true,
    });
    setPendente2FA(null);
    setUtilizador(u);
  };

  const verificarEAtivar2FA = async (token: string) => {
    if (!pendente2FA || pendente2FA.modo !== 'ativar') {
      throw new Error('Nenhuma ativação pendente.');
    }
    if (!utilizador) throw new Error('Não autenticado.');
    await authRepo.verificarOtpEmail(pendente2FA.email, token);
    await authRepo.ativar2FA(utilizador.id);
    setUtilizador({ ...utilizador, twoFactorAtivo: true });
    setPendente2FA(null);
  };

  const desativar2FA = async () => {
    if (!utilizador) throw new Error('Não autenticado.');
    await authRepo.desativar2FA(utilizador.id);
    setUtilizador({ ...utilizador, twoFactorAtivo: false });
  };

  const reenviarOtp = async () => {
    if (!pendente2FA) throw new Error('Nenhuma verificação pendente.');
    await authRepo.enviarOtpEmail(pendente2FA.email);
  };

  const cancelarPendente2FA = async () => {
    const modo = pendente2FA?.modo;
    setPendente2FA(null);
    if (modo === 'login') {
      // No fluxo de login, a sessão Supabase já está estabelecida — temos de a
      // terminar para evitar bypass do 2FA em refreshes futuros.
      await authRepo.logout();
      setUtilizador(null);
    }
    // No fluxo de ativação, a sessão é válida e o utilizador continua
    // autenticado — basta limpar o estado pendente.
  };

  const value: AuthContextValue = {
    utilizador,
    estaAutenticado: utilizador !== null && pendente2FA?.modo !== 'login',
    pendente2FA,
    aCarregar,
    login: fazerLogin,
    logout: fazerLogout,
    iniciarAtivacao2FA,
    verificar2FA,
    verificarEAtivar2FA,
    desativar2FA,
    reenviarOtp,
    cancelarPendente2FA,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ─── Hook ──────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth() tem de ser usado dentro de <AuthProvider>.');
  }
  return ctx;
}

// ─── Helpers de redireccionamento ──────────────────────────────────────────

/**
 * Devolve a rota inicial para um perfil. Usado pelo LoginScreen e pela
 * raiz protegida para redireccionar o utilizador depois de autenticado.
 */
export function rotaInicialPara(perfil: Perfil): string {
  switch (perfil) {
    case 'ADMIN':
      return '/admin-panel';
    case 'TECNICO':
      return '/tecnico';
    case 'MEDICO':
      return '/';
    case 'PACIENTE':
    default:
      // Pacientes utilizam a app React Native — acesso web não suportado
      return '/login';
  }
}

