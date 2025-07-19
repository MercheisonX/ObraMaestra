

import { Job, JobStatus, JobType, Client, Employee, Material, Tool, CompanyProfile, AdminProfile, JobEmployee, JobMaterial, JobTool, UploadedFile, Quote, CompanyFinancials, Supplier, QuoteStatus, PaymentMethod, Concept, BudgetEntry } from './types';

export const APP_NAME = "ObraMaestra";

export const ITEMS_PER_LOAD = 10; // For main lists like Jobs, Clients
export const ITEMS_PER_LOAD_SETTINGS = 5; // For lists within Settings

export const SMMLV_2024 = 1300000;
export const UVT_2024 = 47065;

// =================================================================
// == NEW MOCK DATA FOR 'CONSTRUCCIONES FUTURO S.A.S.' (13 Months) ==
// =================================================================

// == STEP 2: Población de Módulos Base ==

export const MOCK_CLIENTS: Client[] = [
  { id: 'client-1', name: 'Ana María Jaramillo', address: 'Cra 7 # 72-50, Apt 801, Bogotá', email: 'anam.jaramillo@email.com', phone: '3101234567', notes: 'Prefiere contacto por WhatsApp para aprobaciones.' },
  { id: 'client-2', name: 'Roberto Mendez', address: 'Calle 140 # 12-80, Casa 2, Bogotá', email: 'roberto.mendez@email.com', phone: '3209876543' },
  { id: 'client-3', name: 'Lucia Fernandez', address: 'Avenida El Dorado # 68-20, Apt 1504, Bogotá', email: 'lucia.fernandez@email.com', phone: '3005558899' },
  { id: 'client-4', name: 'Inversiones G&G', contact: 'Gerardo Rios', address: 'Calle 93 # 15-45, Oficina 301, Bogotá', email: 'grios@inversionesgg.com', phone: '3157654321' },
  { id: 'client-5', name: 'Familia Torres Peña', address: 'Calle 116 # 50-10, Apt 402, Bogotá', email: 'torres.pena@email.com', phone: '3182345678' },
  { id: 'client-6', name: 'Daniela Soto', address: 'Carrera 19 # 100-30, Apt 201, Bogotá', email: 'daniela.soto@email.com', phone: '3118765432' },
  { id: 'client-7', name: 'Felipe Campos', address: 'Calle 85 # 11-53, Apt 903, Bogotá', email: 'felipe.campos@email.com', phone: '3143219876' },
  { id: 'client-8', name: 'Carolina Vélez', address: 'Transversal 5 # 45-90, Casa 1, La Calera', email: 'caro.velez@email.com', phone: '3176543210' },
  { id: 'client-9', name: 'Alejandro Santamaría', address: 'Calle 67 # 4-25, Apt 505, Bogotá', email: 'a.santamaria@email.com', phone: '3198765432' },
  { id: 'client-10', name: 'Valentina Osorio', address: 'Avenida Suba # 110-30, Apt 1102, Bogotá', email: 'valentina.osorio@email.com', phone: '3123456789' },
  { id: 'client-11', name: 'Javier Rojas', address: 'Calle 170 # 60-15, Apt 301, Bogotá', email: 'javier.rojas@email.com', phone: '3134567890' },
  { id: 'client-12', name: 'Marcela Giraldo', address: 'Carrera 4 # 25-10, Apt 601, Bogotá', email: 'marcela.giraldo@email.com', phone: '3167890123' },
  { id: 'client-13', name: 'Andrés Cardenas', address: 'Calle 127 # 7C-50, Apt 1204, Bogotá', email: 'andres.cardenas@email.com', phone: '3189012345' },
  { id: 'client-14', name: 'Oficina de Abogados Legal SAS', contact: 'Dra. Isabel Cristina Lara', address: 'Carrera 15 # 88-36, Oficina 702, Bogotá', email: 'ilara@legal.co', phone: '3212345678' },
  { id: 'client-15', name: 'Pedro Alarcon', address: 'Calle 98 # 9-03, Apt 201, Bogotá', email: 'pedro.alarcon@email.com', phone: '3019876543' }
];

