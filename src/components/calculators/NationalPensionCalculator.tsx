import React, { useMemo, useState } from 'react';
import { HandCoins } from 'lucide-react';
import { SaveHistoryFn } from '../../types';
import { formatKrw, formatNum } from '../../utils/calculators';
import { usePendingHistoryRestore } from '../../utils/historyRestore';

interface Props {
  onSaveHistory: (title: string, summary: string, details: Record<string, string | number>) => void;
}

// 2025년 A값(전체 가입자 평균소득월액) 예시치
const A_VALUE = 2989237;

export const NationalPensionCalculator: React.FC<Props> = ({ onSaveHistory }) => {
  const saveHistory = onSaveHistory as SaveHistoryFn;
  const [avgMonthlyIncome, setAvgMonthlyIncome] = useState(3500000);
  const [joinYears, setJoinYears] = useState(20);
  const [saved, setSaved] = useState(false);

  const result = useMemo(() => {
    const B = avgMonthlyIncome;
    const proportionalConstant = 1.2;
    const excessYears = Math.max(0, joinYears - 20);
    const twentyYearBase = proportionalConstant * (A_VALUE + B) * (1 + 0.05 * excessYears);

    const basicPension =
      joinYears >= 20 ? twentyYearBase : twentyYearBase * (joinYears / 20);

    const monthlyPension = Math.round(basicPension);
    const annualPension = monthlyPension * 12;
    const totalContributionMonths = joinYears * 12;

    return {
      monthlyPension,
      annualPension,
      totalContributionMonths,
    };
  }, [avgMonthlyIncome, joinYears]);

  usePendingHistoryRestore<{ avgMonthlyIncome: number; joinYears: number }>('nationalPension', (restored) => {
    setAvgMonthlyIncome(restored.avgMonthlyIncome);
    setJoinYears(restored.joinYears);
  });

  const handleSave = () => {
    saveHistory('국민연금 예상 수령액 계산기', `월 예상 연금액 ${formatKrw(result.monthlyPension)}`, {
      가입기간중평균월소득: formatKrw(avgMonthlyIncome),
      예상가입기간: `${joinYears}년`,
      월예상연금액: formatKrw(result.monthlyPension),
      연예상연금액: formatKrw(result.annualPension),
    }, { avgMonthlyIncome, joinYears });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-5">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <HandCoins className="w-5 h-5 text-amber-500" />
          <span>국민연금 예상 수령액 계산기</span>
        </h3>
        <button onClick={handleSave} className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold whitespace-nowrap" title="계산기록에서 다시 가져올 수 있습니다.">기록저장</button>
      </div>

      <div>
        <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
          <span>가입기간 중 평균 월소득</span>
          <span className="font-bold text-amber-600 dark:text-amber-400">{formatKrw(avgMonthlyIncome)}</span>
        </div>
        <input type="range" min="1000000" max="10000000" step="100000" value={avgMonthlyIncome} onChange={(e) => setAvgMonthlyIncome(Number(e.target.value))} className="w-full accent-amber-600 cursor-pointer" />
      </div>

      <div>
        <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
          <span>예상 총 가입기간</span>
          <span className="font-bold text-amber-600 dark:text-amber-400">{joinYears}년</span>
        </div>
        <input type="range" min="1" max="40" value={joinYears} onChange={(e) => setJoinYears(Number(e.target.value))} className="w-full accent-amber-600 cursor-pointer" />
      </div>

      <div className="rounded-2xl p-4 border border-amber-200 dark:border-amber-900 bg-amber-50/70 dark:bg-amber-950/30 space-y-3">
        <div>
          <div className="text-xs text-amber-700 dark:text-amber-300 font-semibold">월 예상 연금 수령액 (65세 기준)</div>
          <div className="text-3xl font-black text-amber-900 dark:text-amber-100 mt-1">{formatKrw(result.monthlyPension)}</div>
        </div>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="rounded-xl bg-white/70 dark:bg-slate-900/40 p-3 border border-amber-100 dark:border-amber-900/60">
            <div className="text-slate-500 dark:text-slate-400 mb-1">연 예상 수령액</div>
            <div className="font-bold text-slate-800 dark:text-slate-100">{formatNum(result.annualPension)}원</div>
          </div>
          <div className="rounded-xl bg-white/70 dark:bg-slate-900/40 p-3 border border-amber-100 dark:border-amber-900/60">
            <div className="text-slate-500 dark:text-slate-400 mb-1">총 납부 개월수</div>
            <div className="font-bold text-slate-800 dark:text-slate-100">{formatNum(result.totalContributionMonths)}개월</div>
          </div>
        </div>
        <div className="text-[11px] text-slate-500 dark:text-slate-400">2025년 A값(전체 가입자 평균소득월액) 약 {formatNum(A_VALUE)}원을 기준으로 한 단순 모의계산이며, 실제 수령액은 매년 재평가된 소득·물가상승률·수급개시연령에 따라 달라집니다. 정확한 금액은 국민연금공단의 예상연금액 조회 서비스를 이용하세요.</div>
      </div>

      {saved && <div className="text-xs font-semibold text-center text-amber-700 dark:text-amber-300 bg-amber-100/80 dark:bg-amber-950/60 rounded-lg p-2">히스토리에 저장되었습니다.</div>}
    </div>
  );
};
