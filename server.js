require('dotenv').config();
const express = require('express');
const axios = require('axios');
const app = express();

const AI_API_KEY = process.env.AI_API_KEY;
const AI_MODEL = 'gemini-pro'; // Using Gemini Pro for analysis

app.use(express.json());
app.use(express.static('public')); // Serve static frontend files from a 'public' directory

// Allow CORS for local development/GitHub Pages
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.sendStatus(200); } else { next(); }
});

app.post('/analyze', async (req, res) => {
  const { documentText, prompt } = req.body;

  if (!documentText || !prompt) {
    return res.status(400).json({ error: 'documentText and prompt are required.' });
  }
  if (!AI_API_KEY || AI_API_KEY === 'YOUR_GEMINI_API_KEY') {
    return res.status(500).json({ error: 'AI_API_KEY not configured on the server.' });
  }

  try {
    const fullPrompt = `You are an expert engineering document analyst. Analyze the following document text based on the user's specific request.\n\nUser Request: ${prompt}\n\nDocument Text:\n${documentText}\n\nProvide a clear, concise, and actionable analysis.`;

    const aiResponse = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/${AI_MODEL}:generateContent?key=${AI_API_KEY}`,
      {
        contents: [{ parts: [{ text: fullPrompt }] }],
        safetySettings: [
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
        ]
      }
    );

    const analysis = aiResponse.data.candidates?.[0]?.content?.parts?.[0]?.text || 'No analysis available.';
    res.json({ analysis });
  } catch (error) {
    console.error('AI analysis error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to get AI analysis.', details: error.message });
  }
});

const PORT = process.env.PORT || 4000; // Using port 4000 to avoid conflicts
app.listen(PORT, () => {
  console.log(`Blueprint AI backend running on port ${PORT}`);
  console.log(`Set AI_API_KEY in .env to a valid Gemini API key.`);
});