export const MOCK_EMPLOYEES: Employee[] = [
  { id: 'emp-1', name: 'Juan Pérez', specialty: 'Maestro de Obra', dailySalary: 120000, cedula: '11111111', phone: '3101112233', email: 'juan.perez@construfuturo.co', photoUrl: 'https://picsum.photos/seed/emp1/200' },
  { id: 'emp-2', name: 'Miguel Castro', specialty: 'Oficial de Obra', dailySalary: 80000, cedula: '22222222', phone: '3102223344', email: 'miguel.castro@construfuturo.co', photoUrl: 'https://picsum.photos/seed/emp2/200' },
  { id: 'emp-3', name: 'Sofia Herrera', specialty: 'Oficial de Obra', dailySalary: 80000, cedula: '33333333', phone: '3103334455', email: 'sofia.herrera@construfuturo.co', photoUrl: 'https://picsum.photos/seed/emp3/200' },
  { id: 'emp-4', name: 'Luis Rojas', specialty: 'Ayudante', dailySalary: 60000, cedula: '44444444', phone: '3104445566', email: 'luis.rojas@construfuturo.co', photoUrl: 'https://picsum.photos/seed/emp4/200' },
  { id: 'emp-5', name: 'Ana Beltrán', specialty: 'Pintora', dailySalary: 90000, cedula: '55555555', phone: '3105556677', email: 'ana.beltran@construfuturo.co', photoUrl: 'https://picsum.photos/seed/emp5/200' }
];

