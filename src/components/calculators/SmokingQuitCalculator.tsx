import React, { useMemo, useState } from 'react';
import { Flame } from 'lucide-react';
import { DefaultValueInput } from '../DefaultValueInput';
import { SaveHistoryFn } from '../../types';
import { formatKrw, formatNum, formatYmd } from '../../utils/calculators';
import { usePendingHistoryRestore } from '../../utils/historyRestore';

interface Props {
  onSaveHistory: (title: string, summary: string, details: Record<string, string | number>) => void;
}

function daysBetween(startText: string, endText: string): number {
  const start = new Date(startText);
  const end = new Date(endText);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;

  const ms = end.getTime() - start.getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}

function splitDaysToYmd(totalDays: number): { years: number; months: number; days: number } {
  const safeDays = Math.max(0, Math.floor(totalDays));
  const years = Math.floor(safeDays / 365);
  const remainAfterYears = safeDays % 365;
  const months = Math.floor(remainAfterYears / 30);
  const days = remainAfterYears % 30;
  return { years, months, days };
}

function formatDurationKorean(duration: { years: number; months: number; days: number }): string {
  const parts: string[] = [`${duration.years}년`];
  if (duration.months > 0) parts.push(`${duration.months}개월`);
  parts.push(`${duration.days}일`);
  return parts.join(' ');
}

