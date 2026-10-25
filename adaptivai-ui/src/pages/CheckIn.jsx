import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Moon, 
  Zap, 
  Flame, 
  AlertCircle, 
  RefreshCw, 
  Sparkles, 
  CheckCircle2, 
  Utensils, 
  Dumbbell,
  Save,
  PlusCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { checkInAndAdapt, getUserRoutines, logWorkoutWeights } from '../services/api';

export default function CheckIn({ user }) {
  const { lang, t } = useLanguage();
  const userId = user?.id || user?.userId;

  const [sleepHours, setSleepHours] = useState(8);
  const [energyLevel, setEnergyLevel] = useState(8);
  const [muscleSoreness, setMuscleSoreness] = useState(2);
  const [painNotes, setPainNotes] = useState('');
  
  const [routines, setRoutines] = useState([]);
  const [selectedRoutineId, setSelectedRoutineId] = useState('');

  const [loading, setLoading] = useState(false);
  const [adaptationResult, setAdaptationResult] = useState(null);
  const [routineTitle, setRoutineTitle] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [loggedWeights, setLoggedWeights] = useState({});
  const [savingWeights, setSavingWeights] = useState(false);
  const [weightsSavedSuccess, setWeightsSavedSuccess] = useState(false);

  useEffect(() => {
    if (userId) {
      loadUserRoutines();
    }
  }, [userId]);

  const loadUserRoutines = async () => {
    try {
      const data = await getUserRoutines(userId);
      const activeDays = (data || []).filter((d) => !d.isRestDay);
      setRoutines(activeDays);
      if (activeDays.length > 0) {
        setSelectedRoutineId(activeDays[0].id);
      }
    } catch (err) {
      console.error(lang === 'en' ? 'Failed to load routines:' : 'Rutinler yüklenemedi:', err);
    }
  };

  const handleSubmitCheckIn = async (e) => {
    e.preventDefault();
    if (!userId) return;

    setLoading(true);
    setErrorMsg('');
    setWeightsSavedSuccess(false);

    try {
      const payload = {
        sleepHours: parseFloat(sleepHours),
        energyLevel: parseInt(energyLevel, 10),
        muscleSoreness: parseInt(muscleSoreness, 10),
        painNotes: painNotes.trim(),
        routineDayId: selectedRoutineId || null
      };

      const res = await checkInAndAdapt(userId, payload);
      setAdaptationResult(res.adaptation);
      setRoutineTitle(res.routineName);

      if (res.adaptation?.modified_exercises) {
        const initialMap = {};
        res.adaptation.modified_exercises.forEach((ex) => {
          const defaultVal = ex.suggested_weight_kg ?? ex.previous_weight_kg ?? '';
          if (defaultVal !== '') {
            initialMap[ex.exercise_name] = defaultVal;
          }
        });
        setLoggedWeights(initialMap);
      }
    } catch (err) {
      console.error(lang === 'en' ? 'Check-in adaptation error:' : 'Check-in adaptasyon hatası:', err);
      setErrorMsg(t('checkInError'));
    } finally {
      setLoading(false);
    }
  };

  const handleWeightInputChange = (exerciseName, val) => {
    setLoggedWeights((prev) => ({
      ...prev,
      [exerciseName]: val === '' ? '' : parseFloat(val) || 0
    }));
  };

  const handleSaveLoggedWeights = async () => {
    if (!userId) return;
    setSavingWeights(true);
    try {
      const payload = Object.entries(loggedWeights)
        .filter(([_, weight]) => typeof weight === 'number' && weight > 0)
        .map(([name, weight]) => ({
          exerciseName: name,
          loggedWeightKg: weight
        }));

      if (payload.length === 0) {
        alert(t('alertEnterWeight'));
        setSavingWeights(false);
        return;
      }

      await logWorkoutWeights(userId, payload);
      setWeightsSavedSuccess(true);
      setTimeout(() => setWeightsSavedSuccess(false), 4000);
    } catch (err) {
      console.error(lang === 'en' ? 'Failed to log weights:' : 'Ağırlıklar kaydedilemedi:', err);
      alert(t('alertSaveError'));
    } finally {
      setSavingWeights(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-sans">
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2.5">
          <Activity className="w-5 h-5 text-emerald-400" /> {t('dailyBiometricCheckIn')}
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          {t('checkInSubtitle')}
        </p>
      </div>

      {/* Program Yoksa Gösterilecek Uyarı & Hızlı Başlangıç Paneli */}
      {routines.length === 0 && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <span className="font-bold text-slate-200 block">{t('noActiveRoutineTitle')}</span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {t('noActiveRoutineDesc')}
              </p>
            </div>
          </div>
          <Link
            to="/routine-builder"
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all shrink-0 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t('generateRoutineAI')}</span>
          </Link>
        </div>
      )}

      {/* Form Alanı */}
      <form onSubmit={handleSubmitCheckIn} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Antrenman Günü Seçimi */}
          <div className="space-y-2 md:col-span-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Dumbbell className="w-4 h-4 text-emerald-400" /> {t('whichDayWorkout')}
              </span>
              {routines.length === 0 && (
                <span className="text-[10px] text-amber-400 font-normal">
                  {t('defaultPushSessionNote')}
                </span>
              )}
            </label>

            {routines.length > 0 ? (
              <select
                value={selectedRoutineId}
                onChange={(e) => setSelectedRoutineId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                {routines.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.dayName} ({r.exercises?.length || 0} {t('exercisesCount')})
                  </option>
                ))}
              </select>
            ) : (
              <div className="w-full bg-slate-950/60 border border-slate-800/80 rounded-xl px-4 py-2.5 text-xs text-slate-400 flex items-center justify-between">
                <span>{t('defaultPushSession')}</span>
                <Link to="/routine-builder" className="text-emerald-400 hover:underline flex items-center gap-1">
                  <PlusCircle className="w-3 h-3" /> {t('addCustomRoutine')}
                </Link>
              </div>
            )}
          </div>

          {/* Uyku Süresi */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-300 flex items-center gap-2">
                <Moon className="w-4 h-4 text-indigo-400" /> {t('sleepDuration')}
              </span>
              <span className="font-bold text-emerald-400 text-sm">{sleepHours} {t('hoursUnit')}</span>
            </div>
            <input
              type="range"
              min="3"
              max="12"
              step="0.5"
              value={sleepHours}
              onChange={(e) => setSleepHours(e.target.value)}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>

          {/* Enerji Düzeyi */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-300 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" /> {t('energyLevel')} (1 - 10)
              </span>
              <span className="font-bold text-amber-400 text-sm">{energyLevel} / 10</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={energyLevel}
              onChange={(e) => setEnergyLevel(e.target.value)}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>

          {/* Kas Yorgunluğu / DOMS */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-300 flex items-center gap-2">
                <Flame className="w-4 h-4 text-rose-400" /> {t('muscleSoreness')} (1 - 10)
              </span>
              <span className="font-bold text-rose-400 text-sm">{muscleSoreness} / 10</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={muscleSoreness}
              onChange={(e) => setMuscleSoreness(e.target.value)}
              className="w-full accent-rose-500 cursor-pointer"
            />
          </div>

          {/* Anlık Şikayet */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-cyan-400" /> {t('painNotesLabel')}
            </label>
            <input
              type="text"
              placeholder={t('painNotesPlaceholder')}
              value={painNotes}
              onChange={(e) => setPainNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 cursor-pointer"
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>{t('optimizingCoach')}</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>{t('checkInAndAdaptBtn')}</span>
            </>
          )}
        </button>
      </form>

      {errorMsg && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> {errorMsg}
        </div>
      )}

      {/* Adaptasyon Sonuçları */}
      {adaptationResult && (
        <div className="space-y-6 pt-2">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col items-center justify-center text-emerald-400 shrink-0">
                  <span className="text-2xl font-black">{adaptationResult.readiness_score}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">{t('scoreLabel')}</span>
                </div>
                <div>
                  <span className="text-[11px] font-semibold uppercase text-emerald-400 tracking-wider">
                    {t('adaptedRoutineToday')}
                  </span>
                  <h3 className="text-xl font-bold text-slate-100">{routineTitle}</h3>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs bg-slate-950/80 px-4 py-2.5 rounded-xl border border-slate-800">
                <span className="text-slate-400">{t('sleepShort')}: <strong className="text-slate-200">{sleepHours} {t('hoursUnit')}</strong></span>
                <span className="text-slate-600">•</span>
                <span className="text-slate-400">{t('energyShort')}: <strong className="text-amber-400">{energyLevel}/10</strong></span>
                <span className="text-slate-600">•</span>
                <span className="text-slate-400">{t('sorenessShort')}: <strong className="text-rose-400">{muscleSoreness}/10</strong></span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-300 leading-relaxed">
              <span className="font-bold text-emerald-400 block mb-1">{t('coachNote')}:</span>
              {adaptationResult.coach_comment}
            </div>

            {adaptationResult.nutrition_tip && (
              <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-300 leading-relaxed flex items-start gap-2.5">
                <Utensils className="w-4 h-4 shrink-0 text-cyan-400 mt-0.5" />
                <div>
                  <span className="font-bold block mb-0.5">{t('recoveryNutritionTip')}:</span>
                  {adaptationResult.nutrition_tip}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {adaptationResult.modified_exercises?.map((ex, idx) => (
              <div
                key={idx}
                className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs text-slate-500 font-semibold">{t('exerciseItem')} #{idx + 1}</span>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                        ex.action === 'REPLACED'
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                          : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      }`}
                    >
                      {ex.action === 'REPLACED' ? t('actionReplaced') : t('actionOptimized')}
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-slate-100">{ex.exercise_name}</h4>
                  {ex.action === 'REPLACED' && (
                    <p className="text-[11px] text-slate-500 mt-0.5 line-through">
                      {t('originalEx')}: {ex.original_name}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-2 text-xs mt-3">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 font-semibold">
                      {t('setsLabel')}: <strong className="text-slate-100">{ex.sets}</strong>
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 font-semibold">
                      {t('repsLabel')}: <strong className="text-emerald-400">{ex.reps}</strong>
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 font-semibold">
                      {t('rpeLabel')}: <strong className="text-emerald-400">{ex.rpe}</strong>
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs mt-3.5">
                    <div className="flex flex-col">
                      <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">
                        {t('prevWeight')}
                      </span>
                      <span className="text-xs font-bold text-slate-300 mt-1">
                        {ex.previous_weight_kg ? `${ex.previous_weight_kg} kg` : '-'}
                      </span>
                    </div>

                    <div className="flex flex-col border-x border-slate-800 px-2">
                      <span className="text-[9px] text-emerald-400/90 font-bold uppercase tracking-wider">
                        {t('aiTarget')}
                      </span>
                      <span className="text-xs font-bold text-emerald-400 mt-1">
                        {ex.suggested_weight_kg ? `${ex.suggested_weight_kg} kg` : `${ex.previous_weight_kg || '-'} kg`}
                      </span>
                    </div>

                    <div className="flex flex-col">
                      <span className="text-[9px] text-amber-400/90 font-bold uppercase tracking-wider">
                        {t('loggedToday')}
                      </span>
                      <div className="flex items-center gap-1 mt-0.5">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          placeholder={ex.suggested_weight_kg || ex.previous_weight_kg || 'kg'}
                          value={loggedWeights[ex.exercise_name] ?? ''}
                          onChange={(e) => handleWeightInputChange(ex.exercise_name, e.target.value)}
                          className="w-14 bg-slate-900 border border-slate-700 rounded-lg px-1.5 py-0.5 text-center font-bold text-amber-300 text-xs focus:outline-none focus:border-amber-400"
                        />
                        <span className="text-[10px] text-slate-500 font-semibold">kg</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 bg-slate-950/50 p-3 rounded-xl border border-slate-850">
                  <span className="font-semibold text-slate-300">{t('rationaleLabel')}: </span>
                  {ex.reason}
                </div>
              </div>
            ))}
          </div>

          <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
            <div>
              <span className="text-xs font-bold text-slate-200 block">{t('workoutCompletedTitle')}</span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {t('workoutCompletedDesc')}
              </p>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              {weightsSavedSuccess && (
                <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> {t('weightsSavedSuccessMsg')}
                </span>
              )}

              <button
                type="button"
                onClick={handleSaveLoggedWeights}
                disabled={savingWeights}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 cursor-pointer"
              >
                {savingWeights ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>{savingWeights ? t('savingWeightsBtn') : t('finishWorkoutBtn')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}