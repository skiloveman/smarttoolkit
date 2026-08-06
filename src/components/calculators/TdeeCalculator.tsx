import React, { useMemo, useState } from 'react';
import { Zap, BookmarkPlus } from 'lucide-react';
import { DefaultValueInput } from '../DefaultValueInput';
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
  const [age, setAge] = useState(30);
  const [heightCm, setHeightCm] = useState(175);
  const [weightKg, setWeightKg] = useState(70);
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
        <button onClick={handleSave} className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300" title="저장">
          <BookmarkPlus className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">성별</label>
          <div className="flex gap-2">
            <button onClick={() => setGender('male')} className={`px-3 py-2 rounded-lg text-xs font-semibold ${gender === 'male' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'}`}>남성</button>
            <button onClick={() => setGender('female')} className={`px-3 py-2 rounded-lg text-xs font-semibold ${gender === 'female' ? 'bg-pink-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'}`}>여성</button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">나이</label>
          <DefaultValueInput type="number" value={age} defaultValueLabel={30} onValueChange={(value) => setAge(Number(value) || 0)} onBlur={() => setAge((prev) => Math.max(10, Math.min(100, prev || 0)))} className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/60 p-2.5 text-sm font-bold text-slate-800 dark:text-slate-100" />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">신장 (cm)</label>
          <DefaultValueInput type="number" value={heightCm} defaultValueLabel={175} onValueChange={(value) => setHeightCm(Number(value) || 0)} onBlur={() => setHeightCm((prev) => Math.max(100, Math.min(230, prev || 0)))} className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/60 p-2.5 text-sm font-bold text-slate-800 dark:text-slate-100" />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">체중 (kg)</label>
          <DefaultValueInput type="number" value={weightKg} defaultValueLabel={70} onValueChange={(value) => setWeightKg(Number(value) || 0)} onBlur={() => setWeightKg((prev) => Math.max(20, Math.min(250, prev || 0)))} className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/60 p-2.5 text-sm font-bold text-slate-800 dark:text-slate-100" />
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
