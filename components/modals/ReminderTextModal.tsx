
import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Job, Client, CompanyProfile } from '../../types';
import geminiServiceInstance from '../../services/GeminiService'; // Assuming GeminiService is correctly set up
import { CURRENCY_FORMATTER } from '../../constants';
import ClipboardDocumentIcon from '../icons/ClipboardDocumentIcon';
import CheckCircleIcon from '../icons/CheckCircleIcon';
import InformationCircleIcon from '../icons/InformationCircleIcon';

interface ReminderTextModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: Job;
  client?: Client;
  companyProfile: CompanyProfile;
}

const ReminderTextModal: React.FC<ReminderTextModalProps> = ({ isOpen, onClose, job, client, companyProfile }) => {
  const [reminderText, setReminderText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && job && client && companyProfile) {
      const generateReminder = async () => {
        setIsLoading(true);
        setError(null);
        setCopySuccess(false);
        try {
          // Construct details for the prompt
          const jobDetails = {
            clientName: client.name,
            jobName: job.name,
            amountDue: CURRENCY_FORMATTER.format(job.finalPrice || 0),
            dueDate: new Date(job.endDateEstimated).toLocaleDateString('es-CO', {day: 'numeric', month: 'long', year: 'numeric'}),
          };
          
          const text = await geminiServiceInstance.generatePaymentReminderText(jobDetails, companyProfile);
          setReminderText(text);
        } catch (err) {
          console.error("Error generating reminder text:", err);
          setError("No se pudo generar el mensaje. Intente de nuevo o redacte uno manualmente.");
          // Fallback generic message
          setReminderText(
            `Estimado/a ${client.name},\n\n` +
            `Le recordamos amablemente que el pago por el trabajo "${job.name}", por un monto de ${CURRENCY_FORMATTER.format(job.finalPrice || 0)}, ` +
            `venció el ${new Date(job.endDateEstimated).toLocaleDateString('es-CO', {day: 'numeric', month: 'long', year: 'numeric'})}.\n\n` +
            `Agradecemos su pronta atención a este asunto.\n\n` +
            `Saludos cordiales,\n` +
            `${companyProfile.businessName}\n` +
            `Tel: ${companyProfile.phone}\n` +
            `Email: ${companyProfile.email}`
          );
        } finally {
          setIsLoading(false);
        }
      };
      generateReminder();
    }
  }, [isOpen, job, client, companyProfile]);

  const handleCopyToClipboard = async () => {
    if (!reminderText) return;
    try {
      await navigator.clipboard.writeText(reminderText);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000); // Hide success message after 2 seconds
    } catch (err) {
      console.error('Failed to copy text: ', err);
      setError('No se pudo copiar el texto. Por favor, cópielo manualmente.');
    }
  };
  
  const clientNameDisplay = client?.name || "Cliente";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Recordatorio para: ${clientNameDisplay}`} size="lg">
      <div className="space-y-4">
        {isLoading && (
          <div className="flex items-center justify-center py-10 text-[var(--color-text-secondary)]">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-[var(--color-accent)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Generando mensaje...
          </div>
        )}
        {!isLoading && error && (
          <div className="p-3 bg-red-500/20 text-red-300 rounded-md text-sm flex items-center">
            <InformationCircleIcon className="w-5 h-5 mr-2"/>
            {error}
          </div>
        )}
        {!isLoading && (
           <div>
            <label htmlFor="reminder-text-area" className="block text-sm font-bold text-[var(--color-text-secondary)] mb-1.5">
              Mensaje del Recordatorio:
            </label>
            <textarea
                id="reminder-text-area"
                value={reminderText}
                readOnly
                rows={10}
                className="w-full p-3 bg-[var(--color-primary-app)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] focus:ring-1 focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)] text-sm styled-scrollbar"
                aria-label="Texto del recordatorio de pago"
            />
           </div>
        )}
        <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-2">
            <Button 
                variant="secondary" 
                onClick={onClose}
                className="w-full sm:w-auto"
            >
                Cerrar
            </Button>
            <Button 
                variant="primary" 
                onClick={handleCopyToClipboard} 
                disabled={isLoading || !reminderText}
                leftIcon={copySuccess ? <CheckCircleIcon className="w-5 h-5"/> : <ClipboardDocumentIcon className="w-5 h-5"/>}
                className="w-full sm:w-auto"
            >
                {copySuccess ? '¡Copiado!' : 'Copiar Mensaje'}
            </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ReminderTextModal;