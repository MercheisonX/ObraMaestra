
import React, { useState, useMemo, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceDot } from 'recharts';
import { CURRENCY_FORMATTER } from '../../constants';
import { getBreakEvenData, saveBreakEvenData, generateId } from '../../utils/localStorageManager';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import TrashIcon from '../../components/icons/TrashIcon';
import PlusIcon from '../../components/icons/PlusIcon';
import Card from '../../components/ui/Card';

interface CostItem {
    id: string;
    name: string;
    amount: number;
}

const CostInputSection: React.FC<{
    title: string;
    costs: CostItem[];
    onAdd: (item: {name: string, amount: number}) => void;
    onRemove: (id: string) => void;
}> = ({ title, costs, onAdd, onRemove }) => {
    const [name, setName] = useState('');
    const [amount, setAmount] = useState('');

    const handleAdd = () => {
        if(name && amount) {
            onAdd({ name, amount: Number(amount) });
            setName('');
            setAmount('');
        }
    };

    const total = costs.reduce((sum, item) => sum + item.amount, 0);

    return (
        <div>
            <h4 className="text-md font-semibold text-white mb-2">{title}</h4>
            <div className="flex gap-2 mb-3">
                <Input placeholder="Nombre del Costo" value={name} onChange={e => setName(e.target.value)} />
                <Input type="number" placeholder="Monto" value={amount} onChange={e => setAmount(e.target.value)} />
                <Button onClick={handleAdd} shape="rounded" className="p-3"><PlusIcon className="w-5 h-5"/></Button>
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto styled-scrollbar pr-1">
                {costs.map(item => (
                    <div key={item.id} className="flex justify-between items-center bg-[var(--color-primary-app)] p-2 rounded-lg">
                        <span className="text-sm">{item.name}</span>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{CURRENCY_FORMATTER.format(item.amount)}</span>
                            <Button variant="danger" size="sm" onClick={() => onRemove(item.id)} className="p-1"><TrashIcon className="w-4 h-4" /></Button>
                        </div>
                    </div>
                ))}
            </div>
            <p className="text-right font-semibold mt-2">Total: {CURRENCY_FORMATTER.format(total)}</p>
        </div>
    );
}

