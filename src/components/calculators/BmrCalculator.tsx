import React, { useMemo, useState } from 'react';
import { Activity, BookmarkPlus } from 'lucide-react';
import { DefaultValueInput } from '../DefaultValueInput';
import { SaveHistoryFn } from '../../types';
import { formatNum } from '../../utils/calculators';
import { usePendingHistoryRestore } from '../../utils/historyRestore';

interface Props {
  onSaveHistory: (title: string, summary: string, details: Record<string, string | number>) => void;
}

export const BmrCalculator: React.FC<Props> = ({ onSaveHistory }) => {
  const saveHistory = onSaveHistory as SaveHistoryFn;
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [age, setAge] = useState(30);
  const [heightCm, setHeightCm] = useState(175);
  const [weightKg, setWeightKg] = useState(70);
  const [saved, setSaved] = useState(false);

  const bmr = useMemo(() => {
    const value = gender === 'male'
      ? 10 * weightKg + 6.25 * heightCm - 5 * age + 5
      : 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
    return Math.round(value);
  }, [age, gender, heightCm, weightKg]);

  usePendingHistoryRestore<{
    gender: 'male' | 'female';
    age: number;
    heightCm: number;
    weightKg: number;
  }>('bmr', (restored) => {
    setGender(restored.gender);
    setAge(restored.age);
    setHeightCm(restored.heightCm);
    setWeightKg(restored.weightKg);
  });

  const handleSave = () => {
    saveHistory('BMR 계산기', `기초대사량 ${formatNum(bmr)} kcal`, {
      성별: gender === 'male' ? '남성' : '여성',
      나이: `${age}세`,
      신장: `${heightCm}cm`,
      체중: `${weightKg}kg`,
      BMR: `${formatNum(bmr)} kcal`,
    }, {
      gender,
      age,
      heightCm,
      weightKg,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-5">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Activity className="w-5 h-5 text-emerald-500" />
          <span>BMR(기초대사량) 계산기</span>
        </h3>
        <button onClick={handleSave} className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300" title="저장">
          <BookmarkPlus className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">성별</label>
          <div className="flex gap-2">
            <button onClick={() => setGender('male')} className={`px-3 py-2 rounded-lg text-xs font-semibold ${gender === 'male' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'}`}>
              남성
            </button>
            <button onClick={() => setGender('female')} className={`px-3 py-2 rounded-lg text-xs font-semibold ${gender === 'female' ? 'bg-pink-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'}`}>
              여성
            </button>
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

      <div className="rounded-2xl p-4 border border-emerald-200 dark:border-emerald-900 bg-emerald-50/70 dark:bg-emerald-950/30">
        <div className="text-xs text-emerald-700 dark:text-emerald-300 font-semibold">기초대사량 (BMR)</div>
        <div className="text-3xl font-black text-emerald-900 dark:text-emerald-100 mt-1">{formatNum(bmr)} kcal</div>
        <p className="text-xs text-emerald-800 dark:text-emerald-200 mt-2">아무 활동이 없어도 생명 유지를 위해 필요한 하루 최소 에너지입니다.</p>
      </div>

      {saved && <div className="text-xs font-semibold text-center text-emerald-700 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-950/60 rounded-lg p-2">히스토리에 저장되었습니다.</div>}
    </div>
  );
};