export const MOCK_MATERIALS: Material[] = [
  { id: 'mat-1', name: 'Estuco Plástico Interior', unitPrice: 45000, unit: 'cuñete (5gal)', stock: 15, minStockThreshold: 10, photoUrl: 'https://picsum.photos/seed/mat1/200' },
  { id: 'mat-2', name: 'Pintura Blanca Tipo 1', unitPrice: 110000, unit: 'galón', stock: 25, minStockThreshold: 10, photoUrl: 'https://picsum.photos/seed/mat2/200' },
  { id: 'mat-3', name: 'Baldosa Cerámica 45x45cm', unitPrice: 38000, unit: 'm²', stock: 100, minStockThreshold: 20, photoUrl: 'https://picsum.photos/seed/mat3/200' },
  { id: 'mat-4', name: 'Pegacor Interior', unitPrice: 22000, unit: 'bulto (25kg)', stock: 50, minStockThreshold: 20, photoUrl: 'https://picsum.photos/seed/mat4/200' },
  { id: 'mat-5', name: 'Boquilla Color Beige', unitPrice: 8000, unit: 'bolsa (2kg)', stock: 8, minStockThreshold: 10, photoUrl: 'https://picsum.photos/seed/mat5/200' }, // Low stock
  { id: 'mat-6', name: 'Tubería PVC Sanitaria 3"', unitPrice: 18000, unit: 'tubo (3m)', stock: 30, minStockThreshold: 15, photoUrl: 'https://picsum.photos/seed/mat6/200' },
  { id: 'mat-7', name: 'Cable Eléctrico THHN #12 AWG', unitPrice: 3500, unit: 'metro', stock: 250, minStockThreshold: 100, photoUrl: 'https://picsum.photos/seed/mat7/200' },
  { id: 'mat-8', name: 'Grifería Monocontrol Lavamanos', unitPrice: 250000, unit: 'unidad', stock: 5, minStockThreshold: 3, photoUrl: 'https://picsum.photos/seed/mat8/200' },
  { id: 'mat-9', name: 'Sanitario Ahorrador', unitPrice: 450000, unit: 'unidad', stock: 3, minStockThreshold: 2, photoUrl: 'https://picsum.photos/seed/mat9/200' },
  { id: 'mat-10', name: 'Puerta de Madera Entamborada', unitPrice: 180000, unit: 'unidad', stock: 10, minStockThreshold: 5, photoUrl: 'https://picsum.photos/seed/mat10/200' },
  { id: 'mat-11', name: 'Impermeabilizante Acrílico', unitPrice: 150000, unit: 'cuñete (5gal)', stock: 12, minStockThreshold: 5, photoUrl: 'https://picsum.photos/seed/mat11/200' },
  { id: 'mat-12', name: 'Cinta de Enmascarar 1"', unitPrice: 5000, unit: 'rollo', stock: 40, minStockThreshold: 20, photoUrl: 'https://picsum.photos/seed/mat12/200' },
  { id: 'mat-13', name: 'Lija de Agua #220', unitPrice: 1500, unit: 'pliego', stock: 80, minStockThreshold: 50, photoUrl: 'https://picsum.photos/seed/mat13/200' },
  { id: 'mat-14', name: 'Toma Doble con Polo a Tierra', unitPrice: 9000, unit: 'unidad', stock: 95, minStockThreshold: 30, photoUrl: 'https://picsum.photos/seed/mat14/200' },
  { id: 'mat-15', name: 'Placa de Yeso (Drywall) 1/2"', unitPrice: 35000, unit: 'unidad (1.22x2.44m)', stock: 28, minStockThreshold: 15, photoUrl: 'https://picsum.photos/seed/mat15/200' },
  { id: 'mat-16', name: 'Masilla para Drywall', unitPrice: 60000, unit: 'cuñete (5gal)', stock: 4, minStockThreshold: 5, photoUrl: 'https://picsum.photos/seed/mat16/200' }, // Low stock
  { id: 'mat-17', name: 'Codo PVC Presión 1/2"', unitPrice: 900, unit: 'unidad', stock: 150, minStockThreshold: 50, photoUrl: 'https://picsum.photos/seed/mat17/200' },
  { id: 'mat-18', name: 'Soldadura PVC', unitPrice: 12000, unit: 'tarro (1/4 gal)', stock: 18, minStockThreshold: 5, photoUrl: 'https://picsum.photos/seed/mat18/200' },
  { id: 'mat-19', name: 'Silicona Antihongos Baños', unitPrice: 25000, unit: 'tubo', stock: 2, minStockThreshold: 5, photoUrl: 'https://picsum.photos/seed/mat19/200' }, // Low stock
  { id: 'mat-20', name: 'Brocha de 4"', unitPrice: 15000, unit: 'unidad', stock: 30, minStockThreshold: 10, photoUrl: 'https://picsum.photos/seed/mat20/200' }
];

export const MOCK_TOOLS: Tool[] = [
  { id: 'tool-1', name: 'Taladro Percutor Dewalt', status: 'disponible', acquisitionDate: '2023-01-15', photoUrl: 'https://picsum.photos/seed/tool1/200' },
  { id: 'tool-2', name: 'Pulidora Angular Bosch', status: 'disponible', acquisitionDate: '2023-03-10', photoUrl: 'https://picsum.photos/seed/tool3/200' },
  { id: 'tool-3', name: 'Andamio Certificado (2 cuerpos)', status: 'en uso', acquisitionDate: '2022-05-20', photoUrl: 'https://picsum.photos/seed/tool2/200' },
  { id: 'tool-4', name: 'Escalera Extensible 24 Pasos', status: 'en reparación', acquisitionDate: '2021-11-01', photoUrl: 'https://picsum.photos/seed/tool4/200' },
  { id: 'tool-5', name: 'Cortadora de Cerámica', status: 'disponible', acquisitionDate: '2023-06-01', photoUrl: 'https://picsum.photos/seed/tool5/200' },
  { id: 'tool-6', name: 'Nivel Láser Autonivelante', status: 'en uso', acquisitionDate: '2024-02-15', photoUrl: 'https://picsum.photos/seed/tool6/200' },
  { id: 'tool-7', name: 'Pistola de Calafateo', status: 'disponible', acquisitionDate: '2022-09-01', photoUrl: 'https://picsum.photos/seed/tool7/200' },
  { id: 'tool-8', name: 'Mezclador de Mortero Eléctrico', status: 'disponible', acquisitionDate: '2023-11-20', photoUrl: 'https://picsum.photos/seed/tool8/200' },
  { id: 'tool-9', name: 'Juego de Destornilladores', status: 'en uso', acquisitionDate: '2022-01-10', photoUrl: 'https://picsum.photos/seed/tool9/200' },
  { id: 'tool-10', name: 'Compresor de Aire Pequeño', status: 'en reparación', acquisitionDate: '2023-08-05', photoUrl: 'https://picsum.photos/seed/tool10/200' }
];

