import React, { useMemo, useState } from 'react';
import { Ruler, BookmarkPlus } from 'lucide-react';
import { DefaultValueInput } from '../DefaultValueInput';
import { SaveHistoryFn } from '../../types';
import { formatNum } from '../../utils/calculators';
import { usePendingHistoryRestore } from '../../utils/historyRestore';

interface Props {
  onSaveHistory: (title: string, summary: string, details: Record<string, string | number>) => void;
}

export const IdealWeightCalculator: React.FC<Props> = ({ onSaveHistory }) => {
  const saveHistory = onSaveHistory as SaveHistoryFn;
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [heightCm, setHeightCm] = useState(175);
  const [currentWeightKg, setCurrentWeightKg] = useState(70);
  const [saved, setSaved] = useState(false);

  const { idealWeight, minWeight, maxWeight, diff } = useMemo(() => {
    const h = Math.max(1, heightCm) / 100;
    const factor = gender === 'male' ? 22 : 21;
    const ideal = h * h * factor;
    const min = h * h * 18.5;
    const max = h * h * 22.9;

    return {
      idealWeight: Number(ideal.toFixed(1)),
      minWeight: Number(min.toFixed(1)),
      maxWeight: Number(max.toFixed(1)),
      diff: Number((currentWeightKg - ideal).toFixed(1)),
    };
  }, [currentWeightKg, gender, heightCm]);

  usePendingHistoryRestore<{
    gender: 'male' | 'female';
    heightCm: number;
    currentWeightKg: number;
  }>('idealWeight', (restored) => {
    setGender(restored.gender);
    setHeightCm(restored.heightCm);
    setCurrentWeightKg(restored.currentWeightKg);
  });

  const handleSave = () => {
    saveHistory('표준 체중 계산기', `표준 체중 ${idealWeight}kg`, {
      성별: gender === 'male' ? '남성' : '여성',
      신장: `${heightCm}cm`,
      현재체중: `${currentWeightKg}kg`,
      표준체중: `${idealWeight}kg`,
      정상범위: `${minWeight}kg ~ ${maxWeight}kg`,
      차이: `${diff > 0 ? '+' : ''}${diff}kg`,
    }, {
      gender,
      heightCm,
      currentWeightKg,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-5">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Ruler className="w-5 h-5 text-teal-500" />
          <span>표준 체중 계산기</span>
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
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">현재 체중 (kg)</label>
          <DefaultValueInput
            type="number"
            value={currentWeightKg}
            min={20}
            max={250}
            defaultValueLabel={70}
            onValueChange={(value) => setCurrentWeightKg(Number(value) || 0)}
            onBlur={() => setCurrentWeightKg((prev) => Math.max(20, Math.min(250, prev || 0)))}
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/60 p-2.5 text-sm font-bold text-slate-800 dark:text-slate-100"
          />
        </div>
      </div>

      <div className="rounded-2xl p-4 border border-teal-200 dark:border-teal-900 bg-teal-50/70 dark:bg-teal-950/30 space-y-2">
        <div className="text-xs text-teal-700 dark:text-teal-300 font-semibold">산출 결과</div>
        <div className="text-3xl font-black text-teal-900 dark:text-teal-100">{formatNum(idealWeight)} kg</div>
        <div className="text-xs font-semibold text-teal-700 dark:text-teal-300">
          정상 범위: {formatNum(minWeight)}kg ~ {formatNum(maxWeight)}kg
        </div>
        <div className="text-xs text-teal-800 dark:text-teal-200">
          현재 체중과 차이: <strong>{diff > 0 ? '+' : ''}{formatNum(diff)}kg</strong>
        </div>
      </div>

      {saved && (
        <div className="text-xs font-semibold text-center text-teal-700 dark:text-teal-300 bg-teal-100/80 dark:bg-teal-950/60 rounded-lg p-2">
          히스토리에 저장되었습니다.
        </div>
      )}
    </div>
  );
};
