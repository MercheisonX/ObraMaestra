
import React, { useState, useMemo, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area } from 'recharts';
import { CURRENCY_FORMATTER } from '../constants';
import { Job, JobStatus, CompanyFinancials, Client, CompanyProfile, Transaction, Concept } from '../types';
import Button from '../components/ui/Button';
import { 
  getJobs, 
  getCompanyFinancials, 
  getClients, 
  getCompanyProfile as getCompanyProfileFromStorage,
  getTransactions,
  getConcepts,
  addTransaction,
  generateId
} from '../utils/localStorageManager';
import EmployeePaymentsDetailModal from '../components/modals/EmployeePaymentsDetailModal';
import MaterialCostsDetailModal from '../components/modals/MaterialCostsDetailModal';
import ReminderTextModal from '../components/modals/ReminderTextModal';
import BellAlertIcon from '../components/icons/BellAlertIcon';

const PIE_COLORS = ['var(--color-accent)', '#14b8a6', '#f59e0b', '#ef4444', '#8b5cf6', '#a855f7', '#06b6d4', '#84cc16'];

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
  const [clients, setClientsState] = useState<Client[]>([]);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [concepts, setConcepts] = useState<Concept[]>([]);

  // Modal states
  const [isEmployeeDetailModalOpen, setIsEmployeeDetailModalOpen] = useState(false);
  const [isMaterialDetailModalOpen, setIsMaterialDetailModalOpen] = useState(false);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [selectedJobForReminder, setSelectedJobForReminder] = useState<Job | null>(null);

  useEffect(() => {
    setJobs(getJobs());
    setCompanyFinancials(getCompanyFinancials());
    setClientsState(getClients());
    setCompanyProfile(getCompanyProfileFromStorage());
    setTransactions(getTransactions());
    setConcepts(getConcepts());
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

  // Real-time financial data based on transactions and jobs
  const financialData = useMemo(() => {
    const { start: filterStart, end: filterEnd } = getDateRange(timeFilter);
    
    // Filter transactions by date range
    const filteredTransactions = transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      return transactionDate >= filterStart && transactionDate <= filterEnd;
    });

    // Calculate income and expenses from transactions
    const totalIncome = filteredTransactions
      .filter(t => t.type === 'INGRESO')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = filteredTransactions
      .filter(t => t.type === 'EGRESO')
      .reduce((sum, t) => sum + t.amount, 0);

    // Group expenses by concept for breakdown
    const expenseBreakdown = concepts.map(concept => {
      const conceptTransactions = filteredTransactions.filter(t => 
        t.type === 'EGRESO' && t.conceptId === concept.id
      );
      const total = conceptTransactions.reduce((sum, t) => sum + t.amount, 0);
      
      return {
        name: concept.name,
        value: total,
        conceptId: concept.id,
        transactions: conceptTransactions
      };
    }).filter(item => item.value > 0);

    // Profit calculation
    const profit = totalIncome - totalExpenses;
    const profitMargin = totalIncome > 0 ? (profit / totalIncome) * 100 : 0;

    return {
      totalIncome,
      totalExpenses,
      profit,
      profitMargin,
      expenseBreakdown,
      filteredTransactions
    };
  }, [transactions, concepts, timeFilter]);

  // Jobs-based data for additional insights
  const jobsData = useMemo(() => {
    const { start: filterStart, end: filterEnd } = getDateRange(timeFilter);
    
    const relevantJobs = jobs.filter(job => {
      const jobStartDate = new Date(job.startDateProposed);
      const jobEndDate = new Date(job.endDateEstimated);
      return jobStartDate <= filterEnd && jobEndDate >= filterStart;
    });

    // Jobs by status
    const jobsByStatus = Object.values(JobStatus).map(status => ({
      status,
      count: relevantJobs.filter(job => job.status === status).length,
      revenue: relevantJobs
        .filter(job => job.status === status && job.finalPrice)
        .reduce((sum, job) => sum + (job.finalPrice || 0), 0)
    }));

    // Employee costs breakdown
    const employeePayments: { name: string; value: number; details: any[] } = { 
      name: 'Pago a Empleados', 
      value: 0, 
      details: [] 
    };
    
    // Material costs breakdown
    const materialCosts: { name: string; value: number; details: any[] } = { 
      name: 'Compra de Materiales', 
      value: 0, 
      details: [] 
    };
    
    relevantJobs.forEach(job => {
      (job.assignedEmployees || []).forEach(emp => {
        const paymentAmount = emp.dailySalary * emp.estimatedWorkdays;
        employeePayments.value += paymentAmount;
        employeePayments.details.push({
          employeeName: emp.name,
          employeeId: emp.employeeId,
          jobName: job.name,
          jobId: job.id,
          amountPaid: paymentAmount,
          workdays: emp.estimatedWorkdays,
          dailySalary: emp.dailySalary,
          jobStartDate: job.startDateProposed
        });
      });
      
      (job.materials || []).forEach(mat => {
        const costAmount = mat.unitPrice * mat.quantity;
        materialCosts.value += costAmount;
        materialCosts.details.push({
          materialName: mat.name,
          materialId: mat.materialId,
          jobName: job.name,
          jobId: job.id,
          totalCost: costAmount,
          quantity: mat.quantity,
          unitPrice: mat.unitPrice,
          unit: mat.unit,
          jobStartDate: job.startDateProposed
        });
      });
    });

    return {
      relevantJobs,
      jobsByStatus,
      employeePayments,
      materialCosts
    };
  }, [jobs, timeFilter]);

  // Accounts receivable (money owed to us)
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

  // Profitability analysis for completed projects
  const profitabilityAnalysis = useMemo(() => {
    const completedJobs = jobs.filter(job => 
      (job.status === JobStatus.Paid || job.status === JobStatus.Completed) && 
      job.finalPrice && 
      job.operationalCost
    );

    const analysis = completedJobs.map(job => {
      const client = clients.find(c => c.id === job.clientId);
      const revenue = job.finalPrice || 0;
      const cost = job.operationalCost || 0;
      const profit = revenue - cost;
      const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

      return {
        id: job.id,
        name: job.name,
        clientName: client?.name || 'N/A',
        revenue,
        cost,
        profit,
        margin
      };
    });

    // Calculate averages
    const avgRevenue = analysis.length > 0 ? analysis.reduce((sum, a) => sum + a.revenue, 0) / analysis.length : 0;
    const avgCost = analysis.length > 0 ? analysis.reduce((sum, a) => sum + a.cost, 0) / analysis.length : 0;
    const avgProfit = analysis.length > 0 ? analysis.reduce((sum, a) => sum + a.profit, 0) / analysis.length : 0;
    const avgMargin = analysis.length > 0 ? analysis.reduce((sum, a) => sum + a.margin, 0) / analysis.length : 0;

    return {
      projects: analysis.sort((a, b) => b.profit - a.profit),
      averages: { avgRevenue, avgCost, avgProfit, avgMargin },
      totalProjects: analysis.length
    };
  }, [jobs, clients]);

  // Monthly trend data (last 6 months)
  const monthlyTrends = useMemo(() => {
    const trends = [];
    const today = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthEnd = new Date(today.getFullYear(), today.getMonth() - i + 1, 0);
      
      const monthTransactions = transactions.filter(t => {
        const tDate = new Date(t.date);
        return tDate >= monthStart && tDate <= monthEnd;
      });

      const income = monthTransactions.filter(t => t.type === 'INGRESO').reduce((sum, t) => sum + t.amount, 0);
      const expenses = monthTransactions.filter(t => t.type === 'EGRESO').reduce((sum, t) => sum + t.amount, 0);

      trends.push({
        month: monthStart.toLocaleDateString('es-CO', { month: 'short', year: '2-digit' }),
        ingresos: income,
        gastos: expenses,
        utilidad: income - expenses
      });
    }

    return trends;
  }, [transactions]);

  // Event handlers
  const handleOpenDetailModal = (categoryName: string) => {
    if (categoryName === 'Pago a Empleados') {
      setIsEmployeeDetailModalOpen(true);
    } else if (categoryName === 'Compra de Materiales') {
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

  const handleQuickPayment = (job: any) => {
    if (!job.finalPrice) return;
    
    const transaction: Transaction = {
      id: generateId('trx-'),
      date: new Date().toISOString(),
      conceptId: 'concept-1', // 'Pago de Cliente'
      type: 'INGRESO',
      amount: job.finalPrice,
      receiptNumber: `FAC-${Date.now()}`,
      responsible: job.clientName,
      notes: `Pago recibido por trabajo: ${job.name}`
    };

    addTransaction(transaction);
    
    // Refresh data
    setTransactions(getTransactions());
    setJobs(getJobs());
  };

  return (
    <div className="p-4 space-y-8 styled-scrollbar">
      {/* Filter Bar */}
      <div 
        className="sticky top-0 bg-[var(--color-primary-app)]/95 backdrop-blur-sm py-3 z-20 border-b border-[var(--color-border)]"
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

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Income */}
        <div className="bg-[var(--color-secondary-bg)] p-4 rounded-xl shadow-lg border-t-2 border-[var(--color-success)]">
          <h3 className="text-sm font-medium text-[var(--color-text-secondary)] mb-1">Ingresos Totales</h3>
          <p className="text-2xl font-bold text-[var(--color-success)]">
            {CURRENCY_FORMATTER.format(financialData.totalIncome)}
          </p>
          <p className="text-xs text-[var(--color-text-secondary)] mt-1">
            Período: {timeFilter === 'week' ? 'Semana' : timeFilter === 'month' ? 'Mes' : timeFilter === 'quarter' ? 'Trimestre' : 'Año'}
          </p>
        </div>

        {/* Total Expenses */}
        <div className="bg-[var(--color-secondary-bg)] p-4 rounded-xl shadow-lg border-t-2 border-[var(--color-danger)]">
          <h3 className="text-sm font-medium text-[var(--color-text-secondary)] mb-1">Gastos Totales</h3>
          <p className="text-2xl font-bold text-[var(--color-danger)]">
            {CURRENCY_FORMATTER.format(financialData.totalExpenses)}
          </p>
          <p className="text-xs text-[var(--color-text-secondary)] mt-1">
            Período: {timeFilter === 'week' ? 'Semana' : timeFilter === 'month' ? 'Mes' : timeFilter === 'quarter' ? 'Trimestre' : 'Año'}
          </p>
        </div>

        {/* Net Profit */}
        <div className="bg-[var(--color-secondary-bg)] p-4 rounded-xl shadow-lg border-t-2 border-[var(--color-accent)]">
          <h3 className="text-sm font-medium text-[var(--color-text-secondary)] mb-1">Utilidad Neta</h3>
          <p className={`text-2xl font-bold ${financialData.profit >= 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'}`}>
            {CURRENCY_FORMATTER.format(financialData.profit)}
          </p>
          <p className="text-xs text-[var(--color-text-secondary)] mt-1">
            Margen: {financialData.profitMargin.toFixed(1)}%
          </p>
        </div>

        {/* Cash Flow */}
        <div className="bg-[var(--color-secondary-bg)] p-4 rounded-xl shadow-lg border-t-2 border-[var(--color-warning)]">
          <h3 className="text-sm font-medium text-[var(--color-text-secondary)] mb-1">Flujo de Caja</h3>
          <p className="text-2xl font-bold text-[var(--color-accent)]">
            {CURRENCY_FORMATTER.format(companyFinancials.currentBudget)}
          </p>
          <p className="text-xs text-[var(--color-text-secondary)] mt-1">Disponible</p>
        </div>
      </div>

      {/* Monthly Trends Chart */}
      <div className="bg-[var(--color-secondary-bg)] p-4 rounded-xl shadow-lg border-t-2 border-[var(--color-accent)]">
        <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-1">Tendencia Financiera (6 Meses)</h3>
        <p className="text-xs text-[var(--color-text-secondary)] mb-4">Evolución de ingresos, gastos y utilidad</p>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={monthlyTrends} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="month" tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }} />
            <YAxis tickFormatter={(value) => CURRENCY_FORMATTER.format(value/1000000) + 'M'} tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }} />
            <Tooltip 
              formatter={(value: number) => CURRENCY_FORMATTER.format(value)}
              contentStyle={{ 
                backgroundColor: 'var(--color-secondary-bg)', 
                border: '1px solid var(--color-border)', 
                borderRadius: '0.5rem',
                boxShadow: '0 4px 12px rgba(0,0,0,0.5)' 
              }}
              labelStyle={{ color: 'var(--color-text-primary)', fontWeight: 'bold' }}
              itemStyle={{ color: 'var(--color-text-secondary)' }}
            />
            <Legend wrapperStyle={{ color: 'var(--color-text-secondary)', fontSize: '12px' }}/>
            <Area dataKey="ingresos" stackId="1" fill="var(--color-success)" name="Ingresos" fillOpacity={0.6} />
            <Area dataKey="gastos" stackId="2" fill="var(--color-danger)" name="Gastos" fillOpacity={0.6} />
            <Line dataKey="utilidad" stroke="var(--color-accent)" strokeWidth={2} name="Utilidad" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Income vs Expenses Chart */}
      <div className="bg-[var(--color-secondary-bg)] p-4 rounded-xl shadow-lg border-t-2 border-[var(--color-accent)]">
        <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-1">Ingresos vs. Gastos</h3>
        <p className="text-xs text-[var(--color-text-secondary)] mb-3">Período: {timeFilter}</p>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={[{ name: 'Actual', ingresos: financialData.totalIncome, gastos: financialData.totalExpenses }]} margin={{ top: 20, right: 0, left: -25, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="name" tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }} />
            <YAxis tickFormatter={(value) => `${CURRENCY_FORMATTER.format(value/1000000)}M`} tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }}/>
            <Tooltip 
              formatter={(value: number) => CURRENCY_FORMATTER.format(value)}
              contentStyle={{ backgroundColor: 'var(--color-secondary-bg)', border: '1px solid var(--color-border)', borderRadius: '0.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}
              labelStyle={{ color: 'var(--color-text-primary)', fontWeight: 'bold' }}
              itemStyle={{ color: 'var(--color-text-secondary)' }}
            />
            <Legend wrapperStyle={{ color: 'var(--color-text-secondary)', fontSize: '12px' }}/>
            <Bar dataKey="ingresos" fill="var(--color-success)" name="Ingresos" radius={[4, 4, 0, 0]} />
            <Bar dataKey="gastos" fill="var(--color-danger)" name="Gastos" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Expense Breakdown */}
      <div className="bg-[var(--color-secondary-bg)] p-4 rounded-xl shadow-lg border-t-2 border-[var(--color-accent)]">
        <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-1">Desglose de Gastos</h3>
        <p className="text-xs text-[var(--color-text-secondary)] mb-3">Por concepto - Período: {timeFilter}</p>
        
        {financialData.expenseBreakdown.length > 0 ? (
          <>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={financialData.expenseBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="var(--color-accent)"
                  dataKey="value"
                  label={renderCustomizedPieLabel}
                >
                  {financialData.expenseBreakdown.map((entry, index) => (
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
              {financialData.expenseBreakdown.map((item, index) => (
                <div key={item.conceptId}>
                  <div className="flex justify-between items-center text-sm text-[var(--color-text-primary)]">
                    <span className="font-medium">{item.name}</span>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold">{CURRENCY_FORMATTER.format(item.value)}</span>
                      {(item.name === 'Mano de Obra' || item.name === 'Materiales de Construcción') && item.value > 0 && (
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="text-xs px-1 py-0.5 text-[var(--color-accent)]" 
                          onClick={() => handleOpenDetailModal(item.name === 'Mano de Obra' ? 'Pago a Empleados' : 'Compra de Materiales')}
                        >
                          Detalles
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="w-full bg-[var(--color-border)] rounded-full h-2 mt-1">
                    <div 
                      className="h-2 rounded-full" 
                      style={{ 
                        width: `${(item.value / Math.max(1, financialData.expenseBreakdown.reduce((s,i) => s + i.value, 0))) * 100}%`, 
                        backgroundColor: PIE_COLORS[index % PIE_COLORS.length] 
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="text-[var(--color-text-secondary)] text-center py-8">No hay gastos registrados para este período.</p>
        )}
      </div>

      {/* Accounts Receivable */}
      <div className="bg-[var(--color-secondary-bg)] p-4 rounded-xl shadow-lg border-t-2 border-[var(--color-warning)]">
        <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-1">Cuentas por Cobrar</h3>
        <p className="text-xs text-[var(--color-text-secondary)] mb-3">
          Total pendiente: {CURRENCY_FORMATTER.format(accountsReceivable.reduce((sum, job) => sum + job.amountDue, 0))}
        </p>
        
        {accountsReceivable.length > 0 ? (
          <div className="space-y-3 max-h-96 overflow-y-auto styled-scrollbar pr-1">
            {accountsReceivable.map(jobAccount => (
              <div key={jobAccount.id} className="bg-[var(--color-primary-app)] p-3 rounded-lg shadow-md border-l-2 border-[var(--color-warning)]">
                <div className="flex justify-between items-start mb-2">
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
                
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm">
                    {jobAccount.overdueDays > 0 
                      ? <span className="text-red-400 font-bold">Vencido: {jobAccount.overdueDays} día(s)</span>
                      : jobAccount.status === JobStatus.Completed 
                        ? <span className="text-yellow-400">Vence: Hoy/Próximamente</span> 
                        : <span className="text-blue-400">Vence en: {jobAccount.daysUntilDue} día(s)</span>
                    }
                    <span className="text-xs text-[var(--color-text-secondary)] ml-2">
                      ({new Date(jobAccount.dueDate).toLocaleDateString('es-CO')})
                    </span>
                  </p>
                  <span className="font-bold text-lg text-[var(--color-warning)]">
                    {CURRENCY_FORMATTER.format(jobAccount.amountDue)}
                  </span>
                </div>
                
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-xs flex-1" 
                    onClick={() => handleOpenReminderModal(jobAccount)}
                    leftIcon={<BellAlertIcon className="w-3.5 h-3.5"/>}
                  >
                    Recordatorio
                  </Button>
                  <Button 
                    variant="primary" 
                    size="sm" 
                    className="text-xs flex-1" 
                    onClick={() => handleQuickPayment(jobAccount)}
                  >
                    Marcar Pagado
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[var(--color-text-secondary)] text-center py-4">No hay cuentas por cobrar pendientes.</p>
        )}
      </div>

      {/* Profitability Analysis */}
      <div className="bg-[var(--color-secondary-bg)] p-4 rounded-xl shadow-lg border-t-2 border-[var(--color-success)]">
        <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-1">Análisis de Rentabilidad</h3>
        <p className="text-xs text-[var(--color-text-secondary)] mb-3">
          Proyectos finalizados: {profitabilityAnalysis.totalProjects} | 
          Margen promedio: {profitabilityAnalysis.averages.avgMargin.toFixed(1)}%
        </p>
        
        {profitabilityAnalysis.averages.avgMargin > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <p className="text-xs text-[var(--color-text-secondary)]">Ingreso Promedio</p>
              <p className="text-lg font-bold text-[var(--color-success)]">
                {CURRENCY_FORMATTER.format(profitabilityAnalysis.averages.avgRevenue)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-[var(--color-text-secondary)]">Costo Promedio</p>
              <p className="text-lg font-bold text-[var(--color-danger)]">
                {CURRENCY_FORMATTER.format(profitabilityAnalysis.averages.avgCost)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-[var(--color-text-secondary)]">Utilidad Promedio</p>
              <p className="text-lg font-bold text-[var(--color-accent)]">
                {CURRENCY_FORMATTER.format(profitabilityAnalysis.averages.avgProfit)}
              </p>
            </div>
          </div>
        )}
        
        {profitabilityAnalysis.projects.length > 0 ? (
          <div className="space-y-3 max-h-80 overflow-y-auto styled-scrollbar pr-1">
            {profitabilityAnalysis.projects.slice(0, 10).map(project => (
              <div key={project.id} className="bg-[var(--color-primary-app)] p-3 rounded-lg shadow-md">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-semibold text-[var(--color-text-primary)]">{project.name}</p>
                    <p className="text-xs text-[var(--color-text-secondary)]">Cliente: {project.clientName}</p>
                  </div>
                  <span className={`text-sm font-bold ${project.profit >= 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'}`}>
                    {project.margin.toFixed(1)}%
                  </span>
                </div>
                
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <p className="text-[var(--color-text-secondary)]">Ingreso</p>
                    <p className="font-medium text-[var(--color-text-primary)]">
                      {CURRENCY_FORMATTER.format(project.revenue)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[var(--color-text-secondary)]">Costo</p>
                    <p className="font-medium text-[var(--color-text-primary)]">
                      {CURRENCY_FORMATTER.format(project.cost)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[var(--color-text-secondary)]">Utilidad</p>
                    <p className={`font-bold ${project.profit >= 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'}`}>
                      {CURRENCY_FORMATTER.format(project.profit)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[var(--color-text-secondary)] text-center py-4">No hay proyectos finalizados para analizar.</p>
        )}
      </div>

      {/* Job Status Distribution */}
      <div className="bg-[var(--color-secondary-bg)] p-4 rounded-xl shadow-lg border-t-2 border-[var(--color-accent)]">
        <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-3">Distribución de Trabajos</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {jobsData.jobsByStatus.map((statusData, index) => (
            <div key={statusData.status} className="text-center">
              <div className="w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center text-white font-bold text-lg" 
                   style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}>
                {statusData.count}
              </div>
              <p className="text-xs text-[var(--color-text-secondary)] mb-1">{statusData.status}</p>
              <p className="text-xs font-medium text-[var(--color-text-primary)]">
                {CURRENCY_FORMATTER.format(statusData.revenue)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Modals */}
      {isEmployeeDetailModalOpen && (
        <EmployeePaymentsDetailModal
          isOpen={isEmployeeDetailModalOpen}
          onClose={() => setIsEmployeeDetailModalOpen(false)}
          payments={jobsData.employeePayments.details}
        />
      )}
      
      {isMaterialDetailModalOpen && (
        <MaterialCostsDetailModal
          isOpen={isMaterialDetailModalOpen}
          onClose={() => setIsMaterialDetailModalOpen(false)}
          costs={jobsData.materialCosts.details}
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
