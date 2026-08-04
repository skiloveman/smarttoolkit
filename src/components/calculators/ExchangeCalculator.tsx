import React, { useState, useMemo } from 'react';
import { calculateExchange, DEFAULT_CURRENCIES, formatNum } from '../../utils/calculators';
import { ExchangeInput } from '../../types';
import { ArrowLeftRight, Copy, Check, RefreshCw, Edit2, BookmarkPlus } from 'lucide-react';

interface Props {
  onSaveHistory: (title: string, summary: string, details: Record<string, string | number>) => void;
}

export const ExchangeCalculator: React.FC<Props> = ({ onSaveHistory }) => {
  const [fromCode, setFromCode] = useState<string>('USD');
  const [toCode, setToCode] = useState<string>('KRW');
  const [amount, setAmount] = useState<number>(100);
  const [customRate, setCustomRate] = useState<number | undefined>(undefined);
  const [isEditingRate, setIsEditingRate] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  const exchangeInput: ExchangeInput = useMemo(
    () => ({
      fromCode,
      toCode,
      amount,
      customRate: isEditingRate ? customRate : undefined,
    }),
    [fromCode, toCode, amount, customRate, isEditingRate]
  );

  const result = useMemo(() => calculateExchange(exchangeInput, DEFAULT_CURRENCIES), [exchangeInput]);

  const fromCurr = DEFAULT_CURRENCIES.find((c) => c.code === fromCode) || DEFAULT_CURRENCIES[1];
  const toCurr = DEFAULT_CURRENCIES.find((c) => c.code === toCode) || DEFAULT_CURRENCIES[0];

  const handleSwap = () => {
    setFromCode(toCode);
    setToCode(fromCode);
  };

  const handleCopy = () => {
    const text = `[환율 계산 결과]
• 환산 기준: ${fromCurr.flag} ${amount} ${fromCode} ➔ ${toCurr.flag} ${result.convertedAmount} ${toCode}
• 적용 환율: 1 ${fromCode} = ${result.appliedRate} ${toCode}
- 생활 계산기 (https://ais-dev-mqxu6js2rqs5gficbwuedy-53763444336.asia-northeast1.run.app)`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    onSaveHistory(
      '환율 계산 결과',
      `${fromCurr.flag} ${amount} ${fromCode} = ${toCurr.flag} ${result.convertedAmount} ${toCode}`,
      {
        '보내는 통화': `${fromCurr.flag} ${amount} ${fromCode}`,
        '받는 통화': `${toCurr.flag} ${result.convertedAmount} ${toCode}`,
        적용환율: `1 ${fromCode} = ${result.appliedRate} ${toCode}`,
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
              <ArrowLeftRight className="w-5 h-5 text-indigo-500" />
              <span>통화 선택 및 금액 입력</span>
            </h3>
            <span className="text-xs text-slate-400">매매기준율 기준</span>
          </div>

          {/* Currency Selectors & Swap Button */}
          <div className="grid grid-cols-1 sm:grid-cols-11 gap-3 items-center">
            {/* From Currency */}
            <div className="sm:col-span-5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                기준 통화 (From)
              </label>
              <select
                value={fromCode}
                onChange={(e) => setFromCode(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 px-3 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none"
              >
                {DEFAULT_CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.code} ({c.name})
                  </option>
                ))}
              </select>
            </div>

            {/* Swap Button */}
            <div className="sm:col-span-1 flex justify-center pt-4 sm:pt-0">
              <button
                onClick={handleSwap}
                className="p-2.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-600 dark:text-slate-300 hover:text-indigo-600 transition-colors shadow-xs"
                title="통화 맞바꾸기"
              >
                <ArrowLeftRight className="w-4 h-4" />
              </button>
            </div>

            {/* To Currency */}
            <div className="sm:col-span-5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                목표 통화 (To)
              </label>
              <select
                value={toCode}
                onChange={(e) => setToCode(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 px-3 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none"
              >
                {DEFAULT_CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.code} ({c.name})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              환산 금액 입력 ({fromCurr.symbol})
            </label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Math.max(0, Number(e.target.value)))}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 px-4 py-3 text-xl font-black text-slate-900 dark:text-slate-100 focus:outline-none"
              />
              <span className="absolute right-4 top-3.5 text-sm font-bold text-slate-400">
                {fromCurr.code}
              </span>
            </div>

            {/* Quick Amount Buttons */}
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {[10, 50, 100, 500, 1000, 5000].map((val) => (
                <button
                  key={val}
                  onClick={() => setAmount(val)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                    amount === val
                      ? 'bg-indigo-600 text-white font-semibold'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {formatNum(val)} {fromCurr.code}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Rate Edit Option */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs">
              <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Edit2 className="w-3.5 h-3.5 text-indigo-500" />
                <span>커스텀 적용 환율 직접 입력</span>
              </label>
              <input
                type="checkbox"
                checked={isEditingRate}
                onChange={(e) => {
                  setIsEditingRate(e.target.checked);
                  if (e.target.checked && !customRate) {
                    setCustomRate(result.appliedRate);
                  }
                }}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
            </div>
            {isEditingRate && (
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="number"
                  step="0.01"
                  value={customRate ?? result.appliedRate}
                  onChange={(e) => setCustomRate(Number(e.target.value))}
                  className="w-40 rounded-lg border border-slate-300 dark:border-slate-700 p-2 text-xs font-bold text-slate-800 dark:text-slate-200"
                />
                <span className="text-xs text-slate-500">
                  1 {fromCode} 당 {toCode}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right Result Card (5 cols) */}
        <div className="lg:col-span-5 rounded-2xl border border-indigo-200 dark:border-indigo-900/60 bg-gradient-to-br from-indigo-50/70 via-white to-slate-50 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/30 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 tracking-wider uppercase">
                환율 변환 결과
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSave}
                  className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-indigo-600 transition-colors"
                  title="저장"
                >
                  <BookmarkPlus className="w-4 h-4" />
                </button>
                <button
                  onClick={handleCopy}
                  className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1 transition-all"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? '복사완료' : '결과 복사'}</span>
                </button>
              </div>
            </div>

            <div className="mb-6">
              <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-baseline gap-2">
                <span>{toCurr.flag}</span>
                <span>
                  {toCurr.symbol} {formatNum(result.convertedAmount)}
                </span>
                <span className="text-sm font-semibold text-slate-500">{toCode}</span>
              </div>
              <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <span>적용 환율: 1 {fromCode} = </span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">
                  {result.appliedRate} {toCode}
                </span>
              </div>
            </div>

            {/* Major Rates Quick List */}
            <div className="space-y-2 text-xs">
              <div className="font-semibold text-slate-700 dark:text-slate-300 mb-1">
                주요 통화 원화(KRW) 매매기준율
              </div>
              {DEFAULT_CURRENCIES.slice(1, 5).map((c) => (
                <div
                  key={c.code}
                  className="flex justify-between items-center p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50"
                >
                  <span className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                    <span>{c.flag}</span>
                    <span>{c.code}</span>
                    <span className="text-[10px] text-slate-400">({c.name})</span>
                  </span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {c.rateToKrw} 원
                  </span>
                </div>
              ))}
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