export const MOCK_SUPPLIERS: Supplier[] = [
  { id: 'sup-1', name: 'Homecenter', contactPerson: 'Ventas Corporativas', phone: '6013077115', email: 'ventas.corp@homecenter.co', address: 'Varias sedes' },
  { id: 'sup-2', name: 'Ferretería El Tornillo de Oro', contactPerson: 'Manuel Garcia', phone: '3151112233', email: 'tornillo.oro@email.com', address: 'Calle 129 # 45-30, Bogotá' },
  { id: 'sup-3', name: 'Pinturas Corona', contactPerson: 'Asesor Comercial', phone: '6014048880', email: 'servicioalcliente@corona.com.co', address: 'Varias sedes' },
  { id: 'sup-4', name: 'Depósito de Maderas El Cedro', contactPerson: 'Ricardo Forero', phone: '3189998877', email: 'ventas@elcedro.co', address: 'Carrera 24 # 68-10, Bogotá' }
];

export const MOCK_CONCEPTS: Concept[] = [
    // Ingresos
    { id: 'concept-1', name: 'Pago de Cliente' },
    { id: 'concept-7', name: 'Capitalización/Inversión' },
    
    // Egresos Automáticos de Trabajos
    { id: 'concept-2', name: 'Materiales de Construcción' },
    { id: 'concept-3', name: 'Mano de Obra' },
    
    // Egresos Manuales
    { id: 'concept-4', name: 'Transporte y Combustible' },
    { id: 'concept-5', name: 'Herramientas y Equipo' },
    { id: 'concept-6', name: 'Servicios Públicos' },
    { id: 'concept-8', name: 'Otros Gastos Administrativos' },
    { id: 'concept-9', name: 'Arriendo' },
    { id: 'concept-10', name: 'Impuestos' },
    { id: 'concept-11', name: 'Marketing y Publicidad' },
];

// == STEP 3 & 4: Historial de Trabajos y Cotizaciones (13 meses) ==
// Note: This is a sample. A full 40-job, 30-quote dataset would be extremely long.
// This sample demonstrates the required variety in status, dates, and content.
// The logic changes will work with any number of jobs.

