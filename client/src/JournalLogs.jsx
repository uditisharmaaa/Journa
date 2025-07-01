import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import Navbar from './components/Navbar';

export default function JournalLogs() {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [expandedIndex, setExpandedIndex] = useState(null);

  const getUserId = async () => {
    const { data, error } = await supabase.auth.getUser();
    return error || !data.user ? null : data.user.id;
  };

  useEffect(() => {
    const fetchLogs = async () => {
      const userId = await getUserId();
      if (!userId) {
        setError('User not logged in.');
        return;
      }

      try {
        const { data, error } = await supabase
          .from('journal_logs')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setLogs(data);
        setFilteredLogs(data);
      } catch (err) {
        console.error('Fetch logs error:', err);
        setError('Failed to fetch journal logs.');
      }
    };

    fetchLogs();
  }, []);

  const toggleExpand = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);

    const filtered = logs.filter((log) => {
      const entryMatch = log.entry_text.toLowerCase().includes(term);
      const distortionMatch = log.detected_distortions.some((d) =>
        d.toLowerCase().includes(term)
      );
      return entryMatch || distortionMatch;
    });

    setFilteredLogs(filtered);
    setExpandedIndex(null); // collapse expanded logs on new search
  };

  return (
    <div className="max-w-4xl mx-auto mt-6 px-6">

      <h2 className="text-3xl font-bold mb-6 text-gray-900">📚 Your Journal Logs</h2>

      {/* Search Bar */}
      <input
        type="text"
        placeholder="🔍 Search by keyword or distortion..."
        value={searchTerm}
        onChange={handleSearch}
        className="w-full mb-6 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-yellow-400"
      />

      {error && <p className="text-red-600">{error}</p>}

      {filteredLogs.length === 0 ? (
        <p className="text-gray-500">No logs match your search.</p>
      ) : (
        filteredLogs.map((log, index) => (
          <div
            key={index}
            className="mb-4 p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition cursor-pointer"
            onClick={() => toggleExpand(index)}
          >
            {/* Condensed Header */}
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">
                  🕒 {new Date(log.created_at).toLocaleString()}
                </p>
                <h3 className="font-semibold text-gray-800">Journal #{logs.length - index}</h3>
              </div>

              {/* Distortion Tags */}
              <div className="flex flex-wrap gap-2">
                {log.detected_distortions?.map((dist, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 bg-yellow-200 text-yellow-800 text-xs rounded-full"
                  >
                    {dist}
                  </span>
                ))}
              </div>
            </div>

            {/* Expanded Full Content */}
            {expandedIndex === index && (
              <div className="mt-4 text-gray-700 space-y-4">
                <div>
                  <h4 className="font-semibold">📝 Your Entry:</h4>
                  <p className="whitespace-pre-wrap">{log.entry_text}</p>
                </div>

                <div>
                  <h4 className="font-semibold">🪞 AI Reframes:</h4>
                  <ul className="list-disc pl-5">
                    {Object.entries(log.ai_reframes || {}).map(([type, content], idx) => (
                      <li key={idx}>
                        <strong>{type}:</strong> {content.reframe} <br />
                        <em>Reflection Question:</em> {content.question}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold">✏️ Your Reflections:</h4>
                  <ul className="list-disc pl-5">
                    {Object.entries(log.user_reflections || {}).map(([type, reflection], idx) => (
                      <li key={idx}>
                        <strong>{type}:</strong> {reflection}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
