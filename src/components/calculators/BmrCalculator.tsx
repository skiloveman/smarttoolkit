import React, { useMemo, useState } from 'react';
import { Activity } from 'lucide-react';
import { SaveHistoryFn } from '../../types';
import { formatNum } from '../../utils/calculators';
import { usePendingHistoryRestore } from '../../utils/historyRestore';

interface Props {
  onSaveHistory: (title: string, summary: string, details: Record<string, string | number>) => void;
}

export const BmrCalculator: React.FC<Props> = ({ onSaveHistory }) => {
  const saveHistory = onSaveHistory as SaveHistoryFn;
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [age, setAge] = useState(50);
  const [heightCm, setHeightCm] = useState(170);
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
          <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            <span>나이</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">{age}세</span>
          </div>
          <input type="range" min="10" max="100" value={age} onChange={(e) => setAge(Number(e.target.value))} className="w-full accent-emerald-500 cursor-pointer" />
        </div>

        <div>
          <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            <span>신장 (키)</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">{heightCm} cm</span>
          </div>
          <input type="range" min="100" max="230" value={heightCm} onChange={(e) => setHeightCm(Number(e.target.value))} className="w-full accent-emerald-500 cursor-pointer" />
          <div className="mt-2 flex justify-between gap-2">
            {[155, 165, 172, 180, 188].map((h) => (
              <button key={h} onClick={() => setHeightCm(h)} className={`px-2 py-1 rounded text-[11px] font-medium ${heightCm === h ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                {h}cm
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            <span>체중 (몸무게)</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">{weightKg} kg</span>
          </div>
          <input type="range" min="20" max="250" value={weightKg} onChange={(e) => setWeightKg(Number(e.target.value))} className="w-full accent-emerald-500 cursor-pointer" />
          <div className="mt-2 flex justify-between gap-2">
            {[50, 60, 70, 80, 90].map((w) => (
              <button key={w} onClick={() => setWeightKg(w)} className={`px-2 py-1 rounded text-[11px] font-medium ${weightKg === w ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                {w}kg
              </button>
            ))}
          </div>
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
