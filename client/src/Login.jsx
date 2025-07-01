import React, { useState } from 'react';
import { supabase } from './supabaseClient';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSignup = async (e) => {
    e.preventDefault();
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) setError(error.message);
    else alert('Signup successful! Check your email for confirmation link.');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) setError(error.message);
    else onLogin();
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-background px-4">
      <div className="bg-card p-8 rounded-2xl shadow-lg w-full max-w-md">
        <h2 className="text-3xl font-bold mb-6 text-textMain text-center">🌼 Welcome to Journa</h2>

        <input
          className="border border-primary bg-background text-textMain p-3 rounded-lg w-full mb-3 focus:outline-none focus:ring-2 focus:ring-primary"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="border border-primary bg-background text-textMain p-3 rounded-lg w-full mb-5 focus:outline-none focus:ring-2 focus:ring-primary"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          className="bg-primary text-black w-full py-3 rounded-lg font-semibold shadow-md hover:scale-105 transition-transform mb-3"
          onClick={handleLogin}
        >
          Login
        </button>

        <button
          className="bg-black text-white w-full py-3 rounded-lg font-semibold shadow-md hover:scale-105 transition-transform"
          onClick={handleSignup}
        >
          Signup
        </button>

        {error && <p className="text-error text-center mt-4">{error}</p>}
      </div>
    </div>
  );
}
