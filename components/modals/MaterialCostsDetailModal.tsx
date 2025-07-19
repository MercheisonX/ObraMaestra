
import React from 'react';
import Modal from '../ui/Modal';
import { JobMaterial, Job } from '../../types';
import { CURRENCY_FORMATTER } from '../../constants';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface MaterialCostDetail {
  materialName: string;
  materialId: string;
  jobName: string;
  jobId: string;
  totalCost: number;
  quantity: number;
  unitPrice: number;
  unit: string;
  jobStartDate: string;
}

interface MaterialCostsDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  costs: MaterialCostDetail[]; // Derived data from FinancesPage
}

const MaterialCostsDetailModal: React.FC<MaterialCostsDetailModalProps> = ({ isOpen, onClose, costs }) => {
  if (!isOpen) return null;

  const aggregatedCosts = costs.reduce((acc, cost) => {
    const existing = acc.find(c => c.materialId === cost.materialId);
    if (existing) {
      existing.totalSpent += cost.totalCost;
      existing.jobs.push({ name: cost.jobName, amount: cost.totalCost, quantity: cost.quantity, unit: cost.unit });
    } else {
      acc.push({
        materialId: cost.materialId,
        materialName: cost.materialName,
        totalSpent: cost.totalCost,
        jobs: [{ name: cost.jobName, amount: cost.totalCost, quantity: cost.quantity, unit: cost.unit }],
      });
    }
    return acc;
  }, [] as { materialId: string; materialName: string; totalSpent: number; jobs: {name: string; amount: number; quantity: number; unit: string}[] }[])
  .sort((a,b) => b.totalSpent - a.totalSpent);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Detalle de Costos de Materiales" size="xl">
      <div className="space-y-4">
        {aggregatedCosts.length === 0 && <p className="text-gray-400">No hay datos de costos de materiales para mostrar.</p>}

        {aggregatedCosts.length > 0 && (
             <div className="mb-6">
                <h4 className="text-md font-semibold text-white mb-2">Costos Totales por Material</h4>
                <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={aggregatedCosts} layout="vertical" margin={{ top: 5, right: 20, left: 100, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis type="number" tickFormatter={(value) => CURRENCY_FORMATTER.format(value)} tick={{ fill: '#9ca3af', fontSize: 10 }} />
                        <YAxis dataKey="materialName" type="category" tick={{ fill: '#9ca3af', fontSize: 10 }} width={100} interval={0} />
                        <Tooltip 
                            formatter={(value: number) => CURRENCY_FORMATTER.format(value)}
                            contentStyle={{ backgroundColor: 'var(--color-secondary-bg)', border: '1px solid var(--color-border)', borderRadius: '0.5rem' }}
                            labelStyle={{ color: 'var(--color-text-primary)', fontWeight: 'bold' }}
                            itemStyle={{ color: 'var(--color-text-secondary)' }}
                         />
                        <Legend wrapperStyle={{fontSize: '12px'}} />
                        <Bar dataKey="totalSpent" name="Total Gastado" fill="var(--color-accent)" radius={[0, 4, 4, 0]} barSize={15} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        )}

        <h4 className="text-md font-semibold text-white mt-4 mb-2">Desglose de Costos por Trabajo:</h4>
        <div className="max-h-[40vh] overflow-y-auto space-y-3 pr-2 styled-scrollbar">
          {[...costs].sort((a,b) => b.totalCost - a.totalCost).map((cost, index) => (
            <div key={`${cost.jobId}-${cost.materialId}-${index}`} className="bg-[var(--color-primary-app)] p-3 rounded-md text-sm border-l-2 border-[var(--color-accent)]">
              <p className="font-semibold text-white">{cost.materialName}</p>
              <p className="text-gray-300">Trabajo: {cost.jobName}</p>
              <p className="text-gray-400">Costo Total: <span className="text-[var(--color-success)] font-medium">{CURRENCY_FORMATTER.format(cost.totalCost)}</span></p>
              <p className="text-xs text-gray-500">
                ({cost.quantity} {cost.unit} @ {CURRENCY_FORMATTER.format(cost.unitPrice)}/{cost.unit}) - Inicio Trabajo: {new Date(cost.jobStartDate).toLocaleDateString('es-CO')}
              </p>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
};

export default MaterialCostsDetailModal;