export const SmokingQuitCalculator: React.FC<Props> = ({ onSaveHistory }) => {
  const saveHistory = onSaveHistory as SaveHistoryFn;
  const [quitDate, setQuitDate] = useState<string>(() => formatYmd(new Date()));
  const [endDate, setEndDate] = useState<string>(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 20);
    return formatYmd(d);
  });
  const [cigsPerDay, setCigsPerDay] = useState<number>(20);
  const [packPrice, setPackPrice] = useState<number>(4500);
  const [cigsPerPack, setCigsPerPack] = useState<number>(20);
  const [saved, setSaved] = useState(false);

  const result = useMemo(() => {
    const quitDays = daysBetween(quitDate, endDate);
    const quitYmd = splitDaysToYmd(quitDays);
    const safeCigsPerPack = Math.max(1, cigsPerPack);

    const avoidedCigs = Math.round(quitDays * cigsPerDay);
    const costPerCig = packPrice / safeCigsPerPack;
    const moneySaved = Math.round(avoidedCigs * costPerCig);

    const lifeMinutesRecovered = avoidedCigs * 11;
    const recoveredDays = Math.round(lifeMinutesRecovered / (60 * 24));
    const recoveredYmd = splitDaysToYmd(recoveredDays);

    return {
      quitDays,
      quitYmd,
      avoidedCigs,
      moneySaved,
      recoveredDays,
      recoveredYmd,
    };
  }, [cigsPerDay, cigsPerPack, endDate, packPrice, quitDate]);

  usePendingHistoryRestore<{
    quitDate: string;
    endDate: string;
    cigsPerDay: number;
    packPrice: number;
    cigsPerPack: number;
  }>('smokingQuit', (restored) => {
    setQuitDate(restored.quitDate);
    setEndDate(restored.endDate);
    setCigsPerDay(restored.cigsPerDay);
    setPackPrice(restored.packPrice);
    setCigsPerPack(restored.cigsPerPack);
  });

  const handleSave = () => {
    saveHistory('금연 이득 계산기', `${result.quitDays}일 금연 / ${formatKrw(result.moneySaved)} 절약`, {
      금연시작일: quitDate,
      금연종료일: endDate,
      하루흡연량: `${cigsPerDay}개비`,
      담뱃값: formatKrw(packPrice),
      갑당개비수: `${cigsPerPack}개비`,
      금연일수: `${formatNum(result.quitDays)}일 (${formatDurationKorean(result.quitYmd)})`,
      미흡연개비: `${formatNum(result.avoidedCigs)}개비`,
      절약금액: formatKrw(result.moneySaved),
      기대수명회복: `${formatNum(result.recoveredDays)}일 (${formatDurationKorean(result.recoveredYmd)})`,
    }, {
      quitDate,
      endDate,
      cigsPerDay,
      packPrice,
      cigsPerPack,
    });

    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-5">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Flame className="w-5 h-5 text-orange-500" />
          <span>금연 이득 계산기</span>
        </h3>
        <button
          onClick={handleSave}
          className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold whitespace-nowrap"
          title="계산기록에서 다시 가져올 수 있습니다."
        >기록저장</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">금연 시작일</label>
          <DefaultValueInput
            type="date"
            value={quitDate}
            defaultValueLabel={formatYmd(new Date())}
            onValueChange={setQuitDate}
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-sm font-semibold text-slate-800 dark:text-slate-100"
          />
          <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">표시값: {quitDate}</div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">금연 종료일 (계산 기준일)</label>
          <DefaultValueInput
            type="date"
            value={endDate}
            defaultValueLabel={(() => {
              const d = new Date();
              d.setFullYear(d.getFullYear() + 20);
              return formatYmd(d);
            })()}
            onValueChange={setEndDate}
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-sm font-semibold text-slate-800 dark:text-slate-100"
          />
          <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">표시값: {endDate}</div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">하루 흡연량 (개비)</label>
          <DefaultValueInput
            type="number"
            value={cigsPerDay}
            defaultValueLabel={20}
            onValueChange={(value) => setCigsPerDay(Number(value) || 0)}
            onBlur={() => setCigsPerDay((prev) => Math.max(0, Math.min(100, prev || 0)))}
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/60 p-2.5 text-sm font-bold text-slate-800 dark:text-slate-100"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">담배 1갑 가격 (원)</label>
          <DefaultValueInput
            type="number"
            value={packPrice}
            defaultValueLabel={4500}
            onValueChange={(value) => setPackPrice(Number(value) || 0)}
            onBlur={() => setPackPrice((prev) => Math.max(0, Math.min(50000, prev || 0)))}
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/60 p-2.5 text-sm font-bold text-slate-800 dark:text-slate-100"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">1갑당 개비 수</label>
          <DefaultValueInput
            type="number"
            value={cigsPerPack}
            defaultValueLabel={20}
            onValueChange={(value) => setCigsPerPack(Number(value) || 0)}
            onBlur={() => setCigsPerPack((prev) => Math.max(1, Math.min(40, prev || 1)))}
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/60 p-2.5 text-sm font-bold text-slate-800 dark:text-slate-100"
          />
        </div>
      </div>

      <div className="rounded-2xl p-4 border border-orange-200 dark:border-orange-900 bg-orange-50/70 dark:bg-orange-950/30 space-y-2">
        <div className="text-xs text-orange-700 dark:text-orange-300 font-semibold">금연 이득 결과</div>
        <div className="text-sm text-orange-900 dark:text-orange-100">금연 일수: <strong>{formatNum(result.quitDays)}일 ({formatDurationKorean(result.quitYmd)})</strong></div>
        <div className="text-sm text-orange-900 dark:text-orange-100">미흡연 개비: <strong>{formatNum(result.avoidedCigs)}개비</strong></div>
        <div className="text-3xl font-black text-orange-900 dark:text-orange-100">{formatKrw(result.moneySaved)}</div>
        <div className="text-xs text-orange-800 dark:text-orange-200">기대수명 회복 추정: 약 {formatNum(result.recoveredDays)}일 ({formatDurationKorean(result.recoveredYmd)})</div>
      </div>

      {saved && (
        <div className="text-xs font-semibold text-center text-orange-700 dark:text-orange-300 bg-orange-100/80 dark:bg-orange-950/60 rounded-lg p-2">
          히스토리에 저장되었습니다.
        </div>
      )}
    </div>
  );
};
