import React, { useState, useMemo } from 'react';
import { calculateBmi, formatNum } from '../../utils/calculators';
import { BmiInput, SaveHistoryFn } from '../../types';
import { Activity, Copy, Check, Heart, Scale, Flame, BookmarkPlus } from 'lucide-react';
import { usePendingHistoryRestore } from '../../utils/historyRestore';

interface Props {
  onSaveHistory: (title: string, summary: string, details: Record<string, string | number>) => void;
}

export const BmiCalculator: React.FC<Props> = ({ onSaveHistory }) => {
  const saveHistory = onSaveHistory as SaveHistoryFn;
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [age, setAge] = useState<number>(30);
  const [heightCm, setHeightCm] = useState<number>(175);
  const [weightKg, setWeightKg] = useState<number>(70);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  const bmiInput: BmiInput = useMemo(
    () => ({
      gender,
      age,
      heightCm,
      weightKg,
    }),
    [gender, age, heightCm, weightKg]
  );

  const result = useMemo(() => calculateBmi(bmiInput), [bmiInput]);

  usePendingHistoryRestore<{
    gender: 'male' | 'female';
    age: number;
    heightCm: number;
    weightKg: number;
  }>('bmi', (restored) => {
    setGender(restored.gender);
    setAge(restored.age);
    setHeightCm(restored.heightCm);
    setWeightKg(restored.weightKg);
  });

  const handleCopy = () => {
    const text = `[BMI 체질량지수 측정 결과]
• 신장/체중: ${heightCm}cm / ${weightKg}kg (${gender === 'male' ? '남성' : '여성'}, ${age}세)
• BMI 수치: ${result.bmi} (판정: ${result.status})
• 정상 체중 범위: ${result.idealWeightMin}kg ~ ${result.idealWeightMax}kg
• 권장 유지 수칙: ${result.healthTip}
- 생활 계산기 (https://ais-dev-mqxu6js2rqs5gficbwuedy-53763444336.asia-northeast1.run.app)`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    saveHistory(
      'BMI 계산 결과',
      `BMI: ${result.bmi} (${result.status}) / 신장: ${heightCm}cm, 체중: ${weightKg}kg`,
      {
        '신장/체중': `${heightCm}cm / ${weightKg}kg`,
        'BMI 지수': `${result.bmi}`,
        '비만도 판정': result.status,
        '정상 체중 범위': `${result.idealWeightMin}kg ~ ${result.idealWeightMax}kg`,
      },
      { gender, age, heightCm, weightKg }
    );
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  // BMI Marker position percentage (15.0 ~ 38.0)
  const markerPercent = Math.min(100, Math.max(0, ((result.bmi - 15) / (38 - 15)) * 100));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Inputs (6 cols) */}
        <div className="lg:col-span-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-500" />
              <span>신체 정보 입력</span>
            </h3>
            <div className="flex rounded-lg bg-slate-100 dark:bg-slate-800 p-1 text-xs font-semibold">
              <button
                onClick={() => setGender('male')}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  gender === 'male'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                남성 ♂
              </button>
              <button
                onClick={() => setGender('female')}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  gender === 'female'
                    ? 'bg-white dark:bg-slate-700 text-pink-600 dark:text-pink-400 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                여성 ♀
              </button>
            </div>
          </div>

          {/* Age */}
          <div>
            <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              <span>나이</span>
              <span className="font-bold text-blue-600 dark:text-blue-400">{age}세</span>
            </div>
            <input
              type="range"
              min="10"
              max="90"
              value={age}
              onChange={(e) => setAge(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>

          {/* Height Slider & Number */}
          <div>
            <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              <span>신장 (키)</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">{heightCm} cm</span>
            </div>
            <input
              type="range"
              min="120"
              max="210"
              value={heightCm}
              onChange={(e) => setHeightCm(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <div className="mt-2 flex justify-between gap-2">
              {[155, 165, 172, 180, 188].map((h) => (
                <button
                  key={h}
                  onClick={() => setHeightCm(h)}
                  className={`px-2 py-1 rounded text-[11px] font-medium ${
                    heightCm === h
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {h}cm
                </button>
              ))}
            </div>
          </div>

          {/* Weight Slider & Number */}
          <div>
            <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              <span>체중 (몸무게)</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">{weightKg} kg</span>
            </div>
            <input
              type="range"
              min="30"
              max="150"
              value={weightKg}
              onChange={(e) => setWeightKg(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <div className="mt-2 flex justify-between gap-2">
              {[50, 60, 70, 80, 90].map((w) => (
                <button
                  key={w}
                  onClick={() => setWeightKg(w)}
                  className={`px-2 py-1 rounded text-[11px] font-medium ${
                    weightKg === w
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {w}kg
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Result Card (6 cols) */}
        <div className="lg:col-span-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 tracking-wider uppercase">
                측정 결과 및 건강 분석
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSave}
                  className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-emerald-600 transition-colors"
                  title="저장"
                >
                  <BookmarkPlus className="w-4 h-4" />
                </button>
                <button
                  onClick={handleCopy}
                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1 transition-all"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? '복사완료' : '결과 복사'}</span>
                </button>
              </div>
            </div>

            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                {result.bmi}
              </span>
              <span
                className="px-3 py-1 rounded-full text-xs font-bold text-white shadow-xs"
                style={{ backgroundColor: result.statusColor }}
              >
                {result.status}
              </span>
            </div>

            {/* Visual Spectrum Gauge */}
            <div className="mb-6 space-y-2">
              <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex justify-between">
                <span>BMI 스펙트럼</span>
                <span>대한비만학회 기준</span>
              </div>

              {/* Progress Bar with Zones */}
              <div className="relative h-4 w-full rounded-full overflow-hidden flex bg-slate-100 dark:bg-slate-800">
                <div className="h-full bg-blue-500 w-[15%]" title="저체중 (<18.5)" />
                <div className="h-full bg-emerald-500 w-[20%]" title="정상 (18.5~22.9)" />
                <div className="h-full bg-amber-500 w-[12%]" title="과체중 (23~24.9)" />
                <div className="h-full bg-orange-500 w-[20%]" title="경도비만 (25~29.9)" />
                <div className="h-full bg-red-500 w-[18%]" title="중정도비만 (30~34.9)" />
                <div className="h-full bg-red-900 w-[15%]" title="고도비만 (>=35)" />

                {/* Marker */}
                <div
                  className="absolute top-0 bottom-0 w-1.5 bg-slate-900 dark:bg-white shadow-md rounded-full transform -translate-x-1/2 transition-all duration-300"
                  style={{ left: `${markerPercent}%` }}
                />
              </div>

              {/* Spectrum Scale Labels */}
              <div className="flex justify-between text-[10px] text-slate-400 font-mono pt-1">
                <span>15.0</span>
                <span>18.5</span>
                <span>23.0</span>
                <span>25.0</span>
                <span>30.0</span>
                <span>35.0+</span>
              </div>
            </div>

            {/* Health Info Badges */}
            <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
              <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 mb-1">
                  <Scale className="w-3.5 h-3.5 text-emerald-500" />
                  <span>표준 정상 체중</span>
                </div>
                <div className="font-bold text-slate-800 dark:text-slate-200">
                  {result.idealWeightMin} kg ~ {result.idealWeightMax} kg
                </div>
              </div>

              <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 mb-1">
                  <Flame className="w-3.5 h-3.5 text-amber-500" />
                  <span>일일 추정 권장 칼로리</span>
                </div>
                <div className="font-bold text-slate-800 dark:text-slate-200">
                  약 {formatNum(result.calorieEstimate)} kcal
                </div>
              </div>
            </div>

            {/* Recommendation Tip Box */}
            <div className="rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/60 p-3.5 flex items-start gap-2.5 text-xs text-emerald-900 dark:text-emerald-300">
              <Heart className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <span>{result.healthTip}</span>
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
