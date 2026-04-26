import React from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  confirmVariant?: 'primary' | 'danger';
  className?: string;
}

export function Modal({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  confirmVariant = 'primary',
  className = '' 
}: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={`relative bg-white rounded-[var(--radius-modal)] shadow-lg max-w-md w-full mx-4 ${className}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--scolio-border-light)]">
          <h2 className="text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-h2)', fontWeight: 'var(--weight-semibold)' }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-[var(--scolio-neutral-gray)] hover:text-[var(--scolio-text-primary)] transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6">
          {children}
        </div>
        
        {/* Footer */}
        {onConfirm && (
          <div className="flex items-center justify-end gap-3 p-6 border-t border-[var(--scolio-border-light)]">
            <Button variant="ghost" onClick={onClose}>
              {cancelLabel}
            </Button>
            <Button variant={confirmVariant} onClick={onConfirm}>
              {confirmLabel}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
