'use server';

export async function improveTextAction(currentText: string, type: 'title' | 'description'): Promise<string> {
    if (!currentText || currentText.trim().length === 0) {
        return "";
    }

    try {
        let prompt = "";
        if (type === 'title') {
            prompt = `Improve this product title to be more SEO friendly, clear, attractive, and professional. 
      Keep it under 80 characters. 
      Do not use quotes or prefixes. 
      Just return the improved title text.
      Current Title: "${currentText}"`;
        } else {
            prompt = `Improve this product description. 
      Make it persuasive, highlight potential key features (implying based on context), and use a professional, sales-oriented tone.
      If the input has HTML, preserve the structure but improve the content. 
      If it's plain text, you can use basic HTML tags like <p>, <ul>, <li>, <strong>.
      Keep it concise but detailed enough for an e-commerce product.
      Current Description: "${currentText}"`;
        }

        const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
        if (!apiKey) throw new Error("AI API key is not configured. Please set GEMINI_API_KEY or GOOGLE_API_KEY in your .env.local file.");

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-001:generateContent?key=${apiKey}`;

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ role: "user", parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 1024,
                }
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMsg = errorData.error?.message || response.statusText;
            console.error(`Gemini API error ${response.status}:`, errorMsg);
            if (response.status === 400) {
                throw new Error("Invalid request to AI. Please try with different text.");
            } else if (response.status === 403) {
                throw new Error("AI API key is invalid or does not have access. Check your GOOGLE_API_KEY.");
            } else if (response.status === 429) {
                throw new Error("AI rate limit exceeded. Please wait a moment and try again.");
            } else if (response.status === 404) {
                throw new Error("AI model not found. The API endpoint may have changed.");
            }
            throw new Error(`AI service error (${response.status}): ${errorMsg}`);
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) {
            const blockReason = data.candidates?.[0]?.finishReason;
            if (blockReason === 'SAFETY') {
                throw new Error("AI could not improve this text due to content safety filters. Try rephrasing.");
            }
            throw new Error("AI returned an empty response. Please try again.");
        }

        return text.replace(/^"|"$/g, '').trim(); // Remove wrapping quotes if any
    } catch (error: any) {
        console.error("Error improving text with AI:", error);
        // Re-throw with the specific message if it's already our error
        if (error.message && !error.message.startsWith("Error improving")) {
            throw error;
        }
        throw new Error("Failed to improve text. Please check your internet connection and API key.");
    }
}
