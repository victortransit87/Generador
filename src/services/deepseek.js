
import { parseAiJson } from './gemini';

// DeepSeek API Configuration
// Official Endpoint: https://api.deepseek.com/chat/completions
// PROXY: If in Development, use Vite Proxy to bypass CORS.
const DEEPSEEK_API_URL = import.meta.env.DEV
    ? "/deepseek-proxy"
    : "https://api.deepseek.com";

export const validateDeepSeekConnection = async (apiKey) => {
    try {
        const response = await fetch(`${DEEPSEEK_API_URL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "deepseek-chat",
                messages: [{ role: "user", content: "Test connection" }],
                max_tokens: 10
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || "Connection failed");
        }

        return ["deepseek-v3 (Latest)"];
    } catch (e) {
        throw new Error("DeepSeek Error: " + e.message);
    }
};

export const generateQuestionsDeepSeek = async (apiKey, text, topics, countPerTopic = 5, targetLanguage = 'Spanish', abortSignal = null) => {
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
    ${text.substring(0, 50000)} // DeepSeek context is large, but safe to cap
  `;

    try {
        const response = await fetch(`${DEEPSEEK_API_URL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "deepseek-chat", // V3 is default
                messages: [
                    { role: "system", content: "You are a helpfull high-strict examiner JSON generator." },
                    { role: "user", content: prompt }
                ],
                temperature: 1.1, // DeepSeek likes high temp for creativity
                stream: false
            }),
            signal: abortSignal
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || "DeepSeek API Error");
        }

        const data = await response.json();
        const content = data.choices[0].message.content;

        return parseAiJson(content);

    } catch (error) {
        if (error.name === 'AbortError') throw new Error("Generación cancelada por el usuario.");
        throw error;
    }
};

export const analyzeTopicsDeepSeek = async (apiKey, text) => {
    const prompt = `
     ROLE: You are a structural analyzer bot.
     TASK: Extract the Table of Contents (Index) from the text completely.
     FORMAT: Return ONLY a valid JSON array. Do not add markdown blocks or text.
     EXAMPLE:
     [
        { "topic": "1. Introduction", "count": 10 },
        { "topic": "2. Main Concepts", "count": 10 }
     ]
     Text to Analyze: ${text.substring(0, 30000)}
   `;

    try {
        const response = await fetch(`${DEEPSEEK_API_URL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "deepseek-chat",
                messages: [
                    { role: "system", content: "You are a precise JSON extractor. Output valid JSON only." },
                    { role: "user", content: prompt }
                ],
                temperature: 0.0 // Zero temp for deterministic extraction
            })
        });

        const data = await response.json();
        return parseAiJson(data.choices[0].message.content);
    } catch (e) {
        return [{ topic: "General Content (DeepSeek Fallback)", count: 15 }];
    }
};

export const generateStructuralIndexDeepSeek = async (apiKey, text) => {
    const prompt = `
     ROLE: You are a structural analyzer bot.
     TASK: Create a deep structural index (Table of Contents) based on the text.
     FORMAT: Return ONLY a valid JSON array. No explanations.
     EXAMPLE:
     [
        { "topic": "1. Historical Context", "count": 10 },
        { "topic": "2. Modern Applications", "count": 10 }
     ]
     Text to Analyze: ${text.substring(0, 50000)}
   `;

    try {
        const response = await fetch(`${DEEPSEEK_API_URL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "deepseek-chat",
                messages: [
                    { role: "system", content: "You are a precise JSON extractor. Output valid JSON only." },
                    { role: "user", content: prompt }
                ],
                temperature: 0.0 // Zero temp
            })
        });

        const data = await response.json();
        return parseAiJson(data.choices[0].message.content);
    } catch (e) {
        throw new Error("DeepSeek Index Error: " + e.message);
    }
};
