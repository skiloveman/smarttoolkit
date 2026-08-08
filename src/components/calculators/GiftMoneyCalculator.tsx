import React, { useMemo, useState } from 'react';
import { Gift } from 'lucide-react';
import { SaveHistoryFn } from '../../types';
import { usePendingHistoryRestore } from '../../utils/historyRestore';

interface Props {
  onSaveHistory: (title: string, summary: string, details: Record<string, string | number>) => void;
}

type EventType = 'wedding' | 'funeral';
type Relation = 'coworker' | 'closeFriend' | 'family' | 'boss' | 'acquaintance';
type Attendance = 'attend' | 'absent';

const relationLabels: Record<Relation, string> = {
  coworker: '직장동료 (일반)',
  closeFriend: '친한 친구',
  family: '가족·친척',
  boss: '직속상사·거래처',
  acquaintance: '단순 지인',
};

// [참석, 불참] 금액 범위 (만원 단위)
const weddingTable: Record<Relation, [string, string]> = {
  coworker: ['5만원', '3~5만원'],
  closeFriend: ['10만원', '5~10만원'],
  family: ['30만원 이상', '10~30만원'],
  boss: ['10~20만원', '5~10만원'],
  acquaintance: ['5만원', '3만원'],
};

const funeralTable: Record<Relation, string> = {
  coworker: '5만원',
  closeFriend: '10만원',
  family: '30만원 이상',
  boss: '10만원',
  acquaintance: '5만원',
};

export const GiftMoneyCalculator: React.FC<Props> = ({ onSaveHistory }) => {
  const saveHistory = onSaveHistory as SaveHistoryFn;
  const [eventType, setEventType] = useState<EventType>('wedding');
  const [relation, setRelation] = useState<Relation>('coworker');
  const [attendance, setAttendance] = useState<Attendance>('attend');
  const [saved, setSaved] = useState(false);

  const recommended = useMemo(() => {
    if (eventType === 'funeral') return funeralTable[relation];
    return attendance === 'attend' ? weddingTable[relation][0] : weddingTable[relation][1];
  }, [eventType, relation, attendance]);

  usePendingHistoryRestore<{ eventType: EventType; relation: Relation; attendance: Attendance }>('giftMoney', (restored) => {
    setEventType(restored.eventType);
    setRelation(restored.relation);
    setAttendance(restored.attendance);
  });

  const handleSave = () => {
    saveHistory('축의금/부의금 계산기', `${eventType === 'wedding' ? '축의금' : '부의금'} 권장 금액: ${recommended}`, {
      경조사유형: eventType === 'wedding' ? '결혼식' : '장례식',
      관계: relationLabels[relation],
      ...(eventType === 'wedding' ? { 참석여부: attendance === 'attend' ? '참석' : '불참' } : {}),
      권장금액: recommended,
    }, { eventType, relation, attendance });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-5">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Gift className="w-5 h-5 text-red-500" />
          <span>축의금/부의금 계산기</span>
        </h3>
        <button onClick={handleSave} className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold whitespace-nowrap" title="계산기록에서 다시 가져올 수 있습니다.">기록저장</button>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">경조사 유형</label>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => setEventType('wedding')} className={`px-3 py-2 rounded-lg text-xs font-semibold ${eventType === 'wedding' ? 'bg-red-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>결혼식 (축의금)</button>
          <button onClick={() => setEventType('funeral')} className={`px-3 py-2 rounded-lg text-xs font-semibold ${eventType === 'funeral' ? 'bg-red-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>장례식 (부의금)</button>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">관계</label>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(relationLabels) as Relation[]).map((r) => (
            <button
              key={r}
              onClick={() => setRelation(r)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold ${relation === r ? 'bg-red-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
            >
              {relationLabels[r]}
            </button>
          ))}
        </div>
      </div>

      {eventType === 'wedding' && (
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">참석 여부</label>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setAttendance('attend')} className={`px-3 py-2 rounded-lg text-xs font-semibold ${attendance === 'attend' ? 'bg-red-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>참석</button>
            <button onClick={() => setAttendance('absent')} className={`px-3 py-2 rounded-lg text-xs font-semibold ${attendance === 'absent' ? 'bg-red-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>불참 (마음만 전달)</button>
          </div>
        </div>
      )}

      <div className="rounded-2xl p-4 border border-red-200 dark:border-red-900 bg-red-50/70 dark:bg-red-950/30 space-y-2">
        <div className="text-xs text-red-700 dark:text-red-300 font-semibold">권장 {eventType === 'wedding' ? '축의금' : '부의금'} 금액</div>
        <div className="text-3xl font-black text-red-900 dark:text-red-100">{recommended}</div>
        <ul className="text-[11px] text-red-800 dark:text-red-200 space-y-0.5 list-disc list-inside pt-1">
          <li>축의금은 홀수 단위(3, 5, 7, 10만원 등)로 내는 것이 전통적인 관례입니다.</li>
          <li>10만원 이상은 통상 짝수도 무방하나, 4가 들어가는 금액(4만원, 40만원 등)은 피하는 것이 좋습니다.</li>
          <li>봉투 앞면에는 축의금은 &ldquo;축 결혼&rdquo;, 부의금은 &ldquo;부의(賻儀)&rdquo; 또는 &ldquo;근조(謹弔)&rdquo;라고 씁니다.</li>
        </ul>
      </div>

      {saved && <div className="text-xs font-semibold text-center text-red-700 dark:text-red-300 bg-red-100/80 dark:bg-red-950/60 rounded-lg p-2">히스토리에 저장되었습니다.</div>}
    </div>
  );
};
