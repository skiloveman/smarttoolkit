import React, { useState, useMemo } from 'react';
import { calculateVat, formatKrw, formatNum } from '../../utils/calculators';
import { VatInput, SaveHistoryFn } from '../../types';
import { Receipt, Copy, Check, BookmarkPlus } from 'lucide-react';
import { DefaultValueInput } from '../DefaultValueInput';
import { usePendingHistoryRestore } from '../../utils/historyRestore';

interface Props {
  onSaveHistory: (title: string, summary: string, details: Record<string, string | number>) => void;
}

export const VatCalculator: React.FC<Props> = ({ onSaveHistory }) => {
  const saveHistory = onSaveHistory as SaveHistoryFn;
  const [mode, setMode] = useState<'fromSupply' | 'fromTotal'>('fromSupply');
  const [amount, setAmount] = useState<number>(1000000); // 1,000,000 KRW default
  const [vatRate, setVatRate] = useState<number>(10);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const vatInput: VatInput = useMemo(
    () => ({
      mode,
      amount,
      vatRate,
    }),
    [mode, amount, vatRate]
  );

  const result = useMemo(() => calculateVat(vatInput), [vatInput]);

  usePendingHistoryRestore<{
    mode: 'fromSupply' | 'fromTotal';
    amount: number;
    vatRate: number;
  }>('vat', (restored) => {
    setMode(restored.mode);
    setAmount(restored.amount);
    setVatRate(restored.vatRate);
  });

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSave = () => {
    saveHistory(
      '부가세 계산 결과',
      `공급가액: ${formatKrw(result.supplyValue)} / 부가세: ${formatKrw(result.vatAmount)} / 합계: ${formatKrw(result.totalAmount)}`,
      {
        '입력 방식': mode === 'fromSupply' ? '공급가액 입력' : '합계금액(공급대가) 입력',
        공급가액: formatKrw(result.supplyValue),
        '부가가치세 (10%)': formatKrw(result.vatAmount),
        합계금액: formatKrw(result.totalAmount),
      },
      { mode, amount, vatRate }
    );
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const presets = [100000, 500000, 1000000, 3000000, 5000000, 10000000];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Inputs (6 cols) */}
        <div className="lg:col-span-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Receipt className="w-5 h-5 text-blue-500" />
              <span>금액 및 모드 설정</span>
            </h3>
            <div className="flex rounded-lg bg-slate-100 dark:bg-slate-800 p-1 text-xs font-semibold">
              <button
                onClick={() => setMode('fromSupply')}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  mode === 'fromSupply'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                공급가액 기준
              </button>
              <button
                onClick={() => setMode('fromTotal')}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  mode === 'fromTotal'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                합계금액 기준
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              {mode === 'fromSupply' ? '공급가액 (세전 금액)' : '합계금액 (세금 포함 총액)'}
            </label>
            <div className="relative">
              <DefaultValueInput
                type="number"
                step="10000"
                value={amount}
                defaultValueLabel={1000000}
                onValueChange={(value) => setAmount(Math.max(0, Number(value) || 0))}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 px-4 py-3 text-lg font-black text-slate-900 dark:text-slate-100 focus:outline-none pr-12"
              />
              <span className="absolute right-4 top-4 text-xs font-semibold text-slate-400">원</span>
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {presets.map((val) => (
                <button
                  key={val}
                  onClick={() => setAmount(val)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                    amount === val
                      ? 'bg-blue-600 text-white font-semibold'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {formatNum(val / 10000)}만원
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              부가가치세율 (%)
            </label>
            <DefaultValueInput
              type="number"
              value={vatRate}
              defaultValueLabel={10}
              onValueChange={(value) => setVatRate(Number(value) || 0)}
              className="w-24 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none"
            />
          </div>
        </div>

        {/* Right Result Cards (6 cols) */}
        <div className="lg:col-span-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400 tracking-wider uppercase">
                부가가치세 산출 내역
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSave}
                  className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-blue-600 transition-colors"
                  title="저장"
                >
                  <BookmarkPlus className="w-4 h-4" />
                </button>
                <button
                  onClick={() =>
                    copyToClipboard(
                      `공급가액: ${formatKrw(result.supplyValue)} | 부가세: ${formatKrw(result.vatAmount)} | 합계: ${formatKrw(result.totalAmount)}`,
                      'full'
                    )
                  }
                  className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1 transition-all"
                >
                  {copiedField === 'full' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedField === 'full' ? '전체복사 완료' : '전체 복사'}</span>
                </button>
              </div>
            </div>

            {/* Itemized Output Cards */}
            <div className="space-y-3">
              {/* Supply Value */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">공급가액 (순수가격)</div>
                  <div className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                    {formatKrw(result.supplyValue)}
                  </div>
                </div>
                <button
                  onClick={() => copyToClipboard(result.supplyValue.toString(), 'supply')}
                  className="p-2 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors"
                  title="공급가액 복사"
                >
                  {copiedField === 'supply' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              {/* VAT Amount */}
              <div className="p-4 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-blue-600 dark:text-blue-400">부가가치세 (10%)</div>
                  <div className="text-xl font-bold text-blue-900 dark:text-blue-200 mt-0.5">
                    {formatKrw(result.vatAmount)}
                  </div>
                </div>
                <button
                  onClick={() => copyToClipboard(result.vatAmount.toString(), 'vat')}
                  className="p-2 rounded-lg text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                  title="부가세 복사"
                >
                  {copiedField === 'vat' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              {/* Total Amount */}
              <div className="p-4 rounded-xl bg-slate-900 text-white dark:bg-slate-800 flex items-center justify-between shadow-xs">
                <div>
                  <div className="text-xs font-semibold text-slate-400">합계금액 (공급대가)</div>
                  <div className="text-2xl font-black mt-0.5">{formatKrw(result.totalAmount)}</div>
                </div>
                <button
                  onClick={() => copyToClipboard(result.totalAmount.toString(), 'total')}
                  className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  title="합계금액 복사"
                >
                  {copiedField === 'total' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
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
    </div>
  );
};
