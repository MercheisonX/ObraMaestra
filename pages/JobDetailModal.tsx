

import React, { useState, useEffect, useCallback, useMemo, ChangeEvent } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import { Job, Task, Quote, Client, Employee, Material, Tool, JobEmployee, JobMaterial, JobTool, UploadedFile, JobStatus, JobType, QuoteStatus } from '../../types';
import { JOB_TYPES_OPTIONS, CURRENCY_FORMATTER, JOB_STATUS_OPTIONS } from '../../constants';
import { getJobById, updateJob, getClients, getEmployees, getMaterials, getTools, fileToBase64, generateId, getQuotes as getStoredQuotes } from '../../utils/localStorageManager';
import TrashIcon from '../icons/TrashIcon';
import PlusCircleIcon from '../icons/PlusCircleIcon';
import PhotoIcon from '../icons/PhotoIcon';
import DocumentDuplicateIcon from '../icons/DocumentDuplicateIcon';
import TaskFormModal from './TaskFormModal';
import TaskList from '../job/TaskList';
import TaskCalendarView from '../job/TaskCalendarView';
import TaskTimelineView from '../job/TaskTimelineView';
import ConfirmModal from './ConfirmModal'; 
import AlertModal from './AlertModal';
import { useNavigate } from 'react-router-dom';

interface JobDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string | null;
  onJobUpdated: () => void;
}

type ActiveTab = 'details' | 'tasks' | 'quotes';
type TaskViewMode = 'list' | 'calendar' | 'timeline';
type PriceMode = 'margin' | 'manual';

