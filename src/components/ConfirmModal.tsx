import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export default function ConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = 'Confirmar', 
  cancelText = 'Cancelar',
  variant = 'danger'
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const variantClasses = {
    danger: 'bg-red-500 hover:bg-red-600 text-white shadow-red-200',
    warning: 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-200',
    info: 'bg-primary hover:bg-primary-dark text-white shadow-primary-lt'
  };

  const iconClasses = {
    danger: 'text-red-500 bg-red-50',
    warning: 'text-amber-500 bg-amber-50',
    info: 'text-primary bg-primary-lt'
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
        <div className="p-6 flex items-start gap-4">
          <div className={`p-3 rounded-2xl shrink-0 ${iconClasses[variant]}`}>
            <AlertTriangle size={24} />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-app-text mb-1">{title}</h3>
            <p className="text-sm text-app-muted leading-relaxed">{message}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-app-bg rounded-full transition-colors text-app-muted">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 bg-app-bg/30 flex gap-3 justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl font-bold text-app-muted hover:text-app-text transition-colors"
          >
            {cancelText}
          </button>
          <button 
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-8 py-2.5 rounded-xl font-bold shadow-lg transition-all ${variantClasses[variant]}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
