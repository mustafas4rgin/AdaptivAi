import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Dumbbell, Sparkles, TrendingUp, Calendar, ArrowRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import api from '../services/api';

export default function Dashboard({ user }) {
  const { lang, t } = useLanguage();
  const navigate = useNavigate();
  const [recentLogs, setRecentLogs] = useState([]);
  const [activeRoutine, setActiveRoutine] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [logsRes, routinesRes] = await Promise.all([
          api.get(`/coach/history?userId=${user.id}`).catch(() => ({ data: [] })),
          api.get(`/coach/routines?userId=${user.id}`).catch(() => ({ data: [] }))
        ]);

        if (logsRes.data) setRecentLogs(logsRes.data.slice(0, 5));
        if (routinesRes.data && routinesRes.data.length > 0) setActiveRoutine(routinesRes.data[0]);
      } catch (err) {
        console.error('Dashboard hatası:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [user.id]);

  return (
    <div className="space-y-6">
      {/* Kullanıcı Karşılama Kartı */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/30 border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-white">
              {t('welcomeBack')}, {user?.fullName || 'Athlete'}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {t('athleteLevel')}: <span className="text-emerald-400 font-semibold">{user?.fitnessLevel || 'Intermediate'}</span> • {t('goal')}: <span className="text-cyan-400 font-semibold">{user?.primaryGoal || 'Hypertrophy'}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/check-in')}
            className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-500/10"
          >
            <Activity className="w-4 h-4" />
            {t('startCheckIn')}
          </button>
        </div>
      </div>

      {/* Metrik Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider">
            <Dumbbell className="w-4 h-4 text-emerald-400" />
            {t('activeSplit')}
          </div>
          <div className="text-lg font-black text-slate-100">
            {activeRoutine?.dayName || 'Push / Pull / Legs'}
          </div>
          <p className="text-[11px] text-slate-500">
            {activeRoutine?.exercises?.length || 0} {t('sets')} planlandı
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            {t('recentReadiness')}
          </div>
          <div className="text-2xl font-black text-cyan-400 font-mono">
            {recentLogs[0]?.readinessScore ? `${recentLogs[0].readinessScore} / 100` : '85 / 100'}
          </div>
          <p className="text-[11px] text-slate-500">
            {recentLogs.length > 0 ? t('lastWorkout') : 'Optimal toparlanma'}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-amber-400" />
            {t('builder')}
          </div>
          <div className="text-sm font-semibold text-slate-200">
            {lang === 'en' ? 'Biomechanical Overload Engine' : 'Yapay Zeka Yükleme Motoru'}
          </div>
          <button
            type="button"
            onClick={() => navigate('/routine-builder')}
            className="text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 cursor-pointer"
          >
            {t('goToBuilder')} <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Hızlı Yönlendirme Kartı */}
      <div className="p-6 rounded-2xl bg-slate-900/20 border border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-slate-400" />
          <div>
            <h4 className="text-sm font-bold text-slate-200">{t('readyToday')}</h4>
            <p className="text-xs text-slate-500">
              {recentLogs[0] ? recentLogs[0].routineName : t('noCheckInYet')}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate('/check-in')}
          className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
        >
          {t('openWorkout')} <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}