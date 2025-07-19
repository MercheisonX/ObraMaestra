

import React, { useState, useEffect } from 'react';
import { Client, Job, JobStatus } from '../types';
import Input from '../components/ui/Input';
import MagnifyingGlassIcon from '../components/icons/MagnifyingGlassIcon';
import Button from '../components/ui/Button';
import PlusCircleIcon from '../components/icons/PlusCircleIcon';
import PencilIcon from '../components/icons/PencilIcon';
import TrashIcon from '../components/icons/TrashIcon';
import EyeIcon from '../components/icons/EyeIcon';
import { getClients, addClient, updateClient, deleteClient as deleteClientFromStorage, generateId, getJobs } from '../utils/localStorageManager';
import ClientFormModal from '../components/modals/ClientFormModal';
import ClientDetailModal from '../components/modals/ClientDetailModal';
import ConfirmModal from '../components/modals/ConfirmModal';
import { ITEMS_PER_LOAD } from '../constants';

const ClientsPage: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [visibleClientsCount, setVisibleClientsCount] = useState(ITEMS_PER_LOAD);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [viewingClient, setViewingClient] = useState<Client | null>(null);

  const [clientToDeleteId, setClientToDeleteId] = useState<string | null>(null);
  const [isConfirmDeleteModalOpen, setIsConfirmDeleteModalOpen] = useState(false);

  const fetchData = () => {
    setClients(getClients());
    setJobs(getJobs());
  }

  useEffect(() => {
    fetchData();
  }, []);

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (client.address && client.address.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (client.contact && client.contact.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (client.email && client.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (client.phone && client.phone.toLowerCase().includes(searchTerm.toLowerCase()))
  ).sort((a, b) => a.name.localeCompare(b.name));

  const clientsToDisplay = React.useMemo(() => {
    return filteredClients.slice(0, visibleClientsCount);
  }, [filteredClients, visibleClientsCount]);

  const handleLoadMoreClients = () => {
    setVisibleClientsCount(prevCount => prevCount + ITEMS_PER_LOAD);
  };

  const handleOpenFormModal = (client: Client | null = null) => {
    setEditingClient(client);
    setIsFormModalOpen(true);
  };

  const handleCloseFormModal = () => {
    setIsFormModalOpen(false);
    setEditingClient(null);
  };

  const handleSaveClient = (clientData: Omit<Client, 'id'> | Client) => {
    if ('id' in clientData && clientData.id) { 
      updateClient(clientData as Client);
    } else { 
      addClient({ ...clientData, id: generateId('client-') } as Client);
    }
    fetchData();
    setVisibleClientsCount(ITEMS_PER_LOAD); // Reset visible count to show the new/updated client at the top if sort order changes.
    handleCloseFormModal();
  };

  const requestDeleteClient = (clientId: string) => {
    setClientToDeleteId(clientId);
    setIsConfirmDeleteModalOpen(true);
  };

  const confirmDeleteClient = () => {
    if (clientToDeleteId) {
      deleteClientFromStorage(clientToDeleteId);
      fetchData();
      setClientToDeleteId(null);
      setIsConfirmDeleteModalOpen(false);
    }
  };

  const handleOpenDetailModal = (client: Client) => {
    setViewingClient(client);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setViewingClient(null);
  };

  return (
    <div className="p-4 space-y-6">
      <div 
        className="sticky top-0 glass-bar py-4 z-20 border-b pb-3"
        style={{borderColor: 'var(--color-glass-border)'}}
      > 
        <div className="flex justify-between items-center mb-4 px-4">
          <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">Gestión de Clientes</h2>
          <Button size="md" leftIcon={<PlusCircleIcon className="w-5 h-5"/>} onClick={() => handleOpenFormModal()}>
              Añadir Cliente
          </Button>
        </div>
        <div className="px-4">
            <Input
            placeholder="Buscar cliente..."
            value={searchTerm}
            onChange={e => {
              setSearchTerm(e.target.value);
              setVisibleClientsCount(ITEMS_PER_LOAD); // Reset on search
            }}
            leadingIcon={<MagnifyingGlassIcon />}
            />
        </div>
      </div>
      

      {clientsToDisplay.length > 0 ? (
        <div className="space-y-4 pt-2">
          {clientsToDisplay.map(client => {
            const clientJobs = jobs.filter(j => j.clientId === client.id);
            const activeJobsCount = clientJobs.filter(j => j.status === JobStatus.InProgress || j.status === JobStatus.Pending).length;
            
            return (
                <div key={client.id} className="glass-panel p-4 rounded-xl shadow-lg transition-all duration-200 border-l-4 border-transparent hover:border-[var(--color-aquamarine)] group hover:shadow-2xl">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-grow overflow-hidden w-full">
                        <img 
                            src={`https://ui-avatars.com/api/?name=${client.name.replace(/\s+/g, '+')}&background=115E59&color=fff&size=48&font-size=0.4&bold=true`} 
                            alt={client.name} 
                            className="w-12 h-12 rounded-full object-cover flex-shrink-0 border-2 border-[var(--color-surface-3)]"
                        />
                        <div className="overflow-hidden flex-grow">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-bold text-[var(--color-text-primary)] truncate" title={client.name}>{client.name}</h3>
                                {activeJobsCount > 0 && (
                                <span className="flex-shrink-0 ml-2 text-xs bg-[var(--color-aquamarine)] text-black font-bold py-0.5 px-2 rounded-full">
                                    {activeJobsCount} activo{activeJobsCount > 1 ? 's' : ''}
                                </span>
                                )}
                            </div>
                            {client.address && <p className="text-sm text-[var(--color-text-secondary)] truncate">{client.address}</p>}
                            {clientJobs.length > 0 && 
                                <p className="text-xs font-medium text-[var(--color-text-secondary)] mt-1">
                                    {clientJobs.length} trabajo{clientJobs.length > 1 ? 's' : ''} registrado{clientJobs.length > 1 ? 's' : ''}
                                </p>
                            }
                        </div>
                    </div>

                    <div className="flex space-x-1 flex-shrink-0 self-end sm:self-center">
                        <Button variant="ghost" size="sm" onClick={() => handleOpenDetailModal(client)} aria-label="Ver detalles" className="p-2">
                            <EyeIcon className="w-5 h-5"/>
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleOpenFormModal(client)} aria-label="Editar cliente" className="p-2">
                            <PencilIcon className="w-5 h-5"/>
                        </Button>
                        <Button variant="danger" size="sm" onClick={() => requestDeleteClient(client.id)} aria-label="Eliminar cliente" className="p-2">
                            <TrashIcon className="w-5 h-5"/>
                        </Button>
                    </div>
                </div>
                </div>
            )
          })}
          {visibleClientsCount < filteredClients.length && (
            <Button
              variant="outline"
              fullWidth
              onClick={handleLoadMoreClients}
              className="mt-6"
            >
              Cargar Más Clientes ({filteredClients.length - visibleClientsCount} restantes)
            </Button>
          )}
        </div>
      ) : (
        <p className="text-[var(--color-text-secondary)] text-center py-8">No se encontraron clientes. Intente con otra búsqueda o añada nuevos clientes.</p>
      )}

      {isFormModalOpen && (
        <ClientFormModal
          isOpen={isFormModalOpen}
          onClose={handleCloseFormModal}
          onSave={handleSaveClient}
          client={editingClient}
        />
      )}

      {isDetailModalOpen && viewingClient && (
        <ClientDetailModal
          isOpen={isDetailModalOpen}
          onClose={handleCloseDetailModal}
          client={viewingClient}
          jobs={jobs}
          onEdit={(client) => {
            handleCloseDetailModal();
            handleOpenFormModal(client);
          }}
        />
      )}
      <ConfirmModal
        isOpen={isConfirmDeleteModalOpen}
        onClose={() => setIsConfirmDeleteModalOpen(false)}
        onConfirm={confirmDeleteClient}
        title="Confirmar Eliminación"
        message="¿Está seguro de que desea eliminar este cliente? Esta acción no se puede deshacer. Los trabajos asociados a este cliente no serán eliminados pero podrían quedar sin referencia de cliente válida."
      />
    </div>
  );
};

export default ClientsPage;