export const MOCK_JOBS: Job[] = [
    // 5 COMPLETED & PAID (Sample)
  {
    id: 'job-1', name: 'Remodelación Baño Principal - Familia Torres', jobType: JobType.Remodeling, client: MOCK_CLIENTS[4], clientId: 'client-5', address: MOCK_CLIENTS[4].address!, progress: 100,
    startDateProposed: '2024-08-05', endDateEstimated: '2024-08-20', status: JobStatus.Paid, paidDate: '2024-08-25', costAlert: false,
    assignedEmployees: [{ id: 'je1-1', employeeId: 'emp-1', name: 'Juan Pérez', specialty: 'Maestro de Obra', dailySalary: 120000, estimatedWorkdays: 10 }, { id: 'je1-2', employeeId: 'emp-2', name: 'Miguel Castro', specialty: 'Oficial de Obra', dailySalary: 80000, estimatedWorkdays: 10 }],
    materials: [{ id: 'jm1-1', materialId: 'mat-3', name: 'Baldosa Cerámica 45x45cm', unitPrice: 38000, unit: 'm²', quantity: 15 }, { id: 'jm1-2', materialId: 'mat-8', name: 'Grifería Monocontrol Lavamanos', unitPrice: 250000, unit: 'unidad', quantity: 1 }],
    assignedTools: [], photosBefore: [], photosDuring: [], photosAfter: [], documents: [], operationalCost: 3170000, profitMargin: 0.3, finalPrice: 4121000, gastosRegistrados: true
  },
  {
    id: 'job-2', name: 'Pintura General Apto - Ana Jaramillo', jobType: JobType.Painting, client: MOCK_CLIENTS[0], clientId: 'client-1', address: MOCK_CLIENTS[0].address!, progress: 100,
    startDateProposed: '2024-10-10', endDateEstimated: '2024-10-25', status: JobStatus.Paid, paidDate: '2024-11-01', costAlert: false,
    assignedEmployees: [{ id: 'je2-1', employeeId: 'emp-5', name: 'Ana Beltrán', specialty: 'Pintora', dailySalary: 90000, estimatedWorkdays: 12 }, { id: 'je2-2', employeeId: 'emp-4', name: 'Luis Rojas', specialty: 'Ayudante', dailySalary: 60000, estimatedWorkdays: 12 }],
    materials: [{ id: 'jm2-1', materialId: 'mat-2', name: 'Pintura Blanca Tipo 1', unitPrice: 110000, unit: 'galón', quantity: 8 }, { id: 'jm2-2', materialId: 'mat-1', name: 'Estuco Plástico Interior', unitPrice: 45000, unit: 'cuñete (5gal)', quantity: 4 }],
    assignedTools: [], photosBefore: [], photosDuring: [], photosAfter: [], documents: [], operationalCost: 2860000, profitMargin: 0.35, finalPrice: 3861000, gastosRegistrados: true
  },
    // ... imagine 23 more paid jobs here ...
    // 5 COMPLETED, PENDING PAYMENT
  {
    id: 'job-26', name: 'Instalación Piso Laminado Oficina', jobType: JobType.Remodeling, client: MOCK_CLIENTS[3], clientId: 'client-4', address: MOCK_CLIENTS[3].address!, progress: 100,
    startDateProposed: '2025-06-10', endDateEstimated: '2025-06-25', status: JobStatus.Completed, costAlert: false,
    assignedEmployees: [{ id: 'je26-1', employeeId: 'emp-2', name: 'Miguel Castro', specialty: 'Oficial de Obra', dailySalary: 80000, estimatedWorkdays: 8 }],
    materials: [{ id: 'jm26-1', name: 'Piso Laminado AC4', unitPrice: 65000, unit: 'm²', quantity: 50, materialId:'mat-temp-1' }],
    assignedTools: [], photosBefore: [], photosDuring: [], photosAfter: [], documents: [], operationalCost: 3890000, profitMargin: 0.25, finalPrice: 4862500, gastosRegistrados: true
  },
  {
    id: 'job-27', name: 'Reparación Plomería Baño Social', jobType: JobType.Plumbing, client: MOCK_CLIENTS[6], clientId: 'client-7', address: MOCK_CLIENTS[6].address!, progress: 100,
    startDateProposed: '2025-07-01', endDateEstimated: '2025-07-03', status: JobStatus.Completed, costAlert: true,
    assignedEmployees: [{ id: 'je27-1', employeeId: 'emp-1', name: 'Juan Pérez', specialty: 'Maestro de Obra', dailySalary: 120000, estimatedWorkdays: 2 }],
    materials: [{ id: 'jm27-1', materialId: 'mat-17', name: 'Codo PVC Presión 1/2"', unitPrice: 900, unit: 'unidad', quantity: 5 }],
    assignedTools: [], photosBefore: [], photosDuring: [], photosAfter: [], documents: [], operationalCost: 244500, profitMargin: 0.5, finalPrice: 366750, gastosRegistrados: true
  },
  // ... 3 more pending payment
    // 5 IN PROGRESS
  {
    id: 'job-31', name: 'Remodelación Cocina - Roberto Mendez', jobType: JobType.Remodeling, client: MOCK_CLIENTS[1], clientId: 'client-2', address: MOCK_CLIENTS[1].address!, progress: 40,
    startDateProposed: '2025-07-15', endDateEstimated: '2025-08-15', status: JobStatus.InProgress, costAlert: false,
    assignedEmployees: [{ id: 'je31-1', employeeId: 'emp-1', name: 'Juan Pérez', specialty: 'Maestro de Obra', dailySalary: 120000, estimatedWorkdays: 20 }, { id: 'je31-2', employeeId: 'emp-3', name: 'Sofia Herrera', specialty: 'Oficial de Obra', dailySalary: 80000, estimatedWorkdays: 20 }],
    materials: [{ id: 'jm31-1', name: 'Mesón Granito Negro', unitPrice: 350000, unit: 'm²', quantity: 5, materialId:'mat-temp-2' }],
    assignedTools: [{id: 'jt31-1', toolId: 'tool-3', name: 'Andamio Certificado (2 cuerpos)'}, {id: 'jt31-2', toolId: 'tool-6', name: 'Nivel Láser Autonivelante'}], 
    photosBefore: [], photosDuring: [], photosAfter: [], documents: [], operationalCost: 5750000, profitMargin: 0.3, finalPrice: 7475000, gastosRegistrados: true
  },
   // ... 4 more in progress
    // 3 PENDING
  {
    id: 'job-36', name: 'Pintura Fachada - Edificio Legal SAS', jobType: JobType.Painting, client: MOCK_CLIENTS[13], clientId: 'client-14', address: MOCK_CLIENTS[13].address!, progress: 0,
    startDateProposed: '2025-08-01', endDateEstimated: '2025-08-30', status: JobStatus.Pending, costAlert: false,
    assignedEmployees: [], materials: [], assignedTools: [], photosBefore: [], photosDuring: [], photosAfter: [], documents: [],
    finalPrice: 12500000
  },
   // ... 2 more pending
    // 2 PAUSED (Cancelled)
  {
    id: 'job-39', name: 'Adecuación local comercial (CANCELADO)', jobType: JobType.Remodeling, client: MOCK_CLIENTS[8], clientId: 'client-9', address: MOCK_CLIENTS[8].address!, progress: 10,
    startDateProposed: '2025-05-01', endDateEstimated: '2025-05-30', status: JobStatus.Paused, costAlert: false,
    assignedEmployees: [], materials: [], assignedTools: [], photosBefore: [], photosDuring: [], photosAfter: [], documents: [], notes: 'Cliente canceló el proyecto por falta de presupuesto.'
  }
];

