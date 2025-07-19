
import React from 'react';
import { Quote, QuoteStatus } from '../types';
import Button from './ui/Button';
import { CURRENCY_FORMATTER } from '../constants';
import PencilIcon from './icons/PencilIcon';
import TrashIcon from './icons/TrashIcon';
import DocumentDuplicateIcon from './icons/DocumentDuplicateIcon';

interface QuoteListItemProps {
  quote: Quote;
  onView: () => void;
  onEdit: (quoteId: string) => void;
  onDelete: (quoteId: string) => void;
  onDuplicate: (quote: Quote) => void;
}


const QuoteListItem: React.FC<QuoteListItemProps> = ({ quote, onView, onEdit, onDelete, onDuplicate }) => {

  const getStatusStyles = (status: QuoteStatus) => {
    switch (status) {
      case QuoteStatus.Approved:
        return 'bg-green-500/20 text-green-300 border border-green-400/50';
      case QuoteStatus.Sent:
        return 'bg-blue-500/20 text-blue-300 border border-blue-400/50';
      case QuoteStatus.Rejected:
        return 'bg-red-500/20 text-red-300 border border-red-400/50';
      case QuoteStatus.Draft:
      default:
        return 'bg-gray-500/20 text-gray-300 border border-gray-400/50';
    }
  };

  const formattedDate = new Date(quote.date).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div 
        className="bg-[var(--color-secondary-bg)] rounded-2xl p-4 border border-[var(--color-accent)]/30 space-y-4 transition-all duration-200 hover:border-[var(--color-accent)] cursor-pointer shadow-[0_0_15px_rgba(34,211,238,0.1)]"
        onClick={onView}
    >
      <div className="relative">
        <div className="pr-24">
            <h3 className="text-lg font-bold text-[var(--color-accent)] leading-tight truncate" title={quote.jobName}>
                {quote.jobName || "Cotización General"}
            </h3>
            <p className="text-md font-semibold text-white mt-1 truncate">{quote.clientName}</p>
            <p className="text-sm text-[var(--color-text-secondary)]">Nº: {quote.quoteNumber} - {formattedDate}</p>
        </div>
        <span className={`absolute top-0 right-0 px-3 py-1 text-xs font-semibold rounded-full ${getStatusStyles(quote.status)}`}>
            {quote.status}
        </span>
      </div>

      <div className="flex items-end justify-between pt-2">
        <div className="text-left">
            <p className="text-sm text-[var(--color-text-secondary)]">Total</p>
            <p className="text-2xl font-bold text-white">{CURRENCY_FORMATTER.format(quote.totalAmount)}</p>
        </div>
        <div className="flex items-center justify-end gap-2 -mb-2 -mr-2">
            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onDuplicate(quote); }} aria-label="Duplicar cotización" className="p-2">
                <DocumentDuplicateIcon className="w-5 h-5"/>
            </Button>
            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onEdit(quote.id); }} aria-label="Editar cotización" className="p-2">
                <PencilIcon className="w-5 h-5"/>
            </Button>
            <Button variant="danger" size="sm" onClick={(e) => { e.stopPropagation(); onDelete(quote.id); }} aria-label="Eliminar cotización" className="p-2">
                <TrashIcon className="w-5 h-5"/>
            </Button>
        </div>
      </div>
    </div>
  );
};

export default QuoteListItem;