
import React, { useState, useMemo, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { CURRENCY_FORMATTER } from '../../constants';
import { Job, JobStatus, CompanyFinancials, Client, CompanyProfile, Transaction, Concept } from '../../types';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { getJobs, getCompanyFinancials, getClients, getCompanyProfile as getCompanyProfileFromStorage, getTransactions, getConcepts } from '../../utils/localStorageManager';
import EmployeePaymentsDetailModal from '../../components/modals/EmployeePaymentsDetailModal';
import MaterialCostsDetailModal from '../../components/modals/MaterialCostsDetailModal';
import ReminderTextModal from '../../components/modals/ReminderTextModal';
import BellAlertIcon from '../../components/icons/BellAlertIcon';
import Select from '../../components/ui/Select';

const PIE_COLORS = ['#22d3ee', '#f87171', '#34d399', '#f59e0b', '#8b5cf6', '#a855f7', '#6366f1', '#ec4899'];

const renderCustomizedPieLabel = (props: any) => {
  const { cx, cy, midAngle, outerRadius, percent, name } = props;
  const RADIAN = Math.PI / 180;
  const radius = outerRadius * 0.7; 
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  if (percent * 100 < 5) { 
    return null;
  }

  return (
    <text
      x={x}
      y={y}
      fill="var(--color-text-primary)"
      fontSize="11px"
      textAnchor="middle"
      dominantBaseline="central"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const FinanceOverview: React.FC = () => {
    const [filterType, setFilterType] = useState<'relative' | 'specific'>('relative');
    const [relativeFilter, setRelativeFilter] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
    const [specificYear, setSpecificYear] = useState(new Date().getFullYear());
    const [specificMonth, setSpecificMonth] = useState(new Date().getMonth()); // 0-11

    const [jobs, setJobs] = useState<Job[]>([]);
    const [companyFinancials, setCompanyFinancials] = useState<CompanyFinancials>(getCompanyFinancials());
    const [clients, setClientsState] = useState<Client[]>([]);
    const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);

    const [isEmployeeDetailModalOpen, setIsEmployeeDetailModalOpen] = useState(false);
    const [isMaterialDetailModalOpen, setIsMaterialDetailModalOpen] = useState(false);
    
    const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
    const [selectedJobForReminder, setSelectedJobForReminder] = useState<Job | null>(null);

    const yearOptions = useMemo(() => Array.from({length: 10}, (_, i) => ({ value: new Date().getFullYear() - i, label: String(new Date().getFullYear() - i)})), []);
    const monthOptions = useMemo(() => Array.from({length: 12}, (_, i) => ({ value: i, label: new Date(0, i).toLocaleString('es-CO', {month: 'long'}) })), []);

    useEffect(() => {
        setJobs(getJobs());
        setCompanyFinancials(getCompanyFinancials());
        setClientsState(getClients());
        setCompanyProfile(getCompanyProfileFromStorage());
    }, []);

    const getDateRange = (): { start: Date; end: Date } => {
        let end = new Date();
        let start = new Date();

        if (filterType === 'relative') {
            switch (relativeFilter) {
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
        } else { // specific
             start = new Date(specificYear, specificMonth, 1);
             end = new Date(specificYear, specificMonth + 1, 0);
        }

        start.setHours(0,0,0,0);
        end.setHours(23,59,59,999);
        return { start, end };
    };

    const filteredData = useMemo(() => {
        const { start: filterStart, end: filterEnd } = getDateRange();
        
        const allTransactions = getTransactions();
        const concepts = getConcepts();
        const getConceptName = (id: string) => concepts.find(c => c.id === id)?.name || 'Desconocido';

        const relevantTransactions = allTransactions.filter(t => {
            const tDate = new Date(t.date);
            return tDate >= filterStart && tDate <= filterEnd;
        });

        const income = relevantTransactions.filter(t => t.type === 'INGRESO').reduce((sum, t) => sum + t.amount, 0);
        const expenses = relevantTransactions.filter(t => t.type === 'EGRESO').reduce((sum, t) => sum + t.amount, 0);
        
        const expenseBreakdownMap = new Map<string, { value: number; details: any[] }>();
        relevantTransactions.filter(t => t.type === 'EGRESO').forEach(t => {
            const conceptName = getConceptName(t.conceptId);
            const entry = expenseBreakdownMap.get(conceptName) || { value: 0, details: [] };
            entry.value += t.amount;
            entry.details.push(t);
            expenseBreakdownMap.set(conceptName, entry);
        });
        
        const expenseBreakdownDataFromTransactions = Array.from(expenseBreakdownMap.entries()).map(([name, data]) => ({
            name,
            value: data.value,
            details: data.details,
        }));
        
        const relevantJobsForDetails = jobs.filter(job => {
            const jobStartDate = new Date(job.startDateProposed);
            return jobStartDate <= filterEnd && jobStartDate >= filterStart;
        });

        const employeePaymentsDetails: any[] = [];
        relevantJobsForDetails.forEach(job => {
            (job.assignedEmployees || []).forEach(emp => {
                employeePaymentsDetails.push({
                    employeeName: emp.name, employeeId: emp.employeeId,
                    jobName: job.name, jobId: job.id,
                    amountPaid: emp.dailySalary * emp.estimatedWorkdays,
                    workdays: emp.estimatedWorkdays, dailySalary: emp.dailySalary,
                    jobStartDate: job.startDateProposed
                });
            });
        });

        const materialCostsDetails: any[] = [];
        relevantJobsForDetails.forEach(job => {
            (job.materials || []).forEach(mat => {
                 materialCostsDetails.push({
                    materialName: mat.name, materialId: mat.materialId,
                    jobName: job.name, jobId: job.id,
                    totalCost: mat.unitPrice * mat.quantity, 
                    quantity: mat.quantity, unitPrice: mat.unitPrice, unit: mat.unit,
                    jobStartDate: job.startDateProposed
                });
            });
        });

        const expenseBreakdownData = expenseBreakdownDataFromTransactions.map(item => {
            if (item.name === 'Mano de Obra') return { ...item, details: employeePaymentsDetails };
            if (item.name === 'Materiales de Construcción') return { ...item, details: materialCostsDetails };
            return item;
        });

        return {
            incomeExpenseChartData: [{ name: filterType === 'relative' ? relativeFilter : `${monthOptions[specificMonth].label} ${specificYear}`, ingresos: income, gastos: expenses }],
            expenseBreakdownData,
        };

    }, [jobs, filterType, relativeFilter, specificMonth, specificYear, monthOptions]);


    const accountsReceivable = useMemo(() => {
        return jobs.filter(job => job.status === JobStatus.Completed && job.finalPrice && job.finalPrice > 0)
        .map(job => {
            const client = clients.find(c => c.id === job.clientId);
            const endDate = new Date(job.endDateEstimated);
            endDate.setHours(0,0,0,0);
            const today = new Date();
            today.setHours(0,0,0,0);
            
            const overdueDays = Math.max(0, Math.floor((today.getTime() - endDate.getTime()) / (1000 * 3600 * 24)));

            return {
                ...job,
                clientName: client?.name || 'Cliente Desconocido',
                amountDue: job.finalPrice || 0,
                dueDate: job.endDateEstimated,
                overdueDays,
            };
        })
        .sort((a,b) => b.overdueDays - a.overdueDays); 
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
        if (categoryName === 'Mano de Obra') {
            setIsEmployeeDetailModalOpen(true);
        } else if (categoryName === 'Materiales de Construcción') {
            setIsMaterialDetailModalOpen(true);
        }
    };

    const handleOpenReminderModal = (jobData: any) => {
        const fullJobData = jobs.find(j => j.id === jobData.id);
        if(fullJobData) {
            setSelectedJobForReminder(fullJobData);
            setIsReminderModalOpen(true);
        }
    };

    return (
        <div className="space-y-6">
            <Card title="Filtros de Visualización">
                <div className="flex gap-2 pb-3 overflow-x-auto styled-scrollbar-horizontal-thin">
                    {(['relative', 'specific'] as const).map(type => (
                        <button key={type} onClick={() => setFilterType(type)} className={`px-4 py-1.5 rounded-full text-sm font-semibold flex-shrink-0 transition-colors ${filterType === type ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-white' : 'bg-[var(--color-secondary-bg)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]'}`}>
                            {type === 'relative' ? 'Periodo Relativo' : 'Mes Específico'}
                        </button>
                    ))}
                </div>
                {filterType === 'relative' ? (
                     <div className="flex gap-2 pt-3 overflow-x-auto styled-scrollbar-horizontal-thin">
                        {(['week', 'month', 'quarter', 'year'] as const).map(period => (
                        <button key={period} onClick={() => setRelativeFilter(period)} className={`px-4 py-1.5 rounded-full text-sm font-semibold flex-shrink-0 transition-colors ${relativeFilter === period ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-white' : 'bg-[var(--color-secondary-bg)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]'}`}>
                            {period === 'week' ? 'Semana' : period === 'month' ? 'Mes' : period === 'quarter' ? 'Trimestre' : 'Año'}
                        </button>
                        ))}
                    </div>
                ) : (
                    <div className="flex gap-4 pt-3">
                        <Select options={yearOptions} value={specificYear} onChange={e => setSpecificYear(Number(e.target.value))} />
                        <Select options={monthOptions} value={specificMonth} onChange={e => setSpecificMonth(Number(e.target.value))} />
                    </div>
                )}
            </Card>

            <Card>
                <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-1">Ingresos vs. Gastos</h3>
                <p className="text-xs text-[var(--color-text-secondary)] mb-3">Periodo: {filterType === 'relative' ? relativeFilter : `${monthOptions[specificMonth].label} ${specificYear}`}</p>
                <p className="text-3xl font-extrabold text-green-400">{CURRENCY_FORMATTER.format(filteredData.incomeExpenseChartData[0].ingresos)}</p>
                <ResponsiveContainer width="100%" height={250}>
                <BarChart data={filteredData.incomeExpenseChartData} margin={{ top: 20, right: 0, left: -25, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis dataKey="name" tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }} />
                    <YAxis tickFormatter={(value) => `${CURRENCY_FORMATTER.format(value/1000000)}M`} tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }}/>
                    <Tooltip 
                    formatter={(value: number) => CURRENCY_FORMATTER.format(value)}
                    contentStyle={{ backgroundColor: 'var(--color-secondary-bg)', border: '1px solid var(--color-border)', borderRadius: '0.5rem' }}
                    labelStyle={{ color: 'var(--color-text-primary)', fontWeight: 'bold' }}
                    itemStyle={{ color: 'var(--color-text-secondary)' }}
                    />
                    <Legend wrapperStyle={{ color: 'var(--color-text-secondary)', fontSize: '12px' }}/>
                    <Bar dataKey="ingresos" fill="var(--color-accent)" name="Ingresos" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="gastos" fill="#f87171" name="Gastos" radius={[4, 4, 0, 0]} />
                </BarChart>
                </ResponsiveContainer>
            </Card>

            <Card>
                <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-1">Desglose de Gastos</h3>
                <p className="text-xs text-[var(--color-text-secondary)] mb-3">Periodo: {filterType === 'relative' ? relativeFilter : `${monthOptions[specificMonth].label} ${specificYear}`}</p>
                <p className="text-3xl font-extrabold text-red-400">{CURRENCY_FORMATTER.format(filteredData.expenseBreakdownData.reduce((sum, item) => sum + item.value, 0))}</p>
                <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                    <Pie
                    data={filteredData.expenseBreakdownData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="var(--color-accent)"
                    dataKey="value"
                    nameKey="name"
                    label={renderCustomizedPieLabel}
                    >
                    {filteredData.expenseBreakdownData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => CURRENCY_FORMATTER.format(value)} 
                        contentStyle={{ backgroundColor: 'var(--color-secondary-bg)', border: '1px solid var(--color-border)', borderRadius: '0.5rem' }}
                        itemStyle={{ color: 'var(--color-text-secondary)' }}/>
                    <Legend wrapperStyle={{ color: 'var(--color-text-secondary)', paddingTop: '10px', fontSize: '12px' }}/>
                </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                    {filteredData.expenseBreakdownData.map((item, index) => (
                        <div key={item.name}>
                            <div className="flex justify-between items-center text-sm text-white">
                                <span className="font-medium">{item.name}</span>
                                <div className="flex items-center space-x-2">
                                <span className="font-semibold">{CURRENCY_FORMATTER.format(item.value)}</span>
                                {(item.name === 'Mano de Obra' || item.name === 'Materiales de Construcción') && item.value > 0 && (
                                    <Button size="sm" variant="ghost" className="text-xs px-1 py-0.5 text-[var(--color-accent)]" onClick={() => handleOpenDetailModal(item.name)}>
                                        Detalles
                                    </Button>
                                )}
                                </div>
                            </div>
                            <div className="w-full bg-[var(--color-border)] rounded-full h-2 mt-1">
                                <div 
                                    className="h-2 rounded-full" 
                                    style={{ width: `${(item.value / Math.max(1, filteredData.expenseBreakdownData.reduce((s,i) => s + i.value, 0))) * 100}%`, backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                                ></div>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>

            <Card title="Cuentas por Cobrar">
                {accountsReceivable.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto styled-scrollbar pr-1">
                    {accountsReceivable.map(jobAccount => (
                    <div key={jobAccount.id} className="bg-[var(--color-primary-app)] p-3 rounded-lg shadow-md border-l-2 border-[var(--color-accent)]">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="font-semibold text-white">{jobAccount.name}</p>
                                <p className="text-xs text-[var(--color-text-secondary)]">Cliente: {jobAccount.clientName}</p>
                            </div>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                                jobAccount.overdueDays > 0 ? 'bg-red-500/30 text-red-300' : 'bg-yellow-500/30 text-yellow-300'
                            }`}>
                                {jobAccount.overdueDays > 0 ? 'Vencido' : 'Pendiente'}
                            </span>
                        </div>
                        <div className="mt-2 flex justify-between items-center">
                            <p className="text-sm">
                            {jobAccount.overdueDays > 0 
                                ? <span className="text-red-400 font-bold">{jobAccount.overdueDays} día(s) vencido</span>
                                : <span className="text-yellow-400">Vence: Hoy/Próximamente</span> 
                            }
                            <span className="text-xs text-[var(--color-text-secondary)] ml-2">({new Date(jobAccount.dueDate).toLocaleDateString('es-CO')})</span>
                            </p>
                            <span className="font-bold text-lg text-[var(--color-accent)]">{CURRENCY_FORMATTER.format(jobAccount.amountDue)}</span>
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
            </Card>

            <Card title="Flujo de Caja (Presupuesto Disponible)">
                <p className="text-4xl font-extrabold text-[var(--color-accent)]">{CURRENCY_FORMATTER.format(cashFlow)}</p>
            </Card>

            <Card title="Rentabilidad por Proyecto (Finalizados)">
                {completedProjectsProfitability.length > 0 ? (
                <ul className="space-y-3 max-h-80 overflow-y-auto styled-scrollbar pr-1">
                    {completedProjectsProfitability.map(p => (
                    <li key={p.id} className="text-sm p-3 bg-[var(--color-primary-app)] rounded-lg shadow-md">
                        <p className="font-semibold text-white">{p.name} <span className="text-xs text-[var(--color-text-secondary)]">({p.client})</span></p>
                        <div className="grid grid-cols-2 gap-x-2 text-xs mt-1">
                            <p className="text-[var(--color-text-secondary)]">Presupuesto: <span className="text-white font-medium">{CURRENCY_FORMATTER.format(p.budget)}</span></p>
                            <p className="text-[var(--color-text-secondary)]">Costo Real: <span className="text-white font-medium">{CURRENCY_FORMATTER.format(p.actualCost)}</span></p>
                            <p className="col-span-2 mt-1 text-[var(--color-text-secondary)]">Ganancia Neta: <span className={`font-bold ${p.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>{CURRENCY_FORMATTER.format(p.netProfit)}</span></p>
                        </div>
                    </li>
                    ))}
                </ul>
                ) : (
                <p className="text-[var(--color-text-secondary)] text-center">No hay proyectos finalizados para mostrar rentabilidad.</p>
                )}
            </Card>

            {isEmployeeDetailModalOpen && (
                <EmployeePaymentsDetailModal
                    isOpen={isEmployeeDetailModalOpen}
                    onClose={() => setIsEmployeeDetailModalOpen(false)}
                    payments={filteredData.expenseBreakdownData.find(item => item.name === 'Mano de Obra')?.details || []}
                />
            )}
            {isMaterialDetailModalOpen && (
                <MaterialCostsDetailModal
                    isOpen={isMaterialDetailModalOpen}
                    onClose={() => setIsMaterialDetailModalOpen(false)}
                    costs={filteredData.expenseBreakdownData.find(item => item.name === 'Materiales de Construcción')?.details || []}
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

export default FinanceOverview;
