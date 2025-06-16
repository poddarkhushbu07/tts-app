import { useState } from 'react'
import './App.css'

const VOICES = [
  { label: 'Neutral', value: 'neutral' },
  { label: 'Happy', value: 'happy' },
  { label: 'Sad', value: 'sad' },
  { label: 'Angry', value: 'angry' },
];

function App() {
  const [text, setText] = useState('');
  const [voice, setVoice] = useState('neutral');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setAudioUrl(null);
    try {
      const res = await fetch('http://localhost:5001/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice }),
      });
      const data = await res.json();
      if (data.audioUrl) {
        setAudioUrl(data.audioUrl);
      } else {
        setError('No audio returned');
      }
    } catch (err) {
      setError('Failed to fetch audio');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold mb-6">Hinglish Text-to-Speech</h1>
      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4 w-full max-w-md">
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="text">Hinglish Text</label>
          <textarea
            id="text"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            rows={4}
            value={text}
            onChange={e => setText(e.target.value)}
            required
            placeholder="Enter Hinglish text..."
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="voice">Voice Tone</label>
          <select
            id="voice"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={voice}
            onChange={e => setVoice(e.target.value)}
          >
            {VOICES.map(v => (
              <option key={v.value} value={v.value}>{v.label}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center justify-between">
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            disabled={loading}
          >
            {loading ? 'Converting...' : 'Convert to Audio'}
          </button>
        </div>
        {error && <p className="text-red-500 mt-2">{error}</p>}
      </form>
      {audioUrl && (
        <div className="mt-4 w-full max-w-md bg-white p-4 rounded shadow">
          <audio controls src={audioUrl} className="w-full" />
        </div>
      )}
    </div>
  )
}

export default App
