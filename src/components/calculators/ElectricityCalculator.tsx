import React, { useState, useMemo } from 'react';
import { calculateElectricity, formatKrw } from '../../utils/calculators';
import { ElectricityInput, SaveHistoryFn } from '../../types';
import { Zap, Copy, Check, AlertTriangle } from 'lucide-react';
import { DefaultValueInput } from '../DefaultValueInput';
import { usePendingHistoryRestore } from '../../utils/historyRestore';

interface Props {
  onSaveHistory: (title: string, summary: string, details: Record<string, string | number>) => void;
}

export const ElectricityCalculator: React.FC<Props> = ({ onSaveHistory }) => {
  const saveHistory = onSaveHistory as SaveHistoryFn;
  const [contractType, setContractType] = useState<'lowVoltage' | 'highVoltage'>('lowVoltage');
  const [season, setSeason] = useState<'summer' | 'other'>('other');
  const [usageKwh, setUsageKwh] = useState<number>(320); // 320 kWh default
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  const elecInput: ElectricityInput = useMemo(
    () => ({
      contractType,
      season,
      usageKwh,
    }),
    [contractType, season, usageKwh]
  );

  const result = useMemo(() => calculateElectricity(elecInput), [elecInput]);

  usePendingHistoryRestore<{
    contractType: 'lowVoltage' | 'highVoltage';
    season: 'summer' | 'other';
    usageKwh: number;
  }>('electricity', (restored) => {
    setContractType(restored.contractType);
    setSeason(restored.season);
    setUsageKwh(restored.usageKwh);
  });

  const handleCopy = () => {
    const text = `[전기요금 계산 결과]
• 사용량: ${usageKwh} kWh (${contractType === 'lowVoltage' ? '주택용 저압' : '주택용 고압'}, ${season === 'summer' ? '여름철 7~8월' : '기타계절'})
• 적용 구간: ${result.tierName}
• 최종 예상 요금: ${formatKrw(result.totalBill)}
  - 기본요금: ${formatKrw(result.baseRate)}
  - 전력량요금: ${formatKrw(result.energyCharge)}
  - 기후환경요금: ${formatKrw(result.climateCharge)}
  - 연료비조정액: ${formatKrw(result.fuelAdjustmentCharge)}
  - 부가가치세(10%): ${formatKrw(result.vat)}
  - 전력산업기반기금(3.7%): ${formatKrw(result.powerFund)}
- 생활 계산기 (https://www.smart-toolkit.com)`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    saveHistory(
      '전기요금 예상 계산',
      `예상 요금: ${formatKrw(result.totalBill)} (${usageKwh}kWh / ${result.tierName})`,
      {
        '계약/계절': `${contractType === 'lowVoltage' ? '주택용 저압' : '주택용 고압'} / ${season === 'summer' ? '여름철' : '기타계절'}`,
        월사용량: `${usageKwh} kWh`,
        적용구간: result.tierName,
        최종예상요금: formatKrw(result.totalBill),
      },
      { contractType, season, usageKwh }
    );
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  // Usage Progress percentage (max 600kWh range)
  const maxRange = season === 'summer' ? 600 : 500;
  const usagePercent = Math.min(100, (usageKwh / maxRange) * 100);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Inputs (7 cols) */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-500" />
              <span>계약 조건 및 사용량</span>
            </h3>
            <span className="text-xs text-slate-400">한전 규정 표준요율</span>
          </div>

          {/* Contract Type & Season Toggles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                주택 종별 구분
              </label>
              <div className="flex rounded-lg bg-slate-100 dark:bg-slate-800 p-1 text-xs font-semibold">
                <button
                  onClick={() => setContractType('lowVoltage')}
                  className={`flex-1 py-2 rounded-md transition-all ${
                    contractType === 'lowVoltage'
                      ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  주택용 저압 (일반)
                </button>
                <button
                  onClick={() => setContractType('highVoltage')}
                  className={`flex-1 py-2 rounded-md transition-all ${
                    contractType === 'highVoltage'
                      ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  주택용 고압 (아파트)
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                적용 계절
              </label>
              <div className="flex rounded-lg bg-slate-100 dark:bg-slate-800 p-1 text-xs font-semibold">
                <button
                  onClick={() => setSeason('other')}
                  className={`flex-1 py-2 rounded-md transition-all ${
                    season === 'other'
                      ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  기타계절 (1~6월, 9~12월)
                </button>
                <button
                  onClick={() => setSeason('summer')}
                  className={`flex-1 py-2 rounded-md transition-all ${
                    season === 'summer'
                      ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-xs'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  여름철 (7~8월)
                </button>
              </div>
            </div>
          </div>

          {/* Monthly Usage Slider */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                월간 전력 사용량
              </label>
              <div className="flex items-center gap-1">
                <DefaultValueInput
                  type="number"
                  value={usageKwh}
                  defaultValueLabel={320}
                  onValueChange={(value) => setUsageKwh(Math.max(0, Number(value) || 0))}
                  className="w-24 rounded-lg border border-slate-300 dark:border-slate-700 px-2 py-1 text-right text-sm font-bold text-slate-800 dark:text-slate-100 focus:outline-none"
                />
                <span className="text-xs font-bold text-slate-500">kWh</span>
              </div>
            </div>

            <input
              type="range"
              min="0"
              max={maxRange}
              value={usageKwh}
              onChange={(e) => setUsageKwh(Number(e.target.value))}
              className="w-full accent-yellow-500 cursor-pointer"
            />

            {/* Quick Presets */}
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {[150, 220, 320, 420, 500].map((kwh) => (
                <button
                  key={kwh}
                  onClick={() => setUsageKwh(kwh)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                    usageKwh === kwh
                      ? 'bg-yellow-500 text-slate-900 font-bold'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {kwh} kWh
                </button>
              ))}
            </div>
          </div>

          {/* Tier Warning Meter */}
          <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-4 border border-slate-200/80 dark:border-slate-800 space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-700 dark:text-slate-300">누진세 단계 지표</span>
              <span
                className={`font-bold ${
                  result.tier === 1
                    ? 'text-emerald-600'
                    : result.tier === 2
                    ? 'text-amber-600'
                    : 'text-red-600'
                }`}
              >
                {result.tierName}
              </span>
            </div>

            <div className="relative h-3 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  result.tier === 1
                    ? 'bg-emerald-500'
                    : result.tier === 2
                    ? 'bg-amber-500'
                    : 'bg-red-500'
                }`}
                style={{ width: `${usagePercent}%` }}
              />
            </div>

            {result.kwhToNextTier !== null && result.kwhToNextTier > 0 && (
              <div className="text-[11px] text-amber-700 dark:text-amber-300 flex items-center gap-1 font-medium pt-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>
                  다음 누진 구간({result.nextTierThreshold}kWh) 진입까지{' '}
                  <strong className="underline">{result.kwhToNextTier} kWh</strong> 남았습니다.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right Result Card (5 cols) */}
        <div className="lg:col-span-5 rounded-2xl border border-yellow-200 dark:border-yellow-900/60 bg-gradient-to-br from-yellow-50/70 via-white to-amber-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-yellow-950/30 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-yellow-700 dark:text-yellow-400 tracking-wider uppercase">
                청구 예상 전기요금
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSave}
                  className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-yellow-600 transition-colors text-xs font-semibold whitespace-nowrap"
                  title="계산기록에서 다시 가져올 수 있습니다."
                >기록저장</button>
                <button
                  onClick={handleCopy}
                  className="px-2.5 py-1 rounded-lg bg-yellow-500 hover:bg-yellow-600 text-slate-900 text-xs font-bold flex items-center gap-1 transition-all"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? '복사완료' : '결과 복사'}</span>
                </button>
              </div>
            </div>

            <div className="mb-6">
              <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {formatKrw(result.totalBill)}
              </div>
              <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                사용량 {usageKwh} kWh 기준 (10원 미만 절사 적용)
              </div>
            </div>

            {/* Itemized Table */}
            <div className="space-y-2 text-xs mb-4">
              <div className="flex justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <span className="text-slate-600 dark:text-slate-400">기본요금</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{formatKrw(result.baseRate)}</span>
              </div>
              <div className="flex justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <span className="text-slate-600 dark:text-slate-400">전력량요금</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{formatKrw(result.energyCharge)}</span>
              </div>
              <div className="flex justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <span className="text-slate-600 dark:text-slate-400">기후환경요금 (9원/kWh)</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{formatKrw(result.climateCharge)}</span>
              </div>
              <div className="flex justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <span className="text-slate-600 dark:text-slate-400">연료비조정액 (+5원/kWh)</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{formatKrw(result.fuelAdjustmentCharge)}</span>
              </div>
              <div className="flex justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <span className="text-slate-600 dark:text-slate-400">부가가치세 (10%)</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{formatKrw(result.vat)}</span>
              </div>
              <div className="flex justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <span className="text-slate-600 dark:text-slate-400">전력산업기반기금 (3.7%)</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{formatKrw(result.powerFund)}</span>
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
