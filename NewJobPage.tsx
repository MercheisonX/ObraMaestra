
import React, { useState, useEffect, useCallback, useMemo, ChangeEvent, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Job, JobType, Client, Employee, Material, Tool, JobEmployee, JobMaterial, JobTool, UploadedFile, JobStatus } from '../types';
import { JOB_TYPES_OPTIONS, CURRENCY_FORMATTER } from '../constants';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import ArrowLeftIcon from '../components/icons/ArrowLeftIcon';
import XMarkIcon from '../components/icons/XMarkIcon';
import TrashIcon from '../components/icons/TrashIcon';
import PhotoIcon from '../components/icons/PhotoIcon';
import DocumentDuplicateIcon from '../components/icons/DocumentDuplicateIcon';
import PlusCircleIcon from '../components/icons/PlusCircleIcon';
import { getClients, getEmployees, getMaterials, getTools, addJob, generateId, fileToBase64, addEmployee as addNewGlobalEmployee, addMaterial as addNewGlobalMaterial, addTool as addNewGlobalTool } from '../utils/localStorageManager';
import EmployeeFormModal from '../components/modals/EmployeeFormModal';
import MaterialFormModal from '../components/modals/MaterialFormModal';
import ToolFormModal from '../components/modals/ToolFormModal';
import ConfirmModal from '../components/modals/ConfirmModal';
import AlertModal from '../components/modals/AlertModal';

type PriceMode = 'margin' | 'manual';

const STEPS = [
  "Información General",
  "Equipo y Mano de Obra",
  "Materiales",
  "Herramientas",
  "Documentación y Evidencia",
  "Finanzas y Precio"
];

