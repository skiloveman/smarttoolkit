import React, { useState } from 'react';
import { Home, Copy, Check, Building2, ShieldCheck } from 'lucide-react';
import { DefaultValueInput } from '../DefaultValueInput';
import { SaveHistoryFn } from '../../types';
import { formatKrw, formatNum } from '../../utils/calculators';
import { usePendingHistoryRestore } from '../../utils/historyRestore';

interface Props {
  onSaveHistory: (title: string, summary: string, details: Record<string, string | number>) => void;
}

type PropertyType = 'house' | 'officetel' | 'commercial'; // 주택, 오피스텔, 토지상가
type TradeType = 'buy' | 'jeonse' | 'monthly'; // 매매, 전세, 월세

export const RealEstateCalculator: React.FC<Props> = ({ onSaveHistory }) => {
  const saveHistory = onSaveHistory as SaveHistoryFn;
  const [calcTab, setCalcTab] = useState<'brokerage' | 'tax'>('brokerage');
  const [propertyType, setPropertyType] = useState<PropertyType>('house');
  const [tradeType, setTradeType] = useState<TradeType>('buy');

  // Amount Inputs
  const [price, setPrice] = useState<number>(500000000); // 5억 원
  const [priceText, setPriceText] = useState('500000000');
  const [monthlyRent, setMonthlyRent] = useState<number>(500000); // 월세 50만 원
  const [monthlyRentText, setMonthlyRentText] = useState('500000');

  // Tax Option Inputs
  const [houseCount, setHouseCount] = useState<number>(1); // 1주택자
  const [areaOver85, setAreaOver85] = useState<boolean>(false); // 85㎡ 초과 여부

  const [copied, setCopied] = useState<boolean>(false);
  const [saved, setSaved] = useState<boolean>(false);

  // Brokerage Fee Calculation (복비)
  let effectivePrice = price;
  if (tradeType === 'monthly') {
    // 월세 보증금 + (월세 * 100). 만약 5천만원 미만이면 월세 * 70
    let calculated = price + monthlyRent * 100;
    if (calculated < 50000000) {
      calculated = price + monthlyRent * 70;
    }
    effectivePrice = calculated;
  }

  let feeRate = 0.004;
  let maxFeeCap: number | null = null;

  if (propertyType === 'house') {
    if (tradeType === 'buy') {
      if (effectivePrice < 50000000) {
        feeRate = 0.006;
        maxFeeCap = 250000;
      } else if (effectivePrice < 200000000) {
        feeRate = 0.005;
        maxFeeCap = 800000;
      } else if (effectivePrice < 900000000) {
        feeRate = 0.004;
      } else if (effectivePrice < 1200000000) {
        feeRate = 0.005;
      } else if (effectivePrice < 1500000000) {
        feeRate = 0.006;
      } else {
        feeRate = 0.007;
      }
    } else {
      // 임대차 (전세/월세)
      if (effectivePrice < 50000000) {
        feeRate = 0.005;
        maxFeeCap = 200000;
      } else if (effectivePrice < 100000000) {
        feeRate = 0.004;
        maxFeeCap = 300000;
      } else if (effectivePrice < 600000000) {
        feeRate = 0.003;
      } else if (effectivePrice < 1200000000) {
        feeRate = 0.004;
      } else {
        feeRate = 0.005;
      }
    }
  } else if (propertyType === 'officetel') {
    feeRate = tradeType === 'buy' ? 0.005 : 0.004;
  } else {
    // 토지 / 상가
    feeRate = 0.009;
  }

  let rawFee = Math.round(effectivePrice * feeRate);
  if (maxFeeCap !== null && rawFee > maxFeeCap) {
    rawFee = maxFeeCap;
  }

  const vatFee = Math.round(rawFee * 0.1); // 부가세 10%
  const totalBrokerageFee = rawFee + vatFee;

  // Acquisition Tax Calculation (취득세)
  let acqTaxRate = 0.01; // 기본 1%
  if (propertyType === 'house') {
    if (houseCount === 1) {
      if (price <= 600000000) {
        acqTaxRate = 0.01;
      } else if (price <= 900000000) {
        // 6억 초과 9억 이하 비례식: (거래가 * 2/3억 - 3) / 100
        acqTaxRate = ((price / 100000000) * (2 / 3) - 3) / 100;
      } else {
        acqTaxRate = 0.03;
      }
    } else if (houseCount === 2) {
      acqTaxRate = 0.08; // 2주택 조정지역 가정
    } else {
      acqTaxRate = 0.12; // 3주택 이상 12%
    }
  } else if (propertyType === 'officetel') {
    acqTaxRate = 0.046; // 오피스텔 4.6% (취득세 4% + 지방교육세 0.4% + 농특세 0.2%)
  } else {
    acqTaxRate = 0.04; // 상가/토지 4.0%
  }

  const acqTaxAmount = Math.round(price * acqTaxRate);
  const localEduTax = Math.round(acqTaxAmount * 0.1); // 지방교육세 ~10%
  const ruralSpecialTax = areaOver85 ? Math.round(price * 0.002) : 0; // 농어촌특별세 0.2%
  const totalAcquisitionTax = acqTaxAmount + localEduTax + ruralSpecialTax;

  usePendingHistoryRestore<{
    calcTab: 'brokerage' | 'tax';
    propertyType: PropertyType;
    tradeType: TradeType;
    price: number;
    monthlyRent: number;
    houseCount: number;
    areaOver85: boolean;
  }>('realEstate', (restored) => {
    setCalcTab(restored.calcTab);
    setPropertyType(restored.propertyType);
    setTradeType(restored.tradeType);
    setPrice(restored.price);
    setPriceText(String(restored.price));
    setMonthlyRent(restored.monthlyRent);
    setMonthlyRentText(String(restored.monthlyRent));
    setHouseCount(restored.houseCount);
    setAreaOver85(restored.areaOver85);
  });

  const handleCopy = () => {
    let text = '';
    const propMap = { house: '주택', officetel: '오피스텔', commercial: '토지/상가' };
    const tradeMap = { buy: '매매', jeonse: '전세', monthly: '월세' };

    if (calcTab === 'brokerage') {
      text = `[부동산 중개보수(복비) 계산]
• 종류/거래: ${propMap[propertyType]} (${tradeMap[tradeType]})
• 거래금액: ${formatKrw(price)}${tradeType === 'monthly' ? ` (월세 ${formatKrw(monthlyRent)})` : ''}
• 상한요율: ${(feeRate * 100).toFixed(2)}% ${maxFeeCap ? `(한도액 ${formatKrw(maxFeeCap)})` : ''}
------------------------------------
• 상한 중개보수: ${formatKrw(rawFee)}
• 부가가치세(10%): ${formatKrw(vatFee)}
➔ 총 지불 중개수수료: ${formatKrw(totalBrokerageFee)}
- 생활 계산기 (https://www.smart-toolkit.com)`;
    } else {
      text = `[부동산 취득세 계산]
• 건물 종류: ${propMap[propertyType]} (${houseCount}주택자)
• 취득가액: ${formatKrw(price)} (전용면적 85㎡ ${areaOver85 ? '초과' : '이하'})
• 적용 취득세율: ${(acqTaxRate * 100).toFixed(2)}%
------------------------------------
• 취득세: ${formatKrw(acqTaxAmount)}
• 지방교육세: ${formatKrw(localEduTax)}
${areaOver85 ? `• 농어촌특별세: ${formatKrw(ruralSpecialTax)}\n` : ''}➔ 총 세금 합계액: ${formatKrw(totalAcquisitionTax)}
- 생활 계산기 (https://www.smart-toolkit.com)`;
    }

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    const propMap = { house: '주택', officetel: '오피스텔', commercial: '상가' };
    const tradeMap = { buy: '매매', jeonse: '전세', monthly: '월세' };

    if (calcTab === 'brokerage') {
      saveHistory(
        '부동산 중개수수료 계산',
        `${propMap[propertyType]} ${tradeMap[tradeType]} ${formatKrw(price)} = 복비 ${formatKrw(totalBrokerageFee)}`,
        {
          부동산종류: propMap[propertyType],
          거래방식: tradeMap[tradeType],
          거래금액: formatKrw(price),
          상한요율: `${(feeRate * 100).toFixed(2)}%`,
          중개수수료: formatKrw(rawFee),
          부가세포함총액: formatKrw(totalBrokerageFee),
        },
        {
          calcTab,
          propertyType,
          tradeType,
          price,
          monthlyRent,
          houseCount,
          areaOver85,
        }
      );
    } else {
      saveHistory(
        '부동산 취득세 계산',
        `${propMap[propertyType]} ${formatKrw(price)} = 총 취득세 ${formatKrw(totalAcquisitionTax)}`,
        {
          부동산종류: propMap[propertyType],
          취득가액: formatKrw(price),
          취득세율: `${(acqTaxRate * 100).toFixed(2)}%`,
          취득세액: formatKrw(acqTaxAmount),
          총세액합계: formatKrw(totalAcquisitionTax),
        },
        {
          calcTab,
          propertyType,
          tradeType,
          price,
          monthlyRent,
          houseCount,
          areaOver85,
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
            <Building2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>부동산 중개보수(복비) & 취득세 계산기</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            2025/2026 국토부 상한요율표 기준 부동산 복비 및 주택/오피스텔 취득세액 모의 산출
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex rounded-lg bg-slate-100 dark:bg-slate-800 p-1 text-xs font-semibold shrink-0">
          <button
            onClick={() => setCalcTab('brokerage')}
            className={`px-4 py-1.5 rounded-md transition-all ${
              calcTab === 'brokerage'
                ? 'bg-indigo-600 text-white font-bold shadow-2xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            중개보수(복비)
          </button>
          <button
            onClick={() => setCalcTab('tax')}
            className={`px-4 py-1.5 rounded-md transition-all ${
              calcTab === 'tax'
                ? 'bg-indigo-600 text-white font-bold shadow-2xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            취득세 산출
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Input Parameters */}
        <div className="space-y-4">
          {/* Property Type Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              부동산 대상 종류
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'house', label: '주택 (아파트/빌라)' },
                { id: 'officetel', label: '오피스텔' },
                { id: 'commercial', label: '토지 / 상가' },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPropertyType(p.id as PropertyType)}
                  className={`py-2 px-1 rounded-lg text-xs font-semibold border transition-all ${
                    propertyType === p.id
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Trade Type Selection (Brokerage only) */}
          {calcTab === 'brokerage' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                거래 구분
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'buy', label: '매매 / 교환' },
                  { id: 'jeonse', label: '전세' },
                  { id: 'monthly', label: '월세' },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTradeType(t.id as TradeType)}
                    className={`py-2 px-1 rounded-lg text-xs font-semibold border transition-all ${
                      tradeType === t.id
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Price Input */}
          <div>
            <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              <span>{tradeType === 'monthly' ? '보증금 (원)' : '거래가 / 취득가액 (원)'}</span>
              <span className="text-indigo-600 font-bold">{formatKrw(price)}</span>
            </div>
            <DefaultValueInput
              type="number"
              step="10000000"
              value={priceText}
              defaultValueLabel={500000000}
              onValueChange={(value) => {
                setPriceText(value);
                const n = Number(value);
                if (value.trim() !== '' && !Number.isNaN(n)) setPrice(Math.max(0, n));
              }}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 p-2.5 text-lg font-black text-slate-800 dark:text-slate-200"
            />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {[100000000, 300000000, 500000000, 800000000, 1200000000].map((amt) => (
                <button
                  key={amt}
                  onClick={() => {
                    setPrice(amt);
                    setPriceText(String(amt));
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                    price === amt ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {amt / 100000000}억원
                </button>
              ))}
            </div>
          </div>

          {/* Monthly Rent Input (if Monthly) */}
          {calcTab === 'brokerage' && tradeType === 'monthly' && (
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                <span>월 차임 (월세, 원)</span>
                <span className="text-indigo-600 font-bold">{formatKrw(monthlyRent)}</span>
              </div>
              <DefaultValueInput
                type="number"
                step="50000"
                value={monthlyRentText}
                defaultValueLabel={500000}
                onValueChange={(value) => {
                  setMonthlyRentText(value);
                  const n = Number(value);
                  if (value.trim() !== '' && !Number.isNaN(n)) setMonthlyRent(Math.max(0, n));
                }}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 p-2 text-sm font-bold text-slate-800 dark:text-slate-200"
              />
            </div>
          )}

          {/* Acquisition Tax Extra Options */}
          {calcTab === 'tax' && propertyType === 'house' && (
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  소유 주택 수
                </label>
                <div className="grid grid-cols-3 gap-1">
                  {[
                    { count: 1, label: '1주택 (기본)' },
                    { count: 2, label: '2주택 (8%)' },
                    { count: 3, label: '3주택+ (12%)' },
                  ].map((h) => (
                    <button
                      key={h.count}
                      onClick={() => setHouseCount(h.count)}
                      className={`py-1.5 rounded text-xs font-semibold ${
                        houseCount === h.count
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white dark:bg-slate-900 text-slate-600 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {h.label}
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300 pt-1">
                <input
                  type="checkbox"
                  checked={areaOver85}
                  onChange={(e) => setAreaOver85(e.target.checked)}
                  className="w-4 h-4 rounded accent-indigo-600"
                />
                <span>전용면적 85㎡ 초과 (농어촌특별세 0.2% 추가)</span>
              </label>
            </div>
          )}
        </div>

        {/* Results Card */}
        {calcTab === 'brokerage' ? (
          <div className="p-6 rounded-2xl bg-indigo-50/90 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between border-b border-indigo-200/80 dark:border-indigo-900 pb-3">
                <span className="text-xs font-bold text-indigo-800 dark:text-indigo-300 uppercase tracking-wider">
                  법정 상한 중개보수 (복비)
                </span>
                <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-400">
                  상한 요율 {(feeRate * 100).toFixed(2)}%
                </span>
              </div>

              <div className="text-3xl sm:text-4xl font-black text-indigo-950 dark:text-indigo-100 mt-3">
                {formatKrw(totalBrokerageFee)}
              </div>

              {maxFeeCap && (
                <div className="mt-2 text-xs font-semibold text-amber-700 dark:text-amber-400">
                  * 법정 상한액 {formatKrw(maxFeeCap)} 한도 적용
                </div>
              )}

              <div className="mt-4 space-y-1.5 text-xs text-slate-600 dark:text-slate-300 border-t border-indigo-200/60 dark:border-indigo-900/60 pt-3">
                <div className="flex justify-between">
                  <span>중개수수료 본액:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{formatKrw(rawFee)}</span>
                </div>
                <div className="flex justify-between">
                  <span>부가가치세 (10%):</span>
                  <span className="font-semibold">{formatKrw(vatFee)}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
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
        ) : (
          /* Acquisition Tax Result Card */
          <div className="p-6 rounded-2xl bg-indigo-50/90 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between border-b border-indigo-200/80 dark:border-indigo-900 pb-3">
                <span className="text-xs font-bold text-indigo-800 dark:text-indigo-300 uppercase tracking-wider">
                  총 취득 세금 합계액
                </span>
                <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-400">
                  취득세율 {(acqTaxRate * 100).toFixed(2)}%
                </span>
              </div>

              <div className="text-3xl sm:text-4xl font-black text-indigo-950 dark:text-indigo-100 mt-3">
                {formatKrw(totalAcquisitionTax)}
              </div>

              <div className="mt-4 space-y-1.5 text-xs text-slate-600 dark:text-slate-300 border-t border-indigo-200/60 dark:border-indigo-900/60 pt-3">
                <div className="flex justify-between">
                  <span>취득세 본세액:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{formatKrw(acqTaxAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>지방교육세:</span>
                  <span className="font-semibold">{formatKrw(localEduTax)}</span>
                </div>
                {areaOver85 && (
                  <div className="flex justify-between text-indigo-900 dark:text-indigo-200 font-semibold">
                    <span>농어촌특별세 (0.2%):</span>
                    <span>+{formatKrw(ruralSpecialTax)}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
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
        )}
      </div>
    </div>
  );
};
