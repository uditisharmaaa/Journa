import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function Navbar({ onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    if (onLogout) onLogout();
  };

  const linkStyle = (path) =>
    `px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
      location.pathname === path
        ? 'bg-yellow-400 text-black shadow-sm'
        : 'bg-gray-100 text-gray-700 hover:bg-yellow-300 hover:text-black'
    }`;

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 mb-8">
      <div className="max-w-5xl mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex space-x-4">
          <button onClick={() => navigate('/')} className={linkStyle('/')}>
            📝 Journal
          </button>
          <button onClick={() => navigate('/logs')} className={linkStyle('/logs')}>
            📚 My Logs
          </button>
          <button onClick={() => navigate('/dashboard')} className={linkStyle('/dashboard')}>
            📈 Dashboard
          </button>
        </div>

        <button
          onClick={handleLogout}
          className="px-4 py-2 rounded-full text-sm font-semibold bg-red-100 text-red-700 hover:bg-red-200 transition-all duration-200"
        >
          🚪 Logout
        </button>
      </div>
    </nav>
  );
}
