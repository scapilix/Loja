
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the API with your key
// In production, this should be in an environment variable (VITE_GEMINI_API_KEY)
// For now, we will ask the user or use a placeholder if not set.
const API_KEY = (import.meta as any).env.VITE_GEMINI_API_KEY || "";

const genAI = new GoogleGenerativeAI(API_KEY);

export async function scanReceipt(imageFile: File): Promise<any> {
  if (!API_KEY) {
    throw new Error("API Key missing. Please set VITE_GEMINI_API_KEY.");
  }

  // Convert File to Base64
  const base64Data = await fileToGenerativePart(imageFile);

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

  const prompt = `
    Analyze this receipt/invoice image. Extract the following information in JSON format:
    {
      "data": "YYYY-MM-DD",
      "total": Number (total value with tax),
      "entidade": "Merchant/Entity Name",
      "nif": "Tax ID/NIF if found",
      "numero_fatura": "Invoice number (e.g. FT 2024/123)",
      "valor_sem_iva": Number (net value),
      "valor_iva": Number (tax value),
      "categoria": "Suggest one of: 'Despesa/Compras', 'Serviços', 'Outros'",
      "tipo_fatura": "Suggest one of: 'Compras', 'Vendas', 'Despesas'"
    }
    If you cannot find a field, return null for it.
    Return ONLY raw JSON, no markdown formatting.
  `;

  try {
    const result = await model.generateContent([prompt, base64Data]);
    const response = await result.response;
    const text = response.text();
    
    // Clean up markdown code blocks if present
    const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();
    
    return JSON.parse(cleanText);
  } catch (error) {
    console.error("Error scanning receipt:", error);
    throw error;
  }
}

async function fileToGenerativePart(file: File) {
  return new Promise<{ inlineData: { data: string; mimeType: string } }>(
    (resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(",")[1];
        resolve({
          inlineData: {
            data: base64String,
            mimeType: file.type,
          },
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    }
  );
}
