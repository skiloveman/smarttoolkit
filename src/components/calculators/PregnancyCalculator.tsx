import React, { useMemo, useState } from 'react';
import { Baby } from 'lucide-react';
import { DefaultValueInput } from '../DefaultValueInput';
import { SaveHistoryFn } from '../../types';
import { formatYmd } from '../../utils/calculators';
import { usePendingHistoryRestore } from '../../utils/historyRestore';

interface Props {
  onSaveHistory: (title: string, summary: string, details: Record<string, string | number>) => void;
}

export const PregnancyCalculator: React.FC<Props> = ({ onSaveHistory }) => {
  const saveHistory = onSaveHistory as SaveHistoryFn;
  const todayStr = formatYmd(new Date());
  const defaultLmp = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 63);
    return formatYmd(d);
  }, []);
  const [lastPeriodDate, setLastPeriodDate] = useState(defaultLmp);
  const [cycleLength, setCycleLength] = useState(28);
  const [saved, setSaved] = useState(false);

  const result = useMemo(() => {
    const lmp = new Date(lastPeriodDate);
    const today = new Date(todayStr);
    if (isNaN(lmp.getTime())) return null;

    const cycleAdjustment = cycleLength - 28;
    const edd = new Date(lmp);
    edd.setDate(edd.getDate() + 280 + cycleAdjustment);

    const gestationDaysTotal = Math.floor((today.getTime() - lmp.getTime()) / 86400000);
    const gestationWeeks = Math.floor(gestationDaysTotal / 7);
    const gestationRemainderDays = gestationDaysTotal % 7;

    let trimester = '1분기 (초기)';
    if (gestationWeeks >= 28) trimester = '3분기 (후기)';
    else if (gestationWeeks >= 14) trimester = '2분기 (중기)';

    const daysToEdd = Math.ceil((edd.getTime() - today.getTime()) / 86400000);

    return {
      eddLabel: formatYmd(edd),
      gestationWeeks,
      gestationRemainderDays,
      gestationDaysTotal,
      trimester,
      daysToEdd,
    };
  }, [lastPeriodDate, cycleLength, todayStr]);

  usePendingHistoryRestore<{ lastPeriodDate: string; cycleLength: number }>('pregnancy', (restored) => {
    setLastPeriodDate(restored.lastPeriodDate);
    setCycleLength(restored.cycleLength);
  });

  const handleSave = () => {
    if (!result) return;
    saveHistory('임신 주수 & 출산예정일 계산기', `임신 ${result.gestationWeeks}주 ${result.gestationRemainderDays}일 / 출산예정일 ${result.eddLabel}`, {
      마지막생리시작일: lastPeriodDate,
      평균생리주기: `${cycleLength}일`,
      현재임신주수: `${result.gestationWeeks}주 ${result.gestationRemainderDays}일`,
      출산예정일: result.eddLabel,
      삼분기: result.trimester,
    }, {
      lastPeriodDate,
      cycleLength,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const outOfRange = result ? result.gestationDaysTotal < 0 || result.gestationDaysTotal > 300 : false;

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-5">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Baby className="w-5 h-5 text-pink-500" />
          <span>임신 주수 & 출산예정일 계산기</span>
        </h3>
        <button onClick={handleSave} className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold whitespace-nowrap" title="계산기록에서 다시 가져올 수 있습니다.">기록저장</button>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">마지막 생리 시작일</label>
        <DefaultValueInput
          type="date"
          value={lastPeriodDate}
          defaultValueLabel={defaultLmp}
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
        <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">생리 주기가 불규칙하다면 평균값(보통 28일)을 사용하세요.</div>
      </div>

      {result && !outOfRange ? (
        <div className="rounded-2xl p-4 border border-pink-200 dark:border-pink-900 bg-pink-50/70 dark:bg-pink-950/30 space-y-3">
          <div>
            <div className="text-xs text-pink-700 dark:text-pink-300 font-semibold">현재 임신 주수</div>
            <div className="text-3xl font-black text-pink-900 dark:text-pink-100 mt-1">
              {result.gestationWeeks}주 {result.gestationRemainderDays}일
            </div>
            <span className="inline-block mt-1 px-2.5 py-1 rounded-full text-[11px] font-bold text-white bg-pink-600">{result.trimester}</span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-xl bg-white/70 dark:bg-slate-900/40 p-3 border border-pink-100 dark:border-pink-900/60">
              <div className="text-slate-500 dark:text-slate-400 mb-1">출산예정일</div>
              <div className="font-bold text-slate-800 dark:text-slate-100">{result.eddLabel}</div>
            </div>
            <div className="rounded-xl bg-white/70 dark:bg-slate-900/40 p-3 border border-pink-100 dark:border-pink-900/60">
              <div className="text-slate-500 dark:text-slate-400 mb-1">출산예정일까지</div>
              <div className="font-bold text-slate-800 dark:text-slate-100">
                {result.daysToEdd >= 0 ? `D-${result.daysToEdd}` : `D+${Math.abs(result.daysToEdd)}`}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl p-4 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-xs text-slate-500 dark:text-slate-400">
          마지막 생리 시작일을 정상 임신 범위(약 40주 이내)로 입력해 주세요.
        </div>
      )}

      {saved && <div className="text-xs font-semibold text-center text-pink-700 dark:text-pink-300 bg-pink-100/80 dark:bg-pink-950/60 rounded-lg p-2">히스토리에 저장되었습니다.</div>}
    </div>
  );
};
