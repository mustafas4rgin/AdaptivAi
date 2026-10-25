import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Flame, 
  Dumbbell, 
  Sparkles, 
  MessageSquare, 
  History as HistoryIcon, 
  LogOut,
  Globe
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function Sidebar({ user, onLogout }) {
  const { lang, toggleLang, t } = useLanguage();

  const navItems = [
    { to: '/', label: t('dashboard'), icon: LayoutDashboard },
    { to: '/check-in', label: t('checkIn'), icon: Flame },
    { to: '/routine', label: t('routine'), icon: Dumbbell },
    { to: '/routine-builder', label: t('builder'), icon: Sparkles },
    { to: '/chat', label: t('coach'), icon: MessageSquare },
    { to: '/history', label: t('history'), icon: HistoryIcon }
  ];

  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-900 flex flex-col justify-between p-4 select-none shrink-0 font-sans">
      <div className="space-y-6">
        {/* Logo ve Başlık */}
        <div className="flex items-center justify-between px-3 pt-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Flame className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-base font-black text-slate-100 tracking-tight">AdaptivAI</h1>
              <p className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase">
                {lang === 'en' ? 'Biomechanical Engine' : 'Akıllı Koçluk Sistemi'}
              </p>
            </div>
          </div>

          {/* TR / EN Hızlı Geçiş Butonu */}
          <button
            type="button"
            onClick={toggleLang}
            title={lang === 'en' ? 'Switch to Turkish' : 'İngilizceye Geç'}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-bold text-slate-300 hover:border-emerald-500/50 hover:text-white transition-all cursor-pointer"
          >
            <Globe className="w-3 h-3 text-slate-400" />
            <span className={lang === 'tr' ? 'text-emerald-400 font-black' : 'text-slate-500'}>TR</span>
            <span className="text-slate-600">/</span>
            <span className={lang === 'en' ? 'text-emerald-400 font-black' : 'text-slate-500'}>EN</span>
          </button>
        </div>

        {/* Navigasyon Linkleri */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Alt Profil ve Çıkış Alanı */}
      <div className="space-y-2 pt-4 border-t border-slate-900">
        <div className="px-3 py-2 rounded-xl bg-slate-900/40 border border-slate-900 flex items-center justify-between">
          <div className="overflow-hidden pr-2">
            <span className="text-xs font-bold text-slate-200 block truncate">
              {user?.fullName || 'Sporcu'}
            </span>
            <span className="text-[10px] text-slate-500 truncate block">
              {user?.email || 'user@adaptivai.app'}
            </span>
          </div>
          <button
            type="button"
            onClick={onLogout}
            title={t('logout')}
            className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}