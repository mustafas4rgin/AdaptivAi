import React, { useState, useEffect } from 'react';
import { Dumbbell, Plus, Trash2, Save, RefreshCw, CheckCircle2, Calendar } from 'lucide-react';
import { getUserRoutines, saveUserRoutine } from '../services/api';

const USER_ID = '11111111-1111-1111-1111-111111111111';

const defaultWeeklySplit = [
  {
    dayName: 'İtiş (Push)',
    dayOrder: 1,
    isRestDay: false,
    exercises: [
      { exerciseName: 'Incline Dumbbell Press', sets: 4, targetReps: '8-10', targetRpe: 8.5 },
      { exerciseName: 'Overhead Shoulder Press', sets: 3, targetReps: '10', targetRpe: 8.0 },
      { exerciseName: 'Dips', sets: 3, targetReps: '8-10', targetRpe: 8.0 },
      { exerciseName: 'Lateral Raise', sets: 4, targetReps: '12-15', targetRpe: 9.0 }
    ]
  },
  {
    dayName: 'Çekiş (Pull)',
    dayOrder: 2,
    isRestDay: false,
    exercises: [
      { exerciseName: 'Barbell Row', sets: 4, targetReps: '8-10', targetRpe: 8.5 },
      { exerciseName: 'Lat Pulldown', sets: 3, targetReps: '10-12', targetRpe: 8.0 },
      { exerciseName: 'Face Pull', sets: 4, targetReps: '15', targetRpe: 8.0 },
      { exerciseName: 'Incline Dumbbell Curl', sets: 3, targetReps: '10-12', targetRpe: 8.5 }
    ]
  },
  {
    dayName: 'Bacak (Legs)',
    dayOrder: 3,
    isRestDay: false,
    exercises: [
      { exerciseName: 'Barbell Back Squat', sets: 4, targetReps: '6-8', targetRpe: 8.0 },
      { exerciseName: 'Romanian Deadlift', sets: 3, targetReps: '8-10', targetRpe: 8.0 },
      { exerciseName: 'Leg Press', sets: 3, targetReps: '10-12', targetRpe: 8.5 },
      { exerciseName: 'Standing Calf Raise', sets: 4, targetReps: '12-15', targetRpe: 9.0 }
    ]
  }
];

