import React, { useMemo, useState } from 'react';
import { FileText } from 'lucide-react';
import { SaveHistoryFn } from '../../types';
import { formatKrw, formatNum } from '../../utils/calculators';
import { usePendingHistoryRestore } from '../../utils/historyRestore';

interface Props {
  onSaveHistory: (title: string, summary: string, details: Record<string, string | number>) => void;
}

// 근로소득공제 (2025/2026 기준)
function earnedIncomeDeduction(gross: number): number {
  if (gross <= 5000000) return gross * 0.7;
  if (gross <= 15000000) return 3500000 + (gross - 5000000) * 0.4;
  if (gross <= 45000000) return 7500000 + (gross - 15000000) * 0.15;
  if (gross <= 100000000) return 12000000 + (gross - 45000000) * 0.05;
  return 14750000 + (gross - 100000000) * 0.02;
}

// 종합소득세 누진세율표 (2025/2026 기준)
function progressiveIncomeTax(base: number): number {
  const b = Math.max(0, base);
  if (b <= 14000000) return b * 0.06;
  if (b <= 50000000) return 840000 + (b - 14000000) * 0.15;
  if (b <= 88000000) return 6240000 + (b - 50000000) * 0.24;
  if (b <= 150000000) return 15360000 + (b - 88000000) * 0.35;
  if (b <= 300000000) return 37060000 + (b - 150000000) * 0.38;
  if (b <= 500000000) return 94060000 + (b - 300000000) * 0.4;
  if (b <= 1000000000) return 174060000 + (b - 500000000) * 0.42;
  return 384060000 + (b - 1000000000) * 0.45;
}

// 근로소득세액공제 (간이)
function earnedIncomeTaxCredit(calculatedTax: number, gross: number): number {
  const raw = calculatedTax <= 1300000 ? calculatedTax * 0.55 : 715000 + (calculatedTax - 1300000) * 0.3;
  const cap = gross <= 33000000 ? 740000 : 660000;
  return Math.min(raw, cap);
}

type CardType = 'credit' | 'debit';

