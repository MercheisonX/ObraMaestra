
import React, { ReactNode, useEffect } from 'react';
import ReactDOM from 'react-dom';
import XMarkIcon from '../icons/XMarkIcon';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  footer?: ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'md', footer }) => {
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', handleEscapeKey);
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen, onClose]);

  const modalRoot = typeof document !== 'undefined' ? document.getElementById('modal-root') : null;

  if (!isOpen || !modalRoot) {
    return null;
  }

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-full h-full md:max-w-3xl md:h-auto md:max-h-[90vh]',
  };

  const modalContent = (
    <div
      className="fixed inset-0 bg-[var(--color-primary-app)]/75 backdrop-blur-sm flex items-center justify-center z-[var(--z-index-modal-backdrop)] p-4 transition-opacity duration-300 ease-in-out animate-fadeIn"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className={`bg-[var(--color-secondary-bg)] border border-[var(--color-border)] w-full ${sizeClasses[size]} max-h-[95vh] flex flex-col rounded-2xl shadow-2xl transform transition-all duration-300 ease-out animate-scaleUp`}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
          <h3 className="text-xl font-bold text-white">{title}</h3>
          <button
            onClick={onClose}
            className="text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
            aria-label="Cerrar modal"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </header>
        <div className="p-5 flex-grow overflow-y-auto styled-scrollbar">
          {children}
        </div>
        {footer && (
          <footer className="p-4 border-t border-[var(--color-border)]">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, modalRoot);
};

export default Modal;
