

import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { CompanyProfile } from "../types"; // Assuming CompanyProfile type is available
// API_KEY is primarily managed via process.env in pages now, direct import might be redundant if pages handle it.
// However, if this service were to be the SOLE accessor, it would need robust key handling.

interface PaymentReminderDetails {
  clientName: string;
  jobName: string;
  amountDue: string; // Already formatted currency string
  dueDate: string;   // Formatted date string
}

class GeminiService {
  private ai: GoogleGenAI | null = null;
  private apiKey: string | undefined = process.env.API_KEY; // Centralize API key access

  constructor() {
    if (this.apiKey) {
      this.ai = new GoogleGenAI({ apiKey: this.apiKey });
    } else {
      console.error("Gemini API Key is not configured in environment variables.");
    }
  }

  private checkInitialization(): boolean {
    if (!this.ai) {
      // Attempt reinitialization if key might have become available (less likely in pure client-side)
      if (process.env.API_KEY && !this.apiKey) {
        this.apiKey = process.env.API_KEY;
        this.ai = new GoogleGenAI({apiKey: this.apiKey});
      }
      if (!this.ai) {
          console.error("Error: Gemini AI client not initialized. API Key missing or invalid.");
          return false;
      }
    }
    return true;
  }

  public async generateText(prompt: string, modelName: string = 'gemini-2.5-flash'): Promise<string> {
    if (!this.checkInitialization() || !this.ai) { // Added !this.ai for type safety
      return "Error: Gemini AI client not initialized. API Key missing?";
    }
    try {
      const response: GenerateContentResponse = await this.ai.models.generateContent({
        model: modelName,
        contents: prompt,
      });
      return response.text;
    } catch (error) {
      console.error(`Error generating text with model ${modelName}:`, error);
      return `Error al comunicarse con la IA: ${ (error as Error).message }`;
    }
  }

  // Example of a more specific method that could be used by NewJobPage
  public async getPricingExplanation(jobType: string, jobName: string, operationalCost: number, profitMargin: number, finalPrice: number): Promise<string> {
     const prompt = `Soy un contratista en Colombia. Mis costos operativos para un proyecto de tipo "${jobType || 'general'}" con nombre "${jobName || 'sin nombre'}" son de ${operationalCost.toLocaleString('es-CO', {style: 'currency', currency: 'COP'})}. Deseo obtener un margen de ganancia del ${profitMargin}%. El precio final sugerido al cliente es de ${finalPrice.toLocaleString('es-CO', {style: 'currency', currency: 'COP'})}.
    Genera una breve explicación profesional (máximo 3 frases) para justificar este precio al cliente, destacando que cubre los costos directos, la administración y genera una ganancia justa para asegurar la calidad del servicio. La explicación debe ser en español colombiano.`;
    return this.generateText(prompt);
  }

  // Example for QuoteGeneratorPage
  public async generateQuoteServiceDescription(jobType: string, materialsList: string, laborTasks: string): Promise<string> {
    const prompt = `Para un trabajo de '${jobType}' en Colombia, que incluye los siguientes materiales: ${materialsList || 'materiales según necesidad'} y las siguientes tareas de mano de obra: ${laborTasks}, redacta una descripción detallada y profesional del servicio para una cotización. Sé específico sobre las fases típicas del trabajo si es posible (ej. preparación, instalación, limpieza). La descripción debe ser en español colombiano.`;
    return this.generateText(prompt);
  }

  public async generateQuoteTerms(): Promise<string> {
    const prompt = `Genera términos y condiciones estándar y concisos para una cotización de servicios de mantenimiento en Colombia. Incluye: validez de la oferta (ej. 15 o 30 días), forma de pago (ej. 50% anticipo, 50% contra entrega final satisfactoria), garantía del trabajo (ej. 6 meses o 1 año sobre la mano de obra). Preséntalo en español colombiano, en formato de lista o párrafos cortos.`;
    return this.generateText(prompt);
  }

  public async generatePaymentReminderText(details: PaymentReminderDetails, company: CompanyProfile): Promise<string> {
    const prompt = `
Eres un asistente virtual para la empresa "${company.businessName}".
Tu tarea es redactar un recordatorio de pago amable y profesional.

Cliente: ${details.clientName}
Trabajo: "${details.jobName}"
Monto pendiente: ${details.amountDue}
Fecha de vencimiento: ${details.dueDate}

Información de contacto de la empresa:
Teléfono: ${company.phone}
Email: ${company.email}

Por favor, redacta el mensaje en español colombiano. Sé conciso y claro.
Ejemplo de estructura:
"Estimado/a [Cliente],

Le escribimos para recordarle amablemente sobre el pago pendiente correspondiente al trabajo/proyecto "[Trabajo]" por un monto de [Monto].
La fecha de vencimiento para este pago fue el [Fecha Vencimiento].

Agradeceríamos mucho si pudiera realizar el pago a la brevedad posible.
Si ya ha realizado el pago, por favor ignore este recordatorio.

Para cualquier consulta, no dude en contactarnos al [Teléfono Empresa] o responder a este correo [Email Empresa].

Saludos cordiales,
El equipo de ${company.businessName}"

Genera un mensaje similar, manteniendo el tono profesional y amable.
    `;
    return this.generateText(prompt);
  }

}

// Export a single instance of the service
const geminiServiceInstance = new GeminiService();
export default geminiServiceInstance;