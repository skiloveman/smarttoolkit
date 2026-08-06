import React, { useState } from 'react';
import { Percent, Copy, Check, Tag, BookmarkPlus } from 'lucide-react';
import { DefaultValueInput } from '../DefaultValueInput';
import { SaveHistoryFn } from '../../types';
import { formatKrw, formatNum } from '../../utils/calculators';
import { usePendingHistoryRestore } from '../../utils/historyRestore';

interface Props {
  onSaveHistory: (title: string, summary: string, details: Record<string, string | number>) => void;
}

export const PercentCalculator: React.FC<Props> = ({ onSaveHistory }) => {
  const saveHistory = onSaveHistory as SaveHistoryFn;
  // Discount Calculator
  const [originalPrice, setOriginalPrice] = useState<number>(50000);
  const [discountPercent, setDiscountPercent] = useState<number>(20);

  // Percent Ratio Calculator
  const [baseVal, setBaseVal] = useState<number>(100000);
  const [ratioVal, setRatioVal] = useState<number>(15);

  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  usePendingHistoryRestore<{
    originalPrice: number;
    discountPercent: number;
    baseVal: number;
    ratioVal: number;
  }>('percent', (restored) => {
    setOriginalPrice(restored.originalPrice);
    setDiscountPercent(restored.discountPercent);
    setBaseVal(restored.baseVal);
    setRatioVal(restored.ratioVal);
  });

  // Discount Math
  const discountAmount = Math.round((originalPrice * discountPercent) / 100);
  const finalPrice = originalPrice - discountAmount;

  // Ratio Math
  const ratioResult = Math.round((baseVal * ratioVal) / 100);

  const handleCopy = () => {
    const text = `[퍼센트 & 할인율 계산]
• ${formatKrw(originalPrice)}에서 ${discountPercent}% 할인 ➔ 최종가격: ${formatKrw(finalPrice)} (할인액: ${formatKrw(discountAmount)})
• ${formatNum(baseVal)}의 ${ratioVal}% ➔ ${formatNum(ratioResult)}
- 생활 계산기 (https://ais-dev-mqxu6js2rqs5gficbwuedy-53763444336.asia-northeast1.run.app)`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    saveHistory('할인율/퍼센트 계산', `${formatKrw(originalPrice)}의 ${discountPercent}% 할인 = ${formatKrw(finalPrice)}`, {
      원가: formatKrw(originalPrice),
      할인율: `${discountPercent}%`,
      할인금액: formatKrw(discountAmount),
      최종할인가격: formatKrw(finalPrice),
    }, {
      originalPrice,
      discountPercent,
      baseVal,
      ratioVal,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Discount Calculator */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Tag className="w-5 h-5 text-rose-500" />
            <span>세일 할인 가격 계산기</span>
          </h3>
          <span className="text-xs text-rose-600 font-semibold">쇼핑 필수</span>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            원래 가격 (원)
          </label>
          <DefaultValueInput
            type="number"
            step="1000"
            value={originalPrice}
            defaultValueLabel={50000}
            onValueChange={(value) => setOriginalPrice(Math.max(0, Number(value) || 0))}
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 p-2.5 text-sm font-bold text-slate-800 dark:text-slate-200"
          />
        </div>

        <div>
          <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            <span>할인율 (%)</span>
            <span className="text-rose-600 font-bold">{discountPercent}%</span>
          </div>
          <input
            type="range"
            min="1"
            max="90"
            value={discountPercent}
            onChange={(e) => setDiscountPercent(Number(e.target.value))}
            className="w-full accent-rose-500 cursor-pointer"
          />
          <div className="flex flex-wrap gap-1.5 mt-2">
            {[10, 20, 30, 40, 50, 70].map((d) => (
              <button
                key={d}
                onClick={() => setDiscountPercent(d)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                  discountPercent === d ? 'bg-rose-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
                }`}
              >
                {d}%
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 space-y-1">
          <div className="flex justify-between text-xs text-rose-700 dark:text-rose-300">
            <span>할인 절감 금액</span>
            <span className="font-bold">-{formatKrw(discountAmount)}</span>
          </div>
          <div className="text-xs font-bold text-rose-600">최종 할인가</div>
          <div className="text-3xl font-black text-rose-900 dark:text-rose-200">{formatKrw(finalPrice)}</div>
        </div>
      </div>

      {/* Percent Ratio Calculator */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Percent className="w-5 h-5 text-purple-500" />
            <span>비율 (%) 계산기</span>
          </h3>
          <span className="text-xs text-purple-600 font-semibold">비율/비중</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              전체 값
            </label>
            <DefaultValueInput
              type="number"
              value={baseVal}
              defaultValueLabel={100000}
              onValueChange={(value) => setBaseVal(Math.max(0, Number(value) || 0))}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 p-2.5 text-sm font-bold text-slate-800 dark:text-slate-200"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              비율 (%)
            </label>
            <DefaultValueInput
              type="number"
              value={ratioVal}
              defaultValueLabel={15}
              onValueChange={(value) => setRatioVal(Number(value) || 0)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 p-2.5 text-sm font-bold text-slate-800 dark:text-slate-200"
            />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-purple-50/80 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900 text-center">
          <div className="text-xs text-purple-600 dark:text-purple-400 font-semibold">
            {formatNum(baseVal)} 의 {ratioVal}% 는?
          </div>
          <div className="text-3xl font-black text-purple-900 dark:text-purple-200 mt-1">
            {formatNum(ratioResult)}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={handleSave}
            className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600"
            title="저장"
          >
            <BookmarkPlus className="w-4 h-4" />
          </button>
          <button
            onClick={handleCopy}
            className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold flex items-center gap-1"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? '복사완료' : '결과 복사'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
