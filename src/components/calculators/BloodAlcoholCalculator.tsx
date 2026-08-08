import React, { useMemo, useState } from 'react';
import { Wine } from 'lucide-react';
import { SaveHistoryFn } from '../../types';
import { usePendingHistoryRestore } from '../../utils/historyRestore';

interface Props {
  onSaveHistory: (title: string, summary: string, details: Record<string, string | number>) => void;
}

const drinkPresets = [
  { id: 'soju', label: '소주', ml: 50, degree: 16.5 },
  { id: 'beer', label: '맥주', ml: 200, degree: 4.5 },
  { id: 'makgeolli', label: '막걸리', ml: 200, degree: 6 },
  { id: 'wine', label: '와인', ml: 150, degree: 13 },
  { id: 'whiskey', label: '양주', ml: 30, degree: 40 },
] as const;

type DrinkId = (typeof drinkPresets)[number]['id'];

export const BloodAlcoholCalculator: React.FC<Props> = ({ onSaveHistory }) => {
  const saveHistory = onSaveHistory as SaveHistoryFn;
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [weightKg, setWeightKg] = useState(70);
  const [drinkId, setDrinkId] = useState<DrinkId>('soju');
  const [glasses, setGlasses] = useState(2);
  const [saved, setSaved] = useState(false);

  const drink = drinkPresets.find((d) => d.id === drinkId) ?? drinkPresets[0];

  const { bacPercent, hoursToSober, level, levelColor, soberAt } = useMemo(() => {
    const totalMl = drink.ml * glasses;
    const alcoholGrams = totalMl * (drink.degree / 100) * 0.8;
    const distributionRatio = gender === 'male' ? 0.68 : 0.55;
    const bacPermille = alcoholGrams / (weightKg * distributionRatio);
    const bac = bacPermille / 10;
    const hours = bac / 0.015;

    let currentLevel = '정상 범위';
    let color = '#10b981';
    if (bac >= 0.08) {
      currentLevel = '면허취소 수준 (매우 위험)';
      color = '#dc2626';
    } else if (bac >= 0.03) {
      currentLevel = '면허정지 수준 (위험)';
      color = '#f59e0b';
    } else if (bac > 0) {
      currentLevel = '체내 알코올 잔존';
      color = '#3b82f6';
    }

    const now = new Date();
    const soberDate = new Date(now.getTime() + hours * 3600 * 1000);
    const soberLabel = `${soberDate.getMonth() + 1}/${soberDate.getDate()} ${String(soberDate.getHours()).padStart(2, '0')}:${String(soberDate.getMinutes()).padStart(2, '0')}`;

    return {
      bacPercent: Number(bac.toFixed(3)),
      hoursToSober: Number(hours.toFixed(1)),
      level: currentLevel,
      levelColor: color,
      soberAt: soberLabel,
    };
  }, [drink, glasses, gender, weightKg]);

  usePendingHistoryRestore<{
    gender: 'male' | 'female';
    weightKg: number;
    drinkId: DrinkId;
    glasses: number;
  }>('bloodAlcohol', (restored) => {
    setGender(restored.gender);
    setWeightKg(restored.weightKg);
    setDrinkId(restored.drinkId);
    setGlasses(restored.glasses);
  });

  const handleSave = () => {
    saveHistory('음주 알코올분해시간 계산기', `예상 BAC ${bacPercent}% / 완전분해 약 ${hoursToSober}시간 후`, {
      성별: gender === 'male' ? '남성' : '여성',
      체중: `${weightKg}kg`,
      음주: `${drink.label} x ${glasses}잔`,
      예상혈중알코올농도: `${bacPercent}%`,
      판정: level,
      완전분해예상시각: soberAt,
    }, {
      gender,
      weightKg,
      drinkId,
      glasses,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-5">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Wine className="w-5 h-5 text-purple-500" />
          <span>음주 알코올분해시간 계산기</span>
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
            <span>체중 (몸무게)</span>
            <span className="font-bold text-purple-600 dark:text-purple-400">{weightKg} kg</span>
          </div>
          <input type="range" min="30" max="150" value={weightKg} onChange={(e) => setWeightKg(Number(e.target.value))} className="w-full accent-purple-500 cursor-pointer" />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">주종 선택</label>
          <div className="flex flex-wrap gap-2">
            {drinkPresets.map((d) => (
              <button
                key={d.id}
                onClick={() => setDrinkId(d.id)}
                className={`px-3 py-2 rounded-lg text-xs font-semibold ${drinkId === d.id ? 'bg-purple-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
              >
                {d.label}
              </button>
            ))}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">{drink.ml}ml, 도수 {drink.degree}% 기준</div>
        </div>

        <div>
          <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            <span>마신 잔 수</span>
            <span className="font-bold text-purple-600 dark:text-purple-400">{glasses}잔</span>
          </div>
          <input type="range" min="1" max="15" value={glasses} onChange={(e) => setGlasses(Number(e.target.value))} className="w-full accent-purple-500 cursor-pointer" />
        </div>
      </div>

      <div className="rounded-2xl p-4 border border-purple-200 dark:border-purple-900 bg-purple-50/70 dark:bg-purple-950/30 space-y-2">
        <div className="text-xs text-purple-700 dark:text-purple-300 font-semibold">예상 최고 혈중알코올농도(BAC)</div>
        <div className="flex items-baseline gap-2">
          <div className="text-3xl font-black text-purple-900 dark:text-purple-100">{bacPercent}%</div>
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold text-white" style={{ backgroundColor: levelColor }}>{level}</span>
        </div>
        <div className="text-xs text-purple-800 dark:text-purple-200">
          완전히 분해되기까지 약 <strong>{hoursToSober}시간</strong> (예상 시각 {soberAt})
        </div>
        <p className="text-[11px] text-purple-700/80 dark:text-purple-300/80 leading-relaxed pt-1">
          체질·공복 여부·건강 상태에 따라 개인차가 크며 법적 효력이 없는 추정치입니다. 술을 마신 뒤에는 절대 운전하지 마세요.
        </p>
      </div>

      {saved && <div className="text-xs font-semibold text-center text-purple-700 dark:text-purple-300 bg-purple-100/80 dark:bg-purple-950/60 rounded-lg p-2">히스토리에 저장되었습니다.</div>}
    </div>
  );
};
