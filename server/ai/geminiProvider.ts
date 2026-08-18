/**
 * Blue AI Provider - Google Gemini Integration (Server-Side Only)
 * 
 * NEVER expose GEMINI_API_KEY to the client bundle.
 */

import fs from "fs";
import path from "path";

function readEnvDirect(keyName: string): string {
  try {
    const envPath = path.resolve(process.cwd(), ".env");
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf-8");
      for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (trimmed.startsWith(`${keyName}=`) || trimmed.startsWith(`${keyName} =`) || trimmed.startsWith(`${keyName} = `)) {
          const parts = trimmed.split("=");
          parts.shift();
          const val = parts.join("=").trim().replace(/^["']|["']$/g, "");
          if (val) return val;
        }
      }
    }
  } catch (err) {
    console.error(`[GeminiProvider] Error reading ${keyName} from .env:`, err);
  }
  return "";
}

export interface GeminiResponse<T = any> {
  success: boolean;
  data?: T;
  text?: string;
  error?: string;
}

export class GeminiProvider {
  private baseUrl = "https://generativelanguage.googleapis.com/v1beta/models";
  private fallbackModels = ["gemini-3.6-flash", "gemini-2.0-flash", "gemini-1.5-flash"];

  public getApiKey(): string {
    const fromProcess = (process.env.GEMINI_API_KEY || "").trim();
    if (fromProcess && fromProcess.length > 5) {
      return fromProcess;
    }
    const fromFile = readEnvDirect("GEMINI_API_KEY");
    if (fromFile && fromFile.length > 5) {
      process.env.GEMINI_API_KEY = fromFile;
      return fromFile;
    }
    return "";
  }

  public getModel(): string {
    const fromProcess = (process.env.GEMINI_MODEL || "").trim();
    if (fromProcess) return fromProcess;
    const fromFile = readEnvDirect("GEMINI_MODEL");
    if (fromFile) return fromFile;
    return "gemini-3.6-flash";
  }

  public isConfigured(): boolean {
    const key = this.getApiKey();
    return Boolean(key && key.length > 5);
  }

  /**
   * Generates a structured JSON response from Gemini with automatic fallback on 404
   */
  public async generateStructuredJson<T = any>(
    prompt: string,
    systemInstruction?: string,
    responseSchema?: any
  ): Promise<GeminiResponse<T>> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      return {
        success: false,
        error: "Chave da Gemini API não encontrada no arquivo .env. Verifique o campo GEMINI_API_KEY.",
      };
    }

    const preferredModel = this.getModel();
    const candidateModels = [preferredModel, ...this.fallbackModels.filter(m => m !== preferredModel)];

    const body: any = {
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.7,
        topP: 0.95,
      },
    };

    if (systemInstruction) {
      body.systemInstruction = {
        parts: [{ text: systemInstruction }],
      };
    }

    if (responseSchema) {
      body.generationConfig.responseSchema = responseSchema;
    }

    let lastError = "";

    for (const model of candidateModels) {
      const endpoint = `${this.baseUrl}/${model}:generateContent?key=${apiKey}`;

      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          const message = errData?.error?.message || response.statusText;

          if (response.status === 404) {
            // Model not found or deprecated, try next model in fallback list
            lastError = `Modelo ${model} indisponível: ${message}`;
            continue;
          }

          if (response.status === 429) {
            return { success: false, error: "Limite de requisições temporariamente excedido na API Gemini. Tente novamente em alguns instantes." };
          }
          if (response.status === 400 || response.status === 403) {
            return { success: false, error: `Erro de autenticação da Gemini API (${response.status}): ${message}` };
          }
          return { success: false, error: `Erro na API Gemini (${response.status}): ${message}` };
        }

        const data = await response.json();
        const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!candidateText) {
          return { success: false, error: "A Blue não retornou conteúdo estruturado válido." };
        }

        try {
          const parsed = JSON.parse(candidateText) as T;
          return { success: true, data: parsed, text: candidateText };
        } catch (parseError) {
          const jsonMatch = candidateText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
          if (jsonMatch && jsonMatch[1]) {
            const parsed = JSON.parse(jsonMatch[1]) as T;
            return { success: true, data: parsed, text: candidateText };
          }
          return { success: false, error: "Resposta da Blue não pôde ser interpretada como JSON estruturado.", text: candidateText };
        }
      } catch (err: any) {
        lastError = err?.message || "Falha na conexão com o modelo.";
      }
    }

    return {
      success: false,
      error: `Não foi possível obter resposta de nenhum modelo Gemini testado (${candidateModels.join(", ")}). Último erro: ${lastError}`,
    };
  }

  /**
   * Generates a conversational text response with conversation history and model fallback
   */
  public async generateChatResponse(
    messages: { role: "user" | "model" | "assistant"; content: string }[],
    systemInstruction?: string
  ): Promise<GeminiResponse<string>> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      return {
        success: false,
        error: "Chave da Gemini API não encontrada no arquivo .env. Verifique o campo GEMINI_API_KEY.",
      };
    }

    const preferredModel = this.getModel();
    const candidateModels = [preferredModel, ...this.fallbackModels.filter(m => m !== preferredModel)];

    const contents = messages.map((m) => ({
      role: m.role === "assistant" ? "model" : m.role,
      parts: [{ text: m.content }],
    }));

    const body: any = {
      contents,
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
      },
    };

    if (systemInstruction) {
      body.systemInstruction = {
        parts: [{ text: systemInstruction }],
      };
    }

    let lastError = "";

    for (const model of candidateModels) {
      const endpoint = `${this.baseUrl}/${model}:generateContent?key=${apiKey}`;

      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          const message = errData?.error?.message || response.statusText;

          if (response.status === 404) {
            lastError = `Modelo ${model} indisponível: ${message}`;
            continue;
          }

          return { success: false, error: `Erro na Blue (${response.status}): ${message}` };
        }

        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

        return { success: true, data: text, text };
      } catch (err: any) {
        lastError = err?.message || "Erro de conexão";
      }
    }

    return {
      success: false,
      error: `Erro ao conectar com a Blue: ${lastError}`,
    };
  }
}
