import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { supabase } from "./supabaseClient";
import Login from "./Login";
import JournalEntry from "./JournalEntry";
import JournalLogs from "./JournalLogs";
import Dashboard from "./Dashboard";
import Navbar from "./components/Navbar";

function App() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  if (!session) {
    return <Login onLogin={() => supabase.auth.getSession().then(({ data: { session } }) => setSession(session))} />;
  }

  return (
    <Router>
      {/* ✅ Navbar visible on all logged-in pages */}
      <Navbar onLogout={() => setSession(null)} />

      <Routes>
        <Route path="/" element={<JournalEntry />} />
        <Route path="/logs" element={<JournalLogs />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
