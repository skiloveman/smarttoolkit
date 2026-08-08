import React, { useMemo, useState } from 'react';
import { PiggyBank } from 'lucide-react';
import { SaveHistoryFn } from '../../types';
import { formatKrw, formatNum } from '../../utils/calculators';
import { usePendingHistoryRestore } from '../../utils/historyRestore';

interface Props {
  onSaveHistory: (title: string, summary: string, details: Record<string, string | number>) => void;
}

const taxPresets = [
  { id: 'general', label: '일반과세 (15.4%)', rate: 15.4 },
  { id: 'preferential', label: '세금우대 (9.5%)', rate: 9.5 },
  { id: 'none', label: '비과세 (0%)', rate: 0 },
] as const;

type TaxId = (typeof taxPresets)[number]['id'];
type DepositType = 'lump' | 'installment';
type InterestType = 'simple' | 'compound';

export const SavingsInterestCalculator: React.FC<Props> = ({ onSaveHistory }) => {
  const saveHistory = onSaveHistory as SaveHistoryFn;
  const [depositType, setDepositType] = useState<DepositType>('installment');
  const [interestType, setInterestType] = useState<InterestType>('simple');
  const [principal, setPrincipal] = useState(10000000);
  const [monthlyPayment, setMonthlyPayment] = useState(300000);
  const [rate, setRate] = useState(3.5);
  const [months, setMonths] = useState(12);
  const [taxId, setTaxId] = useState<TaxId>('general');
  const [saved, setSaved] = useState(false);

  const tax = taxPresets.find((t) => t.id === taxId) ?? taxPresets[0];

  const result = useMemo(() => {
    const r = rate / 100;

    if (depositType === 'lump') {
      const totalPrincipal = principal;
      const interest =
        interestType === 'simple'
          ? totalPrincipal * r * (months / 12)
          : totalPrincipal * (Math.pow(1 + r / 12, months) - 1);
      const taxAmount = Math.round(interest * (tax.rate / 100));
      const netInterest = Math.round(interest - taxAmount);
      return {
        totalPrincipal,
        preTaxInterest: Math.round(interest),
        taxAmount,
        netInterest,
        maturityAmount: totalPrincipal + netInterest,
      };
    }

    const totalPrincipal = monthlyPayment * months;
    const interest =
      interestType === 'simple'
        ? monthlyPayment * ((months * (months + 1)) / 2) * (r / 12)
        : (() => {
            let acc = 0;
            for (let n = 1; n <= months; n++) {
              acc += monthlyPayment * (Math.pow(1 + r / 12, months - n + 1) - 1);
            }
            return acc;
          })();
    const taxAmount = Math.round(interest * (tax.rate / 100));
    const netInterest = Math.round(interest - taxAmount);
    return {
      totalPrincipal,
      preTaxInterest: Math.round(interest),
      taxAmount,
      netInterest,
      maturityAmount: totalPrincipal + netInterest,
    };
  }, [depositType, interestType, principal, monthlyPayment, rate, months, tax]);

  usePendingHistoryRestore<{
    depositType: DepositType;
    interestType: InterestType;
    principal: number;
    monthlyPayment: number;
    rate: number;
    months: number;
    taxId: TaxId;
  }>('savingsInterest', (restored) => {
    setDepositType(restored.depositType);
    setInterestType(restored.interestType);
    setPrincipal(restored.principal);
    setMonthlyPayment(restored.monthlyPayment);
    setRate(restored.rate);
    setMonths(restored.months);
    setTaxId(restored.taxId);
  });

  const handleSave = () => {
    saveHistory(
      '예적금 이자 계산기',
      `만기수령액 ${formatKrw(result.maturityAmount)} (세후이자 ${formatKrw(result.netInterest)})`,
      {
        상품유형: depositType === 'lump' ? '예금(거치식)' : '적금(적립식)',
        이자방식: interestType === 'simple' ? '단리' : '복리',
        원금: depositType === 'lump' ? formatKrw(principal) : `월 ${formatKrw(monthlyPayment)}`,
        연이자율: `${rate}%`,
        가입기간: `${months}개월`,
        과세유형: tax.label,
        세전이자: formatKrw(result.preTaxInterest),
        이자과세: formatKrw(result.taxAmount),
        세후이자: formatKrw(result.netInterest),
        만기수령액: formatKrw(result.maturityAmount),
      },
      { depositType, interestType, principal, monthlyPayment, rate, months, taxId }
    );
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-5">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <PiggyBank className="w-5 h-5 text-rose-500" />
          <span>예적금 이자 계산기</span>
        </h3>
        <button onClick={handleSave} className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold whitespace-nowrap" title="계산기록에서 다시 가져올 수 있습니다.">기록저장</button>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">상품 유형</label>
        <div className="grid grid-cols-2 gap-2">
          {(['installment', 'lump'] as DepositType[]).map((t) => (
            <button
              key={t}
              onClick={() => setDepositType(t)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold ${depositType === t ? 'bg-rose-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
            >
              {t === 'installment' ? '적금 (매월 납입)' : '예금 (한 번에 예치)'}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">이자 계산 방식</label>
        <div className="grid grid-cols-2 gap-2">
          {(['simple', 'compound'] as InterestType[]).map((t) => (
            <button
              key={t}
              onClick={() => setInterestType(t)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold ${interestType === t ? 'bg-rose-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
            >
              {t === 'simple' ? '단리' : '월복리'}
            </button>
          ))}
        </div>
      </div>

      {depositType === 'lump' ? (
        <div>
          <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            <span>예치 원금</span>
            <span className="font-bold text-rose-600 dark:text-rose-400">{formatKrw(principal)}</span>
          </div>
          <input type="range" min="1000000" max="200000000" step="1000000" value={principal} onChange={(e) => setPrincipal(Number(e.target.value))} className="w-full accent-rose-600 cursor-pointer" />
        </div>
      ) : (
        <div>
          <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            <span>매월 납입액</span>
            <span className="font-bold text-rose-600 dark:text-rose-400">{formatKrw(monthlyPayment)}</span>
          </div>
          <input type="range" min="10000" max="3000000" step="10000" value={monthlyPayment} onChange={(e) => setMonthlyPayment(Number(e.target.value))} className="w-full accent-rose-600 cursor-pointer" />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            <span>연 이자율</span>
            <span className="font-bold text-rose-600 dark:text-rose-400">{rate}%</span>
          </div>
          <input type="range" min="0.5" max="8" step="0.1" value={rate} onChange={(e) => setRate(Number(e.target.value))} className="w-full accent-rose-600 cursor-pointer" />
        </div>
        <div>
          <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            <span>가입 기간</span>
            <span className="font-bold text-rose-600 dark:text-rose-400">{months}개월</span>
          </div>
          <input type="range" min="1" max="60" value={months} onChange={(e) => setMonths(Number(e.target.value))} className="w-full accent-rose-600 cursor-pointer" />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">이자 과세 유형</label>
        <div className="flex flex-wrap gap-2">
          {taxPresets.map((t) => (
            <button
              key={t.id}
              onClick={() => setTaxId(t.id)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold ${taxId === t.id ? 'bg-rose-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl p-4 border border-rose-200 dark:border-rose-900 bg-rose-50/70 dark:bg-rose-950/30 space-y-3">
        <div>
          <div className="text-xs text-rose-700 dark:text-rose-300 font-semibold">예상 만기 수령액</div>
          <div className="text-3xl font-black text-rose-900 dark:text-rose-100 mt-1">{formatKrw(result.maturityAmount)}</div>
        </div>
        <div className="grid grid-cols-3 gap-3 text-xs">
          <div className="rounded-xl bg-white/70 dark:bg-slate-900/40 p-3 border border-rose-100 dark:border-rose-900/60">
            <div className="text-slate-500 dark:text-slate-400 mb-1">원금 합계</div>
            <div className="font-bold text-slate-800 dark:text-slate-100">{formatNum(result.totalPrincipal)}원</div>
          </div>
          <div className="rounded-xl bg-white/70 dark:bg-slate-900/40 p-3 border border-rose-100 dark:border-rose-900/60">
            <div className="text-slate-500 dark:text-slate-400 mb-1">세전 이자</div>
            <div className="font-bold text-slate-800 dark:text-slate-100">{formatNum(result.preTaxInterest)}원</div>
          </div>
          <div className="rounded-xl bg-white/70 dark:bg-slate-900/40 p-3 border border-rose-100 dark:border-rose-900/60">
            <div className="text-slate-500 dark:text-slate-400 mb-1">세후 이자</div>
            <div className="font-bold text-slate-800 dark:text-slate-100">{formatNum(result.netInterest)}원</div>
          </div>
        </div>
      </div>

      {saved && <div className="text-xs font-semibold text-center text-rose-700 dark:text-rose-300 bg-rose-100/80 dark:bg-rose-950/60 rounded-lg p-2">히스토리에 저장되었습니다.</div>}
    </div>
  );
};