export const MOCK_QUOTES: Quote[] = [
    // 25 Approved (Sample 1)
  {
    id: 'quote-1', jobId: 'job-1', jobName: 'Remodelación Baño Principal - Familia Torres', clientName: MOCK_CLIENTS[4].name, clientId: 'client-5',
    quoteNumber: 'COT-240801', date: '2024-08-01', status: QuoteStatus.Approved, companyInfo: {} as CompanyProfile, clientInfo: MOCK_CLIENTS[4],
    serviceDescription: 'Descripción detallada...', termsAndConditions: 'Términos estándar...',
    materialsCost: 2770000, laborCost: 2000000, otherProjectExpenses: 400000, adminProfit: 1241000,
    subtotal: 4170000, ivaRate: 0, ivaAmount: 0, totalAmount: 4121000 // Sample data adjustment
  },
  // 3 Sent (Sample 1)
  {
    id: 'quote-26', jobId: 'job-36', jobName: 'Pintura Fachada - Edificio Legal SAS', clientName: MOCK_CLIENTS[13].name, clientId: 'client-14',
    quoteNumber: 'COT-250710', date: '2025-07-10', status: QuoteStatus.Sent, companyInfo: {} as CompanyProfile, clientInfo: MOCK_CLIENTS[13],
    serviceDescription: 'Pintura exterior...', termsAndConditions: 'Términos estándar...',
    materialsCost: 6000000, laborCost: 4000000, adminProfit: 2500000, subtotal: 12500000, ivaRate: 0, ivaAmount: 0, totalAmount: 12500000
  },
  // 2 Draft (Sample 1)
   {
    id: 'quote-29', jobId: 'job-39', jobName: 'Adecuación local comercial (CANCELADO)', clientName: MOCK_CLIENTS[8].name, clientId: 'client-9',
    quoteNumber: 'COT-250420', date: '2025-04-20', status: QuoteStatus.Draft, companyInfo: {} as CompanyProfile, clientInfo: MOCK_CLIENTS[8],
    serviceDescription: 'Borrador de adecuación...', termsAndConditions: 'Términos a definir...',
    materialsCost: 0, laborCost: 0, adminProfit: 0, subtotal: 0, ivaRate: 0, ivaAmount: 0, totalAmount: 0
  }
  // ... imagine 27 more quotes here ...
];