const JobDetailModal: React.FC<JobDetailModalProps> = ({ isOpen, onClose, jobId, onJobUpdated }) => {
  const navigate = useNavigate();

  // All state declarations at the top
  const [job, setJob] = useState<Job | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('details');
  const [taskViewMode, setTaskViewMode] = useState<TaskViewMode>('list');

  const [jobName, setJobName] = useState('');
  const [jobType, setJobType] = useState<JobType | ''>('');
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [address, setAddress] = useState('');
  const [specificLocation, setSpecificLocation] = useState('');
  const [detailedLocation, setDetailedLocation] = useState('');
  const [startDateProposed, setStartDateProposed] = useState('');
  const [endDateEstimated, setEndDateEstimated] = useState('');
  const [currentStatus, setCurrentStatus] = useState<JobStatus>(JobStatus.Pending);
  const [progress, setProgress] = useState(0);
  const [notes, setNotes] = useState('');
  const [gastosRegistrados, setGastosRegistrados] = useState(false);

  const [assignedEmployees, setAssignedEmployees] = useState<JobEmployee[]>([]);
  const [jobMaterials, setJobMaterials] = useState<JobMaterial[]>([]);
  const [assignedTools, setAssignedTools] = useState<JobTool[]>([]);
  
  const [photosBefore, setPhotosBefore] = useState<UploadedFile[]>([]);
  const [photosDuring, setPhotosDuring] = useState<UploadedFile[]>([]);
  const [photosAfter, setPhotosAfter] = useState<UploadedFile[]>([]);
  const [documents, setDocuments] = useState<UploadedFile[]>([]);

  // Financial state
  const [priceMode, setPriceMode] = useState<PriceMode>('margin');
  const [otherExpenses, setOtherExpenses] = useState(0);
  const [profitMargin, setProfitMargin] = useState(35);
  const [finalPrice, setFinalPrice] = useState(0);


  const [availableClients, setAvailableClients] = useState<Client[]>([]);
  const [availableEmployees, setAvailableEmployees] = useState<Employee[]>([]);
  const [availableMaterials, setAvailableMaterials] = useState<Material[]>([]);
  const [availableTools, setAvailableTools] = useState<Tool[]>([]);
  
  const [currentTasks, setCurrentTasks] = useState<Task[]>([]);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const [taskToDeleteId, setTaskToDeleteId] = useState<string | null>(null);
  const [isConfirmDeleteTaskModalOpen, setIsConfirmDeleteTaskModalOpen] = useState(false);

  const [jobQuotes, setJobQuotes] = useState<Quote[]>([]);
  
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [alertModalMessage, setAlertModalMessage] = useState('');
  const [alertModalTitle, setAlertModalTitle] = useState('Validación');

  const [stockConfirmationModal, setStockConfirmationModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    onCancel: () => {},
    confirmText: 'Confirmar',
    cancelText: 'Cancelar',
    showCancel: true,
  });

  const [mainConfirmModalState, setMainConfirmModalState] = useState({ 
    isOpen: false, 
    title: '', 
    message: '', 
    onConfirm: () => {} 
  });


  const loadJobData = useCallback(() => {
    if (jobId) {
      const fetchedJob = getJobById(jobId); 
      if (fetchedJob) {
        setJob(fetchedJob);
        setJobName(fetchedJob.name);
        setJobType(fetchedJob.jobType);
        setSelectedClientId(fetchedJob.clientId);
        setAddress(fetchedJob.address);
        setSpecificLocation(fetchedJob.specificLocation || '');
        setDetailedLocation(fetchedJob.detailedLocation || '');
        setStartDateProposed(fetchedJob.startDateProposed.split('T')[0]);
        setEndDateEstimated(fetchedJob.endDateEstimated.split('T')[0]);
        setCurrentStatus(fetchedJob.status);
        setGastosRegistrados(fetchedJob.gastosRegistrados || false);
        
        const tasks = fetchedJob.tasks || [];
        setCurrentTasks(tasks);
        
        setNotes(fetchedJob.notes || '');
        setAssignedEmployees(fetchedJob.assignedEmployees || []);
        setJobMaterials(fetchedJob.materials || []);
        setAssignedTools(fetchedJob.assignedTools || []);
        setPhotosBefore(fetchedJob.photosBefore || []);
        setPhotosDuring(fetchedJob.photosDuring || []);
        setPhotosAfter(fetchedJob.photosAfter || []);
        setDocuments(fetchedJob.documents || []);
        
        // Financial state initialization
        const calculatedLaborCost = (fetchedJob.assignedEmployees || []).reduce((s,e)=>s+(e.dailySalary*e.estimatedWorkdays),0);
        const calculatedMaterialsCost = (fetchedJob.materials || []).reduce((s,m)=>s+(m.unitPrice*m.quantity),0);
        const currentOtherExpenses = fetchedJob.operationalCost ? (fetchedJob.operationalCost - (calculatedLaborCost + calculatedMaterialsCost)) : 0;
        setOtherExpenses(Math.max(0, currentOtherExpenses));
        setProfitMargin((fetchedJob.profitMargin || 0.35) * 100);
        setFinalPrice(fetchedJob.finalPrice || 0);

        const allQuotes = getStoredQuotes();
        setJobQuotes(allQuotes.filter(q => q.jobId === jobId));

        const currentJobToolIds = (fetchedJob.assignedTools || []).map(jt => jt.toolId);
        setAvailableTools(getTools().filter(t => t.status === 'disponible' || currentJobToolIds.includes(t.id)));
      }
    }
    setAvailableClients(getClients());
    setAvailableEmployees(getEmployees());
    setAvailableMaterials(getMaterials());
  }, [jobId]);

  useEffect(() => {
    if (isOpen && jobId) {
      loadJobData();
      setActiveTab('details'); 
    } else if (!isOpen) {
      setJob(null); 
      setJobName(''); setJobType(''); setSelectedClientId(''); setAddress('');
      setSpecificLocation(''); setDetailedLocation(''); setStartDateProposed('');
      setEndDateEstimated(''); setCurrentStatus(JobStatus.Pending); setProgress(0);
      setGastosRegistrados(false);
      setNotes(''); setAssignedEmployees([]); setJobMaterials([]); setAssignedTools([]);
      setPhotosBefore([]); setPhotosDuring([]); setPhotosAfter([]); setDocuments([]);
      setOtherExpenses(0); setProfitMargin(35); setCurrentTasks([]); setJobQuotes([]);
      setIsTaskModalOpen(false); setEditingTask(null);
    }
  }, [isOpen, jobId, loadJobData]);

   // Financial calculations
   const totalLaborCost = useMemo(() => assignedEmployees.reduce((sum, emp) => sum + (emp.dailySalary * emp.estimatedWorkdays), 0), [assignedEmployees]);
   const totalMaterialsCost = useMemo(() => jobMaterials.reduce((sum, mat) => sum + (mat.unitPrice * mat.quantity), 0), [jobMaterials]);
   const totalOperatingCost = useMemo(() => totalLaborCost + totalMaterialsCost + otherExpenses, [totalLaborCost, totalMaterialsCost, otherExpenses]);
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


  useEffect(() => {
    const totalTasks = currentTasks.length;
    const completedTasks = currentTasks.filter(t => t.isCompleted).length;
    const newProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    setProgress(newProgress);
  }, [currentTasks]);

  const validateDetails = (): boolean => {
    if (!jobName || !jobType || !selectedClientId || !address || !startDateProposed || !endDateEstimated) {
        setAlertModalTitle("Campos Incompletos");
        setAlertModalMessage("Por favor complete todos los campos obligatorios de Información General.");
        setIsAlertModalOpen(true);
        return false;
    }
    if (new Date(endDateEstimated) < new Date(startDateProposed)) {
        setAlertModalTitle("Error de Fechas");
        setAlertModalMessage("La fecha de entrega estimada no puede ser anterior a la fecha de inicio.");
        setIsAlertModalOpen(true);
        return false;
    }
    for (const emp of assignedEmployees) {
        if (emp.estimatedWorkdays <= 0) {
            setAlertModalTitle("Error en Mano de Obra");
            setAlertModalMessage(`Los días estimados para ${emp.name} deben ser mayores a cero.`);
            setIsAlertModalOpen(true);
            return false;
        }
    }
    for (const mat of jobMaterials) {
        if (mat.quantity <= 0) {
            setAlertModalTitle("Error en Materiales");
            setAlertModalMessage(`La cantidad para ${mat.name} debe ser mayor a cero.`);
            setIsAlertModalOpen(true);
            return false;
        }
    }
    if (otherExpenses < 0) {
        setAlertModalTitle("Error en Finanzas");
        setAlertModalMessage("Otros gastos no pueden ser negativos.");
        setIsAlertModalOpen(true);
        return false;
    }
    if (finalPrice < totalOperatingCost) {
      setAlertModalTitle("Error en Finanzas");
      setAlertModalMessage("El precio final no puede ser menor que el costo operativo total.");
      setIsAlertModalOpen(true);
      return false;
    }
    return true;
  };
  
  const proceedWithSavingJob = () => {
    if (!job) return;
     const selectedClient = availableClients.find(c => c.id === selectedClientId);
      if (!selectedClient) {
        setAlertModalTitle("Error de Cliente");
        setAlertModalMessage("Cliente no encontrado o no seleccionado.");
        setIsAlertModalOpen(true);
        return;
      }
      
      const updatedJobData: Job = {
        ...job,
        name: jobName,
        jobType: jobType as JobType,
        client: selectedClient,
        clientId: selectedClientId,
        address,
        specificLocation,
        detailedLocation,
        startDateProposed,
        endDateEstimated,
        status: currentStatus,
        progress,
        notes,
        assignedEmployees,
        materials: jobMaterials,
        assignedTools,
        tasks: currentTasks,
        photosBefore,
        photosDuring,
        photosAfter,
        documents,
        operationalCost: totalOperatingCost,
        profitMargin: totalOperatingCost > 0 ? (finalPrice - totalOperatingCost) / totalOperatingCost : 0,
        finalPrice: finalPrice,
        gastosRegistrados: currentStatus === JobStatus.InProgress ? true : gastosRegistrados,
        paidDate: job.paidDate // Preserve existing paidDate
      };

      if (currentStatus === JobStatus.Paid && !job.paidDate) {
        updatedJobData.paidDate = new Date().toISOString();
      }
      
      const {success, message} = updateJob(updatedJobData); // updateJob now handles stock deduction
      if (success) {
          onJobUpdated(); 
          onClose();
          if(message) {
            // Potentially show a success toast or small non-blocking alert for stock update messages
            console.log("Stock update message:", message);
          }
      } else {
         setAlertModalTitle("Error al Guardar");
         setAlertModalMessage(message || "No se pudo actualizar el trabajo debido a un problema con el stock.");
         setIsAlertModalOpen(true);
      }
  }

  const handleSaveChanges = () => {
    if (!job) return;
    if (!validateDetails()) {
        setActiveTab('details'); // Switch to details tab if validation fails
        return;
    }

    // Check if status is changing to "En Progreso" and expenses haven't been registered
    if (currentStatus === JobStatus.InProgress && !gastosRegistrados) {
        // Check for insufficient stock before confirmation
        let insufficientStockInfo = "";
        const currentMaterialsList = getMaterials(); // Get fresh list of materials for stock check
        for (const jobMat of jobMaterials) {
            const matInStore = currentMaterialsList.find(m => m.id === jobMat.materialId);
            if (matInStore && matInStore.stock < jobMat.quantity) {
                insufficientStockInfo += `\n- ${matInStore.name}: Necesita ${jobMat.quantity}, Disponible ${matInStore.stock}`;
            }
        }

        if (insufficientStockInfo) {
             setStockConfirmationModal({
                isOpen: true,
                title: "¡Atención! Stock Insuficiente",
                message: `No hay suficiente stock para los siguientes materiales:${insufficientStockInfo}\n\n¿Desea continuar y permitir stock negativo? Los materiales se descontarán y los gastos se registrarán igualmente.`,
                onConfirm: () => {
                    setStockConfirmationModal(prev => ({...prev, isOpen: false}));
                    proceedWithSavingJob();
                },
                onCancel: () => setStockConfirmationModal(prev => ({...prev, isOpen: false})),
                confirmText: "Sí, Continuar",
                cancelText: "No, Revisar",
                showCancel: true,
            });
        } else {
            setStockConfirmationModal({
                isOpen: true,
                title: "Confirmar Inicio de Trabajo",
                message: `Al marcar este trabajo como "En Progreso", el stock de los materiales será descontado y los gastos se registrarán en Finanzas. ¿Continuar?`,
                onConfirm: () => {
                    setStockConfirmationModal(prev => ({...prev, isOpen: false}));
                    proceedWithSavingJob();
                },
                onCancel: () => setStockConfirmationModal(prev => ({...prev, isOpen: false})),
                confirmText: "Sí, Descontar y Registrar",
                cancelText: "Cancelar",
                showCancel: true,
            });
        }
    } else {
        // Not changing to "In Progress" or expenses already registered, save directly
        proceedWithSavingJob();
    }
  };
  
  const handleOpenTaskModal = (task: Task | null = null) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };
  
  const handleCloseTaskModal = () => {
    setIsTaskModalOpen(false);
    setEditingTask(null);
  };

  const handleSaveTask = (taskData: Task) => {
    setCurrentTasks(prevTasks => {
      const existingTaskIndex = prevTasks.findIndex(t => t.id === taskData.id);
      if (existingTaskIndex > -1) {
        const newTasks = [...prevTasks];
        newTasks[existingTaskIndex] = taskData;
        return newTasks;
      } else {
        return [...prevTasks, taskData];
      }
    });
  };

  const handleToggleTaskComplete = (taskId: string) => {
    setCurrentTasks(prevTasks => prevTasks.map(t => t.id === taskId ? { ...t, isCompleted: !t.isCompleted } : t));
  };

  const requestDeleteTask = (taskId: string) => {
    setTaskToDeleteId(taskId);
    setIsConfirmDeleteTaskModalOpen(true);
  };

  const confirmDeleteTask = () => {
    if (taskToDeleteId) {
      setCurrentTasks(prevTasks => prevTasks.filter(t => t.id !== taskToDeleteId));
      setTaskToDeleteId(null);
    }
    setIsConfirmDeleteTaskModalOpen(false);
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
    const fileList = fileCategory === 'photosBefore' ? photosBefore :
                     fileCategory === 'photosDuring' ? photosDuring :
                     fileCategory === 'photosAfter' ? photosAfter : documents;
    const fileName = fileList.find(f=>f.id === fileId)?.name || "este archivo";

    openMainConfirmModal(`¿Eliminar archivo?`, `¿Está seguro de eliminar: ${fileName}?`, () => {
        switch (fileCategory) {
            case 'photosBefore': setPhotosBefore(prev => prev.filter(f => f.id !== fileId)); break;
            case 'photosDuring': setPhotosDuring(prev => prev.filter(f => f.id !== fileId)); break;
            case 'photosAfter': setPhotosAfter(prev => prev.filter(f => f.id !== fileId)); break;
            case 'documents': setDocuments(prev => prev.filter(f => f.id !== fileId)); break;
        }
        closeMainConfirmModal();
    });
  };
  
  const openMainConfirmModal = (title: string, message: string, onConfirmAction: () => void) => {
    setMainConfirmModalState({ isOpen: true, title, message, onConfirm: onConfirmAction });
  };
  const closeMainConfirmModal = () => {
    setMainConfirmModalState({ ...mainConfirmModalState, isOpen: false });
  };

  const addEmployeeToJob = (employeeId: string) => { 
    const employee = availableEmployees.find(e => e.id === employeeId);
    if (employee && !assignedEmployees.find(e => e.employeeId === employeeId)) {
        setAssignedEmployees(prev => [...prev, { 
        id: generateId('jobemp-'), 
        employeeId: employee.id, 
        name: employee.name, 
        specialty: employee.specialty,
        dailySalary: employee.dailySalary,
        estimatedWorkdays: 1,
        payments: [],
      }]);
    }
  };
  const removeEmployeeFromJob = (jobEmployeeId: string) => { setAssignedEmployees(prev => prev.filter(e => e.id !== jobEmployeeId));};
  const updateEmployeeWorkdays = (jobEmployeeId: string, days: number) => {setAssignedEmployees(prev => prev.map(e => e.id === jobEmployeeId ? { ...e, estimatedWorkdays: Math.max(0,days) } : e))};
  
  const addMaterialToJob = (materialId: string) => { 
    const material = availableMaterials.find(m => m.id === materialId);
    if (material && !jobMaterials.find(m => m.materialId === materialId)) {
      setJobMaterials(prev => [...prev, { 
        id: generateId('jobmat-'),
        materialId: material.id,
        name: material.name,
        unit: material.unit,
        unitPrice: material.unitPrice,
        quantity: 1 
      }]);
    }
  };
  const removeMaterialFromJob = (jobMaterialId: string) => {setJobMaterials(prev => prev.filter(m => m.id !== jobMaterialId))};
  const updateMaterialQuantity = (jobMaterialId: string, quantity: number) => {setJobMaterials(prev => prev.map(m => m.id === jobMaterialId ? { ...m, quantity: Math.max(0,quantity) } : m))};
  
  const addToolToJob = (toolId: string) => { 
    const tool = availableTools.find(t => t.id === toolId);
     if (tool && !assignedTools.find(t => t.toolId === t.id)) { 
        setAssignedTools(prev => [...prev, {
            id: generateId('jobtool-'),
            toolId: tool.id,
            name: tool.name,
        }]);
    }
  };
  const removeToolFromJob = (jobToolId: string) => {setAssignedTools(prev => prev.filter(t => t.id !== jobToolId))};


  if (!isOpen || !job) return null;

  const renderFileListMini = (files: UploadedFile[], category: 'photosBefore' | 'photosDuring' | 'photosAfter' | 'documents') => (
    <div className="space-y-1.5">
      {files.map(file => (
        <div key={file.id} className="bg-[var(--color-surface-3)] p-1.5 rounded-md text-xs flex items-center justify-between shadow">
            <div className="flex items-center space-x-1.5 overflow-hidden">
                {file.type === 'photo' ? <PhotoIcon className="w-4 h-4 text-[var(--color-aquamarine)] flex-shrink-0"/> : <DocumentDuplicateIcon className="w-4 h-4 text-[var(--color-aquamarine)] flex-shrink-0"/>}
                <span className="truncate text-[var(--color-text-primary)]" title={file.name}>{file.name}</span>
            </div>
          <button onClick={() => removeUploadedFile(file.id, category)} className="text-red-500 hover:text-red-400 p-0.5 ml-1 flex-shrink-0">
            <TrashIcon className="w-3.5 h-3.5"/>
          </button>
        </div>
      ))}
      <label htmlFor={`${category}-jobdetail-input`} className="mt-1.5 w-full">
        <div className="flex items-center justify-center w-full px-3 py-2 border-2 border-[var(--color-glass-border)] border-dashed rounded-md cursor-pointer hover:border-[var(--color-aquamarine)] transition-colors text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-aquamarine)]">
            <PlusCircleIcon className="w-4 h-4 mr-1.5"/> Añadir Archivo
        </div>
        <input type="file" multiple id={`${category}-jobdetail-input`}
            onChange={(e) => handleFileUpload(e, category)} 
            className="sr-only" 
            accept={category.startsWith('photo') ? "image/*" : ".pdf,.doc,.docx,.xls,.xlsx,.txt"}
        />
      </label>
    </div>
  );


  const renderTabContent = () => {
    switch (activeTab) {
      case 'details':
        return (
          <div className="space-y-5">
            <Input label="Nombre del Trabajo" value={jobName} onChange={e => setJobName(e.target.value)} required />
            <Select label="Tipo de Trabajo" options={JOB_TYPES_OPTIONS} value={jobType} onChange={e => setJobType(e.target.value as JobType)} required />
            <Select 
                label="Cliente" 
                options={availableClients.map(c => ({ value: c.id, label: c.name }))}
                value={selectedClientId}
                onChange={e => setSelectedClientId(e.target.value)}
                required
            />
            <Input label="Dirección" value={address} onChange={e => setAddress(e.target.value)} required/>
            <Input label="Datos Específicos (Conjunto, Torre, Apto, Piso)" value={specificLocation} onChange={e => setSpecificLocation(e.target.value)} />
            <Input label="Ubicación Detallada (Baño, Cocina, etc.)" value={detailedLocation} onChange={e => setDetailedLocation(e.target.value)} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Fecha de Inicio" type="date" value={startDateProposed} onChange={e => setStartDateProposed(e.target.value)} required/>
                <Input label="Fecha de Entrega Estimada" type="date" value={endDateEstimated} onChange={e => setEndDateEstimated(e.target.value)} required/>
            </div>
            <Select label="Estado del Trabajo" options={JOB_STATUS_OPTIONS} value={currentStatus} onChange={e => setCurrentStatus(e.target.value as JobStatus)} />
            <Input label="Progreso (%)" type="number" min="0" max="100" value={progress.toString()} onChange={e => setProgress(parseInt(e.target.value))} 
                   helperText="Se actualiza automáticamente con las tareas completadas." readOnly={currentTasks.length > 0} disabled={currentTasks.length > 0}
            />
            {currentStatus === JobStatus.InProgress && gastosRegistrados && 
                <p className="text-xs text-green-400 bg-green-500/10 p-2 rounded-md">Los gastos de este trabajo ya fueron registrados.</p>
            }
            
            <h4 className="text-md font-bold text-[var(--color-text-primary)] pt-3 mb-2 border-b border-[var(--color-aquamarine-transparent-30)] pb-1">Equipo y Mano de Obra</h4>
            <div className="flex items-end space-x-2 mb-2">
                <Select
                    label="Añadir Trabajador"
                    options={availableEmployees.filter(e => !assignedEmployees.find(ae => ae.employeeId === e.id)).map(e => ({ value: e.id, label: `${e.name} (${CURRENCY_FORMATTER.format(e.dailySalary)})`}))}
                    onChange={e => addEmployeeToJob(e.target.value)}
                    value=""
                    placeholder="Seleccione trabajador"
                    className="flex-grow"
                />
            </div>
            {assignedEmployees.map(emp => (
              <div key={emp.id} className="glass-panel p-2.5 rounded-lg shadow">
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-medium text-[var(--color-text-primary)]">{emp.name}</p>
                    <Button variant="danger" size="sm" onClick={() => removeEmployeeFromJob(emp.id)} className="p-1"><TrashIcon className="w-4 h-4"/></Button>
                  </div>
                  <Input type="number" label="Días Est." value={emp.estimatedWorkdays.toString()} onChange={e => updateEmployeeWorkdays(emp.id, parseInt(e.target.value))} min="0" className="text-sm py-1.5 mt-1"/>
              </div>
            ))}
            <p className="text-sm text-[var(--color-text-secondary)] font-medium">Costo Mano de Obra: {CURRENCY_FORMATTER.format(totalLaborCost)}</p>

            <h4 className="text-md font-bold text-[var(--color-text-primary)] pt-3 mb-2 border-b border-[var(--color-aquamarine-transparent-30)] pb-1">Materiales</h4>
            <div className="flex items-end space-x-2 mb-2">
                <Select
                    label="Añadir Material"
                    options={availableMaterials.filter(m => !jobMaterials.find(jm => jm.materialId === m.id)).map(m => ({ value: m.id, label: `${m.name} (${CURRENCY_FORMATTER.format(m.unitPrice)}/${m.unit})`}))}
                    onChange={e => addMaterialToJob(e.target.value)}
                    value=""
                    placeholder="Seleccione material"
                    className="flex-grow"
                />
            </div>
            {jobMaterials.map(mat => (
              <div key={mat.id} className="glass-panel p-2.5 rounded-lg shadow">
                 <div className="flex justify-between items-center">
                    <p className="text-sm font-medium text-[var(--color-text-primary)]">{mat.name}</p>
                    <Button variant="danger" size="sm" onClick={() => removeMaterialFromJob(mat.id)} className="p-1"><TrashIcon className="w-4 h-4"/></Button>
                 </div>
                  <Input type="number" label={`Cantidad (${mat.unit})`} value={mat.quantity.toString()} onChange={e => updateMaterialQuantity(mat.id, parseInt(e.target.value))} min="0" className="text-sm py-1.5 mt-1"/>
              </div>
            ))}
            <p className="text-sm text-[var(--color-text-secondary)] font-medium">Costo Materiales: {CURRENCY_FORMATTER.format(totalMaterialsCost)}</p>

            <h4 className="text-md font-bold text-[var(--color-text-primary)] pt-3 mb-2 border-b border-[var(--color-aquamarine-transparent-30)] pb-1">Herramientas</h4>
             <div className="flex items-end space-x-2 mb-2">
                <Select
                    label="Añadir Herramienta"
                    options={availableTools.filter(t => !assignedTools.find(at => at.toolId === t.id)).map(t => ({ value: t.id, label: `${t.name} (${t.status === 'disponible' ? 'Disp.' : t.status})`}))}
                    onChange={e => addToolToJob(e.target.value)}
                    value=""
                    placeholder="Seleccione herramienta"
                    className="flex-grow"
                />
            </div>
            {assignedTools.map(tool => (
              <div key={tool.id} className="glass-panel p-2.5 rounded-lg shadow flex justify-between items-center">
                <p className="text-sm font-medium text-[var(--color-text-primary)]">{tool.name}</p>
                <Button variant="danger" size="sm" onClick={() => removeToolFromJob(tool.id)} className="p-1"><TrashIcon className="w-4 h-4"/></Button>
              </div>
            ))}

            <h4 className="text-md font-bold text-[var(--color-text-primary)] pt-3 mb-2 border-b border-[var(--color-aquamarine-transparent-30)] pb-1">Documentación y Evidencia</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-bold text-[var(--color-text-secondary)] mb-1.5">Fotos Antes</label>
                    {renderFileListMini(photosBefore, 'photosBefore')}
                </div>
                 <div>
                    <label className="block text-sm font-bold text-[var(--color-text-secondary)] mb-1.5">Fotos Durante</label>
                    {renderFileListMini(photosDuring, 'photosDuring')}
                </div>
                 <div>
                    <label className="block text-sm font-bold text-[var(--color-text-secondary)] mb-1.5">Fotos Después</label>
                    {renderFileListMini(photosAfter, 'photosAfter')}
                </div>
                 <div>
                    <label className="block text-sm font-bold text-[var(--color-text-secondary)] mb-1.5">Documentos</label>
                    {renderFileListMini(documents, 'documents')}
                </div>
            </div>

            <h4 className="text-md font-bold text-[var(--color-text-primary)] pt-3 mb-2 border-b border-[var(--color-aquamarine-transparent-30)] pb-1">Finanzas</h4>
            <div className="p-3 bg-[var(--color-surface-3)] rounded-lg">
                 <p className="text-md text-[var(--color-text-secondary)]">Costo Mano de Obra: <span className="font-bold text-[var(--color-text-primary)]">{CURRENCY_FORMATTER.format(totalLaborCost)}</span></p>
                 <p className="text-md text-[var(--color-text-secondary)]">Costo Materiales: <span className="font-bold text-[var(--color-text-primary)]">{CURRENCY_FORMATTER.format(totalMaterialsCost)}</span></p>
            </div>
            <Input
                label="Otros Gastos del Proyecto"
                type="number"
                value={otherExpenses.toString()}
                onChange={e => setOtherExpenses(parseFloat(e.target.value) || 0)}
                placeholder="Transporte, permisos, etc."
                min="0"
            />
            <p className="text-xl font-bold text-[var(--color-text-primary)]">Costo Operativo Total: {CURRENCY_FORMATTER.format(totalOperatingCost)}</p>
            
            <div className="space-y-4 glass-panel p-4 rounded-lg mt-4">
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
                  disabled={priceMode === 'manual'}
                  readOnly={priceMode === 'manual'}
                />
                 <Input
                  label="Precio Final para el Cliente (COP)"
                  type="number"
                  value={finalPrice.toFixed(0)}
                  onChange={e => priceMode === 'manual' && setFinalPrice(parseFloat(e.target.value) || 0)}
                  min={totalOperatingCost.toString()}
                  disabled={priceMode === 'margin'}
                  readOnly={priceMode === 'margin'}
                />
                <div className="p-3 bg-[var(--color-surface-3)] rounded-lg space-y-1">
                    <p className="text-md text-[var(--color-text-secondary)]">Ganancia (COP): <span className="font-bold text-green-400">{CURRENCY_FORMATTER.format(profitAmount)}</span></p>
                    <p className="text-xl font-bold text-[var(--color-aquamarine)]">Precio Final: {CURRENCY_FORMATTER.format(finalPrice)}</p>
                </div>
            </div>

            <div>
              <label htmlFor="job-notes" className="block text-sm font-bold text-[var(--color-text-secondary)] mb-1.5 pt-3">Notas Adicionales del Trabajo</label>
              <textarea
                  id="job-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="block w-full px-4 py-3 bg-[var(--color-surface-2)] border-2 border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-aquamarine)] focus:border-[var(--color-aquamarine)] sm:text-sm font-medium"
                  placeholder="Observaciones, detalles importantes..."
              />
            </div>
          </div>
        );
      case 'tasks':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-lg font-bold text-[var(--color-text-primary)]">Gestión de Tareas</h4>
              <Button onClick={() => handleOpenTaskModal()} leftIcon={<PlusCircleIcon className="w-5 h-5"/>} size="sm">
                Añadir Tarea
              </Button>
            </div>
            <div className="w-full overflow-hidden">
                <div className="flex space-x-2 border-b border-[var(--color-glass-border)] pb-3 mb-3 overflow-x-auto styled-scrollbar-horizontal-thin justify-start">
                    { (['list', 'calendar', 'timeline'] as TaskViewMode[]).map(mode => (
                        <Button 
                            key={mode} 
                            variant={taskViewMode === mode ? 'primary' : 'secondary'} 
                            onClick={() => setTaskViewMode(mode)}
                            size="sm"
                            className="flex-shrink-0"
                        >
                            {mode === 'list' ? 'Lista' : mode === 'calendar' ? 'Calendario' : 'Cronograma'}
                        </Button>
                    ))}
                </div>
            </div>
            {taskViewMode === 'list' && <TaskList tasks={currentTasks} onToggleComplete={handleToggleTaskComplete} onEditTask={handleOpenTaskModal} onDeleteTask={requestDeleteTask} />}
            {taskViewMode === 'calendar' && <TaskCalendarView tasks={currentTasks} onTaskClick={handleOpenTaskModal} />}
            {taskViewMode === 'timeline' && <TaskTimelineView tasks={currentTasks} onTaskClick={handleOpenTaskModal} />}
          </div>
        );
      case 'quotes':
        return (
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h4 className="text-lg font-bold text-[var(--color-text-primary)]">Cotizaciones del Trabajo</h4>
                    <Button onClick={() => { if(job) { navigate(`/quotes/new/${job.id}`); onClose(); } }} leftIcon={<PlusCircleIcon className="w-5 h-5"/>} size="sm">
                        Nueva Cotización
                    </Button>
                </div>
                {jobQuotes.length === 0 && <p className="text-[var(--color-text-secondary)] text-center py-4">No hay cotizaciones para este trabajo.</p>}
                <div className="space-y-3">
                    {jobQuotes.map(quote => (
                        <div key={quote.id} className="glass-panel p-3 rounded-lg shadow">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-semibold text-[var(--color-text-primary)]">Cotización #{quote.quoteNumber}</p>
                                    <p className="text-xs text-[var(--color-text-secondary)]">
                                        Fecha: {new Date(quote.date).toLocaleDateString('es-CO', {day: '2-digit', month: 'short', year: 'numeric'})}
                                    </p>
                                </div>
                                <span className={`px-1.5 py-0.5 text-[10px] font-semibold rounded-full ${
                                    quote.status === QuoteStatus.Approved ? 'bg-green-500/20 text-green-300' :
                                    quote.status === QuoteStatus.Sent ? 'bg-blue-500/20 text-blue-300' :
                                    quote.status === QuoteStatus.Rejected ? 'bg-red-500/20 text-red-300' :
                                    'bg-gray-500/20 text-gray-300'
                                }`}>
                                    {quote.status}
                                </span>
                            </div>
                            <p className="text-sm text-[var(--color-aquamarine)] font-medium mt-1">Total: {CURRENCY_FORMATTER.format(quote.totalAmount)}</p>
                            <Button size="sm" variant="ghost" className="mt-2 text-xs text-[var(--color-aquamarine)] hover:text-[var(--color-aquamarine-dark)]" onClick={() => {
                                if(job) { navigate(`/quotes/edit/${quote.id}`); onClose(); }
                            }}>
                                Ver/Editar Cotización
                            </Button>
                        </div>
                    ))}
                </div>
            </div>
        );
      default:
        return null;
    }
  };

  const modalTitle = job ? `${job.name}` : 'Cargando Trabajo...';

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title={modalTitle} size="xl">
        <div className="w-full overflow-hidden border-b border-[var(--color-glass-border)] mb-4">
          <div className="flex overflow-x-auto styled-scrollbar-horizontal-thin justify-start">
            {(['details', 'tasks', 'quotes'] as ActiveTab[]).map(tabName => (
              <button
                key={tabName}
                onClick={() => setActiveTab(tabName)}
                className={`py-2.5 px-4 text-sm font-bold focus:outline-none transition-colors duration-150 flex-shrink-0
                  ${activeTab === tabName 
                    ? 'border-b-2 border-[var(--color-aquamarine)] text-[var(--color-aquamarine)]' 
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-b-2 hover:border-[var(--color-surface-3)]'}`}
              >
                {tabName === 'details' ? 'Detalles' : tabName === 'tasks' ? `Tareas (${currentTasks.length})` : `Cotizaciones (${jobQuotes.length})`}
              </button>
            ))}
          </div>
        </div>
        <div className="max-h-[calc(95vh-200px)] overflow-y-auto pr-2 styled-scrollbar"> 
            {renderTabContent()}
        </div>
        <div className="mt-auto pt-4 border-t border-[var(--color-glass-border)]"> 
            <Button onClick={handleSaveChanges} fullWidth size="lg">
                Guardar Cambios y Cerrar
            </Button>
        </div>
      </Modal>

      {job && isTaskModalOpen && (
        <TaskFormModal
          isOpen={isTaskModalOpen}
          onClose={handleCloseTaskModal}
          onSave={(taskData) => {
            handleSaveTask(taskData);
          }}
          task={editingTask}
          jobId={job.id}
        />
      )}
      <ConfirmModal
        isOpen={isConfirmDeleteTaskModalOpen}
        onClose={() => setIsConfirmDeleteTaskModalOpen(false)}
        onConfirm={confirmDeleteTask}
        title="Confirmar Eliminación de Tarea"
        message="¿Está seguro de que desea eliminar esta tarea?"
      />
       <ConfirmModal
        isOpen={mainConfirmModalState.isOpen}
        onClose={closeMainConfirmModal}
        onConfirm={mainConfirmModalState.onConfirm}
        title={mainConfirmModalState.title}
        message={mainConfirmModalState.message}
      />
      <ConfirmModal
        isOpen={stockConfirmationModal.isOpen}
        onClose={stockConfirmationModal.onCancel}
        onConfirm={stockConfirmationModal.onConfirm}
        title={stockConfirmationModal.title}
        message={stockConfirmationModal.message}
        confirmText={stockConfirmationModal.confirmText}
        cancelText={stockConfirmationModal.cancelText}
        showCancel={stockConfirmationModal.showCancel} 
      />
      <AlertModal
        isOpen={isAlertModalOpen}
        onClose={() => setIsAlertModalOpen(false)}
        title={alertModalTitle}
        message={alertModalMessage}
      />
    </>
  );
};

export default JobDetailModal;
