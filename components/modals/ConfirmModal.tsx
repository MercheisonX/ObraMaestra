
import React, { ReactNode } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import ShieldExclamationIcon from '../icons/ShieldExclamationIcon'; // Example icon

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: ReactNode;
  confirmText?: string;
  cancelText?: string;
  icon?: ReactNode;
  showCancel?: boolean;
  children?: ReactNode; // Allow custom content
  formId?: string;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  icon = <ShieldExclamationIcon className="w-12 h-12 text-yellow-400" />,
  showCancel = true,
  children,
  formId,
}) => {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="md">
      <div className="text-center">
        {icon && <div className="mx-auto mb-4 flex items-center justify-center h-16 w-16 rounded-full bg-[var(--color-secondary-bg)]">{icon}</div>}
        {message && <p className="text-md text-[var(--color-text-primary)] mb-6 whitespace-pre-line">{message}</p>}
        {children}
      </div>
      <div className="flex justify-end space-x-3 pt-5 border-t border-[var(--color-border)] mt-5">
        {showCancel && (
          <Button variant="secondary" onClick={onClose}>
            {cancelText}
          </Button>
        )}
        <Button variant="primary" onClick={onConfirm} type={formId ? "submit" : "button"} form={formId}>
          {confirmText}
        </Button>
      </div>
    </Modal>
  );
};

export default ConfirmModal;
