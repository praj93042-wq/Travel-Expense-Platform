import express, { Request, Response } from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '20mb' }));

// Server-side initialization of Gemini SDK with mandatory aistudio-build User-Agent
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Gemini Multimodal Vision Receipt Scanning Endpoint
app.post('/api/gemini/scan-receipt', async (req: Request, res: Response) => {
  try {
    const { imageBase64, imageUrl, mimeType = 'image/jpeg' } = req.body;

    let cleanBase64 = '';
    let finalMimeType = mimeType;

    if (imageUrl && !imageBase64) {
      const imgRes = await fetch(imageUrl);
      const arrayBuffer = await imgRes.arrayBuffer();
      cleanBase64 = Buffer.from(arrayBuffer).toString('base64');
      finalMimeType = imgRes.headers.get('content-type') || mimeType;
    } else if (imageBase64) {
      // Strip data URL header if present (e.g., data:image/png;base64,...)
      cleanBase64 = imageBase64.replace(/^data:[a-zA-Z0-9/+-]+;base64,/, '');
    } else {
      return res.status(400).json({ error: 'Image base64 data or imageUrl is required.' });
    }

    const imagePart = {
      inlineData: {
        mimeType: finalMimeType || 'image/jpeg',
        data: cleanBase64,
      }
    };

    const textPart = {
      text: 'Analyze this receipt image using high-precision multimodal vision. Extract the vendor/merchant name, the transaction date (formatted as YYYY-MM-DD), the detected 3-letter ISO currency code (e.g., USD, EUR, GBP, JPY, SGD, CAD, CHF, AUD) from symbols or text, the final total monetary amount (number only), tax/VAT amount (number only, or 0 if not listed), the appropriate corporate expense category, a business purpose summary, and individual itemized line items.',
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: { parts: [imagePart, textPart] },
      config: {
        systemInstruction: 'You are an elite corporate receipt scanner and OCR accountant. Extract precise merchant, date, currency, total amount, and line items from receipts accurately.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            merchantName: {
              type: Type.STRING,
              description: 'The name of the merchant, store, or vendor.',
            },
            date: {
              type: Type.STRING,
              description: 'The transaction date in YYYY-MM-DD format.',
            },
            currency: {
              type: Type.STRING,
              description: 'The standard 3-letter ISO currency code detected on the receipt (e.g. USD, EUR, GBP, JPY, SGD, CAD, AUD, CHF).',
            },
            total: {
              type: Type.NUMBER,
              description: 'The total final charged amount on the bill.',
            },
            tax: {
              type: Type.NUMBER,
              description: 'The tax, tip, or VAT portion included in the bill.',
            },
            category: {
              type: Type.STRING,
              description: 'The best matching category: Meals & Entertainment, Hotel & Lodging, Ground Transport / Taxi, Flights, Office & Equipment, or Software & Subscriptions.',
            },
            purpose: {
              type: Type.STRING,
              description: 'A brief 1-sentence business purpose description of what was purchased.',
            },
            lineItems: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  description: { type: Type.STRING },
                  amount: { type: Type.NUMBER },
                },
                required: ['description', 'amount'],
              },
            },
          },
          required: ['merchantName', 'date', 'total', 'category', 'currency'],
        },
      },
    });

    const rawJson = response.text?.trim() || '{}';
    const parsedData = JSON.parse(rawJson);

    res.json({
      success: true,
      data: parsedData,
      modelUsed: 'gemini-3.5-flash',
    });
  } catch (err: any) {
    console.error('Gemini Receipt Vision Error:', err);
    res.status(500).json({
      error: err.message || 'Failed to scan receipt with Gemini multimodal vision.',
      details: String(err),
    });
  }
});

// Multi-turn Chat Endpoint with Maps & Search Grounding
app.post('/api/gemini/chat', async (req: Request, res: Response) => {
  try {
    const { 
      messages, 
      systemInstruction, 
      model = 'gemini-3.5-flash',
      useSearch = false, 
      useMaps = false,
      userLocation
    } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required.' });
    }

    // Prepare contents array for generateContent
    const contents = messages.map(m => ({
      role: m.role === 'model' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    // Configure tools according to Gemini API Skill guidelines
    const tools: any[] = [];
    let toolConfig: any = undefined;

    if (useMaps) {
      // Maps Grounding requires gemini-3.5-flash and cannot be combined with googleSearch
      tools.push({ googleMaps: {} });
      if (userLocation && userLocation.latitude && userLocation.longitude) {
        toolConfig = {
          retrievalConfig: {
            latLng: {
              latitude: Number(userLocation.latitude),
              longitude: Number(userLocation.longitude)
            }
          }
        };
      }
    } else if (useSearch) {
      // Search Grounding with googleSearch tool
      tools.push({ googleSearch: {} });
    }

    const config: any = {
      systemInstruction: systemInstruction || 'You are Patty, an expert corporate travel and workforce expense intelligence assistant. You help employees and managers verify receipts, validate lodging/flight rates, look up IRS/GSA per diem allowances, and check corporate expense policy rules.',
    };

    if (tools.length > 0) {
      config.tools = tools;
      if (toolConfig) {
        config.toolConfig = toolConfig;
      }
    }

    // Call Gemini API server-side
    const response = await ai.models.generateContent({
      model,
      contents,
      config,
    });

    const text = response.text || '';
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    res.json({
      text,
      groundingChunks,
      modelUsed: model,
    });
  } catch (err: any) {
    console.error('Gemini Chat API Error:', err);
    res.status(500).json({ 
      error: err.message || 'An error occurred while generating chat response.',
      details: String(err)
    });
  }
});

// Mount Vite or static files
async function setupApp() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
}

setupApp();
