
import { GoogleGenAI, Type } from "@google/genai";
import { StudySession } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const generateStudyPlan = async (subject: string, topic: string, duration: number): Promise<string[]> => {
  const prompt = `En tant que coach d'études expert, propose un plan de révision détaillé pour le sujet suivant : "${topic}" dans la matière "${subject}". 
  La session dure ${duration} minutes. Décompose le temps en étapes logiques (ex: lecture, exercices, synthèse).
  Réponds uniquement avec une liste d'étapes claires.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Une liste d'étapes d'étude."
        }
      }
    });

    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Erreur Gemini (Plan):", error);
    return ["Introduction", "Révision principale", "Exercices", "Pause", "Conclusion"];
  }
};

export const getMotivationalQuote = async (): Promise<{ text: string; author: string }> => {
  const prompt = "Génère une citation de motivation courte et inspirante pour un étudiant qui révise ses examens. Format JSON: { \"text\": \"...\", \"author\": \"...\" }";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            text: { type: Type.STRING },
            author: { type: Type.STRING }
          },
          required: ["text", "author"]
        }
      }
    });

    return JSON.parse(response.text || '{"text": "Le succès est la somme de petits efforts répétés jour après jour.", "author": "Robert Collier"}');
  } catch (error) {
    return { text: "Le succès est la somme de petits efforts répétés jour après jour.", author: "Robert Collier" };
  }
};
