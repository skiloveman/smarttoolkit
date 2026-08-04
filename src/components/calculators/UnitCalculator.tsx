import React, { useState } from 'react';
import { Ruler, Copy, Check, ArrowLeftRight, BookmarkPlus } from 'lucide-react';
import { formatNum } from '../../utils/calculators';

interface Props {
  onSaveHistory: (title: string, summary: string, details: Record<string, string | number>) => void;
}

export const UnitCalculator: React.FC<Props> = ({ onSaveHistory }) => {
  const [unitType, setUnitType] = useState<'pyung' | 'length' | 'weight' | 'temp'>('pyung');
  const [inputValue, setInputValue] = useState<number>(34); // 34평 default (84㎡)
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  // Pyung <-> Sqm
  // 1평 = 3.305785 ㎡
  const sqmResult = Number((inputValue * 3.305785).toFixed(2));
  const pyungFromSqm = Number((inputValue / 3.305785).toFixed(2));

  // Length: cm <-> inch <-> feet <-> m
  const inchVal = Number((inputValue * 0.393701).toFixed(2));
  const feetVal = Number((inputValue * 0.0328084).toFixed(2));

  // Weight: kg <-> lb
  const lbVal = Number((inputValue * 2.20462).toFixed(2));

  const handleCopy = () => {
    let text = '';
    if (unitType === 'pyung') {
      text = `[아파트 평수 ↔ ㎡ 변환] ${inputValue}평 = ${sqmResult}㎡ (제곱미터)`;
    } else if (unitType === 'length') {
      text = `[길이 변환] ${inputValue}cm = ${inchVal}인치 = ${feetVal}피트`;
    } else {
      text = `[무게 변환] ${inputValue}kg = ${lbVal}파운드(lbs)`;
    }
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    onSaveHistory('단위 변환 결과', `${inputValue}평 = ${sqmResult}㎡`, {
      '입력 단위': `${inputValue} 평`,
      '변환 결과': `${sqmResult} ㎡`,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Ruler className="w-5 h-5 text-emerald-500" />
          <span>단위 변환기</span>
        </h3>
        <div className="flex rounded-lg bg-slate-100 dark:bg-slate-800 p-1 text-xs font-semibold">
          <button
            onClick={() => {
              setUnitType('pyung');
              setInputValue(34);
            }}
            className={`px-3 py-1.5 rounded-md transition-all ${
              unitType === 'pyung' ? 'bg-white dark:bg-slate-700 text-emerald-600 font-bold shadow-xs' : 'text-slate-500'
            }`}
          >
            아파트 평수↔㎡
          </button>
          <button
            onClick={() => {
              setUnitType('length');
              setInputValue(170);
            }}
            className={`px-3 py-1.5 rounded-md transition-all ${
              unitType === 'length' ? 'bg-white dark:bg-slate-700 text-emerald-600 font-bold shadow-xs' : 'text-slate-500'
            }`}
          >
            길이 (cm/inch)
          </button>
          <button
            onClick={() => {
              setUnitType('weight');
              setInputValue(70);
            }}
            className={`px-3 py-1.5 rounded-md transition-all ${
              unitType === 'weight' ? 'bg-white dark:bg-slate-700 text-emerald-600 font-bold shadow-xs' : 'text-slate-500'
            }`}
          >
            무게 (kg/lb)
          </button>
        </div>
      </div>

      {unitType === 'pyung' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              면적 평수 입력 (평)
            </label>
            <input
              type="number"
              value={inputValue}
              onChange={(e) => setInputValue(Math.max(0, Number(e.target.value)))}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 px-4 py-3 text-2xl font-black text-slate-900 dark:text-slate-100 focus:outline-none"
            />
            <div className="flex flex-wrap gap-1.5">
              {[18, 24, 30, 34, 42, 59].map((p) => (
                <button
                  key={p}
                  onClick={() => setInputValue(p)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                    inputValue === p ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
                  }`}
                >
                  {p}평
                </button>
              ))}
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 flex flex-col justify-between">
            <div>
              <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">제곱미터 변환 결과 (㎡)</div>
              <div className="text-4xl font-black text-emerald-900 dark:text-emerald-200 mt-2">
                {sqmResult} ㎡
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                1평 = 3.305785 ㎡ (약 3.3㎡)
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <button
                onClick={handleSave}
                className="p-2 rounded-lg bg-white dark:bg-slate-800 border text-slate-600"
                title="저장"
              >
                <BookmarkPlus className="w-4 h-4" />
              </button>
              <button
                onClick={handleCopy}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold flex items-center gap-1"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? '복사완료' : '결과 복사'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {unitType === 'length' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              길이 입력 (cm)
            </label>
            <input
              type="number"
              value={inputValue}
              onChange={(e) => setInputValue(Math.max(0, Number(e.target.value)))}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 px-4 py-3 text-2xl font-black text-slate-900 dark:text-slate-100 focus:outline-none"
            />
          </div>
          <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">인치 (inch)</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 text-base">{inchVal} in</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">피트 (feet)</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 text-base">{feetVal} ft</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">미터 (m)</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 text-base">{inputValue / 100} m</span>
            </div>
          </div>
        </div>
      )}

      {unitType === 'weight' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              무게 입력 (kg)
            </label>
            <input
              type="number"
              value={inputValue}
              onChange={(e) => setInputValue(Math.max(0, Number(e.target.value)))}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 px-4 py-3 text-2xl font-black text-slate-900 dark:text-slate-100 focus:outline-none"
            />
          </div>
          <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">파운드 (lb)</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 text-base">{lbVal} lbs</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">그램 (g)</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 text-base">{formatNum(inputValue * 1000)} g</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
