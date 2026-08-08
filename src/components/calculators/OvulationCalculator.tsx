import React, { useMemo, useState } from 'react';
import { Flower2 } from 'lucide-react';
import { DefaultValueInput } from '../DefaultValueInput';
import { SaveHistoryFn } from '../../types';
import { formatYmd } from '../../utils/calculators';
import { usePendingHistoryRestore } from '../../utils/historyRestore';

interface Props {
  onSaveHistory: (title: string, summary: string, details: Record<string, string | number>) => void;
}

export const OvulationCalculator: React.FC<Props> = ({ onSaveHistory }) => {
  const saveHistory = onSaveHistory as SaveHistoryFn;
  const todayStr = formatYmd(new Date());
  const [lastPeriodDate, setLastPeriodDate] = useState(todayStr);
  const [cycleLength, setCycleLength] = useState(28);
  const [saved, setSaved] = useState(false);

  const result = useMemo(() => {
    const lmp = new Date(lastPeriodDate);
    if (isNaN(lmp.getTime())) return null;

    const ovulationDay = new Date(lmp);
    ovulationDay.setDate(ovulationDay.getDate() + (cycleLength - 14));

    const fertileStart = new Date(ovulationDay);
    fertileStart.setDate(fertileStart.getDate() - 5);
    const fertileEnd = new Date(ovulationDay);
    fertileEnd.setDate(fertileEnd.getDate() + 1);

    const nextPeriod = new Date(lmp);
    nextPeriod.setDate(nextPeriod.getDate() + cycleLength);

    const today = new Date(todayStr);
    const daysToOvulation = Math.round((ovulationDay.getTime() - today.getTime()) / 86400000);

    return {
      ovulationLabel: formatYmd(ovulationDay),
      fertileStartLabel: formatYmd(fertileStart),
      fertileEndLabel: formatYmd(fertileEnd),
      nextPeriodLabel: formatYmd(nextPeriod),
      daysToOvulation,
    };
  }, [lastPeriodDate, cycleLength, todayStr]);

  usePendingHistoryRestore<{ lastPeriodDate: string; cycleLength: number }>('ovulation', (restored) => {
    setLastPeriodDate(restored.lastPeriodDate);
    setCycleLength(restored.cycleLength);
  });

  const handleSave = () => {
    if (!result) return;
    saveHistory('배란일 & 가임기 계산기', `배란예정일 ${result.ovulationLabel} / 가임기 ${result.fertileStartLabel}~${result.fertileEndLabel}`, {
      마지막생리시작일: lastPeriodDate,
      평균생리주기: `${cycleLength}일`,
      배란예정일: result.ovulationLabel,
      가임기: `${result.fertileStartLabel} ~ ${result.fertileEndLabel}`,
      다음생리예정일: result.nextPeriodLabel,
    }, { lastPeriodDate, cycleLength });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-5">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Flower2 className="w-5 h-5 text-pink-500" />
          <span>배란일 & 가임기 계산기</span>
        </h3>
        <button onClick={handleSave} className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold whitespace-nowrap" title="계산기록에서 다시 가져올 수 있습니다.">기록저장</button>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">마지막 생리 시작일</label>
        <DefaultValueInput
          type="date"
          value={lastPeriodDate}
          defaultValueLabel={todayStr}
          onValueChange={setLastPeriodDate}
          className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/60 p-2.5 text-sm font-bold text-slate-800 dark:text-slate-100"
        />
      </div>

      <div>
        <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
          <span>평균 생리 주기</span>
          <span className="font-bold text-pink-600 dark:text-pink-400">{cycleLength}일</span>
        </div>
        <input type="range" min="21" max="35" value={cycleLength} onChange={(e) => setCycleLength(Number(e.target.value))} className="w-full accent-pink-500 cursor-pointer" />
        <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">배란일은 다음 생리 예정일로부터 14일 전(황체기 고정)으로 추정합니다.</div>
      </div>

      {result && (
        <div className="rounded-2xl p-4 border border-pink-200 dark:border-pink-900 bg-pink-50/70 dark:bg-pink-950/30 space-y-3">
          <div>
            <div className="text-xs text-pink-700 dark:text-pink-300 font-semibold">배란 예정일</div>
            <div className="text-3xl font-black text-pink-900 dark:text-pink-100 mt-1">{result.ovulationLabel}</div>
            <span className="inline-block mt-1 px-2.5 py-1 rounded-full text-[11px] font-bold text-white bg-pink-600">
              {result.daysToOvulation >= 0 ? `D-${result.daysToOvulation}` : `D+${Math.abs(result.daysToOvulation)}`}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-xl bg-white/70 dark:bg-slate-900/40 p-3 border border-pink-100 dark:border-pink-900/60">
              <div className="text-slate-500 dark:text-slate-400 mb-1">가임기 (임신확률 높은 기간)</div>
              <div className="font-bold text-slate-800 dark:text-slate-100">{result.fertileStartLabel} ~ {result.fertileEndLabel}</div>
            </div>
            <div className="rounded-xl bg-white/70 dark:bg-slate-900/40 p-3 border border-pink-100 dark:border-pink-900/60">
              <div className="text-slate-500 dark:text-slate-400 mb-1">다음 생리 예정일</div>
              <div className="font-bold text-slate-800 dark:text-slate-100">{result.nextPeriodLabel}</div>
            </div>
          </div>
        </div>
      )}

      {saved && <div className="text-xs font-semibold text-center text-pink-700 dark:text-pink-300 bg-pink-100/80 dark:bg-pink-950/60 rounded-lg p-2">히스토리에 저장되었습니다.</div>}
    </div>
  );
};
