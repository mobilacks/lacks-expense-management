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
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `You are a receipt data extraction assistant. Analyze this receipt image and extract the following information:

1. Vendor/Merchant name (the store or company name)
2. Purchase date (the date the transaction occurred, NOT delivery date)
3. Total amount paid (the final total)
4. Currency (e.g., USD, EUR)
5. Individual line items with descriptions and prices

IMPORTANT INSTRUCTIONS:
- Look for the PURCHASE DATE or TRANSACTION DATE, NOT the delivery date
- Extract the GRAND TOTAL or FINAL TOTAL amount
- Return ONLY valid JSON, no markdown formatting, no code blocks
- Do not wrap the JSON in backticks or \`\`\`json blocks

Return a JSON object with this exact structure:
{
  "vendor": "store name here",
  "date": "YYYY-MM-DD",
  "total": 0.00,
  "currency": "USD",
  "line_items": [
    {"description": "item name", "amount": 0.00}
  ],
  "confidence": 0.95
}

If you cannot find specific information:
- vendor: Use the merchant/store name if visible, otherwise "Unknown Vendor"
- date: Use the purchase/transaction date if visible, otherwise use today's date
- total: The final amount paid (after tax)
- currency: Default to "USD" if not visible
- line_items: Extract visible items, or empty array if none visible
- confidence: Your confidence level from 0 to 1`,
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
      temperature: 0.1, // Lower temperature for more consistent output
    });

    let content = response.choices[0].message.content;
    
    if (!content) {
      throw new Error('No content returned from OpenAI');
    }

    console.log('[OpenAI] Raw response:', content);

    // Clean up the response - remove markdown code blocks if present
    content = content.trim();
    
    // Remove ```json and ``` markers
    if (content.startsWith('```json')) {
      content = content.replace(/^```json\s*\n?/, '');
    }
    if (content.startsWith('```')) {
      content = content.replace(/^```\s*\n?/, '');
    }
    if (content.endsWith('```')) {
      content = content.replace(/\n?```\s*$/, '');
    }
    
    content = content.trim();

    console.log('[OpenAI] Cleaned response:', content);

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
      raw_text: error instanceof Error ? error.message : 'Error extracting data',
    };
  }
}
