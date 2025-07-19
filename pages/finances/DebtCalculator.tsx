
import React, { useState, useMemo, useEffect } from 'react';
import { CURRENCY_FORMATTER } from '../../constants';
import { getDebtCalculatorData, saveDebtCalculatorData, generateId } from '../../utils/localStorageManager';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import TrashIcon from '../../components/icons/TrashIcon';
import PlusIcon from '../../components/icons/PlusIcon';
import Modal from '../../components/ui/Modal';
import Card from '../../components/ui/Card';

interface Debt {
    id: string;
    name: string;
    balance: number;
    annualRate: number; // E.A.
    minPayment: number;
}

type Strategy = 'avalanche' | 'snowball';

const DebtCalculator: React.FC = () => {
    const [debts, setDebts] = useState<Debt[]>([]);
    const [extraPayment, setExtraPayment] = useState<number>(0);
    const [strategy, setStrategy] = useState<Strategy>('avalanche');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newDebt, setNewDebt] = useState<Omit<Debt, 'id'>>({ name: '', balance: 0, annualRate: 0, minPayment: 0});
    
    useEffect(() => {
        const savedData = getDebtCalculatorData();
        if (savedData) {
            setDebts(savedData.debts || []);
            setExtraPayment(savedData.extraPayment || 0);
        }
    }, []);

    const paymentPlan = useMemo(() => {
        if (debts.length === 0) return null;

        const runSimulation = (simStrategy: Strategy) => {
            let currentDebts = JSON.parse(JSON.stringify(debts.map(d => ({...d, monthlyRate: Math.pow(1 + d.annualRate / 100, 1/12) - 1}))));
            let months = 0;
            let totalInterestPaid = 0;
            const schedule = [];

            while (currentDebts.some(d => d.balance > 0) && months < 600) { // 50 year limit
                months++;
                let monthInterest = 0;
                let monthPrincipal = 0;
                let availableExtra = extraPayment;

                // 1. Accrue interest
                for (const debt of currentDebts) {
                    const interest = debt.balance * debt.monthlyRate;
                    debt.balance += interest;
                    totalInterestPaid += interest;
                    monthInterest += interest;
                }
                
                // 2. Pay minimums
                for (const debt of currentDebts) {
                    const payment = Math.min(debt.balance, debt.minPayment);
                    debt.balance -= payment;
                    monthPrincipal += payment;
                    if (payment < debt.minPayment) {
                        availableExtra += (debt.minPayment - payment);
                    }
                }

                // 3. Apply extra payment
                const sortedDebts = simStrategy === 'avalanche' 
                    ? [...currentDebts].sort((a,b) => b.annualRate - a.annualRate)
                    : [...currentDebts].sort((a,b) => a.balance - b.balance);
                
                for (const debt of sortedDebts) {
                    if(availableExtra <= 0) break;
                    const payment = Math.min(debt.balance, availableExtra);
                    debt.balance -= payment;
                    monthPrincipal += payment;
                    availableExtra -= payment;
                }
                
                schedule.push({ month: months, principal: monthPrincipal, interest: monthInterest, remainingBalance: currentDebts.reduce((sum,d)=>sum+d.balance,0) });
                currentDebts = currentDebts.filter(d => d.balance > 0.01);
            }
            return { months, totalInterestPaid };
        };

        const plan = runSimulation(strategy);
        const baseline = runSimulation('avalanche'); // Use avalanche as baseline with 0 extra
        return { ...plan, baseline };

    }, [debts, extraPayment, strategy]);

    const handleAddDebt = () => {
        if(newDebt.name && newDebt.balance > 0 && newDebt.annualRate >= 0 && newDebt.minPayment > 0) {
            setDebts([...debts, {...newDebt, id: generateId('debt-')}]);
            setIsModalOpen(false);
            setNewDebt({ name: '', balance: 0, annualRate: 0, minPayment: 0});
        }
    };
    
    const handleRemoveDebt = (id: string) => {
        setDebts(debts.filter(d => d.id !== id));
    };

    const handleSaveData = () => {
        saveDebtCalculatorData({ debts, extraPayment });
        alert('¡Plan de deudas guardado exitosamente!');
    };

    return (
        <div className="space-y-6">
            <Card title="Administración de Deudas">
                <div className="space-y-3">
                    {debts.map(debt => (
                        <div key={debt.id} className="flex justify-between items-center bg-[var(--color-primary-app)] p-3 rounded-lg">
                            <div>
                                <p className="font-semibold">{debt.name}</p>
                                <p className="text-sm text-[var(--color-text-secondary)]">{CURRENCY_FORMATTER.format(debt.balance)} @ {debt.annualRate}% E.A.</p>
                            </div>
                            <Button variant="danger" size="sm" onClick={() => handleRemoveDebt(debt.id)} className="p-1"><TrashIcon className="w-4 h-4"/></Button>
                        </div>
                    ))}
                    <Button variant="outline" fullWidth onClick={() => setIsModalOpen(true)} leftIcon={<PlusIcon className="w-5 h-5"/>}>Añadir Deuda</Button>
                </div>
                <div className="mt-4">
                    <Input label="Abono Extra Mensual (COP)" type="number" value={extraPayment || ''} onChange={e => setExtraPayment(Number(e.target.value))} />
                </div>
            </Card>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Añadir Nueva Deuda">
                <div className="space-y-4">
                    <Input label="Nombre de la Deuda" value={newDebt.name} onChange={e => setNewDebt({...newDebt, name: e.target.value})}/>
                    <Input label="Saldo Total Actual (COP)" type="number" value={newDebt.balance || ''} onChange={e => setNewDebt({...newDebt, balance: Number(e.target.value)})}/>
                    <Input label="Tasa de Interés E.A. (%)" type="number" value={newDebt.annualRate || ''} onChange={e => setNewDebt({...newDebt, annualRate: Number(e.target.value)})}/>
                    <Input label="Pago Mínimo Mensual (COP)" type="number" value={newDebt.minPayment || ''} onChange={e => setNewDebt({...newDebt, minPayment: Number(e.target.value)})}/>
                    <div className="flex justify-end gap-2">
                        <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                        <Button variant="primary" onClick={handleAddDebt}>Añadir</Button>
                    </div>
                </div>
            </Modal>
            
            {debts.length > 0 && (
                <div className="space-y-6 animate-fadeIn">
                    <Card title="Estrategia de Pago">
                        <div className="flex w-full bg-[var(--color-primary-app)] rounded-full p-1">
                            <button onClick={() => setStrategy('avalanche')} className={`w-1/2 rounded-full py-2 text-sm font-bold transition-colors ${strategy === 'avalanche' ? 'bg-[var(--color-accent)] text-[var(--color-primary-app)] shadow-md' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]'}`}>
                                Avalancha
                            </button>
                            <button onClick={() => setStrategy('snowball')} className={`w-1/2 rounded-full py-2 text-sm font-bold transition-colors ${strategy === 'snowball' ? 'bg-[var(--color-accent)] text-[var(--color-primary-app)] shadow-md' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]'}`}>
                                Bola de Nieve
                            </button>
                        </div>
                        <p className="text-xs text-center text-[var(--color-text-secondary)] mt-2">
                            {strategy === 'avalanche' 
                                ? 'Prioriza pagar la deuda con la tasa de interés más alta primero.'
                                : 'Prioriza pagar la deuda con el saldo más bajo primero.'}
                        </p>
                    </Card>

                    {paymentPlan && (
                        <Card title="Resultados del Plan">
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-center">
                                <div className="bg-[var(--color-primary-app)] p-4 rounded-lg">
                                    <p className="text-sm text-[var(--color-text-secondary)]">Libre de Deudas en</p>
                                    <p className="text-3xl font-bold text-[var(--color-accent)]">{paymentPlan.months} meses</p>
                                </div>
                                <div className="bg-[var(--color-primary-app)] p-4 rounded-lg">
                                    <p className="text-sm text-[var(--color-text-secondary)]">Total Intereses Pagados</p>
                                    <p className="text-3xl font-bold text-[var(--color-accent)]">{CURRENCY_FORMATTER.format(paymentPlan.totalInterestPaid)}</p>
                                </div>
                                <div className="bg-green-500/10 p-4 rounded-lg md:col-span-2">
                                    <p className="text-sm text-green-300">Ahorro vs. Pagos Mínimos</p>
                                    <p className="text-xl font-bold text-green-400">
                                        {CURRENCY_FORMATTER.format(paymentPlan.baseline.totalInterestPaid - paymentPlan.totalInterestPaid)} en intereses y {paymentPlan.baseline.months - paymentPlan.months} meses
                                    </p>
                                </div>
                             </div>
                        </Card>
                    )}
                </div>
            )}
             
            <Button onClick={handleSaveData} fullWidth shape="rounded" size="lg">Guardar Plan</Button>
        </div>
    );
};

export default DebtCalculator;