
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CURRENCY_FORMATTER, QUOTE_STATUS_OPTIONS } from '../constants';
import { Job, Quote, CompanyProfile, Client, AdminProfile, QuoteStatus, PdfTemplateType } from '../types';
import Button from '../components/ui/Button';
import Select from '../components/ui/Select';
import Input from '../components/ui/Input';
import { getJobById, getCompanyProfile, getAdminProfile, getClients, addQuote, updateQuote, getQuotes, generateId, getJobs } from '../utils/localStorageManager';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import AlertModal from '../components/modals/AlertModal';
import DocumentDuplicateIcon from '../components/icons/DocumentDuplicateIcon';
import DocumentTextIcon from '../components/icons/DocumentTextIcon';

// Helper function to convert number to words (Spanish - Colombia)
function numeroALetras(num: number): string {
  const unidades = ["", "un", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve"];
  const decenas = ["", "diez", "veinte", "treinta", "cuarenta", "cincuenta", "sesenta", "setenta", "ochenta", "noventa"];
  const centenas = ["", "ciento ", "doscientos ", "trescientos ", "cuatrocientos ", "quinientos ", "seiscientos ", "setecientos ", "ochocientos ", "novecientos "];

  const numToWords = (n: number, isRecursiveCall = false, isMil = false): string => {
    if (n === 0) return isRecursiveCall ? "" : "cero";
    if (n < 0) return "menos " + numToWords(Math.abs(n), true);

    let words = "";

    if (n >= 1000000) {
      const millionPart = Math.floor(n / 1000000);
      words += (millionPart === 1 ? "un millón " : numToWords(millionPart, true) + " millones ");
      n %= 1000000;
      if (n > 0) words += ""; else words = words.trim();
    }
    if (n >= 1000) {
        const thousandPart = Math.floor(n / 1000);
        if (thousandPart === 1) words += "mil ";
        else words += numToWords(thousandPart, true, true) + " mil ";
        n %= 1000;
        if (n > 0) words += ""; else words = words.trim();
    }
    if (n >= 100) {
        if (n === 100 && (n % 1000 !== 0 || Math.floor(n/1000) === 0)) words += "cien ";
        else words += centenas[Math.floor(n / 100)];
        n %= 100;
        if (n > 0) words = words.trimEnd() + " "; else words = words.trim();
    }
    if (n > 0) {
        if (n < 10) {
            words += unidades[n];
        } else if (n < 20) {
            const especiales = ["diez", "once", "doce", "trece", "catorce", "quince", "dieciséis", "diecisiete", "dieciocho", "diecinueve"];
            words += especiales[n - 10];
        } else {
            words += decenas[Math.floor(n / 10)];
            if (n % 10 !== 0) {
                words += (isMil || Math.floor(n/10) === 2 ? "" : " y ") + unidades[n % 10];
            }
        }
    }
    return words.trim();
  };

  const mainPart = Math.floor(num);
  let result = numToWords(mainPart);
  result = result.charAt(0).toUpperCase() + result.slice(1);
  return result.trim() + " pesos M/CTE.";
}

// Helper to load image and get its dimensions for PDF
async function getLoadedImage(logoUrl?: string): Promise<HTMLImageElement | null> {
  if (!logoUrl) return null;
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "Anonymous"; // Handle CORS issues if image is from another domain
    img.onload = () => resolve(img);
    img.onerror = () => {
      console.error("Failed to load logo image for PDF. URL:", logoUrl);
      resolve(null);
    };
    img.src = logoUrl;
  });
}


const Card: React.FC<{title: string; children: React.ReactNode; className?: string}> = ({title, children, className}) => (
    <div className={`bg-[var(--color-secondary-bg)] p-5 rounded-2xl border border-[var(--color-border)] ${className}`}>
        <h3 className="text-lg font-bold text-white mb-4 border-b border-[var(--color-border)] pb-2">{title}</h3>
        {children}
    </div>
);


