

import React, { useState, useEffect, useMemo } from 'react';
import { Transaction, Concept, TransactionType } from '../../types';
import { getTransactions, getConcepts, addTransaction, updateTransaction, deleteTransaction, generateId, addConcept } from '../../utils/localStorageManager';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import PlusCircleIcon from '../../components/icons/PlusCircleIcon';
import PencilIcon from '../../components/icons/PencilIcon';
import TrashIcon from '../../components/icons/TrashIcon';
import { CURRENCY_FORMATTER } from '../../constants';
import ConfirmModal from '../../components/modals/ConfirmModal';
import AlertModal from '../../components/modals/AlertModal';
import Select from '../../components/ui/Select';
import Modal from '../../components/ui/Modal';

const Card: React.FC<{title: string; children: React.ReactNode; className?: string}> = ({title, children, className}) => (
    <div className={`bg-[var(--color-secondary-bg)] p-5 rounded-2xl border border-[var(--color-border)] ${className}`}>
        <h3 className="text-lg font-bold text-white mb-4 border-b border-[var(--color-border)] pb-2">{title}</h3>
        {children}
    </div>
);

const TransactionFormModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (transaction: Omit<Transaction, 'id'> | Transaction) => void;
    concepts: Concept[];
    transaction?: Transaction | null;
    onAddNewConcept: () => void;
}> = ({ isOpen, onClose, onSave, concepts, transaction, onAddNewConcept }) => {
    const [date, setDate] = useState('');
    const [type, setType] = useState<TransactionType>('EGRESO');
    const [amount, setAmount] = useState('');
    const [conceptId, setConceptId] = useState('');
    const [receiptNumber, setReceiptNumber] = useState('');
    const [responsible, setResponsible] = useState('');
    const [notes, setNotes] = useState('');
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');

    useEffect(() => {
        if (isOpen) {
            if (transaction) {
                setDate(transaction.date.split('T')[0]);
                setType(transaction.type);
                setAmount(String(transaction.amount));
                setConceptId(transaction.conceptId);
                setReceiptNumber(transaction.receiptNumber || '');
                setResponsible(transaction.responsible || '');
                setNotes(transaction.notes || '');
            } else {
                setDate(new Date().toISOString().split('T')[0]);
                setType('EGRESO');
                setAmount('');
                setConceptId('');
                setReceiptNumber('');
                setResponsible('');
                setNotes('');
            }
        }
    }, [transaction, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount || Number(amount) <= 0 || !conceptId || !date) {
            setAlertMessage("Fecha, concepto y monto son obligatorios. El monto debe ser mayor a cero.");
            setIsAlertOpen(true);
            return;
        }
        const transactionData = {
            date,
            type,
            amount: Number(amount),
            conceptId,
            receiptNumber,
            responsible,
            notes
        };

        if (transaction?.id) {
            onSave({ ...transactionData, id: transaction.id });
        } else {
            onSave(transactionData);
        }
    };
    
    const conceptOptions = useMemo(() => {
        return concepts.map(c => ({value: c.id, label: c.name}));
    }, [concepts]);

    return (
        <>
            <Modal
                isOpen={isOpen}
                onClose={onClose}
                title={transaction ? 'Editar Transacción' : 'Nueva Transacción'}
                footer={
                    <div className="flex justify-end gap-2">
                         <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                         <Button variant="primary" type="submit" form="transaction-form">{transaction ? 'Guardar Cambios' : 'Añadir Transacción'}</Button>
                    </div>
                }
            >
                <form id="transaction-form" onSubmit={handleSubmit} className="space-y-4 text-left">
                    <Input label="Fecha" type="date" value={date} onChange={e => setDate(e.target.value)} required />
                    <div>
                        <label className="block text-sm font-bold text-[var(--color-text-secondary)] mb-1.5">Tipo</label>
                        <div className="flex w-full bg-[var(--color-primary-app)] rounded-full p-1">
                            <button type="button" onClick={() => setType('INGRESO')} className={`w-1/2 rounded-full py-2 text-sm font-bold transition-colors ${type === 'INGRESO' ? 'bg-green-500 text-white shadow-md' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]'}`}>Ingreso</button>
                            <button type="button" onClick={() => setType('EGRESO')} className={`w-1/2 rounded-full py-2 text-sm font-bold transition-colors ${type === 'EGRESO' ? 'bg-red-500 text-white shadow-md' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]'}`}>Egreso</button>
                        </div>
                    </div>
                    <Input label="Monto (COP)" type="number" placeholder="0" value={amount} onChange={e => setAmount(e.target.value)} required />
                    <div className="flex items-end gap-2">
                        <Select label="Concepto / Categoría" options={conceptOptions} value={conceptId} onChange={e => setConceptId(e.target.value)} placeholder="Seleccione una categoría" required className="flex-grow" />
                        <Button type="button" onClick={onAddNewConcept} shape="rounded" className="p-3" title="Añadir Nuevo Concepto"><PlusCircleIcon className="w-5 h-5" /></Button>
                    </div>
                    <Input label="No. de Recibo (Opcional)" value={receiptNumber} onChange={e => setReceiptNumber(e.target.value)} />
                    <Input label="Responsable (Opcional)" value={responsible} onChange={e => setResponsible(e.target.value)} />
                     <div>
                        <label htmlFor="notes" className="block text-sm font-bold text-[var(--color-text-secondary)] mb-1.5">Notas (Opcional)</label>
                        <textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="block w-full px-4 py-3 bg-[var(--color-primary-app)] border border-[var(--color-border)] rounded-xl text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] sm:text-sm font-medium transition-colors" placeholder="Detalles adicionales..."/>
                    </div>
                </form>
            </Modal>
            <AlertModal isOpen={isAlertOpen} onClose={() => setIsAlertOpen(false)} title="Validación" message={alertMessage} />
        </>
    );
};

const ConceptFormModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (name: string) => void;
}> = ({isOpen, onClose, onSave}) => {
    const [name, setName] = useState('');
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            onSave(name.trim());
        }
    }
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Nuevo Concepto" footer={
            <div className="flex justify-end gap-2">
                 <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                 <Button variant="primary" type="submit" form="concept-form">Guardar</Button>
            </div>
        }>
             <form id="concept-form" onSubmit={handleSubmit}>
                <Input label="Nombre del Concepto" value={name} onChange={e => setName(e.target.value)} required />
            </form>
        </Modal>
    );
};

const TransactionsCalculator: React.FC = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [concepts, setConcepts] = useState<Concept[]>([]);
    const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
    const [isConceptModalOpen, setIsConceptModalOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
    const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
    const [filterDate, setFilterDate] = useState(new Date().toISOString().substring(0, 7)); // YYYY-MM format

    const fetchData = () => {
        setTransactions(getTransactions());
        setConcepts(getConcepts());
    };

    useEffect(() => {
        fetchData();
    }, []);

    const filteredTransactions = useMemo(() => {
        return transactions
            .filter(t => t.date.startsWith(filterDate))
            .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [transactions, filterDate]);

    const monthlySummary = useMemo(() => {
        const income = filteredTransactions.filter(t => t.type === 'INGRESO').reduce((sum, t) => sum + t.amount, 0);
        const expense = filteredTransactions.filter(t => t.type === 'EGRESO').reduce((sum, t) => sum + t.amount, 0);
        const balance = income - expense;
        return { income, expense, balance };
    }, [filteredTransactions]);

    const handleOpenTransactionModal = (transaction: Transaction | null = null) => {
        setEditingTransaction(transaction);
        setIsTransactionModalOpen(true);
    };

    const handleSaveTransaction = (data: Omit<Transaction, 'id'> | Transaction) => {
        if ('id' in data && data.id) {
            updateTransaction(data);
        } else {
            addTransaction({ ...data, id: generateId('trx-') });
        }
        fetchData();
        setIsTransactionModalOpen(false);
    };

    const handleSaveConcept = (name: string) => {
        const newConcept = { id: generateId('concept-'), name };
        addConcept(newConcept);
        fetchData();
        setIsConceptModalOpen(false);
    };

    const handleDeleteRequest = (transaction: Transaction) => {
        setTransactionToDelete(transaction);
        setIsConfirmDeleteOpen(true);
    };
    
    const confirmDelete = () => {
        if(transactionToDelete) {
            deleteTransaction(transactionToDelete.id);
            fetchData();
        }
        setIsConfirmDeleteOpen(false);
        setTransactionToDelete(null);
    };
    
    const getConceptName = (conceptId: string) => concepts.find(c => c.id === conceptId)?.name || "Desconocido";

    return (
        <div className="space-y-6">
            <Card title="Resumen Mensual">
                <Input type="month" value={filterDate} onChange={e => setFilterDate(e.target.value)} label="Seleccionar Mes" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-center">
                    <div className="bg-green-500/10 p-3 rounded-lg"><p className="text-sm text-green-300">Ingresos</p><p className="text-xl font-bold text-green-400">{CURRENCY_FORMATTER.format(monthlySummary.income)}</p></div>
                    <div className="bg-red-500/10 p-3 rounded-lg"><p className="text-sm text-red-300">Egresos</p><p className="text-xl font-bold text-red-400">{CURRENCY_FORMATTER.format(monthlySummary.expense)}</p></div>
                    <div className="bg-cyan-500/10 p-3 rounded-lg"><p className="text-sm text-cyan-300">Saldo</p><p className="text-xl font-bold text-cyan-400">{CURRENCY_FORMATTER.format(monthlySummary.balance)}</p></div>
                </div>
            </Card>

            <Card title="Historial de Transacciones">
                <div className="flex justify-end mb-4">
                    <Button onClick={() => handleOpenTransactionModal()} leftIcon={<PlusCircleIcon className="w-5 h-5"/>}>Nueva Transacción</Button>
                </div>
                <div className="space-y-3">
                    {filteredTransactions.length > 0 ? filteredTransactions.map(t => (
                        <div key={t.id} className="bg-[var(--color-primary-app)] p-3 rounded-lg flex items-center justify-between">
                            <div className="flex-grow overflow-hidden">
                                <p className={`font-bold text-lg ${t.type === 'INGRESO' ? 'text-green-400' : 'text-red-400'}`}>{CURRENCY_FORMATTER.format(t.amount)}</p>
                                <p className="text-sm text-white truncate">{getConceptName(t.conceptId)}</p>
                                <p className="text-xs text-[var(--color-text-secondary)]">{new Date(t.date).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                            </div>
                            <div className="flex-shrink-0 flex gap-1">
                                <Button variant="ghost" size="sm" onClick={() => handleOpenTransactionModal(t)} className="p-2"><PencilIcon className="w-4 h-4"/></Button>
                                <Button variant="danger" size="sm" onClick={() => handleDeleteRequest(t)} className="p-2"><TrashIcon className="w-4 h-4"/></Button>
                            </div>
                        </div>
                    )) : <p className="text-center text-[var(--color-text-secondary)] py-6">No hay transacciones para el mes seleccionado.</p>}
                </div>
            </Card>

            {isTransactionModalOpen && (
                <TransactionFormModal 
                    isOpen={isTransactionModalOpen}
                    onClose={() => setIsTransactionModalOpen(false)}
                    onSave={handleSaveTransaction}
                    concepts={concepts}
                    transaction={editingTransaction}
                    onAddNewConcept={() => setIsConceptModalOpen(true)}
                />
            )}
            
            {isConceptModalOpen && (
                <ConceptFormModal 
                    isOpen={isConceptModalOpen}
                    onClose={() => setIsConceptModalOpen(false)}
                    onSave={handleSaveConcept}
                />
            )}

            {transactionToDelete && (
                 <ConfirmModal 
                    isOpen={isConfirmDeleteOpen}
                    onClose={() => setIsConfirmDeleteOpen(false)}
                    onConfirm={confirmDelete}
                    title="Confirmar Eliminación"
                    message={`¿Está seguro de eliminar la transacción por ${CURRENCY_FORMATTER.format(transactionToDelete.amount)} (${getConceptName(transactionToDelete.conceptId)})?`}
                />
            )}
        </div>
    );
};

export default TransactionsCalculator;