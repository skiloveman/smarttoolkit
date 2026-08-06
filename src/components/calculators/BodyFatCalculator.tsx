import React, { useMemo, useState } from 'react';
import { Activity, BookmarkPlus } from 'lucide-react';
import { DefaultValueInput } from '../DefaultValueInput';
import { SaveHistoryFn } from '../../types';
import { formatNum } from '../../utils/calculators';
import { usePendingHistoryRestore } from '../../utils/historyRestore';

interface Props {
  onSaveHistory: (title: string, summary: string, details: Record<string, string | number>) => void;
}

export const BodyFatCalculator: React.FC<Props> = ({ onSaveHistory }) => {
  const saveHistory = onSaveHistory as SaveHistoryFn;
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [age, setAge] = useState(30);
  const [heightCm, setHeightCm] = useState(175);
  const [weightKg, setWeightKg] = useState(70);
  const [saved, setSaved] = useState(false);

  const { bmi, bodyFat, level, recommendation } = useMemo(() => {
    const h = Math.max(1, heightCm) / 100;
    const bmiVal = weightKg / (h * h);
    const sexFactor = gender === 'male' ? 1 : 0;
    const fat = 1.2 * bmiVal + 0.23 * age - 10.8 * sexFactor - 5.4;

    let fatLevel = '정상';
    let tip = '현재 생활 습관을 유지해 주세요.';

    if (gender === 'male') {
      if (fat < 8) {
        fatLevel = '매우 낮음';
        tip = '필수 체지방 부족 가능성이 있어 영양 균형을 점검해 보세요.';
      } else if (fat < 20) {
        fatLevel = '정상';
        tip = '좋은 체지방 구간입니다. 근력/유산소 균형을 유지하세요.';
      } else if (fat < 25) {
        fatLevel = '주의';
        tip = '복부지방 관리를 위해 주 3회 이상 유산소 운동을 권장합니다.';
      } else {
        fatLevel = '높음';
        tip = '식단 관리와 체지방 감량 계획을 시작하는 것이 좋습니다.';
      }
    } else {
      if (fat < 18) {
        fatLevel = '매우 낮음';
        tip = '필수 체지방 부족 가능성이 있어 영양 균형을 점검해 보세요.';
      } else if (fat < 30) {
        fatLevel = '정상';
        tip = '좋은 체지방 구간입니다. 현재 루틴을 유지해 주세요.';
      } else if (fat < 35) {
        fatLevel = '주의';
        tip = '주기적인 체성분 체크와 생활습관 개선을 권장합니다.';
      } else {
        fatLevel = '높음';
        tip = '체지방 감량 중심의 식단/운동 계획이 필요합니다.';
      }
    }

    return {
      bmi: Number(bmiVal.toFixed(1)),
      bodyFat: Number(fat.toFixed(1)),
      level: fatLevel,
      recommendation: tip,
    };
  }, [age, gender, heightCm, weightKg]);

  usePendingHistoryRestore<{
    gender: 'male' | 'female';
    age: number;
    heightCm: number;
    weightKg: number;
  }>('bodyFat', (restored) => {
    setGender(restored.gender);
    setAge(restored.age);
    setHeightCm(restored.heightCm);
    setWeightKg(restored.weightKg);
  });

  const handleSave = () => {
    saveHistory('체지방률 계산기', `체지방률 ${bodyFat}% (${level})`, {
      성별: gender === 'male' ? '남성' : '여성',
      나이: `${age}세`,
      신장: `${heightCm}cm`,
      체중: `${weightKg}kg`,
      BMI: bmi,
      체지방률: `${bodyFat}%`,
      판정: level,
    }, {
      gender,
      age,
      heightCm,
      weightKg,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-5">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Activity className="w-5 h-5 text-emerald-500" />
          <span>체지방률 계산기</span>
        </h3>
        <button
          onClick={handleSave}
          className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
          title="저장"
        >
          <BookmarkPlus className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">성별</label>
          <div className="flex gap-2">
            <button
              onClick={() => setGender('male')}
              className={`px-3 py-2 rounded-lg text-xs font-semibold ${
                gender === 'male' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
              }`}
            >
              남성
            </button>
            <button
              onClick={() => setGender('female')}
              className={`px-3 py-2 rounded-lg text-xs font-semibold ${
                gender === 'female' ? 'bg-pink-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
              }`}
            >
              여성
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">나이</label>
          <DefaultValueInput
            type="number"
            value={age}
            min={10}
            max={100}
            defaultValueLabel={30}
            onValueChange={(value) => setAge(Number(value) || 0)}
            onBlur={() => setAge((prev) => Math.max(10, Math.min(100, prev || 0)))}
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/60 p-2.5 text-sm font-bold text-slate-800 dark:text-slate-100"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">신장 (cm)</label>
          <DefaultValueInput
            type="number"
            value={heightCm}
            min={100}
            max={230}
            defaultValueLabel={175}
            onValueChange={(value) => setHeightCm(Number(value) || 0)}
            onBlur={() => setHeightCm((prev) => Math.max(100, Math.min(230, prev || 0)))}
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/60 p-2.5 text-sm font-bold text-slate-800 dark:text-slate-100"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">체중 (kg)</label>
          <DefaultValueInput
            type="number"
            value={weightKg}
            min={20}
            max={250}
            defaultValueLabel={70}
            onValueChange={(value) => setWeightKg(Number(value) || 0)}
            onBlur={() => setWeightKg((prev) => Math.max(20, Math.min(250, prev || 0)))}
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/60 p-2.5 text-sm font-bold text-slate-800 dark:text-slate-100"
          />
        </div>
      </div>

      <div className="rounded-2xl p-4 border border-emerald-200 dark:border-emerald-900 bg-emerald-50/70 dark:bg-emerald-950/30 space-y-2">
        <div className="text-xs text-emerald-700 dark:text-emerald-300 font-semibold">추정 결과</div>
        <div className="text-sm text-emerald-900 dark:text-emerald-100">BMI: <strong>{bmi}</strong></div>
        <div className="text-3xl font-black text-emerald-900 dark:text-emerald-100">{formatNum(bodyFat)}%</div>
        <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">판정: {level}</div>
        <p className="text-xs text-emerald-800 dark:text-emerald-200 leading-relaxed">{recommendation}</p>
      </div>

      {saved && (
        <div className="text-xs font-semibold text-center text-emerald-700 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-950/60 rounded-lg p-2">
          히스토리에 저장되었습니다.
        </div>
      )}
    </div>
  );
};
