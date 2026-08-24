const AI_MODEL = "gpt-4o-mini";
const AI_TIMEOUT_MS = 30000;

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export class AIClientError extends Error {
  constructor(
    message: string,
    public code: "MISSING_KEY" | "TIMEOUT" | "RATE_LIMIT" | "API_ERROR" | "PARSE_ERROR" | "INVALID_RESPONSE"
  ) {
    super(message);
    this.name = "AIClientError";
  }
}

export async function callAI(
  systemPrompt: string,
  userMessage: string
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new AIClientError(
      "مفتاح AI غير مضبوط. أضف OPENAI_API_KEY في ملف .env",
      "MISSING_KEY"
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        temperature: 0.3,
        response_format: { type: "json_object" },
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new AIClientError(
          "تم تجاوز حد الطلبات. حاول بعد قليل.",
          "RATE_LIMIT"
        );
      }
      throw new AIClientError(
        `خطأ في خدمة AI (${response.status})`,
        "API_ERROR"
      );
    }

    const data = await response.json();
    const content: string | undefined = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new AIClientError("لم يتم تلقي رد من AI.", "PARSE_ERROR");
    }

    return content;
  } catch (error) {
    if (error instanceof AIClientError) throw error;
    if (error instanceof Error && error.name === "AbortError") {
      throw new AIClientError("انتهت مهلة الطلب.", "TIMEOUT");
    }
    throw new AIClientError(
      `خطأ غير متوقع: ${error instanceof Error ? error.message : "غير معروف"}`,
      "API_ERROR"
    );
  } finally {
    clearTimeout(timeout);
  }
}

export function parseAIJSON<T>(jsonString: string, schema: { parse: (data: unknown) => T }): T {
  try {
    const parsed = JSON.parse(jsonString);
    return schema.parse(parsed) as T;
  } catch {
    throw new AIClientError("لم يتمكن قراءة استجابة AI بشكل صحيح.", "PARSE_ERROR");
  }
}