const Resource = require('../models/resource');
const axios = require('axios');
const { PDFParse } = require('pdf-parse');
// In-memory cache: pdfUrl -> extractedText
const pdfTextCache = {};

// Function to extract text from PDF
const extractPdfText = async (pdfUrl) => {
  try {
    if (pdfTextCache[pdfUrl]) return pdfTextCache[pdfUrl];

    
    const parser = new PDFParse({ url: pdfUrl });

	  const result = await parser.getText();

    // console.log(result);

    pdfTextCache[pdfUrl] = result;
    return result;
  } catch (error) {
    console.error('PDF extraction error:', error.message);
    throw new Error('Failed to extract PDF content');
  }
};
// Function to call Gemini API
const askGemini = async (messages, systemInstruction) => {
  let conversationText = systemInstruction + '\n\n';
  messages.forEach((msg) => {
    if (msg.role === 'user') {
      conversationText += `User: ${msg.content}\n`;
    } else {
      conversationText += `Assistant: ${msg.content}\n`;
    }
  });

  const maxRetries = 3;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await axios.post(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent',
        {
          contents: [{ parts: [{ text: conversationText }] }],
        },
        {
          headers: { 'Content-Type': 'application/json' },
          params: { key: process.env.GEMINI_API_KEY },
        }
      );
      return response.data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response';
    } catch (error) {
      if ((error.response?.status === 429 || error.response?.status === 503) && attempt < maxRetries - 1) {
        const waitMs = (attempt + 1) * 5000;
        console.log(`Rate limited. Retrying in ${waitMs / 1000}s...`);
        await new Promise(resolve => setTimeout(resolve, waitMs));
      } else {
        console.error('Error from Gemini:', error.response?.data || error.message);
        throw new Error('Gemini API failed. Please wait a moment and try again.');
      }
    }
  }
};

// Controller: POST /api/v1/chat/:resourceId
const chatWithPDF = async (req, res) => {
  try {
    const { resourceId } = req.params;
    const { message, history } = req.body;

    if (!message) {
      return res.status(400).json({ msg: 'Message is required' });
    }

    const resource = await Resource.findById(resourceId);

    if (!resource) {
      return res.status(404).json({ msg: 'Resource not found' });
    }

    // Extract PDF text
    const pdfText = await extractPdfText(resource.pdfUrl);
    // console.log(pdfText.text);
    // System instruction (context + rules)
    const systemPrompt = `
You are a helpful study assistant.

The user is asking questions about:
Title: ${resource.title}
Subject: ${resource.subject}
Semester: ${resource.semester}

Below is the content of the PDF:
------------------------
${pdfText.text}
------------------------

Rules:
- Answer ONLY using the PDF content
- If answer is not present, clearly say "Not found in the document"
- Keep answers simple and useful for students
`;

    // Build conversation messages
    const messages = [
      ...(history || []),
      { role: 'user', content: message },
    ];

    // Call Gemini
    const reply = await askGemini(messages, systemPrompt);

    return res.json({ reply });
  } catch (error) {
    console.error('Chat error:', error.message);
    return res.status(500).json({ msg: 'Internal server error' });
  }
};

module.exports = { chatWithPDF };