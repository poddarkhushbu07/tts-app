const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const axios = require('axios');
const path = require('path');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve the main HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Get available voices
app.get('/api/voices', async (req, res) => {
  try {
    const response = await axios({
      method: 'get',
      url: 'https://api.murf.ai/v1/speech/voices',
      headers: {
        'api-key': process.env.MURF_API_KEY
      }
    });

    // Filter and format voices for the UI
    const voices = response.data
      .filter(voice => voice.locale.startsWith('hi-IN') || voice.locale.startsWith('en-IN'))
      .map(voice => ({
        id: voice.voiceId,
        name: voice.displayName,
        gender: voice.gender,
        accent: voice.accent,
        styles: voice.availableStyles
      }));

    res.json(voices);
  } catch (error) {
    console.error('Error fetching voices:', error.response?.data || error.message);
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

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Express server listening on http://localhost:${PORT}`);
}); 