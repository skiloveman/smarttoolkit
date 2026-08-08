import React, { useMemo, useState } from 'react';
import { Truck } from 'lucide-react';
import { SaveHistoryFn } from '../../types';
import { formatKrw, formatNum } from '../../utils/calculators';
import { usePendingHistoryRestore } from '../../utils/historyRestore';

interface Props {
  onSaveHistory: (title: string, summary: string, details: Record<string, string | number>) => void;
}

const movingTypes = [
  { id: 'full', label: '포장이사 (전체 포장·운반)', unitPrice: 80000 },
  { id: 'semi', label: '반포장이사 (일부 직접 포장)', unitPrice: 48000 },
  { id: 'general', label: '일반용달 (직접 포장)', unitPrice: 28000 },
] as const;

type MovingTypeId = (typeof movingTypes)[number]['id'];

export const MovingCostCalculator: React.FC<Props> = ({ onSaveHistory }) => {
  const saveHistory = onSaveHistory as SaveHistoryFn;
  const [movingTypeId, setMovingTypeId] = useState<MovingTypeId>('full');
  const [pyeong, setPyeong] = useState(24);
  const [distanceKm, setDistanceKm] = useState(20);
  const [peakSeason, setPeakSeason] = useState(false);
  const [needLadder, setNeedLadder] = useState(false);
  const [saved, setSaved] = useState(false);

  const movingType = movingTypes.find((t) => t.id === movingTypeId) ?? movingTypes[0];

  const result = useMemo(() => {
    const baseCost = pyeong * movingType.unitPrice;
    const distanceSurcharge = distanceKm > 50 ? (distanceKm - 50) * 3000 : 0;
    const peakSurcharge = peakSeason ? baseCost * 0.2 : 0;
    const ladderCost = needLadder ? 200000 : 0;
    const totalCost = Math.round(baseCost + distanceSurcharge + peakSurcharge + ladderCost);
    return {
      baseCost: Math.round(baseCost),
      distanceSurcharge: Math.round(distanceSurcharge),
      peakSurcharge: Math.round(peakSurcharge),
      ladderCost,
      totalCost,
      lowEstimate: Math.round(totalCost * 0.85),
      highEstimate: Math.round(totalCost * 1.15),
    };
  }, [pyeong, movingType, distanceKm, peakSeason, needLadder]);

  usePendingHistoryRestore<{
    movingTypeId: MovingTypeId;
    pyeong: number;
    distanceKm: number;
    peakSeason: boolean;
    needLadder: boolean;
  }>('movingCost', (restored) => {
    setMovingTypeId(restored.movingTypeId);
    setPyeong(restored.pyeong);
    setDistanceKm(restored.distanceKm);
    setPeakSeason(restored.peakSeason);
    setNeedLadder(restored.needLadder);
  });

  const handleSave = () => {
    saveHistory('이사비용 계산기', `예상 ${formatKrw(result.lowEstimate)} ~ ${formatKrw(result.highEstimate)}`, {
      이사방식: movingType.label,
      평수: `${pyeong}평`,
      이동거리: `${distanceKm}km`,
      성수기여부: peakSeason ? '예' : '아니오',
      사다리차: needLadder ? '필요' : '불필요',
      예상비용범위: `${formatKrw(result.lowEstimate)} ~ ${formatKrw(result.highEstimate)}`,
    }, { movingTypeId, pyeong, distanceKm, peakSeason, needLadder });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-5">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Truck className="w-5 h-5 text-orange-500" />
          <span>이사비용 계산기</span>
        </h3>
        <button onClick={handleSave} className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold whitespace-nowrap" title="계산기록에서 다시 가져올 수 있습니다.">기록저장</button>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">이사 방식</label>
        <div className="flex flex-wrap gap-2">
          {movingTypes.map((t) => (
            <button
              key={t.id}
              onClick={() => setMovingTypeId(t.id)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold ${movingTypeId === t.id ? 'bg-orange-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            <span>이사 평수</span>
            <span className="font-bold text-orange-600 dark:text-orange-400">{pyeong}평</span>
          </div>
          <input type="range" min="5" max="60" value={pyeong} onChange={(e) => setPyeong(Number(e.target.value))} className="w-full accent-orange-600 cursor-pointer" />
        </div>
        <div>
          <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            <span>이동 거리</span>
            <span className="font-bold text-orange-600 dark:text-orange-400">{distanceKm}km</span>
          </div>
          <input type="range" min="1" max="300" value={distanceKm} onChange={(e) => setDistanceKm(Number(e.target.value))} className="w-full accent-orange-600 cursor-pointer" />
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
          <input type="checkbox" checked={peakSeason} onChange={(e) => setPeakSeason(e.target.checked)} className="w-4 h-4 accent-orange-600" />
          성수기 이사 (3~4월, 11~12월)
        </label>
        <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
          <input type="checkbox" checked={needLadder} onChange={(e) => setNeedLadder(e.target.checked)} className="w-4 h-4 accent-orange-600" />
          사다리차 필요
        </label>
      </div>

      <div className="rounded-2xl p-4 border border-orange-200 dark:border-orange-900 bg-orange-50/70 dark:bg-orange-950/30 space-y-3">
        <div>
          <div className="text-xs text-orange-700 dark:text-orange-300 font-semibold">예상 이사비용 범위</div>
          <div className="text-2xl font-black text-orange-900 dark:text-orange-100 mt-1">{formatKrw(result.lowEstimate)} ~ {formatKrw(result.highEstimate)}</div>
        </div>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="rounded-xl bg-white/70 dark:bg-slate-900/40 p-3 border border-orange-100 dark:border-orange-900/60">
            <div className="text-slate-500 dark:text-slate-400 mb-1">기본 이사비용</div>
            <div className="font-bold text-slate-800 dark:text-slate-100">{formatNum(result.baseCost)}원</div>
          </div>
          <div className="rounded-xl bg-white/70 dark:bg-slate-900/40 p-3 border border-orange-100 dark:border-orange-900/60">
            <div className="text-slate-500 dark:text-slate-400 mb-1">추가비용 (거리·성수기·사다리차)</div>
            <div className="font-bold text-slate-800 dark:text-slate-100">{formatNum(result.distanceSurcharge + result.peakSurcharge + result.ladderCost)}원</div>
          </div>
        </div>
        <div className="text-[11px] text-slate-500 dark:text-slate-400">실제 견적은 업체, 층수·엘리베이터 유무, 방문 시기에 따라 달라질 수 있는 참고용 예상치입니다.</div>
      </div>

      {saved && <div className="text-xs font-semibold text-center text-orange-700 dark:text-orange-300 bg-orange-100/80 dark:bg-orange-950/60 rounded-lg p-2">히스토리에 저장되었습니다.</div>}
    </div>
  );
};
