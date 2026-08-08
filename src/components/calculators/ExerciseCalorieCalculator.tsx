import React, { useMemo, useState } from 'react';
import { Dumbbell } from 'lucide-react';
import { SaveHistoryFn } from '../../types';
import { formatNum } from '../../utils/calculators';
import { usePendingHistoryRestore } from '../../utils/historyRestore';

interface Props {
  onSaveHistory: (title: string, summary: string, details: Record<string, string | number>) => void;
}

const exercisePresets = [
  { id: 'walk', label: '걷기 (보통, 4.8km/h)', met: 3.5 },
  { id: 'walkFast', label: '걷기 (빠르게, 6.4km/h)', met: 5.0 },
  { id: 'jog', label: '조깅 (8km/h)', met: 8.3 },
  { id: 'run', label: '달리기 (11km/h)', met: 11.0 },
  { id: 'cycle', label: '자전거 (보통)', met: 6.8 },
  { id: 'cycleFast', label: '자전거 (빠르게)', met: 10.0 },
  { id: 'swim', label: '수영 (자유형, 보통)', met: 7.0 },
  { id: 'hike', label: '등산', met: 6.0 },
  { id: 'jumpRope', label: '줄넘기', met: 10.0 },
  { id: 'yoga', label: '요가', met: 2.5 },
  { id: 'weight', label: '웨이트 트레이닝', met: 5.0 },
  { id: 'stairs', label: '계단 오르기', met: 8.0 },
] as const;

type ExerciseId = (typeof exercisePresets)[number]['id'];

export const ExerciseCalorieCalculator: React.FC<Props> = ({ onSaveHistory }) => {
  const saveHistory = onSaveHistory as SaveHistoryFn;
  const [weightKg, setWeightKg] = useState(65);
  const [exerciseId, setExerciseId] = useState<ExerciseId>('jog');
  const [minutes, setMinutes] = useState(30);
  const [saved, setSaved] = useState(false);

  const exercise = exercisePresets.find((e) => e.id === exerciseId) ?? exercisePresets[2];

  const caloriesBurned = useMemo(() => {
    return Math.round(((exercise.met * 3.5 * weightKg) / 200) * minutes);
  }, [exercise, weightKg, minutes]);

  usePendingHistoryRestore<{ weightKg: number; exerciseId: ExerciseId; minutes: number }>('exerciseCalorie', (restored) => {
    setWeightKg(restored.weightKg);
    setExerciseId(restored.exerciseId);
    setMinutes(restored.minutes);
  });

  const handleSave = () => {
    saveHistory('운동별 칼로리 소모량 계산기', `${exercise.label} ${minutes}분 = ${formatNum(caloriesBurned)}kcal`, {
      체중: `${weightKg}kg`,
      운동종류: exercise.label,
      운동시간: `${minutes}분`,
      MET: exercise.met,
      소모칼로리: `${formatNum(caloriesBurned)}kcal`,
    }, { weightKg, exerciseId, minutes });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-5">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Dumbbell className="w-5 h-5 text-emerald-500" />
          <span>운동별 칼로리 소모량 계산기</span>
        </h3>
        <button onClick={handleSave} className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold whitespace-nowrap" title="계산기록에서 다시 가져올 수 있습니다.">기록저장</button>
      </div>

      <div>
        <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
          <span>체중</span>
          <span className="font-bold text-emerald-600 dark:text-emerald-400">{weightKg}kg</span>
        </div>
        <input type="range" min="30" max="150" value={weightKg} onChange={(e) => setWeightKg(Number(e.target.value))} className="w-full accent-emerald-600 cursor-pointer" />
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">운동 종류</label>
        <div className="flex flex-wrap gap-2">
          {exercisePresets.map((e) => (
            <button
              key={e.id}
              onClick={() => setExerciseId(e.id)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold ${exerciseId === e.id ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
            >
              {e.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
          <span>운동 시간</span>
          <span className="font-bold text-emerald-600 dark:text-emerald-400">{minutes}분</span>
        </div>
        <input type="range" min="5" max="180" step="5" value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} className="w-full accent-emerald-600 cursor-pointer" />
      </div>

      <div className="rounded-2xl p-4 border border-emerald-200 dark:border-emerald-900 bg-emerald-50/70 dark:bg-emerald-950/30 space-y-2">
        <div className="text-xs text-emerald-700 dark:text-emerald-300 font-semibold">예상 소모 칼로리</div>
        <div className="text-3xl font-black text-emerald-900 dark:text-emerald-100">{formatNum(caloriesBurned)}kcal</div>
        <div className="text-xs text-emerald-800 dark:text-emerald-200">{exercise.label} · MET {exercise.met} 기준 (체중 × MET × 3.5 ÷ 200 × 운동시간)</div>
      </div>

      {saved && <div className="text-xs font-semibold text-center text-emerald-700 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-950/60 rounded-lg p-2">히스토리에 저장되었습니다.</div>}
    </div>
  );
};
