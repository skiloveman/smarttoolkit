import React, { useMemo, useState } from 'react';
import { Moon } from 'lucide-react';
import { SaveHistoryFn } from '../../types';
import { usePendingHistoryRestore } from '../../utils/historyRestore';

interface Props {
  onSaveHistory: (title: string, summary: string, details: Record<string, string | number>) => void;
}

type Mode = 'bedtime' | 'wake';

const FALL_ASLEEP_MIN = 14;
const CYCLE_MIN = 90;
const CYCLE_COUNTS = [3, 4, 5, 6];

function parseTime(value: string): number {
  const [h, m] = value.split(':').map(Number);
  return (h % 24) * 60 + (m % 60);
}

function formatTimeFromMinutes(totalMinutes: number): { time: string; dayOffset: number } {
  let m = totalMinutes % 1440;
  let dayOffset = Math.floor(totalMinutes / 1440);
  if (m < 0) {
    m += 1440;
    dayOffset -= 1;
  }
  const h = Math.floor(m / 60);
  const min = m % 60;
  return { time: `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`, dayOffset };
}

export const SleepCycleCalculator: React.FC<Props> = ({ onSaveHistory }) => {
  const saveHistory = onSaveHistory as SaveHistoryFn;
  const [mode, setMode] = useState<Mode>('wake');
  const [bedtime, setBedtime] = useState('23:30');
  const [wakeTime, setWakeTime] = useState('07:00');
  const [saved, setSaved] = useState(false);

  const results = useMemo(() => {
    if (mode === 'bedtime') {
      const base = parseTime(bedtime) + FALL_ASLEEP_MIN;
      return CYCLE_COUNTS.map((cycles) => {
        const { time, dayOffset } = formatTimeFromMinutes(base + cycles * CYCLE_MIN);
        return { cycles, hours: Number(((cycles * CYCLE_MIN) / 60).toFixed(1)), time, dayOffset };
      });
    }
    const base = parseTime(wakeTime);
    return CYCLE_COUNTS.map((cycles) => {
      const { time, dayOffset } = formatTimeFromMinutes(base - cycles * CYCLE_MIN - FALL_ASLEEP_MIN);
      return { cycles, hours: Number(((cycles * CYCLE_MIN) / 60).toFixed(1)), time, dayOffset };
    }).reverse();
  }, [mode, bedtime, wakeTime]);

  usePendingHistoryRestore<{ mode: Mode; bedtime: string; wakeTime: string }>('sleepCycle', (restored) => {
    setMode(restored.mode);
    setBedtime(restored.bedtime);
    setWakeTime(restored.wakeTime);
  });

  const handleSave = () => {
    const details: Record<string, string | number> = {
      기준모드: mode === 'bedtime' ? '취침시간 기준' : '기상시간 기준',
      [mode === 'bedtime' ? '취침시간' : '기상시간']: mode === 'bedtime' ? bedtime : wakeTime,
    };
    results.forEach((r) => {
      details[`${r.cycles}사이클(${r.hours}시간)`] = `${r.time}${r.dayOffset > 0 ? ' (다음날)' : r.dayOffset < 0 ? ' (전날)' : ''}`;
    });
    saveHistory('수면 시간/사이클 계산기', `추천 ${results.length}개 시간대 계산됨`, details, { mode, bedtime, wakeTime });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-5">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Moon className="w-5 h-5 text-indigo-500" />
          <span>수면 시간/사이클 계산기</span>
        </h3>
        <button onClick={handleSave} className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold whitespace-nowrap" title="계산기록에서 다시 가져올 수 있습니다.">기록저장</button>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">계산 기준</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setMode('wake')}
            className={`px-3 py-2 rounded-lg text-xs font-semibold ${mode === 'wake' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
          >
            기상시간 기준 (몇시에 자야 할까?)
          </button>
          <button
            onClick={() => setMode('bedtime')}
            className={`px-3 py-2 rounded-lg text-xs font-semibold ${mode === 'bedtime' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
          >
            취침시간 기준 (몇시에 일어날까?)
          </button>
        </div>
      </div>

      {mode === 'wake' ? (
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">기상 목표 시간</label>
          <input
            type="time"
            value={wakeTime}
            onChange={(e) => setWakeTime(e.target.value)}
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/60 p-2.5 text-sm font-bold text-slate-800 dark:text-slate-100"
          />
        </div>
      ) : (
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">취침(눕는) 시간</label>
          <input
            type="time"
            value={bedtime}
            onChange={(e) => setBedtime(e.target.value)}
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/60 p-2.5 text-sm font-bold text-slate-800 dark:text-slate-100"
          />
        </div>
      )}

      <div className="text-[11px] text-slate-500 dark:text-slate-400">렘수면 1사이클 90분 + 잠드는 데 걸리는 시간 약 14분을 반영해 계산합니다. 일반적으로 5~6사이클(7.5~9시간)이 권장 수면시간입니다.</div>

      <div className="rounded-2xl p-4 border border-indigo-200 dark:border-indigo-900 bg-indigo-50/70 dark:bg-indigo-950/30 space-y-2">
        <div className="text-xs text-indigo-700 dark:text-indigo-300 font-semibold">{mode === 'wake' ? '추천 취침 시간' : '추천 기상 시간'}</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {results.map((r) => (
            <div key={r.cycles} className={`rounded-xl p-3 text-center border ${r.cycles >= 5 ? 'border-indigo-300 dark:border-indigo-700 bg-white dark:bg-slate-900' : 'border-indigo-100 dark:border-indigo-900/60 bg-white/60 dark:bg-slate-900/40'}`}>
              <div className="text-lg font-black text-indigo-900 dark:text-indigo-100">{r.time}</div>
              <div className="text-[11px] text-indigo-700 dark:text-indigo-300 mt-0.5">{r.dayOffset > 0 ? '다음날 · ' : r.dayOffset < 0 ? '전날 · ' : ''}{r.cycles}사이클 ({r.hours}시간)</div>
            </div>
          ))}
        </div>
      </div>

      {saved && <div className="text-xs font-semibold text-center text-indigo-700 dark:text-indigo-300 bg-indigo-100/80 dark:bg-indigo-950/60 rounded-lg p-2">히스토리에 저장되었습니다.</div>}
    </div>
  );
};
