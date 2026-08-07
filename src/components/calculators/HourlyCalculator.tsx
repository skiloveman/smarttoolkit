import React, { useState } from 'react';
import { Clock, Copy, Check, BookmarkPlus, DollarSign, AlertCircle } from 'lucide-react';
import { DefaultValueInput } from '../DefaultValueInput';
import { SaveHistoryFn } from '../../types';
import { formatKrw, formatNum } from '../../utils/calculators';
import { usePendingHistoryRestore } from '../../utils/historyRestore';

interface Props {
  onSaveHistory: (title: string, summary: string, details: Record<string, string | number>) => void;
}

export const HourlyCalculator: React.FC<Props> = ({ onSaveHistory }) => {
  const saveHistory = onSaveHistory as SaveHistoryFn;
  const [hourlyWage, setHourlyWage] = useState<number>(10030); // 2025/2026 최저시급 10,030원
  const [workHoursPerDay, setWorkHoursPerDay] = useState<number>(8); // 하루 8시간
  const [workDaysPerWeek, setWorkDaysPerWeek] = useState<number>(5); // 주 5일
  const [overtimeHoursPerWeek, setOvertimeHoursPerWeek] = useState<number>(0); // 주당 연장/야간 근무시간 (1.5배)
  const [taxDeduction, setTaxDeduction] = useState<'none' | 'tax33' | 'insurance4'>('tax33'); // 미공제, 3.3%, 4대보험

  const [copied, setCopied] = useState<boolean>(false);
  const [saved, setSaved] = useState<boolean>(false);

  // Weekly regular work hours
  const weeklyRegularHours = workHoursPerDay * workDaysPerWeek;

  // Weekly Holiday Pay Hours (주휴수당 시간)
  // 주 15시간 이상 근무 시: (주근무시간 / 40) * 8 (최대 8시간)
  let weeklyHolidayHours = 0;
  if (weeklyRegularHours >= 15) {
    const cappedHours = Math.min(40, weeklyRegularHours);
    weeklyHolidayHours = (cappedHours / 40) * 8;
  }

  // Weekly Wages
  const weeklyBaseWage = Math.round(weeklyRegularHours * hourlyWage);
  const weeklyHolidayWage = Math.round(weeklyHolidayHours * hourlyWage);
  const weeklyOvertimeWage = Math.round(overtimeHoursPerWeek * hourlyWage * 1.5);
  const totalWeeklyWage = weeklyBaseWage + weeklyHolidayWage + weeklyOvertimeWage;

  // Monthly Wages (Average 4.345 weeks per month = 365 / 7 / 12)
  const WEEKS_PER_MONTH = 4.345;
  const grossMonthlyWage = Math.round(totalWeeklyWage * WEEKS_PER_MONTH);

  // Deductions
  let deductionAmount = 0;
  let deductionLabel = '공제 없음';

  if (taxDeduction === 'tax33') {
    deductionAmount = Math.round(grossMonthlyWage * 0.033);
    deductionLabel = '소득세 3.3%';
  } else if (taxDeduction === 'insurance4') {
    // 4대보험 근로자 부담분 약 9.4% (국민 4.5%, 건강 3.545%, 장기요양, 고용 0.9%)
    deductionAmount = Math.round(grossMonthlyWage * 0.094);
    deductionLabel = '4대보험 (~9.4%)';
  }

  const netMonthlyWage = grossMonthlyWage - deductionAmount;

  usePendingHistoryRestore<{
    hourlyWage: number;
    workHoursPerDay: number;
    workDaysPerWeek: number;
    overtimeHoursPerWeek: number;
    taxDeduction: 'none' | 'tax33' | 'insurance4';
  }>('hourly', (restored) => {
    setHourlyWage(restored.hourlyWage);
    setWorkHoursPerDay(restored.workHoursPerDay);
    setWorkDaysPerWeek(restored.workDaysPerWeek);
    setOvertimeHoursPerWeek(restored.overtimeHoursPerWeek);
    setTaxDeduction(restored.taxDeduction);
  });

  const handleCopy = () => {
    const text = `[알바 시급 & 주휴수당 계산 결과]
• 적용 시급: ${formatKrw(hourlyWage)} (2025/2026 최저시급 10,030원)
• 근무 조건: 주 ${workDaysPerWeek}일 × 일 ${workHoursPerDay}시간 (주 ${weeklyRegularHours}시간)
• 주휴수당 시간: 주 ${weeklyHolidayHours.toFixed(1)}시간 발생
------------------------------------
• 주급 (기본+주휴+수당): ${formatKrw(totalWeeklyWage)}
• 세전 월급 (4.345주 기준): ${formatKrw(grossMonthlyWage)}
  - 기본급: ${formatKrw(Math.round(weeklyBaseWage * WEEKS_PER_MONTH))}
  - 주휴수당: ${formatKrw(Math.round(weeklyHolidayWage * WEEKS_PER_MONTH))}
  - 연장/야간 수당: ${formatKrw(Math.round(weeklyOvertimeWage * WEEKS_PER_MONTH))}
• 공제 (${deductionLabel}): -${formatKrw(deductionAmount)}
➔ 최종 실수령 월급: ${formatKrw(netMonthlyWage)}
- 생활 계산기 (https://www.smart-toolkit.com)`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    saveHistory(
      '시급 & 주휴수당 계산',
      `시급 ${formatKrw(hourlyWage)} (주${weeklyRegularHours}시간) = 실수령 월급 ${formatKrw(netMonthlyWage)}`,
      {
        적용시급: formatKrw(hourlyWage),
        주당근무시간: `${weeklyRegularHours}시간`,
        주휴수당시간: `${weeklyHolidayHours.toFixed(1)}시간`,
        주급: formatKrw(totalWeeklyWage),
        세전월급: formatKrw(grossMonthlyWage),
        공제: formatKrw(deductionAmount),
        실수령월급: formatKrw(netMonthlyWage),
      },
      {
        hourlyWage,
        workHoursPerDay,
        workDaysPerWeek,
        overtimeHoursPerWeek,
        taxDeduction,
      }
    );
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Clock className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            <span>알바 시급 & 주휴수당 계산기</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            2025/2026 최저시급(10,030원) 기준, 주 15시간 이상 근무 시 주휴수당 및 실수령액 산출
          </p>
        </div>

        {/* Minimum Wage Preset Button */}
        <button
          onClick={() => setHourlyWage(10030)}
          className="px-3 py-1.5 rounded-lg bg-teal-50 border border-teal-200 text-teal-700 dark:bg-teal-950 dark:border-teal-900 dark:text-teal-300 text-xs font-bold flex items-center gap-1 shrink-0"
        >
          <span>2025/2026 최저시급 (10,030원) 적용</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Inputs */}
        <div className="space-y-4">
          {/* Hourly Wage */}
          <div>
            <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              <span>적용 시급 (원)</span>
              <span className="text-teal-600 font-bold">{formatKrw(hourlyWage)}</span>
            </div>
            <DefaultValueInput
              type="number"
              step="100"
              value={hourlyWage}
              defaultValueLabel={10030}
              onValueChange={(value) => setHourlyWage(Math.max(0, Number(value) || 0))}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 p-2.5 text-lg font-black text-slate-800 dark:text-slate-200"
            />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {[10030, 11000, 12000, 15000, 20000].map((w) => (
                <button
                  key={w}
                  onClick={() => setHourlyWage(w)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                    hourlyWage === w ? 'bg-teal-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {formatNum(w)}원
                </button>
              ))}
            </div>
          </div>

          {/* Daily Work Hours & Days Per Week */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                일일 근무시간 (시간)
              </label>
              <DefaultValueInput
                type="number"
                step="0.5"
                value={workHoursPerDay}
                defaultValueLabel={8}
                onValueChange={(value) => setWorkHoursPerDay(Math.max(0, Number(value) || 0))}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 p-2.5 text-base font-bold text-slate-800 dark:text-slate-200"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                주당 근무일수 (일)
              </label>
              <DefaultValueInput
                type="number"
                step="1"
                value={workDaysPerWeek}
                defaultValueLabel={5}
                onValueChange={(value) => setWorkDaysPerWeek(Math.min(7, Math.max(0, Number(value) || 0)))}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 p-2.5 text-base font-bold text-slate-800 dark:text-slate-200"
              />
            </div>
          </div>

          {/* Overtime / Night Hours */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              주당 연장/야간/휴일 근무시간 (1.5배 수당)
            </label>
            <DefaultValueInput
              type="number"
              step="0.5"
              value={overtimeHoursPerWeek}
              defaultValueLabel={0}
              onValueChange={(value) => setOvertimeHoursPerWeek(Math.max(0, Number(value) || 0))}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 p-2 text-xs font-bold text-slate-800 dark:text-slate-200"
            />
          </div>

          {/* Tax Deduction Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              세금 / 보험 공제 방식
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'tax33', label: '3.3% 사업소득세' },
                { id: 'insurance4', label: '4대보험 (~9.4%)' },
                { id: 'none', label: '미공제 (100%)' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTaxDeduction(t.id as any)}
                  className={`py-2 px-1 rounded-lg text-xs font-semibold border transition-all ${
                    taxDeduction === t.id
                      ? 'border-teal-600 bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 font-bold'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results Card */}
        <div className="p-6 rounded-2xl bg-teal-50/90 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-900 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-teal-200/80 dark:border-teal-900 pb-3">
              <span className="text-xs font-bold text-teal-800 dark:text-teal-300 uppercase tracking-wider">
                최종 예상 실수령 월급
              </span>
              <span className="text-xs font-semibold text-teal-700 dark:text-teal-400">
                주 {weeklyRegularHours}시간 근무
              </span>
            </div>

            <div className="text-3xl sm:text-4xl font-black text-teal-950 dark:text-teal-100 mt-3">
              {formatKrw(netMonthlyWage)}
            </div>

            {/* Holiday Pay Alert */}
            {weeklyRegularHours >= 15 ? (
              <div className="mt-3 p-2.5 rounded-lg bg-teal-100/70 dark:bg-teal-900/60 text-teal-800 dark:text-teal-200 text-xs font-semibold flex items-center gap-1.5">
                <Check className="w-4 h-4 text-teal-600 shrink-0" />
                <span>주 15시간 이상으로 주휴수당 (주당 {weeklyHolidayHours.toFixed(1)}시간분) 자동 포함되었습니다.</span>
              </div>
            ) : (
              <div className="mt-3 p-2.5 rounded-lg bg-amber-100/70 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-xs font-semibold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>주 15시간 미만 미달로 법정 주휴수당 대상에서 제외됩니다.</span>
              </div>
            )}

            <div className="mt-4 space-y-2 text-xs text-slate-600 dark:text-slate-300 border-t border-teal-200/60 dark:border-teal-900/60 pt-3">
              <div className="flex justify-between">
                <span>예상 주급 (기본+주휴+수당):</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{formatKrw(totalWeeklyWage)}</span>
              </div>
              <div className="flex justify-between">
                <span>월 환산 세전 금액 (4.345주):</span>
                <span className="font-semibold">{formatKrw(grossMonthlyWage)}</span>
              </div>
              <div className="flex justify-between text-rose-600 dark:text-rose-400">
                <span>공제액 ({deductionLabel}):</span>
                <span>-{formatKrw(deductionAmount)}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={handleSave}
              className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-teal-200 dark:border-teal-800 text-slate-600 dark:text-slate-300 hover:bg-teal-100/50 transition-colors"
              title="기록 저장"
            >
              <BookmarkPlus className="w-4 h-4" />
            </button>

            <button
              onClick={handleCopy}
              className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? '복사완료' : '결과 복사'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
