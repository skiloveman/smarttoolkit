import React, { useMemo, useState } from 'react';
import { Zap } from 'lucide-react';
import { SaveHistoryFn } from '../../types';
import { formatNum } from '../../utils/calculators';
import { usePendingHistoryRestore } from '../../utils/historyRestore';

interface Props {
  onSaveHistory: (title: string, summary: string, details: Record<string, string | number>) => void;
}

const activityOptions = [
  { id: 'sedentary', label: '거의 운동 안함', multiplier: 1.2 },
  { id: 'light', label: '가벼운 운동(주 1-3회)', multiplier: 1.375 },
  { id: 'moderate', label: '보통 운동(주 3-5회)', multiplier: 1.55 },
  { id: 'active', label: '활발한 운동(주 6-7회)', multiplier: 1.725 },
  { id: 'veryActive', label: '매우 강한 활동', multiplier: 1.9 },
] as const;

type ActivityId = (typeof activityOptions)[number]['id'];

export const TdeeCalculator: React.FC<Props> = ({ onSaveHistory }) => {
  const saveHistory = onSaveHistory as SaveHistoryFn;
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [age, setAge] = useState(50);
  const [heightCm, setHeightCm] = useState(170);
  const [weightKg, setWeightKg] = useState(70);
  const [ageText, setAgeText] = useState('50');
  const [heightText, setHeightText] = useState('170');
  const [weightText, setWeightText] = useState('70');
  const [activity, setActivity] = useState<ActivityId>('moderate');
  const [saved, setSaved] = useState(false);

  const { bmr, multiplier, tdee } = useMemo(() => {
    const base = gender === 'male'
      ? 10 * weightKg + 6.25 * heightCm - 5 * age + 5
      : 10 * weightKg + 6.25 * heightCm - 5 * age - 161;

    const currentMultiplier = activityOptions.find((option) => option.id === activity)?.multiplier ?? 1.55;

    return {
      bmr: Math.round(base),
      multiplier: currentMultiplier,
      tdee: Math.round(base * currentMultiplier),
    };
  }, [activity, age, gender, heightCm, weightKg]);

  usePendingHistoryRestore<{
    gender: 'male' | 'female';
    age: number;
    heightCm: number;
    weightKg: number;
    activity: ActivityId;
  }>('tdee', (restored) => {
    setGender(restored.gender);
    setAge(restored.age);
    setHeightCm(restored.heightCm);
    setWeightKg(restored.weightKg);
    setActivity(restored.activity);
    setAgeText(String(restored.age));
    setHeightText(String(restored.heightCm));
    setWeightText(String(restored.weightKg));
  });

  const handleSave = () => {
    saveHistory('TDEE 계산기', `일일 총 에너지 소비량 ${formatNum(tdee)} kcal`, {
      성별: gender === 'male' ? '남성' : '여성',
      나이: `${age}세`,
      신장: `${heightCm}cm`,
      체중: `${weightKg}kg`,
      활동계수: multiplier,
      BMR: `${formatNum(bmr)} kcal`,
      TDEE: `${formatNum(tdee)} kcal`,
    }, {
      gender,
      age,
      heightCm,
      weightKg,
      activity,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-5">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-500" />
          <span>TDEE(일일 총 에너지 소비량) 계산기</span>
        </h3>
        <button onClick={handleSave} className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold whitespace-nowrap" title="계산기록에서 다시 가져올 수 있습니다.">기록저장</button>
      </div>

      <div className="space-y-5">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">성별</label>
          <div className="inline-flex rounded-lg bg-slate-100 dark:bg-slate-800 p-1 text-xs font-semibold">
            <button onClick={() => setGender('male')} className={`px-3 py-1.5 rounded-md transition-all ${gender === 'male' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-slate-500 dark:text-slate-400'}`}>
              남성 ♂
            </button>
            <button onClick={() => setGender('female')} className={`px-3 py-1.5 rounded-md transition-all ${gender === 'female' ? 'bg-white dark:bg-slate-700 text-pink-600 dark:text-pink-400 shadow-xs' : 'text-slate-500 dark:text-slate-400'}`}>
              여성 ♀
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">나이</label>
          <div className="relative">
            <input
              type="number"
              min={1}
              max={120}
              value={ageText}
              onChange={(e) => {
                const raw = e.target.value;
                setAgeText(raw);
                if (raw.trim() === '') return;
                const n = Number(raw);
                if (!Number.isNaN(n)) setAge(Math.max(0, n));
              }}
              onBlur={() => {
                if (ageText.trim() === '') {
                  setAgeText('50');
                  setAge(50);
                }
              }}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm font-bold text-slate-900 dark:text-slate-100 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all pr-10"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">세</span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">신장 (키)</label>
          <div className="relative">
            <input
              type="number"
              min={1}
              max={250}
              value={heightText}
              onChange={(e) => {
                const raw = e.target.value;
                setHeightText(raw);
                if (raw.trim() === '') return;
                const n = Number(raw);
                if (!Number.isNaN(n)) setHeightCm(Math.max(0, n));
              }}
              onBlur={() => {
                if (heightText.trim() === '') {
                  setHeightText('170');
                  setHeightCm(170);
                }
              }}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm font-bold text-slate-900 dark:text-slate-100 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all pr-12"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">cm</span>
          </div>
          <div className="mt-2 flex justify-between gap-2">
            {[155, 165, 172, 180, 188].map((h) => (
              <button
                key={h}
                onClick={() => {
                  setHeightCm(h);
                  setHeightText(String(h));
                }}
                className={`px-2 py-1 rounded text-[11px] font-medium ${heightCm === h ? 'bg-amber-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
              >
                {h}cm
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">체중 (몸무게)</label>
          <div className="relative">
            <input
              type="number"
              min={1}
              max={300}
              value={weightText}
              onChange={(e) => {
                const raw = e.target.value;
                setWeightText(raw);
                if (raw.trim() === '') return;
                const n = Number(raw);
                if (!Number.isNaN(n)) setWeightKg(Math.max(0, n));
              }}
              onBlur={() => {
                if (weightText.trim() === '') {
                  setWeightText('70');
                  setWeightKg(70);
                }
              }}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm font-bold text-slate-900 dark:text-slate-100 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all pr-12"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">kg</span>
          </div>
          <div className="mt-2 flex justify-between gap-2">
            {[50, 60, 70, 80, 90].map((w) => (
              <button
                key={w}
                onClick={() => {
                  setWeightKg(w);
                  setWeightText(String(w));
                }}
                className={`px-2 py-1 rounded text-[11px] font-medium ${weightKg === w ? 'bg-amber-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
              >
                {w}kg
              </button>
            ))}
          </div>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">활동 수준</label>
        <select value={activity} onChange={(e) => setActivity(e.target.value as ActivityId)} className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
          {activityOptions.map((option) => (
            <option key={option.id} value={option.id}>{option.label} ({option.multiplier})</option>
          ))}
        </select>
      </div>

      <div className="rounded-2xl p-4 border border-amber-200 dark:border-amber-900 bg-amber-50/70 dark:bg-amber-950/30 space-y-2">
        <div className="text-xs text-amber-700 dark:text-amber-300 font-semibold">산출 결과</div>
        <div className="text-xs text-amber-800 dark:text-amber-200">BMR: {formatNum(bmr)} kcal</div>
        <div className="text-3xl font-black text-amber-900 dark:text-amber-100">{formatNum(tdee)} kcal</div>
        <div className="text-xs text-amber-800 dark:text-amber-200">하루 유지 칼로리(현재 활동량 기준)</div>
      </div>

      {saved && <div className="text-xs font-semibold text-center text-amber-700 dark:text-amber-300 bg-amber-100/80 dark:bg-amber-950/60 rounded-lg p-2">히스토리에 저장되었습니다.</div>}
    </div>
  );
};
