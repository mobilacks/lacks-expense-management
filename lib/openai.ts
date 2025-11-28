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
              text: getExtractionPrompt(),
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

    return parseOpenAIResponse(response.choices[0].message.content);
  } catch (error) {
    console.error('[OpenAI] Error extracting receipt data:', error);
    return getDefaultExtractedData(error);
  }
}

function getExtractionPrompt(): string {
  return `Extract the following information from this receipt/invoice:

VENDOR IDENTIFICATION RULES:
- If you see "Amazon.com", "amazon.com", "Amazon", or Amazon branding → vendor is "Amazon"
- If you see "Walmart" → vendor is "Walmart"
- If you see "Target" → vendor is "Target"
- For other receipts, use the main merchant name at the top
- Ignore third-party sellers (like "NGS Inc.", "Sold by:") if it's clearly a marketplace order

DATE EXTRACTION RULES:
- Look for "Order Date", "Purchase Date", "Transaction Date", "Date Placed", or "Order placed"
- DO NOT use "Delivery Date", "Shipped Date", "Expected Arrival", or "Delivered"
- Format as YYYY-MM-DD
- Common patterns: "November 14, 2025" → "2025-11-14"

AMOUNT EXTRACTION RULES:
- Look for "Grand Total", "Total", "Amount Paid", "Order Total"
- This should be the final amount INCLUDING tax
- DO NOT use subtotal, pre-tax amounts, or item prices
- Extract just the number (e.g., "$97.41" → 97.41)

LINE ITEMS RULES:
- Extract product/item names and their individual prices
- Do NOT include shipping, tax, or fees as line items
- Format: {"description": "Product Name", "amount": 12.99}

IMPORTANT INSTRUCTIONS:
- Return ONLY valid JSON, no markdown formatting, no code blocks
- Do not wrap the JSON in backticks or \`\`\`json blocks
- Be as accurate as possible
- If you're unsure, set confidence lower

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
- total: The final amount paid (must be a number, not 0 unless truly $0)
- currency: Default to "USD" if not specified
- line_items: Extract visible items with their prices, empty array if none
- confidence: Your confidence level from 0 to 1 (be honest!)`;
}

function parseOpenAIResponse(content: string | null): ExtractedReceiptData {
  if (!content) {
    throw new Error('No content returned from OpenAI');
  }

  console.log('[OpenAI] Raw response:', content);

  // Clean up the response
  let cleanedContent = cleanJsonResponse(content);

  console.log('[OpenAI] Cleaned response:', cleanedContent);

  // Parse the JSON response
  const extracted = JSON.parse(cleanedContent) as ExtractedReceiptData;

  console.log('[OpenAI] ✅ Extracted data:', extracted);

  return extracted;
}

function cleanJsonResponse(content: string): string {
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
  
  return content.trim();
}

function getDefaultExtractedData(error: any): ExtractedReceiptData {
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
