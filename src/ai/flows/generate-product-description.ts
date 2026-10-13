
'use server';

/**
 * @fileOverview A flow for generating product descriptions.
 * This flow takes a product name and generates a compelling, SEO-friendly description.
 */

import { z } from 'zod';

const GenerateDescriptionInputSchema = z.object({
  productName: z.string().describe('The name of the product.'),
});

export type GenerateDescriptionInput = z.infer<typeof GenerateDescriptionInputSchema>;

const GenerateDescriptionOutputSchema = z.object({
  description: z.string().describe('The generated product description.'),
});

export type GenerateDescriptionOutput = z.infer<typeof GenerateDescriptionOutputSchema>;

export async function generateProductDescription(
  input: GenerateDescriptionInput
): Promise<GenerateDescriptionOutput> {
  const prompt = `You are an expert e-commerce copywriter specializing in organic and health food products for a brand called "Millet Yard".

Your task is to write a compelling, SEO-friendly product description for the following product: "${input.productName}".

The description should:
- Be engaging and informative.
- Highlight the key benefits and unique selling points.
- Mention that it is grown organically.
- Keep the tone friendly, trustworthy, and natural.
- Be around 2-3 sentences long.
`;

  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY or GOOGLE_API_KEY is not set");

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }]
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Google API error ${response.status}: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const output = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    return { description: output };
  } catch (error: any) {
    console.error("Failed to generate description:", error);
    throw new Error(error.message || "Failed to generate description");
  }
}