export default function Routine() {
  const [weeklyDays, setWeeklyDays] = useState(defaultWeeklySplit);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    fetchRoutines();
  }, []);

  const fetchRoutines = async () => {
    setLoading(true);
    try {
      const data = await getUserRoutines(USER_ID);
      if (data && data.length > 0) {
        setWeeklyDays(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNewDay = () => {
    const nextOrder = weeklyDays.length + 1;
    const newDay = {
      dayName: `${nextOrder}. Gün - Yeni Seans`,
      dayOrder: nextOrder,
      isRestDay: false,
      exercises: [{ exerciseName: '', sets: 3, targetReps: '10', targetRpe: 8.0 }]
    };
    setWeeklyDays([...weeklyDays, newDay]);
    setSelectedDayIndex(weeklyDays.length);
  };

  const handleRemoveCurrentDay = (indexToRemove) => {
    if (weeklyDays.length <= 1) {
      alert('En az 1 antrenman günü kalmalıdır.');
      return;
    }
    const updated = weeklyDays.filter((_, i) => i !== indexToRemove);
    setWeeklyDays(updated);
    setSelectedDayIndex(0);
  };

  const activeDay = weeklyDays[selectedDayIndex] || weeklyDays[0];

  const handleAddExercise = () => {
    const updated = [...weeklyDays];
    updated[selectedDayIndex].exercises.push({
      exerciseName: '',
      sets: 3,
      targetReps: '10-12',
      targetRpe: 8.0
    });
    setWeeklyDays(updated);
  };

  const handleExerciseChange = (exIdx, field, val) => {
    const updated = [...weeklyDays];
    updated[selectedDayIndex].exercises[exIdx][field] = val;
    setWeeklyDays(updated);
  };

  const handleRemoveExercise = (exIdx) => {
    const updated = [...weeklyDays];
    updated[selectedDayIndex].exercises.splice(exIdx, 1);
    setWeeklyDays(updated);
  };

  const handleSaveAll = async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      const payload = {
        days: weeklyDays.map((d, dIdx) => ({
          dayName: d.dayName,
          dayOrder: dIdx + 1,
          isRestDay: d.isRestDay || false,
          exercises: (d.exercises || []).map((ex, eIdx) => ({
            exerciseName: ex.exerciseName,
            sets: Number(ex.sets),
            targetReps: ex.targetReps,
            targetRpe: Number(ex.targetRpe),
            orderIndex: eIdx
          }))
        }))
      };
      await saveUserRoutine(USER_ID, payload);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      alert('Haftalık plan kaydedilemedi!');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-400" /> Haftalık Antrenman Split'i
          </h2>
          <p className="text-xs text-slate-400">
            Haftalık programını oluştur (3, 4, 5 veya 7 gün). Günlük check-in yaparken hangi günü yapacağını seçeceksin.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleAddNewDay}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-emerald-400" /> Gün Ekle
          </button>
          <button
            onClick={handleSaveAll}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-800 text-slate-950 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-lg shadow-emerald-500/20"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Kaydediliyor...' : 'Haftalık Planı Kaydet'}
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="flex items-center gap-2 p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-xs text-emerald-400">
          <CheckCircle2 className="w-4 h-4" /> Tüm haftalık split başarıyla kaydedildi!
        </div>
      )}

      {/* Gün Sekmeleri (Tablar) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800">
        {weeklyDays.map((day, idx) => (
          <button
            key={idx}
            onClick={() => setSelectedDayIndex(idx)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              selectedDayIndex === idx
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {day.dayName || `${idx + 1}. Gün`}
          </button>
        ))}
      </div>

      {/* Aktif Günün Detayı */}
      {activeDay && (
        <div className="space-y-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex-1 max-w-sm">
              <label className="block text-[11px] text-slate-400 mb-1">Günün İsmi</label>
              <input
                type="text"
                value={activeDay.dayName}
                onChange={(e) => {
                  const updated = [...weeklyDays];
                  updated[selectedDayIndex].dayName = e.target.value;
                  setWeeklyDays(updated);
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-100 font-semibold focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleAddExercise}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-xl cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-400" /> Bu Güne Hareket Ekle
              </button>
              {weeklyDays.length > 1 && (
                <button
                  onClick={() => handleRemoveCurrentDay(selectedDayIndex)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs rounded-xl cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Günü Sil
                </button>
              )}
            </div>
          </div>

          {/* Egzersiz Listesi */}
          <div className="space-y-3">
            {activeDay.exercises?.map((item, exIdx) => (
              <div 
                key={exIdx}
                className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3 flex-1">
                  <span className="w-6 h-6 rounded-lg bg-slate-800 text-slate-400 font-mono text-xs flex items-center justify-center shrink-0">
                    {exIdx + 1}
                  </span>
                  <input
                    type="text"
                    placeholder="Hareket İsmi (örn: Barbell Back Squat)"
                    value={item.exerciseName}
                    onChange={(e) => handleExerciseChange(exIdx, 'exerciseName', e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 font-medium focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>

                <div className="flex items-center gap-3 text-xs self-end md:self-center">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400">Set:</span>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={item.sets}
                      onChange={(e) => handleExerciseChange(exIdx, 'sets', e.target.value)}
                      className="w-14 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-center text-slate-200 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400">Tekrar:</span>
                    <input
                      type="text"
                      value={item.targetReps}
                      onChange={(e) => handleExerciseChange(exIdx, 'targetReps', e.target.value)}
                      className="w-16 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-center text-slate-200 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400">RPE:</span>
                    <input
                      type="number"
                      step="0.5"
                      min="5"
                      max="10"
                      value={item.targetRpe}
                      onChange={(e) => handleExerciseChange(exIdx, 'targetRpe', e.target.value)}
                      className="w-14 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-center text-emerald-400 font-semibold focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <button
                    onClick={() => handleRemoveExercise(exIdx)}
                    className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}