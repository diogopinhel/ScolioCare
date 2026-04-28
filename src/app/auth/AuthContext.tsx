import React, { createContext, useContext, useEffect, useState } from 'react';
import type { UtilizadorAutenticado, Perfil } from '../../data/types';
import * as authRepo from '../../data/repository/auth';

/**
 * Contexto de autenticação.
 *
 * Mantém o utilizador autenticado em memória e persiste-o em localStorage
 * para sobreviver a reloads. Quando passarmos para BD, esta camada continua
 * idêntica — só as chamadas a authRepo.* é que falam com a API real.
 */

const STORAGE_KEY = 'scolioscan.auth.user';

interface AuthContextValue {
  utilizador: UtilizadorAutenticado | null;
  estaAutenticado: boolean;
  aCarregar: boolean;
  login: (email: string, password: string) => Promise<UtilizadorAutenticado>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Helpers de persistência ───────────────────────────────────────────────

function lerSessaoArmazenada(): UtilizadorAutenticado | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as UtilizadorAutenticado;
  } catch {
    return null;
  }
}

function guardarSessao(utilizador: UtilizadorAutenticado | null): void {
  try {
    if (utilizador) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(utilizador));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // localStorage indisponível (modo privado, quota cheia, etc.) — ignorar.
  }
}

// ─── Provider ──────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [utilizador, setUtilizador] = useState<UtilizadorAutenticado | null>(null);
  const [aCarregar, setACarregar] = useState(true);

  // Restaurar sessão à entrada
  useEffect(() => {
    const armazenado = lerSessaoArmazenada();
    if (armazenado) {
      setUtilizador(armazenado);
    }
    setACarregar(false);
  }, []);

  const fazerLogin = async (email: string, password: string) => {
    const u = await authRepo.login(email, password);
    setUtilizador(u);
    guardarSessao(u);
    return u;
  };

  const fazerLogout = async () => {
    await authRepo.logout();
    setUtilizador(null);
    guardarSessao(null);
  };

  const value: AuthContextValue = {
    utilizador,
    estaAutenticado: utilizador !== null,
    aCarregar,
    login: fazerLogin,
    logout: fazerLogout,
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
    case 'PACIENTE':
      return '/mobile/home';
    case 'MEDICO':
    default:
      return '/';
  }
}
