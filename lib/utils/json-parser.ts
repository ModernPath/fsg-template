/**
 * JSON Parser Utility
 * 
 * Strips markdown code fences from Gemini AI responses before parsing
 */

/**
 * Clean and parse JSON from Gemini AI response
 * 
 * Handles:
 * - Markdown code fences: ```json {...} ```
 * - Plain code fences: ``` {...} ```
 * - Pure JSON: {...}
 * 
 * @param text - Raw text from Gemini AI
 * @returns Parsed JSON object
 */
export function parseGeminiJSON<T = any>(text: string): T {
  // Remove leading/trailing whitespace
  let cleaned = text.trim();
  
  // Remove markdown code fences
  // Pattern: ```json\n{...}\n``` or ```\n{...}\n```
  if (cleaned.startsWith('```')) {
    // Remove opening fence (```json or ```)
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '');
    // Remove closing fence (```)
    cleaned = cleaned.replace(/\n?```\s*$/, '');
  }
  
  // Trim again after fence removal
  cleaned = cleaned.trim();
  
  try {
    return JSON.parse(cleaned);
  } catch (error) {
    console.error('❌ JSON Parse Error:', error);
    console.error('📄 Raw text (first 200 chars):', text.substring(0, 200));
    console.error('🧹 Cleaned text (first 200 chars):', cleaned.substring(0, 200));
    throw new Error(`Failed to parse JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Safely parse JSON with fallback
 * 
 * @param text - Raw text from Gemini AI
 * @param fallback - Fallback value if parsing fails
 * @returns Parsed JSON or fallback
 */
export function safeParseGeminiJSON<T = any>(text: string, fallback: T): T {
  try {
    return parseGeminiJSON<T>(text);
  } catch (error) {
    console.warn('⚠️ JSON parse failed, using fallback:', error);
    return fallback;
  }
}

