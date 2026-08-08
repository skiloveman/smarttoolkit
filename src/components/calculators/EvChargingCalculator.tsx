import React, { useMemo, useState } from 'react';
import { BatteryCharging } from 'lucide-react';
import { SaveHistoryFn } from '../../types';
import { formatNum } from '../../utils/calculators';
import { usePendingHistoryRestore } from '../../utils/historyRestore';

interface Props {
  onSaveHistory: (title: string, summary: string, details: Record<string, string | number>) => void;
}

const chargerPresets = [
  { id: 'homeNight', label: '가정용 완속(심야)', unitPrice: 160, powerKw: 7 },
  { id: 'publicSlow', label: '공공 완속', unitPrice: 300, powerKw: 7 },
  { id: 'publicFast', label: '공공 급속', unitPrice: 350, powerKw: 50 },
  { id: 'ultraFast', label: '초급속', unitPrice: 400, powerKw: 120 },
] as const;

type ChargerId = (typeof chargerPresets)[number]['id'];

export const EvChargingCalculator: React.FC<Props> = ({ onSaveHistory }) => {
  const saveHistory = onSaveHistory as SaveHistoryFn;
  const [chargerId, setChargerId] = useState<ChargerId>('publicFast');
  const [unitPrice, setUnitPrice] = useState(350);
  const [batteryCapacity, setBatteryCapacity] = useState(60);
  const [startSoc, setStartSoc] = useState(20);
  const [targetSoc, setTargetSoc] = useState(80);
  const [saved, setSaved] = useState(false);

  const charger = chargerPresets.find((c) => c.id === chargerId) ?? chargerPresets[2];

  const { requiredKwh, cost, hours } = useMemo(() => {
    const kwh = Math.max(0, (batteryCapacity * Math.max(0, targetSoc - startSoc)) / 100);
    return {
      requiredKwh: Number(kwh.toFixed(1)),
      cost: Math.round(kwh * unitPrice),
      hours: Number((kwh / charger.powerKw).toFixed(1)),
    };
  }, [batteryCapacity, startSoc, targetSoc, unitPrice, charger]);

  usePendingHistoryRestore<{
    chargerId: ChargerId;
    unitPrice: number;
    batteryCapacity: number;
    startSoc: number;
    targetSoc: number;
  }>('evCharging', (restored) => {
    setChargerId(restored.chargerId);
    setUnitPrice(restored.unitPrice);
    setBatteryCapacity(restored.batteryCapacity);
    setStartSoc(restored.startSoc);
    setTargetSoc(restored.targetSoc);
  });

  const handleSave = () => {
    saveHistory('전기차 충전요금 계산기', `${formatNum(cost)}원 (${requiredKwh}kWh, ${charger.label})`, {
      충전기유형: charger.label,
      단가: `${unitPrice}원/kWh`,
      배터리용량: `${batteryCapacity}kWh`,
      충전범위: `${startSoc}% → ${targetSoc}%`,
      필요전력량: `${requiredKwh}kWh`,
      예상충전요금: `${formatNum(cost)}원`,
      예상소요시간: `${hours}시간`,
    }, {
      chargerId,
      unitPrice,
      batteryCapacity,
      startSoc,
      targetSoc,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-5">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <BatteryCharging className="w-5 h-5 text-lime-600" />
          <span>전기차 충전요금 계산기</span>
        </h3>
        <button onClick={handleSave} className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold whitespace-nowrap" title="계산기록에서 다시 가져올 수 있습니다.">기록저장</button>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">충전기 유형</label>
        <div className="flex flex-wrap gap-2">
          {chargerPresets.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                setChargerId(c.id);
                setUnitPrice(c.unitPrice);
              }}
              className={`px-3 py-2 rounded-lg text-xs font-semibold ${chargerId === c.id ? 'bg-lime-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
            >
              {c.label}
            </button>
          ))}
        </div>
        <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">충전 출력 약 {charger.powerKw}kW 기준 (사업자·시간대별 실제 요금은 다를 수 있습니다)</div>
      </div>

      <div>
        <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
          <span>충전 단가</span>
          <span className="font-bold text-lime-700 dark:text-lime-400">{unitPrice}원/kWh</span>
        </div>
        <input type="range" min="100" max="500" step="10" value={unitPrice} onChange={(e) => setUnitPrice(Number(e.target.value))} className="w-full accent-lime-600 cursor-pointer" />
      </div>

      <div>
        <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
          <span>배터리 총 용량</span>
          <span className="font-bold text-lime-700 dark:text-lime-400">{batteryCapacity} kWh</span>
        </div>
        <input type="range" min="20" max="120" value={batteryCapacity} onChange={(e) => setBatteryCapacity(Number(e.target.value))} className="w-full accent-lime-600 cursor-pointer" />
        <div className="mt-2 flex justify-between gap-2">
          {[40, 60, 77, 100].map((c) => (
            <button key={c} onClick={() => setBatteryCapacity(c)} className={`px-2 py-1 rounded text-[11px] font-medium ${batteryCapacity === c ? 'bg-lime-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
              {c}kWh
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            <span>현재 충전율</span>
            <span className="font-bold text-lime-700 dark:text-lime-400">{startSoc}%</span>
          </div>
          <input type="range" min="0" max="100" value={startSoc} onChange={(e) => setStartSoc(Number(e.target.value))} className="w-full accent-lime-600 cursor-pointer" />
        </div>
        <div>
          <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            <span>목표 충전율</span>
            <span className="font-bold text-lime-700 dark:text-lime-400">{targetSoc}%</span>
          </div>
          <input type="range" min="0" max="100" value={targetSoc} onChange={(e) => setTargetSoc(Number(e.target.value))} className="w-full accent-lime-600 cursor-pointer" />
        </div>
      </div>

      <div className="rounded-2xl p-4 border border-lime-200 dark:border-lime-900 bg-lime-50/70 dark:bg-lime-950/30 space-y-2">
        <div className="text-xs text-lime-700 dark:text-lime-300 font-semibold">예상 충전요금</div>
        <div className="text-3xl font-black text-lime-900 dark:text-lime-100">{formatNum(cost)}원</div>
        <div className="text-xs text-lime-800 dark:text-lime-200">필요 전력량 {requiredKwh}kWh · 예상 소요시간 약 {hours}시간</div>
      </div>

      {saved && <div className="text-xs font-semibold text-center text-lime-700 dark:text-lime-300 bg-lime-100/80 dark:bg-lime-950/60 rounded-lg p-2">히스토리에 저장되었습니다.</div>}
    </div>
  );
};
