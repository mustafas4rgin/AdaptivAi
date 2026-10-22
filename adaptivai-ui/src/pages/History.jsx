import React, { useState, useEffect } from 'react';
import { History as HistoryIcon, Calendar, Activity, RefreshCw } from 'lucide-react';
import { getWorkoutHistory } from '../services/api';

const USER_ID = '11111111-1111-1111-1111-111111111111';

export default function History() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLogs() {
      try {
        const data = await getWorkoutHistory(USER_ID);
        setLogs(data || []);
      } catch (err) {
        console.error('Geçmiş loglar alınamadı:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchLogs();
  }, []);

  return (
    <div className="space-y-6 font-sans">
      <div>
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <HistoryIcon className="w-5 h-5 text-emerald-400" /> Geçmiş Seans Logları
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Daha önce tamamlanan check-in'ler, hazırbulunuşluk skorları ve AI adaptasyonları.
        </p>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" /> Loglar yükleniyor...
        </div>
      ) : logs.length === 0 ? (
        <div className="p-12 text-center text-xs text-slate-500 bg-slate-900/40 border border-slate-800 rounded-2xl">
          Henüz kayıtlı bir antrenman seansı bulunmuyor. Check-in yaptıkça seansların burada birikecek.
        </div>
      ) : (
        <div className="space-y-4">
          {logs.map((log) => (
            <div
              key={log.id}
              className="p-5 bg-slate-900/60 border border-slate-800 rounded-2xl shadow-xl space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center font-bold text-sm text-emerald-400">
                    {log.readinessScore}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-200">{log.routineName}</h3>
                    <span className="text-[11px] text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(log.workoutDate).toLocaleDateString('tr-TR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {log.adaptedPlan?.coach_comment && (
                <p className="text-xs text-slate-400 bg-slate-950/60 p-3 rounded-xl border border-slate-800/60">
                  <strong className="text-emerald-400">Koç Notu:</strong> {log.adaptedPlan.coach_comment}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}