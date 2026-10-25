import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Check, ChevronRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import api from '../services/api';

export default function RoutineBuilder({ user }) {
  const { lang, t } = useLanguage();
  const navigate = useNavigate();
  const [days, setDays] = useState(4);
  const [focusArea, setFocusArea] = useState('Hypertrophy (Upper/Lower Split)');
  const [equipment, setEquipment] = useState('Full Gym');
  const [extraNotes, setExtraNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    setGeneratedPlan(null);
    try {
      const res = await api.post(`/coach/generate-routine?userId=${user.id}`, {
        daysPerWeek: days,
        focusArea,
        equipmentType: equipment,
        extraNotes,
        language: lang
      });
      setGeneratedPlan(res.data);
    } catch (err) {
      console.error('Program oluşturulamadı:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePlan = async () => {
    if (!generatedPlan) return;
    setSaving(true);
    try {
      await api.post(`/coach/save-weekly-plan?userId=${user.id}`, generatedPlan);
      navigate('/routine');
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
        <h2 className="text-xl font-black text-white">{t('builderTitle')}</h2>
        <p className="text-xs text-slate-400 mt-0.5">{t('builderSubtitle')}</p>
      </div>

      <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-2">{t('daysCount')}</label>
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value={3}>3 {lang === 'en' ? 'Days' : 'Gün'} (Full Body)</option>
              <option value={4}>4 {lang === 'en' ? 'Days' : 'Gün'} (Upper / Lower)</option>
              <option value={5}>5 {lang === 'en' ? 'Days' : 'Gün'} (Push / Pull / Legs / Upper / Lower)</option>
              <option value={6}>6 {lang === 'en' ? 'Days' : 'Gün'} (PPL × 2)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-2">{t('focusArea')}</label>
            <input
              type="text"
              value={focusArea}
              onChange={(e) => setFocusArea(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-2">{t('equipmentType')}</label>
            <select
              value={equipment}
              onChange={(e) => setEquipment(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="Full Gym">{t('fullGym')}</option>
              <option value="Dumbbells Only">{t('homeDumbbells')}</option>
              <option value="Calisthenics">{t('calisthenics')}</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-300 mb-2">{t('extraNotesLabel')}</label>
          <input
            type="text"
            value={extraNotes}
            onChange={(e) => setExtraNotes(e.target.value)}
            placeholder={t('extraNotesPlaceholder')}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <button
          type="button"
          onClick={handleGenerate}
          disabled={loading}
          className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <Sparkles className="w-4 h-4" />
          {loading ? t('generatingBtn') : t('generateBtn')}
        </button>
      </div>

      {generatedPlan && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {generatedPlan.days?.map((day, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="font-bold text-slate-200 text-sm">{day.dayName}</span>
                  <span className="text-[10px] text-slate-500 font-mono">Day {day.dayOrder}</span>
                </div>
                <div className="space-y-1.5">
                  {day.exercises?.map((ex, exIdx) => (
                    <div key={exIdx} className="text-xs flex justify-between text-slate-400">
                      <span>{ex.exerciseName}</span>
                      <span className="font-mono text-slate-500">
                        {ex.sets} × {ex.targetReps}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleSavePlan}
            disabled={saving}
            className="w-full py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            {t('saveRoutineBtn')}
          </button>
        </div>
      )}
    </div>
  );
}