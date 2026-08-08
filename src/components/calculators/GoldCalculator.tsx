import React, { useState } from 'react';
import { Sparkle, Copy, Check, Coins, ArrowLeftRight } from 'lucide-react';
import { DefaultValueInput } from '../DefaultValueInput';
import { SaveHistoryFn } from '../../types';
import { formatKrw, formatNum } from '../../utils/calculators';
import { usePendingHistoryRestore } from '../../utils/historyRestore';

interface Props {
  onSaveHistory: (title: string, summary: string, details: Record<string, string | number>) => void;
}

export const GoldCalculator: React.FC<Props> = ({ onSaveHistory }) => {
  const saveHistory = onSaveHistory as SaveHistoryFn;
  const [tradeMode, setTradeMode] = useState<'buy' | 'sell'>('buy'); // 살 때 vs 팔 때
  const [goldType, setGoldType] = useState<'24k' | '18k' | '14k' | 'platinum' | 'silver'>('24k');
  const [weightUnit, setWeightUnit] = useState<'don' | 'gram' | 'nyang' | 'oz'>('don');
  const [weightVal, setWeightVal] = useState<number>(1); // default 1돈

  // Standard 24K Market Price per 1 don (3.75g) in KRW
  const [ratePerDon, setRatePerDon] = useState<number>(450000);
  const [laborFee, setLaborFee] = useState<number>(30000); // 세공비 (살 때)
  const [includeVat, setIncludeVat] = useState<boolean>(true); // 부가세 10% (살 때)

  const [copied, setCopied] = useState<boolean>(false);
  const [saved, setSaved] = useState<boolean>(false);

  usePendingHistoryRestore<{
    tradeMode: 'buy' | 'sell';
    goldType: '24k' | '18k' | '14k' | 'platinum' | 'silver';
    weightUnit: 'don' | 'gram' | 'nyang' | 'oz';
    weightVal: number;
    ratePerDon: number;
    laborFee: number;
    includeVat: boolean;
  }>('gold', (restored) => {
    setTradeMode(restored.tradeMode);
    setGoldType(restored.goldType);
    setWeightUnit(restored.weightUnit);
    setWeightVal(restored.weightVal);
    setRatePerDon(restored.ratePerDon);
    setLaborFee(restored.laborFee);
    setIncludeVat(restored.includeVat);
  });

  // Convert weight to '돈' (3.75g)
  let totalDon = weightVal;
  if (weightUnit === 'gram') {
    totalDon = weightVal / 3.75;
  } else if (weightUnit === 'nyang') {
    totalDon = weightVal * 10;
  } else if (weightUnit === 'oz') {
    totalDon = (weightVal * 31.1034768) / 3.75;
  }

  const totalGrams = totalDon * 3.75;

  // Gold Purity Multiplier
  let purityRatio = 1.0; // 24K
  let goldLabel = '순금 (24K / 99.9%)';

  if (goldType === '18k') {
    purityRatio = 0.75;
    goldLabel = '18K 금 (75.0%)';
  } else if (goldType === '14k') {
    purityRatio = 0.585;
    goldLabel = '14K 금 (58.5%)';
  } else if (goldType === 'platinum') {
    purityRatio = 0.85; // approximate platinum ratio relative to pure gold rate
    goldLabel = '백금 (Platinum)';
  } else if (goldType === 'silver') {
    purityRatio = 0.012; // approximate silver ratio
    goldLabel = '은 (Silver)';
  }

  // Base Pure Gold Metal Value
  const pureMetalCost = Math.round(totalDon * ratePerDon * purityRatio);

  // Adjustments for Trade Mode
  let finalLaborFee = tradeMode === 'buy' ? laborFee : 0;
  let subtotal = pureMetalCost + finalLaborFee;

  // VAT (10% on buying if checked)
  let vatAmount = tradeMode === 'buy' && includeVat ? Math.round(subtotal * 0.1) : 0;

  // Selling margin discount (buying back discount, usually 3~5% on gold bullion or trade-in rate)
  let sellingMarginDiscount = tradeMode === 'sell' ? Math.round(pureMetalCost * 0.05) : 0;
  let finalTotalPrice = subtotal + vatAmount - sellingMarginDiscount;

  const handleCopy = () => {
    const text = `[금값 시세 계산 결과]
• 거래 구분: ${tradeMode === 'buy' ? '살 때 (매수)' : '팔 때 (매도)'}
• 제품 종류: ${goldLabel}
• 중량: ${weightVal}${weightUnit === 'don' ? '돈' : weightUnit === 'gram' ? 'g' : weightUnit === 'nyang' ? '냥' : 'oz'} (${formatNum(totalGrams)}g)
• 1돈(3.75g) 시세: ${formatKrw(ratePerDon)}
• 금 원자재 가치: ${formatKrw(pureMetalCost)}
${tradeMode === 'buy' ? `• 세공비/공임: ${formatKrw(finalLaborFee)}\n• 부가가치세(10%): ${formatKrw(vatAmount)}` : `• 매입 감가 할인: -${formatKrw(sellingMarginDiscount)}`}
➔ 최종 ${tradeMode === 'buy' ? '구매' : '판매'} 예상 금액: ${formatKrw(finalTotalPrice)}
- 생활 계산기 (https://www.smart-toolkit.com)`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    saveHistory(
      '금값 시세 계산',
      `${goldLabel} ${weightVal}${weightUnit === 'don' ? '돈' : 'g'} = ${formatKrw(finalTotalPrice)}`,
      {
        거래구분: tradeMode === 'buy' ? '살 때' : '팔 때',
        금종류: goldLabel,
        중량: `${weightVal}${weightUnit === 'don' ? '돈' : weightUnit === 'gram' ? 'g' : '냥'} (${totalGrams.toFixed(2)}g)`,
        '1돈기준시세': formatKrw(ratePerDon),
        순수가치: formatKrw(pureMetalCost),
        최종예상금액: formatKrw(finalTotalPrice),
      },
      {
        tradeMode,
        goldType,
        weightUnit,
        weightVal,
        ratePerDon,
        laborFee,
        includeVat,
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
            <Sparkle className="w-5 h-5 text-amber-500" />
            <span>금값 & 귀금속 시세 계산기</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            순금(24K), 18K, 14K, 백금 시세 기준 1돈(3.75g) 살 때/팔 때 총 견적 계산
          </p>
        </div>

        {/* Trade Mode Selector (Buy / Sell) */}
        <div className="flex rounded-lg bg-slate-100 dark:bg-slate-800 p-1 text-xs font-semibold shrink-0">
          <button
            onClick={() => setTradeMode('buy')}
            className={`px-4 py-1.5 rounded-md transition-all ${
              tradeMode === 'buy'
                ? 'bg-amber-500 text-white font-bold shadow-2xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            내가 살 때 (매수)
          </button>
          <button
            onClick={() => setTradeMode('sell')}
            className={`px-4 py-1.5 rounded-md transition-all ${
              tradeMode === 'sell'
                ? 'bg-blue-600 text-white font-bold shadow-2xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            내가 팔 때 (매도)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Input Parameters */}
        <div className="space-y-4">
          {/* Metal Type Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              귀금속 종류 선택
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
              {[
                { id: '24k', label: '순금(24K)' },
                { id: '18k', label: '18K' },
                { id: '14k', label: '14K' },
                { id: 'platinum', label: '백금' },
                { id: 'silver', label: '은' },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setGoldType(m.id as any)}
                  className={`py-2 px-1 rounded-lg text-xs font-semibold border transition-all ${
                    goldType === m.id
                      ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-bold'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Rate per 1 Don Input & Presets */}
          <div>
            <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              <span>순금(24K) 1돈(3.75g) 기준 시세 (원)</span>
              <span className="text-amber-600 font-bold">{formatKrw(ratePerDon)}</span>
            </div>
            <DefaultValueInput
              type="number"
              step="5000"
              value={ratePerDon}
              defaultValueLabel={450000}
              onValueChange={(value) => setRatePerDon(Math.max(0, Number(value) || 0))}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 p-2.5 text-sm font-bold text-slate-800 dark:text-slate-200"
            />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {[430000, 440000, 450000, 460000, 470000].map((r) => (
                <button
                  key={r}
                  onClick={() => setRatePerDon(r)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                    ratePerDon === r ? 'bg-amber-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
                  }`}
                >
                  {r / 10000}만원
                </button>
              ))}
            </div>
          </div>

          {/* Weight Unit & Value */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                중량(무게) 입력
              </label>
              <div className="flex gap-1 text-[11px] font-semibold">
                {[
                  { id: 'don', label: '돈' },
                  { id: 'gram', label: 'g (그램)' },
                  { id: 'nyang', label: '냥' },
                  { id: 'oz', label: 'oz' },
                ].map((u) => (
                  <button
                    key={u.id}
                    onClick={() => setWeightUnit(u.id as any)}
                    className={`px-2 py-0.5 rounded ${
                      weightUnit === u.id
                        ? 'bg-amber-500 text-white font-bold'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}
                  >
                    {u.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <DefaultValueInput
                type="number"
                step="0.1"
                value={weightVal}
                defaultValueLabel={1}
                onValueChange={(value) => setWeightVal(Math.max(0, Number(value) || 0))}
                className="flex-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 p-2.5 text-base font-black text-slate-800 dark:text-slate-200"
              />
              <div className="px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center justify-center">
                = {totalGrams.toFixed(2)} g ({totalDon.toFixed(2)} 돈)
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 mt-2">
              {[1, 2, 3, 5, 10].map((w) => (
                <button
                  key={w}
                  onClick={() => {
                    setWeightUnit('don');
                    setWeightVal(w);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                    weightUnit === 'don' && weightVal === w
                      ? 'bg-amber-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
                  }`}
                >
                  {w}돈
                </button>
              ))}
            </div>
          </div>

          {/* Labor Fee & VAT options for Buying */}
          {tradeMode === 'buy' && (
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  세공비 / 공임비 (원)
                </label>
                <DefaultValueInput
                  type="number"
                  step="5000"
                  value={laborFee}
                  defaultValueLabel={30000}
                  onValueChange={(value) => setLaborFee(Math.max(0, Number(value) || 0))}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-xs font-bold text-slate-800 dark:text-slate-200"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={includeVat}
                  onChange={(e) => setIncludeVat(e.target.checked)}
                  className="w-4 h-4 rounded accent-amber-500"
                />
                <span>부가가치세(VAT 10%) 포함 산출</span>
              </label>
            </div>
          )}
        </div>

        {/* Calculation Result Breakdown */}
        <div className="p-6 rounded-2xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-amber-200/80 dark:border-amber-900/60 pb-3">
              <span className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider">
                {goldLabel} {tradeMode === 'buy' ? '구매 예상 금액' : '판매 매입 금액'}
              </span>
              <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                {weightVal}{weightUnit === 'don' ? '돈' : 'g'} ({totalGrams.toFixed(2)}g)
              </span>
            </div>

            <div className="mt-4 space-y-2 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex justify-between">
                <span>순수 금 소재 가치 ({goldType.toUpperCase()}):</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{formatKrw(pureMetalCost)}</span>
              </div>

              {tradeMode === 'buy' && (
                <>
                  <div className="flex justify-between">
                    <span>세공비 (공임):</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">+{formatKrw(finalLaborFee)}</span>
                  </div>
                  {includeVat && (
                    <div className="flex justify-between">
                      <span>부가가치세 (10%):</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">+{formatKrw(vatAmount)}</span>
                    </div>
                  )}
                </>
              )}

              {tradeMode === 'sell' && (
                <div className="flex justify-between text-rose-600 dark:text-rose-400 font-semibold">
                  <span>매입 감가/공임 차감 (-5%):</span>
                  <span>-{formatKrw(sellingMarginDiscount)}</span>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-amber-200 dark:border-amber-900">
              <div className="text-xs font-bold text-amber-700 dark:text-amber-400">
                최종 견적 산출액
              </div>
              <div className="text-3xl sm:text-4xl font-black text-amber-900 dark:text-amber-100 mt-1">
                {formatKrw(finalTotalPrice)}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={handleSave}
              className="px-2.5 py-1.5.5 rounded-xl bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-800 text-slate-600 dark:text-slate-300 hover:bg-amber-100/50 transition-colors text-xs font-semibold whitespace-nowrap"
              title="계산기록에서 다시 가져올 수 있습니다."
            >기록저장</button>

            <button
              onClick={handleCopy}
              className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              {copied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? '복사완료' : '견적 복사'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
