
import React, { useState, useEffect, FormEvent } from 'react';
import { CompanyProfile, AdminProfile, CompanyFinancials, BudgetEntry, BudgetSource } from '../types';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import ImageUpload from '../components/ui/ImageUpload';
import BuildingOfficeIcon from '../components/icons/BuildingOfficeIcon';
import UserCircleIcon from '../components/icons/UserCircleIcon';
import BanknotesIcon from '../components/icons/BanknotesIcon';
import { CURRENCY_FORMATTER, BUDGET_SOURCE_OPTIONS, ITEMS_PER_LOAD_SETTINGS } from '../constants';
import { 
  getCompanyProfile, saveCompanyProfile, 
  getAdminProfile, saveAdminProfile,
  getCompanyFinancials, addBudgetEntry as addBudgetEntryToStorage,
  generateId
} from '../utils/localStorageManager';

import AlertModal from '../components/modals/AlertModal';
import Card from '../components/ui/Card';

const SettingsPage: React.FC = () => {
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>(getCompanyProfile());
  const [adminProfile, setAdminProfile] = useState<AdminProfile>(getAdminProfile());
  const [companyFinancials, setCompanyFinancials] = useState<CompanyFinancials>(getCompanyFinancials());

  const [visibleBudgetHistoryCount, setVisibleBudgetHistoryCount] = useState(ITEMS_PER_LOAD_SETTINGS);

  const [budgetEntryAmount, setBudgetEntryAmount] = useState<number>(0);
  const [budgetEntrySource, setBudgetEntrySource] = useState<BudgetSource>('efectivo');
  const [budgetEntryBankName, setBudgetEntryBankName] = useState('');
  const [budgetEntryDescription, setBudgetEntryDescription] = useState('');

  const [alertModalState, setAlertModalState] = useState<{isOpen: boolean; title: string; message: string}>({isOpen: false, title: '', message: ''});


  const fetchAllData = () => {
    setCompanyProfile(getCompanyProfile());
    setAdminProfile(getAdminProfile());
    setCompanyFinancials(getCompanyFinancials());
  }

  useEffect(() => { 
    fetchAllData();
  }, []);

  const handleCompanyProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setCompanyProfile({ ...companyProfile, [e.target.name]: e.target.value });
  };
   const handleCompanyLogoChange = (base64Image: string | null) => {
    setCompanyProfile({ ...companyProfile, logoUrl: base64Image || undefined });
  };

  const handleAdminProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAdminProfile({ ...adminProfile, [e.target.name]: e.target.value });
  };
  
  const handleSaveConfiguration = () => {
    saveCompanyProfile(companyProfile);
    saveAdminProfile(adminProfile);
    setAlertModalState({isOpen: true, title: "Éxito", message: "Configuración de perfiles guardada exitosamente."});
  };

  const handleAddBudgetEntry = (e: FormEvent) => {
    e.preventDefault();
    if (budgetEntryAmount <= 0) {
        setAlertModalState({isOpen: true, title: "Error de Validación", message: "El monto de la entrada al presupuesto debe ser mayor a cero."});
        return;
    }
    const newEntry: BudgetEntry = {
        id: generateId('budget-'),
        amount: budgetEntryAmount,
        source: budgetEntrySource,
        bankName: budgetEntrySource === 'banco' ? budgetEntryBankName : undefined,
        description: budgetEntryDescription,
        enteredBy: adminProfile.name || 'Admin',
        date: new Date().toISOString(),
    };
    addBudgetEntryToStorage(newEntry);
    setCompanyFinancials(getCompanyFinancials());
    setBudgetEntryAmount(0);
    setBudgetEntrySource('efectivo');
    setBudgetEntryBankName('');
    setBudgetEntryDescription('');
    setAlertModalState({isOpen: true, title: "Éxito", message: "Entrada de presupuesto agregada exitosamente."});
    setVisibleBudgetHistoryCount(ITEMS_PER_LOAD_SETTINGS);
  };

  const budgetHistoryToDisplay = companyFinancials.budgetHistory.slice().reverse().slice(0, visibleBudgetHistoryCount);

  return (
    <div className="px-6 pb-24 space-y-8">
      <Card title="Perfil de la Empresa" icon={<BuildingOfficeIcon />}>
        <div className="space-y-4">
          <ImageUpload
            label="Logo de la Empresa"
            currentImageUrl={companyProfile.logoUrl}
            onImageSelected={handleCompanyLogoChange}
          />
          <Input label="Nombre Legal" name="legalName" value={companyProfile.legalName} onChange={handleCompanyProfileChange} />
          <Input label="Razón Social (Nombre Comercial)" name="businessName" value={companyProfile.businessName} onChange={handleCompanyProfileChange} />
          <Input label="NIT" name="nit" value={companyProfile.nit} onChange={handleCompanyProfileChange} />
          <Input label="Dirección Fiscal" name="fiscalAddress" value={companyProfile.fiscalAddress} onChange={handleCompanyProfileChange} />
          <Input label="Teléfono" name="phone" type="tel" value={companyProfile.phone} onChange={handleCompanyProfileChange} />
          <Input label="Correo Electrónico" name="email" type="email" value={companyProfile.email} onChange={handleCompanyProfileChange} />
          <Input label="Datos Bancarios" name="bankDetails" value={companyProfile.bankDetails} onChange={handleCompanyProfileChange} />
        </div>
      </Card>

      <Card title="Perfil del Administrador" icon={<UserCircleIcon />}>
        <div className="space-y-4">
          <Input label="Nombre Administrador" name="name" value={adminProfile.name} onChange={handleAdminProfileChange} />
          <Input label="Cédula/Identificación" name="idNumber" value={adminProfile.idNumber} onChange={handleAdminProfileChange} />
          <Input label="Teléfono" name="phone" type="tel" value={adminProfile.phone} onChange={handleAdminProfileChange} />
          <Input label="Correo Electrónico" name="email" type="email" value={adminProfile.email} onChange={handleAdminProfileChange} />
        </div>
      </Card>
      
      <div className="mt-6">
        <Button 
            fullWidth 
            onClick={handleSaveConfiguration} 
            size="lg" 
            shape="rounded"
            className="bg-gradient-to-r from-cyan-400 to-blue-500 text-white font-bold"
        >
            Guardar Perfiles
        </Button>
      </div>
      <hr className="my-6 border-[var(--color-border)]"/>

      <Card title="Configuración de Finanzas" icon={<BanknotesIcon />}>
        <div className="space-y-6">
            <div>
                <h4 className="text-lg font-semibold text-white">Presupuesto Actual:</h4>
                <p className="text-3xl font-extrabold text-[var(--color-accent)]">{CURRENCY_FORMATTER.format(companyFinancials.currentBudget)}</p>
            </div>
            <form onSubmit={handleAddBudgetEntry} className="space-y-4 border-t border-[var(--color-border)] pt-6">
                <h4 className="text-md font-semibold text-white">Añadir Entrada al Presupuesto:</h4>
                <Input label="Monto (COP)" type="number" value={budgetEntryAmount.toString()} onChange={e => setBudgetEntryAmount(parseFloat(e.target.value) || 0)} min="0.01" step="any" required />
                <Select label="Fuente del Ingreso" options={BUDGET_SOURCE_OPTIONS} value={budgetEntrySource} onChange={e => setBudgetEntrySource(e.target.value as BudgetSource)} required/>
                {budgetEntrySource === 'banco' && (
                    <Input label="Nombre del Banco" value={budgetEntryBankName} onChange={e => setBudgetEntryBankName(e.target.value)} placeholder="Ej: Bancolombia"/>
                )}
                <Input label="Descripción Adicional (Opcional)" value={budgetEntryDescription} onChange={e => setBudgetEntryDescription(e.target.value)} placeholder="Ej: Inversión inicial, Préstamo"/>
                <Button type="submit" variant="primary" shape="rounded">Añadir al Presupuesto</Button>
            </form>

            <div className="border-t border-[var(--color-border)] pt-6">
                <h4 className="text-md font-semibold text-white mb-3">Historial de Entradas al Presupuesto:</h4>
                {companyFinancials.budgetHistory.length === 0 ? (
                    <p className="text-[var(--color-text-secondary)] text-sm">No hay entradas de presupuesto registradas.</p>
                ) : (
                    <div className="max-h-60 overflow-y-auto space-y-2 pr-2 styled-scrollbar">
                        {budgetHistoryToDisplay.map(entry => (
                            <div key={entry.id} className="bg-black/20 p-3 rounded-lg text-sm border-l-2 border-[var(--color-accent)]">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="font-semibold text-[var(--color-accent)]">{CURRENCY_FORMATTER.format(entry.amount)}</span>
                                    <span className="text-xs text-[var(--color-text-secondary)]">{new Date(entry.date).toLocaleDateString('es-CO')}</span>
                                </div>
                                <p className="text-white">Fuente: {BUDGET_SOURCE_OPTIONS.find(opt => opt.value === entry.source)?.label || entry.source}
                                    {entry.source === 'banco' && entry.bankName && ` (${entry.bankName})`}
                                </p>
                                {entry.description && <p className="text-xs text-[var(--color-text-secondary)]">Descripción: {entry.description}</p>}
                                <p className="text-xs text-gray-500 mt-1">Registrado por: {entry.enteredBy}</p>
                            </div>
                        ))}
                    </div>
                )}
                {visibleBudgetHistoryCount < companyFinancials.budgetHistory.length && (
                    <Button
                        variant="ghost"
                        shape="rounded"
                        fullWidth
                        onClick={() => setVisibleBudgetHistoryCount(prev => prev + ITEMS_PER_LOAD_SETTINGS)}
                        className="mt-3 text-sm"
                    >
                        Cargar Más Entradas ({companyFinancials.budgetHistory.length - visibleBudgetHistoryCount} restantes)
                    </Button>
                )}
            </div>
        </div>
      </Card>
      
      <AlertModal
        isOpen={alertModalState.isOpen}
        onClose={() => setAlertModalState({...alertModalState, isOpen: false})}
        title={alertModalState.title}
        message={alertModalState.message}
      />
    </div>
  );
};

export default SettingsPage;
