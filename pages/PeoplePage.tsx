
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Client, Employee, Job } from '../types';
import Input from '../components/ui/Input';
import MagnifyingGlassIcon from '../components/icons/MagnifyingGlassIcon';
import Button from '../components/ui/Button';
import PlusIcon from '../components/icons/PlusIcon';
import PencilIcon from '../components/icons/PencilIcon';
import TrashIcon from '../components/icons/TrashIcon';
import { 
  getClients, addClient, updateClient, deleteClient as deleteClientFromStorage, 
  getEmployees, addEmployee, updateEmployee, deleteEmployee as deleteEmployeeFromStorage,
  getJobs,
  generateId 
} from '../utils/localStorageManager';
import ClientFormModal from '../components/modals/ClientFormModal';
import EmployeeFormModal from '../components/modals/EmployeeFormModal';
import ClientDetailModal from '../components/modals/ClientDetailModal';
import EmployeeDetailModal from '../components/modals/EmployeeDetailModal';
import ConfirmModal from '../components/modals/ConfirmModal';
import { ITEMS_PER_LOAD, CURRENCY_FORMATTER } from '../constants';
import InitialsAvatar from '../components/ui/InitialsAvatar';
import { useHeaderVisibility } from '../App';

type ActiveTab = 'clients' | 'team';