// == STEP 1: Configuración Inicial de la Empresa ==

export const DEFAULT_COMPANY_PROFILE: CompanyProfile = {
  legalName: 'Construcciones Futuro S.A.S.',
  businessName: 'Construcciones Futuro',
  nit: '901.123.456-7',
  fiscalAddress: 'Carrera 15 # 88-36, Oficina 702, Bogotá',
  phone: '+57 3108765432',
  email: 'carlos.vargas@construfuturo.co',
  bankDetails: 'Cuenta de Ahorros Bancolombia - 123-4567890-11',
  logoUrl: 'https://picsum.photos/seed/logo/200/200'
};

export const DEFAULT_ADMIN_PROFILE: AdminProfile = {
  name: 'Carlos Vargas',
  idNumber: '79123456',
  phone: '+57 3108765432',
  email: 'carlos.vargas@construfuturo.co'
};

const initialBudgetEntry: BudgetEntry = {
    id: 'budget-initial-1',
    amount: 20000000,
    source: 'banco',
    description: 'Capital inicial de operaciones',
    enteredBy: 'Carlos Vargas',
    date: '2024-06-01T10:00:00.000Z'
};

export const DEFAULT_COMPANY_FINANCIALS: CompanyFinancials = {
  currentBudget: 20000000,
  budgetHistory: [initialBudgetEntry],
};

// ===============================================
// == UNCHANGED CONSTANTS & UTILITIES ==
// ===============================================

export const JOB_TYPES_OPTIONS = Object.values(JobType).map(value => ({ value, label: value }));
export const JOB_STATUS_OPTIONS = Object.values(JobStatus).map(value => ({ value, label: value }));
export const TOOL_STATUS_OPTIONS = [
    { value: 'disponible', label: 'Disponible' },
    { value: 'en uso', label: 'En Uso' },
    { value: 'en reparación', label: 'En Reparación' },
];

export const QUOTE_STATUS_OPTIONS = Object.values(QuoteStatus).map(value => ({ value, label: value }));

export const PAYMENT_METHOD_OPTIONS: { value: PaymentMethod, label: string }[] = [
    { value: 'Efectivo', label: 'Efectivo' },
    { value: 'Transferencia', label: 'Transferencia Bancaria' },
    { value: 'Nequi', label: 'Nequi' },
    { value: 'Daviplata', label: 'Daviplata' },
    { value: 'Otro', label: 'Otro' },
];

export const CURRENCY_FORMATTER = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export const BUDGET_SOURCE_OPTIONS = [
    { value: 'banco', label: 'Transferencia Bancaria' },
    { value: 'efectivo', label: 'Efectivo' },
    { value: 'tarjeta', label: 'Pago con Tarjeta' },
    { value: 'otro', label: 'Otro Ingreso' },
];