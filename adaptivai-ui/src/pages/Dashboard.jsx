import React, { useState, useEffect } from 'react';
import { Sparkles, Dumbbell, Activity, Calendar, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getTodayStatus, getUserRoutines } from '../services/api';

const USER_ID = '11111111-1111-1111-1111-111111111111';

export default function Dashboard({ user }) {
  const [todayData, setTodayData] = useState(null);
  const [routines, setRoutines] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [statusRes, routinesRes] = await Promise.all([
          getTodayStatus(USER_ID),
          getUserRoutines(USER_ID)
        ]);
        setTodayData(statusRes);
        setRoutines(routinesRes || []);
      } catch (err) {
        console.error('Dashboard verileri alınamadı:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  const nextRoutine = routines.length > 0 ? routines[0].dayName : 'Program Belirtilmedi';

  return (
    <div className="space-y-8 font-sans">
      {/* Karşılama Başlığı */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-100">
            Tekrar hoş geldin, <span className="text-emerald-400">{user?.name || 'Sporcu'}</span> 👋
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Biyometrik verilerine ve haftalık planına göre hazırlanan güncel durum özeti.
          </p>
        </div>
        <Link
          to="/check-in"
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs px-5 py-3 rounded-xl transition-all shadow-lg shadow-emerald-500/20 cursor-pointer"
        >
          <Sparkles className="w-4 h-4" /> Günlük Check-In Yap
        </Link>
      </div>

      {/* Üst Metrik Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Readiness Skoru */}
        <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-2xl flex items-center gap-4 shadow-xl">
          <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center font-bold text-xl ${
            todayData?.hasCheckedInToday
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-slate-800/50 border-slate-700 text-slate-500'
          }`}>
            {todayData?.hasCheckedInToday ? todayData.readinessScore : '--'}
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-medium">Hazırbulunuşluk Skoru</span>
            <p className="text-sm font-semibold text-slate-200">
              {todayData?.hasCheckedInToday ? 'Bugün Hesaplandı' : 'Check-In Bekleniyor'}
            </p>
          </div>
        </div>

        {/* Hedef Seans */}
        <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-2xl flex items-center gap-4 shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Dumbbell className="w-7 h-7" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-medium">Sırada Bekleyen Seans</span>
            <p className="text-sm font-semibold text-slate-200 truncate max-w-[160px]">
              {nextRoutine}
            </p>
          </div>
        </div>

        {/* Haftalık Split Durumu */}
        <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-2xl flex items-center gap-4 shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Calendar className="w-7 h-7" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-medium">Kayıtlı Split</span>
            <p className="text-sm font-semibold text-slate-200">
              {routines.length} Günlük Program
            </p>
          </div>
        </div>
      </div>

      {/* Güncel Durum Paneli */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400" /> Bugünün Antrenman Durumu
        </h3>

        {todayData?.hasCheckedInToday ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300">
              <strong className="text-emerald-400">Koç Değerlendirmesi:</strong>{' '}
              {todayData.adaptedPlan?.coach_comment || 'Plan biyometrik verilerin doğrultusunda optimize edildi.'}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Optimizasyon tamamlandı. Hareket detayları için Check-In sekmesine göz atabilirsin.</span>
              <Link to="/check-in" className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1">
                Detayları Gör <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center space-y-3">
            <p className="text-xs text-slate-400">Bugün henüz biyometrik verilerini girmedin.</p>
            <Link
              to="/check-in"
              className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-xl transition-all"
            >
              Hemen Check-In Başlat <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}