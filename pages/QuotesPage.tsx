
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Quote, QuoteStatus, Client, Job } from '../types';
import { getQuotes, getClients, getJobs, deleteQuote as deleteQuoteFromStorage, addQuote, generateId, getCompanyProfile } from '../utils/localStorageManager';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import PlusIcon from '../components/icons/PlusIcon';
import MagnifyingGlassIcon from '../components/icons/MagnifyingGlassIcon';
import QuoteListItem from '../components/QuoteListItem';
import ConfirmModal from '../components/modals/ConfirmModal';
import { ITEMS_PER_LOAD, QUOTE_STATUS_OPTIONS } from '../constants';
import QuoteDetailModal from '../components/modals/QuoteDetailModal';
import { useHeaderVisibility } from '../App';

const QuotesPage: React.FC = () => {
  const navigate = useNavigate();
  const { isHeaderVisible } = useHeaderVisibility();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<QuoteStatus | 'All'>('All');
  const [visibleQuotesCount, setVisibleQuotesCount] = useState(ITEMS_PER_LOAD);

  const [quoteToDeleteId, setQuoteToDeleteId] = useState<string | null>(null);
  const [isConfirmDeleteModalOpen, setIsConfirmDeleteModalOpen] = useState(false);
  
  const [viewingQuote, setViewingQuote] = useState<Quote | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const companyProfile = useMemo(() => getCompanyProfile(), []);

  const fetchQuotesData = () => {
    setQuotes(getQuotes());
    setClients(getClients());
    setJobs(getJobs());
  };

  useEffect(() => {
    fetchQuotesData();
  }, []);

  const enrichedQuotes = useMemo(() => {
    return quotes.map(quote => {
      const client = clients.find(c => c.id === quote.clientId);
      const job = jobs.find(j => j.id === quote.jobId);
      return {
        ...quote,
        clientName: client?.name || quote.clientName || 'Cliente no encontrado',
        jobName: job?.name || quote.jobName || 'Sin trabajo asociado',
      };
    });
  }, [quotes, clients, jobs]);

  const filteredQuotes = useMemo(() => {
    return enrichedQuotes.filter(quote => {
      const matchesFilter = activeFilter === 'All' || quote.status === activeFilter;
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        quote.quoteNumber.toLowerCase().includes(searchLower) ||
        (quote.clientName && quote.clientName.toLowerCase().includes(searchLower)) ||
        (quote.jobName && quote.jobName.toLowerCase().includes(searchLower));
      return matchesFilter && matchesSearch;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [enrichedQuotes, searchTerm, activeFilter]);

  const quotesToDisplay = useMemo(() => {
    return filteredQuotes.slice(0, visibleQuotesCount);
  }, [filteredQuotes, visibleQuotesCount]);

  const handleLoadMore = () => {
    setVisibleQuotesCount(prev => prev + ITEMS_PER_LOAD);
  };

  const handleViewQuoteDetails = (quote: Quote) => {
    setViewingQuote(quote);
    setIsDetailModalOpen(true);
  };

  const handleEditQuote = (quoteId: string) => {
    navigate(`/quotes/edit/${quoteId}`);
  };

  const handleDeleteQuote = (quoteId: string) => {
    setQuoteToDeleteId(quoteId);
    setIsConfirmDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (quoteToDeleteId) {
      deleteQuoteFromStorage(quoteToDeleteId);
      fetchQuotesData();
      setIsConfirmDeleteModalOpen(false);
      setQuoteToDeleteId(null);
    }
  };

  const handleDuplicateQuote = (originalQuote: Quote) => {
    const job = jobs.find(j => j.id === originalQuote.jobId);
    const client = clients.find(c => c.id === (job?.clientId || originalQuote.clientId));

    if (!job || !client || !companyProfile) {
        alert("No se pudo duplicar la cotización. Faltan datos del trabajo, cliente o perfil de empresa.");
        return;
    }

    const newQuote: Quote = {
      ...originalQuote,
      id: generateId('quote-'),
      quoteNumber: `COT-${String(Date.now()).slice(-6)}`, // New quote number
      date: new Date().toISOString(),
      status: QuoteStatus.Draft,
      // Ensure clientInfo and companyInfo are up-to-date for the new quote
      clientInfo: client, 
      companyInfo: companyProfile, 
    };
    addQuote(newQuote);
    fetchQuotesData();
    navigate(`/quotes/edit/${newQuote.id}`); // Open the new duplicated quote for editing
  };
  
  const filterButtons: { label: string; value: QuoteStatus | 'All' }[] = [
    { label: 'Todas', value: 'All' },
    ...QUOTE_STATUS_OPTIONS.map(opt => ({label: opt.label, value: opt.value as QuoteStatus}))
  ];

  return (
    <div className="px-6 pb-24 space-y-6">
      <div 
        className="sticky top-0 bg-[var(--color-primary-app)]/80 backdrop-blur-sm z-[var(--z-index-sticky-element)] -mx-6 px-6 transition-transform duration-300"
        style={{
          transform: isHeaderVisible ? 'translateY(0)' : 'translateY(calc(-1 * 6rem))'
        }}
      >
        <div className="flex justify-between items-center mb-4 pt-4">
          <h2 className="text-2xl font-bold text-white">Todas las Cotizaciones</h2>
          <Button 
            onClick={() => navigate('/quotes/new')} 
            size="sm" 
            shape="pill" 
            leftIcon={<PlusIcon className="w-4 h-4"/>}
            className="bg-gradient-to-r from-cyan-400 to-blue-500 text-white font-bold"
          >
            Nueva Cotización
          </Button>
        </div>
        <div className="relative mb-4">
          <Input 
            placeholder="Buscar por Nº, cliente o trabajo..."
            value={searchTerm}
            onChange={(e) => {
                setSearchTerm(e.target.value);
                setVisibleQuotesCount(ITEMS_PER_LOAD);
            }}
            leadingIcon={<MagnifyingGlassIcon />}
            className="rounded-xl !pl-11"
          />
        </div>
        <div className="flex gap-2 pb-3 overflow-x-auto styled-scrollbar-horizontal-thin">
            {filterButtons.map(btn => (
              <button
                key={btn.value}
                onClick={() => {
                  setActiveFilter(btn.value);
                  setVisibleQuotesCount(ITEMS_PER_LOAD);
                }}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold flex-shrink-0 transition-colors ${activeFilter === btn.value ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-white' : 'bg-[var(--color-secondary-bg)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]'}`}
              >
                {btn.label}
              </button>
            ))}
        </div>
      </div>

      {quotesToDisplay.length > 0 ? (
        <div className="space-y-4 pt-2">
          {quotesToDisplay.map(quote => (
            <QuoteListItem
              key={quote.id}
              quote={quote}
              onView={() => handleViewQuoteDetails(quote)}
              onEdit={() => handleEditQuote(quote.id)}
              onDelete={() => handleDeleteQuote(quote.id)}
              onDuplicate={() => handleDuplicateQuote(quote)}
            />
          ))}
          {visibleQuotesCount < filteredQuotes.length && (
            <Button variant="secondary" shape="rounded" fullWidth onClick={handleLoadMore} className="mt-6">
              Cargar Más Cotizaciones ({filteredQuotes.length - visibleQuotesCount} restantes)
            </Button>
          )}
        </div>
      ) : (
        <p className="text-center text-[var(--color-text-secondary)] py-8">
          No se encontraron cotizaciones con los filtros actuales.
        </p>
      )}

      {viewingQuote && isDetailModalOpen && (
        <QuoteDetailModal
            isOpen={isDetailModalOpen}
            onClose={() => setIsDetailModalOpen(false)}
            quote={viewingQuote}
            onEdit={(quoteId) => {
                setIsDetailModalOpen(false);
                handleEditQuote(quoteId);
            }}
        />
      )}

      <ConfirmModal
        isOpen={isConfirmDeleteModalOpen}
        onClose={() => setIsConfirmDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Confirmar Eliminación"
        message="¿Está seguro de que desea eliminar esta cotización? Esta acción no se puede deshacer."
      />
    </div>
  );
};

export default QuotesPage;