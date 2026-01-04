
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult } from "../types";

export const analyzeReport = async (rawText: string): Promise<AnalysisResult[]> => {
  if (!process.env.API_KEY) {
    throw new Error("找不到 API 金鑰，請檢查環境設定。");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const systemInstruction = `
    你是一位專業的人資數據分析師。請分析工作日報內容並回傳 JSON 陣列。
    每個物件代表一天的分析結果。
    
    關鍵規則：
    1. 語言：必須使用「繁體中文」(Traditional Chinese)。
    2. 格式：僅回傳 JSON，嚴禁包含 markdown 代碼區塊或額外說明文字。
    3. 精簡：所有描述請保持簡短精煉，避免回傳過長導致 JSON 截斷。
    4. 日期辨識：找出如 "12/22" 的日期。
    5. 類別標籤：使用如 '文件作業', '實驗室', '樣品抽檢', '溝通協調', '會議', '行政' 等繁體中文標籤。
    6. 特殊字元：確保所有雙引號與換行符號都有正確轉義 (Escape)。
    
    結構範例：
    [
      {
        "reportDate": "日期字串",
        "totalDurationMinutes": 數字,
        "tasks": [
          {
            "id": "唯一標識",
            "title": "任務標題",
            "category": "分類標籤",
            "durationMinutes": 數字,
            "description": "簡短任務描述"
          }
        ],
        "summary": "今日總結 (50字以內)",
        "efficiencyScore": 數字 (0-100),
        "suggestions": ["建議一", "建議二"]
      }
    ]
  `;

  const responseSchema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        reportDate: { type: Type.STRING },
        totalDurationMinutes: { type: Type.INTEGER },
        tasks: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              title: { type: Type.STRING },
              category: { type: Type.STRING },
              durationMinutes: { type: Type.INTEGER },
              description: { type: Type.STRING },
            },
            required: ["id", "title", "category", "durationMinutes"],
          },
        },
        summary: { type: Type.STRING },
        efficiencyScore: { type: Type.INTEGER },
        suggestions: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
      },
      required: ["reportDate", "tasks", "summary", "efficiencyScore", "suggestions"],
    }
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `待分析日報內容：\n${rawText}`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema,
      },
    });

    const text = response.text?.trim();
    if (!text) {
      throw new Error("AI 回傳了空的內容");
    }

    let jsonString = text;
    if (text.includes("```")) {
       const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
       if (match) jsonString = match[1].trim();
    }

    try {
      const parsed = JSON.parse(jsonString);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch (parseError: any) {
      if (parseError.message.includes("Unterminated string") || parseError.message.includes("Unexpected end")) {
         throw new Error("資料量過大導致分析中斷，請嘗試分批輸入。");
      }
      throw parseError;
    }
  } catch (e: any) {
    console.error("Gemini Analysis Error:", e);
    throw new Error(e.message || "分析失敗");
  }
};
