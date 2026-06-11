import React from 'react';
import { Navigate, useLocation } from 'react-router';
import type { Perfil } from '../../data/types';
import { useAuth } from './AuthContext';

/**
 * Protege uma rota. Comportamento:
 *
 * - Se há um 2FA de login pendente → redirecciona para a verificação.
 * - Se não autenticado → redirecciona para /login (guardando o destino
 *   pretendido em location.state.from para retomar depois).
 * - Se autenticado mas sem o perfil certo → redirecciona para /403.
 * - Se autenticado e com perfil válido → renderiza children.
 *
 * Aceita um único perfil ou uma lista de perfis permitidos.
 */
interface ProtectedRouteProps {
  perfis: Perfil | Perfil[];
  children: React.ReactNode;
}

export function ProtectedRoute({ perfis, children }: ProtectedRouteProps) {
  const { utilizador, estaAutenticado, pendente2FA, aCarregar } = useAuth();
  const location = useLocation();

  if (aCarregar) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--scolio-page-surface)]">
        <div className="w-10 h-10 border-4 border-[var(--scolio-primary-blue)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // 2FA de login pendente: forçar passagem pelo ecrã de verificação.
  // (O modo "ativar" não bloqueia o acesso — o utilizador já está autenticado.)
  if (pendente2FA?.modo === 'login') {
    return <Navigate to="/auth/two-factor-verify" replace />;
  }

  if (!estaAutenticado || !utilizador) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  const perfisPermitidos = Array.isArray(perfis) ? perfis : [perfis];
  if (!perfisPermitidos.includes(utilizador.perfil)) {
    return <Navigate to="/403" replace />;
  }

  return <>{children}</>;
}
