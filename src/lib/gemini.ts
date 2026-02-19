
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

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
    Analyze this receipt/invoice image. Extract the following information in JSON format:
    {
      "data": "YYYY-MM-DD",
      "total": Number,
      "descricao": "Merchant name or brief description",
      "categoria": "Suggest one of: 'Casa Fixa', 'Casa Variável', 'Loja Fixa', 'Loja Variável', 'Pessoal Fixa', 'Pessoal Variável'",
      "tipo": "Suggest a specific type (e.g. Supermercado, Renda, etc.) based on standard expense types."
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
