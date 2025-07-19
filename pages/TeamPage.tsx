
import React, { useState, useEffect, useMemo } from 'react';
import { Employee } from '../types';
import Input from '../components/ui/Input';
import MagnifyingGlassIcon from '../components/icons/MagnifyingGlassIcon';
import Button from '../components/ui/Button';
import PlusCircleIcon from '../components/icons/PlusCircleIcon';
import PencilIcon from '../components/icons/PencilIcon';
import TrashIcon from '../components/icons/TrashIcon';
import { getEmployees, addEmployee, updateEmployee, deleteEmployee as deleteEmployeeFromStorage, generateId } from '../utils/localStorageManager';
import EmployeeFormModal from '../components/modals/EmployeeFormModal';
import ConfirmModal from '../components/modals/ConfirmModal';
import { ITEMS_PER_LOAD, CURRENCY_FORMATTER } from '../constants';

const TeamPage: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [visibleEmployeesCount, setVisibleEmployeesCount] = useState(ITEMS_PER_LOAD);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  const [employeeToDeleteId, setEmployeeToDeleteId] = useState<string | null>(null);
  const [isConfirmDeleteModalOpen, setIsConfirmDeleteModalOpen] = useState(false);

  const fetchEmployees = () => {
    setEmployees(getEmployees());
  }

  useEffect(() => {
    fetchEmployees();
  }, []);

  const filteredEmployees = useMemo(() => {
    return employees.filter(employee =>
      employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.specialty.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (employee.cedula && employee.cedula.includes(searchTerm)) ||
      (employee.phone && employee.phone.includes(searchTerm)) ||
      (employee.email && employee.email.toLowerCase().includes(searchTerm.toLowerCase()))
    ).sort((a, b) => a.name.localeCompare(b.name));
  }, [employees, searchTerm]);

  const employeesToDisplay = React.useMemo(() => {
    return filteredEmployees.slice(0, visibleEmployeesCount);
  }, [filteredEmployees, visibleEmployeesCount]);

  const handleLoadMoreEmployees = () => {
    setVisibleEmployeesCount(prevCount => prevCount + ITEMS_PER_LOAD);
  };

  const handleOpenFormModal = (employee: Employee | null = null) => {
    setEditingEmployee(employee);
    setIsFormModalOpen(true);
  };

  const handleCloseFormModal = () => {
    setIsFormModalOpen(false);
    setEditingEmployee(null);
  };

  const handleSaveEmployee = (employeeData: Employee) => {
    if ('id' in employeeData && employeeData.id) { 
      updateEmployee(employeeData as Employee);
    } else { 
      addEmployee({ ...employeeData, id: generateId('emp-') } as Employee);
    }
    fetchEmployees();
    setVisibleEmployeesCount(ITEMS_PER_LOAD);
    handleCloseFormModal();
  };

  const requestDeleteEmployee = (employeeId: string) => {
    setEmployeeToDeleteId(employeeId);
    setIsConfirmDeleteModalOpen(true);
  };

  const confirmDeleteEmployee = () => {
    if (employeeToDeleteId) {
      deleteEmployeeFromStorage(employeeToDeleteId);
      fetchEmployees();
      setEmployeeToDeleteId(null);
      setIsConfirmDeleteModalOpen(false);
    }
  };

  return (
    <div className="p-4 space-y-6">
      <div 
        className="sticky top-0 glass-bar py-4 z-20 border-b pb-3"
        style={{borderColor: 'var(--color-glass-border)'}}
      > 
        <div className="flex justify-between items-center mb-4 px-4">
          <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">Mi Equipo</h2>
          <Button size="md" leftIcon={<PlusCircleIcon className="w-5 h-5"/>} onClick={() => handleOpenFormModal()}>
              Añadir Empleado
          </Button>
        </div>
        <div className="px-4">
            <Input
            placeholder="Buscar por nombre, especialidad, cédula..."
            value={searchTerm}
            onChange={e => {
              setSearchTerm(e.target.value);
              setVisibleEmployeesCount(ITEMS_PER_LOAD); // Reset on search
            }}
            leadingIcon={<MagnifyingGlassIcon />}
            />
        </div>
      </div>
      
      {employeesToDisplay.length > 0 ? (
        <div className="space-y-4 pt-2">
          {employeesToDisplay.map(emp => (
            <div key={emp.id} className="glass-panel p-4 rounded-xl shadow-lg transition-all duration-200 border-l-4 border-transparent hover:border-[var(--color-aquamarine)] group hover:shadow-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-grow overflow-hidden">
                    <img 
                        src={emp.photoUrl || `https://ui-avatars.com/api/?name=${emp.name.replace(/\s+/g, '+')}&background=0D47A1&color=fff&size=48&font-size=0.4&bold=true`} 
                        alt={emp.name} 
                        className="w-12 h-12 rounded-full object-cover flex-shrink-0 border-2 border-[var(--color-surface-3)]"
                    />
                    <div className="flex-grow">
                        <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-0.5 truncate" title={emp.name}>{emp.name}</h3>
                        <p className="text-sm text-[var(--color-text-secondary)]">{emp.specialty}</p>
                        <p className="text-xs text-[var(--color-aquamarine)] font-medium">Salario Diario: {CURRENCY_FORMATTER.format(emp.dailySalary)}</p>
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-1 flex-shrink-0 ml-2">
                  <Button variant="ghost" size="sm" onClick={() => handleOpenFormModal(emp)} aria-label="Editar empleado" className="p-2">
                    <PencilIcon className="w-5 h-5"/>
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => requestDeleteEmployee(emp.id)} aria-label="Eliminar empleado" className="p-2">
                    <TrashIcon className="w-5 h-5"/>
                  </Button>
                </div>
              </div>
            </div>
          ))}
          {visibleEmployeesCount < filteredEmployees.length && (
            <Button
              variant="outline"
              fullWidth
              onClick={handleLoadMoreEmployees}
              className="mt-6"
            >
              Cargar Más Empleados ({filteredEmployees.length - visibleEmployeesCount} restantes)
            </Button>
          )}
        </div>
      ) : (
        <p className="text-[var(--color-text-secondary)] text-center py-8">No se encontraron empleados. Intente con otra búsqueda o añada nuevos.</p>
      )}

      {isFormModalOpen && (
        <EmployeeFormModal
          isOpen={isFormModalOpen}
          onClose={handleCloseFormModal}
          onEmployeeSaved={handleSaveEmployee}
          employee={editingEmployee}
        />
      )}
      <ConfirmModal
        isOpen={isConfirmDeleteModalOpen}
        onClose={() => setIsConfirmDeleteModalOpen(false)}
        onConfirm={confirmDeleteEmployee}
        title="Confirmar Eliminación"
        message="¿Está seguro de que desea eliminar este empleado? Esta acción no se puede deshacer."
      />
    </div>
  );
};

export default TeamPage;