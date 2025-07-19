
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import JobListItem from '../components/JobListItem';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Job, JobStatus } from '../types';
import MagnifyingGlassIcon from '../components/icons/MagnifyingGlassIcon';
import PlusIcon from '../components/icons/PlusIcon';
import { getJobs, getClients, deleteJob as deleteJobFromStorage } from '../utils/localStorageManager';
import JobDetailModal from '../components/modals/JobDetailModal';
import ConfirmModal from '../components/modals/ConfirmModal';
import { ITEMS_PER_LOAD } from '../constants';
import { useHeaderVisibility } from '../App';
import SlidersIcon from '../components/icons/SlidersIcon';

const JobsPage: React.FC = () => {
  const navigate = useNavigate();
  const { isHeaderVisible } = useHeaderVisibility();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<JobStatus | 'All'>('All');
  const [visibleJobsCount, setVisibleJobsCount] = useState(ITEMS_PER_LOAD);

  const [selectedJobIdForDetail, setSelectedJobIdForDetail] = useState<string | null>(null);
  const [isJobDetailModalOpen, setIsJobDetailModalOpen] = useState(false);
  
  const [jobToDeleteId, setJobToDeleteId] = useState<string | null>(null);
  const [isConfirmDeleteModalOpen, setIsConfirmDeleteModalOpen] = useState(false);


  const fetchJobs = () => {
    const rawJobs = getJobs();
    const clients = getClients();
    const populatedJobs = rawJobs.map(job => ({
        ...job,
        client: clients.find(c => c.id === job.clientId) || job.client
    }));
    setJobs(populatedJobs);
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      const matchesFilter = activeFilter === 'All' || job.status === activeFilter;
      const matchesSearch = job.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (job.client?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                            job.address.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesFilter && matchesSearch;
    }).sort((a,b) => new Date(b.startDateProposed).getTime() - new Date(a.startDateProposed).getTime());
  }, [jobs, searchTerm, activeFilter]);

  const jobsToDisplay = useMemo(() => {
    return filteredJobs.slice(0, visibleJobsCount);
  }, [filteredJobs, visibleJobsCount]);

  const handleLoadMoreJobs = () => {
    setVisibleJobsCount(prevCount => prevCount + ITEMS_PER_LOAD);
  };

  const filterButtons: { label: string; value: JobStatus | 'All' }[] = [
    { label: 'Todos', value: 'All' },
    { label: 'En Progreso', value: JobStatus.InProgress },
    { label: 'Pendientes', value: JobStatus.Pending },
    { label: 'Pausados', value: JobStatus.Paused },
    { label: 'Por Pagar', value: JobStatus.Completed },
    { label: 'Pagados', value: JobStatus.Paid },
  ];

  const handleViewJobDetails = (jobId: string) => {
    setSelectedJobIdForDetail(jobId);
    setIsJobDetailModalOpen(true);
  };
  
  const handleJobModalClose = () => {
    setIsJobDetailModalOpen(false);
    setSelectedJobIdForDetail(null);
  };

  const handleJobUpdated = () => {
    fetchJobs();
  };

  const requestDeleteJob = (jobId: string) => {
    setJobToDeleteId(jobId);
    setIsConfirmDeleteModalOpen(true);
  };

  const confirmDeleteJob = () => {
    if (jobToDeleteId) {
        deleteJobFromStorage(jobToDeleteId);
        fetchJobs();
        setJobToDeleteId(null);
        setIsConfirmDeleteModalOpen(false);
    }
  };


  return (
    <div className="px-6 pb-24 space-y-6">
      <div 
        className="sticky top-0 bg-[var(--color-primary-app)]/80 backdrop-blur-sm z-[var(--z-index-sticky-element)] -mx-6 px-6 transition-transform duration-300"
        style={{
          transform: isHeaderVisible ? 'translateY(0)' : 'translateY(calc(-1 * 6rem))'
        }}
      > 
        <div className="flex justify-between items-center mb-4 pt-4">
            <h2 className="text-2xl font-bold text-white">Todos los Trabajos</h2>
            <Button 
              onClick={() => navigate('/new-job')} 
              size="sm" 
              shape="pill" 
              leftIcon={<PlusIcon className="w-4 h-4"/>}
              className="bg-gradient-to-r from-cyan-400 to-blue-500 text-white font-bold"
            >
                Nuevo Trabajo
            </Button>
        </div>
        <div className="flex gap-2 items-center mb-4">
            <Input 
                placeholder="Buscar por nombre, cliente o dirección..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                leadingIcon={<MagnifyingGlassIcon />}
                className="rounded-xl !pl-11 flex-grow"
            />
             <Button variant="secondary" shape="pill" className="p-3">
                <SlidersIcon className="w-5 h-5"/>
             </Button>
        </div>
        <div className="flex gap-2 pb-3 overflow-x-auto styled-scrollbar-horizontal-thin">
            {filterButtons.map(btn => (
                <button
                key={btn.value}
                onClick={() => {
                  setActiveFilter(btn.value);
                  setVisibleJobsCount(ITEMS_PER_LOAD);
                }}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold flex-shrink-0 transition-colors ${activeFilter === btn.value ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-white' : 'bg-[var(--color-secondary-bg)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]'}`}
              >
                {btn.label}
              </button>
            ))}
        </div>
      </div>

      {jobsToDisplay.length > 0 ? (
        <div className="space-y-4 pt-2"> 
          {jobsToDisplay.map(job => (
            <JobListItem 
                key={job.id} 
                job={job} 
                onViewDetails={handleViewJobDetails}
                onQuote={(jobId) => navigate(`/quotes/new/${jobId}`)}
                onDelete={requestDeleteJob}
            />
          ))}
          {visibleJobsCount < filteredJobs.length && (
            <Button
              variant="secondary"
              shape="rounded"
              fullWidth
              onClick={handleLoadMoreJobs}
              className="mt-6"
            >
              Cargar Más Trabajos ({filteredJobs.length - visibleJobsCount} restantes)
            </Button>
          )}
        </div>
      ) : (
        <p className="text-center text-[var(--color-text-secondary)] py-8">No se encontraron trabajos con los filtros actuales.</p>
      )}

      {isJobDetailModalOpen && selectedJobIdForDetail && (
        <JobDetailModal 
            isOpen={isJobDetailModalOpen}
            onClose={handleJobModalClose}
            jobId={selectedJobIdForDetail}
            onJobUpdated={handleJobUpdated}
        />
      )}
      <ConfirmModal
        isOpen={isConfirmDeleteModalOpen}
        onClose={() => setIsConfirmDeleteModalOpen(false)}
        onConfirm={confirmDeleteJob}
        title="Confirmar Eliminación"
        message="¿Está seguro de que desea eliminar este trabajo? Esta acción no se puede deshacer y también eliminará las tareas y cotizaciones asociadas."
      />
    </div>
  );
};

export default JobsPage;