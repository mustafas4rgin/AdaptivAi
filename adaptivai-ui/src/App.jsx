import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import CheckIn from './pages/CheckIn';
import Routine from './pages/Routine';
import CoachChat from './pages/CoachChat';
import History from './pages/History';

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('adaptivai_user');
    return saved ? JSON.parse(saved) : null;
  });

  const handleLogin = (user) => {
    setCurrentUser(user);
    localStorage.setItem('adaptivai_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('adaptivai_user');
  };

  // Kullanıcı giriş yapmamışsa sadece Login / Register ekranını göster
  if (!currentUser) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <BrowserRouter>
      <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
        {/* Sol Sidebar */}
        <Sidebar user={currentUser} onLogout={handleLogout} />

        {/* Ana İçerik Alanı */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-6xl mx-auto">
            <Routes>
              <Route path="/" element={<Dashboard user={currentUser} />} />
              <Route path="/check-in" element={<CheckIn user={currentUser} />} />
              <Route path="/routine" element={<Routine user={currentUser} />} />
              <Route path="/chat" element={<CoachChat user={currentUser} />} />
              <Route path="/history" element={<History user={currentUser} />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </main>
      </div>
    </BrowserRouter>
  );
}