export const YearEndTaxCalculator: React.FC<Props> = ({ onSaveHistory }) => {
  const saveHistory = onSaveHistory as SaveHistoryFn;
  const [grossSalary, setGrossSalary] = useState(45000000);
  const [dependents, setDependents] = useState(1);
  const [cardType, setCardType] = useState<CardType>('credit');
  const [cardUsage, setCardUsage] = useState(15000000);
  const [withheldTax, setWithheldTax] = useState(1500000);
  const [saved, setSaved] = useState(false);

  const result = useMemo(() => {
    const deduction = earnedIncomeDeduction(grossSalary);
    const earnedIncomeAmount = Math.max(0, grossSalary - deduction);

    const personalDeduction = Math.max(1, dependents) * 1500000;

    const cardDeductionRate = cardType === 'credit' ? 0.15 : 0.3;
    const minUsage = grossSalary * 0.25;
    const excessUsage = Math.max(0, cardUsage - minUsage);
    const cardDeductionRaw = excessUsage * cardDeductionRate;
    const cardDeduction = Math.min(cardDeductionRaw, 3000000);

    const totalDeductions = personalDeduction + cardDeduction;
    const taxBase = Math.max(0, earnedIncomeAmount - totalDeductions);

    const calculatedTax = progressiveIncomeTax(taxBase);
    const taxCredit = earnedIncomeTaxCredit(calculatedTax, grossSalary);
    const determinedIncomeTax = Math.max(0, Math.round(calculatedTax - taxCredit));
    const localIncomeTax = Math.round(determinedIncomeTax * 0.1);
    const totalDeterminedTax = determinedIncomeTax + localIncomeTax;

    const refundOrDue = withheldTax - totalDeterminedTax;

    return {
      earnedIncomeAmount: Math.round(earnedIncomeAmount),
      personalDeduction,
      cardDeduction: Math.round(cardDeduction),
      taxBase: Math.round(taxBase),
      calculatedTax: Math.round(calculatedTax),
      taxCredit: Math.round(taxCredit),
      determinedIncomeTax,
      localIncomeTax,
      totalDeterminedTax,
      refundOrDue,
    };
  }, [grossSalary, dependents, cardType, cardUsage, withheldTax]);

  usePendingHistoryRestore<{
    grossSalary: number;
    dependents: number;
    cardType: CardType;
    cardUsage: number;
    withheldTax: number;
  }>('yearEndTax', (restored) => {
    setGrossSalary(restored.grossSalary);
    setDependents(restored.dependents);
    setCardType(restored.cardType);
    setCardUsage(restored.cardUsage);
    setWithheldTax(restored.withheldTax);
  });

  const isRefund = result.refundOrDue >= 0;

  const handleSave = () => {
    saveHistory(
      '연말정산 예상 환급 계산기',
      `${isRefund ? '환급' : '추가납부'} 예상 ${formatKrw(Math.abs(result.refundOrDue))}`,
      {
        총급여: formatKrw(grossSalary),
        부양가족수: `${dependents}명`,
        카드유형: cardType === 'credit' ? '신용카드' : '체크카드/현금영수증',
        카드사용액: formatKrw(cardUsage),
        기납부세액: formatKrw(withheldTax),
        결정세액합계: formatKrw(result.totalDeterminedTax),
        예상결과: `${isRefund ? '환급' : '추가납부'} ${formatKrw(Math.abs(result.refundOrDue))}`,
      },
      { grossSalary, dependents, cardType, cardUsage, withheldTax }
    );
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-5">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <FileText className="w-5 h-5 text-cyan-500" />
          <span>연말정산 예상 환급 계산기</span>
        </h3>
        <button onClick={handleSave} className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold whitespace-nowrap" title="계산기록에서 다시 가져올 수 있습니다.">기록저장</button>
      </div>

      <div>
        <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
          <span>연간 총급여</span>
          <span className="font-bold text-cyan-600 dark:text-cyan-400">{formatKrw(grossSalary)}</span>
        </div>
        <input type="range" min="20000000" max="150000000" step="1000000" value={grossSalary} onChange={(e) => setGrossSalary(Number(e.target.value))} className="w-full accent-cyan-600 cursor-pointer" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            <span>부양가족 수 (본인 포함)</span>
            <span className="font-bold text-cyan-600 dark:text-cyan-400">{dependents}명</span>
          </div>
          <input type="range" min="1" max="8" value={dependents} onChange={(e) => setDependents(Number(e.target.value))} className="w-full accent-cyan-600 cursor-pointer" />
        </div>
        <div>
          <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            <span>기납부세액 (연간 원천징수)</span>
            <span className="font-bold text-cyan-600 dark:text-cyan-400">{formatKrw(withheldTax)}</span>
          </div>
          <input type="range" min="0" max="15000000" step="100000" value={withheldTax} onChange={(e) => setWithheldTax(Number(e.target.value))} className="w-full accent-cyan-600 cursor-pointer" />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">주로 사용한 카드 유형</label>
        <div className="grid grid-cols-2 gap-2">
          {(['credit', 'debit'] as CardType[]).map((t) => (
            <button
              key={t}
              onClick={() => setCardType(t)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold ${cardType === t ? 'bg-cyan-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
            >
              {t === 'credit' ? '신용카드 (15%)' : '체크카드/현금영수증 (30%)'}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
          <span>연간 카드 등 사용액</span>
          <span className="font-bold text-cyan-600 dark:text-cyan-400">{formatKrw(cardUsage)}</span>
        </div>
        <input type="range" min="0" max="60000000" step="500000" value={cardUsage} onChange={(e) => setCardUsage(Number(e.target.value))} className="w-full accent-cyan-600 cursor-pointer" />
      </div>

      <div className={`rounded-2xl p-4 border space-y-3 ${isRefund ? 'border-cyan-200 dark:border-cyan-900 bg-cyan-50/70 dark:bg-cyan-950/30' : 'border-red-200 dark:border-red-900 bg-red-50/70 dark:bg-red-950/30'}`}>
        <div>
          <div className={`text-xs font-semibold ${isRefund ? 'text-cyan-700 dark:text-cyan-300' : 'text-red-700 dark:text-red-300'}`}>{isRefund ? '예상 환급액' : '예상 추가납부액'}</div>
          <div className={`text-3xl font-black mt-1 ${isRefund ? 'text-cyan-900 dark:text-cyan-100' : 'text-red-900 dark:text-red-100'}`}>{formatKrw(Math.abs(result.refundOrDue))}</div>
        </div>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="rounded-xl bg-white/70 dark:bg-slate-900/40 p-3 border border-slate-100 dark:border-slate-800">
            <div className="text-slate-500 dark:text-slate-400 mb-1">과세표준</div>
            <div className="font-bold text-slate-800 dark:text-slate-100">{formatNum(result.taxBase)}원</div>
          </div>
          <div className="rounded-xl bg-white/70 dark:bg-slate-900/40 p-3 border border-slate-100 dark:border-slate-800">
            <div className="text-slate-500 dark:text-slate-400 mb-1">결정세액(소득세+지방세)</div>
            <div className="font-bold text-slate-800 dark:text-slate-100">{formatNum(result.totalDeterminedTax)}원</div>
          </div>
        </div>
        <div className="text-[11px] text-slate-500 dark:text-slate-400">본 계산은 근로소득공제·인적공제·신용카드공제·근로소득세액공제만 반영한 단순 모의계산입니다. 연금저축, 의료비, 보험료 등 다른 공제 항목은 반영되지 않아 실제 결과와 차이가 있을 수 있습니다.</div>
      </div>

      {saved && <div className="text-xs font-semibold text-center text-cyan-700 dark:text-cyan-300 bg-cyan-100/80 dark:bg-cyan-950/60 rounded-lg p-2">히스토리에 저장되었습니다.</div>}
    </div>
  );
};
