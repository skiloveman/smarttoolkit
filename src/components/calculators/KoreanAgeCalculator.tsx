import React, { useMemo, useState } from 'react';
import { Cake } from 'lucide-react';
import { DefaultValueInput } from '../DefaultValueInput';
import { SaveHistoryFn } from '../../types';
import { formatYmd } from '../../utils/calculators';
import { usePendingHistoryRestore } from '../../utils/historyRestore';

interface Props {
  onSaveHistory: (title: string, summary: string, details: Record<string, string | number>) => void;
}

export const KoreanAgeCalculator: React.FC<Props> = ({ onSaveHistory }) => {
  const saveHistory = onSaveHistory as SaveHistoryFn;
  const todayStr = formatYmd(new Date());
  const [birthDate, setBirthDate] = useState('1996-01-01');
  const [referenceDate, setReferenceDate] = useState(todayStr);
  const [saved, setSaved] = useState(false);

  const result = useMemo(() => {
    const birth = new Date(birthDate);
    const ref = new Date(referenceDate);
    if (isNaN(birth.getTime()) || isNaN(ref.getTime())) return null;

    let intlAge = ref.getFullYear() - birth.getFullYear();
    const birthdayPassed =
      ref.getMonth() > birth.getMonth() ||
      (ref.getMonth() === birth.getMonth() && ref.getDate() >= birth.getDate());
    if (!birthdayPassed) intlAge -= 1;

    const yearAge = ref.getFullYear() - birth.getFullYear();
    const countingAge = yearAge + 1;

    let nextBirthday = new Date(ref.getFullYear(), birth.getMonth(), birth.getDate());
    if (nextBirthday.getTime() < ref.getTime()) {
      nextBirthday = new Date(ref.getFullYear() + 1, birth.getMonth(), birth.getDate());
    }
    const daysToNextBirthday = Math.ceil((nextBirthday.getTime() - ref.getTime()) / 86400000);

    return { intlAge, yearAge, countingAge, daysToNextBirthday };
  }, [birthDate, referenceDate]);

  usePendingHistoryRestore<{ birthDate: string; referenceDate: string }>('koreanAge', (restored) => {
    setBirthDate(restored.birthDate);
    setReferenceDate(restored.referenceDate);
  });

  const handleSave = () => {
    if (!result) return;
    saveHistory('만 나이 계산기', `만 ${result.intlAge}세 (생년월일 ${birthDate})`, {
      생년월일: birthDate,
      기준일: referenceDate,
      '만 나이': `${result.intlAge}세`,
      '연 나이': `${result.yearAge}세`,
      세는나이: `${result.countingAge}세`,
    }, {
      birthDate,
      referenceDate,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-5">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Cake className="w-5 h-5 text-rose-500" />
          <span>만 나이 계산기</span>
        </h3>
        <button onClick={handleSave} className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold whitespace-nowrap" title="계산기록에서 다시 가져올 수 있습니다.">기록저장</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">생년월일</label>
          <DefaultValueInput
            type="date"
            value={birthDate}
            defaultValueLabel="1996-01-01"
            onValueChange={setBirthDate}
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/60 p-2.5 text-sm font-bold text-slate-800 dark:text-slate-100"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">기준일</label>
          <DefaultValueInput
            type="date"
            value={referenceDate}
            defaultValueLabel={todayStr}
            onValueChange={setReferenceDate}
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/60 p-2.5 text-sm font-bold text-slate-800 dark:text-slate-100"
          />
          <button
            onClick={() => setReferenceDate(todayStr)}
            className="mt-2 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
          >
            오늘로 설정
          </button>
        </div>
      </div>

      {result ? (
        <div className="rounded-2xl p-4 border border-rose-200 dark:border-rose-900 bg-rose-50/70 dark:bg-rose-950/30 space-y-3">
          <div>
            <div className="text-xs text-rose-700 dark:text-rose-300 font-semibold">만 나이 (법적 기준)</div>
            <div className="text-3xl font-black text-rose-900 dark:text-rose-100 mt-1">{result.intlAge}세</div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-xl bg-white/70 dark:bg-slate-900/40 p-3 border border-rose-100 dark:border-rose-900/60">
              <div className="text-slate-500 dark:text-slate-400 mb-1">연 나이 (병역법 등)</div>
              <div className="font-bold text-slate-800 dark:text-slate-100">{result.yearAge}세</div>
            </div>
            <div className="rounded-xl bg-white/70 dark:bg-slate-900/40 p-3 border border-rose-100 dark:border-rose-900/60">
              <div className="text-slate-500 dark:text-slate-400 mb-1">세는 나이 (관습상)</div>
              <div className="font-bold text-slate-800 dark:text-slate-100">{result.countingAge}세</div>
            </div>
          </div>
          <p className="text-xs text-rose-800 dark:text-rose-200">
            {result.daysToNextBirthday === 0 ? '오늘이 생일입니다!' : `다음 생일까지 ${result.daysToNextBirthday}일 남았습니다.`}
          </p>
        </div>
      ) : (
        <div className="rounded-2xl p-4 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-xs text-slate-500 dark:text-slate-400">
          날짜를 올바르게 입력해 주세요.
        </div>
      )}

      {saved && <div className="text-xs font-semibold text-center text-rose-700 dark:text-rose-300 bg-rose-100/80 dark:bg-rose-950/60 rounded-lg p-2">히스토리에 저장되었습니다.</div>}
    </div>
  );
};
