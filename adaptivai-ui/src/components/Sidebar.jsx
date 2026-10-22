import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Flame, 
  Dumbbell, 
  MessageSquare, 
  History, 
  Activity,
  LogOut
} from 'lucide-react';

const navItems = [
  { path: '/', label: 'Genel Bakış', icon: LayoutDashboard },
  { path: '/check-in', label: 'Günlük Check-In', icon: Flame },
  { path: '/routine', label: 'Antrenman Programım', icon: Dumbbell },
  { path: '/chat', label: 'Biyomekanik Koç', icon: MessageSquare },
  { path: '/history', label: 'Geçmiş & Loglar', icon: History },
];

export default function Sidebar({ user, onLogout }) {
  return (
    <aside className="w-64 bg-slate-900/80 border-r border-slate-800 flex flex-col justify-between p-4 shrink-0">
      <div>
        {/* Logo */}
        <div className="flex items-center gap-3 px-3 py-4 mb-4 border-b border-slate-800/80">
          <div className="bg-emerald-500/20 p-2 rounded-xl text-emerald-400 border border-emerald-500/30">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
              AdaptivAI
            </h1>
            <p className="text-[10px] text-slate-400">Akıllı Koçluk Sistemi</p>
          </div>
        </div>

        {/* Menü Linkleri */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Alt Profil & Çıkış Yap Butonu */}
      <div className="border-t border-slate-800/80 pt-4 px-2 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center font-bold text-emerald-400">
            {user?.name?.[0]?.toUpperCase() || 'M'}
          </div>
          <div className="truncate max-w-[110px]">
            <p className="font-semibold text-slate-200 truncate">{user?.name || 'Mustafa'}</p>
            <span className="text-[10px] text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Çevrimiçi
            </span>
          </div>
        </div>

        <button
          onClick={onLogout}
          title="Çıkış Yap"
          className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}