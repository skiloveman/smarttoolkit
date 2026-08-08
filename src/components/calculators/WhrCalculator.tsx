import React, { useMemo, useState } from 'react';
import { Percent } from 'lucide-react';
import { SaveHistoryFn } from '../../types';
import { usePendingHistoryRestore } from '../../utils/historyRestore';

interface Props {
  onSaveHistory: (title: string, summary: string, details: Record<string, string | number>) => void;
}

export const WhrCalculator: React.FC<Props> = ({ onSaveHistory }) => {
  const saveHistory = onSaveHistory as SaveHistoryFn;
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [waistCm, setWaistCm] = useState(82);
  const [hipCm, setHipCm] = useState(95);
  const [saved, setSaved] = useState(false);

  const { whr, level, riskMessage } = useMemo(() => {
    const ratio = hipCm > 0 ? waistCm / hipCm : 0;
    let currentLevel = '낮음';
    let message = '심혈관 위험이 낮은 편입니다.';

    if (gender === 'male') {
      if (ratio < 0.9) {
        currentLevel = '낮음';
        message = '좋은 허리-엉덩이 비율입니다.';
      } else if (ratio < 1.0) {
        currentLevel = '주의';
        message = '복부지방 관리를 시작하는 것이 좋습니다.';
      } else {
        currentLevel = '높음';
        message = '대사/심혈관 위험이 높아 생활습관 개선이 필요합니다.';
      }
    } else {
      if (ratio < 0.8) {
        currentLevel = '낮음';
        message = '좋은 허리-엉덩이 비율입니다.';
      } else if (ratio < 0.85) {
        currentLevel = '주의';
        message = '복부지방 관리를 시작하는 것이 좋습니다.';
      } else {
        currentLevel = '높음';
        message = '대사/심혈관 위험이 높아 생활습관 개선이 필요합니다.';
      }
    }

    return {
      whr: Number(ratio.toFixed(3)),
      level: currentLevel,
      riskMessage: message,
    };
  }, [gender, hipCm, waistCm]);

  usePendingHistoryRestore<{
    gender: 'male' | 'female';
    waistCm: number;
    hipCm: number;
  }>('whr', (restored) => {
    setGender(restored.gender);
    setWaistCm(restored.waistCm);
    setHipCm(restored.hipCm);
  });

  const handleSave = () => {
    saveHistory('WHR 계산기', `WHR ${whr} (${level})`, {
      성별: gender === 'male' ? '남성' : '여성',
      허리둘레: `${waistCm}cm`,
      엉덩이둘레: `${hipCm}cm`,
      WHR: whr,
      판정: level,
    }, {
      gender,
      waistCm,
      hipCm,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-5">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Percent className="w-5 h-5 text-indigo-500" />
          <span>WHR(허리-엉덩이 비율) 계산기</span>
        </h3>
        <button
          onClick={handleSave}
          className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold whitespace-nowrap"
          title="계산기록에서 다시 가져올 수 있습니다."
        >기록저장</button>
      </div>

      <div className="space-y-5">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">성별</label>
          <div className="inline-flex rounded-lg bg-slate-100 dark:bg-slate-800 p-1 text-xs font-semibold">
            <button onClick={() => setGender('male')} className={`px-3 py-1.5 rounded-md transition-all ${gender === 'male' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-slate-500 dark:text-slate-400'}`}>
              남성 ♂
            </button>
            <button onClick={() => setGender('female')} className={`px-3 py-1.5 rounded-md transition-all ${gender === 'female' ? 'bg-white dark:bg-slate-700 text-pink-600 dark:text-pink-400 shadow-xs' : 'text-slate-500 dark:text-slate-400'}`}>
              여성 ♀
            </button>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            <span>허리둘레</span>
            <span className="font-bold text-indigo-600 dark:text-indigo-400">{waistCm} cm</span>
          </div>
          <input type="range" min="30" max="220" value={waistCm} onChange={(e) => setWaistCm(Number(e.target.value))} className="w-full accent-indigo-500 cursor-pointer" />
        </div>

        <div>
          <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            <span>엉덩이둘레</span>
            <span className="font-bold text-indigo-600 dark:text-indigo-400">{hipCm} cm</span>
          </div>
          <input type="range" min="30" max="220" value={hipCm} onChange={(e) => setHipCm(Number(e.target.value))} className="w-full accent-indigo-500 cursor-pointer" />
        </div>
      </div>

      <div className="rounded-2xl p-4 border border-indigo-200 dark:border-indigo-900 bg-indigo-50/70 dark:bg-indigo-950/30 space-y-2">
        <div className="text-xs text-indigo-700 dark:text-indigo-300 font-semibold">측정 결과</div>
        <div className="text-3xl font-black text-indigo-900 dark:text-indigo-100">{whr}</div>
        <div className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">판정: {level}</div>
        <p className="text-xs text-indigo-800 dark:text-indigo-200 leading-relaxed">{riskMessage}</p>
      </div>

      {saved && (
        <div className="text-xs font-semibold text-center text-indigo-700 dark:text-indigo-300 bg-indigo-100/80 dark:bg-indigo-950/60 rounded-lg p-2">
          히스토리에 저장되었습니다.
        </div>
      )}
    </div>
  );
};
