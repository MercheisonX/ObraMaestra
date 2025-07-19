


import React, { useState, useEffect, useMemo } from 'react';
import Modal from '../ui/Modal';
import { Employee, Job, Payment, PaymentMethod } from '../../types';
import Button from '../ui/Button';
import { CURRENCY_FORMATTER, PAYMENT_METHOD_OPTIONS } from '../../constants';
import ProgressBar from '../ProgressBar';
import Input from '../ui/Input';
import Select from '../ui/Select';
import AlertModal from './AlertModal';
import { getJobs, updateJob, generateId } from '../../utils/localStorageManager';
import PlusCircleIcon from '../icons/PlusCircleIcon';

interface EmployeeDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee;
  onEdit: (employee: Employee) => void;
  jobs: Job[];
  onDataRefresh: () => void;
}

const EmployeeDetailModal: React.FC<EmployeeDetailModalProps> = ({ isOpen, onClose, employee, onEdit, jobs, onDataRefresh }) => {
  const [employeeJobs, setEmployeeJobs] = useState<Job[]>([]);
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [newPayment, setNewPayment] = useState<{ amount: string; method: PaymentMethod; notes: string }>({ amount: '', method: 'Efectivo', notes: '' });
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      const filteredJobs = jobs.filter(job => 
        job.assignedEmployees.some(emp => emp.employeeId === employee.id)
      ).sort((a,b) => new Date(b.startDateProposed).getTime() - new Date(a.startDateProposed).getTime());
      setEmployeeJobs(filteredJobs);
      setExpandedJobId(null); // Collapse all on open
    }
  }, [isOpen, jobs, employee]);
  
  const handleAddPayment = (jobId: string) => {
    const amount = Number(newPayment.amount);
    if (!amount || amount <= 0) {
      setAlertMessage("El monto del pago debe ser mayor a cero.");
      setIsAlertOpen(true);
      return;
    }
    
    const allCurrentJobs = getJobs();
    const jobToUpdate = allCurrentJobs.find(j => j.id === jobId);
    if (!jobToUpdate) return;
    
    const employeeInJobIndex = jobToUpdate.assignedEmployees.findIndex(e => e.employeeId === employee.id);
    if (employeeInJobIndex === -1) return;

    const jobEmployee = jobToUpdate.assignedEmployees[employeeInJobIndex];
    const totalToPay = jobEmployee.dailySalary * jobEmployee.estimatedWorkdays;
    const alreadyPaid = (jobEmployee.payments || []).reduce((sum, p) => sum + p.amount, 0);

    if (amount > (totalToPay - alreadyPaid)) {
       setAlertMessage("El monto del pago no puede exceder el saldo pendiente.");
       setIsAlertOpen(true);
       return;
    }

    const paymentRecord: Payment = {
        id: generateId('payment-'),
        amount: amount,
        method: newPayment.method,
        notes: newPayment.notes,
        date: new Date().toISOString(),
    };

    const updatedPayments = [...(jobEmployee.payments || []), paymentRecord];
    jobToUpdate.assignedEmployees[employeeInJobIndex] = { ...jobEmployee, payments: updatedPayments };

    updateJob(jobToUpdate);
    onDataRefresh();
    setNewPayment({ amount: '', method: 'Efectivo', notes: '' }); // Reset form
  };


  if (!isOpen) return null;

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title={`Detalles de Empleado`} size="lg">
        <div className="space-y-4 text-[var(--color-text-secondary)]">
          <div className="flex flex-col items-center -mt-2 mb-4">
              <img 
                  src={employee.photoUrl || `https://ui-avatars.com/api/?name=${employee.name.replace(/\s+/g, '+')}&background=075985&color=fff&size=96&font-size=0.4&bold=true`} 
                  alt={employee.name} 
                  className="w-24 h-24 rounded-full object-cover border-2 border-[var(--color-aquamarine)] shadow-lg"
              />
              <h3 className="text-xl font-bold text-white mt-3">{employee.name}</h3>
              <p className="text-md text-[var(--color-text-secondary)] -mt-1">{employee.specialty}</p>
          </div>
          
          <div className="space-y-2">
              <div><h4 className="font-semibold text-[var(--color-text-primary)] text-sm">Salario Diario:</h4><p>{CURRENCY_FORMATTER.format(employee.dailySalary)}</p></div>
              {employee.cedula && <div><h4 className="font-semibold text-[var(--color-text-primary)] text-sm">Cédula:</h4><p>{employee.cedula}</p></div>}
              {employee.phone && <div><h4 className="font-semibold text-[var(--color-text-primary)] text-sm">Teléfono:</h4><p>{employee.phone}</p></div>}
              {employee.email && <div><h4 className="font-semibold text-[var(--color-text-primary)] text-sm">Correo Electrónico:</h4><p className="break-all">{employee.email}</p></div>}
              {employee.address && <div><h4 className="font-semibold text-[var(--color-text-primary)] text-sm">Dirección:</h4><p>{employee.address}</p></div>}
              {employee.notes && <div><h4 className="font-semibold text-[var(--color-text-primary)] text-sm">Notas:</h4><p className="whitespace-pre-wrap bg-[var(--color-surface-2)] p-2 rounded-md text-sm">{employee.notes}</p></div>}
          </div>

          <div className="pt-4 border-t border-[var(--color-glass-border)]">
              <h4 className="font-semibold text-[var(--color-text-primary)] mb-2">Historial de Pagos por Trabajo ({employeeJobs.length})</h4>
              <div className="max-h-72 overflow-y-auto space-y-2 pr-2 styled-scrollbar">
                {employeeJobs.length > 0 ? employeeJobs.map(job => {
                  const jobEmployee = job.assignedEmployees.find(e => e.employeeId === employee.id);
                  if (!jobEmployee) return null;

                  const totalToPay = jobEmployee.dailySalary * jobEmployee.estimatedWorkdays;
                  const totalPaid = (jobEmployee.payments || []).reduce((sum, p) => sum + p.amount, 0);
                  const balance = totalToPay - totalPaid;
                  const paymentProgress = totalToPay > 0 ? (totalPaid / totalToPay) * 100 : 0;
                  
                  return (
                    <div key={job.id} className="glass-panel p-3 rounded-lg">
                      <div 
                        className="cursor-pointer"
                        onClick={() => setExpandedJobId(prev => prev === job.id ? null : job.id)}
                      >
                        <div className="flex justify-between items-center">
                          <p className="font-medium text-[var(--color-text-primary)] truncate">{job.name}</p>
                          <span className={`text-xs font-bold ${balance > 0 ? 'text-yellow-400' : 'text-green-400'}`}>
                            {balance > 0 ? 'Pendiente' : 'Pagado'}
                          </span>
                        </div>
                        <div className="text-xs text-[var(--color-text-secondary)] mt-1">
                          Pagado: {CURRENCY_FORMATTER.format(totalPaid)} de {CURRENCY_FORMATTER.format(totalToPay)}
                        </div>
                        <ProgressBar progress={paymentProgress} heightClass="h-1.5 mt-1.5"/>
                      </div>

                      {expandedJobId === job.id && (
                        <div className="mt-4 pt-3 border-t border-[var(--color-glass-border)] animate-fadeIn">
                          {balance > 0 && (
                            <div className="mb-4">
                              <h5 className="text-sm font-semibold text-[var(--color-text-primary)] mb-2">Registrar Nuevo Pago</h5>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                                <Input label="Monto a Pagar" type="number" placeholder={CURRENCY_FORMATTER.format(balance)} value={newPayment.amount} onChange={(e) => setNewPayment(p => ({...p, amount: e.target.value}))} />
                                <Select label="Método de Pago" options={PAYMENT_METHOD_OPTIONS} value={newPayment.method} onChange={e => setNewPayment(p => ({...p, method: e.target.value as PaymentMethod}))}/>
                              </div>
                              <Button onClick={() => handleAddPayment(job.id)} fullWidth className="mt-3" size="sm" leftIcon={<PlusCircleIcon className="w-4 h-4"/>}>
                                Añadir Pago
                              </Button>
                            </div>
                          )}

                          <h5 className="text-sm font-semibold text-[var(--color-text-primary)] mb-2">Historial de Pagos del Trabajo</h5>
                          {(jobEmployee.payments && jobEmployee.payments.length > 0) ? (
                            <ul className="space-y-1 text-xs">
                              {jobEmployee.payments.slice().reverse().map(p => (
                                <li key={p.id} className="flex justify-between items-center bg-[var(--color-surface-3)] p-1.5 rounded-md">
                                  <span>{new Date(p.date).toLocaleDateString('es-CO')} - {p.method}</span>
                                  <span className="font-semibold text-green-300">{CURRENCY_FORMATTER.format(p.amount)}</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-xs text-[var(--color-text-secondary)] text-center">No se han registrado pagos para este trabajo.</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                }) : <p className="text-sm text-center">Este empleado no tiene trabajos asignados.</p>}
              </div>
          </div>


          <div className="flex justify-end pt-4 space-x-3">
            <Button onClick={() => onEdit(employee)} variant="secondary">Editar Empleado</Button>
            <Button onClick={onClose} variant="primary">Cerrar</Button>
          </div>
        </div>
      </Modal>
      <AlertModal
        isOpen={isAlertOpen}
        onClose={() => setIsAlertOpen(false)}
        title="Validación de Pago"
        message={alertMessage}
      />
    </>
  );
};

export default EmployeeDetailModal;