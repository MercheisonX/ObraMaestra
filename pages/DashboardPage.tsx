
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import JobListItem from '../components/JobListItem';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { CURRENCY_FORMATTER } from '../constants';
import { Job, JobStatus, Material } from '../types';
import MagnifyingGlassIcon from '../components/icons/MagnifyingGlassIcon';
import PlusIcon from '../components/icons/PlusIcon';
import BriefcaseIcon from '../components/icons/BriefcaseIcon';
import ClockIcon from '../components/icons/ClockIcon';
import DocumentTextIcon from '../components/icons/DocumentTextIcon';
import BellAlertIcon from '../components/icons/BellAlertIcon';
import { getJobs, getClients, deleteJob as deleteJobFromStorage, getLowStockMaterials } from '../utils/localStorageManager';
import JobDetailModal from '../components/modals/JobDetailModal';
import ConfirmModal from '../components/modals/ConfirmModal';
import JobImagePreviewModal from '../components/modals/JobImagePreviewModal';
import CurrencyDollarIcon from '../components/icons/CurrencyDollarIcon';

const StatCard: React.FC<{
  title: string;
  value: string | number;
  percentage: string;
  subtitle: string;
  icon: React.ReactNode;
  onClick?: () => void;
}> = ({ title, value, percentage, subtitle, icon, onClick }) => {
  const isPositive = percentage.startsWith('+');
  return (
    <div className={`bg-[var(--color-secondary-bg)] p-4 rounded-2xl border border-[var(--color-border)] flex flex-col justify-between ${onClick ? 'cursor-pointer hover:border-[var(--color-accent)]' : ''}`} onClick={onClick}>
        <div className="flex justify-between items-start">
            <span className="text-4xl font-bold text-white">{value}</span>
            <div className="text-[var(--color-text-secondary)]">
              {icon}
            </div>
        </div>
        <div className="mt-2">
            <p className="font-semibold text-white">{title}</p>
            <div className="flex items-center text-xs">
                <span className={isPositive ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'}>{percentage}</span>
                <span className="text-[var(--color-text-muted)] ml-1">{subtitle}</span>
            </div>
        </div>
    </div>
  );
};


const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [lowStockItems, setLowStockItems] = useState<Material[]>([]);


  const [selectedJobIdForDetail, setSelectedJobIdForDetail] = useState<string | null>(null);
  const [isJobDetailModalOpen, setIsJobDetailModalOpen] = useState(false);

  const [jobToDeleteId, setJobToDeleteId] = useState<string | null>(null);
  const [isConfirmDeleteModalOpen, setIsConfirmDeleteModalOpen] = useState(false);

  const [jobForImagePreview, setJobForImagePreview] = useState<Job | null>(null);


  const fetchDashboardData = () => {
    const rawJobs = getJobs();
    const clients = getClients(); 
    const populatedJobs = rawJobs.map(job => ({
        ...job,
        client: clients.find(c => c.id === job.clientId) || job.client 
    }));
    setJobs(populatedJobs);
    setLowStockItems(getLowStockMaterials());
  };

  useEffect(() => {
    fetchDashboardData();
    const handleFocus = () => fetchDashboardData();
    window.addEventListener('focus', handleFocus);
    return () => {
        window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const stats = useMemo(() => {
    const inProgress = jobs.filter(job => job.status === JobStatus.InProgress).length;
    const pending = jobs.filter(job => job.status === JobStatus.Pending).length;
    const completedNotPaid = jobs.filter(job => job.status === JobStatus.Completed).length;
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0,0,0,0);

    const weeklyIncome = jobs
      .filter(job => job.status === JobStatus.Paid && job.finalPrice && new Date(job.paidDate || job.endDateEstimated) >= sevenDaysAgo)
      .reduce((sum, job) => sum + (job.finalPrice || 0), 0);

    return { inProgress, pending, completedNotPaid, weeklyIncome };
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    let displayJobs = jobs.filter(job => job.status !== JobStatus.Paid && job.status !== JobStatus.Completed);
    
    return displayJobs.filter(job => 
        job.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (job.client?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.address.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a,b) => new Date(b.startDateProposed).getTime() - new Date(a.startDateProposed).getTime());
  }, [jobs, searchTerm]);

  
  const handleViewJobDetails = (jobId: string) => {
    setSelectedJobIdForDetail(jobId);
    setIsJobDetailModalOpen(true);
  };

  const handleJobModalClose = () => {
    setIsJobDetailModalOpen(false);
    setSelectedJobIdForDetail(null);
    fetchDashboardData();
  };
  
  const handleJobUpdated = () => {
    fetchDashboardData(); 
  }

  const requestDeleteJob = (jobId: string) => {
    setJobToDeleteId(jobId);
    setIsConfirmDeleteModalOpen(true);
  };

  const confirmDeleteJob = () => {
    if (jobToDeleteId) {
        deleteJobFromStorage(jobToDeleteId);
        fetchDashboardData();
        setJobToDeleteId(null);
        setIsConfirmDeleteModalOpen(false);
    }
  };


  return (
    <div className="px-6 pb-24 space-y-8">
      <div className="text-center">
        <h2 className="text-4xl font-extrabold text-[var(--color-accent)]">¡Bienvenido a ObraMaestra!</h2>
        <p className="text-[var(--color-text-secondary)] mt-1">Tu centro de operaciones para la gestión de construcción</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <StatCard title="En Progreso" value={stats.inProgress} percentage="+12%" subtitle="Trabajos activos" icon={<ClockIcon className="w-6 h-6"/>} onClick={() => navigate('/jobs')}/>
        <StatCard title="Pendientes" value={stats.pending} percentage="" subtitle="Por iniciar" icon={<CalendarIcon className="w-6 h-6"/>} onClick={() => navigate('/jobs')}/>
        <StatCard title="Pendientes de Pago" value={stats.completedNotPaid} percentage="-8%" subtitle="Requieren atención" icon={<DocumentTextIcon className="w-6 h-6"/>} onClick={() => navigate('/jobs')}/>
        <StatCard title="Ingresos (7d)" value={CURRENCY_FORMATTER.format(stats.weeklyIncome)} percentage="+23%" subtitle="Últimos 7 días" icon={<CurrencyDollarIcon className="w-6 h-6"/>} onClick={() => navigate('/finances')} />
      </div>

      {lowStockItems.length > 0 && (
        <div 
            className="bg-[var(--color-secondary-bg)] p-4 rounded-2xl border border-[var(--color-warning)] cursor-pointer hover:bg-[var(--color-warning)]/10"
            onClick={() => navigate('/inventory/materials')}
        >
            <div className="flex items-center gap-3">
                <BellAlertIcon className="w-6 h-6 text-[var(--color-warning)] flex-shrink-0"/>
                <div>
                  <h3 className="text-md font-bold text-[var(--color-warning)]">Alerta de Inventario</h3>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                      {lowStockItems.length} materiales están por debajo del stock mínimo.
                  </p>
                </div>
            </div>
        </div>
      )}

      <div id="job-summary">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Trabajos Activos Recientes</h2>
          <Button onClick={() => navigate('/new-job')} variant="primary" shape="rounded" size="sm" leftIcon={<PlusIcon className="w-4 h-4"/>}>
            Nuevo Trabajo
          </Button>
        </div>
        
        {filteredJobs.length > 0 ? (
          <div className="space-y-4"> 
            {filteredJobs.slice(0, 3).map(job => ( 
              <JobListItem 
                key={job.id} 
                job={job} 
                onViewDetails={handleViewJobDetails}
                onQuote={(jobId) => navigate(`/quotes/new/${jobId}`)}
                onDelete={requestDeleteJob}
              />
            ))}
             {filteredJobs.length > 3 && (
                <Button variant="secondary" shape="rounded" fullWidth onClick={() => navigate('/jobs')} className="mt-4">
                    Ver Todos los Trabajos ({filteredJobs.length})
                </Button>
            )}
          </div>
        ) : (
          <p className="text-center text-[var(--color-text-secondary)] py-8">No hay trabajos activos o pendientes.</p>
        )}
      </div>
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

// Mock calendar icon for StatCard
const CalendarIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0h18" />
    </svg>
);


export default DashboardPage;