const BreakEvenCalculator: React.FC = () => {
    const [fixedCosts, setFixedCosts] = useState<CostItem[]>([]);
    const [variableCosts, setVariableCosts] = useState<CostItem[]>([]);
    const [salePrice, setSalePrice] = useState<number>(0);

    useEffect(() => {
        const savedData = getBreakEvenData();
        if (savedData) {
            setFixedCosts(savedData.fixedCosts || []);
            setVariableCosts(savedData.variableCosts || []);
            setSalePrice(savedData.salePrice || 0);
        }
    }, []);

    const calculations = useMemo(() => {
        const totalFixedCosts = fixedCosts.reduce((sum, item) => sum + item.amount, 0);
        const totalVariableCostPerUnit = variableCosts.reduce((sum, item) => sum + item.amount, 0);
        const contributionMargin = salePrice - totalVariableCostPerUnit;

        if (contributionMargin <= 0) return null;

        const breakEvenUnits = totalFixedCosts / contributionMargin;
        const breakEvenRevenue = breakEvenUnits * salePrice;

        return { totalFixedCosts, totalVariableCostPerUnit, contributionMargin, breakEvenUnits, breakEvenRevenue };
    }, [fixedCosts, variableCosts, salePrice]);

    const chartData = useMemo(() => {
        if (!calculations || calculations.breakEvenUnits === Infinity) return [];
        const data = [];
        const maxUnits = Math.ceil(calculations.breakEvenUnits * 2);
        for (let i = 0; i <= maxUnits; i += Math.ceil(maxUnits / 10)) {
            data.push({
                units: i,
                Ingresos: i * salePrice,
                'Costos Totales': calculations.totalFixedCosts + (i * calculations.totalVariableCostPerUnit)
            });
        }
        return data;
    }, [calculations, salePrice]);

    const handleSaveData = () => {
        saveBreakEvenData({ fixedCosts, variableCosts, salePrice });
        alert('¡Simulación guardada exitosamente!');
    };

    return (
        <div className="space-y-6">
            <Card title="Datos del Negocio">
                <div className="space-y-6">
                    <CostInputSection 
                        title="Costos Fijos Mensuales"
                        costs={fixedCosts}
                        onAdd={(item) => setFixedCosts(prev => [...prev, {...item, id: generateId('cf-')}])}
                        onRemove={(id) => setFixedCosts(prev => prev.filter(c => c.id !== id))}
                    />
                    <CostInputSection 
                        title="Costos Variables por Unidad"
                        costs={variableCosts}
                        onAdd={(item) => setVariableCosts(prev => [...prev, {...item, id: generateId('cv-')}])}
                        onRemove={(id) => setVariableCosts(prev => prev.filter(c => c.id !== id))}
                    />
                    <Input label="Precio de Venta por Unidad (COP)" type="number" value={salePrice || ''} onChange={e => setSalePrice(Number(e.target.value))} />
                </div>
            </Card>

            {calculations ? (
                <div className="space-y-6 animate-fadeIn">
                    <Card title="Resultados del Punto de Equilibrio">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-center">
                            <div className="bg-[var(--color-primary-app)] p-4 rounded-lg">
                                <p className="text-sm text-[var(--color-text-secondary)]">Unidades a Vender</p>
                                <p className="text-3xl font-bold text-[var(--color-accent)]">{Math.ceil(calculations.breakEvenUnits).toLocaleString()}</p>
                                <p className="text-xs text-[var(--color-text-muted)]">para cubrir todos los costos.</p>
                            </div>
                             <div className="bg-[var(--color-primary-app)] p-4 rounded-lg">
                                <p className="text-sm text-[var(--color-text-secondary)]">Ventas Requeridas</p>
                                <p className="text-3xl font-bold text-[var(--color-accent)]">{CURRENCY_FORMATTER.format(calculations.breakEvenRevenue)}</p>
                                <p className="text-xs text-[var(--color-text-muted)]">en ingresos para alcanzar el equilibrio.</p>
                            </div>
                        </div>
                        <div className="mt-4 space-y-2 text-sm">
                            <div className="flex justify-between"><span>Total Costos Fijos:</span> <span className="font-semibold">{CURRENCY_FORMATTER.format(calculations.totalFixedCosts)}</span></div>
                            <div className="flex justify-between"><span>Costo Variable por Unidad:</span> <span className="font-semibold">{CURRENCY_FORMATTER.format(calculations.totalVariableCostPerUnit)}</span></div>
                            <div className="flex justify-between"><span>Margen de Contribución por Unidad:</span> <span className="font-semibold">{CURRENCY_FORMATTER.format(calculations.contributionMargin)}</span></div>
                        </div>
                    </Card>

                    <Card title="Gráfico de Equilibrio">
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                                <XAxis dataKey="units" label={{ value: 'Unidades Vendidas', position: 'insideBottom', offset: -5, fill: 'var(--color-text-secondary)' }} tick={{ fill: 'var(--color-text-secondary)' }} />
                                <YAxis tickFormatter={(value) => `${CURRENCY_FORMATTER.format(value/1000)}k`} tick={{ fill: 'var(--color-text-secondary)' }} />
                                <Tooltip formatter={(value: number) => CURRENCY_FORMATTER.format(value)} contentStyle={{ backgroundColor: 'var(--color-secondary-bg)', border: '1px solid var(--color-border)' }}/>
                                <Legend wrapperStyle={{ color: 'var(--color-text-primary)' }}/>
                                <Line type="monotone" dataKey="Ingresos" stroke="#22d3ee" strokeWidth={2} />
                                <Line type="monotone" dataKey="Costos Totales" stroke="#f87171" strokeWidth={2} />
                                <ReferenceDot x={calculations.breakEvenUnits} y={calculations.breakEvenRevenue} r={5} fill="#f59e0b" stroke="white" strokeWidth={2} label="Equilibrio" />
                            </LineChart>
                        </ResponsiveContainer>
                    </Card>
                </div>
            ) : (
                <Card title="Resultados del Punto de Equilibrio">
                    <p className="text-center text-[var(--color-text-secondary)]">Ingrese los costos y el precio de venta para ver los resultados. Asegúrese que el precio de venta sea mayor al costo variable por unidad.</p>
                </Card>
            )}
            
            <Button onClick={handleSaveData} fullWidth shape="rounded" size="lg">Guardar Simulación</Button>
        </div>
    );
}

export default BreakEvenCalculator;