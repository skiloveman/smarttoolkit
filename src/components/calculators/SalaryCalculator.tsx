import React, { useState, useMemo } from 'react';
import { calculateSalary, formatKrw, formatNum } from '../../utils/calculators';
import { SalaryInput, SaveHistoryFn } from '../../types';
import { Copy, Check, Sparkles } from 'lucide-react';
import { DefaultValueInput } from '../DefaultValueInput';
import { usePendingHistoryRestore } from '../../utils/historyRestore';

interface Props {
  onSaveHistory: (title: string, summary: string, details: Record<string, string | number>) => void;
}

export const SalaryCalculator: React.FC<Props> = ({ onSaveHistory }) => {
  const saveHistory = onSaveHistory as SaveHistoryFn;
  const [salaryType, setSalaryType] = useState<'annual' | 'monthly'>('annual');
  const [amountInput, setAmountInput] = useState<number>(45000000); // 45,000,000 KRW default
  const [nonTaxable, setNonTaxable] = useState<number>(200000); // 200,000 KRW
  const [dependents, setDependents] = useState<number>(1);
  const [childrenUnder20, setChildrenUnder20] = useState<number>(0);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  const salaryInput: SalaryInput = useMemo(
    () => ({
      salaryType,
      amount: amountInput,
      nonTaxable,
      dependents,
      childrenUnder20,
    }),
    [salaryType, amountInput, nonTaxable, dependents, childrenUnder20]
  );

  const result = useMemo(() => calculateSalary(salaryInput), [salaryInput]);

  usePendingHistoryRestore<{
    salaryType: 'annual' | 'monthly';
    amountInput: number;
    nonTaxable: number;
    dependents: number;
    childrenUnder20: number;
  }>('salary', (restored) => {
    setSalaryType(restored.salaryType);
    setAmountInput(restored.amountInput);
    setNonTaxable(restored.nonTaxable);
    setDependents(restored.dependents);
    setChildrenUnder20(restored.childrenUnder20);
  });

  // Chart Data
  const chartData = [
    { name: '실수령액', value: result.netMonthlyPay, color: '#3B82F6' },
    { name: '4대보험료', value: result.totalSocialInsurance, color: '#10B981' },
    { name: '소득세/지방세', value: result.totalTax, color: '#F59E0B' },
  ];

  const donutChartStyle = useMemo(() => {
    const total = chartData.reduce((sum, entry) => sum + entry.value, 0);
    if (total <= 0) {
      return { background: 'conic-gradient(#e2e8f0 0deg 360deg)' };
    }

    let currentAngle = 0;
    const stops = chartData.map((entry) => {
      const startAngle = currentAngle;
      currentAngle += (entry.value / total) * 360;
      return `${entry.color} ${startAngle}deg ${currentAngle}deg`;
    });

    return { background: `conic-gradient(${stops.join(', ')})` };
  }, [chartData]);

  const handleCopy = () => {
    const text = `[연봉 실수령액 계산 결과]
• 구분: ${salaryType === 'annual' ? `연봉 ${formatNum(amountInput / 10000)}만원` : `월급 ${formatNum(amountInput)}원`}
• 월 실수령액: ${formatKrw(result.netMonthlyPay)}
• 월 공제합계: ${formatKrw(result.totalDeduction)} (${result.deductionRatio}%)
  - 국민연금: ${formatKrw(result.nationalPension)}
  - 건강보험: ${formatKrw(result.healthInsurance)}
  - 장기요양: ${formatKrw(result.longTermCare)}
  - 고용보험: ${formatKrw(result.employmentInsurance)}
  - 근로소득세: ${formatKrw(result.incomeTax)}
  - 지방소득세: ${formatKrw(result.localIncomeTax)}
- 생활 계산기 (https://www.smart-toolkit.com)`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    saveHistory(
      '연봉 실수령액 계산',
      `실수령액: ${formatKrw(result.netMonthlyPay)} / 공제: ${formatKrw(result.totalDeduction)}`,
      {
        '계약 금액': salaryType === 'annual' ? `${formatNum(amountInput / 10000)}만원 (연봉)` : `${formatKrw(amountInput)} (월급)`,
        '월 실수령액': formatKrw(result.netMonthlyPay),
        '4대보험 합계': formatKrw(result.totalSocialInsurance),
        '세금 합계': formatKrw(result.totalTax),
      },
      {
        salaryType,
        amountInput,
        nonTaxable,
        dependents,
        childrenUnder20,
      }
    );
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const presets = [30000000, 40000000, 50000000, 60000000, 75000000, 100000000];

  return (
    <div className="space-y-6">
      {/* 입력 영역 & 메인 카드 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Inputs (7 cols) */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-500" />
              <span>급여 정보 입력</span>
            </h3>
            <div className="flex rounded-lg bg-slate-100 dark:bg-slate-800 p-1 text-xs font-semibold">
              <button
                onClick={() => {
                  setSalaryType('annual');
                  if (amountInput < 10000000) setAmountInput(45000000);
                }}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  salaryType === 'annual'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                연봉 기준
              </button>
              <button
                onClick={() => {
                  setSalaryType('monthly');
                  if (amountInput > 20000000) setAmountInput(3500000);
                }}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  salaryType === 'monthly'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                월급 기준
              </button>
            </div>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              {salaryType === 'annual' ? '연봉 금액 (세전)' : '월급 금액 (세전)'}
            </label>
            <div className="relative">
              <DefaultValueInput
                type="number"
                step={salaryType === 'annual' ? 1000000 : 100000}
                value={amountInput}
                defaultValueLabel={salaryType === 'annual' ? 45000000 : 3500000}
                onValueChange={(value) => setAmountInput(Math.max(0, Number(value) || 0))}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 px-4 py-3 text-base font-bold text-slate-900 dark:text-slate-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all pr-12"
              />
              <span className="absolute right-4 top-3.5 text-xs font-semibold text-slate-400">원</span>
            </div>
            {/* Quick Presets */}
            {salaryType === 'annual' && (
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {presets.map((val) => (
                  <button
                    key={val}
                    onClick={() => setAmountInput(val)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                      amountInput === val
                        ? 'bg-blue-600 text-white font-semibold'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {val / 10000}만원
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Non-Taxable */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <span>월 비과세액 (식대 등)</span>
                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-normal">(기본 20만원 적용)</span>
              </label>
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{formatNum(nonTaxable)}원</span>
            </div>
            <input
              type="range"
              min="0"
              max="500000"
              step="50000"
              value={nonTaxable}
              onChange={(e) => setNonTaxable(Number(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer"
            />
          </div>

          {/* Family Dependents */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                부양가족 수 (본인 포함)
              </label>
              <select
                value={dependents}
                onChange={(e) => setDependents(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 px-3 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <option key={n} value={n}>
                    {n}명 {n === 1 ? '(본인 1인)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                20세 이하 자녀 수
              </label>
              <select
                value={childrenUnder20}
                onChange={(e) => setChildrenUnder20(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 px-3 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none"
              >
                {[0, 1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n}명
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Right Result Card (5 cols) */}
        <div className="lg:col-span-5 rounded-2xl border border-blue-200 dark:border-blue-900/60 bg-gradient-to-br from-blue-50/70 via-white to-slate-50 dark:from-slate-900 dark:via-slate-900 dark:to-blue-950/40 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400 tracking-wider uppercase">
                예상 월 실수령액
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSave}
                  className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-xs font-semibold whitespace-nowrap"
                  title="계산기록에서 다시 가져올 수 있습니다."
                >기록저장</button>
                <button
                  onClick={handleCopy}
                  className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1 transition-all"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? '복사완료' : '결과 복사'}</span>
                </button>
              </div>
            </div>

            <div className="mb-6">
              <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {formatKrw(result.netMonthlyPay)}
              </div>
              <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <span>세전 월급 {formatKrw(result.grossMonthly)}</span>
                <span>•</span>
                <span className="text-amber-600 dark:text-amber-400 font-medium">
                  공제율 {result.deductionRatio}%
                </span>
              </div>
            </div>

            <div className="h-44 w-full relative mb-4 flex items-center justify-center">
              <div
                className="relative h-32 w-32 rounded-full shadow-sm"
                style={donutChartStyle}
                aria-label="실수령액과 공제 비율 차트"
                role="img"
              >
                <div className="absolute inset-[18px] rounded-full bg-white dark:bg-slate-900" />
              </div>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] text-slate-400">월 공제액</span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {formatKrw(result.totalDeduction)}
                </span>
              </div>
            </div>

            {/* Summary Legend */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-lg bg-blue-50/80 dark:bg-blue-900/20 p-2 border border-blue-100 dark:border-blue-900/40">
                <div className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">실수령액</div>
                <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{formatKrw(result.netMonthlyPay)}</div>
              </div>
              <div className="rounded-lg bg-emerald-50/80 dark:bg-emerald-900/20 p-2 border border-emerald-100 dark:border-emerald-900/40">
                <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">4대보험</div>
                <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{formatKrw(result.totalSocialInsurance)}</div>
              </div>
              <div className="rounded-lg bg-amber-50/80 dark:bg-amber-900/20 p-2 border border-amber-100 dark:border-amber-900/40">
                <div className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">세금(소득/지방)</div>
                <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{formatKrw(result.totalTax)}</div>
              </div>
            </div>
          </div>

          {saved && (
            <div className="mt-4 p-2 text-center text-xs font-medium text-emerald-700 bg-emerald-100/80 dark:bg-emerald-950/60 dark:text-emerald-300 rounded-lg">
              히스토리에 저장되었습니다.
            </div>
          )}
        </div>
      </div>

      {/* 세부 공제 내역 상세 테이블 */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center justify-between">
          <span>상세 공제 내역 명세서</span>
          <span className="text-xs text-slate-400 font-normal">2025/2026 요율 기준</span>
        </h4>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 font-bold uppercase border-y border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3">공제 항목</th>
                <th className="px-4 py-3">산정 요율 및 기준</th>
                <th className="px-4 py-3 text-right">월 공제 금액</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              <tr>
                <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">국민연금</td>
                <td className="px-4 py-3 text-slate-500">4.5% (월 상한액 617만원 적용)</td>
                <td className="px-4 py-3 text-right font-bold text-slate-800 dark:text-slate-200">
                  {formatKrw(result.nationalPension)}
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">건강보험</td>
                <td className="px-4 py-3 text-slate-500">3.545% (근로자 부담분)</td>
                <td className="px-4 py-3 text-right font-bold text-slate-800 dark:text-slate-200">
                  {formatKrw(result.healthInsurance)}
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">장기요양보험</td>
                <td className="px-4 py-3 text-slate-500">건강보험료의 12.95%</td>
                <td className="px-4 py-3 text-right font-bold text-slate-800 dark:text-slate-200">
                  {formatKrw(result.longTermCare)}
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">고용보험</td>
                <td className="px-4 py-3 text-slate-500">0.9%</td>
                <td className="px-4 py-3 text-right font-bold text-slate-800 dark:text-slate-200">
                  {formatKrw(result.employmentInsurance)}
                </td>
              </tr>
              <tr className="bg-slate-50/50 dark:bg-slate-800/30">
                <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">근로소득세</td>
                <td className="px-4 py-3 text-slate-500">국세청 간이세액표 모의계산 (부양가족 {dependents}명)</td>
                <td className="px-4 py-3 text-right font-bold text-slate-800 dark:text-slate-200">
                  {formatKrw(result.incomeTax)}
                </td>
              </tr>
              <tr className="bg-slate-50/50 dark:bg-slate-800/30">
                <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">지방소득세</td>
                <td className="px-4 py-3 text-slate-500">근로소득세의 10%</td>
                <td className="px-4 py-3 text-right font-bold text-slate-800 dark:text-slate-200">
                  {formatKrw(result.localIncomeTax)}
                </td>
              </tr>
              <tr className="bg-blue-50/80 dark:bg-blue-950/40 font-bold border-t border-blue-200 dark:border-blue-900">
                <td className="px-4 py-3 text-blue-900 dark:text-blue-300">공제 합계</td>
                <td className="px-4 py-3 text-blue-700 dark:text-blue-400">4대보험 + 소득/지방세</td>
                <td className="px-4 py-3 text-right text-blue-900 dark:text-blue-300 font-black text-sm">
                  {formatKrw(result.totalDeduction)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
