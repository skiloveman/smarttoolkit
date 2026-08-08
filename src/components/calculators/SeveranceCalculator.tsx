import React, { useState, useMemo } from 'react';
import { calculateSeverance, formatKrw, formatYmd } from '../../utils/calculators';
import { SeveranceInput, SaveHistoryFn } from '../../types';
import { Coins, Copy, Check, Calendar, AlertCircle } from 'lucide-react';
import { DefaultValueInput } from '../DefaultValueInput';
import { usePendingHistoryRestore } from '../../utils/historyRestore';

interface Props {
  onSaveHistory: (title: string, summary: string, details: Record<string, string | number>) => void;
}

export const SeveranceCalculator: React.FC<Props> = ({ onSaveHistory }) => {
  const saveHistory = onSaveHistory as SaveHistoryFn;
  // Default dates: 3 years ago to today
  const todayStr = formatYmd(new Date());
  const threeYearsAgo = new Date();
  threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);
  const startStr = formatYmd(threeYearsAgo);

  const [joinDate, setJoinDate] = useState<string>(startStr);
  const [retireDate, setRetireDate] = useState<string>(todayStr);
  const [m1, setM1] = useState<number>(3500000);
  const [m2, setM2] = useState<number>(3500000);
  const [m3, setM3] = useState<number>(3500000);
  const [annualBonus, setAnnualBonus] = useState<number>(3000000);
  const [annualLeavePay, setAnnualLeavePay] = useState<number>(500000);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  const severanceInput: SeveranceInput = useMemo(
    () => ({
      joinDate,
      retireDate,
      month1Salary: m1,
      month2Salary: m2,
      month3Salary: m3,
      annualBonus,
      annualLeavePay,
    }),
    [joinDate, retireDate, m1, m2, m3, annualBonus, annualLeavePay]
  );

  const result = useMemo(() => calculateSeverance(severanceInput), [severanceInput]);

  usePendingHistoryRestore<{
    joinDate: string;
    retireDate: string;
    m1: number;
    m2: number;
    m3: number;
    annualBonus: number;
    annualLeavePay: number;
  }>('severance', (restored) => {
    setJoinDate(restored.joinDate);
    setRetireDate(restored.retireDate);
    setM1(restored.m1);
    setM2(restored.m2);
    setM3(restored.m3);
    setAnnualBonus(restored.annualBonus);
    setAnnualLeavePay(restored.annualLeavePay);
  });

  const handleCopy = () => {
    const text = `[퇴직금 예상 계산 결과]
• 재직기간: ${joinDate} ~ ${retireDate} (총 ${result.totalWorkDays}일, 약 ${result.yearsOfService}년)
• 1일 평균임금: ${formatKrw(result.averageDailyWage)}
• 예상 퇴직금: ${formatKrw(result.estimatedSeverance)}
  - 3개월 기본급 합계: ${formatKrw(result.threeMonthSalaryTotal)}
  - 상여금 가산분(3/12): ${formatKrw(result.bonusForThreeMonths)}
  - 연차수당 가산분(3/12): ${formatKrw(result.leavePayForThreeMonths)}
- 생활 계산기 (https://www.smart-toolkit.com)`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    saveHistory(
      '퇴직금 예상 계산',
      `예상 퇴직금: ${formatKrw(result.estimatedSeverance)} (재직 ${result.totalWorkDays}일)`,
      {
        '입사일 ~ 퇴직일': `${joinDate} ~ ${retireDate}`,
        '총 재직일수': `${result.totalWorkDays}일 (${result.yearsOfService}년)`,
        '1일 평균임금': formatKrw(result.averageDailyWage),
        '예상 퇴직금': formatKrw(result.estimatedSeverance),
      },
      {
        joinDate,
        retireDate,
        m1,
        m2,
        m3,
        annualBonus,
        annualLeavePay,
      }
    );
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Inputs (7 cols) */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Coins className="w-5 h-5 text-amber-500" />
              <span>재직 및 임금 정보 입력</span>
            </h3>
            <span className="text-xs text-slate-400">근로기준법 기준</span>
          </div>

          {/* Join & Retire Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-blue-500" />
                <span>입사일자</span>
              </label>
              <DefaultValueInput
                type="date"
                value={joinDate}
                defaultValueLabel={startStr}
                onValueChange={setJoinDate}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 px-3.5 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none"
              />
              <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">표시값: {joinDate}</div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-amber-500" />
                <span>퇴직일자 (마지막 근무 다음날)</span>
              </label>
              <DefaultValueInput
                type="date"
                value={retireDate}
                defaultValueLabel={todayStr}
                onValueChange={setRetireDate}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 px-3.5 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none"
              />
              <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">표시값: {retireDate}</div>
            </div>
          </div>

          {/* 3 Months Salary */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              퇴직 직전 3개월간 기본급 및 수당 합계 (원)
            </label>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <span className="text-[10px] text-slate-400 block mb-1">1개월 전</span>
                <DefaultValueInput
                  type="number"
                  step="100000"
                  value={m1}
                  defaultValueLabel={3500000}
                  onValueChange={(value) => setM1(Number(value) || 0)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 p-2 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block mb-1">2개월 전</span>
                <DefaultValueInput
                  type="number"
                  step="100000"
                  value={m2}
                  defaultValueLabel={3500000}
                  onValueChange={(value) => setM2(Number(value) || 0)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 p-2 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block mb-1">3개월 전</span>
                <DefaultValueInput
                  type="number"
                  step="100000"
                  value={m3}
                  defaultValueLabel={3500000}
                  onValueChange={(value) => setM3(Number(value) || 0)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 p-2 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Annual Bonus & Annual Leave */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                연간 상여금 총액 (퇴직 전 1년)
              </label>
              <DefaultValueInput
                type="number"
                step="100000"
                value={annualBonus}
                defaultValueLabel={3000000}
                onValueChange={(value) => setAnnualBonus(Number(value) || 0)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 px-3.5 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                연차유급휴가 미사용수당 총액
              </label>
              <DefaultValueInput
                type="number"
                step="50000"
                value={annualLeavePay}
                defaultValueLabel={500000}
                onValueChange={(value) => setAnnualLeavePay(Number(value) || 0)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 px-3.5 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Right Result Card (5 cols) */}
        <div className="lg:col-span-5 rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-gradient-to-br from-amber-50/70 via-white to-amber-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-amber-950/30 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400 tracking-wider uppercase">
                예상 퇴직금 수령액
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSave}
                  className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-amber-600 transition-colors text-xs font-semibold whitespace-nowrap"
                  title="계산기록에서 다시 가져올 수 있습니다."
                >기록저장</button>
                <button
                  onClick={handleCopy}
                  className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold flex items-center gap-1 transition-all"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? '복사완료' : '결과 복사'}</span>
                </button>
              </div>
            </div>

            <div className="mb-6">
              <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {formatKrw(result.estimatedSeverance)}
              </div>
              <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <span>총 재직일수 {result.totalWorkDays}일</span>
                <span>({result.yearsOfService}년)</span>
              </div>
            </div>

            {/* Breakdown List */}
            <div className="space-y-2.5 text-xs mb-6">
              <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <span className="text-slate-600 dark:text-slate-400">1일 평균임금</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{formatKrw(result.averageDailyWage)}</span>
              </div>
              <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <span className="text-slate-600 dark:text-slate-400">3개월 기본급 합계</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{formatKrw(result.threeMonthSalaryTotal)}</span>
              </div>
              <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <span className="text-slate-600 dark:text-slate-400">상여금 가산액 (3/12)</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{formatKrw(result.bonusForThreeMonths)}</span>
              </div>
              <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <span className="text-slate-600 dark:text-slate-400">연차수당 가산액 (3/12)</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{formatKrw(result.leavePayForThreeMonths)}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-100/70 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900/50 text-[11px] text-amber-900 dark:text-amber-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
              <span>
                1년 이상(365일) 계속 근무 조건 충족 시 퇴직금이 발생합니다. 퇴직 소득세 및 지방소득세가 일부 공제된 후 통장으로 지급됩니다.
              </span>
            </div>
          </div>

          {saved && (
            <div className="mt-4 p-2 text-center text-xs font-medium text-emerald-700 bg-emerald-100/80 dark:bg-emerald-950/60 dark:text-emerald-300 rounded-lg">
              히스토리에 저장되었습니다.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
