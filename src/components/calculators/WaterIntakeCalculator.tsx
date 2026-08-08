import React, { useMemo, useState } from 'react';
import { Droplets } from 'lucide-react';
import { SaveHistoryFn } from '../../types';
import { formatNum } from '../../utils/calculators';
import { usePendingHistoryRestore } from '../../utils/historyRestore';

interface Props {
  onSaveHistory: (title: string, summary: string, details: Record<string, string | number>) => void;
}

export const WaterIntakeCalculator: React.FC<Props> = ({ onSaveHistory }) => {
  const saveHistory = onSaveHistory as SaveHistoryFn;
  const [weightKg, setWeightKg] = useState(70);
  const [exerciseMinutes, setExerciseMinutes] = useState(30);
  const [climate, setClimate] = useState<'normal' | 'hot'>('normal');
  const [saved, setSaved] = useState(false);

  const { totalMl, liters } = useMemo(() => {
    const base = weightKg * 33;
    const workout = exerciseMinutes * 12;
    const climateBonus = climate === 'hot' ? 500 : 0;
    const sum = Math.round(base + workout + climateBonus);

    return {
      totalMl: sum,
      liters: Number((sum / 1000).toFixed(2)),
    };
  }, [climate, exerciseMinutes, weightKg]);

  usePendingHistoryRestore<{
    weightKg: number;
    exerciseMinutes: number;
    climate: 'normal' | 'hot';
  }>('waterIntake', (restored) => {
    setWeightKg(restored.weightKg);
    setExerciseMinutes(restored.exerciseMinutes);
    setClimate(restored.climate);
  });

  const handleSave = () => {
    saveHistory('수분 섭취량 계산기', `하루 권장 ${liters}L`, {
      체중: `${weightKg}kg`,
      운동시간: `${exerciseMinutes}분`,
      기후: climate === 'hot' ? '더운 환경' : '일반 환경',
      권장섭취량: `${formatNum(totalMl)}ml (${liters}L)`,
    }, {
      weightKg,
      exerciseMinutes,
      climate,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-5">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Droplets className="w-5 h-5 text-cyan-500" />
          <span>일일 권장 수분 섭취량 계산기</span>
        </h3>
        <button onClick={handleSave} className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold whitespace-nowrap" title="계산기록에서 다시 가져올 수 있습니다.">기록저장</button>
      </div>

      <div className="space-y-5">
        <div>
          <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            <span>체중 (몸무게)</span>
            <span className="font-bold text-cyan-600 dark:text-cyan-400">{weightKg} kg</span>
          </div>
          <input type="range" min="20" max="250" value={weightKg} onChange={(e) => setWeightKg(Number(e.target.value))} className="w-full accent-cyan-500 cursor-pointer" />
          <div className="mt-2 flex justify-between gap-2">
            {[50, 60, 70, 80, 90].map((w) => (
              <button key={w} onClick={() => setWeightKg(w)} className={`px-2 py-1 rounded text-[11px] font-medium ${weightKg === w ? 'bg-cyan-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                {w}kg
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            <span>하루 운동 시간</span>
            <span className="font-bold text-cyan-600 dark:text-cyan-400">{exerciseMinutes}분</span>
          </div>
          <input type="range" min="0" max="600" value={exerciseMinutes} onChange={(e) => setExerciseMinutes(Number(e.target.value))} className="w-full accent-cyan-500 cursor-pointer" />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">기후 환경</label>
        <div className="flex gap-2">
          <button onClick={() => setClimate('normal')} className={`px-3 py-2 rounded-lg text-xs font-semibold ${climate === 'normal' ? 'bg-cyan-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'}`}>
            일반
          </button>
          <button onClick={() => setClimate('hot')} className={`px-3 py-2 rounded-lg text-xs font-semibold ${climate === 'hot' ? 'bg-cyan-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'}`}>
            더운 환경
          </button>
        </div>
      </div>

      <div className="rounded-2xl p-4 border border-cyan-200 dark:border-cyan-900 bg-cyan-50/70 dark:bg-cyan-950/30">
        <div className="text-xs text-cyan-700 dark:text-cyan-300 font-semibold">하루 권장 수분 섭취량</div>
        <div className="text-3xl font-black text-cyan-900 dark:text-cyan-100 mt-1">{liters} L</div>
        <div className="text-xs text-cyan-800 dark:text-cyan-200 mt-2">약 {formatNum(totalMl)} ml (컵 200ml 기준 약 {Math.round(totalMl / 200)}잔)</div>
      </div>

      {saved && <div className="text-xs font-semibold text-center text-cyan-700 dark:text-cyan-300 bg-cyan-100/80 dark:bg-cyan-950/60 rounded-lg p-2">히스토리에 저장되었습니다.</div>}
    </div>
  );
};
