import React, { useState, useEffect } from 'react';
import { 
  History as HistoryIcon, 
  Calendar, 
  ChevronDown, 
  ChevronUp, 
  RefreshCw, 
  Dumbbell, 
  Activity, 
  Sparkles 
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { getWorkoutHistory } from '../services/api';

export default function History({ user }) {
  const { lang, t } = useLanguage();
  const userId = user?.id || user?.userId;

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedLogId, setExpandedLogId] = useState(null);

  useEffect(() => {
    if (userId) {
      loadHistory();
    } else {
      setLoading(false);
    }
  }, [userId]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const data = await getWorkoutHistory(userId);
      setLogs(Array.isArray(data) ? data : []);
      if (Array.isArray(data) && data.length > 0) {
        setExpandedLogId(data[0].id);
      }
    } catch (err) {
      console.error(lang === 'en' ? 'Failed to fetch history logs:' : 'Geçmiş loglar alınamadı:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id) => {
    setExpandedLogId(expandedLogId === id ? null : id);
  };

  const formatDate = (dateStr) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(lang === 'en' ? 'en-US' : 'tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
        <RefreshCw className="w-5 h-5 animate-spin text-emerald-400" />
        <span>{t('historyLoadingLogs')}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-sans">
      {/* Üst Başlık */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2.5">
          <HistoryIcon className="w-5 h-5 text-emerald-400" /> {t('historyTitle')}
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          {t('historySubtitle')}
        </p>
      </div>

      {logs.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/60 border border-slate-800 rounded-3xl space-y-3">
          <Dumbbell className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-slate-300">{t('historyNoLogsTitle')}</h3>
          <p className="text-xs text-slate-500">
            {t('historyNoLogsDesc')}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => {
            const isExpanded = expandedLogId === log.id;
            const plan = log.adaptedPlan || {};
            const exercises = plan.modified_exercises || [];

            return (
              <div
                key={log.id}
                className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-lg transition-all"
              >
                {/* Akordeon Başlığı */}
                <button
                  type="button"
                  onClick={() => toggleExpand(log.id)}
                  className="w-full p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left hover:bg-slate-900/90 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col items-center justify-center text-emerald-400 shrink-0">
                      <span className="text-lg font-black">{log.readinessScore}</span>
                      <span className="text-[8px] font-bold uppercase text-emerald-500">{t('historyScoreLabel')}</span>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-slate-100">{log.routineName}</h4>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>{formatDate(log.workoutDate)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                    <span className="text-xs text-slate-400 font-semibold bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
                      {exercises.length} {t('historyExercisesCount')}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </button>

                {/* Akordeon Gövdesi */}
                {isExpanded && (
                  <div className="p-4 sm:p-5 border-t border-slate-800/80 bg-slate-950/40 space-y-4">
                    {/* Koç Özeti */}
                    {plan.coach_comment && (
                      <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                        <strong className="text-emerald-400 block mb-1">{t('historyCoachAssessment')}</strong>
                        {plan.coach_comment}
                      </div>
                    )}

                    {/* Egzersiz Listesi */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {exercises.map((ex, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-2 text-xs"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <h5 className="font-bold text-slate-200">{ex.exercise_name}</h5>
                            <span
                              className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${
                                ex.action === 'REPLACED'
                                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              }`}
                            >
                              {ex.action === 'REPLACED' ? t('historyActionReplaced') : t('historyActionOptimized')}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                            <span>{ex.sets} {t('historySetsLabel')} x {ex.reps}</span>
                            <span>•</span>
                            <span className="text-emerald-400">RPE {ex.rpe}</span>
                            {(ex.suggested_weight_kg || ex.previous_weight_kg) && (
                              <>
                                <span>•</span>
                                <span className="text-amber-400 font-semibold">
                                  {ex.suggested_weight_kg || ex.previous_weight_kg} kg
                                </span>
                              </>
                            )}
                          </div>

                          {ex.reason && (
                            <p className="text-[10px] text-slate-500 bg-slate-950/60 p-2 rounded-lg border border-slate-850">
                              {ex.reason}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}