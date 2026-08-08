import React, { useMemo, useState } from 'react';
import { Key } from 'lucide-react';
import { SaveHistoryFn } from '../../types';
import { usePendingHistoryRestore } from '../../utils/historyRestore';

interface Props {
  onSaveHistory: (title: string, summary: string, details: Record<string, string | number>) => void;
}

function noHouseScore(years: number): number {
  return Math.min(32, 2 + Math.floor(years) * 2);
}

function dependentsScore(count: number): number {
  return Math.min(35, 5 + count * 5);
}

function accountPeriodScore(months: number): number {
  if (months < 6) return 1;
  if (months < 12) return 2;
  return Math.min(17, 2 + Math.floor(months / 12));
}

export const HousingSubscriptionCalculator: React.FC<Props> = ({ onSaveHistory }) => {
  const saveHistory = onSaveHistory as SaveHistoryFn;
  const [noHouseYears, setNoHouseYears] = useState(5);
  const [dependents, setDependents] = useState(2);
  const [accountMonths, setAccountMonths] = useState(60);
  const [saved, setSaved] = useState(false);

  const result = useMemo(() => {
    const s1 = noHouseScore(noHouseYears);
    const s2 = dependentsScore(dependents);
    const s3 = accountPeriodScore(accountMonths);
    return {
      noHouseScore: s1,
      dependentsScore: s2,
      accountScore: s3,
      total: s1 + s2 + s3,
    };
  }, [noHouseYears, dependents, accountMonths]);

  usePendingHistoryRestore<{ noHouseYears: number; dependents: number; accountMonths: number }>(
    'housingSubscription',
    (restored) => {
      setNoHouseYears(restored.noHouseYears);
      setDependents(restored.dependents);
      setAccountMonths(restored.accountMonths);
    }
  );

  const handleSave = () => {
    saveHistory('청약통장 가점 계산기', `총 ${result.total}점 / 84점`, {
      무주택기간: `${noHouseYears}년 (${result.noHouseScore}점)`,
      부양가족수: `${dependents}명 (${result.dependentsScore}점)`,
      청약통장가입기간: `${accountMonths}개월 (${result.accountScore}점)`,
      총점: `${result.total}점`,
    }, { noHouseYears, dependents, accountMonths });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-5">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Key className="w-5 h-5 text-violet-500" />
          <span>청약통장 가점 계산기</span>
        </h3>
        <button onClick={handleSave} className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold whitespace-nowrap" title="계산기록에서 다시 가져올 수 있습니다.">기록저장</button>
      </div>

      <div>
        <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
          <span>무주택 기간 (만점 32점, 15년 이상)</span>
          <span className="font-bold text-violet-600 dark:text-violet-400">{noHouseYears}년 · {result.noHouseScore}점</span>
        </div>
        <input type="range" min="0" max="20" value={noHouseYears} onChange={(e) => setNoHouseYears(Number(e.target.value))} className="w-full accent-violet-600 cursor-pointer" />
      </div>

      <div>
        <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
          <span>부양가족 수 (본인 제외, 만점 35점, 6명 이상)</span>
          <span className="font-bold text-violet-600 dark:text-violet-400">{dependents}명 · {result.dependentsScore}점</span>
        </div>
        <input type="range" min="0" max="8" value={dependents} onChange={(e) => setDependents(Number(e.target.value))} className="w-full accent-violet-600 cursor-pointer" />
      </div>

      <div>
        <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
          <span>청약통장 가입 기간 (만점 17점, 15년 이상)</span>
          <span className="font-bold text-violet-600 dark:text-violet-400">{Math.floor(accountMonths / 12)}년 {accountMonths % 12}개월 · {result.accountScore}점</span>
        </div>
        <input type="range" min="0" max="200" value={accountMonths} onChange={(e) => setAccountMonths(Number(e.target.value))} className="w-full accent-violet-600 cursor-pointer" />
      </div>

      <div className="rounded-2xl p-4 border border-violet-200 dark:border-violet-900 bg-violet-50/70 dark:bg-violet-950/30 space-y-3">
        <div>
          <div className="text-xs text-violet-700 dark:text-violet-300 font-semibold">청약 가점 총점 (만점 84점)</div>
          <div className="text-3xl font-black text-violet-900 dark:text-violet-100 mt-1">{result.total}점</div>
        </div>
        <div className="grid grid-cols-3 gap-3 text-xs">
          <div className="rounded-xl bg-white/70 dark:bg-slate-900/40 p-3 border border-violet-100 dark:border-violet-900/60">
            <div className="text-slate-500 dark:text-slate-400 mb-1">무주택기간</div>
            <div className="font-bold text-slate-800 dark:text-slate-100">{result.noHouseScore}점</div>
          </div>
          <div className="rounded-xl bg-white/70 dark:bg-slate-900/40 p-3 border border-violet-100 dark:border-violet-900/60">
            <div className="text-slate-500 dark:text-slate-400 mb-1">부양가족</div>
            <div className="font-bold text-slate-800 dark:text-slate-100">{result.dependentsScore}점</div>
          </div>
          <div className="rounded-xl bg-white/70 dark:bg-slate-900/40 p-3 border border-violet-100 dark:border-violet-900/60">
            <div className="text-slate-500 dark:text-slate-400 mb-1">통장가입기간</div>
            <div className="font-bold text-slate-800 dark:text-slate-100">{result.accountScore}점</div>
          </div>
        </div>
      </div>

      {saved && <div className="text-xs font-semibold text-center text-violet-700 dark:text-violet-300 bg-violet-100/80 dark:bg-violet-950/60 rounded-lg p-2">히스토리에 저장되었습니다.</div>}
    </div>
  );
};
