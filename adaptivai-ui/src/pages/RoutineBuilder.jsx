import React, { useState, useMemo } from 'react';
import { 
  Sparkles, 
  Dumbbell, 
  Calendar, 
  ShieldAlert, 
  RefreshCw, 
  Save, 
  Layers, 
  Flame,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { generateOptimalRoutine, createProgram } from '../services/api';

export default function RoutineBuilder() {
  const { lang, t } = useLanguage();
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // ID'yi context veya fallback olarak localStorage üzerinden sayısal garantiye al
  const currentUserId = useMemo(() => {
    if (user?.id) return Number(user.id);
    if (user?.userId) return Number(user.userId);
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        const parsed = JSON.parse(stored);
        const resolvedId = parsed.id || parsed.userId;
        return resolvedId ? Number(resolvedId) : null;
      }
    } catch {
      // JSON parse hatası durumunda null döner
    }
    return null;
  }, [user]);

  const FOCUS_OPTIONS = useMemo(() => [
    { value: 'Maksimum Hipertrofi (Dengeli Tüm Vücut)', label: t('focusMaxHypertrophy') || 'Maksimum Hipertrofi (Dengeli Tüm Vücut)' },
    { value: 'Üst Gövde & Omuz Öncelikli (V-Taper)', label: t('focusUpperShoulders') || 'Üst Gövde & Omuz Öncelikli (V-Taper)' },
    { value: 'Kol & Omuz Hipertrofisi', label: t('focusArmsShoulders') || 'Kol & Omuz Hipertrofisi' },
    { value: 'Alt Gövde & Güç (Squat/Deadlift Odaklı)', label: t('focusLowerStrength') || 'Alt Gövde & Güç (Squat/Deadlift Odaklı)' },
    { value: 'Postür Düzeltme & Eklem Dostu Hipertrofi', label: t('focusPostureJointFriendly') || 'Postür Düzeltme & Eklem Dostu Hipertrofi' }
  ], [t]);

  const EQUIPMENT_OPTIONS = useMemo(() => [
    { value: 'Tam Donanımlı Ticari Salon (Makineler + Serbest Ağırlık)', label: t('equipFullGym') || 'Tam Donanımlı Ticari Salon (Makineler + Serbest Ağırlık)' },
    { value: 'Dumbbell & Ayarlanabilir Sehpa (Ev/Minimalist)', label: t('equipDumbbellBench') || 'Dumbbell & Ayarlanabilir Sehpa (Ev/Minimalist)' },
    { value: 'Sadece Serbest Ağırlıklar (Barbell + Dumbbell)', label: t('equipFreeWeightsOnly') || 'Sadece Serbest Ağırlıklar (Barbell + Dumbbell)' },
    { value: 'Kablo ve Makine Ağırlıklı (Eklem Dostu)', label: t('equipCableMachineFocus') || 'Kablo ve Makine Ağırlıklı (Eklem Dostu)' }
  ], [t]);

  const [daysPerWeek, setDaysPerWeek] = useState(4);
  const [focusArea, setFocusArea] = useState('Maksimum Hipertrofi (Dengeli Tüm Vücut)');
  const [equipmentType, setEquipmentType] = useState('Tam Donanımlı Ticari Salon (Makineler + Serbest Ağırlık)');
  const [extraNotes, setExtraNotes] = useState('');

  const [generating, setGenerating] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState(null);
  const [programName, setProgramName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 text-zinc-400">
          <RefreshCw className="h-5 w-5 animate-spin text-emerald-500" />
          <span>{lang === 'en' ? 'Authenticating...' : 'Oturum bilgisi yükleniyor...'}</span>
        </div>
      </div>
    );
  }

  if (!currentUserId) {
    return (
      <div className="mx-auto mt-12 max-w-md rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8 text-center backdrop-blur-md">
        <ShieldAlert className="mx-auto mb-4 h-12 w-12 text-amber-500" />
        <h3 className="mb-2 text-lg font-semibold text-zinc-100">
          {lang === 'en' ? 'Session Required' : 'Oturum Açılması Gerekiyor'}
        </h3>
        <p className="mb-6 text-sm text-zinc-400">
          {lang === 'en' 
            ? 'Please login to generate and manage custom training programs.' 
            : 'Antrenman programı oluşturmak ve yönetmek için lütfen önce giriş yapın.'}
        </p>
        <button
          onClick={() => navigate('/login')}
          className="w-full rounded-xl bg-emerald-500 px-4 py-2.5 font-medium text-zinc-950 transition hover:bg-emerald-400"
        >
          {lang === 'en' ? 'Go to Login' : 'Giriş Yap'}
        </button>
      </div>
    );
  }

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!currentUserId) return;

    setGenerating(true);
    setError(null);

    try {
      const payload = {
        userId: currentUserId,
        daysPerWeek: parseInt(daysPerWeek, 10),
        focusArea,
        equipmentType,
        extraNotes: extraNotes.trim(),
        lang: lang || 'tr'
      };

      const result = await generateOptimalRoutine(payload);
      setGeneratedPlan(result);

      const currentFocusObj = FOCUS_OPTIONS.find((f) => f.value === focusArea);
      const focusLabel = (currentFocusObj?.label || focusArea).split('(')[0].trim();
      const defaultTitle = lang === 'en' 
        ? `${daysPerWeek} Day Split - ${focusLabel}`
        : `${daysPerWeek} Günlük Bölünme - ${focusLabel}`;

      setProgramName(defaultTitle);
    } catch (err) {
      console.error(lang === 'en' ? 'Program generation error:' : 'Program üretim hatası:', err);
      setError(
        err.response?.data?.message || 
        (lang === 'en' ? 'Failed to generate workout plan. Please try again.' : 'Program oluşturulurken bir hata meydana geldi. Lütfen tekrar deneyin.')
      );
    } finally {
      setGenerating(false);
    }
  };

  const handleApplyRoutine = async () => {
    if (!currentUserId || !generatedPlan) return;
    setSaving(true);
    try {
      const fallbackTitle = lang === 'en'
        ? `${daysPerWeek} Day Custom Routine`
        : `${daysPerWeek} Günlük Kişisel Program`;

      await createProgram(currentUserId, {
        name: programName.trim() || fallbackTitle,
        description: `${focusArea} | ${equipmentType}`,
        setAsActive: true,
        plan: generatedPlan
      });
      navigate('/routine');
    } catch (err) {
      console.error(lang === 'en' ? 'Failed to save program:' : 'Program kaydedilemedi:', err);
      alert(lang === 'en' ? 'Failed to save routine.' : 'Program kaydedilirken bir hata oluştu.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 font-sans">
      <div>
        <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2.5">
          <Sparkles className="w-6 h-6 text-emerald-400" /> {t('routineBuilderTitle')}
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          {t('routineBuilderSubtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Sol Panel: Tercih Anketi */}
        <form
          onSubmit={handleGenerate}
          className="lg:col-span-5 bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6"
        >
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-200 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-400" /> {t('weeklyWorkoutDays')}
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[3, 4, 5, 6].map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => setDaysPerWeek(days)}
                  className={`py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    daysPerWeek === days
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {days} {t('daysUnit')}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-200 flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-400" /> {t('trainingFocusPriority')}
            </label>
            <select
              value={focusArea}
              onChange={(e) => setFocusArea(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              {FOCUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-200 flex items-center gap-2">
              <Dumbbell className="w-4 h-4 text-teal-400" /> {t('equipmentAvailability')}
            </label>
            <select
              value={equipmentType}
              onChange={(e) => setEquipmentType(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              {EQUIPMENT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-200">
              {t('extraNotesLabel')}
            </label>
            <textarea
              rows={3}
              value={extraNotes}
              onChange={(e) => setExtraNotes(e.target.value)}
              placeholder={t('extraNotesPlaceholder')}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={generating}
            className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {generating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>{t('designingSplit')}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>{t('createMyCustomPlan')}</span>
              </>
            )}
          </button>
        </form>

        {/* Sağ Panel: Üretilen Plan Önizlemesi */}
        <div className="lg:col-span-7 space-y-5">
          {!generatedPlan ? (
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-12 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <Layers className="w-7 h-7" />
              </div>
              <div className="space-y-1.5 max-w-md mx-auto">
                <h3 className="text-sm font-bold text-slate-200">
                  {t('waitingCustomSplitTitle')}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {t('waitingCustomSplitDesc')}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                    {t('programNameLabel')}
                  </label>
                  <input
                    type="text"
                    value={programName}
                    onChange={(e) => setProgramName(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-100 focus:outline-none focus:border-emerald-500 w-full max-w-xs"
                    placeholder={t('programNamePlaceholder')}
                  />
                </div>

                <button
                  type="button"
                  onClick={handleApplyRoutine}
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50 shrink-0"
                >
                  {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>{saving ? t('savingProgramBtn') : t('saveAndSetActiveBtn')}</span>
                </button>
              </div>

              {/* Günler Listesi */}
              <div className="space-y-4">
                {generatedPlan.days?.map((day, dIdx) => (
                  <div
                    key={dIdx}
                    className="p-5 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-xs font-bold">
                          {dIdx + 1}
                        </span>
                        <h4 className="text-sm font-bold text-slate-200">{day.dayName}</h4>
                      </div>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {day.exercises?.length || 0} {t('exercisesCount')}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                      {day.exercises?.map((ex, exIdx) => (
                        <div
                          key={exIdx}
                          className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs flex flex-col justify-between"
                        >
                          <span className="font-bold text-slate-200 truncate mb-1">
                            {exIdx + 1}. {ex.exerciseName}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {ex.sets} {t('setsShort')} × {ex.targetReps} @ RPE {ex.targetRpe}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}