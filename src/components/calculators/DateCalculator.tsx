import React, { useState } from 'react';
import { Calendar, Copy, Check, Clock, Plus, Minus } from 'lucide-react';
import { DefaultValueInput } from '../DefaultValueInput';
import { SaveHistoryFn } from '../../types';
import { formatYmd } from '../../utils/calculators';
import { usePendingHistoryRestore } from '../../utils/historyRestore';

interface Props {
  onSaveHistory: (title: string, summary: string, details: Record<string, string | number>) => void;
}

export const DateCalculator: React.FC<Props> = ({ onSaveHistory }) => {
  const saveHistory = onSaveHistory as SaveHistoryFn;
  const todayStr = formatYmd(new Date());

  // Tab 1: D-day
  const [targetDate, setTargetDate] = useState(todayStr);

  // Tab 2: Date math
  const [baseDate, setBaseDate] = useState(todayStr);
  const [addDays, setAddDays] = useState(100);
  const [addDaysText, setAddDaysText] = useState('100');

  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  usePendingHistoryRestore<{
    targetDate: string;
    baseDate: string;
    addDays: number;
  }>('date', (restored) => {
    setTargetDate(restored.targetDate);
    setBaseDate(restored.baseDate);
    setAddDays(restored.addDays);
    setAddDaysText(String(restored.addDays));
  });

  // D-day calculation
  const calcDday = () => {
    const t = new Date(targetDate);
    const today = new Date(todayStr);
    const diffTime = t.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const ddayResult = calcDday();

  // Date math result
  const calcAddedDate = () => {
    const b = new Date(baseDate);
    b.setDate(b.getDate() + addDays);
    return formatYmd(b);
  };

  const addedDateResult = calcAddedDate();

  const handleCopy = () => {
    const text = `[D-Day & 날짜 계산 결과]
• 목표일(${targetDate}) D-Day: ${
      ddayResult === 0 ? 'D-Day 오늘!' : ddayResult > 0 ? `D-${ddayResult}` : `D+${Math.abs(ddayResult)}`
    }
• 기준일(${baseDate})로부터 ${addDays}일 후: ${addedDateResult}
- 생활 계산기 (https://www.smart-toolkit.com)`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    saveHistory('D-Day & 날짜 계산', `D-Day: D${ddayResult >= 0 ? '-' : '+'}${Math.abs(ddayResult)} / ${addDays}일 후: ${addedDateResult}`, {
      '목표 날짜': targetDate,
      'D-Day 수치': ddayResult,
      '기준일자': baseDate,
      '계산일자': `${addDays}일 후 (${addedDateResult})`,
    }, {
      targetDate,
      baseDate,
      addDays,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Box 1: D-Day Calculator */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-500" />
            <span>D-Day 계산기</span>
          </h3>
          <span className="text-xs text-blue-600 font-semibold">기념일/목표일</span>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            목표 일자 선택
          </label>
          <DefaultValueInput
            type="date"
            value={targetDate}
            defaultValueLabel={todayStr}
            onValueChange={setTargetDate}
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 p-3 text-xs font-bold text-slate-800 dark:text-slate-200"
          />
          <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">표시값: {targetDate}</div>
        </div>

        <div className="p-5 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-center">
          <div className="text-xs text-blue-600 dark:text-blue-400 font-semibold">목표일까지 카운트다운</div>
          <div className="text-4xl font-black text-blue-900 dark:text-blue-200 mt-1">
            {ddayResult === 0
              ? 'D-DAY (오늘)'
              : ddayResult > 0
              ? `D - ${ddayResult}`
              : `D + ${Math.abs(ddayResult)}`}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {ddayResult > 0 ? `${ddayResult}일 남았습니다.` : `${Math.abs(ddayResult)}일 지났습니다.`}
          </div>
        </div>
      </div>

      {/* Box 2: Date Math (X일 후/전) */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-500" />
            <span>날짜 더하기/빼기</span>
          </h3>
          <span className="text-xs text-indigo-600 font-semibold">백일/아기/기념일</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              기준 일자
            </label>
            <DefaultValueInput
              type="date"
              value={baseDate}
              defaultValueLabel={todayStr}
              onValueChange={setBaseDate}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 p-2.5 text-xs font-bold text-slate-800 dark:text-slate-200"
            />
            <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">표시값: {baseDate}</div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              더할 일수 (일)
            </label>
            <DefaultValueInput
              type="number"
              value={addDaysText}
              defaultValueLabel={100}
              onValueChange={(value) => {
                setAddDaysText(value);
                const n = Number(value);
                if (value.trim() !== '' && !Number.isNaN(n)) setAddDays(n);
              }}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 p-2.5 text-xs font-bold text-slate-800 dark:text-slate-200"
            />
          </div>
        </div>

        {/* Preset Days */}
        <div className="flex gap-1.5">
          {[50, 100, 200, 300, 365].map((d) => (
            <button
              key={d}
              onClick={() => {
                setAddDays(d);
                setAddDaysText(String(d));
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                addDays === d ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
              }`}
            >
              {d}일
            </button>
          ))}
        </div>

        <div className="p-5 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900 text-center">
          <div className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">
            {addDays >= 0 ? `${addDays}일 후 날짜` : `${Math.abs(addDays)}일 전 날짜`}
          </div>
          <div className="text-3xl font-black text-indigo-900 dark:text-indigo-200 mt-1">
            {addedDateResult}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={handleSave}
            className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold whitespace-nowrap"
            title="계산기록에서 다시 가져올 수 있습니다."
          >기록저장</button>
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
