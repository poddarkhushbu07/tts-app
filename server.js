const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const axios = require('axios');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

dotenv.config();

const app = express();
app.use(cors());

const MURF_API_KEY = process.env.MURF_API_KEY;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// Log key to verify it's loaded
console.log(`Google API Key Loaded: ${process.env.GOOGLE_API_KEY ? 'Yes, starting with ' + process.env.GOOGLE_API_KEY.substring(0, 5) : 'No'}`);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Serve the main HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Get available voices
app.get('/api/voices', async (req, res) => {
  try {
    console.log('Fetching voices from Murf API...');
    console.log('API Key present:', !!process.env.MURF_API_KEY);
    
    if (!process.env.MURF_API_KEY) {
      throw new Error('MURF_API_KEY is not configured in .env file');
    }

    console.log(process.env.MURF_API_KEY)
    const response = await axios({
      method: 'get',
      url: 'https://api.murf.ai/v1/speech/voices',
      headers: {
        'api-key': process.env.MURF_API_KEY
      }
    });

    console.log('Murf API response:', response.data);

    // Filter and format voices for the UI
    const voices = response.data
      .filter(voice => voice.locale.startsWith('hi-IN') || voice.locale.startsWith('en-IN'))
      .map(voice => ({
        id: voice.voiceId,
        name: voice.displayName,
        gender: voice.gender,
        accent: voice.accent,
        styles: voice.availableStyles || []
      }));

    console.log('Filtered voices:', voices);
    res.json(voices);
  } catch (error) {
    console.error('Error fetching voices:', error.response?.data || error.message);
    console.error('Full error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch voices',
      details: error.response?.data || error.message
    });
  }
});

app.post('/api/tts', async (req, res) => {
  try {
    const { text, voiceId } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }
    if (!voiceId) {
      return res.status(400).json({ error: 'Voice ID is required' });
    }

    if (!process.env.MURF_API_KEY) {
      return res.status(500).json({ error: 'MURF_API_KEY is not configured' });
    }

    console.log('Calling Murf API with text:', text, 'and voice:', voiceId);
    
    // First, generate the speech
    const generateResponse = await axios({
      method: 'post',
      url: 'https://api.murf.ai/v1/speech/generate',
      headers: {
        'Content-Type': 'application/json',
        'api-key': process.env.MURF_API_KEY
      },
      data: {
        text: text,
        voiceId: voiceId,
        style: 'Conversational',
        outputFormat: 'mp3',
        sampleRate: 24000,
        speed: 1.0,
        pitch: 1.0
      }
    });

    console.log('Generate response:', generateResponse.data);

    // Get the audio file URL from the response
    const audioUrl = generateResponse.data.audioFile;
    if (!audioUrl) {
      throw new Error('No audio file URL in response');
    }

    // Download the audio file
    const audioResponse = await axios({
      method: 'get',
      url: audioUrl,
      responseType: 'arraybuffer'
    });

    console.log('Audio response status:', audioResponse.status);
    console.log('Audio response headers:', audioResponse.headers);
    console.log('Audio data length:', audioResponse.data.length);

    // Set appropriate headers
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', audioResponse.data.length);
    res.setHeader('Accept-Ranges', 'bytes');

    // Send the audio data
    res.send(Buffer.from(audioResponse.data));
  } catch (error) {
    console.error('Error calling Murf API:', error.response?.data || error.message);
    if (error.response) {
      console.error('Error response status:', error.response.status);
      console.error('Error response headers:', error.response.headers);
      console.error('Error response data:', error.response.data);
    }
    res.status(500).json({ 
      error: 'Failed to generate speech',
      details: error.response?.data || error.message
    });
  }
});

app.post('/api/suggestions', async (req, res) => {
    const { text } = req.body;
    if (!text || text.trim().length < 3) {
        return res.json({ suggestions: [] });
    }

    try {
        const prompt = `You are an AI assistant for a Text-to-Speech app. Your task is to provide 3 text auto-completion suggestions for the given input. The users are primarily Indian and will use English, Hindi, and Hinglish (a mix of Hindi and English). The suggestions should be concise, relevant, and continue the user's thought.
        
User Input: "${text}"

Provide 3 completions for this input. Return only the full completed sentences, each on a new line, and nothing else.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const suggestionsText = response.text();

        const suggestions = suggestionsText.split('\n').map(s => s.trim()).filter(s => s && s.length > text.length);

        res.json({ suggestions });
    } catch (error) {
        console.error('Error with Google Gemini API:', error);
        res.status(500).json({ error: 'Failed to get suggestions' });
    }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Express server listening on http://localhost:${PORT}`);
}); 