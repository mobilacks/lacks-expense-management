// lib/openai.ts

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ExtractedReceiptData {
  vendor: string;
  date: string;
  total: number;
  currency: string;
  line_items?: Array<{
    description: string;
    amount: number;
  }>;
  confidence: number;
  raw_text?: string;
}

export async function extractReceiptData(
  imageUrl: string
): Promise<ExtractedReceiptData> {
  try {
    console.log('[OpenAI] Extracting data from receipt:', imageUrl);

    const response = await openai.chat.completions.create({
      model: 'gpt-4o', // Latest vision model
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Extract the following information from this receipt image:
              
1. Vendor/Merchant name
2. Date of purchase (format: YYYY-MM-DD)
3. Total amount (just the number)
4. Currency (e.g., USD, EUR)
5. Individual line items (if visible)

Return ONLY a JSON object with this exact structure:
{
  "vendor": "store name",
  "date": "YYYY-MM-DD",
  "total": 0.00,
  "currency": "USD",
  "line_items": [
    {"description": "item name", "amount": 0.00}
  ],
  "confidence": 0.95
}

If you cannot find a field, use these defaults:
- vendor: "Unknown Vendor"
- date: today's date
- total: 0
- currency: "USD"
- line_items: []
- confidence: your confidence level (0-1)`,
            },
            {
              type: 'image_url',
              image_url: {
                url: imageUrl,
              },
            },
          ],
        },
      ],
      max_tokens: 1000,
    });

    const content = response.choices[0].message.content;
    
    if (!content) {
      throw new Error('No content returned from OpenAI');
    }

    console.log('[OpenAI] Raw response:', content);

    // Parse the JSON response
    const extracted = JSON.parse(content) as ExtractedReceiptData;

    console.log('[OpenAI] ✅ Extracted data:', extracted);

    return extracted;
  } catch (error) {
    console.error('[OpenAI] Error extracting receipt data:', error);
    
    // Return default structure on error
    return {
      vendor: 'Unknown Vendor',
      date: new Date().toISOString().split('T')[0],
      total: 0,
      currency: 'USD',
      line_items: [],
      confidence: 0,
      raw_text: 'Error extracting data',
    };
  }
}
