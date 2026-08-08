import React, { useMemo, useState } from 'react';
import { Percent } from 'lucide-react';
import { DefaultValueInput } from '../DefaultValueInput';
import { SaveHistoryFn } from '../../types';
import { formatNum } from '../../utils/calculators';
import { usePendingHistoryRestore } from '../../utils/historyRestore';

interface Props {
  onSaveHistory: (title: string, summary: string, details: Record<string, string | number>) => void;
}

const macroPlans = {
  balanced: { label: '균형형 (탄40/단30/지30)', carb: 0.4, protein: 0.3, fat: 0.3 },
  highProtein: { label: '고단백형 (탄35/단40/지25)', carb: 0.35, protein: 0.4, fat: 0.25 },
  lowCarb: { label: '저탄수형 (탄25/단40/지35)', carb: 0.25, protein: 0.4, fat: 0.35 },
} as const;

type MacroPlan = keyof typeof macroPlans;

export const MacroCalculator: React.FC<Props> = ({ onSaveHistory }) => {
  const saveHistory = onSaveHistory as SaveHistoryFn;
  const [dailyCalories, setDailyCalories] = useState(2200);
  const [plan, setPlan] = useState<MacroPlan>('balanced');
  const [saved, setSaved] = useState(false);

  const result = useMemo(() => {
    const selected = macroPlans[plan];
    const carbsG = Math.round((dailyCalories * selected.carb) / 4);
    const proteinG = Math.round((dailyCalories * selected.protein) / 4);
    const fatG = Math.round((dailyCalories * selected.fat) / 9);

    return {
      selected,
      carbsG,
      proteinG,
      fatG,
    };
  }, [dailyCalories, plan]);

  usePendingHistoryRestore<{
    dailyCalories: number;
    plan: MacroPlan;
  }>('macro', (restored) => {
    setDailyCalories(restored.dailyCalories);
    setPlan(restored.plan);
  });

  const handleSave = () => {
    saveHistory('탄.단.지 계산기', `${result.selected.label}`, {
      총칼로리: `${formatNum(dailyCalories)} kcal`,
      플랜: result.selected.label,
      탄수화물: `${formatNum(result.carbsG)} g`,
      단백질: `${formatNum(result.proteinG)} g`,
      지방: `${formatNum(result.fatG)} g`,
    }, {
      dailyCalories,
      plan,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-5">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Percent className="w-5 h-5 text-violet-500" />
          <span>탄.단.지(매크로 영양소) 계산기</span>
        </h3>
        <button onClick={handleSave} className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold whitespace-nowrap" title="계산기록에서 다시 가져올 수 있습니다.">기록저장</button>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">하루 총 칼로리 (kcal)</label>
          <DefaultValueInput type="number" value={dailyCalories} defaultValueLabel={2200} onValueChange={(value) => setDailyCalories(Number(value) || 0)} onBlur={() => setDailyCalories((prev) => Math.max(800, Math.min(6000, prev || 0)))} className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/60 p-2.5 text-sm font-bold text-slate-800 dark:text-slate-100" />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">분배 플랜</label>
          <select value={plan} onChange={(e) => setPlan(e.target.value as MacroPlan)} className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
            {Object.entries(macroPlans).map(([key, value]) => (
              <option key={key} value={key}>{value.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded-2xl p-4 border border-violet-200 dark:border-violet-900 bg-violet-50/70 dark:bg-violet-950/30 space-y-2">
        <div className="text-xs text-violet-700 dark:text-violet-300 font-semibold">하루 권장 섭취량</div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-white/70 dark:bg-slate-900/50 p-3">
            <div className="text-[11px] text-slate-500">탄수화물</div>
            <div className="text-lg font-black text-violet-900 dark:text-violet-100">{formatNum(result.carbsG)}g</div>
          </div>
          <div className="rounded-xl bg-white/70 dark:bg-slate-900/50 p-3">
            <div className="text-[11px] text-slate-500">단백질</div>
            <div className="text-lg font-black text-violet-900 dark:text-violet-100">{formatNum(result.proteinG)}g</div>
          </div>
          <div className="rounded-xl bg-white/70 dark:bg-slate-900/50 p-3">
            <div className="text-[11px] text-slate-500">지방</div>
            <div className="text-lg font-black text-violet-900 dark:text-violet-100">{formatNum(result.fatG)}g</div>
          </div>
        </div>
      </div>

      {saved && <div className="text-xs font-semibold text-center text-violet-700 dark:text-violet-300 bg-violet-100/80 dark:bg-violet-950/60 rounded-lg p-2">히스토리에 저장되었습니다.</div>}
    </div>
  );
};
