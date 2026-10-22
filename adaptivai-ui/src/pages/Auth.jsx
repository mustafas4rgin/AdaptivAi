import React, { useState } from 'react';
import { Activity, Lock, Mail, User, ArrowRight, ShieldCheck } from 'lucide-react';

export default function Auth({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // Şimdilik mock auth: Bilgileri localStorage'a atıp içeri alıyoruz
    const mockUser = {
      id: '11111111-1111-1111-1111-111111111111',
      name: isLogin ? 'Mustafa' : (formData.fullName || 'Mustafa'),
      email: formData.email || 'mustafa@adaptivai.com'
    };
    onLogin(mockUser);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Arka plan parlama efektleri */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-slate-900/60 border border-slate-800 rounded-3xl p-8 backdrop-blur-xl shadow-2xl relative z-10">
        
        {/* Logo & Başlık */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="bg-emerald-500/20 p-3 rounded-2xl text-emerald-400 border border-emerald-500/30 mb-3 shadow-lg shadow-emerald-500/10">
            <Activity className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
            AdaptivAI
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {isLogin 
              ? 'Biyomekanik koçuna erişmek için giriş yap' 
              : 'Akıllı hipertrofi yolculuğuna başlamak için hesap oluştur'}
          </p>
        </div>

        {/* Tab Geçişi (Giriş Yap / Kayıt Ol) */}
        <div className="flex bg-slate-950/80 p-1 rounded-xl border border-slate-800 mb-6 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
              isLogin 
                ? 'bg-emerald-500 text-slate-950 shadow-md' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Giriş Yap
          </button>
          <button
            type="button"
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
              !isLogin 
                ? 'bg-emerald-500 text-slate-950 shadow-md' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Kayıt Ol
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {!isLogin && (
            <div>
              <label className="block text-slate-300 font-medium mb-1.5">Ad Soyad</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Mustafa Sargın"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                  required={!isLogin}
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-slate-300 font-medium mb-1.5">E-posta Adresi</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                placeholder="mustafa@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1.5">Şifre</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full mt-2 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20"
          >
            <span>{isLogin ? 'Koç Paneline Giriş Yap' : 'Hesabımı Oluştur'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Biyometrik verilerin uçtan uca şifrelenir</span>
        </div>
      </div>
    </div>
  );
}