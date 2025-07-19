

import { Job, Client, Employee, Material, Tool, CompanyProfile, AdminProfile, Quote, CompanyFinancials, BudgetEntry, Supplier, JobStatus, QuoteStatus, UploadedFile, Transaction, Concept } from '../types';
import { MOCK_JOBS, MOCK_CLIENTS, MOCK_EMPLOYEES, MOCK_MATERIALS, MOCK_TOOLS, DEFAULT_COMPANY_PROFILE, DEFAULT_ADMIN_PROFILE, MOCK_QUOTES, DEFAULT_COMPANY_FINANCIALS, MOCK_SUPPLIERS, MOCK_CONCEPTS } from '../constants';

const KEYS = {
  JOBS: 'obramaestra_jobs',
  CLIENTS: 'obramaestra_clients',
  EMPLOYEES: 'obramaestra_employees',
  MATERIALS: 'obramaestra_materials',
  TOOLS: 'obramaestra_tools',
  COMPANY_PROFILE: 'obramaestra_company_profile',
  ADMIN_PROFILE: 'obramaestra_admin_profile',
  QUOTES: 'obramaestra_quotes',
  COMPANY_FINANCIALS: 'obramaestra_company_financials',
  SUPPLIERS: 'obramaestra_suppliers',
  IMAGE_DATA: 'obramaestra_image_data',
  SALARY_CALCULATOR_DATA: 'obramaestra_salary_calculator_data',
  BREAK_EVEN_DATA: 'obramaestra_break_even_data',
  DEBT_CALCULATOR_DATA: 'obramaestra_debt_calculator_data',
  TRANSACTIONS: 'obramaestra_transactions',
  CONCEPTS: 'obramaestra_concepts',
};

// Generic getter
function getData<T>(key: string, defaultValue: T[]): T[] {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch (error) {
    console.error(`Error reading ${key} from localStorage:`, error);
    return defaultValue;
  }
}

// Generic setter
function saveData<T>(key: string, data: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error);
  }
}

