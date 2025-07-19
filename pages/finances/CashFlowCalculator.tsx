
import React, { useState, useMemo } from 'react';
import { getTransactions, getConcepts } from '../../utils/localStorageManager';
import { GroupedTransaction } from '../../types';
import { CURRENCY_FORMATTER } from '../../constants';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import TrashIcon from '../../components/icons/TrashIcon';
import PlusIcon from '../../components/icons/PlusIcon';
import Card from '../../components/ui/Card';

const DetailRow: React.FC<{label: string, value: number, isTotal?: boolean, isSubtle?: boolean, isNegative?: boolean}> = ({label, value, isTotal, isSubtle, isNegative}) => (
    <div className={`flex justify-between py-1.5 border-b border-transparent ${isTotal ? 'font-bold text-lg border-t pt-2 mt-2 border-[var(--color-border)]' : 'text-sm'} ${isSubtle ? 'text-[var(--color-text-secondary)]' : 'text-white'}`}>
        <span>{label}</span>
        <span className={`${isTotal && !isNegative ? 'text-[var(--color-accent)]' : ''} ${isNegative ? 'text-red-400' : ''}`}>{isNegative && value > 0 ? '-' : ''}{CURRENCY_FORMATTER.format(value)}</span>
    </div>
);

const CashFlowCalculator: React.FC = () => {
    const [year, setYear] = useState(new Date().getFullYear());
    const [month, setMonth] = useState(new Date().getMonth()); // 0-11
    const [report, setReport] = useState<any | null>(null);
    const [nonOperationalEntries, setNonOperationalEntries] = useState<{name: string, amount: number}[]>([]);
    const [newEntry, setNewEntry] = useState({name: '', amount: ''});

    const handleGenerateReport = () => {
        const transactions = getTransactions();
        const concepts = getConcepts();
        const getConceptName = (id: string) => concepts.find(c => c.id === id)?.name || 'Desconocido';

        // 1. Calculate Initial Balance
        const reportStartDate = new Date(year, month, 1);
        const initialBalance = transactions
            .filter(t => new Date(t.date) < reportStartDate)
            .reduce((balance, t) => balance + (t.type === 'INGRESO' ? t.amount : -t.amount), 0);
        
        // 2. Filter transactions for the selected month
        const monthlyTransactions = transactions.filter(t => {
            const tDate = new Date(t.date);
            return tDate.getFullYear() === year && tDate.getMonth() === month;
        });

        // 3. Group and sum transactions
        const incomeMap = new Map<string, number>();
        const expenseMap = new Map<string, number>();

        monthlyTransactions.forEach(t => {
            const map = t.type === 'INGRESO' ? incomeMap : expenseMap;
            const conceptName = getConceptName(t.conceptId);
            map.set(conceptName, (map.get(conceptName) || 0) + t.amount);
        });
        
        const operationalIncome: GroupedTransaction[] = Array.from(incomeMap, ([concept, total]) => ({concept, total}));
        const operationalExpense: GroupedTransaction[] = Array.from(expenseMap, ([concept, total]) => ({concept, total}));
        
        const totalOperationalIncome = operationalIncome.reduce((sum, item) => sum + item.total, 0);
        const totalOperationalExpense = operationalExpense.reduce((sum, item) => sum + item.total, 0);
        
        const grossCashFlow = initialBalance + totalOperationalIncome - totalOperationalExpense;
        
        const totalNonOperational = nonOperationalEntries.reduce((sum, item) => sum + item.amount, 0);
        
        const netCashFlow = grossCashFlow + totalNonOperational;
        const finalBalance = netCashFlow;

        setReport({
            initialBalance,
            operationalIncome,
            totalOperationalIncome,
            operationalExpense,
            totalOperationalExpense,
            grossCashFlow,
            nonOperationalEntries,
            totalNonOperational,
            netCashFlow,
            finalBalance,
            month,
            year
        });
    };
    
    const handleAddNonOpEntry = () => {
        if(newEntry.name && newEntry.amount) {
            setNonOperationalEntries(prev => [...prev, {name: newEntry.name, amount: Number(newEntry.amount)}]);
            setNewEntry({name: '', amount: ''});
        }
    };
    const handleRemoveNonOpEntry = (index: number) => {
        setNonOperationalEntries(prev => prev.filter((_, i) => i !== index));
    };

    const handleExportPDF = () => {
        if (!report) return;
        const doc = new jsPDF();
        const monthName = new Date(report.year, report.month).toLocaleString('es-CO', {month: 'long'});
        
        doc.setFontSize(18);
        doc.text(`Reporte de Flujo de Caja - ${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${report.year}`, 14, 22);

        const tableData = [
            ['Saldo Inicial del Mes', CURRENCY_FORMATTER.format(report.initialBalance)],
            ...report.operationalIncome.map((item: GroupedTransaction) => [`  (+) ${item.concept}`, CURRENCY_FORMATTER.format(item.total)]),
            ['Total Ingresos Operacionales', CURRENCY_FORMATTER.format(report.totalOperationalIncome)],
            ...report.operationalExpense.map((item: GroupedTransaction) => [`  (-) ${item.concept}`, `-${CURRENCY_FORMATTER.format(item.total)}`]),
            ['Total Egresos Operacionales', `-${CURRENCY_FORMATTER.format(report.totalOperationalExpense)}`],
            ['Flujo de Caja Bruto', CURRENCY_FORMATTER.format(report.grossCashFlow)],
             ...report.nonOperationalEntries.map((item: any) => [`  (±) ${item.name}`, CURRENCY_FORMATTER.format(item.amount)]),
            ['Flujo de Caja Neto', CURRENCY_FORMATTER.format(report.netCashFlow)],
            ['Saldo Final de Caja', CURRENCY_FORMATTER.format(report.finalBalance)],
        ];

        autoTable(doc, {
            startY: 30,
            head: [['Concepto', 'Monto']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [34, 211, 238] },
            styles: { fontSize: 10 },
            columnStyles: { 1: { halign: 'right' } }
        });

        doc.save(`Flujo_Caja_${monthName}_${report.year}.pdf`);
    };

    const yearOptions = Array.from({length: 10}, (_, i) => new Date().getFullYear() - i).map(y => ({value: y, label: String(y)}));
    const monthOptions = useMemo(() => Array.from({length: 12}, (_, i) => ({ value: i, label: new Date(0, i).toLocaleString('es-CO', {month: 'long'}) })), []);

    return (
        <div className="space-y-6">
            <Card title="Generar Reporte de Flujo de Caja">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <Select label="Año" options={yearOptions} value={year} onChange={e => setYear(Number(e.target.value))} />
                    <Select label="Mes" options={monthOptions} value={month} onChange={e => setMonth(Number(e.target.value))} />
                    <Button onClick={handleGenerateReport} className="h-fit">Generar Reporte</Button>
                </div>
            </Card>

            {report && (
                <div className="space-y-6 animate-fadeIn">
                    <Card title={`Reporte para ${new Date(report.year, report.month).toLocaleString('es-CO', {month: 'long', year: 'numeric'})}`}>
                        <DetailRow label="Saldo Inicial del Mes" value={report.initialBalance} />
                        <hr className="border-[var(--color-border)] my-2" />
                        <p className="font-semibold text-white mt-2">Ingresos Operacionales:</p>
                        {report.operationalIncome.map((item: GroupedTransaction) => <DetailRow key={item.concept} label={`(+) ${item.concept}`} value={item.total} isSubtle />)}
                        <DetailRow label="Total Ingresos Operacionales" value={report.totalOperationalIncome} isTotal />
                         <hr className="border-[var(--color-border)] my-2" />
                        <p className="font-semibold text-white mt-2">Egresos Operacionales:</p>
                        {report.operationalExpense.map((item: GroupedTransaction) => <DetailRow key={item.concept} label={`(-) ${item.concept}`} value={item.total} isSubtle />)}
                        <DetailRow label="Total Egresos Operacionales" value={report.totalOperationalExpense} isTotal isNegative/>
                        <hr className="border-[var(--color-border)] my-2" />
                        <DetailRow label="Flujo de Caja Bruto" value={report.grossCashFlow} />
                         <hr className="border-[var(--color-border)] my-2" />
                        <p className="font-semibold text-white mt-2">Ingresos/Egresos No Operacionales:</p>
                        {nonOperationalEntries.map((entry, index) => (
                           <div key={index} className="flex justify-between items-center ml-4">
                             <DetailRow label={`(±) ${entry.name}`} value={entry.amount} isSubtle />
                             <Button size="sm" variant="danger" onClick={() => handleRemoveNonOpEntry(index)} className="p-1"><TrashIcon className="w-4 h-4" /></Button>
                           </div>
                        ))}
                        <div className="flex gap-2 my-2 ml-4">
                            <Input placeholder="Concepto no operacional" value={newEntry.name} onChange={e => setNewEntry({...newEntry, name: e.target.value})} />
                            <Input type="number" placeholder="Monto (+/-)" value={newEntry.amount} onChange={e => setNewEntry({...newEntry, amount: e.target.value})} />
                            <Button onClick={handleAddNonOpEntry} shape="rounded" className="p-3"><PlusIcon className="w-5 h-5"/></Button>
                        </div>
                        <hr className="border-[var(--color-border)] my-2" />
                        <DetailRow label="Flujo de Caja Neto" value={report.netCashFlow} />
                        <hr className="border-[var(--color-border)] my-2" />
                        <DetailRow label="Saldo Final de Caja" value={report.finalBalance} isTotal />
                    
                        <div className="flex justify-end gap-2 mt-6">
                            <Button onClick={handleGenerateReport} variant="secondary">Regenerar</Button>
                            <Button onClick={handleExportPDF} variant="primary">Exportar PDF</Button>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default CashFlowCalculator;