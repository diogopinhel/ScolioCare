import React from 'react';
import { ShieldOff, ArrowLeft, Mail, Home } from 'lucide-react';
import { Button } from '../../components/scolio';
import { useNavigate } from 'react-router';

export default function Error403Screen() {
  const navigate = useNavigate();

  return (
    <div className="h-full flex flex-col items-center justify-center bg-[var(--scolio-page-surface)] p-8">
      <div className="max-w-md w-full text-center space-y-6">

        {/* Icon */}
        <div className="flex justify-center">
          <div className="w-24 h-24 rounded-full bg-[var(--scolio-danger-surface)] flex items-center justify-center">
            <ShieldOff className="w-12 h-12 text-[var(--scolio-danger-coral)]" />
          </div>
        </div>

        {/* Error Code */}
        <div>
          <p
            className="text-[var(--scolio-danger-coral)] font-semibold mb-2"
            style={{ fontSize: '64px', lineHeight: 1 }}
          >
            403
          </p>
          <h1 className="text-[var(--scolio-text-primary)] mb-3">Acesso proibido</h1>
          <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>
            Não tem permissão para aceder a este recurso. O seu perfil de utilizador não tem os privilégios necessários para esta área do ScolioScan.
          </p>
        </div>

        {/* Role info */}
        <div className="bg-white border border-[var(--scolio-border-light)] rounded-[var(--radius-card)] p-5 text-left space-y-3">
          <p className="text-[var(--scolio-text-primary)] font-medium" style={{ fontSize: 'var(--text-body)' }}>
            Detalhes do erro
          </p>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>
                O seu perfil
              </span>
              <span className="text-[var(--scolio-text-primary)] font-medium" style={{ fontSize: 'var(--text-caption)' }}>
                Técnico
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>
                Perfil necessário
              </span>
              <span className="text-[var(--scolio-text-primary)] font-medium" style={{ fontSize: 'var(--text-caption)' }}>
                Administrador
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>
                Recurso solicitado
              </span>
              <span className="text-[var(--scolio-text-primary)] font-medium" style={{ fontSize: 'var(--text-caption)' }}>
                /admin
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Button
            variant="primary"
            className="w-full"
            onClick={() => navigate('/')}
          >
            <Home className="w-4 h-4 mr-2" />
            Voltar ao dashboard
          </Button>
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Página anterior
          </Button>
          <button
            className="flex items-center justify-center gap-2 w-full text-[var(--scolio-primary-blue)] hover:underline"
            style={{ fontSize: 'var(--text-body)' }}
          >
            <Mail className="w-4 h-4" />
            Contactar administrador do sistema
          </button>
        </div>

        <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>
          Se considerar que esta restrição é um erro, contacte o administrador do sistema com referência ao erro 403-AUTH-ROLE.
        </p>
      </div>
    </div>
  );
}