// Generic single item getter
function getItem<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading item ${key} from localStorage:`, error);
    return defaultValue;
  }
}

// Generic single item setter
function saveItem<T>(key: string, item: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(item));
  } catch (error) {
    console.error(`Error saving item ${key} to localStorage:`, error);
  }
}

// ===============================================
// IMAGE STORAGE FUNCTIONS
// ===============================================
const getImageDataStore = (): { [id: string]: string } => {
  return getItem<{ [id: string]: string }>(KEYS.IMAGE_DATA, {});
}

const saveImageDataStore = (store: { [id: string]: string }): void => {
  try {
    saveItem(KEYS.IMAGE_DATA, store);
  } catch (error) {
    console.error(`Error saving image data to localStorage:`, error);
    alert('Error: No se pudo guardar la imagen. El almacenamiento local puede estar lleno.');
  }
}

const saveImage = (fileId: string, base64: string): void => {
  if (!fileId || !base64) return;
  const store = getImageDataStore();
  store[fileId] = base64;
  saveImageDataStore(store);
}

const getImage = (fileId: string): string | undefined => {
  const store = getImageDataStore();
  return store[fileId];
}

const deleteImages = (fileIds: string[]): void => {
    const store = getImageDataStore();
    let changed = false;
    fileIds.forEach(id => {
        if (id in store) {
            delete store[id];
            changed = true;
        }
    });
    if (changed) {
        saveImageDataStore(store);
    }
}

// ===============================================
// SANITIZE/REHYDRATE UTILITIES
// ===============================================
const sanitizeFiles = (files: UploadedFile[] = []): UploadedFile[] => {
  return files.map(file => {
    if (file.type === 'photo' && file.urlOrBase64 && file.urlOrBase64.startsWith('data:image')) {
      saveImage(file.id, file.urlOrBase64);
    }
    const { urlOrBase64, file: fileObj, ...sanitized } = file;
    return sanitized as UploadedFile;
  });
};

const rehydrateFiles = (files: UploadedFile[] = []): UploadedFile[] => {
  return files.map(file => {
    if (file.type === 'photo') {
      const imageData = getImage(file.id);
      return {
        ...file,
        urlOrBase64: imageData || '',
      };
    }
    return file;
  });
};

const getAllFileIdsFromJob = (job: Job): string[] => {
    const fileIds: string[] = [];
    (job.photosBefore || []).forEach(f => fileIds.push(f.id));
    (job.photosDuring || []).forEach(f => fileIds.push(f.id));
    (job.photosAfter || []).forEach(f => fileIds.push(f.id));
    (job.documents || []).filter(d => d.type === 'photo').forEach(d => fileIds.push(d.id));
    return fileIds;
}

// Initialization function
export const initializeAppData = (): void => {
  if (!localStorage.getItem(KEYS.JOBS)) {
    saveData<Job>(KEYS.JOBS, MOCK_JOBS);
  }
  if (!localStorage.getItem(KEYS.CLIENTS)) {
    saveData<Client>(KEYS.CLIENTS, MOCK_CLIENTS);
  }
  if (!localStorage.getItem(KEYS.EMPLOYEES)) {
    saveData<Employee>(KEYS.EMPLOYEES, MOCK_EMPLOYEES);
  }
  if (!localStorage.getItem(KEYS.MATERIALS)) {
    saveData<Material>(KEYS.MATERIALS, MOCK_MATERIALS);
  }
  if (!localStorage.getItem(KEYS.TOOLS)) {
    saveData<Tool>(KEYS.TOOLS, MOCK_TOOLS);
  }
  if (!localStorage.getItem(KEYS.COMPANY_PROFILE)) {
    saveItem<CompanyProfile>(KEYS.COMPANY_PROFILE, DEFAULT_COMPANY_PROFILE);
  }
  if (!localStorage.getItem(KEYS.ADMIN_PROFILE)) {
    saveItem<AdminProfile>(KEYS.ADMIN_PROFILE, DEFAULT_ADMIN_PROFILE);
  }
  if (!localStorage.getItem(KEYS.QUOTES)) {
    saveData<Quote>(KEYS.QUOTES, MOCK_QUOTES.map(q => ({...q, status: q.status || QuoteStatus.Draft })));
  }
  if (!localStorage.getItem(KEYS.COMPANY_FINANCIALS)) {
    saveItem<CompanyFinancials>(KEYS.COMPANY_FINANCIALS, DEFAULT_COMPANY_FINANCIALS);
  }
  if (!localStorage.getItem(KEYS.SUPPLIERS)) {
    saveData<Supplier>(KEYS.SUPPLIERS, MOCK_SUPPLIERS);
  }
  if (!localStorage.getItem(KEYS.CONCEPTS)) {
    saveData<Concept>(KEYS.CONCEPTS, MOCK_CONCEPTS);
  }
  if (!localStorage.getItem(KEYS.TRANSACTIONS)) {
    saveData<Transaction>(KEYS.TRANSACTIONS, []);
  }
  // Initialize new calculator data if not present
  if (!localStorage.getItem(KEYS.SALARY_CALCULATOR_DATA)) {
    saveItem(KEYS.SALARY_CALCULATOR_DATA, { grossSalary: 0, savingsPercentage: 10, expenses: [] });
  }
  if (!localStorage.getItem(KEYS.BREAK_EVEN_DATA)) {
    saveItem(KEYS.BREAK_EVEN_DATA, { fixedCosts: [], variableCosts: [], salePrice: 0 });
  }
  if (!localStorage.getItem(KEYS.DEBT_CALCULATOR_DATA)) {
    saveItem(KEYS.DEBT_CALCULATOR_DATA, { debts: [], extraPayment: 0 });
  }
};

// Jobs
export const getJobs = (): Job[] => {
  const jobs = getData<Job>(KEYS.JOBS, []);
  return jobs.map(job => ({
    ...job,
    tasks: job.tasks || [],
    photosBefore: rehydrateFiles(job.photosBefore),
    photosDuring: rehydrateFiles(job.photosDuring),
    photosAfter: rehydrateFiles(job.photosAfter),
    documents: rehydrateFiles(job.documents),
  }));
};

export const saveJobs = (jobs: Job[]): void => saveData<Job>(KEYS.JOBS, jobs);

export const addJob = (job: Job): void => {
  const jobs = getData<Job>(KEYS.JOBS, []);
  const sanitizedJob: Job = {
    ...job,
    photosBefore: sanitizeFiles(job.photosBefore),
    photosDuring: sanitizeFiles(job.photosDuring),
    photosAfter: sanitizeFiles(job.photosAfter),
    documents: sanitizeFiles(job.documents),
    tasks: job.tasks || [],
    gastosRegistrados: false,
  };
  saveJobs([...jobs, sanitizedJob]);
};

export const updateJob = (updatedJob: Job): { success: boolean; message?: string } => {
    const jobs = getData<Job>(KEYS.JOBS, []);
    const oldJob = jobs.find(j => j.id === updatedJob.id);

    if (oldJob) {
        // --- START OF CONSOLIDATED BUSINESS LOGIC ---
        // This block now handles all automatic actions when a job's status changes.

        // Create INCOME transaction when job is marked as PAID for the first time
        if (updatedJob.status === JobStatus.Paid && oldJob.status !== JobStatus.Paid && updatedJob.finalPrice) {
            addTransaction({
                id: generateId('trx-'),
                date: new Date().toISOString(),
                conceptId: 'concept-1', // 'Pago de Cliente'
                type: 'INGRESO',
                amount: updatedJob.finalPrice,
                notes: `Ingreso por trabajo finalizado: ${updatedJob.name}`,
                responsible: updatedJob.client?.name || 'Cliente',
            });
        }

        // Create EXPENSE transactions and deduct stock when job starts for the first time
        if (updatedJob.status === JobStatus.InProgress && !oldJob.gastosRegistrados) {
            const laborCost = updatedJob.assignedEmployees.reduce((sum, emp) => sum + (emp.dailySalary * emp.estimatedWorkdays), 0);
            const materialsCost = updatedJob.materials.reduce((sum, mat) => sum + (mat.unitPrice * mat.quantity), 0);
            
            // 1. Create transactions
            if (materialsCost > 0) {
                addTransaction({
                    id: generateId('trx-'),
                    date: new Date().toISOString(),
                    conceptId: 'concept-2', // 'Materiales de Construcción'
                    type: 'EGRESO',
                    amount: materialsCost,
                    notes: `Materiales para el trabajo: ${updatedJob.name}`
                });
            }
            if (laborCost > 0) {
                addTransaction({
                    id: generateId('trx-'),
                    date: new Date().toISOString(),
                    conceptId: 'concept-3', // 'Mano de Obra'
                    type: 'EGRESO',
                    amount: laborCost,
                    notes: `Mano de obra para el trabajo: ${updatedJob.name}`
                });
            }

            // 2. Deduct stock
            const materialsToUpdate = getMaterials();
            for (const jobMat of updatedJob.materials) {
                const materialIndex = materialsToUpdate.findIndex(m => m.id === jobMat.materialId);
                if (materialIndex !== -1) {
                    materialsToUpdate[materialIndex].stock -= jobMat.quantity;
                }
            }
            saveMaterials(materialsToUpdate);
            
            // 3. Set the flag to prevent this block from running again for this job
            updatedJob.gastosRegistrados = true;
        }

        // --- END OF CONSOLIDATED BUSINESS LOGIC ---

        const oldFileIds = new Set(getAllFileIdsFromJob(oldJob));
        const newFileIds = new Set(getAllFileIdsFromJob(updatedJob));
        const idsToDelete = [...oldFileIds].filter(id => !newFileIds.has(id));
        if (idsToDelete.length > 0) {
            deleteImages(idsToDelete);
        }
    }

    const sanitizedJob: Job = {
        ...updatedJob,
        photosBefore: sanitizeFiles(updatedJob.photosBefore),
        photosDuring: sanitizeFiles(updatedJob.photosDuring),
        photosAfter: sanitizeFiles(updatedJob.photosAfter),
        documents: sanitizeFiles(updatedJob.documents),
        tasks: updatedJob.tasks || [],
    };

    saveJobs(jobs.map(job => job.id === sanitizedJob.id ? sanitizedJob : job));
    return { success: true };
};


export const deleteJob = (jobId: string): void => {
  const jobs = getData<Job>(KEYS.JOBS, []);
  const jobToDelete = jobs.find(job => job.id === jobId);
  
  if (jobToDelete) {
      const fileIdsToDelete = getAllFileIdsFromJob(jobToDelete);
      deleteImages(fileIdsToDelete);
  }

  const filteredJobs = jobs.filter(job => job.id !== jobId);
  saveJobs(filteredJobs);
  const quotes = getQuotes();
  saveQuotes(quotes.filter(q => q.jobId !== jobId));
};

export const getJobById = (jobId: string): Job | undefined => {
  const jobs = getJobs();
  return jobs.find(job => job.id === jobId);
};

// Clients
export const getClients = (): Client[] => getData<Client>(KEYS.CLIENTS, MOCK_CLIENTS);
export const saveClients = (clients: Client[]): void => saveData<Client>(KEYS.CLIENTS, clients);
export const addClient = (client: Client): void => {
  const clients = getClients();
  saveClients([...clients, client]);
};
export const updateClient = (updatedClient: Client): void => {
  const clients = getClients();
  saveClients(clients.map(client => client.id === updatedClient.id ? updatedClient : client));
};
export const deleteClient = (clientId: string): void => {
  const clients = getClients();
  const filteredClients = clients.filter(client => client.id !== clientId);
  saveClients(filteredClients);
  const jobs = getJobs();
  saveJobs(jobs.map(job => job.clientId === clientId ? {...job, clientId: '', client: {id:'', name: 'Cliente Eliminado'}} : job));
  const quotes = getQuotes();
  saveQuotes(quotes.map(q => q.clientId === clientId ? {...q, clientId: '', clientName: 'Cliente Eliminado', clientInfo: {...q.clientInfo, id: '', name: 'Cliente Eliminado'}} : q));
};

// Employees
export const getEmployees = (): Employee[] => getData<Employee>(KEYS.EMPLOYEES, MOCK_EMPLOYEES);
export const saveEmployees = (employees: Employee[]): void => saveData<Employee>(KEYS.EMPLOYEES, employees);
export const addEmployee = (employee: Employee): void => {
  const employees = getEmployees();
  saveEmployees([...employees, employee]);
};
export const updateEmployee = (updatedEmployee: Employee): void => {
  const employees = getEmployees();
  saveEmployees(employees.map(emp => emp.id === updatedEmployee.id ? updatedEmployee : emp));
};
export const deleteEmployee = (employeeId: string): void => {
  const employees = getEmployees();
  const filteredEmployees = employees.filter(emp => emp.id !== employeeId);
  saveEmployees(filteredEmployees);
};

// Materials
export const getMaterials = (): Material[] => getData<Material>(KEYS.MATERIALS, MOCK_MATERIALS);
export const saveMaterials = (materials: Material[]): void => saveData<Material>(KEYS.MATERIALS, materials);
export const addMaterial = (material: Material): void => {
  const materials = getMaterials();
  saveMaterials([...materials, material]);
};
export const updateMaterial = (updatedMaterial: Material): void => {
  const materials = getMaterials();
  saveMaterials(materials.map(mat => mat.id === updatedMaterial.id ? updatedMaterial : mat));
};
export const deleteMaterial = (materialId: string): void => {
  const materials = getMaterials();
  const filteredMaterials = materials.filter(mat => mat.id !== materialId);
  saveMaterials(filteredMaterials);
};
export const getLowStockMaterials = (): Material[] => {
    const materials = getMaterials();
    return materials.filter(material => material.minStockThreshold !== undefined && material.stock <= material.minStockThreshold);
};

// Tools
export const getTools = (): Tool[] => getData<Tool>(KEYS.TOOLS, MOCK_TOOLS);
export const saveTools = (tools: Tool[]): void => saveData<Tool>(KEYS.TOOLS, tools);
export const addTool = (tool: Tool): void => {
  const tools = getTools();
  saveTools([...tools, tool]);
};
export const updateTool = (updatedTool: Tool): void => {
  const tools = getTools();
  saveTools(tools.map(t => t.id === updatedTool.id ? updatedTool : t));
};
export const deleteTool = (toolId: string): void => {
  const tools = getTools();
  const filteredTools = tools.filter(t => t.id !== toolId);
  saveTools(filteredTools);
};

// Suppliers
export const getSuppliers = (): Supplier[] => getData<Supplier>(KEYS.SUPPLIERS, MOCK_SUPPLIERS);
export const saveSuppliers = (suppliers: Supplier[]): void => saveData<Supplier>(KEYS.SUPPLIERS, suppliers);
export const addSupplier = (supplier: Supplier): void => {
    const suppliers = getSuppliers();
    saveSuppliers([...suppliers, supplier]);
};
export const updateSupplier = (updatedSupplier: Supplier): void => {
    const suppliers = getSuppliers();
    saveSuppliers(suppliers.map(s => s.id === updatedSupplier.id ? updatedSupplier : s));
};
export const deleteSupplier = (supplierId: string): void => {
    const suppliers = getSuppliers();
    saveSuppliers(suppliers.filter(s => s.id !== supplierId));
};


// Company Profile
export const getCompanyProfile = (): CompanyProfile => getItem<CompanyProfile>(KEYS.COMPANY_PROFILE, DEFAULT_COMPANY_PROFILE);
export const saveCompanyProfile = (profile: CompanyProfile): void => saveItem<CompanyProfile>(KEYS.COMPANY_PROFILE, profile);

// Admin Profile
export const getAdminProfile = (): AdminProfile => getItem<AdminProfile>(KEYS.ADMIN_PROFILE, DEFAULT_ADMIN_PROFILE);
export const saveAdminProfile = (profile: AdminProfile): void => saveItem<AdminProfile>(KEYS.ADMIN_PROFILE, profile);

// Quotes
export const getQuotes = (): Quote[] => getData<Quote>(KEYS.QUOTES, MOCK_QUOTES);
export const saveQuotes = (quotes: Quote[]): void => saveData<Quote>(KEYS.QUOTES, quotes);

export const addQuote = (quote: Quote): void => {
  const quotes = getQuotes();
  const newQuote = {
    ...quote,
    status: quote.status || QuoteStatus.Draft,
  };
  saveQuotes([...quotes, newQuote]);
  
  const jobs = getJobs();
  const jobIndex = jobs.findIndex(j => j.id === newQuote.jobId);
  if (jobIndex > -1) {
    const jobToUpdate = { ...jobs[jobIndex] };
    jobToUpdate.operationalCost = newQuote.materialsCost + newQuote.laborCost + (newQuote.otherProjectExpenses || 0);
    jobToUpdate.finalPrice = newQuote.totalAmount;
    jobToUpdate.profitMargin = jobToUpdate.operationalCost > 0 ? newQuote.adminProfit / jobToUpdate.operationalCost : 0;
    jobs[jobIndex] = jobToUpdate;
    saveJobs(jobs);
  }
};

export const updateQuote = (updatedQuote: Quote): void => {
  const quotes = getQuotes();
  saveQuotes(quotes.map(q => q.id === updatedQuote.id ? updatedQuote : q));

  const jobs = getJobs();
  const jobIndex = jobs.findIndex(j => j.id === updatedQuote.jobId);
  if (jobIndex > -1) {
    const jobToUpdate = { ...jobs[jobIndex] };
    jobToUpdate.operationalCost = updatedQuote.materialsCost + updatedQuote.laborCost + (updatedQuote.otherProjectExpenses || 0);
    jobToUpdate.finalPrice = updatedQuote.totalAmount;
    jobToUpdate.profitMargin = jobToUpdate.operationalCost > 0 ? updatedQuote.adminProfit / jobToUpdate.operationalCost : 0;
    jobs[jobIndex] = jobToUpdate;
    saveJobs(jobs);
  }
};

export const deleteQuote = (quoteId: string): void => {
  const quotes = getQuotes();
  const filteredQuotes = quotes.filter(q => q.id !== quoteId);
  saveQuotes(filteredQuotes);
};


// Company Financials
export const getCompanyFinancials = (): CompanyFinancials => getItem<CompanyFinancials>(KEYS.COMPANY_FINANCIALS, DEFAULT_COMPANY_FINANCIALS);
export const saveCompanyFinancials = (financials: CompanyFinancials): void => saveItem<CompanyFinancials>(KEYS.COMPANY_FINANCIALS, financials);

export const addBudgetEntry = (entry: BudgetEntry): void => {
  const financials = getCompanyFinancials();
  const updatedFinancials: CompanyFinancials = {
    ...financials,
    currentBudget: financials.currentBudget + entry.amount,
    budgetHistory: [...financials.budgetHistory, entry],
  };
  saveCompanyFinancials(updatedFinancials);
};

// ===============================================
// FINANCIAL TRANSACTIONS & CONCEPTS
// ===============================================

// Concepts
export const getConcepts = (): Concept[] => getData<Concept>(KEYS.CONCEPTS, MOCK_CONCEPTS);
export const saveConcepts = (concepts: Concept[]): void => saveData<Concept>(KEYS.CONCEPTS, concepts);
export const addConcept = (concept: Concept): void => {
  const concepts = getConcepts();
  saveConcepts([...concepts, concept]);
};

// Transactions
export const getTransactions = (): Transaction[] => getData<Transaction>(KEYS.TRANSACTIONS, []);
export const saveTransactions = (transactions: Transaction[]): void => saveData<Transaction>(KEYS.TRANSACTIONS, transactions);
export const addTransaction = (transaction: Transaction): void => {
  const transactions = getTransactions();
  saveTransactions([...transactions, transaction]);
};
export const updateTransaction = (updatedTransaction: Transaction): void => {
  const transactions = getTransactions();
  saveTransactions(transactions.map(t => t.id === updatedTransaction.id ? updatedTransaction : t));
};
export const deleteTransaction = (transactionId: string): void => {
  const transactions = getTransactions();
  saveTransactions(transactions.filter(t => t.id !== transactionId));
};


// ===============================================
// NEW FINANCIAL CALCULATOR FUNCTIONS
// ===============================================

// Salary Calculator
export const getSalaryCalculatorData = () => getItem(KEYS.SALARY_CALCULATOR_DATA, { grossSalary: 0, savingsPercentage: 10, expenses: [] });
export const saveSalaryCalculatorData = (data: any) => saveItem(KEYS.SALARY_CALCULATOR_DATA, data);

// Break-Even Calculator
export const getBreakEvenData = () => getItem(KEYS.BREAK_EVEN_DATA, { fixedCosts: [], variableCosts: [], salePrice: 0 });
export const saveBreakEvenData = (data: any) => saveItem(KEYS.BREAK_EVEN_DATA, data);

// Debt Calculator
export const getDebtCalculatorData = () => getItem(KEYS.DEBT_CALCULATOR_DATA, { debts: [], extraPayment: 0 });
export const saveDebtCalculatorData = (data: any) => saveItem(KEYS.DEBT_CALCULATOR_DATA, data);


// Utility for generating unique IDs
export const generateId = (prefix: string = ''): string => `${prefix}${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

// Utility for handling file to base64
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};