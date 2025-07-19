
import React, { useState, useMemo, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { CURRENCY_FORMATTER, SMMLV_2024, UVT_2024 } from '../../constants';
import { getSalaryCalculatorData, saveSalaryCalculatorData, generateId } from '../../utils/localStorageManager';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import TrashIcon from '../../components/icons/TrashIcon';
import PlusIcon from '../../components/icons/PlusIcon';

const PIE_COLORS = ['#22d3ee', '#f87171', '#34d399']; // Accent (Savings), Danger (Expenses), Success (Available)

interface Expense {
    id: string;
    name: string;
    amount: number;
}

const Card: React.FC<{title: string; children: React.ReactNode; className?: string}> = ({title, children, className}) => (
    <div className={`bg-[var(--color-secondary-bg)] p-5 rounded-2xl border border-[var(--color-border)] ${className}`}>
        <h3 className="text-lg font-bold text-white mb-4 border-b border-[var(--color-border)] pb-2">{title}</h3>
        {children}
    </div>
);

const SalaryCalculator: React.FC = () => {
    const [grossSalary, setGrossSalary] = useState<number>(0);
    const [savingsPercentage, setSavingsPercentage] = useState<number>(10);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [newExpense, setNewExpense] = useState({ name: '', amount: '' });

    useEffect(() => {
        const savedData = getSalaryCalculatorData();
        if (savedData) {
            setGrossSalary(savedData.grossSalary || 0);
            setSavingsPercentage(savedData.savingsPercentage || 10);
            setExpenses(savedData.expenses || []);
        }
    }, []);

    const calculations = useMemo(() => {
        if (grossSalary <= 0) return null;

        const health = grossSalary * 0.04;
        const pension = grossSalary * 0.04;

        let fsp = 0;
        const salaryInSMMLV = grossSalary / SMMLV_2024;
        if (salaryInSMMLV >= 4) {
            if (salaryInSMMLV >= 4 && salaryInSMMLV < 16) fsp = grossSalary * 0.01;
            else if (salaryInSMMLV >= 16 && salaryInSMMLV < 17) fsp = grossSalary * 0.012;
            else if (salaryInSMMLV >= 17 && salaryInSMMLV < 18) fsp = grossSalary * 0.014;
            else if (salaryInSMMLV >= 18 && salaryInSMMLV < 19) fsp = grossSalary * 0.016;
            else if (salaryInSMMLV >= 19 && salaryInSMMLV < 20) fsp = grossSalary * 0.018;
            else fsp = grossSalary * 0.02;
        }

        const totalDeductionsBeforeRetefuente = health + pension + fsp;
        const baseForExemptIncome = grossSalary - totalDeductionsBeforeRetefuente;
        const exemptIncome = baseForExemptIncome * 0.25;
        const exemptIncomeCap = 790 * UVT_2024 / 12; // Monthly cap
        const finalExemptIncome = Math.min(exemptIncome, exemptIncomeCap);

        const taxableBaseInCOP = baseForExemptIncome - finalExemptIncome;
        const taxableBaseInUVT = taxableBaseInCOP > 0 ? taxableBaseInCOP / UVT_2024 : 0;

        let withholdingTax = 0;
        if (taxableBaseInUVT > 360) {
            withholdingTax = (taxableBaseInUVT - 360) * 0.39 + 69 * UVT_2024;
        } else if (taxableBaseInUVT > 150) {
            withholdingTax = (taxableBaseInUVT - 150) * 0.28 + 10 * UVT_2024;
        } else if (taxableBaseInUVT > 95) {
            withholdingTax = (taxableBaseInUVT - 95) * 0.19;
            withholdingTax = withholdingTax * UVT_2024;
        }
        
        const totalDeductions = totalDeductionsBeforeRetefuente + withholdingTax;
        const netSalary = grossSalary - totalDeductions;
        const savingsAmount = netSalary * (savingsPercentage / 100);
        const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
        const cashFlow = netSalary - savingsAmount - totalExpenses;
        
        return { health, pension, fsp, withholdingTax, totalDeductions, netSalary, savingsAmount, totalExpenses, cashFlow };
    }, [grossSalary, expenses, savingsPercentage]);

    const handleAddExpense = () => {
        if (newExpense.name && newExpense.amount) {
            setExpenses([...expenses, { id: generateId('exp-'), name: newExpense.name, amount: Number(newExpense.amount) }]);
            setNewExpense({ name: '', amount: '' });
        }
    };

    const handleRemoveExpense = (id: string) => {
        setExpenses(expenses.filter(exp => exp.id !== id));
    };

    const handleSaveData = () => {
        saveSalaryCalculatorData({ grossSalary, savingsPercentage, expenses });
        alert('¡Datos guardados exitosamente!');
    };

    const budgetChartData = useMemo(() => {
        if (!calculations) return [];
        return [
            { name: 'Ahorro', value: calculations.savingsAmount },
            { name: 'Gastos', value: calculations.totalExpenses },
            { name: 'Disponible', value: Math.max(0, calculations.cashFlow) } // Don't show negative in chart
        ].filter(item => item.value > 0);
    }, [calculations]);

    return (
        <div className="space-y-6">
            <Card title="Datos de Ingreso y Gastos">
                <div className="space-y-4">
                    <Input label="Salario Bruto Mensual (COP)" type="number" value={grossSalary || ''} onChange={e => setGrossSalary(Number(e.target.value))} placeholder="Ej: 3000000" />
                    <div>
                        <label className="block text-sm font-bold text-[var(--color-text-secondary)] mb-1.5">Meta de Ahorro ({savingsPercentage}%)</label>
                        <input type="range" min="0" max="100" value={savingsPercentage} onChange={e => setSavingsPercentage(Number(e.target.value))} className="w-full h-2 bg-[var(--color-border)] rounded-lg appearance-none cursor-pointer accent-[var(--color-accent)]" />
                    </div>
                    <div className="pt-4 border-t border-[var(--color-border)]">
                        <h4 className="text-md font-semibold text-white mb-2">Gastos Mensuales</h4>
                        <div className="flex gap-2 mb-3">
                            <Input placeholder="Nombre del Gasto" value={newExpense.name} onChange={e => setNewExpense({ ...newExpense, name: e.target.value })} />
                            <Input type="number" placeholder="Monto" value={newExpense.amount} onChange={e => setNewExpense({ ...newExpense, amount: e.target.value })} />
                            <Button onClick={handleAddExpense} shape="rounded" className="p-3"><PlusIcon className="w-5 h-5"/></Button>
                        </div>
                        <div className="space-y-2 max-h-40 overflow-y-auto styled-scrollbar pr-1">
                            {expenses.map(exp => (
                                <div key={exp.id} className="flex justify-between items-center bg-[var(--color-primary-app)] p-2 rounded-lg">
                                    <span className="text-sm">{exp.name}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium">{CURRENCY_FORMATTER.format(exp.amount)}</span>
                                        <Button variant="danger" size="sm" onClick={() => handleRemoveExpense(exp.id)} className="p-1"><TrashIcon className="w-4 h-4" /></Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </Card>

            {calculations && (
                <div className="space-y-6 animate-fadeIn">
                    <Card title="Resumen de Salario">
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                            <div>
                                <p className="text-sm text-[var(--color-text-secondary)]">Salario Bruto</p>
                                <p className="text-xl font-bold">{CURRENCY_FORMATTER.format(grossSalary)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-[var(--color-text-secondary)]">Total Deducciones</p>
                                <p className="text-xl font-bold text-red-400">-{CURRENCY_FORMATTER.format(calculations.totalDeductions)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-[var(--color-text-secondary)]">Salario Neto</p>
                                <p className="text-2xl font-bold text-[var(--color-accent)]">{CURRENCY_FORMATTER.format(calculations.netSalary)}</p>
                            </div>
                         </div>
                    </Card>

                    <Card title="Desglose de Deducciones">
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between"><span>Salud (4%)</span><span>-{CURRENCY_FORMATTER.format(calculations.health)}</span></div>
                            <div className="flex justify-between"><span>Pensión (4%)</span><span>-{CURRENCY_FORMATTER.format(calculations.pension)}</span></div>
                            {calculations.fsp > 0 && <div className="flex justify-between"><span>Fondo de Solidaridad</span><span>-{CURRENCY_FORMATTER.format(calculations.fsp)}</span></div>}
                            <div className="flex justify-between"><span>Retención en la Fuente</span><span>-{CURRENCY_FORMATTER.format(calculations.withholdingTax)}</span></div>
                        </div>
                    </Card>

                    <Card title="Presupuesto Mensual">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                            <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie data={budgetChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} label>
                                        {budgetChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip formatter={(value: number) => CURRENCY_FORMATTER.format(value)} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="space-y-3">
                                <div className={`p-3 rounded-lg text-center ${calculations.cashFlow >= 0 ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                                    <p className="text-sm text-[var(--color-text-secondary)]">Flujo de Caja Mensual</p>
                                    <p className={`text-2xl font-bold ${calculations.cashFlow >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        {CURRENCY_FORMATTER.format(calculations.cashFlow)}
                                    </p>
                                </div>
                                <div><p className="text-sm flex justify-between"><span>Salario Neto:</span> <span className="font-semibold">{CURRENCY_FORMATTER.format(calculations.netSalary)}</span></p></div>
                                <div><p className="text-sm flex justify-between"><span>- Ahorro Objetivo:</span> <span className="font-semibold">{CURRENCY_FORMATTER.format(calculations.savingsAmount)}</span></p></div>
                                <div><p className="text-sm flex justify-between"><span>- Gastos Totales:</span> <span className="font-semibold">{CURRENCY_FORMATTER.format(calculations.totalExpenses)}</span></p></div>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
            
            <Button onClick={handleSaveData} fullWidth shape="rounded" size="lg">Guardar Datos</Button>
        </div>
    );
};

export default SalaryCalculator;