const PeoplePage: React.FC = () => {
    const navigate = useNavigate();
    const { isHeaderVisible } = useHeaderVisibility();
    const { tab: activeTabFromParams } = useParams<{ tab?: ActiveTab }>();
    const [activeTab, setActiveTab] = useState<ActiveTab>('clients');

    // State
    const [clients, setClients] = useState<Client[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [jobs, setJobs] = useState<Job[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [visibleClientsCount, setVisibleClientsCount] = useState(ITEMS_PER_LOAD);
    const [visibleEmployeesCount, setVisibleEmployeesCount] = useState(ITEMS_PER_LOAD);

    // Modal State
    const [isClientFormModalOpen, setIsClientFormModalOpen] = useState(false);
    const [editingClient, setEditingClient] = useState<Client | null>(null);
    const [isEmployeeFormModalOpen, setIsEmployeeFormModalOpen] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
    const [isClientDetailModalOpen, setIsClientDetailModalOpen] = useState(false);
    const [viewingClient, setViewingClient] = useState<Client | null>(null);
    const [isEmployeeDetailModalOpen, setIsEmployeeDetailModalOpen] = useState(false);
    const [viewingEmployee, setViewingEmployee] = useState<Employee | null>(null);
    const [itemToDelete, setItemToDelete] = useState<{ id: string; type: ActiveTab } | null>(null);
    const [isConfirmDeleteModalOpen, setIsConfirmDeleteModalOpen] = useState(false);
    
    const fetchData = () => {
        setClients(getClients());
        setEmployees(getEmployees());
        setJobs(getJobs());
    }

    useEffect(() => {
        fetchData();
        const handleFocus = () => fetchData();
        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, []);

    useEffect(() => {
        if (activeTabFromParams && ['clients', 'team'].includes(activeTabFromParams)) {
            setActiveTab(activeTabFromParams);
        } else {
            setActiveTab('clients'); // Default tab
        }
    }, [activeTabFromParams]);

    const handleTabChange = (tab: ActiveTab) => {
        setActiveTab(tab);
        setSearchTerm('');
        navigate(`/people/${tab}`);
    };

    // Filtering and Slicing Logic
    const filteredClients = useMemo(() => clients.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (client.address && client.address.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (client.contact && client.contact.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (client.email && client.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (client.phone && client.phone.toLowerCase().includes(searchTerm.toLowerCase()))
      ).sort((a, b) => a.name.localeCompare(b.name)), [clients, searchTerm]);

    const clientsToDisplay = useMemo(() => filteredClients.slice(0, visibleClientsCount), [filteredClients, visibleClientsCount]);

    const filteredEmployees = useMemo(() => employees.filter(employee =>
        employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.specialty.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (employee.cedula && employee.cedula.includes(searchTerm)) ||
        (employee.phone && employee.phone.includes(searchTerm))
      ).sort((a, b) => a.name.localeCompare(b.name)), [employees, searchTerm]);
      
    const employeesToDisplay = useMemo(() => filteredEmployees.slice(0, visibleEmployeesCount), [filteredEmployees, visibleEmployeesCount]);

    const handleLoadMore = () => {
        if (activeTab === 'clients') setVisibleClientsCount(prev => prev + ITEMS_PER_LOAD);
        else setVisibleEmployeesCount(prev => prev + ITEMS_PER_LOAD);
    };

    // Client Handlers
    const handleOpenClientForm = (client: Client | null = null) => { setEditingClient(client); setIsClientFormModalOpen(true); };
    const handleCloseClientForm = () => { setIsClientFormModalOpen(false); setEditingClient(null); };
    const handleOpenClientDetail = (client: Client) => { setViewingClient(client); setIsClientDetailModalOpen(true); };
    const handleCloseClientDetail = () => { setIsClientDetailModalOpen(false); setViewingClient(null); };
    const handleSaveClient = (clientData: Omit<Client, 'id'> | Client) => {
        if ('id' in clientData && clientData.id) updateClient(clientData as Client);
        else addClient({ ...clientData, id: generateId('client-') } as Client);
        fetchData();
        handleCloseClientForm();
    };

    // Employee Handlers
    const handleOpenEmployeeForm = (employee: Employee | null = null) => { setEditingEmployee(employee); setIsEmployeeFormModalOpen(true); };
    const handleCloseEmployeeForm = () => { setIsEmployeeFormModalOpen(false); setEditingEmployee(null); };
    const handleOpenEmployeeDetail = (employee: Employee) => { setViewingEmployee(employee); setIsEmployeeDetailModalOpen(true); };
    const handleCloseEmployeeDetail = () => { setIsEmployeeDetailModalOpen(false); setViewingEmployee(null); };
    const handleSaveEmployee = (employeeData: Employee) => {
        if (employeeData.id) updateEmployee(employeeData);
        else addEmployee({ ...employeeData, id: generateId('emp-') });
        fetchData();
        handleCloseEmployeeForm();
    };

    // Delete Handlers
    const requestDelete = (id: string, type: ActiveTab) => { setItemToDelete({ id, type }); setIsConfirmDeleteModalOpen(true); };
    const confirmDelete = () => {
        if (itemToDelete) {
            if (itemToDelete.type === 'clients') deleteClientFromStorage(itemToDelete.id);
            else deleteEmployeeFromStorage(itemToDelete.id);
            fetchData();
        }
        setIsConfirmDeleteModalOpen(false);
        setItemToDelete(null);
    };

    const tabConfig = {
        clients: { title: "Clientes", count: filteredClients.length, visibleCount: visibleClientsCount, data: clientsToDisplay },
        team: { title: "Equipo", count: filteredEmployees.length, visibleCount: visibleEmployeesCount, data: employeesToDisplay },
    };

    return (
        <div className="px-6 pb-24 space-y-6">
            <div 
                className="sticky top-0 bg-[var(--color-primary-app)]/80 backdrop-blur-sm z-30 -mx-6 px-6 transition-transform duration-300"
                style={{
                    transform: isHeaderVisible ? 'translateY(0)' : 'translateY(calc(-1 * 6rem))'
                }}
            >
                <div className="flex justify-between items-center mb-4 pt-4">
                    <h2 className="text-2xl font-bold text-white">Todos los Contactos</h2>
                    <Button 
                        size="sm" 
                        shape="pill"
                        leftIcon={<PlusIcon className="w-4 h-4"/>} 
                        onClick={() => activeTab === 'clients' ? handleOpenClientForm() : handleOpenEmployeeForm()}
                        className="bg-gradient-to-r from-cyan-400 to-blue-500 text-white font-bold"
                    >
                        Añadir {activeTab === 'clients' ? 'Cliente' : 'Empleado'}
                    </Button>
                </div>
                <div className="mb-4">
                    <Input
                        placeholder={`Buscar en ${activeTab === 'clients' ? 'clientes' : 'mi equipo'}...`}
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        leadingIcon={<MagnifyingGlassIcon />}
                        className="rounded-xl !pl-11"
                    />
                </div>
                <div className="flex gap-2 pb-3 overflow-x-auto styled-scrollbar-horizontal-thin">
                    {(['clients', 'team'] as ActiveTab[]).map(tabName => (
                        <button
                            key={tabName}
                            onClick={() => handleTabChange(tabName)}
                            className={`px-4 py-1.5 rounded-full text-sm font-semibold flex-shrink-0 transition-colors ${activeTab === tabName ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-white' : 'bg-[var(--color-secondary-bg)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]'}`}
                        >
                            {tabConfig[tabName].title} ({tabConfig[tabName].count})
                        </button>
                    ))}
                </div>
            </div>

            <div className="pt-2">
                {activeTab === 'clients' ? (
                    clientsToDisplay.length > 0 ? (
                        <div className="space-y-4">
                            {clientsToDisplay.map(client => {
                                const clientJobs = jobs.filter(j => j.clientId === client.id);
                                return (
                                    <div key={client.id} className="bg-[var(--color-secondary-bg)] p-4 rounded-2xl border border-[var(--color-accent)]/30 transition-all duration-200 hover:border-[var(--color-accent)] shadow-[0_0_15px_rgba(34,211,238,0.1)]">
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-4 flex-grow overflow-hidden cursor-pointer" onClick={() => handleOpenClientDetail(client)}>
                                                {client.photoUrl ? (
                                                    <img src={client.photoUrl} alt={client.name} className="w-12 h-12 rounded-full object-cover flex-shrink-0"/>
                                                ) : (
                                                    <InitialsAvatar name={client.name} className="w-12 h-12 rounded-full text-lg flex-shrink-0"/>
                                                )}
                                                <div className="overflow-hidden flex-grow">
                                                    <h3 className="text-lg font-bold text-white truncate" title={client.name}>{client.name}</h3>
                                                    <p className="text-sm text-[var(--color-text-secondary)]">{clientJobs.length} trabajo(s) registrado(s)</p>
                                                </div>
                                            </div>
                                            <div className="flex space-x-1 flex-shrink-0">
                                                <Button variant="ghost" shape="rounded" size="sm" onClick={() => handleOpenClientForm(client)} className="p-2"><PencilIcon className="w-5 h-5"/></Button>
                                                <Button variant="danger" shape="rounded" size="sm" onClick={() => requestDelete(client.id, 'clients')} className="p-2"><TrashIcon className="w-5 h-5"/></Button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : <p className="text-[var(--color-text-secondary)] text-center py-8">No se encontraron clientes.</p>
                ) : (
                    employeesToDisplay.length > 0 ? (
                        <div className="space-y-4">
                            {employeesToDisplay.map(emp => (
                                 <div key={emp.id} className="bg-[var(--color-secondary-bg)] p-4 rounded-2xl border border-[var(--color-accent)]/30 transition-all duration-200 hover:border-[var(--color-accent)] shadow-[0_0_15px_rgba(34,211,238,0.1)]">
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-4 flex-grow overflow-hidden cursor-pointer" onClick={() => handleOpenEmployeeDetail(emp)}>
                                            {emp.photoUrl ? (
                                                <img src={emp.photoUrl} alt={emp.name} className="w-12 h-12 rounded-full object-cover flex-shrink-0"/>
                                            ) : (
                                                <InitialsAvatar name={emp.name} className="w-12 h-12 rounded-full text-lg flex-shrink-0"/>
                                            )}
                                            <div className="overflow-hidden flex-grow">
                                                <h3 className="text-lg font-bold text-white truncate">{emp.name}</h3>
                                                <p className="text-sm text-[var(--color-text-secondary)]">{emp.specialty}</p>
                                                <p className="text-xs text-[var(--color-accent)] font-medium">Salario: {CURRENCY_FORMATTER.format(emp.dailySalary)}/día</p>
                                            </div>
                                        </div>
                                        <div className="flex space-x-1 flex-shrink-0">
                                            <Button variant="ghost" shape="rounded" size="sm" onClick={() => handleOpenEmployeeForm(emp)} className="p-2"><PencilIcon className="w-5 h-5"/></Button>
                                            <Button variant="danger" shape="rounded" size="sm" onClick={() => requestDelete(emp.id, 'team')} className="p-2"><TrashIcon className="w-5 h-5"/></Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : <p className="text-[var(--color-text-secondary)] text-center py-8">No se encontraron empleados.</p>
                )}

                {((activeTab === 'clients' && visibleClientsCount < filteredClients.length) || (activeTab === 'team' && visibleEmployeesCount < filteredEmployees.length)) && (
                    <Button variant="secondary" shape="rounded" fullWidth onClick={handleLoadMore} className="mt-6">
                        Cargar Más ({activeTab === 'clients' ? filteredClients.length - visibleClientsCount : filteredEmployees.length - visibleEmployeesCount} restantes)
                    </Button>
                )}
            </div>

            {isClientFormModalOpen && <ClientFormModal isOpen={isClientFormModalOpen} onClose={handleCloseClientForm} onSave={handleSaveClient} client={editingClient}/>}
            {isEmployeeFormModalOpen && <EmployeeFormModal isOpen={isEmployeeFormModalOpen} onClose={handleCloseEmployeeForm} onEmployeeSaved={handleSaveEmployee} employee={editingEmployee}/>}
            
            {isClientDetailModalOpen && viewingClient && <ClientDetailModal isOpen={isClientDetailModalOpen} onClose={handleCloseClientDetail} client={viewingClient} jobs={jobs} onEdit={() => { handleCloseClientDetail(); handleOpenClientForm(viewingClient); }}/>}
            {isEmployeeDetailModalOpen && viewingEmployee && <EmployeeDetailModal isOpen={isEmployeeDetailModalOpen} onClose={handleCloseEmployeeDetail} employee={viewingEmployee} onEdit={() => { handleCloseEmployeeDetail(); handleOpenEmployeeForm(viewingEmployee); }} jobs={jobs} onDataRefresh={fetchData} />}

            <ConfirmModal
                isOpen={isConfirmDeleteModalOpen}
                onClose={() => setIsConfirmDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title="Confirmar Eliminación"
                message={`¿Está seguro de que desea eliminar este ${itemToDelete?.type === 'clients' ? 'cliente' : 'empleado'}? Esta acción no se puede deshacer.`}
            />
        </div>
    );
};

export default PeoplePage;