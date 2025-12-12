import { GoogleGenerativeAI } from "@google/generative-ai";

// 1. Model Validation (Kept as it is useful helper)
export const validateModels = async (apiKey) => {
  const genAI = new GoogleGenerativeAI(apiKey);
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    await model.generateContent("test");
    return ["gemini-1.5-flash"];
  } catch (e) {
    return ["error: " + e.message];
  }
};

// 2. Helper to get working model (Kept)
// 2. Helper to get working model
// Global cache for the working model to avoid re-testing every time
let cachedModel = null;

// Comprehensive list of candidates to try (Newest/Best first)
// Updated for Dec 2025 Standards
export const CANDIDATE_MODELS = [
  "gemini-3.0-pro",         // Razonamiento profundo (2025)
  "gemini-2.5-pro",         // Punto medio sólido
  "gemini-2.5-flash",       // Chatbots rápidos, bajo coste
  "gemini-2.0-flash-exp",   // Legacy 2024 experimental
  "gemini-1.5-pro-latest",  // Legacy 1.5
  "gemini-1.5-flash-latest",// Legacy 1.5
  "gemini-pro"              // Ancient fallback
];

export const detectBestModel = async (apiKey) => {
  const genAI = new GoogleGenerativeAI(apiKey);
  const errors = [];

  console.log("Detecting best Gemini model...");

  for (const modelName of CANDIDATE_MODELS) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      // minimal test
      await model.generateContent("Test connection");
      console.log(`✅ Model found: ${modelName}`);
      cachedModel = modelName;
      return modelName;
    } catch (e) {
      console.warn(`❌ ${modelName} failed: ${e.message}`);
      errors.push(`${modelName}: ${e.message}`);
    }
  }

  throw new Error(`No working Gemini model found.\nDetails: ${errors.map(e => e.split(':')[0]).join(', ')} failed.`);
};

// 2. Helper to get working model
const getWorkingModel = async (apiKey, genAI, prompt) => {
  // If we have a cached model, try it first
  if (cachedModel) {
    try {
      const model = genAI.getGenerativeModel({ model: cachedModel });
      return await model.generateContent(prompt);
    } catch (e) {
      console.warn(`Cached model ${cachedModel} failed, re-detecting...`);
      cachedModel = null; // Reset cache if it fails
    }
  }

  // If no cache or cache failed, run full detection
  try {
    const bestModel = await detectBestModel(apiKey);
    const model = genAI.getGenerativeModel({ model: bestModel });
    return await model.generateContent(prompt);
  } catch (e) {
    throw new Error("Critical AI Error: " + e.message);
  }
};

// Helper for robust JSON parsing
export const parseAiJson = (text) => {
  try {
    // 1. Strip Markdown code blocks
    let clean = text.replace(/```json/g, '').replace(/```/g, '');

    // 2. Try to find the JSON array
    const start = clean.indexOf('[');
    const end = clean.lastIndexOf(']');

    if (start !== -1 && end !== -1 && end > start) {
      clean = clean.substring(start, end + 1);
    }

    return JSON.parse(clean);
  } catch (e) {
    console.error("JSON Parse Error:", e, "Input:", text);
    throw new Error("La IA generó texto, pero no un formato válido. (Invalid JSON)");
  }
};

