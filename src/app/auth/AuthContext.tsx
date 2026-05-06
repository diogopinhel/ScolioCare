import React, { createContext, useContext, useEffect, useState } from 'react';
import type { UtilizadorAutenticado, Perfil } from '../../data/types';
import * as authRepo from '../../data/repository/auth';

/**
 * Contexto de autenticação.
 *
 * A sessão é gerida pelo Supabase SDK (persiste em localStorage automaticamente).
 * `onAuthStateChange` dispara no arranque (restauro de sessão) e em qualquer
 * mudança posterior (login, logout, expiração). Os ecrãs não precisam de mudar.
 */

interface AuthContextValue {
  utilizador: UtilizadorAutenticado | null;
  estaAutenticado: boolean;
  aCarregar: boolean;
  login: (email: string, password: string) => Promise<UtilizadorAutenticado>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ──────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [utilizador, setUtilizador] = useState<UtilizadorAutenticado | null>(null);
  const [aCarregar, setACarregar] = useState(true);

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
    const u = await authRepo.login(email, password);
    // Definir imediatamente para que o redirect via <Navigate> seja instantâneo.
    // O subscriber também vai disparar, mas com o mesmo valor — sem consequências.
    setUtilizador(u);
    return u;
  };

  const fazerLogout = async () => {
    await authRepo.logout();
    // O subscriber irá limpar utilizador quando onAuthStateChange disparar.
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
