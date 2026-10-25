import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import Sidebar from './components/Sidebar';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import CheckIn from './pages/CheckIn';
import Routine from './pages/Routine';
import CoachChat from './pages/CoachChat';
import History from './pages/History';
import RoutineBuilder from './pages/RoutineBuilder';
import api from './services/api';

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('adaptivai_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  // Sayfa ilk açıldığında token geçerli mi kontrol et
  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await api.get('/auth/me');
        setCurrentUser(res.data);
        localStorage.setItem('adaptivai_user', JSON.stringify(res.data));
      } catch (err) {
        console.error('Oturum süresi dolmuş veya geçersiz:', err);
        handleLogout();
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, []);

  const handleLogin = (authData) => {
    if (authData.token) {
      localStorage.setItem('token', authData.token);
    }
    setCurrentUser(authData);
    localStorage.setItem('adaptivai_user', JSON.stringify(authData));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('adaptivai_user');
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950 text-slate-400">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
          <span>Yükleniyor...</span>
        </div>
      </div>
    );
  }

  // Kullanıcı giriş yapmamışsa sadece Login / Register ekranını göster
  if (!currentUser) {
    return (
      <LanguageProvider>
        <Auth onLogin={handleLogin} />
      </LanguageProvider>
    );
  }

  return (
    <LanguageProvider>
      <BrowserRouter>
        <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
          {/* Sol Sidebar */}
          <Sidebar user={currentUser} onLogout={handleLogout} />

          {/* Ana İçerik Alanı */}
          <main className="flex-1 overflow-y-auto p-8">
            <div className="max-w-6xl mx-auto">
              <Routes>
                {/* Ana Sayfa / Dashboard rotası */}
                <Route path="/" element={<Dashboard user={currentUser} />} />
                
                <Route path="/routine-builder" element={<RoutineBuilder user={currentUser} />} />
                <Route path="/check-in" element={<CheckIn user={currentUser} />} />
                <Route path="/routine" element={<Routine user={currentUser} />} />
                <Route path="/chat" element={<CoachChat user={currentUser} />} />
                <Route path="/history" element={<History user={currentUser} />} />
                
                {/* Tanımsız rotaları ana sayfaya yönlendir */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </main>
        </div>
      </BrowserRouter>
    </LanguageProvider>
  );
}