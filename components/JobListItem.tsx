
import React from 'react';
import { Job, JobStatus } from '../types';
import ProgressBar from './ProgressBar';
import { CURRENCY_FORMATTER } from '../constants';
import UsersIcon from './icons/UsersIcon';
import CurrencyDollarIcon from './icons/CurrencyDollarIcon';
import EyeIcon from './icons/EyeIcon';
import DocumentDuplicateIcon from './icons/DocumentDuplicateIcon';
import TrashIcon from './icons/TrashIcon';
import Button from './ui/Button';

const LocationMarkerIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
    </svg>
);
const CalendarIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0h18" />
    </svg>
);

interface JobListItemProps {
  job: Job;
  onViewDetails: (jobId: string) => void;
  onQuote: (jobId: string) => void;
  onDelete: (jobId: string) => void;
}

const JobListItem: React.FC<JobListItemProps> = ({ job, onViewDetails, onQuote, onDelete }) => {
    
    const getStatusStyles = (status: JobStatus) => {
        switch (status) {
            case JobStatus.InProgress:
                return 'bg-blue-500/20 text-blue-300 border border-blue-400/50';
            case JobStatus.Completed:
            case JobStatus.Paid:
                return 'bg-green-500/20 text-green-300 border border-green-400/50';
            case JobStatus.Paused:
                return 'bg-gray-500/20 text-gray-300 border border-gray-400/50';
            case JobStatus.Pending:
            default:
                return 'bg-amber-500/10 text-amber-400 border border-amber-500/50';
        }
    };
  
    const formattedDate = new Date(job.endDateEstimated).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });

    return (
        <div 
            className="bg-[var(--color-secondary-bg)] rounded-2xl p-4 border border-[var(--color-accent)]/30 space-y-4 transition-all duration-200 hover:border-[var(--color-accent)] cursor-pointer shadow-[0_0_15px_rgba(34,211,238,0.1)]"
            onClick={() => onViewDetails(job.id)}
        >
            <div className="relative">
                <div className="pr-24">
                    <h3 className="text-lg font-bold text-[var(--color-accent)] leading-tight">{job.name}</h3>
                    <p className="text-md font-semibold text-white mt-1">{job.client?.name || 'Cliente no asignado'}</p>
                    {job.client?.contact && <p className="text-sm text-[var(--color-text-secondary)]">{job.client.contact}</p>}
                </div>
                <span className={`absolute top-0 right-0 px-3 py-1 text-xs font-semibold rounded-full ${getStatusStyles(job.status)}`}>
                    {job.status}
                </span>
            </div>
            
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm pt-1">
                <div className="flex items-center gap-2 overflow-hidden">
                    <LocationMarkerIcon className="w-5 h-5 text-[var(--color-accent)] flex-shrink-0"/>
                    <span className="text-[var(--color-text-secondary)] truncate" title={job.address}>{job.address}</span>
                </div>
                <div className="flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5 text-[var(--color-accent)] flex-shrink-0"/>
                    <span className="text-[var(--color-text-secondary)]">{formattedDate}</span>
                </div>
                <div className="flex items-center gap-2">
                    <UsersIcon className="w-5 h-5 text-[var(--color-accent)] flex-shrink-0"/>
                    <span className="text-[var(--color-text-secondary)]">{job.assignedEmployees.length} persona(s)</span>
                </div>
                <div className="flex items-center gap-2">
                    <CurrencyDollarIcon className="w-5 h-5 text-[var(--color-accent)] flex-shrink-0"/>
                    <span className="text-[var(--color-text-primary)] font-semibold">{CURRENCY_FORMATTER.format(job.finalPrice || 0)}</span>
                </div>
            </div>

            <div>
                <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-[var(--color-text-secondary)] font-medium">Progreso</span>
                    <span className="font-semibold text-white">{job.progress}%</span>
                </div>
                <ProgressBar progress={job.progress} />
            </div>

            <div className="flex items-center justify-end gap-2 -mb-2 -mr-2 pt-2">
                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onQuote(job.id); }} aria-label="Duplicar o Cotizar" className="p-2">
                    <DocumentDuplicateIcon className="w-5 h-5"/>
                </Button>
                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onViewDetails(job.id); }} aria-label="Ver detalles" className="p-2">
                    <EyeIcon className="w-5 h-5"/>
                </Button>
                <Button variant="danger" size="sm" onClick={(e) => { e.stopPropagation(); onDelete(job.id); }} aria-label="Eliminar trabajo" className="p-2">
                    <TrashIcon className="w-5 h-5"/>
                </Button>
            </div>
        </div>
    );
};

export default JobListItem;