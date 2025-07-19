import React from 'react';
import Modal from '../ui/Modal';
import { Quote } from '../../types';
import Button from '../ui/Button';
import { CURRENCY_FORMATTER } from '../../constants';

interface QuoteDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  quote: Quote;
  onEdit: (quoteId: string) => void;
}

const DetailRow: React.FC<{ label: string; value: string | number; isTotal?: boolean; isSubtle?: boolean }> = ({ label, value, isTotal = false, isSubtle = false }) => (
  <div className={`flex justify-between items-center py-1.5 ${isTotal ? 'font-bold text-lg' : 'text-sm'} ${isSubtle ? 'text-[var(--color-text-secondary)]' : 'text-[var(--color-text-primary)]'}`}>
    <span>{label}</span>
    <span className={isTotal ? 'text-[var(--color-aquamarine)]' : ''}>{typeof value === 'number' ? CURRENCY_FORMATTER.format(value) : value}</span>
  </div>
);

const QuoteDetailModal: React.FC<QuoteDetailModalProps> = ({ isOpen, onClose, quote, onEdit }) => {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Detalles de Cotización: ${quote.quoteNumber}`} size="lg">
      <div className="space-y-5">

        {/* Header Section */}
        <div className="text-center">
            <h3 className="text-xl font-bold text-white">{quote.jobName}</h3>
            <p className="text-md text-[var(--color-text-secondary)]">{quote.clientName}</p>
            <span className={`mt-2 inline-block px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-500/20 text-blue-300`}>
                {quote.status}
            </span>
        </div>

        {/* Financial Breakdown */}
        <div className="glass-panel p-4 rounded-lg">
            <h4 className="font-semibold text-[var(--color-text-primary)] mb-2 text-md border-b border-[var(--color-glass-border)] pb-1">Desglose Financiero</h4>
            <div className="space-y-1">
                <DetailRow label="Costo de Materiales" value={quote.materialsCost} isSubtle />
                <DetailRow label="Costo de Mano de Obra" value={quote.laborCost} isSubtle />
                <DetailRow label="Otros Gastos del Proyecto" value={quote.otherProjectExpenses || 0} isSubtle />
                <hr className="border-[var(--color-glass-border)] my-1" />
                <DetailRow label="Ganancia Administrativa" value={quote.adminProfit} isSubtle/>
                <hr className="border-[var(--color-glass-border)] my-1" />
                <DetailRow label="Subtotal" value={quote.subtotal} />
                <DetailRow label={`IVA (${(quote.ivaRate || 0) * 100}%)`} value={quote.ivaAmount || 0} />
                <hr className="border-[var(--color-aquamarine-transparent-50)] my-1" />
                <DetailRow label="TOTAL A PAGAR" value={quote.totalAmount} isTotal />
            </div>
        </div>
        
        {/* Service Description */}
        <div>
            <h4 className="font-semibold text-[var(--color-text-primary)] mb-1 text-md">Descripción del Servicio</h4>
            <p className="whitespace-pre-wrap bg-[var(--color-surface-2)] p-3 rounded-md text-sm text-[var(--color-text-secondary)] max-h-40 overflow-y-auto styled-scrollbar">
                {quote.serviceDescription}
            </p>
        </div>

        {/* Terms and Conditions */}
        <div>
            <h4 className="font-semibold text-[var(--color-text-primary)] mb-1 text-md">Términos y Condiciones</h4>
            <p className="whitespace-pre-wrap bg-[var(--color-surface-2)] p-3 rounded-md text-sm text-[var(--color-text-secondary)] max-h-40 overflow-y-auto styled-scrollbar">
                {quote.termsAndConditions}
            </p>
        </div>

        <div className="flex justify-end pt-4 space-x-3 border-t border-[var(--color-glass-border)]">
            <Button onClick={() => onEdit(quote.id)} variant="secondary">Editar Cotización</Button>
            <Button onClick={onClose} variant="primary">Cerrar</Button>
        </div>
      </div>
    </Modal>
  );
};

export default QuoteDetailModal;
