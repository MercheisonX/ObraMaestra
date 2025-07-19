

export enum JobStatus {
  InProgress = 'En Progreso',
  Pending = 'Pendiente',
  Paused = 'Pausado',
  Completed = 'Finalizado', // Pending Payment
  Paid = 'Pagado',
}

export enum JobType {
  Plumbing = 'Plomería',
  Painting = 'Pintura',
  Electricity = 'Electricidad',
  Tiling = 'Enchapado',
  Waterproofing = 'Impermeabilización',
  Remodeling = 'Remodelación',
  Other = 'Otro',
}

export interface Client {
  id: string;
  name:string;
  contact?: string; // Could be phone, email, or ID number
  address?: string;
  email?: string; // Added for more comprehensive client info
  phone?: string; // Added for more comprehensive client info
  photoUrl?: string; // For client profile picture
  notes?: string; // Added for additional client notes
}

export interface Employee {
  id: string;
  name: string;
  specialty: string;
  dailySalary: number;
  cedula?: string;
  phone?: string;
  email?: string;
  address?: string;
  photoUrl?: string; // Base64 string or URL
  notes?: string;
}

export interface Material {
  id: string;
  name: string;
  unitPrice: number;
  unit: string; // e.g., 'bag', 'gallon', 'meter'
  stock: number;
  description?: string;
  supplier?: string; // Legacy, to be replaced by association with Supplier entity
  photoUrl?: string; // Base64 string or URL
  minStockThreshold?: number;
  // Future: preferredSupplierId?: string;
}

export interface Tool {
  id: string;
  name: string;
  status: 'disponible' | 'en uso' | 'en reparación';
  acquisitionDate?: string;
  lastMaintenanceDate?: string;
  description?: string;
  photoUrl?: string; // Base64 string or URL
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  // Future: paymentTerms?: string;
}


export interface JobMaterial {
  id: string; // Unique ID for this specific assignment of material to job
  materialId: string; // Reference to the Material
  name: string;
  unitPrice: number;
  unit: string;
  quantity: number;
}

export type PaymentMethod = 'Efectivo' | 'Transferencia' | 'Nequi' | 'Daviplata' | 'Otro';

export interface Payment {
  id: string;
  amount: number;
  date: string; // ISO Date string
  method: PaymentMethod;
  notes?: string;
}

export interface JobEmployee {
  id: string; // Unique ID for this specific assignment of employee to job
  employeeId: string; // Reference to the Employee
  name: string;
  specialty: string;
  dailySalary: number;
  estimatedWorkdays: number;
  payments?: Payment[];
}

export interface JobTool {
  id: string; // Unique ID for this specific assignment of tool to job
  toolId: string; // Reference to the Tool
  name: string;
  // any specific notes for this tool in this job?
}

export interface UploadedFile {
  id: string;
  name: string;
  type: 'photo' | 'document'; // To differentiate handling
  urlOrBase64?: string; // For photos, could be base64. For docs, could be a name or simulated URL.
  file?: File; // Original file object, transient, not for localStorage
}

export interface Task {
  id: string;
  jobId: string;
  title: string;
  description?: string;
  isCompleted: boolean;
  creationDate: string; // ISO Date string
  dueDate?: string; // ISO Date string
  allocatedTime?: string; // e.g., "2 hours", "1 day", "30 mins"
}

export interface Job {
  id: string;
  name: string;
  jobType: JobType;
  client: Client; // Store client ID, and denormalize name for display, or fetch client object
  clientId: string;
  address: string;
  specificLocation?: string; // Conjunto, Torre, Apto, Piso
  detailedLocation?: string; // Baño social, Cocina, etc.
  progress: number; // 0-100
  startDateProposed: string; // ISO Date string
  endDateEstimated: string; // ISO Date string
  status: JobStatus;
  costAlert: boolean; // true if costs are over budget
  assignedEmployees: JobEmployee[];
  materials: JobMaterial[];
  assignedTools: JobTool[];
  tasks?: Task[]; // Added tasks
  photosBefore: UploadedFile[];
  photosDuring: UploadedFile[]; // Added for more comprehensive documentation
  photosAfter: UploadedFile[];
  documents: UploadedFile[]; // URLs or file names
  operationalCost?: number;
  profitMargin?: number;
  finalPrice?: number;
  notes?: string;
  gastosRegistrados?: boolean; // Flag to indicate if stock has been deducted and expenses logged for this job
  paidDate?: string; // ISO Date string for when the job was marked as paid
}

export interface CompanyProfile {
  legalName: string;
  businessName: string;
  nit: string;
  fiscalAddress: string;
  phone: string;
  email: string;
  bankDetails: string;
  logoUrl?: string; // Base64 string or URL
}

export interface AdminProfile {
  name: string;
  idNumber: string;
  phone: string;
  email: string;
}

export interface ExpenseCategoryChartData {
  name: string;
  value: number;
}

export interface IncomeExpenseChartData {
  name: string; // e.g., 'Semana Actual', 'Mes Pasado'
  ingresos: number;
  gastos: number;
}

export enum QuoteStatus {
  Draft = 'Borrador',
  Sent = 'Enviada',
  Approved = 'Aprobada',
  Rejected = 'Rechazada',
}

export type PdfTemplateType = 'detailed' | 'summary';

export interface Quote {
  id: string;
  jobId: string; 
  jobName?: string; 
  clientName?: string; 
  clientId?: string; 
  quoteNumber: string;
  date: string; // ISO Date string
  validityDate?: string; 
  status: QuoteStatus;
  companyInfo: CompanyProfile;
  clientInfo: Client; 
  serviceDescription: string;
  materialsCost: number;
  laborCost: number;
  otherProjectExpenses?: number; // Added to store other specific project expenses used in the quote
  adminProfit: number; 
  subtotal: number; 
  ivaRate?: number; 
  ivaAmount?: number;
  totalAmount: number;
  termsAndConditions: string;
  clientNotesForPdf?: string; // Added to persist this user preference for PDF generation
  templateTypeForPdf?: PdfTemplateType; // Added to persist this user preference
}


export interface GroundingChunk {
  web?: {
    uri?: string;
    title?: string;
  };
  retrievedContext?: {
    uri?: string;
    title?: string;
  };
}

// New types for Finance Configuration
export type BudgetSource = 'banco' | 'efectivo' | 'tarjeta' | 'otro';

export interface BudgetEntry {
  id: string;
  amount: number;
  source: BudgetSource;
  bankName?: string; // if source is 'banco'
  description?: string; // for 'otro' or general notes
  enteredBy: string; // Admin name
  date: string; // ISO Date string
}

export interface CompanyFinancials {
  currentBudget: number; // Overall budget that gets updated by entries
  budgetHistory: BudgetEntry[];
  // Future: Could include fields for fixed monthly admin costs, tool maintenance budget etc.
  // monthlyAdminCost?: number;
  // defaultToolMaintenanceRate?: number; // e.g. 0.05 (5% of tool value per year)
}

// == NEW TYPES FOR FINANCIAL TRANSACTIONS ==
export type TransactionType = 'INGRESO' | 'EGRESO';

export interface Concept {
    id: string;
    name: string;
}

export interface Transaction {
    id: string;
    date: string; // ISO date string
    conceptId: string; // Links to a Concept
    type: TransactionType;
    amount: number;
    receiptNumber?: string;
    responsible?: string;
    notes?: string;
}

export interface GroupedTransaction {
    concept: string;
    total: number;
}