import { GoogleGenAI } from "@google/genai";
// FIX: Import AnalysisResult to use it as the return type.
import { AnalysisResult, AnalysisSource } from '../types';

// FIX: Changed return type to Promise<AnalysisResult> to match what the App.tsx component expects.
export const analyzeContent = async (title: string, subtitles: string): Promise<AnalysisResult> => {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable not set. Please configure it to use AI features.");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const prompt = `
        Analyze the following video content for factual accuracy, coherence, and potential improvements.
        The video title is "${title}".
        The script/subtitles are:
        ---
        ${subtitles || "(No subtitles provided)"}
        ---
        Provide a concise, 4-sentence analysis of the content's strengths and any potential areas for improvement or factual correction. Use Google Search to verify any facts or claims. If the content seems fine, state that.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
            },
        });

        // FIX: Renamed analysisText to text to match the AnalysisResult interface.
        const text = response.text;
        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

        const sources = groundingChunks
            .map((chunk: any) => chunk.web)
            .filter(Boolean)
            .map((web: any) => ({ uri: web.uri, title: web.title }))
            // Simple deduplication
            .filter((value: AnalysisSource, index: number, self: AnalysisSource[]) =>
                index === self.findIndex((t) => t.uri === value.uri)
            );

        // FIX: Return an object with `text` property to match the AnalysisResult interface.
        return { text, sources };
    } catch (error) {
        console.error("Gemini API call failed:", error);
        throw new Error("Failed to get analysis from Gemini. Check console for details.");
    }
};