// 3. Generate Questions (Standard implementation + AbortSignal)
export const generateQuestions = async (apiKey, text, topics, countPerTopic = 5, targetLanguage = 'Spanish', abortSignal = null) => {
  const genAI = new GoogleGenerativeAI(apiKey);
  const prompt = `
    ROLE: You are an expert examiner creating a professional certification exam. 
    Your goal is to create realistic, high-quality questions based STRICTLY on the provided text sections.

    STRICT NEGATIVE CONSTRAINTS (DO NOT DO THIS):
    1. DO NOT start options with prefixes like "a)", "A.", "1.", "-". Just the text.
    2. DO NOT mention the source text in the question. phrases like "According to the text", "In the provided section", "As mentioned in [Topic Name]" are ESTRICTLY FORBIDDEN.
    3. DO NOT output questions that rely on "All of the above" or "None of the above" unless absolutely necessary for logic. Avoid them.
    4. DO NOT make answers obvious. Distractors must be highly plausible.

    QUALITY RULES:
    1. SELF-CONTAINED: Each question must stand alone. Example: Instead of "What does this component do?", say "What is the primary function of the [Specific Component]?"
    2. FORMAT: EXACTLY 3 Options per question. ONE correct.
    3. DIFFICULTY: Upper-Intermediate to Advanced. Focus on nuances, exceptions, and application of concepts, not just definitions.
    4. BALANCE: Ensure correct placement (index 0, 1, 2) varies randomly.

    Output Format (JSON Array of objects):
    [
      {
        "epigrafe": 1, // The integer ID of the topic this question belongs to (from the provided list).
        "question": "The professional phrasing of the question...",
        "options": ["Correct or Incorrect Option Text Only", "Another Option", "Third Option"],
        "answer": 0, // 0, 1, or 2 indicating the index of the correct option.
        "explanation": "Brief reasoning citing the specific concept."
      }
    ]

    Topics to cover in this batch: ${JSON.stringify(topics)}
    Target Language: ${targetLanguage} (Must be professional and formal)
    
    SOURCE TEXT TO ANALYZE: 
    ${text.substring(0, 50000)}
  `;

  try {
    // Wrap AI call to support AbortSignal cancellation
    const aiPromise = getWorkingModel(apiKey, genAI, prompt);

    if (abortSignal) {
      const abortPromise = new Promise((_, reject) => {
        abortSignal.addEventListener('abort', () => reject(new Error("AbortedByUser")));
      });
      const result = await Promise.race([aiPromise, abortPromise]);
      return parseAiJson(result.response.text());
    } else {
      const result = await aiPromise;
      return parseAiJson(result.response.text());
    }

  } catch (error) {
    if (error.message === 'AbortedByUser') {
      throw new Error("Generación cancelada por el usuario.");
    }
    console.error("Analysis Failed:", error);
    throw error;
  }
};

// 4. Analyze Topics (Restored to Classic Hybrid)
export const analyzeTopics = async (apiKey, text) => {
  // Strategy 1: Regex
  const indexSegment = text.substring(0, 20000);
  // Classic Regex: Look for "1. Title" pairs
  // We use the robust regex from before, but simplified
  const matcher = /(\d+(?:\.\d+)*\.?)\s+([^0-9\n\r]+?)(?=\s*\d+(?:\.\d+)*\.?|\s*$)/g;
  const regexTopics = [];
  let match;

  while ((match = matcher.exec(indexSegment)) !== null) {
    const number = match[1].trim();
    const title = match[2].trim();
    if (title.length > 3 && title.length < 150) {
      regexTopics.push({ topic: `${number} ${title}`, count: 10 });
    }
  }

  // If Regex found ANYTHING, use it (Original behavior restored)
  if (regexTopics.length > 0) {
    return regexTopics;
  }

  // Strategy 2: AI Fallback
  console.log("Regex failed, using AI...");
  const genAI = new GoogleGenerativeAI(apiKey);
  const prompt = `
    Analyze this text and extract the Table of Contents (Index).
    Return a JSON array: [{ "topic": "1. Introduction", "count": 10 }, ...]
    Text: ${text.substring(0, 30000)}
  `;

  try {
    const result = await getWorkingModel(apiKey, genAI, prompt);
    return parseAiJson(result.response.text());
  } catch (e) {
    // Ultimate fallback
    return [{ topic: "General Content", count: 15 }];
  }
};

// 5. Generate Structural Index (Reviewing entire doc)
export const generateStructuralIndex = async (apiKey, text) => {
  const genAI = new GoogleGenerativeAI(apiKey);
  const prompt = `
     Create a deep structural index (Table of Contents) for this text.
     Return JSON array: [{ "topic": "1. Title", "count": 10 }]
     Text: ${text.substring(0, 50000)}
   `;
  try {
    const result = await getWorkingModel(apiKey, genAI, prompt);
    return parseAiJson(result.response.text());
  } catch (e) {
    // Pass the real error message for debugging
    throw new Error("AI Index Error: " + e.message);
  }
};
