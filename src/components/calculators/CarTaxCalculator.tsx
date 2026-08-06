import React, { useState } from 'react';
import { Car, Copy, Check, BookmarkPlus, Fuel, ShieldCheck } from 'lucide-react';
import { DefaultValueInput } from '../DefaultValueInput';
import { SaveHistoryFn } from '../../types';
import { formatKrw, formatNum } from '../../utils/calculators';
import { usePendingHistoryRestore } from '../../utils/historyRestore';

interface Props {
  onSaveHistory: (title: string, summary: string, details: Record<string, string | number>) => void;
}

export const CarTaxCalculator: React.FC<Props> = ({ onSaveHistory }) => {
  const saveHistory = onSaveHistory as SaveHistoryFn;
  const [activeTab, setActiveTab] = useState<'tax' | 'fuel'>('tax');

  // Car Tax Inputs
  const [cc, setCc] = useState<number>(1998); // 2,000cc급
  const [carAgeYears, setCarAgeYears] = useState<number>(1); // 신차 1년차
  const [isCommercial, setIsCommercial] = useState<boolean>(false); // 영업용 여부

  // Fuel Cost Inputs
  const [annualDistanceKm, setAnnualDistanceKm] = useState<number>(15000); // 연간 15,000km
  const [fuelEfficiency, setFuelEfficiency] = useState<number>(12.5); // 12.5 km/L
  const [fuelPricePerLiter, setFuelPricePerLiter] = useState<number>(1680); // 휘발유 1,680원/L

  const [copied, setCopied] = useState<boolean>(false);
  const [saved, setSaved] = useState<boolean>(false);

  // Car Tax Calculation
  let baseRatePerCc = 200;
  if (!isCommercial) {
    if (cc <= 1000) baseRatePerCc = 80;
    else if (cc <= 1600) baseRatePerCc = 140;
    else baseRatePerCc = 200;
  } else {
    if (cc <= 1000) baseRatePerCc = 18;
    else if (cc <= 1600) baseRatePerCc = 18;
    else baseRatePerCc = 24;
  }

  const rawTax = cc * baseRatePerCc;

  // Age discount: 3rd year 5%, 4th year 10%, ..., max 50% at 12th year
  let ageDiscountRatio = 0;
  if (carAgeYears >= 3) {
    ageDiscountRatio = Math.min(0.5, (carAgeYears - 2) * 0.05);
  }

  const discountedBaseTax = Math.round(rawTax * (1 - ageDiscountRatio));
  const localEducationTax = isCommercial ? 0 : Math.round(discountedBaseTax * 0.3); // 지방교육세 30%
  const totalAnnualCarTax = discountedBaseTax + localEducationTax;

  // Prepayment (선납) 1월 연납 할인 (약 4.5% 감면 효과)
  const janPrepaymentTax = Math.round(totalAnnualCarTax * 0.955);
  const prepaymentSavings = totalAnnualCarTax - janPrepaymentTax;

  // Fuel Cost Calculation
  const totalLitersNeeded = fuelEfficiency > 0 ? annualDistanceKm / fuelEfficiency : 0;
  const annualFuelCost = Math.round(totalLitersNeeded * fuelPricePerLiter);
  const monthlyFuelCost = Math.round(annualFuelCost / 12);

  usePendingHistoryRestore<{
    activeTab: 'tax' | 'fuel';
    cc: number;
    carAgeYears: number;
    isCommercial: boolean;
    annualDistanceKm: number;
    fuelEfficiency: number;
    fuelPricePerLiter: number;
  }>('carTax', (restored) => {
    setActiveTab(restored.activeTab);
    setCc(restored.cc);
    setCarAgeYears(restored.carAgeYears);
    setIsCommercial(restored.isCommercial);
    setAnnualDistanceKm(restored.annualDistanceKm);
    setFuelEfficiency(restored.fuelEfficiency);
    setFuelPricePerLiter(restored.fuelPricePerLiter);
  });

  const handleCopy = () => {
    let text = '';
    if (activeTab === 'tax') {
      text = `[자동차세 계산 결과]
• 배기량: ${formatNum(cc)}cc (차령 ${carAgeYears}년차)
• 세액 산정: 기본 세액 ${formatKrw(discountedBaseTax)} + 지방교육세(30%) ${formatKrw(localEducationTax)}
• 연간 총 자동차세: ${formatKrw(totalAnnualCarTax)} (반기별 ${formatKrw(Math.round(totalAnnualCarTax / 2))})
• 1월 연납(선납) 시: ${formatKrw(janPrepaymentTax)} (절감 혜택: -${formatKrw(prepaymentSavings)})
- 생활 계산기 (https://ais-dev-mqxu6js2rqs5gficbwuedy-53763444336.asia-northeast1.run.app)`;
    } else {
      text = `[차량 유류비 계산 결과]
• 주행거리: 연간 ${formatNum(annualDistanceKm)}km (월 약 ${formatNum(Math.round(annualDistanceKm / 12))}km)
• 연비: ${fuelEfficiency} km/L | 유류 단가: ${formatKrw(fuelPricePerLiter)}/L
• 연간 예상 유류비: ${formatKrw(annualFuelCost)}
• 월 평균 예상 유류비: ${formatKrw(monthlyFuelCost)}
- 생활 계산기 (https://ais-dev-mqxu6js2rqs5gficbwuedy-53763444336.asia-northeast1.run.app)`;
    }

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    if (activeTab === 'tax') {
      saveHistory(
        '자동차세 계산',
        `${cc}cc (${carAgeYears}년차) = 연간 자동차세 ${formatKrw(totalAnnualCarTax)}`,
        {
          배기량: `${cc} cc`,
          차령년수: `${carAgeYears}년차 (할인율 ${(ageDiscountRatio * 100).toFixed(0)}%)`,
          연간총자동차세: formatKrw(totalAnnualCarTax),
          '1월연납할인가': formatKrw(janPrepaymentTax),
        },
        {
          activeTab,
          cc,
          carAgeYears,
          isCommercial,
          annualDistanceKm,
          fuelEfficiency,
          fuelPricePerLiter,
        }
      );
    } else {
      saveHistory(
        '차량 유류비 계산',
        `연 ${formatNum(annualDistanceKm)}km (연비 ${fuelEfficiency}km/L) = 월 유류비 ${formatKrw(monthlyFuelCost)}`,
        {
          연간주행거리: `${formatNum(annualDistanceKm)} km`,
          차량연비: `${fuelEfficiency} km/L`,
          유류단가: `${formatKrw(fuelPricePerLiter)}/L`,
          연간총유류비: formatKrw(annualFuelCost),
          월평균유류비: formatKrw(monthlyFuelCost),
        },
        {
          activeTab,
          cc,
          carAgeYears,
          isCommercial,
          annualDistanceKm,
          fuelEfficiency,
          fuelPricePerLiter,
        }
      );
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Car className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span>자동차세 & 유류비 계산기</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            배기량 및 연식 감가 기준 연간 자동차세, 연납 할인액 및 주행 유류비 산출
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex rounded-lg bg-slate-100 dark:bg-slate-800 p-1 text-xs font-semibold shrink-0">
          <button
            onClick={() => setActiveTab('tax')}
            className={`px-4 py-1.5 rounded-md transition-all ${
              activeTab === 'tax'
                ? 'bg-blue-600 text-white font-bold shadow-2xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            자동차세 계산
          </button>
          <button
            onClick={() => setActiveTab('fuel')}
            className={`px-4 py-1.5 rounded-md transition-all ${
              activeTab === 'fuel'
                ? 'bg-blue-600 text-white font-bold shadow-2xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            주행 유류비 계산
          </button>
        </div>
      </div>

      {activeTab === 'tax' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Tax Inputs */}
          <div className="space-y-4">
            {/* CC Input & Presets */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                <span>차량 배기량 (cc)</span>
                <span className="text-blue-600 font-bold">{formatNum(cc)} cc</span>
              </div>
              <DefaultValueInput
                type="number"
                step="50"
                value={cc}
                defaultValueLabel={1998}
                onValueChange={(value) => setCc(Math.max(0, Number(value) || 0))}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 p-2.5 text-lg font-black text-slate-800 dark:text-slate-200"
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {[998, 1598, 1998, 2497, 3470].map((c) => (
                  <button
                    key={c}
                    onClick={() => setCc(c)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                      cc === c ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {c}cc
                  </button>
                ))}
              </div>
            </div>

            {/* Car Age Years */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                <span>차령 (등록 연식 년차)</span>
                <span className="text-blue-600 font-bold">{carAgeYears}년차 (차령감가 {(ageDiscountRatio * 100).toFixed(0)}%)</span>
              </div>
              <DefaultValueInput
                type="number"
                min="1"
                max="20"
                value={carAgeYears}
                defaultValueLabel={1}
                onValueChange={(value) => setCarAgeYears(Math.max(1, Number(value) || 0))}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 p-2 text-sm font-bold text-slate-800 dark:text-slate-200"
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {[1, 2, 3, 5, 7, 10, 12].map((y) => (
                  <button
                    key={y}
                    onClick={() => setCarAgeYears(y)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                      carAgeYears === y ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {y}년차
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Tax Result Card */}
          <div className="p-6 rounded-2xl bg-blue-50/90 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between border-b border-blue-200/80 dark:border-blue-900 pb-3">
                <span className="text-xs font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wider">
                  연간 총 자동차세 (지방교육세 포함)
                </span>
                <span className="text-xs font-semibold text-blue-700 dark:text-blue-400">
                  반기별 {formatKrw(Math.round(totalAnnualCarTax / 2))}
                </span>
              </div>

              <div className="text-3xl sm:text-4xl font-black text-blue-950 dark:text-blue-100 mt-3">
                {formatKrw(totalAnnualCarTax)}
              </div>

              <div className="mt-4 p-3 rounded-xl bg-blue-100/80 dark:bg-blue-900/60 border border-blue-200/60 text-xs text-blue-900 dark:text-blue-200 space-y-1">
                <div className="font-bold flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span>1월 연납(선납) 할인 혜택가</span>
                </div>
                <div className="text-lg font-black text-blue-950 dark:text-blue-100">
                  {formatKrw(janPrepaymentTax)}{' '}
                  <span className="text-xs text-emerald-600 font-semibold">(-{formatKrw(prepaymentSavings)} 절감)</span>
                </div>
              </div>

              <div className="mt-4 space-y-1.5 text-xs text-slate-600 dark:text-slate-300 border-t border-blue-200/60 dark:border-blue-900/60 pt-3">
                <div className="flex justify-between">
                  <span>자동차세 본세:</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{formatKrw(discountedBaseTax)}</span>
                </div>
                <div className="flex justify-between">
                  <span>지방교육세 (30%):</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{formatKrw(localEducationTax)}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={handleSave}
                className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-800 text-slate-600 dark:text-slate-300 hover:bg-blue-100/50 transition-colors"
                title="기록 저장"
              >
                <BookmarkPlus className="w-4 h-4" />
              </button>

              <button
                onClick={handleCopy}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? '복사완료' : '결과 복사'}</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Fuel Cost Calculation View */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                연간 주행거리 (km)
              </label>
              <DefaultValueInput
                type="number"
                step="1000"
                value={annualDistanceKm}
                defaultValueLabel={15000}
                onValueChange={(value) => setAnnualDistanceKm(Math.max(0, Number(value) || 0))}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 p-2.5 text-base font-bold text-slate-800 dark:text-slate-200"
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {[10000, 15000, 20000, 30000].map((d) => (
                  <button
                    key={d}
                    onClick={() => setAnnualDistanceKm(d)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                      annualDistanceKm === d ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    연 {formatNum(d)}km
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  복합 연비 (km/L)
                </label>
                <DefaultValueInput
                  type="number"
                  step="0.5"
                  value={fuelEfficiency}
                  defaultValueLabel={12.5}
                  onValueChange={(value) => setFuelEfficiency(Math.max(0.1, Number(value) || 0))}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 p-2.5 text-base font-bold text-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  유류 단가 (원/L)
                </label>
                <DefaultValueInput
                  type="number"
                  step="10"
                  value={fuelPricePerLiter}
                  defaultValueLabel={1680}
                  onValueChange={(value) => setFuelPricePerLiter(Math.max(0, Number(value) || 0))}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 p-2.5 text-base font-bold text-slate-800 dark:text-slate-200"
                />
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-blue-50/90 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 flex flex-col justify-between space-y-4">
            <div>
              <div className="text-xs font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wider">
                월 평균 예상 주행 기름값
              </div>
              <div className="text-3xl sm:text-4xl font-black text-blue-950 dark:text-blue-100 mt-2">
                {formatKrw(monthlyFuelCost)}
              </div>

              <div className="mt-4 space-y-2 text-xs text-slate-600 dark:text-slate-300 border-t border-blue-200/60 dark:border-blue-900/60 pt-3">
                <div className="flex justify-between">
                  <span>연간 총 유류비:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{formatKrw(annualFuelCost)}</span>
                </div>
                <div className="flex justify-between">
                  <span>연간 총 필요 소모 유류량:</span>
                  <span className="font-semibold">{totalLitersNeeded.toFixed(1)} 리터(L)</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={handleSave}
                className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-800 text-slate-600 dark:text-slate-300 hover:bg-blue-100/50 transition-colors"
                title="기록 저장"
              >
                <BookmarkPlus className="w-4 h-4" />
              </button>

              <button
                onClick={handleCopy}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? '복사완료' : '결과 복사'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
