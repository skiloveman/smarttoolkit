import React, { useState } from 'react';
import { Landmark, Copy, Check, Calendar, Table, Percent } from 'lucide-react';
import { DefaultValueInput } from '../DefaultValueInput';
import { SaveHistoryFn } from '../../types';
import { formatKrw, formatNum } from '../../utils/calculators';
import { usePendingHistoryRestore } from '../../utils/historyRestore';

interface Props {
  onSaveHistory: (title: string, summary: string, details: Record<string, string | number>) => void;
}

type RepaymentType = 'equalPrincipalInterest' | 'equalPrincipal' | 'bullet'; // 원리금균등, 원금균등, 만기일시

export const LoanCalculator: React.FC<Props> = ({ onSaveHistory }) => {
  const saveHistory = onSaveHistory as SaveHistoryFn;
  const [loanAmount, setLoanAmount] = useState<number>(100000000); // 1억 원
  const [loanAmountText, setLoanAmountText] = useState('100000000');
  const [annualRate, setAnnualRate] = useState<number>(4.5); // 4.5%
  const [annualRateText, setAnnualRateText] = useState('4.5');
  const [termMonths, setTermMonths] = useState<number>(36); // 36개월 (3년)
  const [termMonthsText, setTermMonthsText] = useState('36');
  const [graceMonths, setGraceMonths] = useState<number>(0); // 거치기간 0개월
  const [graceMonthsText, setGraceMonthsText] = useState('0');
  const [repaymentType, setRepaymentType] = useState<RepaymentType>('equalPrincipalInterest');

  const [showSchedule, setShowSchedule] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [saved, setSaved] = useState<boolean>(false);

  // Calculation Logic
  const monthlyRate = annualRate / 100 / 12;

  interface RepaymentRow {
    month: number;
    payment: number;
    principal: number;
    interest: number;
    remaining: number;
  }

  const schedule: RepaymentRow[] = [];
  let totalInterest = 0;
  let totalRepayment = 0;

  let currentBalance = loanAmount;
  const activeRepaymentMonths = termMonths - graceMonths;

  for (let m = 1; m <= termMonths; m++) {
    let interest = Math.round(currentBalance * monthlyRate);
    let principal = 0;

    if (m <= graceMonths) {
      // 거치기간: 이자만 납부
      principal = 0;
    } else {
      if (repaymentType === 'equalPrincipalInterest') {
        // 원리금균등상환
        if (monthlyRate === 0) {
          principal = Math.round(loanAmount / activeRepaymentMonths);
        } else {
          const pmnt =
            (loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, activeRepaymentMonths))) /
            (Math.pow(1 + monthlyRate, activeRepaymentMonths) - 1);
          principal = Math.round(pmnt - interest);
        }
      } else if (repaymentType === 'equalPrincipal') {
        // 원금균등상환
        principal = Math.round(loanAmount / activeRepaymentMonths);
      } else if (repaymentType === 'bullet') {
        // 만기일시상환
        if (m === termMonths) {
          principal = currentBalance;
        } else {
          principal = 0;
        }
      }
    }

    if (m === termMonths) {
      principal = currentBalance; // 조정
    }

    let payment = principal + interest;
    let remaining = Math.max(0, currentBalance - principal);
    if (m === termMonths) remaining = 0;

    schedule.push({
      month: m,
      payment,
      principal,
      interest,
      remaining,
    });

    totalInterest += interest;
    totalRepayment += payment;
    currentBalance = remaining;
  }

  const firstMonthPayment = schedule[0]?.payment || 0;
  const lastMonthPayment = schedule[schedule.length - 1]?.payment || 0;

  usePendingHistoryRestore<{
    loanAmount: number;
    annualRate: number;
    termMonths: number;
    graceMonths: number;
    repaymentType: RepaymentType;
  }>('loan', (restored) => {
    setLoanAmount(restored.loanAmount);
    setLoanAmountText(String(restored.loanAmount));
    setAnnualRate(restored.annualRate);
    setAnnualRateText(String(restored.annualRate));
    setTermMonths(restored.termMonths);
    setTermMonthsText(String(restored.termMonths));
    setGraceMonths(restored.graceMonths);
    setGraceMonthsText(String(restored.graceMonths));
    setRepaymentType(restored.repaymentType);
  });

  const handleCopy = () => {
    const typeMap = {
      equalPrincipalInterest: '원리금균등상환',
      equalPrincipal: '원금균등상환',
      bullet: '만기일시상환',
    };

    const text = `[대출 이자 및 상환금 계산 결과]
• 대출금액: ${formatKrw(loanAmount)}
• 연 이자율: ${annualRate}%
• 대출기간: ${termMonths}개월 (${(termMonths / 12).toFixed(1)}년)
• 상환방식: ${typeMap[repaymentType]}
• 거치기간: ${graceMonths}개월
------------------------------------
• 첫달 월 상환액: ${formatKrw(firstMonthPayment)}
• 총 대출 이자: ${formatKrw(totalInterest)}
• 총 상환금액 (원금+이자): ${formatKrw(totalRepayment)}
- 생활 계산기 (https://www.smart-toolkit.com)`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    const typeMap = {
      equalPrincipalInterest: '원리금균등',
      equalPrincipal: '원금균등',
      bullet: '만기일시',
    };

    saveHistory(
      '대출 이자 계산',
      `대출 ${formatKrw(loanAmount)} (${annualRate}%, ${termMonths}개월, ${typeMap[repaymentType]}) = 총 이자 ${formatKrw(totalInterest)}`,
      {
        대출금액: formatKrw(loanAmount),
        연이자율: `${annualRate}%`,
        대출기간: `${termMonths}개월`,
        상환방식: typeMap[repaymentType],
        첫달상환액: formatKrw(firstMonthPayment),
        총대출이자: formatKrw(totalInterest),
        총상환금액: formatKrw(totalRepayment),
      },
      {
        loanAmount,
        annualRate,
        termMonths,
        graceMonths,
        repaymentType,
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
            <Landmark className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>대출 이자 & 상환금 계산기</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            원리금균등·원금균등·만기일시 상환 방식별 월 상환액 및 총 이자 정확 산출
          </p>
        </div>

        {/* Repayment Type Tabs */}
        <div className="flex rounded-lg bg-slate-100 dark:bg-slate-800 p-1 text-xs font-semibold">
          {[
            { id: 'equalPrincipalInterest', label: '원리금균등' },
            { id: 'equalPrincipal', label: '원금균등' },
            { id: 'bullet', label: '만기일시' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setRepaymentType(t.id as RepaymentType)}
              className={`px-3 py-1.5 rounded-md transition-all ${
                repaymentType === t.id
                  ? 'bg-indigo-600 text-white font-bold shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-800'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Input Parameters */}
        <div className="space-y-4">
          {/* Loan Amount Input */}
          <div>
            <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              <span>대출 원금 (원)</span>
              <span className="text-indigo-600 font-bold">{formatKrw(loanAmount)}</span>
            </div>
            <DefaultValueInput
              type="number"
              step="1000000"
              value={loanAmountText}
              defaultValueLabel={100000000}
              onValueChange={(value) => {
                setLoanAmountText(value);
                const n = Number(value);
                if (value.trim() !== '' && !Number.isNaN(n)) setLoanAmount(Math.max(0, n));
              }}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 p-3 text-lg font-black text-slate-800 dark:text-slate-200"
            />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {[10000000, 30000000, 50000000, 100000000, 300000000].map((amt) => (
                <button
                  key={amt}
                  onClick={() => {
                    setLoanAmount(amt);
                    setLoanAmountText(String(amt));
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                    loanAmount === amt ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {amt >= 100000000 ? `${amt / 100000000}억` : `${amt / 10000}만`}원
                </button>
              ))}
            </div>
          </div>

          {/* Interest Rate & Term */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                연 이자율 (%)
              </label>
              <DefaultValueInput
                type="number"
                step="0.1"
                value={annualRateText}
                defaultValueLabel={4.5}
                onValueChange={(value) => {
                  setAnnualRateText(value);
                  const n = Number(value);
                  if (value.trim() !== '' && !Number.isNaN(n)) setAnnualRate(Math.max(0, n));
                }}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 p-2.5 text-base font-bold text-slate-800 dark:text-slate-200"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                대출 기간 (개월)
              </label>
              <DefaultValueInput
                type="number"
                step="12"
                value={termMonthsText}
                defaultValueLabel={36}
                onValueChange={(value) => {
                  setTermMonthsText(value);
                  const n = Number(value);
                  if (value.trim() !== '' && !Number.isNaN(n)) setTermMonths(Math.max(1, n));
                }}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 p-2.5 text-base font-bold text-slate-800 dark:text-slate-200"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {[12, 24, 36, 60, 120, 240, 360].map((m) => (
              <button
                key={m}
                onClick={() => {
                  setTermMonths(m);
                  setTermMonthsText(String(m));
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                  termMonths === m ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                {m / 12}년 ({m}개월)
              </button>
            ))}
          </div>

          {/* Grace Period */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              거치 기간 (이자만 내는 기간, 개월)
            </label>
            <DefaultValueInput
              type="number"
              value={graceMonthsText}
              defaultValueLabel={0}
              onValueChange={(value) => {
                setGraceMonthsText(value);
                const n = Number(value);
                if (value.trim() !== '' && !Number.isNaN(n)) setGraceMonths(Math.min(termMonths - 1, Math.max(0, n)));
              }}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 p-2 text-xs font-bold text-slate-800 dark:text-slate-200"
            />
          </div>
        </div>

        {/* Output Cards */}
        <div className="p-6 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-indigo-200/80 dark:border-indigo-900 pb-3">
              <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
                첫 달 예상 상환금 (원금 + 이자)
              </span>
              <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                {repaymentType === 'equalPrincipalInterest' ? '매월 동일 금액' : '월별 변동'}
              </span>
            </div>

            <div className="text-3xl sm:text-4xl font-black text-indigo-950 dark:text-indigo-100 mt-3">
              {formatKrw(firstMonthPayment)}
            </div>

            <div className="mt-5 space-y-2 text-xs text-slate-600 dark:text-slate-300 border-t border-indigo-200/60 dark:border-indigo-900/60 pt-3">
              <div className="flex justify-between">
                <span>총 대출 원금:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{formatKrw(loanAmount)}</span>
              </div>
              <div className="flex justify-between text-rose-600 dark:text-rose-400">
                <span>총 발생 이자 (이자율 {annualRate}%):</span>
                <span className="font-bold">+{formatKrw(totalInterest)}</span>
              </div>
              <div className="flex justify-between text-indigo-900 dark:text-indigo-200 font-bold text-sm pt-2 border-t border-indigo-200 dark:border-indigo-800">
                <span>총 상환 금액 (원금 + 이자):</span>
                <span>{formatKrw(totalRepayment)}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
            <button
              onClick={() => setShowSchedule(!showSchedule)}
              className="px-3 py-2 rounded-xl bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-200 text-xs font-bold flex items-center gap-1 hover:bg-indigo-200 transition-colors"
            >
              <Table className="w-4 h-4" />
              <span>{showSchedule ? '상환표 닫기' : '월별 상환표 보기'}</span>
            </button>

            <div className="flex gap-2">
              <button
                onClick={handleSave}
                className="px-2.5 py-1.5.5 rounded-xl bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 text-slate-600 dark:text-slate-300 hover:bg-indigo-100/50 transition-colors text-xs font-semibold whitespace-nowrap"
                title="계산기록에서 다시 가져올 수 있습니다."
              >기록저장</button>

              <button
                onClick={handleCopy}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? '복사완료' : '결과 복사'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Schedule Table */}
      {showSchedule && (
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 animate-in fade-in duration-150">
          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-3">
            회차별 월 상환 상세 내역 (총 {termMonths}회차)
          </h4>
          <div className="max-h-64 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-100 dark:bg-slate-800 sticky top-0 text-slate-700 dark:text-slate-300 font-bold">
                <tr>
                  <th className="p-2.5 text-center">회차</th>
                  <th className="p-2.5 text-right">상환금액</th>
                  <th className="p-2.5 text-right">납입원금</th>
                  <th className="p-2.5 text-right">대출이자</th>
                  <th className="p-2.5 text-right">대출잔액</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {schedule.map((row) => (
                  <tr key={row.month} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-2 text-center font-medium text-slate-600 dark:text-slate-400">
                      {row.month}회차
                    </td>
                    <td className="p-2 text-right font-bold text-slate-900 dark:text-slate-100">
                      {formatNum(row.payment)}원
                    </td>
                    <td className="p-2 text-right text-slate-600 dark:text-slate-400">
                      {formatNum(row.principal)}원
                    </td>
                    <td className="p-2 text-right text-rose-600 dark:text-rose-400">
                      {formatNum(row.interest)}원
                    </td>
                    <td className="p-2 text-right font-medium text-slate-500">
                      {formatNum(row.remaining)}원
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
