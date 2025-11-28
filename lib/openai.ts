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
              text: `You are a receipt data extraction assistant. Analyze this receipt/invoice image and extract the following information:

1. Vendor/Merchant name (the PRIMARY merchant/platform)
2. Purchase date (the date the transaction occurred, NOT delivery date)
3. Total amount paid (the final total after all taxes and fees)
4. Currency (e.g., USD, EUR)
5. Individual line items with descriptions and prices

VENDOR IDENTIFICATION RULES:
- If you see an "Amazon" logo, smile logo, or "Amazon.com" anywhere → vendor is "Amazon"
- If you see "Walmart" logo or branding → vendor is "Walmart"
- If you see "Target" logo or branding → vendor is "Target"
- For other receipts, use the main merchant name at the top
- Ignore third-party sellers (like "NGS Inc.") if it's clearly an Amazon/Walmart/etc order

DATE EXTRACTION RULES:
- Look for "Order Date", "Purchase Date", "Transaction Date", or "Date Placed"
- DO NOT use "Delivery Date", "Shipped Date", or "Expected Arrival"
- Format as YYYY-MM-DD

AMOUNT EXTRACTION RULES:
- Look for "Grand Total", "Total", "Amount Paid", or "Order Total"
- This should be the final amount INCLUDING tax
- DO NOT use subtotal or pre-tax amounts

IMPORTANT INSTRUCTIONS:
- Return ONLY valid JSON, no markdown formatting, no code blocks
- Do not wrap the JSON in backticks or \`\`\`json blocks
- Be as accurate as possible

Return a JSON object with this exact structure:
{
  "vendor": "Amazon",
  "date": "2025-11-14",
  "total": 97.41,
  "currency": "USD",
  "line_items": [
    {"description": "Product name", "amount": 89.99}
  ],
  "confidence": 0.95
}

If you cannot find specific information:
- vendor: Use recognizable merchant name, otherwise "Unknown Vendor"
- date: Use purchase date if visible, otherwise today's date
- total: The final amount paid
- currency: Default to "USD" if not specified
- line_items: Extract visible items with their prices
- confidence: Your confidence level from 0 to 1 (be honest!)`,
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
      temperature: 0.1,
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
