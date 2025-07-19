

import React from 'react';
import Modal from '../ui/Modal';
import { Client, Job, JobStatus } from '../../types';
import Button from '../ui/Button';
import { CURRENCY_FORMATTER } from '../../constants';

interface ClientDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client;
  jobs: Job[];
  onEdit: (client: Client) => void;
}

const ClientDetailModal: React.FC<ClientDetailModalProps> = ({ isOpen, onClose, client, jobs, onEdit }) => {
  if (!isOpen) return null;

  const clientJobs = jobs.filter(j => j.clientId === client.id).sort((a,b) => new Date(b.startDateProposed).getTime() - new Date(a.startDateProposed).getTime());

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Detalles de Cliente`} size="lg">
      <div className="space-y-4 text-[var(--color-text-secondary)]">
        <div className="flex flex-col items-center -mt-2 mb-4">
            <img 
                src={client.photoUrl || `https://ui-avatars.com/api/?name=${client.name.replace(/\s+/g, '+')}&background=115E59&color=fff&size=96&font-size=0.4&bold=true`} 
                alt={client.name} 
                className="w-24 h-24 rounded-full object-cover border-2 border-[var(--color-aquamarine)] shadow-lg"
            />
            <h3 className="text-xl font-bold text-white mt-3">{client.name}</h3>
        </div>

        <div className="space-y-2">
            {client.contact && (
            <div>
                <h4 className="font-semibold text-[var(--color-text-primary)] text-sm">ID/NIT/Contacto:</h4>
                <p>{client.contact}</p>
            </div>
            )}
            {client.address && (
            <div>
                <h4 className="font-semibold text-[var(--color-text-primary)] text-sm">Dirección:</h4>
                <p>{client.address}</p>
            </div>
            )}
            {client.phone && (
            <div>
                <h4 className="font-semibold text-[var(--color-text-primary)] text-sm">Teléfono:</h4>
                <p>{client.phone}</p>
            </div>
            )}
            {client.email && (
            <div>
                <h4 className="font-semibold text-[var(--color-text-primary)] text-sm">Correo Electrónico:</h4>
                <p className="break-all">{client.email}</p>
            </div>
            )}
            {client.notes && (
            <div>
                <h4 className="font-semibold text-[var(--color-text-primary)] text-sm">Notas:</h4>
                <p className="whitespace-pre-wrap bg-[var(--color-surface-2)] p-2 rounded-md text-sm">{client.notes}</p>
            </div>
            )}
        </div>
        
        <div className="pt-4 border-t border-[var(--color-glass-border)]">
            <h4 className="font-semibold text-[var(--color-text-primary)] mb-2">Historial de Trabajos ({clientJobs.length})</h4>
            {clientJobs.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto styled-scrollbar pr-1">
                    {clientJobs.map(job => (
                        <div key={job.id} className="p-2.5 bg-[var(--color-surface-2)] rounded-lg">
                            <div className="flex justify-between items-center">
                                <p className="text-sm font-medium text-[var(--color-text-primary)]">{job.name}</p>
                                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                                    job.status === JobStatus.Completed || job.status === JobStatus.Paid 
                                    ? 'bg-green-500/20 text-green-300' 
                                    : job.status === JobStatus.InProgress
                                    ? 'bg-blue-500/20 text-blue-300'
                                    : 'bg-yellow-500/20 text-yellow-300'
                                }`}>{job.status}</span>
                            </div>
                            <p className="text-xs text-[var(--color-aquamarine)] mt-1 font-semibold">{CURRENCY_FORMATTER.format(job.finalPrice || 0)}</p>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-sm text-[var(--color-text-secondary)]">No hay trabajos asociados a este cliente.</p>
            )}
        </div>

        <div className="flex justify-end pt-4 space-x-3">
            <Button onClick={() => onEdit(client)} variant="secondary">Editar</Button>
            <Button onClick={onClose} variant="primary">Cerrar</Button>
        </div>
      </div>
    </Modal>
  );
};

export default ClientDetailModal;