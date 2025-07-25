
import React from 'react';
import Modal from '../ui/Modal';
import { JobEmployee, Job } from '../../types';
import { CURRENCY_FORMATTER } from '../../constants';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface EmployeePaymentDetail {
  employeeName: string;
  employeeId: string;
  jobName: string;
  jobId: string;
  amountPaid: number;
  workdays: number;
  dailySalary: number;
  jobStartDate: string;
}

interface EmployeePaymentsDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  payments: EmployeePaymentDetail[];
}

const EmployeePaymentsDetailModal: React.FC<EmployeePaymentsDetailModalProps> = ({ isOpen, onClose, payments }) => {
  if (!isOpen) return null;

  const aggregatedPayments = payments.reduce((acc, payment) => {
    const existing = acc.find(p => p.employeeId === payment.employeeId);
    if (existing) {
      existing.totalPaid += payment.amountPaid;
      existing.jobs.push({ name: payment.jobName, amount: payment.amountPaid });
    } else {
      acc.push({
        employeeId: payment.employeeId,
        employeeName: payment.employeeName,
        totalPaid: payment.amountPaid,
        jobs: [{ name: payment.jobName, amount: payment.amountPaid }],
      });
    }
    return acc;
  }, [] as { employeeId: string; employeeName: string; totalPaid: number; jobs: {name: string; amount: number}[] }[])
  .sort((a, b) => b.totalPaid - a.totalPaid);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Detalle de Pago a Empleados" size="xl">
      <div className="space-y-4">
        {aggregatedPayments.length === 0 && <p className="text-[var(--color-text-secondary)]">No hay datos de pago a empleados para mostrar.</p>}
        
        {aggregatedPayments.length > 0 && (
            <div className="mb-6">
                <h4 className="text-md font-semibold text-[var(--color-text-primary)] mb-2">Pagos Totales por Empleado</h4>
                <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={aggregatedPayments} layout="vertical" margin={{ top: 5, right: 20, left: 80, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                        <XAxis type="number" tickFormatter={(value) => CURRENCY_FORMATTER.format(value)} tick={{ fill: 'var(--color-text-secondary)', fontSize: 10 }} />
                        <YAxis dataKey="employeeName" type="category" tick={{ fill: 'var(--color-text-secondary)', fontSize: 10 }} width={80} interval={0}/>
                        <Tooltip 
                            formatter={(value: number) => CURRENCY_FORMATTER.format(value)}
                            contentStyle={{ backgroundColor: 'var(--color-secondary-bg)', border: '1px solid var(--color-border)', borderRadius: '0.5rem' }}
                            labelStyle={{ color: 'var(--color-text-primary)', fontWeight: 'bold' }}
                            itemStyle={{ color: 'var(--color-text-secondary)' }}
                        />
                        <Legend wrapperStyle={{fontSize: '12px', color: 'var(--color-text-secondary)'}}/>
                        <Bar dataKey="totalPaid" name="Total Pagado" fill="var(--color-accent)" radius={[0, 4, 4, 0]} barSize={15}/>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        )}

        <h4 className="text-md font-semibold text-[var(--color-text-primary)] mt-4 mb-2">Desglose de Pagos:</h4>
        <div className="max-h-[40vh] overflow-y-auto space-y-3 pr-2 styled-scrollbar">
          {[...payments].sort((a,b) => b.amountPaid - a.amountPaid).map((payment, index) => (
            <div key={`${payment.jobId}-${payment.employeeId}-${index}`} className="bg-[var(--color-primary-app)] p-3 rounded-md text-sm border-l-2 border-[var(--color-accent)]">
              <p className="font-semibold text-[var(--color-text-primary)]">{payment.employeeName}</p>
              <p className="text-[var(--color-text-secondary)]">Trabajo: {payment.jobName}</p>
              <p className="text-[var(--color-text-secondary)]">Monto Pagado: <span className="text-[var(--color-success)] font-medium">{CURRENCY_FORMATTER.format(payment.amountPaid)}</span></p>
              <p className="text-xs text-[var(--color-text-muted)]">
                ({payment.workdays} días @ {CURRENCY_FORMATTER.format(payment.dailySalary)}/día) - Inicio Trabajo: {new Date(payment.jobStartDate).toLocaleDateString('es-CO')}
              </p>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
};

export default EmployeePaymentsDetailModal;