import React from 'react';
import { Navigate, useLocation } from 'react-router';
import type { Perfil } from '../../data/types';
import { useAuth } from './AuthContext';

/**
 * Protege uma rota. Comportamento:
 *
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
  const { utilizador, estaAutenticado, aCarregar } = useAuth();
  const location = useLocation();

  // Enquanto restauramos a sessão do localStorage, evitar redireccionamentos
  // prematuros que provocariam um flicker no /login.
  if (aCarregar) {
    return null;
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
