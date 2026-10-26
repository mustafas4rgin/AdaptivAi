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
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
          <Sparkles className="h-3.5 w-3.5" />
          <span>{lang === 'en' ? 'AI Architecture' : 'Yapay Zeka Program Mimarı'}</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-100">
          {lang === 'en' ? 'Optimal Split Generator' : 'Kişiselleştirilmiş Antrenman Üretici'}
        </h1>
        <p className="text-sm text-zinc-400">
          {lang === 'en'
            ? 'Formulate high-performance, periodized workout structures customized to your equipment and biomechanical needs.'
            : 'Mevcut ekipmanlarına, gün sayına ve hedeflerine göre hipertrofi odaklı bilimsel antrenman programı üret.'}
        </p>
      </div>

      {/* Form Section */}
      <form onSubmit={handleGenerate} className="grid grid-cols-1 gap-6 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 backdrop-blur-md lg:grid-cols-2">
        {/* Days Per Week */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-zinc-400">
            <Calendar className="h-4 w-4 text-emerald-400" />
            {lang === 'en' ? 'Frequency (Days / Week)' : 'Haftalık Gün Sayısı'}
          </label>
          <div className="grid grid-cols-5 gap-2">
            {[2, 3, 4, 5, 6].map((day) => (
              <button
                type="button"
                key={day}
                onClick={() => setDaysPerWeek(day)}
                className={`flex h-11 items-center justify-center rounded-xl border text-sm font-semibold transition ${
                  daysPerWeek === day
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                    : 'border-zinc-800 bg-zinc-950/60 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                {day}
              </button>
            ))}
          </div>
        </div>

        {/* Focus Area */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-zinc-400">
            <Flame className="h-4 w-4 text-amber-400" />
            {lang === 'en' ? 'Target Focus Area' : 'Öncelikli Odak Bölgesi'}
          </label>
          <select
            value={focusArea}
            onChange={(e) => setFocusArea(e.target.value)}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-950/80 px-4 py-2.5 text-sm text-zinc-200 outline-none transition focus:border-emerald-500"
          >
            {FOCUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-zinc-900 text-zinc-200">
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Equipment Type */}
        <div className="space-y-2 lg:col-span-2">
          <label className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-zinc-400">
            <Dumbbell className="h-4 w-4 text-blue-400" />
            {lang === 'en' ? 'Available Equipment' : 'Kullanılabilir Ekipman'}
          </label>
          <select
            value={equipmentType}
            onChange={(e) => setEquipmentType(e.target.value)}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-950/80 px-4 py-2.5 text-sm text-zinc-200 outline-none transition focus:border-emerald-500"
          >
            {EQUIPMENT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-zinc-900 text-zinc-200">
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Extra Notes */}
        <div className="space-y-2 lg:col-span-2">
          <label className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-zinc-400">
            <Layers className="h-4 w-4 text-purple-400" />
            {lang === 'en' ? 'Specific Notes or Weak Points (Optional)' : 'Özel Notlar veya Öncelikler (İsteğe Bağlı)'}
          </label>
          <textarea
            rows={2}
            value={extraNotes}
            onChange={(e) => setExtraNotes(e.target.value)}
            placeholder={
              lang === 'en'
                ? 'e.g. Include rear delt flyes, avoid barbell overhead press due to shoulder pain...'
                : 'Örn: Arka omuz odaklı olsun, bel hassasiyetim nedeniyle barbell deadlift yerine makine varyasyonları tercih edilsin...'
            }
            className="w-full rounded-xl border border-zinc-800 bg-zinc-950/80 p-3 text-sm text-zinc-200 placeholder-zinc-600 outline-none transition focus:border-emerald-500"
          />
        </div>

        {/* Error Feedback */}
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400 lg:col-span-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Submit Button */}
        <div className="pt-2 lg:col-span-2">
          <button
            type="submit"
            disabled={generating}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 font-semibold text-zinc-950 transition hover:bg-emerald-400 disabled:opacity-50"
          >
            {generating ? (
              <>
                <RefreshCw className="h-5 w-5 animate-spin" />
                <span>{lang === 'en' ? 'Synthesizing Split...' : 'Program Hesaplanıyor ve Optimize Ediliyor...'}</span>
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                <span>{lang === 'en' ? 'Generate Optimal Plan' : 'Optimal Antrenman Planını Üret'}</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Generated Routine Preview */}
      {generatedPlan && (
        <div className="space-y-6 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 backdrop-blur-md">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1 space-y-1">
              <label className="text-xs font-medium uppercase tracking-wider text-zinc-400">
                {lang === 'en' ? 'Program Title' : 'Program Adı'}
              </label>
              <input
                type="text"
                value={programName}
                onChange={(e) => setProgramName(e.target.value)}
                className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-2 text-base font-semibold text-zinc-100 outline-none focus:border-emerald-500"
              />
            </div>
            <button
              onClick={handleApplyRoutine}
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-6 py-2.5 font-semibold text-zinc-950 transition hover:bg-emerald-400 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>{lang === 'en' ? 'Applying...' : 'Kaydediliyor...'}</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>{lang === 'en' ? 'Save & Set Active' : 'Kaydet ve Aktif Yap'}</span>
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {(generatedPlan.days || generatedPlan.Days || []).map((day, idx) => (
              <div
                key={idx}
                className="flex flex-col justify-between rounded-xl border border-zinc-800/80 bg-zinc-950/40 p-4"
              >
                <div>
                  <div className="mb-3 flex items-center justify-between border-b border-zinc-800 pb-2">
                    <span className="font-semibold text-zinc-200">{day.dayName || day.DayName}</span>
                    <span className="text-xs text-zinc-500">#{day.dayOrder || day.DayOrder || idx + 1}</span>
                  </div>

                  {day.isRestDay || day.IsRestDay ? (
                    <div className="py-6 text-center text-xs text-zinc-500">
                      {lang === 'en' ? 'Scheduled Rest & Recovery Day' : 'Planlanmış Toparlanma (Rest) Günü'}
                    </div>
                  ) : (
                    <ul className="space-y-2.5">
                      {(day.exercises || day.Exercises || []).map((ex, exIdx) => (
                        <li key={exIdx} className="text-xs">
                          <div className="flex items-center justify-between font-medium text-zinc-300">
                            <span>{ex.exerciseName || ex.ExerciseName}</span>
                            <span className="text-emerald-400">
                              {(ex.targetWeightKg || ex.TargetWeightKg) > 0 ? `${ex.targetWeightKg || ex.TargetWeightKg} kg` : ''}
                            </span>
                          </div>
                          <div className="mt-0.5 flex gap-2 text-[11px] text-zinc-500">
                            <span>{ex.sets || ex.Sets} {lang === 'en' ? 'sets' : 'set'}</span>
                            <span>•</span>
                            <span>{ex.targetReps || ex.TargetReps} {lang === 'en' ? 'reps' : 'tekrar'}</span>
                            {(ex.targetRpe || ex.TargetRpe) && (
                              <>
                                <span>•</span>
                                <span>RPE {ex.targetRpe || ex.TargetRpe}</span>
                              </>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}