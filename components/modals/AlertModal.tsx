import React from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import InformationCircleIcon from '../icons/InformationCircleIcon'; // Example icon

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  confirmText?: string;
  icon?: React.ReactNode;
}

const AlertModal: React.FC<AlertModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
  confirmText = 'Entendido',
  icon = <InformationCircleIcon className="w-12 h-12 text-[var(--color-aquamarine)]" />
}) => {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="md">
      <div className="text-center">
        {icon && <div className="mx-auto mb-4 flex items-center justify-center h-16 w-16 rounded-full bg-[var(--color-surface-2)]">{icon}</div>}
        <p className="text-md text-[var(--color-text-primary)] mb-6 whitespace-pre-line">{message}</p>
      </div>
      <div className="flex justify-end space-x-3">
        <Button variant="primary" onClick={onClose}>
          {confirmText}
        </Button>
      </div>
    </Modal>
  );
};

export default AlertModal;