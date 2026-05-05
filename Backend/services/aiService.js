const axios = require('axios');
const { PDFParse } = require('pdf-parse');

// In-memory cache: pdfUrl -> extractedText
const pdfTextCache = {};

const extractPdfText = async (pdfUrl) => {
    if (pdfTextCache[pdfUrl]) return pdfTextCache[pdfUrl];
    const parser = new PDFParse({ url: pdfUrl });
    const result = await parser.getText();
    pdfTextCache[pdfUrl] = result;
    return result;
};

const callGemini = async (prompt, retries = 3) => {
    for (let attempt = 0; attempt < retries; attempt++) {
        try {
            const response = await axios.post(
                'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent',
                {
                    contents: [{ parts: [{ text: prompt }] }],
                },
                {
                    headers: { 'Content-Type': 'application/json' },
                    params: { key: process.env.GEMINI_API_KEY },
                }
            );
            return response.data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        } catch (error) {
            const status = error.response?.status;
            if ((status === 429 || status === 503) && attempt < retries - 1) {
                const waitMs = (attempt + 1) * 5000; // 5s, 10s, 15s
                console.log(`AI Service: Error ${status}. Retrying in ${waitMs / 1000}s... (attempt ${attempt + 2}/${retries})`);
                await new Promise(resolve => setTimeout(resolve, waitMs));
            } else {
                throw error;
            }
        }
    }
};

const generateSummary = async (pdfUrl, title, subject) => {
    try {
        const pdfData = await extractPdfText(pdfUrl);
        const prompt = `You are an academic content analyzer. Analyze the following PDF content and return a JSON response.

Title: ${title}
Subject: ${subject}

PDF Content:
${pdfData.text?.substring(0, 8000)}

Return ONLY a valid JSON object (no markdown, no code blocks) with these exact fields:
{
    "summary": "A comprehensive 3-5 sentence summary of the document",
    "keyTopics": ["topic1", "topic2", "topic3", "topic4", "topic5"],
    "difficulty": "Beginner" or "Intermediate" or "Advanced"
}`;

        const response = await callGemini(prompt);
        // Clean the response - remove markdown code blocks if present
        const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const parsed = JSON.parse(cleaned);
        return {
            summary: parsed.summary || '',
            keyTopics: parsed.keyTopics || [],
            difficulty: parsed.difficulty || 'Intermediate'
        };
    } catch (error) {
        console.error('AI Summary generation error:', error.message);
        return { summary: '', keyTopics: [], difficulty: '' };
    }
};

const generateQuizQuestions = async (pdfUrl, title, subject, numQuestions = 10) => {
    try {
        const pdfData = await extractPdfText(pdfUrl);
        const prompt = `You are a quiz generator for students. Based on the following PDF content, generate exactly ${numQuestions} multiple-choice questions.

Title: ${title}
Subject: ${subject}

PDF Content:
${pdfData.text?.substring(0, 8000)}

Return ONLY a valid JSON array (no markdown, no code blocks) with this exact format:
[
    {
        "question": "What is...?",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctAnswer": 0,
        "explanation": "Brief explanation of why this is correct"
    }
]

Rules:
- Each question must have exactly 4 options
- correctAnswer is the 0-based index of the correct option
- Questions should test understanding, not just memorization
- Cover different topics from the document
- Keep questions clear and unambiguous`;

        const response = await callGemini(prompt);
        const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const questions = JSON.parse(cleaned);
        return Array.isArray(questions) ? questions : [];
    } catch (error) {
        console.error('Quiz generation error:', error.message);
        return [];
    }
};

module.exports = { extractPdfText, callGemini, generateSummary, generateQuizQuestions };