const NewJobPage: React.FC = () => {
  const navigate = useNavigate();
  const { step: routeStep } = useParams<{ step?: string }>();
  const [currentStep, setCurrentStep] = useState(0);

  // Form State
  const [jobName, setJobName] = useState('');
  const [jobType, setJobType] = useState<JobType | ''>('');
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [address, setAddress] = useState('');
  const [specificLocation, setSpecificLocation] = useState('');
  const [detailedLocation, setDetailedLocation] = useState('');
  const [startDateProposed, setStartDateProposed] = useState('');
  const [endDateEstimated, setEndDateEstimated] = useState('');

  const [assignedEmployees, setAssignedEmployees] = useState<JobEmployee[]>([]);
  const [jobMaterials, setJobMaterials] = useState<JobMaterial[]>([]);
  const [assignedTools, setAssignedTools] = useState<JobTool[]>([]);

  const [photosBefore, setPhotosBefore] = useState<UploadedFile[]>([]);
  const [photosDuring, setPhotosDuring] = useState<UploadedFile[]>([]);
  const [photosAfter, setPhotosAfter] = useState<UploadedFile[]>([]);
  const [documents, setDocuments] = useState<UploadedFile[]>([]);

  // Financial State
  const [priceMode, setPriceMode] = useState<PriceMode>('margin');
  const [otherExpenses, setOtherExpenses] = useState(0);
  const [profitMargin, setProfitMargin] = useState(35);
  const [finalPrice, setFinalPrice] = useState(0);
  const [manualPriceJustification, setManualPriceJustification] = useState('');


  const [availableClients, setAvailableClients] = useState<Client[]>([]);
  const [availableEmployees, setAvailableEmployees] = useState<Employee[]>([]);
  const [availableMaterials, setAvailableMaterials] = useState<Material[]>([]);
  const [availableTools, setAvailableTools] = useState<Tool[]>([]);

  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [isToolModalOpen, setIsToolModalOpen] = useState(false);
  const [isConfirmCloseModalOpen, setIsConfirmCloseModalOpen] = useState(false);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [alertModalMessage, setAlertModalMessage] = useState('');

  // States for highlighting financial fields
  const [highlightOperatingCost, setHighlightOperatingCost] = useState(false);
  const [highlightFinalPrice, setHighlightFinalPrice] = useState(false);

  const prevTotalOperatingCostRef = useRef<number | undefined>(undefined);
  const prevFinalPriceRef = useRef<number | undefined>(undefined);

  const loadAvailableData = useCallback(() => {
    setAvailableClients(getClients());
    setAvailableEmployees(getEmployees());
    setAvailableMaterials(getMaterials());
    setAvailableTools(getTools().filter(t => t.status === 'disponible'));
  }, []);

  useEffect(() => {
    loadAvailableData();
  }, [loadAvailableData]);

  useEffect(() => {
    if (routeStep) {
      const stepIndex = parseInt(routeStep, 10) - 1;
      if (stepIndex >= 0 && stepIndex < STEPS.length) {
        setCurrentStep(stepIndex);
      }
    } else {
        setCurrentStep(0);
    }
  }, [routeStep]);

  const totalLaborCost = useMemo(() => {
    return assignedEmployees.reduce((sum, emp) => sum + (emp.dailySalary * emp.estimatedWorkdays), 0);
  }, [assignedEmployees]);

  const totalMaterialsCost = useMemo(() => {
    return jobMaterials.reduce((sum, mat) => sum + (mat.unitPrice * mat.quantity), 0);
  }, [jobMaterials]);

  const totalOperatingCost = useMemo(() => {
    return totalLaborCost + totalMaterialsCost + otherExpenses;
  }, [totalLaborCost, totalMaterialsCost, otherExpenses]);

  const profitAmount = useMemo(() => finalPrice - totalOperatingCost, [finalPrice, totalOperatingCost]);

  // Effect to update final price when margin or costs change
  useEffect(() => {
    if (priceMode === 'margin') {
      const newFinalPrice = totalOperatingCost * (1 + profitMargin / 100);
      setFinalPrice(newFinalPrice);
    }
  }, [profitMargin, totalOperatingCost, priceMode]);

  // Effect to update margin when final price or costs change
  useEffect(() => {
    if (priceMode === 'manual') {
      if (totalOperatingCost > 0) {
        const newMargin = ((finalPrice - totalOperatingCost) / totalOperatingCost) * 100;
        setProfitMargin(newMargin);
      } else {
        setProfitMargin(0);
      }
    }
  }, [finalPrice, totalOperatingCost, priceMode]);

  // Highlight logic
  useEffect(() => {
    if (prevTotalOperatingCostRef.current !== undefined && prevTotalOperatingCostRef.current !== totalOperatingCost) {
      setHighlightOperatingCost(true);
      const timer = window.setTimeout(() => setHighlightOperatingCost(false), 300);
      return () => window.clearTimeout(timer);
    }
    prevTotalOperatingCostRef.current = totalOperatingCost;
  }, [totalOperatingCost]);

  useEffect(() => {
    if (prevFinalPriceRef.current !== undefined && prevFinalPriceRef.current !== finalPrice) {
      setHighlightFinalPrice(true);
      const timer = window.setTimeout(() => setHighlightFinalPrice(false), 300);
      return () => window.clearTimeout(timer);
    }
    prevFinalPriceRef.current = finalPrice;
  }, [finalPrice]);


  const validateCurrentStep = (): boolean => {
    switch (currentStep) {
        case 0: // Información General
            if (!jobName || !jobType || !selectedClientId || !address || !startDateProposed || !endDateEstimated) {
                setAlertModalMessage("Por favor complete todos los campos obligatorios de Información General.");
                setIsAlertModalOpen(true);
                return false;
            }
            if (new Date(endDateEstimated) < new Date(startDateProposed)) {
                setAlertModalMessage("La fecha de entrega estimada no puede ser anterior a la fecha de inicio.");
                setIsAlertModalOpen(true);
                return false;
            }
            return true;
        case 1: // Equipo y Mano de Obra
            for (const emp of assignedEmployees) {
                if (emp.estimatedWorkdays <= 0) {
                    setAlertModalMessage(`Los días estimados para ${emp.name} deben ser mayores a cero.`);
                    setIsAlertModalOpen(true);
                    return false;
                }
            }
            return true;
        case 2: // Materiales
             for (const mat of jobMaterials) {
                if (mat.quantity <= 0) {
                    setAlertModalMessage(`La cantidad para ${mat.name} debe ser mayor a cero.`);
                    setIsAlertModalOpen(true);
                    return false;
                }
            }
            return true;
        case 5: // Finanzas y Precio
            if (otherExpenses < 0) {
                setAlertModalMessage("Otros gastos no pueden ser negativos.");
                setIsAlertModalOpen(true);
                return false;
            }
            if (finalPrice < totalOperatingCost) {
              setAlertModalMessage("El precio final no puede ser menor que el costo operativo total.");
              setIsAlertModalOpen(true);
              return false;
            }
            return true;
        default:
            return true;
    }
  };


  const handleNextStep = () => {
    if (!validateCurrentStep()) {
        return;
    }

    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
      navigate(`/new-job/${currentStep + 2}`);
    } else {
      // Final step, save the job
      const selectedClient = availableClients.find(c => c.id === selectedClientId);
      if (!selectedClient) {
        setAlertModalMessage("Por favor seleccione un cliente.");
        setIsAlertModalOpen(true);
        return;
      }
      const newJob: Job = {
        id: generateId('job-'),
        name: jobName,
        jobType: jobType as JobType,
        client: selectedClient,
        clientId: selectedClientId,
        address,
        specificLocation,
        detailedLocation,
        progress: 0,
        startDateProposed,
        endDateEstimated,
        status: JobStatus.Pending,
        costAlert: false,
        assignedEmployees,
        materials: jobMaterials,
        assignedTools,
        tasks: [],
        photosBefore,
        photosDuring,
        photosAfter,
        documents,
        operationalCost: totalOperatingCost,
        profitMargin: profitMargin / 100,
        finalPrice: finalPrice,
        notes: manualPriceJustification,
      };
      addJob(newJob);
      navigate('/jobs'); // Navigate to jobs list after successful save
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      navigate(`/new-job/${currentStep}`);
    } else {
      setIsConfirmCloseModalOpen(true); 
    }
  };

  const requestCloseForm = () => {
    setIsConfirmCloseModalOpen(true);
  };
  
  const confirmCloseForm = () => {
    setIsConfirmCloseModalOpen(false);
    navigate('/dashboard');
  }


  const addEmployeeToJob = (employeeId: string) => {
    const employee = availableEmployees.find(e => e.id === employeeId);
    if (employee && !assignedEmployees.find(e => e.employeeId === employeeId)) {
      setAssignedEmployees([...assignedEmployees, {
        id: generateId('jobemp-'),
        employeeId: employee.id,
        name: employee.name,
        specialty: employee.specialty,
        dailySalary: employee.dailySalary,
        estimatedWorkdays: 1, // Default to 1, user can change
        payments: [],
      }]);
    }
  };
  const updateEmployeeWorkdays = (jobEmployeeId: string, days: number) => {
    // Basic validation for positive numbers can be done here or on blur
    setAssignedEmployees(assignedEmployees.map(e => e.id === jobEmployeeId ? { ...e, estimatedWorkdays: Math.max(0,days) } : e));
  };
  const removeEmployeeFromJob = (jobEmployeeId: string) => {
    setAssignedEmployees(assignedEmployees.filter(e => e.id !== jobEmployeeId));
  };

  const addMaterialToJob = (materialId: string) => {
    const material = availableMaterials.find(m => m.id === materialId);
    if (material && !jobMaterials.find(m => m.materialId === materialId)) {
      setJobMaterials([...jobMaterials, {
        id: generateId('jobmat-'),
        materialId: material.id,
        name: material.name,
        unit: material.unit,
        unitPrice: material.unitPrice,
        quantity: 1 // Default to 1
      }]);
    }
  };
  const updateMaterialQuantity = (jobMaterialId: string, quantity: number) => {
    setJobMaterials(jobMaterials.map(m => m.id === jobMaterialId ? { ...m, quantity: Math.max(0,quantity) } : m));
  };
  const removeMaterialFromJob = (jobMaterialId: string) => {
    setJobMaterials(jobMaterials.filter(m => m.id !== jobMaterialId));
  };

  const addToolToJob = (toolId: string) => {
    const tool = availableTools.find(t => t.id === toolId);
    if (tool && !assignedTools.find(t => t.toolId === toolId)) {
        setAssignedTools([...assignedTools, {
            id: generateId('jobtool-'),
            toolId: tool.id,
            name: tool.name,
        }]);
    }
  };
  const removeToolFromJob = (jobToolId: string) => {
    setAssignedTools(assignedTools.filter(t => t.id !== jobToolId));
  };

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>, fileCategory: 'photosBefore' | 'photosDuring' | 'photosAfter' | 'documents') => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    const uploadedFilesPromises = files.map(async (file): Promise<UploadedFile> => {
        const type = file.type.startsWith('image/') ? 'photo' : 'document';
        const urlOrBase64 = type === 'photo' ? await fileToBase64(file) : file.name; 
        return { id: generateId('file-'), name: file.name, type, urlOrBase64, file };
    });

    const newUploadedFiles = await Promise.all(uploadedFilesPromises);

    switch (fileCategory) {
        case 'photosBefore': setPhotosBefore(prev => [...prev, ...newUploadedFiles]); break;
        case 'photosDuring': setPhotosDuring(prev => [...prev, ...newUploadedFiles]); break;
        case 'photosAfter': setPhotosAfter(prev => [...prev, ...newUploadedFiles]); break;
        case 'documents': setDocuments(prev => [...prev, ...newUploadedFiles]); break;
    }
    event.target.value = "";
  };

  const removeUploadedFile = (fileId: string, fileCategory: 'photosBefore' | 'photosDuring' | 'photosAfter' | 'documents') => {
    switch (fileCategory) {
        case 'photosBefore': setPhotosBefore(prev => prev.filter(f => f.id !== fileId)); break;
        case 'photosDuring': setPhotosDuring(prev => prev.filter(f => f.id !== fileId)); break;
        case 'photosAfter': setPhotosAfter(prev => prev.filter(f => f.id !== fileId)); break;
        case 'documents': setDocuments(prev => prev.filter(f => f.id !== fileId)); break;
    }
  };
  
  const SectionTitle: React.FC<{title: string}> = ({title}) => (
    <h3 className="text-lg font-semibold text-[var(--color-text-primary)] border-b border-[var(--color-aquamarine-transparent-50)] pb-1 mb-3">{title}</h3>
  );


  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Información General
        return (
          <div className="space-y-5">
            <SectionTitle title="Datos del Proyecto" />
            <Input label="Nombre del Trabajo" placeholder="e.g., Remodelación Baño Principal" value={jobName} onChange={e => setJobName(e.target.value)} required />
            <Select label="Tipo de Trabajo" options={JOB_TYPES_OPTIONS} value={jobType} onChange={e => setJobType(e.target.value as JobType)} placeholder="Seleccione un tipo" required/>
            <Select
                label="Cliente"
                options={availableClients.map(c => ({ value: c.id, label: c.name }))}
                value={selectedClientId}
                onChange={e => setSelectedClientId(e.target.value)}
                placeholder="Seleccione un cliente"
                required
            />
            <Input label="Dirección" placeholder="Dirección completa" value={address} onChange={e => setAddress(e.target.value)} required/>
            <Input label="Datos Específicos (Conjunto, Torre, Apto, Piso)" placeholder="e.g., Torre 1, Apto 502" value={specificLocation} onChange={e => setSpecificLocation(e.target.value)} />
            <Input label="Ubicación Detallada (Baño, Cocina, etc.)" placeholder="e.g., Baño social" value={detailedLocation} onChange={e => setDetailedLocation(e.target.value)} />
            <Input label="Fecha de Inicio Propuesta" type="date" value={startDateProposed} onChange={e => setStartDateProposed(e.target.value)} required/>
            <Input label="Fecha de Entrega Estimada" type="date" value={endDateEstimated} onChange={e => setEndDateEstimated(e.target.value)} required/>
          </div>
        );
      case 1: // Equipo y Mano de Obra
        return (
          <div className="space-y-6">
            <SectionTitle title="Mano de Obra" />
            <div className="flex items-end space-x-2">
              <Select
                label="Asignar Trabajadores"
                options={availableEmployees.filter(e => !assignedEmployees.find(ae => ae.employeeId === e.id)).map(e => ({ value: e.id, label: `${e.name} (${e.specialty})` }))}
                onChange={e => addEmployeeToJob(e.target.value)}
                value=""
                placeholder="Seleccione un trabajador para añadir"
                className="flex-grow"
              />
               <Button type="button" variant="ghost" onClick={() => setIsEmployeeModalOpen(true)} className="p-2.5" title="Añadir Nuevo Trabajador">
                  <PlusCircleIcon className="w-6 h-6 text-[var(--color-aquamarine)]"/>
              </Button>
            </div>
            {assignedEmployees.length === 0 && <p className="text-[var(--color-text-secondary)] text-center py-2">Ningún trabajador asignado.</p>}
            {assignedEmployees.map(emp => (
              <div key={emp.id} className="glass-panel p-3 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                        <img src={availableEmployees.find(e => e.id === emp.employeeId)?.photoUrl || `https://ui-avatars.com/api/?name=${emp.name.replace(/\s+/g, '+')}&background=075985&color=fff&size=40&font-size=0.4&bold=true`} alt={emp.name} className="w-10 h-10 rounded-full mr-3 object-cover"/>
                        <div>
                            <p className="font-semibold text-[var(--color-text-primary)]">{emp.name}</p>
                            <p className="text-xs text-[var(--color-text-secondary)]">Salario Diario: {CURRENCY_FORMATTER.format(emp.dailySalary)}</p>
                        </div>
                    </div>
                    <Button variant="danger" size="sm" onClick={() => removeEmployeeFromJob(emp.id)} aria-label="Eliminar trabajador" className="p-1.5">
                        <TrashIcon className="w-4 h-4" />
                    </Button>
                </div>
                <Input
                  label="Días Estimados"
                  type="number"
                  value={emp.estimatedWorkdays.toString()}
                  onChange={e => updateEmployeeWorkdays(emp.id, parseInt(e.target.value) || 0)}
                  placeholder="Días"
                  min="0" // HTML5 validation, JS validation in handleNext
                />
                <p className="text-xs text-[var(--color-text-secondary)] mt-1">Costo Mano de Obra (Trabajador): {CURRENCY_FORMATTER.format(emp.dailySalary * emp.estimatedWorkdays)}</p>
              </div>
            ))}
            <div className="text-right font-bold text-lg text-[var(--color-text-primary)] mt-4">
              Costo Total de Mano de Obra: {CURRENCY_FORMATTER.format(totalLaborCost)}
            </div>
          </div>
        );
      case 2: // Materiales
         return (
          <div className="space-y-6">
            <SectionTitle title="Inventario de Materiales" />
            <div className="flex items-end space-x-2">
              <Select
                label="Añadir Materiales"
                options={availableMaterials.filter(m => !jobMaterials.find(jm => jm.materialId === m.id)).map(m => ({ value: m.id, label: `${m.name} (${CURRENCY_FORMATTER.format(m.unitPrice)} / ${m.unit})` }))}
                onChange={e => addMaterialToJob(e.target.value)}
                value=""
                placeholder="Seleccione un material para añadir"
                className="flex-grow"
              />
              <Button type="button" variant="ghost" onClick={() => setIsMaterialModalOpen(true)} className="p-2.5" title="Añadir Nuevo Material">
                  <PlusCircleIcon className="w-6 h-6 text-[var(--color-aquamarine)]"/>
              </Button>
            </div>
            {jobMaterials.length === 0 && <p className="text-[var(--color-text-secondary)] text-center py-2">Ningún material asignado.</p>}
            {jobMaterials.map(mat => (
              <div key={mat.id} className="glass-panel p-3 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold text-[var(--color-text-primary)]">{mat.name}</p>
                    <Button variant="danger" size="sm" onClick={() => removeMaterialFromJob(mat.id)} aria-label="Eliminar material" className="p-1.5">
                        <TrashIcon className="w-4 h-4" />
                    </Button>
                </div>
                <p className="text-xs text-[var(--color-text-secondary)] mb-2">Precio: {CURRENCY_FORMATTER.format(mat.unitPrice)} / {mat.unit} - Stock: {availableMaterials.find(m=>m.id === mat.materialId)?.stock || 'N/A'}</p>
                <Input
                  label={`Cantidad (${mat.unit})`}
                  type="number"
                  value={mat.quantity.toString()}
                  onChange={e => updateMaterialQuantity(mat.id, parseInt(e.target.value) || 0)}
                  placeholder="Cantidad"
                  min="0" // HTML5 validation
                />
                 <p className="text-xs text-[var(--color-text-secondary)] mt-1">Costo Material (Item): {CURRENCY_FORMATTER.format(mat.unitPrice * mat.quantity)}</p>
              </div>
            ))}
             <div className="text-right font-bold text-lg text-[var(--color-text-primary)] mt-4">
              Costo Total de Materiales: {CURRENCY_FORMATTER.format(totalMaterialsCost)}
            </div>
          </div>
        );
      case 3: // Herramientas
        return (
            <div className="space-y-6">
                <SectionTitle title="Asignación de Herramientas" />
                <div className="flex items-end space-x-2">
                    <Select
                        label="Asignar Herramientas"
                        options={availableTools.filter(t => !assignedTools.find(at => at.toolId === t.id)).map(t => ({ value: t.id, label: `${t.name} (${t.status})` }))}
                        onChange={e => addToolToJob(e.target.value)}
                        value=""
                        placeholder="Seleccione una herramienta"
                        className="flex-grow"
                    />
                    <Button type="button" variant="ghost" onClick={() => setIsToolModalOpen(true)} className="p-2.5" title="Añadir Nueva Herramienta">
                        <PlusCircleIcon className="w-6 h-6 text-[var(--color-aquamarine)]"/>
                    </Button>
                </div>
                {assignedTools.length === 0 && <p className="text-[var(--color-text-secondary)] text-center py-2">Ninguna herramienta asignada.</p>}
                {assignedTools.map(tool => (
                    <div key={tool.id} className="glass-panel p-3 rounded-lg flex items-center justify-between">
                        <div className="flex items-center">
                            <img src={availableTools.find(t => t.id === tool.toolId)?.photoUrl || `https://picsum.photos/seed/${tool.toolId}/40/40`} alt={tool.name} className="w-10 h-10 rounded-md mr-3 object-cover"/>
                            <p className="font-semibold text-[var(--color-text-primary)]">{tool.name}</p>
                        </div>
                        <Button variant="danger" size="sm" onClick={() => removeToolFromJob(tool.id)} aria-label="Eliminar herramienta" className="p-1.5">
                            <TrashIcon className="w-4 h-4" />
                        </Button>
                    </div>
                ))}
            </div>
        );
      case 4: // Documentación y Evidencia
        const renderFileList = (files: UploadedFile[], category: 'photosBefore' | 'photosDuring' | 'photosAfter' | 'documents') => (
            <div className="space-y-2 mt-2">
                {files.map(file => (
                    <div key={file.id} className="glass-panel p-2 rounded-md flex items-center justify-between">
                        <div className="flex items-center space-x-2 overflow-hidden">
                            {file.type === 'photo' && file.urlOrBase64.startsWith('data:image') ? (
                                <img src={file.urlOrBase64} alt={file.name} className="w-10 h-10 rounded object-cover flex-shrink-0" />
                            ) : file.type === 'photo' ? (
                                <PhotoIcon className="w-8 h-8 text-[var(--color-text-secondary)] flex-shrink-0" />
                            ) : (
                                <DocumentDuplicateIcon className="w-8 h-8 text-[var(--color-text-secondary)] flex-shrink-0" />
                            )}
                            <span className="text-sm text-[var(--color-text-primary)] truncate" title={file.name}>{file.name}</span>
                        </div>
                        <Button variant="danger" size="sm" onClick={() => removeUploadedFile(file.id, category)} className="flex-shrink-0 ml-2 p-1.5">
                            <TrashIcon className="w-4 h-4"/>
                        </Button>
                    </div>
                ))}
                {files.length === 0 && <p className="text-xs text-center text-[var(--color-text-secondary)]">No hay archivos.</p>}
                 <label htmlFor={`${category}-input`} className="mt-2 w-full">
                    <div className="mt-2 flex justify-center px-6 pt-5 pb-6 border-2 border-[var(--color-glass-border)] border-dashed rounded-md cursor-pointer hover:border-[var(--color-aquamarine)] transition-colors">
                        <div className="space-y-1 text-center">
                        <PhotoIcon className="mx-auto h-12 w-12 text-[var(--color-text-secondary)]" />
                        <div className="flex text-sm text-[var(--color-text-secondary)]">
                            <span className="relative rounded-md font-medium text-[var(--color-aquamarine)] hover:text-[var(--color-aquamarine-dark)]">
                            <span>Subir archivos</span>
                            <input id={`${category}-input`} name={`${category}-input`} type="file" className="sr-only" multiple accept={category.startsWith('photo') ? "image/*" : ".pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png"} onChange={(e) => handleFileUpload(e, category)} />
                            </span>
                            <p className="pl-1">o arrastrar y soltar</p>
                        </div>
                        <p className="text-xs text-[var(--color-text-secondary)]">{category.startsWith('photo') ? "PNG, JPG, GIF hasta 10MB" : "PDF, DOC, TXT"}</p>
                        </div>
                    </div>
                </label>
            </div>
        );
        return (
            <div className="space-y-6">
                <div>
                    <h4 className="text-md font-bold text-[var(--color-text-primary)]">Fotos Antes del Trabajo</h4>
                    {renderFileList(photosBefore, 'photosBefore')}
                </div>
                <div>
                    <h4 className="text-md font-bold text-[var(--color-text-primary)]">Fotos Durante el Trabajo</h4>
                    {renderFileList(photosDuring, 'photosDuring')}
                </div>
                <div>
                    <h4 className="text-md font-bold text-[var(--color-text-primary)]">Fotos Después del Trabajo</h4>
                    {renderFileList(photosAfter, 'photosAfter')}
                </div>
                <div>
                    <h4 className="text-md font-bold text-[var(--color-text-primary)]">Documentos Adicionales</h4>
                    {renderFileList(documents, 'documents')}
                </div>
            </div>
        );
      case 5: // Finanzas y Precio
        return (
          <div className="space-y-6">
            <SectionTitle title="Resumen de Costos y Precios" />
            <div className="p-3 bg-[var(--color-surface-3)] rounded-lg">
                <p className="text-md text-[var(--color-text-secondary)]">Costo Total de Materiales: <span className="font-bold text-[var(--color-text-primary)]">{CURRENCY_FORMATTER.format(totalMaterialsCost)}</span></p>
                <p className="text-md text-[var(--color-text-secondary)]">Costo Total de Mano de Obra: <span className="font-bold text-[var(--color-text-primary)]">{CURRENCY_FORMATTER.format(totalLaborCost)}</span></p>
            </div>
            
            <Input
              label="Otros Gastos del Proyecto"
              type="number"
              value={otherExpenses.toString()}
              onChange={e => setOtherExpenses(parseFloat(e.target.value) || 0)}
              placeholder="Transporte extra, permisos, etc."
              min="0"
            />
            <div className={`p-2 rounded-md transition-colors duration-300 ${highlightOperatingCost ? 'field-highlight-flash' : ''}`}>
                <p className="text-xl font-bold text-[var(--color-text-primary)]">Costo Operativo Total: {CURRENCY_FORMATTER.format(totalOperatingCost)}</p>
            </div>

            <hr className="border-[var(--color-aquamarine-transparent-30)] my-2" />

            <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Fijación de Precios</h3>
            
            <div className="space-y-4 glass-panel p-4 rounded-lg">
                <div>
                    <label className="block text-sm font-bold text-[var(--color-text-secondary)] mb-1.5">Calcular precio por:</label>
                    <div className="flex w-full bg-[var(--color-surface-3)] rounded-lg p-1">
                        <button type="button" onClick={() => setPriceMode('margin')} className={`w-1/2 rounded-md py-2 text-sm font-bold transition-colors ${priceMode === 'margin' ? 'bg-[var(--color-aquamarine)] text-slate-900 shadow-md' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)]'}`}>
                            Por Margen (%)
                        </button>
                        <button type="button" onClick={() => setPriceMode('manual')} className={`w-1/2 rounded-md py-2 text-sm font-bold transition-colors ${priceMode === 'manual' ? 'bg-[var(--color-aquamarine)] text-slate-900 shadow-md' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)]'}`}>
                            Por Valor Manual
                        </button>
                    </div>
                </div>

                <Input
                  label="Margen de Ganancia (%)"
                  type="number"
                  value={priceMode === 'margin' ? profitMargin.toString() : profitMargin.toFixed(2)}
                  onChange={e => priceMode === 'margin' && setProfitMargin(parseFloat(e.target.value) || 0)}
                  placeholder="Ej. 35"
                  min="0"
                  disabled={priceMode === 'manual'}
                  readOnly={priceMode === 'manual'}
                />
                 <Input
                  label="Precio Final a Cobrar (COP)"
                  type="number"
                  value={finalPrice.toFixed(0)}
                  onChange={e => priceMode === 'manual' && setFinalPrice(parseFloat(e.target.value) || 0)}
                  placeholder="Ingrese el precio final"
                  min={totalOperatingCost.toString()}
                  disabled={priceMode === 'margin'}
                  readOnly={priceMode === 'margin'}
                  helperText={priceMode === 'manual' ? `Debe ser mayor a ${CURRENCY_FORMATTER.format(totalOperatingCost)}` : ''}
                />
            </div>
            
            <div className={`p-3 bg-[var(--color-surface-3)] rounded-lg space-y-1 transition-colors duration-300 ${highlightFinalPrice ? 'field-highlight-flash' : ''}`}>
                <p className="text-md text-[var(--color-text-secondary)]">Ganancia (COP): <span className="font-bold text-green-400">{CURRENCY_FORMATTER.format(profitAmount)}</span></p>
                <p className="text-2xl font-bold text-[var(--color-aquamarine)]">Precio Final: {CURRENCY_FORMATTER.format(finalPrice)}</p>
            </div>
            
            <div>
                <label htmlFor="manualPriceJustification" className="block text-sm font-bold text-[var(--color-text-secondary)] mb-1.5">Justificación del Precio (Opcional)</label>
                <textarea
                    id="manualPriceJustification"
                    value={manualPriceJustification}
                    onChange={(e) => setManualPriceJustification(e.target.value)}
                    rows={4}
                    className="block w-full px-4 py-3 bg-[var(--color-surface-2)] border-2 border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-aquamarine)] focus:border-[var(--color-aquamarine)] sm:text-sm font-medium"
                    placeholder="Explique brevemente el valor ofrecido al cliente, por ejemplo: 'Este precio cubre materiales de calidad, mano de obra experta y la gestión integral del proyecto, asegurando un resultado óptimo y duradero.'"
                />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-transparent text-[var(--color-text-primary)] flex flex-col">
      <div 
        className="glass-bar p-4 flex items-center justify-between shadow-md sticky top-0 z-30 border-b"
        style={{ paddingTop: 'calc(0.5rem + var(--safe-area-inset-top))', height: 'calc(4.5rem + var(--safe-area-inset-top))', borderColor: 'var(--color-glass-border)' }} 
      >
        <button onClick={handlePrevStep} className="p-1 text-[var(--color-aquamarine)] hover:text-[var(--color-aquamarine-dark)]" aria-label="Paso anterior">
          <ArrowLeftIcon className="w-7 h-7" />
        </button>
        <div className="text-center">
            <h2 className="text-lg font-bold">Nuevo Trabajo</h2>
            <p className="text-xs text-[var(--color-text-secondary)]">{STEPS[currentStep]} (Paso {currentStep + 1}/{STEPS.length})</p>
        </div>
        <button onClick={requestCloseForm} className="p-1 text-[var(--color-aquamarine)] hover:text-[var(--color-aquamarine-dark)]" aria-label="Cerrar formulario">
          <XMarkIcon className="w-7 h-7" />
        </button>
      </div>

      <div className="glass-bar flex justify-center items-center space-x-2 py-3 sticky top-[calc(4.5rem + var(--safe-area-inset-top))] z-20 shadow-sm"> {/* Height of header */}
        {STEPS.map((_, index) => (
          <div
            key={index}
            className={`w-2.5 h-2.5 rounded-full transition-colors duration-300 ${index <= currentStep ? 'bg-[var(--color-aquamarine)]' : 'bg-[var(--color-surface-3)]'}`}
          ></div>
        ))}
      </div>


      <div className="flex-grow p-4 overflow-y-auto pb-24 styled-scrollbar"> 
        {renderStepContent()}
      </div>

      <div 
        className="glass-bar p-4 border-t sticky bottom-0 z-30"
        style={{ paddingBottom: 'calc(1rem + var(--safe-area-inset-bottom))', borderColor: 'var(--color-glass-border)' }}
      >
        <Button onClick={handleNextStep} fullWidth size="lg">
          {currentStep === STEPS.length - 1 ? 'Guardar Trabajo' : 'Siguiente'}
        </Button>
      </div>

      <ConfirmModal
        isOpen={isConfirmCloseModalOpen}
        onClose={() => setIsConfirmCloseModalOpen(false)}
        onConfirm={confirmCloseForm}
        title="Confirmar Cierre"
        message="¿Está seguro de que desea cerrar? Se perderán los datos no guardados."
      />
      <AlertModal
        isOpen={isAlertModalOpen}
        onClose={() => setIsAlertModalOpen(false)}
        title="Validación"
        message={alertModalMessage}
      />

      <EmployeeFormModal
        isOpen={isEmployeeModalOpen}
        onClose={() => setIsEmployeeModalOpen(false)}
        onEmployeeSaved={(newEmp) => {
          addNewGlobalEmployee(newEmp);
          loadAvailableData();
          setIsEmployeeModalOpen(false);
        }}
      />
       <MaterialFormModal
        isOpen={isMaterialModalOpen}
        onClose={() => setIsMaterialModalOpen(false)}
        onMaterialSaved={(newMat) => {
          addNewGlobalMaterial(newMat);
          loadAvailableData();
          setIsMaterialModalOpen(false);
        }}
      />
      <ToolFormModal
        isOpen={isToolModalOpen}
        onClose={() => setIsToolModalOpen(false)}
        onToolSaved={(newTool) => {
          addNewGlobalTool(newTool);
          loadAvailableData();
          setIsToolModalOpen(false);
        }}
      />

    </div>
  );
};

export default NewJobPage;
