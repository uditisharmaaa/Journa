import React, { useState, useRef } from 'react';
import { supabase } from './supabaseClient';
import api from './api';
import Navbar from './components/Navbar';

export default function JournalEntry() {
  const [entry, setEntry] = useState('');
  const [mood, setMood] = useState(3);  // Default mood = Neutral
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState([]);
  const [reframes, setReframes] = useState({});
  const [reflections, setReflections] = useState({});
  const recognitionRef = useRef(null);

  const getUserId = async () => {
    const { data, error } = await supabase.auth.getUser();
    return error || !data.user ? null : data.user.id;
  };

  const handleStartListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Speech Recognition not supported. Try Chrome or Edge.');
      return;
    }
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.continuous = false;
    recognition.lang = 'en-US';
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setEntry((prev) => prev + ' ' + transcript);
    };
    recognition.onerror = (event) => setError('Speech recognition error: ' + event.error);
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  const handleStopListening = () => recognitionRef.current?.stop();

  const fetchReframes = async (distortionMap) => {
    try {
      const res = await api.post('/generate_reframes', { entry, distortion_map: distortionMap });
      setReframes(res.data);
    } catch (err) {
      console.error('Gemini API error:', err);
      setError('Failed to generate reframes.');
    }
  };

  const handleSubmit = async () => {
    if (!entry.trim()) {
      setError('Please write or speak something first.');
      return;
    }
    setError('');
    setSummary([]);
    setReframes({});
    setReflections({});

    try {
      const res = await api.post('/analyze', { entry });
      const filtered = res.data.results.filter(r => r.confidence >= 0.4);
      const uniqueDistortions = [...new Set(filtered.map(r => r.predicted_distortion))];
      setSummary(uniqueDistortions);

      if (uniqueDistortions.length > 0) {
        const distortionMap = {};
        uniqueDistortions.forEach(type => {
          distortionMap[type] = filtered
            .filter(r => r.predicted_distortion === type)
            .map(r => r.sentence);
        });
        await fetchReframes(distortionMap);
      }
    } catch (err) {
      console.error('API error:', err);
      setError('Failed to analyze your journal entry.');
    }
  };

  const handleReflectionChange = (type, value) => {
    setReflections((prev) => ({ ...prev, [type]: value }));
  };

  const handleSaveEntry = async () => {
    const userId = await getUserId();
    if (!userId) {
      setError('User not logged in.');
      return;
    }
    try {
      await api.post('/save_entry', {
        user_id: userId,
        mood,  // ✅ Save mood as number (1-5)
        entry_text: entry,
        detected_distortions: summary,
        ai_reframes: reframes,
        user_reflections: reflections,
      });
      alert('✅ Journal entry saved!');
    } catch (err) {
      console.error('Save entry API error:', err);
      setError('Failed to save your journal entry.');
    }
  };

  const moodLabels = {
    1: "😞 Very Sad",
    2: "😟 Sad",
    3: "😐 Neutral",
    4: "🙂 Happy",
    5: "😄 Very Happy",
  };

  return (
    <div className="max-w-3xl mx-auto mt-8 px-6">

      <h2 className="text-3xl font-bold mb-4 text-gray-900">📝 What's on your mind today?</h2>

      {/* Mood Slider */}
      <div className="mb-6">
        <label className="block text-gray-700 font-medium mb-2">How are you feeling right now?</label>
        <input
          type="range"
          min="1"
          max="5"
          value={mood}
          onChange={(e) => setMood(Number(e.target.value))}
          className="w-full accent-yellow-400"
        />
        <p className="mt-1 text-gray-800 text-sm text-center">{moodLabels[mood]}</p>
      </div>

      {/* Journal Textarea */}
      <textarea
        className="border border-yellow-300 bg-yellow-50 w-full p-4 rounded-xl h-40 focus:outline-none focus:ring-2 focus:ring-yellow-400 placeholder-gray-500 text-gray-800"
        placeholder="Type your thoughts or use speech-to-text..."
        value={entry}
        onChange={(e) => setEntry(e.target.value)}
      />

      {/* Buttons */}
      <div className="flex gap-4 mt-4">
        <button
          onClick={isListening ? handleStopListening : handleStartListening}
          className={`py-2 px-4 rounded-xl font-medium shadow-sm transition-transform ${
            isListening
              ? 'bg-red-500 text-white'
              : 'bg-yellow-300 text-black hover:bg-yellow-400'
          }`}
        >
          {isListening ? '🛑 Stop Listening' : '🎤 Speak Your Thoughts'}
        </button>

        <button
          onClick={handleSubmit}
          className="bg-black text-white py-2 px-4 rounded-xl shadow hover:bg-gray-800 transition-transform"
        >
          Analyze My Entry
        </button>
      </div>

      {error && <p className="text-red-600 mt-4">{error}</p>}

      {/* Summary */}
      {summary.length > 0 && (
        <div className="mt-8 bg-white border border-gray-200 p-4 rounded-xl shadow-sm">
          <h3 className="text-xl font-semibold text-gray-800 mb-2">🧠 Cognitive Patterns Detected:</h3>
          <ul className="list-disc pl-5 text-gray-700 space-y-1">
            {summary.map((type, index) => (
              <li key={index} className="font-medium">{type}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Reframes */}
      {Object.keys(reframes).length > 0 && (
        <div className="mt-6 bg-white border border-gray-200 p-4 rounded-xl shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">🪞 AI-Generated CBT Reframes:</h3>
          <div className="space-y-6">
            {Object.entries(reframes).map(([type, content], index) => (
              <div key={index} className="border-l-4 border-yellow-300 pl-4">
                <p className="font-semibold text-gray-800">{type}</p>
                <p className="text-gray-700 mb-1">
                  <span className="font-medium">Reframe:</span> {content.reframe}
                </p>
                <p className="text-gray-700 mb-1">
                  <span className="font-medium">Reflection Question:</span> {content.question}
                </p>
                <textarea
                  className="border border-gray-300 w-full p-2 rounded text-sm focus:ring-2 focus:ring-yellow-400"
                  placeholder={`Your reflection on ${type}...`}
                  value={reflections[type] || ''}
                  onChange={(e) => handleReflectionChange(type, e.target.value)}
                />
              </div>
            ))}
          </div>

          <button
            onClick={handleSaveEntry}
            className="mt-6 bg-green-500 text-white py-2 px-4 rounded-xl hover:bg-green-600 transition-transform"
          >
            💾 Save This Reflection
          </button>
        </div>
      )}
    </div>
  );
}
