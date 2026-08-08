import React, { useMemo, useState } from 'react';
import { Globe } from 'lucide-react';
import { SaveHistoryFn } from '../../types';
import { usePendingHistoryRestore } from '../../utils/historyRestore';

interface Props {
  onSaveHistory: (title: string, summary: string, details: Record<string, string | number>) => void;
}

const cities = [
  { code: 'seoul', label: '서울 (KST)', offset: 9, flag: '🇰🇷' },
  { code: 'tokyo', label: '도쿄 (JST)', offset: 9, flag: '🇯🇵' },
  { code: 'beijing', label: '베이징 (CST)', offset: 8, flag: '🇨🇳' },
  { code: 'singapore', label: '싱가포르 (SGT)', offset: 8, flag: '🇸🇬' },
  { code: 'bangkok', label: '방콕 (ICT)', offset: 7, flag: '🇹🇭' },
  { code: 'delhi', label: '뉴델리 (IST)', offset: 5.5, flag: '🇮🇳' },
  { code: 'dubai', label: '두바이 (GST)', offset: 4, flag: '🇦🇪' },
  { code: 'london', label: '런던 (GMT)', offset: 0, flag: '🇬🇧' },
  { code: 'paris', label: '파리 (CET)', offset: 1, flag: '🇫🇷' },
  { code: 'newyork', label: '뉴욕 (EST)', offset: -5, flag: '🇺🇸' },
  { code: 'losangeles', label: '로스앤젤레스 (PST)', offset: -8, flag: '🇺🇸' },
  { code: 'sydney', label: '시드니 (AEST)', offset: 10, flag: '🇦🇺' },
] as const;

type CityCode = (typeof cities)[number]['code'];

function formatOffsetTime(baseMinutes: number, offsetDiffHours: number): { time: string; dayOffset: number } {
  const total = baseMinutes + offsetDiffHours * 60;
  let m = total % 1440;
  let dayOffset = Math.floor(total / 1440);
  if (m < 0) {
    m += 1440;
    dayOffset -= 1;
  }
  const h = Math.floor(m / 60);
  const min = Math.round(m % 60);
  return { time: `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`, dayOffset };
}

export const TimeZoneCalculator: React.FC<Props> = ({ onSaveHistory }) => {
  const saveHistory = onSaveHistory as SaveHistoryFn;
  const [baseTime, setBaseTime] = useState('09:00');
  const [targetCity, setTargetCity] = useState<CityCode>('newyork');
  const [saved, setSaved] = useState(false);

  const target = cities.find((c) => c.code === targetCity) ?? cities[9];
  const seoul = cities[0];

  const result = useMemo(() => {
    const [h, m] = baseTime.split(':').map(Number);
    const baseMinutes = h * 60 + m;
    const diff = target.offset - seoul.offset;
    const { time, dayOffset } = formatOffsetTime(baseMinutes, diff);
    return { time, dayOffset, diff };
  }, [baseTime, target, seoul]);

  usePendingHistoryRestore<{ baseTime: string; targetCity: CityCode }>('timeZone', (restored) => {
    setBaseTime(restored.baseTime);
    setTargetCity(restored.targetCity);
  });

  const handleSave = () => {
    saveHistory('국제 시차 계산기', `서울 ${baseTime} → ${target.label} ${result.time}`, {
      기준시각_서울: baseTime,
      대상도시: target.label,
      변환시각: `${result.time}${result.dayOffset > 0 ? ' (다음날)' : result.dayOffset < 0 ? ' (전날)' : ''}`,
      시차: `${result.diff >= 0 ? '+' : ''}${result.diff}시간`,
    }, { baseTime, targetCity });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-5">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Globe className="w-5 h-5 text-teal-500" />
          <span>국제 시차 계산기</span>
        </h3>
        <button onClick={handleSave} className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold whitespace-nowrap" title="계산기록에서 다시 가져올 수 있습니다.">기록저장</button>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">기준 시각 (서울 🇰🇷)</label>
        <input
          type="time"
          value={baseTime}
          onChange={(e) => setBaseTime(e.target.value)}
          className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/60 p-2.5 text-sm font-bold text-slate-800 dark:text-slate-100"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">비교할 도시</label>
        <div className="flex flex-wrap gap-2">
          {cities.filter((c) => c.code !== 'seoul').map((c) => (
            <button
              key={c.code}
              onClick={() => setTargetCity(c.code)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold ${targetCity === c.code ? 'bg-teal-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
            >
              {c.flag} {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl p-4 border border-teal-200 dark:border-teal-900 bg-teal-50/70 dark:bg-teal-950/30 space-y-2">
        <div className="text-xs text-teal-700 dark:text-teal-300 font-semibold">{target.flag} {target.label} 현지 시각</div>
        <div className="text-3xl font-black text-teal-900 dark:text-teal-100">
          {result.time}
          {result.dayOffset !== 0 && (
            <span className="text-sm font-bold ml-2 text-teal-700 dark:text-teal-300">{result.dayOffset > 0 ? '(다음날)' : '(전날)'}</span>
          )}
        </div>
        <div className="text-xs text-teal-800 dark:text-teal-200">서울보다 {Math.abs(result.diff)}시간 {result.diff >= 0 ? '빠름' : '느림'}</div>
        <div className="text-[11px] text-slate-500 dark:text-slate-400">서머타임(DST)은 반영되지 않으며, 일부 국가는 계절에 따라 실제 시차가 1시간 다를 수 있습니다.</div>
      </div>

      {saved && <div className="text-xs font-semibold text-center text-teal-700 dark:text-teal-300 bg-teal-100/80 dark:bg-teal-950/60 rounded-lg p-2">히스토리에 저장되었습니다.</div>}
    </div>
  );
};
