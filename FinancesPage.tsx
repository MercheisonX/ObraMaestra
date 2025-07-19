
import React, { useState, useMemo, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { CURRENCY_FORMATTER } from '../constants';
import { Job, JobStatus, CompanyFinancials, Client, CompanyProfile } from '../types';
import Button from '../components/ui/Button';
import { getJobs, getCompanyFinancials, getClients, getCompanyProfile as getCompanyProfileFromStorage } from '../utils/localStorageManager';
import EmployeePaymentsDetailModal from '../components/modals/EmployeePaymentsDetailModal';
import MaterialCostsDetailModal from '../components/modals/MaterialCostsDetailModal';
import ReminderTextModal from '../components/modals/ReminderTextModal'; // New Modal
import BellAlertIcon from '../components/icons/BellAlertIcon'; // New Icon

const PIE_COLORS = ['var(--color-aquamarine)', '#14b8a6', '#f59e0b', '#ef4444', '#8b5cf6', '#a855f7'];

const renderCustomizedPieLabel = (props: any) => {
  const { cx, cy, midAngle, outerRadius, percent, name } = props;
  const RADIAN = Math.PI / 180;
  const radius = outerRadius * 0.65; 
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  if (percent * 100 < 5) { 
    return null;
  }

  return (
    <text
      x={x}
      y={y}
      fill="var(--color-text-secondary)"
      fontSize="10px"
      textAnchor="middle"
      dominantBaseline="central"
    >
      {`${name} ${(percent * 100).toFixed(0)}%`}
    </text>
  );
};


const FinancesPage: React.FC = () => {
  const [timeFilter, setTimeFilter] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [companyFinancials, setCompanyFinancials] = useState<CompanyFinancials>(getCompanyFinancials());
  const [clients, setClientsState] = useState<Client[]>([]); // Renamed to avoid conflict
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);


  const [isEmployeeDetailModalOpen, setIsEmployeeDetailModalOpen] = useState(false);
  const [isMaterialDetailModalOpen, setIsMaterialDetailModalOpen] = useState(false);
  
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [selectedJobForReminder, setSelectedJobForReminder] = useState<Job | null>(null);


  useEffect(() => {
    setJobs(getJobs());
    setCompanyFinancials(getCompanyFinancials());
    setClientsState(getClients()); // Use renamed state setter
    setCompanyProfile(getCompanyProfileFromStorage());
  }, []);
  
  const getDateRange = (filter: typeof timeFilter): { start: Date; end: Date } => {
    const end = new Date();
    let start = new Date();
    switch (filter) {
      case 'week':
        start.setDate(end.getDate() - 7);
        break;
      case 'month':
        start.setMonth(end.getMonth() - 1);
        break;
      case 'quarter':
        start.setMonth(end.getMonth() - 3);
        break;
      case 'year':
        start.setFullYear(end.getFullYear() - 1);
        break;
    }
    start.setHours(0,0,0,0);
    end.setHours(23,59,59,999);
    return { start, end };
  };

  const filteredData = useMemo(() => {
    const { start: filterStart, end: filterEnd } = getDateRange(timeFilter);
    const relevantJobs = jobs.filter(job => {
        const jobStartDate = new Date(job.startDateProposed);
        const jobEndDate = new Date(job.endDateEstimated);
        return jobStartDate <= filterEnd && jobEndDate >= filterStart;
    });

    const income = relevantJobs
        .filter(job => job.status === JobStatus.Paid && job.finalPrice && new Date(job.endDateEstimated) >= filterStart && new Date(job.endDateEstimated) <= filterEnd)
        .reduce((sum, job) => sum + (job.finalPrice || 0), 0);

    const expenses = relevantJobs
        .filter(job => job.operationalCost && job.status !== JobStatus.Pending && new Date(job.startDateProposed) <= filterEnd)
        .reduce((sum, job) => sum + (job.operationalCost || 0), 0);

    const employeePayments: { name: string; value: number; details: any[] } = { name: 'Pago a Empleados', value: 0, details: [] };
    const materialCosts: { name: string; value: number; details: any[] } = { name: 'Compra de Materiales', value: 0, details: [] };
    
    relevantJobs.forEach(job => {
        (job.assignedEmployees || []).forEach(emp => {
            const paymentAmount = emp.dailySalary * emp.estimatedWorkdays;
            employeePayments.value += paymentAmount;
            employeePayments.details.push({
                employeeName: emp.name, employeeId: emp.employeeId,
                jobName: job.name, jobId: job.id,
                amountPaid: paymentAmount, workdays: emp.estimatedWorkdays, dailySalary: emp.dailySalary,
                jobStartDate: job.startDateProposed
            });
        });
        (job.materials || []).forEach(mat => {
            const costAmount = mat.unitPrice * mat.quantity;
            materialCosts.value += costAmount;
            materialCosts.details.push({
                materialName: mat.name, materialId: mat.materialId,
                jobName: job.name, jobId: job.id,
                totalCost: costAmount, quantity: mat.quantity, unitPrice: mat.unitPrice, unit: mat.unit,
                jobStartDate: job.startDateProposed
            });
        });
    });
    
    const toolMaintenance = { name: 'Mantenimiento Herramientas', value: 0, details: [] }; // Placeholder for future
    const adminExpenses = { name: 'Gastos Administrativos', value: 0, details: [] }; // Placeholder for future
    const taxes = { name: 'Impuestos', value: 0, details: [] }; // Placeholder for future

    const expenseBreakdownData = [employeePayments, materialCosts, toolMaintenance, adminExpenses, taxes].filter(e => e.value > 0 || e.name.includes("Pago") || e.name.includes("Materiales"));


    return {
        incomeExpenseChartData: [{ name: timeFilter, ingresos: income, gastos: expenses }],
        expenseBreakdownData,
    };

  }, [jobs, timeFilter]);


  const accountsReceivable = useMemo(() => {
    return jobs.filter(job => job.status !== JobStatus.Paid && job.finalPrice && job.finalPrice > 0)
      .map(job => {
        const client = clients.find(c => c.id === job.clientId);
        const endDate = new Date(job.endDateEstimated);
        endDate.setHours(0,0,0,0);
        const today = new Date();
        today.setHours(0,0,0,0);
        
        let overdueDays = 0;
        let daysUntilDue = 0;

        if (job.status === JobStatus.Completed) { 
             overdueDays = Math.max(0, Math.floor((today.getTime() - endDate.getTime()) / (1000 * 3600 * 24)));
        } else { 
             daysUntilDue = Math.max(0, Math.floor((endDate.getTime() - today.getTime()) / (1000 * 3600 * 24)));
        }

        return {
          ...job,
          clientName: client?.name || 'Cliente Desconocido',
          amountDue: job.finalPrice || 0,
          dueDate: job.endDateEstimated,
          overdueDays,
          daysUntilDue,
        };
      })
      .sort((a,b) => (b.overdueDays - a.overdueDays) || (a.daysUntilDue - b.daysUntilDue)); 
  }, [jobs, clients]);

  const completedProjectsProfitability = useMemo(() => {
    return jobs.filter(job => (job.status === JobStatus.Paid || job.status === JobStatus.Completed) && job.finalPrice && job.operationalCost)
      .map(job => ({
        id: job.id,
        name: job.name,
        client: job.client?.name || 'N/A', 
        budget: job.finalPrice || 0, 
        actualCost: job.operationalCost || 0,
        netProfit: (job.finalPrice || 0) - (job.operationalCost || 0),
      }));
  }, [jobs]);
  
  const cashFlow = companyFinancials.currentBudget; 

  const handleOpenDetailModal = (categoryName: string) => {
    if (categoryName === 'Pago a Empleados') {
        setIsEmployeeDetailModalOpen(true);
    } else if (categoryName === 'Compra de Materiales') {
        setIsMaterialDetailModalOpen(true);
    }
  };

  const handleOpenReminderModal = (jobData: any) => { // 'any' for now, should be a defined type for JobAccountReceivable
    const fullJobData = jobs.find(j => j.id === jobData.id);
    if(fullJobData) {
        setSelectedJobForReminder(fullJobData);
        setIsReminderModalOpen(true);
    }
  };


  return (
    <div className="p-4 space-y-8 styled-scrollbar">
      <div 
        className="sticky top-0 glass-bar py-3 z-20 border-b"
        style={{borderColor: 'var(--color-glass-border)'}}
      >
        <div className="w-full overflow-hidden">
          <div className="flex space-x-2 styled-scrollbar-horizontal-thin overflow-x-auto justify-start px-4 md:justify-center">
            {(['week', 'month', 'quarter', 'year'] as const).map(period => (
              <Button 
                key={period} 
                variant={timeFilter === period ? 'primary' : 'secondary'}
                onClick={() => setTimeFilter(period)}
                size="sm"
                className="flex-shrink-0"
              >
                {period === 'week' ? 'Semana' : period === 'month' ? 'Mes' : period === 'quarter' ? 'Trimestre' : 'Año'}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="glass-panel p-4 rounded-xl shadow-xl border-t-2 border-[var(--color-aquamarine)]">
        <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-1">Ingresos vs. Gastos</h3>
        <p className="text-xs text-[var(--color-text-secondary)] mb-3">Periodo: {timeFilter}</p>
        <p className="text-3xl font-extrabold text-green-400">{CURRENCY_FORMATTER.format(filteredData.incomeExpenseChartData[0].ingresos)}</p>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={filteredData.incomeExpenseChartData} margin={{ top: 20, right: 0, left: -25, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="name" tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }} />
            <YAxis tickFormatter={(value) => `${CURRENCY_FORMATTER.format(value/1000000)}M`} tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }}/>
            <Tooltip 
              formatter={(value: number) => CURRENCY_FORMATTER.format(value)}
              contentStyle={{ backgroundColor: 'var(--color-glass-bg-base)', border: '1px solid var(--color-glass-border)', borderRadius: '0.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}
              labelStyle={{ color: 'var(--color-text-primary)', fontWeight: 'bold' }}
              itemStyle={{ color: 'var(--color-text-secondary)' }}
            />
            <Legend wrapperStyle={{ color: 'var(--color-text-secondary)', fontSize: '12px' }}/>
            <Bar dataKey="ingresos" fill="var(--color-aquamarine)" name="Ingresos" radius={[4, 4, 0, 0]} />
            <Bar dataKey="gastos" fill="#f87171" name="Gastos" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="glass-panel p-4 rounded-xl shadow-xl border-t-2 border-[var(--color-aquamarine)]">
        <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-1">Desglose de Gastos</h3>
        <p className="text-xs text-[var(--color-text-secondary)] mb-3">Periodo: {timeFilter}</p>
        <p className="text-3xl font-extrabold text-red-400">{CURRENCY_FORMATTER.format(filteredData.expenseBreakdownData.reduce((sum, item) => sum + item.value, 0))}</p>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={filteredData.expenseBreakdownData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="var(--color-aquamarine)"
              dataKey="value"
              label={renderCustomizedPieLabel}
            >
              {filteredData.expenseBreakdownData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => CURRENCY_FORMATTER.format(value)} 
                contentStyle={{ backgroundColor: 'var(--color-glass-bg-base)', border: '1px solid var(--color-glass-border)', borderRadius: '0.5rem' }}
                itemStyle={{ color: 'var(--color-text-secondary)' }}/>
            <Legend wrapperStyle={{ color: 'var(--color-text-secondary)', paddingTop: '10px', fontSize: '12px' }}/>
          </PieChart>
        </ResponsiveContainer>
        <div className="mt-4 space-y-2">
            {filteredData.expenseBreakdownData.map((item, index) => (
                <div key={item.name}>
                    <div className="flex justify-between items-center text-sm text-[var(--color-text-primary)]">
                        <span className="font-medium">{item.name}</span>
                        <div className="flex items-center space-x-2">
                           <span className="font-semibold">{CURRENCY_FORMATTER.format(item.value)}</span>
                           {(item.name === 'Pago a Empleados' || item.name === 'Compra de Materiales') && item.value > 0 && (
                             <Button size="sm" variant="ghost" className="text-xs px-1 py-0.5 text-[var(--color-aquamarine)]" onClick={() => handleOpenDetailModal(item.name)}>
                                Detalles
                             </Button>
                           )}
                        </div>
                    </div>
                    <div className="w-full bg-[var(--color-surface-3)] rounded-full h-2 mt-1">
                        <div 
                            className="h-2 rounded-full" 
                            style={{ width: `${(item.value / Math.max(1, filteredData.expenseBreakdownData.reduce((s,i) => s + i.value, 0))) * 100}%`, backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                        ></div>
                    </div>
                </div>
            ))}
        </div>
      </div>

      <div className="glass-panel p-4 rounded-xl shadow-xl border-t-2 border-[var(--color-aquamarine)]">
        <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-3">Cuentas por Cobrar</h3>
        {accountsReceivable.length > 0 ? (
          <div className="space-y-3 max-h-96 overflow-y-auto styled-scrollbar pr-1">
            {accountsReceivable.map(jobAccount => ( // Renamed job to jobAccount to avoid conflict
              <div key={jobAccount.id} className="glass-panel p-3 rounded-lg shadow-md border-l-2 border-[var(--color-aquamarine)]">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="font-semibold text-[var(--color-text-primary)]">{jobAccount.name}</p>
                        <p className="text-xs text-[var(--color-text-secondary)]">Cliente: {jobAccount.clientName}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                        jobAccount.status === JobStatus.Completed ? 'bg-yellow-500/30 text-yellow-300' : 
                        jobAccount.status === JobStatus.InProgress ? 'bg-blue-500/30 text-blue-300' :
                        'bg-gray-500/30 text-gray-300'
                    }`}>
                        {jobAccount.status}
                    </span>
                </div>
                <div className="mt-2 flex justify-between items-center">
                    <p className="text-sm">
                      {jobAccount.overdueDays > 0 
                        ? <span className="text-red-400 font-bold">Vencido: {jobAccount.overdueDays} día(s)</span>
                        : jobAccount.status === JobStatus.Completed 
                          ? <span className="text-yellow-400">Vence: Hoy/Próximamente</span> 
                          : <span className="text-blue-400">Vence en: {jobAccount.daysUntilDue} día(s)</span>
                      }
                      <span className="text-xs text-[var(--color-text-secondary)] ml-2">({new Date(jobAccount.dueDate).toLocaleDateString('es-CO')})</span>
                    </p>
                    <span className="font-bold text-lg text-[var(--color-aquamarine)]">{CURRENCY_FORMATTER.format(jobAccount.amountDue)}</span>
                </div>
                 <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2 text-xs" 
                    onClick={() => handleOpenReminderModal(jobAccount)}
                    leftIcon={<BellAlertIcon className="w-3.5 h-3.5"/>}
                 >
                    Generar Recordatorio
                 </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[var(--color-text-secondary)] text-center">No hay cuentas por cobrar pendientes.</p>
        )}
      </div>

      <div className="glass-panel p-6 rounded-xl shadow-xl border-t-2 border-[var(--color-aquamarine)]">
        <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-2">Flujo de Caja (Presupuesto Disponible)</h3>
        <p className="text-4xl font-extrabold text-[var(--color-aquamarine)]">{CURRENCY_FORMATTER.format(cashFlow)}</p>
      </div>

      <div className="glass-panel p-4 rounded-xl shadow-xl border-t-2 border-[var(--color-aquamarine)]">
        <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-3">Rentabilidad por Proyecto (Finalizados)</h3>
        {completedProjectsProfitability.length > 0 ? (
          <ul className="space-y-3 max-h-80 overflow-y-auto styled-scrollbar pr-1">
            {completedProjectsProfitability.map(p => (
              <li key={p.id} className="text-sm p-3 glass-panel rounded-lg shadow-md"> {/* Applied glass-panel here too */}
                <p className="font-semibold text-[var(--color-text-primary)]">{p.name} <span className="text-xs text-[var(--color-text-secondary)]">({p.client})</span></p>
                <div className="grid grid-cols-2 gap-x-2 text-xs mt-1">
                    <p className="text-[var(--color-text-secondary)]">Presupuesto: <span className="text-[var(--color-text-primary)] font-medium">{CURRENCY_FORMATTER.format(p.budget)}</span></p>
                    <p className="text-[var(--color-text-secondary)]">Costo Real: <span className="text-[var(--color-text-primary)] font-medium">{CURRENCY_FORMATTER.format(p.actualCost)}</span></p>
                    <p className="col-span-2 mt-1 text-[var(--color-text-secondary)]">Ganancia Neta: <span className={`font-bold ${p.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>{CURRENCY_FORMATTER.format(p.netProfit)}</span></p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[var(--color-text-secondary)] text-center">No hay proyectos finalizados para mostrar rentabilidad.</p>
        )}
      </div>

        {isEmployeeDetailModalOpen && (
            <EmployeePaymentsDetailModal
                isOpen={isEmployeeDetailModalOpen}
                onClose={() => setIsEmployeeDetailModalOpen(false)}
                payments={filteredData.expenseBreakdownData.find(item => item.name === 'Pago a Empleados')?.details || []}
            />
        )}
        {isMaterialDetailModalOpen && (
            <MaterialCostsDetailModal
                isOpen={isMaterialDetailModalOpen}
                onClose={() => setIsMaterialDetailModalOpen(false)}
                costs={filteredData.expenseBreakdownData.find(item => item.name === 'Compra de Materiales')?.details || []}
            />
        )}
        {isReminderModalOpen && selectedJobForReminder && companyProfile && (
            <ReminderTextModal
                isOpen={isReminderModalOpen}
                onClose={() => {setIsReminderModalOpen(false); setSelectedJobForReminder(null);}}
                job={selectedJobForReminder}
                client={clients.find(c => c.id === selectedJobForReminder.clientId)}
                companyProfile={companyProfile}
            />
        )}
    </div>
  );
};

export default FinancesPage;