const QuoteGeneratorPage: React.FC = () => {
  const navigate = useNavigate();
  const { jobId: jobIdFromParams, quoteId: quoteIdFromPath } = useParams<{ jobId?: string; quoteId?: string }>();
  
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [allClients, setAllClients] = useState<Client[]>([]);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);

  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [currentQuote, setCurrentQuote] = useState<Quote | null>(null);
  
  const [manualServiceDescription, setManualServiceDescription] = useState('');
  const [manualTerms, setManualTerms] = useState('');
  const [quoteStatus, setQuoteStatus] = useState<QuoteStatus>(QuoteStatus.Draft);
  const [validityPeriod, setValidityPeriod] = useState<string>('15 días');
  
  const [pdfTemplateType, setPdfTemplateType] = useState<PdfTemplateType>('detailed');
  const [pdfClientNotes, setPdfClientNotes] = useState('');

  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [alertModalMessage, setAlertModalMessage] = useState('');

  const isEditing = !!quoteIdFromPath;

  const setDefaultDescriptions = (jobToQuote: Job) => {
    setManualServiceDescription(
        `Trabajo a realizar:\n${jobToQuote.name}.\n\n` +
        `Detalles del servicio:\n` +
        (jobToQuote.materials.map(m => `* Suministro e instalación de ${m.quantity} ${m.unit} de ${m.name}`).join('\n') || "* Materiales según necesidad del proyecto.") + "\n" +
        (jobToQuote.assignedEmployees.map(e => `* Mano de obra especializada: ${e.specialty} (${e.estimatedWorkdays} días est.)`).join('\n') || "* Mano de obra calificada.") + "\n\n" +
        `Alcance general del trabajo: [Describa aquí las actividades principales como preparación, ejecución y acabados finales del servicio].`
    );
    setManualTerms(
        '1. VALIDEZ DE LA OFERTA: La presente cotización tiene una validez de quince (15) días calendario a partir de su fecha de emisión.\n' +
        '2. FORMA DE PAGO: Anticipo del cincuenta porciento (50%) para inicio de labores y el cincuenta porciento (50%) restante contra entrega final del trabajo a satisfacción del cliente.\n' +
        '3. TIEMPO DE EJECUCIÓN: El tiempo estimado de ejecución se definirá una vez aprobado el presupuesto y coordinado el inicio de actividades con el cliente.\n' +
        '4. GARANTÍA: Se ofrece una garantía de [ej: seis (6) meses] sobre la mano de obra de los trabajos realizados, no cubre daños por mal uso o factores externos.\n' +
        '5. ADICIONALES: Cualquier trabajo no contemplado en esta cotización se considerará un adicional y generará un costo extra, previa aprobación del cliente.'
    );
  };


  useEffect(() => {
    const jobsData = getJobs();
    const clientsData = getClients();
    const companyProf = getCompanyProfile();
    const adminProf = getAdminProfile();
    setAllJobs(jobsData);
    setAllClients(clientsData);
    setCompanyProfile(companyProf);
    setAdminProfile(adminProf);

    if (!companyProf.legalName || !companyProf.nit || !adminProf.name) {
        setAlertModalMessage("Por favor, complete el Perfil de Empresa y Perfil de Administrador en Ajustes antes de generar cotizaciones.");
        setIsAlertModalOpen(true);
    }


    if (quoteIdFromPath) {
      const existingQuote = getQuotes().find(q => q.id === quoteIdFromPath);
      if (existingQuote) {
        setCurrentQuote(existingQuote);
        setSelectedJobId(existingQuote.jobId);
        setManualServiceDescription(existingQuote.serviceDescription);
        setManualTerms(existingQuote.termsAndConditions);
        setQuoteStatus(existingQuote.status);
        setValidityPeriod(existingQuote.validityDate || '15 días');
        setPdfClientNotes(existingQuote.clientNotesForPdf || '');
        setPdfTemplateType(existingQuote.templateTypeForPdf || 'detailed');
      } else {
        setAlertModalMessage("Cotización no encontrada.");
        setIsAlertModalOpen(true);
        navigate('/quotes');
      }
    } else if (jobIdFromParams) {
      setSelectedJobId(jobIdFromParams);
      const jobToQuote = jobsData.find(j => j.id === jobIdFromParams);
      if (jobToQuote) setDefaultDescriptions(jobToQuote);
      setCurrentQuote(null);
      setQuoteStatus(QuoteStatus.Draft);
    } else {
      setSelectedJobId('');
      setQuoteStatus(QuoteStatus.Draft);
      setValidityPeriod('15 días');
      setManualServiceDescription('');
      setManualTerms('');
      setPdfClientNotes('');
      setPdfTemplateType('detailed');
      setCurrentQuote(null);
    }
  }, [jobIdFromParams, quoteIdFromPath, navigate]);

  const selectedJob = useMemo(() => allJobs.find(job => job.id === selectedJobId), [allJobs, selectedJobId]);
  const selectedClientForJob = useMemo(() => selectedJob ? allClients.find(c => c.id === selectedJob.clientId) : null, [allClients, selectedJob]);
  
  const quoteCalculation = useMemo(() => {
    if (!selectedJob) return null;

    const materialsCost = selectedJob.materials.reduce((sum, mat) => sum + (mat.unitPrice * mat.quantity), 0);
    const laborCost = selectedJob.assignedEmployees.reduce((sum, emp) => sum + (emp.dailySalary * emp.estimatedWorkdays), 0);
    
    let otherProjectExpenses = 0;
    if (selectedJob.operationalCost !== undefined) {
      otherProjectExpenses = Math.max(0, selectedJob.operationalCost - (materialsCost + laborCost));
    }

    const calculatedOperationalCost = materialsCost + laborCost + otherProjectExpenses;
    const profitMarginPercentage = selectedJob.profitMargin !== undefined ? selectedJob.profitMargin : 0.30;
    const adminProfit = calculatedOperationalCost * profitMarginPercentage;
    const subtotal = calculatedOperationalCost + adminProfit;
    const ivaRate = 0.19; 
    const ivaAmount = subtotal * ivaRate;
    const totalAmount = subtotal + ivaAmount;

    return { materialsCost, laborCost, otherProjectExpenses, adminProfit, subtotal, ivaRate, ivaAmount, totalAmount };
  }, [selectedJob]);


  const handleFinalizeQuote = () => {
    if (!selectedJob || !companyProfile || !selectedClientForJob || !adminProfile || !quoteCalculation) {
        setAlertModalMessage("Seleccione un trabajo y asegúrese de que los perfiles de empresa, administrador y los datos del cliente estén completos.");
        setIsAlertModalOpen(true);
        return;
    }
    if (!manualServiceDescription.trim() || !manualTerms.trim()) {
        setAlertModalMessage("La descripción del servicio y los términos y condiciones son obligatorios.");
        setIsAlertModalOpen(true);
        return;
    }

    const quoteData: Quote = {
      id: currentQuote?.id || generateId('quote-'),
      jobId: selectedJob.id,
      jobName: selectedJob.name,
      clientName: selectedClientForJob.name,
      clientId: selectedClientForJob.id,
      quoteNumber: currentQuote?.quoteNumber || `COT-${String(Date.now()).slice(-6)}`, 
      date: currentQuote?.date || new Date().toISOString(),
      validityDate: validityPeriod,
      status: quoteStatus,
      companyInfo: companyProfile,
      clientInfo: selectedClientForJob,
      serviceDescription: manualServiceDescription,
      ...quoteCalculation,
      termsAndConditions: manualTerms,
      clientNotesForPdf: pdfClientNotes,
      templateTypeForPdf: pdfTemplateType,
    };

    if (isEditing && currentQuote) {
        updateQuote(quoteData);
    } else {
        addQuote(quoteData);
    }
    setCurrentQuote(quoteData); 
    setAlertModalMessage(
        `Cotización ${quoteData.quoteNumber} ${isEditing ? 'actualizada' : 'generada'} y guardada exitosamente.`
    );
    setIsAlertModalOpen(true);
  };
  
  const handleExportPDF = async () => {
    const quoteToExport = currentQuote;
    if (!quoteToExport || !companyProfile || !adminProfile || !selectedJob || !selectedClientForJob) {
        setAlertModalMessage("Faltan datos para generar el PDF. Asegúrese de que la cotización esté finalizada y los perfiles de empresa y administrador estén completos.");
        setIsAlertModalOpen(true);
        return;
    }

    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 40;
    const contentWidth = pageWidth - 2 * margin;

    // --- Colors and Fonts ---
    const accentColor = '#22d3ee'; // cyan-400 from the theme
    const textColor = '#333333';
    const lightGray = '#F5F5F5';
    const headerColor = '#cffafe'; // cyan-100, good for table head

    // --- Helpers ---
    const defaultFontSize = 9;
    const addText = (text: string | string[], x: number, y: number, options?: any) => {
        doc.text(text, x, y, options);
    };
    
    // --- 1. HEADER (2 Columns) ---
    let yPos = 60;
    const loadedLogo = await getLoadedImage(companyProfile.logoUrl);
    let logoEndY = yPos;
    if (loadedLogo && loadedLogo.naturalWidth > 0 && loadedLogo.naturalHeight > 0) {
      const aspectRatio = loadedLogo.naturalWidth / loadedLogo.naturalHeight;
      let pdfImgWidth = 80;
      let pdfImgHeight = pdfImgWidth / aspectRatio;
      if (pdfImgHeight > 60) {
        pdfImgHeight = 60;
        pdfImgWidth = pdfImgHeight * aspectRatio;
      }
      if (pdfImgWidth > 0 && pdfImgHeight > 0) {
        doc.addImage(loadedLogo, 'PNG', margin, yPos - 10, pdfImgWidth, pdfImgHeight);
        logoEndY = yPos -10 + pdfImgHeight;
      }
    }

    doc.setFont("helvetica", "bold").setFontSize(16).setTextColor(textColor);
    addText("COTIZACIÓN", pageWidth - margin, yPos, { align: 'right' });
    doc.setFont("helvetica", "bold").setFontSize(12);
    addText(quoteToExport.quoteNumber, pageWidth - margin, yPos + 20, { align: 'right' });
    doc.setFont("helvetica", "normal").setFontSize(defaultFontSize);
    addText(`Fecha: ${new Date(quoteToExport.date).toLocaleDateString('es-CO')}`, pageWidth - margin, yPos + 35, { align: 'right' });
    addText(`Válida hasta: ${quoteToExport.validityDate || 'N/A'}`, pageWidth - margin, yPos + 47, { align: 'right' });
    const headerRightEndY = yPos + 47;

    yPos = Math.max(logoEndY, headerRightEndY) + 25;

    // --- 2. COMPANY & CLIENT INFO (2 Columns) ---
    const halfWidth = contentWidth / 2 - 10;
    const rightColX = margin + halfWidth + 20;
    let leftColumnEndY = yPos;
    let rightColumnEndY = yPos;

    doc.setFont("helvetica", "bold").setFontSize(10).setTextColor(textColor);
    addText("NUESTROS DATOS:", margin, leftColumnEndY);
    leftColumnEndY += 15;
    doc.setFont("helvetica", "normal").setFontSize(defaultFontSize);
    const companyDetails = [ companyProfile.businessName, `NIT: ${companyProfile.nit}`, companyProfile.fiscalAddress, `Tel: ${companyProfile.phone}`, `Email: ${companyProfile.email}`];
    companyDetails.forEach(detail => {
        const splitText = doc.splitTextToSize(detail, halfWidth);
        addText(splitText, margin, leftColumnEndY);
        leftColumnEndY += (Array.isArray(splitText) ? splitText.length : 1) * 10;
    });

    doc.setFont("helvetica", "bold").setFontSize(10).setTextColor(textColor);
    addText("DATOS DEL CLIENTE:", rightColX, rightColumnEndY);
    rightColumnEndY += 15;
    doc.setFont("helvetica", "normal").setFontSize(defaultFontSize);
    const clientDetails = [ quoteToExport.clientInfo.name, quoteToExport.clientInfo.contact ? `NIT/C.C: ${quoteToExport.clientInfo.contact}` : '', quoteToExport.clientInfo.address ? `Dirección: ${quoteToExport.clientInfo.address}` : '', quoteToExport.clientInfo.phone ? `Teléfono: ${quoteToExport.clientInfo.phone}` : '', quoteToExport.clientInfo.email ? `Email: ${quoteToExport.clientInfo.email}` : ''].filter(Boolean);
    clientDetails.forEach(detail => {
        const splitText = doc.splitTextToSize(detail, halfWidth);
        addText(splitText, rightColX, rightColumnEndY);
        rightColumnEndY += (Array.isArray(splitText) ? splitText.length : 1) * 10;
    });

    yPos = Math.max(leftColumnEndY, rightColumnEndY) + 15;
    doc.setDrawColor(accentColor).setLineWidth(0.5).line(margin, yPos - 5, pageWidth - margin, yPos - 5);
    
    // --- 3. PROJECT INFO & NOTES ---
    doc.setFont("helvetica", "bold").setFontSize(10).setTextColor(textColor);
    addText(`PROYECTO: ${selectedJob.name}`, margin, yPos);
    yPos += 15;
    if (pdfClientNotes.trim()) {
        doc.setFont("helvetica", "italic").setFontSize(defaultFontSize);
        const splitNotes = doc.splitTextToSize(`Nota: ${pdfClientNotes}`, contentWidth);
        addText(splitNotes, margin, yPos);
        yPos += (Array.isArray(splitNotes) ? splitNotes.length : 1) * 10 + 5;
    }
    
    // --- 4. ITEMS TABLE ---
    const head = [['Ítem', 'Descripción', 'Cant.', 'Unidad', 'Vr. Unitario', 'Vr. Total']];
    const body: any[] = [];
    let itemCounter = 1;
    if (pdfTemplateType === 'detailed') {
        selectedJob.materials.forEach(mat => body.push([ `MAT-${String(itemCounter++).padStart(2, '0')}`, mat.name, mat.quantity.toString(), mat.unit, CURRENCY_FORMATTER.format(mat.unitPrice), CURRENCY_FORMATTER.format(mat.unitPrice * mat.quantity) ]));
        selectedJob.assignedEmployees.forEach(emp => body.push([ `MO-${String(itemCounter++).padStart(2, '0')}`, `Mano de Obra - ${emp.specialty} (${emp.name})`, emp.estimatedWorkdays.toString(), 'Días', CURRENCY_FORMATTER.format(emp.dailySalary), CURRENCY_FORMATTER.format(emp.dailySalary * emp.estimatedWorkdays) ]));
        if (quoteToExport.otherProjectExpenses && quoteToExport.otherProjectExpenses > 0) body.push([ `OG-${String(itemCounter++).padStart(2, '0')}`, 'Otros Gastos del Proyecto', '1', 'Global', CURRENCY_FORMATTER.format(quoteToExport.otherProjectExpenses), CURRENCY_FORMATTER.format(quoteToExport.otherProjectExpenses) ]);
    } else { 
         body.push([ 'SRV-001', `Servicio de ${quoteToExport.jobName || 'Proyecto General'}`, '1', 'Global', CURRENCY_FORMATTER.format(quoteToExport.subtotal), CURRENCY_FORMATTER.format(quoteToExport.subtotal) ]);
    }
    
    autoTable(doc, {
        startY: yPos, head, body, theme: 'grid',
        styles: { fontSize: 8, cellPadding: 5, textColor: textColor, font: 'helvetica' },
        headStyles: { fillColor: headerColor, textColor: textColor, fontStyle: 'bold', halign: 'center' },
        alternateRowStyles: { fillColor: lightGray },
        columnStyles: { 0: { halign: 'center', cellWidth: 45 }, 1: { cellWidth: 'auto' }, 2: { halign: 'right', cellWidth: 35 }, 3: { halign: 'center', cellWidth: 45 }, 4: { halign: 'right', cellWidth: 70 }, 5: { halign: 'right', cellWidth: 70 } },
    });
    
    let finalY = (doc as any).lastAutoTable.finalY || yPos;

    // --- 5. TOTALS ---
    const summaryX = pageWidth - margin - 220;
    const valueX = pageWidth - margin;   
    
    finalY += 20;
    doc.setFont("helvetica", "normal").setFontSize(defaultFontSize).setTextColor(textColor);
    addText('Subtotal:', summaryX, finalY);
    addText(CURRENCY_FORMATTER.format(quoteToExport.subtotal), valueX, finalY, { align: 'right' });
    finalY += 15;
    addText(`IVA (${(quoteToExport.ivaRate || 0) * 100}%):`, summaryX, finalY);
    addText(CURRENCY_FORMATTER.format(quoteToExport.ivaAmount || 0), valueX, finalY, { align: 'right' });
    finalY += 15;
    doc.setFont("helvetica", "bold").setFontSize(11);
    addText('TOTAL:', summaryX, finalY);
    addText(CURRENCY_FORMATTER.format(quoteToExport.totalAmount), valueX, finalY, { align: 'right' });
    yPos = finalY + 25;

    // --- 6. AMOUNT IN WORDS, TERMS, SIGNATURE ---
    const checkAndAddNewPage = (currentY: number, spaceNeeded: number = 40): number => {
      if (currentY > doc.internal.pageSize.getHeight() - margin - spaceNeeded) { 
        doc.addPage();
        return margin; // Reset Y to top of new page
      }
      return currentY;
    };
    
    yPos = checkAndAddNewPage(yPos, 40);
    
    doc.setFont("helvetica", "bold").setFontSize(defaultFontSize);
    const amountInWords = numeroALetras(quoteToExport.totalAmount);
    const splitAmountInWords = doc.splitTextToSize(`SON: ${amountInWords.toUpperCase()}`, contentWidth);
    addText(splitAmountInWords, margin, yPos);
    yPos += (Array.isArray(splitAmountInWords) ? splitAmountInWords.length : 1) * 10 + 15;

    yPos = checkAndAddNewPage(yPos, 80);

    doc.setFont("helvetica", "bold").setFontSize(10);
    addText("TÉRMINOS Y CONDICIONES:", margin, yPos);
    yPos += 15;
    doc.setFont("helvetica", "normal").setFontSize(8);
    const termsLines = doc.splitTextToSize(quoteToExport.termsAndConditions, contentWidth);
    addText(termsLines, margin, yPos);
    yPos += (Array.isArray(termsLines) ? termsLines.length : 1) * 8 + 15;

    yPos = checkAndAddNewPage(yPos, 40);

    doc.setFont("helvetica", "bold").setFontSize(10);
    addText("MÉTODO DE PAGO:", margin, yPos);
    yPos += 15;
    doc.setFont("helvetica", "normal").setFontSize(defaultFontSize);
    const bankDetailsLines = doc.splitTextToSize(companyProfile.bankDetails, contentWidth);
    addText(bankDetailsLines, margin, yPos);
    yPos += (Array.isArray(bankDetailsLines) ? bankDetailsLines.length : 1) * 10 + 30;

    yPos = checkAndAddNewPage(yPos, 60);

    const signatureX = margin;
    doc.line(signatureX, yPos, signatureX + 180, yPos);
    yPos += 15;
    doc.setFont("helvetica", "normal").setFontSize(defaultFontSize);
    addText(adminProfile.name, signatureX, yPos);
    yPos += 10;
    if(adminProfile.idNumber) addText(`C.C. ${adminProfile.idNumber}`, signatureX, yPos);

    // --- 7. FOOTER on all pages ---
    const pageCount = (doc.internal as any).getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFont("helvetica", "normal").setFontSize(8).setTextColor("#6b7281");
        doc.text(companyProfile.businessName, margin, doc.internal.pageSize.getHeight() - 20);
        doc.text(`Página ${i} de ${pageCount}`, pageWidth - margin, doc.internal.pageSize.getHeight() - 20, { align: 'right' });
    }

    doc.save(`Cotizacion-${quoteToExport.quoteNumber}-${(quoteToExport.jobName || 'Trabajo').replace(/\s+/g, '_')}.pdf`);
  };

  return (
    <div className="px-6 pb-32 space-y-6">
      <Card title="Seleccionar Trabajo">
        <Select
            label="Trabajo para Cotizar"
            options={allJobs.map(job => ({ value: job.id, label: `${job.name} (${allClients.find(c=>c.id === job.clientId)?.name || 'Cliente Desconocido'})` }))}
            value={selectedJobId}
            onChange={(e) => {
                setSelectedJobId(e.target.value);
                if (!isEditing) {
                    setCurrentQuote(null);
                    const jobToQuote = allJobs.find(j => j.id === e.target.value);
                    if (jobToQuote) setDefaultDescriptions(jobToQuote);
                }
            }}
            placeholder="Elija un trabajo"
            disabled={(isEditing && !!currentQuote) || !allJobs.length}
        />
        {!allJobs.length && <p className="text-sm text-[var(--color-text-secondary)] mt-2">No hay trabajos disponibles para cotizar. Por favor, cree un trabajo primero.</p>}
      </Card>
      
      <div className={`transition-opacity duration-500 ${!selectedJob ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
        <div className="space-y-6">
            <Card title="Resumen Financiero (Estimado)">
                {quoteCalculation ? (
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between"><span className="text-[var(--color-text-secondary)]">Costo Materiales:</span> <span>{CURRENCY_FORMATTER.format(quoteCalculation.materialsCost)}</span></div>
                        <div className="flex justify-between"><span className="text-[var(--color-text-secondary)]">Costo Mano de Obra:</span> <span>{CURRENCY_FORMATTER.format(quoteCalculation.laborCost)}</span></div>
                        <div className="flex justify-between"><span className="text-[var(--color-text-secondary)]">Ganancia Estimada:</span> <span>{CURRENCY_FORMATTER.format(quoteCalculation.adminProfit)}</span></div>
                        <hr className="border-[var(--color-border)] my-1"/>
                        <div className="flex justify-between text-base font-bold"><span className="text-white">Subtotal:</span> <span>{CURRENCY_FORMATTER.format(quoteCalculation.subtotal)}</span></div>
                        <div className="flex justify-between text-base font-bold"><span className="text-white">IVA (19%):</span> <span>{CURRENCY_FORMATTER.format(quoteCalculation.ivaAmount)}</span></div>
                        <hr className="border-[var(--color-accent)] my-1"/>
                        <div className="flex justify-between text-lg font-bold"><span className="text-[var(--color-accent)]">TOTAL:</span> <span className="text-[var(--color-accent)]">{CURRENCY_FORMATTER.format(quoteCalculation.totalAmount)}</span></div>
                    </div>
                ) : <p className="text-[var(--color-text-secondary)]">Seleccione un trabajo para ver el resumen.</p>}
            </Card>


            <Card title="Contenido de la Cotización">
                <div className="space-y-4">
                    <div>
                        <label htmlFor="manualServiceDescription" className="block text-sm font-bold text-[var(--color-text-secondary)] mb-1.5">Descripción del Servicio</label>
                        <textarea id="manualServiceDescription" value={manualServiceDescription} onChange={(e) => setManualServiceDescription(e.target.value)} rows={8} className="block w-full px-4 py-3 bg-[var(--color-primary-app)] border border-[var(--color-border)] rounded-xl text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] sm:text-sm font-medium transition-colors" placeholder="Detalle los servicios a prestar..."/>
                    </div>
                    <div>
                        <label htmlFor="manualTerms" className="block text-sm font-bold text-[var(--color-text-secondary)] mb-1.5">Términos y Condiciones</label>
                        <textarea id="manualTerms" value={manualTerms} onChange={(e) => setManualTerms(e.target.value)} rows={6} className="block w-full px-4 py-3 bg-[var(--color-primary-app)] border border-[var(--color-border)] rounded-xl text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] sm:text-sm font-medium transition-colors" placeholder="Validez de la oferta, forma de pago..."/>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        <Select label="Estado de la Cotización" options={QUOTE_STATUS_OPTIONS} value={quoteStatus} onChange={(e) => setQuoteStatus(e.target.value as QuoteStatus)} />
                        <Input label="Validez de la Oferta" value={validityPeriod} onChange={(e) => setValidityPeriod(e.target.value)} placeholder="Ej: 15 días" helperText="Periodo o fecha de validez."/>
                    </div>
                </div>
            </Card>

            <Card title="Opciones de Exportación a PDF">
                <div className="space-y-4">
                    <Select label="Tipo de Plantilla PDF" options={[ {value: 'detailed', label: 'Cotización Detallada'}, {value: 'summary', label: 'Cotización Resumida'} ]} value={pdfTemplateType} onChange={e => setPdfTemplateType(e.target.value as PdfTemplateType)} />
                    <div>
                        <label htmlFor="pdfClientNotes" className="block text-sm font-bold text-[var(--color-text-secondary)] mb-1.5">Notas Adicionales para el PDF</label>
                        <textarea id="pdfClientNotes" value={pdfClientNotes} onChange={(e) => setPdfClientNotes(e.target.value)} rows={3} className="block w-full px-4 py-3 bg-[var(--color-primary-app)] border border-[var(--color-border)] rounded-xl text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] sm:text-sm font-medium transition-colors" placeholder="Notas especiales que solo aparecerán en el PDF." />
                    </div>
                </div>
            </Card>
        </div>
      </div>
      
        <div 
            className="fixed bottom-0 left-0 right-0 bg-[var(--color-primary-app)]/80 backdrop-blur-sm p-4 border-t border-[var(--color-border)] z-30"
            style={{ paddingBottom: 'calc(1rem + var(--safe-area-inset-bottom))' }}
        >
            <div className="flex flex-col sm:flex-row gap-3">
                <Button onClick={handleFinalizeQuote} disabled={!selectedJob} fullWidth size="lg" shape="rounded">
                    {isEditing ? 'Actualizar y Guardar' : 'Finalizar y Guardar'}
                </Button>
                <Button onClick={handleExportPDF} variant="secondary" disabled={!currentQuote} fullWidth size="lg" shape="rounded" leftIcon={<DocumentTextIcon className="w-5 h-5"/>}>
                    Exportar PDF
                </Button>
            </div>
        </div>

        <AlertModal
            isOpen={isAlertModalOpen}
            onClose={() => setIsAlertModalOpen(false)}
            title="Información"
            message={alertModalMessage}
        />
    </div>
  );
};

export default QuoteGeneratorPage;
