import React, { useMemo, useState } from 'react';
import { Users } from 'lucide-react';
import { SaveHistoryFn } from '../../types';
import { formatKrw, formatNum } from '../../utils/calculators';
import { usePendingHistoryRestore } from '../../utils/historyRestore';

interface Props {
  onSaveHistory: (title: string, summary: string, details: Record<string, string | number>) => void;
}

interface Person {
  id: string;
  name: string;
  paid: number;
}

const createPerson = (index: number): Person => ({
  id: `${Date.now()}-${index}-${Math.random().toString(36).slice(2, 6)}`,
  name: `참가자 ${index}`,
  paid: 0,
});

export const BillSplitCalculator: React.FC<Props> = ({ onSaveHistory }) => {
  const saveHistory = onSaveHistory as SaveHistoryFn;
  const [mode, setMode] = useState<'equal' | 'settle'>('equal');
  const [totalAmount, setTotalAmount] = useState(90000);
  const [peopleCount, setPeopleCount] = useState(3);
  const [people, setPeople] = useState<Person[]>([createPerson(1), createPerson(2), createPerson(3)]);
  const [saved, setSaved] = useState(false);

  const equalResult = useMemo(() => {
    const count = Math.max(1, peopleCount);
    const perPerson = Math.floor(totalAmount / count);
    const remainder = totalAmount - perPerson * count;
    return { perPerson, remainder, count };
  }, [totalAmount, peopleCount]);

  const settleResult = useMemo(() => {
    const total = people.reduce((sum, p) => sum + p.paid, 0);
    const average = people.length > 0 ? total / people.length : 0;
    const balances = people.map((p) => ({
      ...p,
      balance: Math.round(p.paid - average),
    }));
    return { total, average: Math.round(average), balances };
  }, [people]);

  usePendingHistoryRestore<{
    mode: 'equal' | 'settle';
    totalAmount: number;
    peopleCount: number;
    peopleNames: string[];
    peoplePaid: number[];
  }>('billSplit', (restored) => {
    setMode(restored.mode);
    setTotalAmount(restored.totalAmount);
    setPeopleCount(restored.peopleCount);
    setPeople(
      restored.peopleNames.map((name, idx) => ({
        id: `${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
        name,
        paid: restored.peoplePaid[idx] ?? 0,
      }))
    );
  });

  const addPerson = () => setPeople((prev) => [...prev, createPerson(prev.length + 1)]);
  const removePerson = (id: string) => setPeople((prev) => (prev.length > 2 ? prev.filter((p) => p.id !== id) : prev));
  const updatePerson = (id: string, field: 'name' | 'paid', value: string) => {
    setPeople((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: field === 'paid' ? Number(value) || 0 : value } : p))
    );
  };

  const handleSave = () => {
    if (mode === 'equal') {
      saveHistory('더치페이(비용 분담) 계산기', `1인당 ${formatKrw(equalResult.perPerson)} (${equalResult.count}명 분담)`, {
        총금액: formatKrw(totalAmount),
        인원수: `${equalResult.count}명`,
        '1인당분담액': formatKrw(equalResult.perPerson),
        나머지: formatKrw(equalResult.remainder),
      }, { mode, totalAmount, peopleCount, peopleNames: people.map((p) => p.name), peoplePaid: people.map((p) => p.paid) });
    } else {
      const details: Record<string, string | number> = {
        총결제액: formatKrw(settleResult.total),
        '1인평균': formatKrw(settleResult.average),
      };
      settleResult.balances.forEach((b) => {
        details[b.name] = `${formatKrw(b.paid)} 결제 (${b.balance >= 0 ? `+${formatNum(b.balance)}원 받을 돈` : `${formatNum(b.balance)}원 낼 돈`})`;
      });
      saveHistory('더치페이(비용 분담) 계산기', `${people.length}명 정산 완료 (1인평균 ${formatKrw(settleResult.average)})`, details, { mode, totalAmount, peopleCount, peopleNames: people.map((p) => p.name), peoplePaid: people.map((p) => p.paid) });
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-5">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Users className="w-5 h-5 text-sky-500" />
          <span>더치페이(비용 분담) 계산기</span>
        </h3>
        <button onClick={handleSave} className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold whitespace-nowrap" title="계산기록에서 다시 가져올 수 있습니다.">기록저장</button>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">계산 방식</label>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => setMode('equal')} className={`px-3 py-2 rounded-lg text-xs font-semibold ${mode === 'equal' ? 'bg-sky-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>N분의 1 (똑같이 나누기)</button>
          <button onClick={() => setMode('settle')} className={`px-3 py-2 rounded-lg text-xs font-semibold ${mode === 'settle' ? 'bg-sky-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>개인별 결제 정산</button>
        </div>
      </div>

      {mode === 'equal' ? (
        <>
          <div>
            <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              <span>총 금액</span>
              <span className="font-bold text-sky-600 dark:text-sky-400">{formatKrw(totalAmount)}</span>
            </div>
            <input type="range" min="1000" max="1000000" step="1000" value={totalAmount} onChange={(e) => setTotalAmount(Number(e.target.value))} className="w-full accent-sky-600 cursor-pointer" />
          </div>
          <div>
            <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              <span>인원 수</span>
              <span className="font-bold text-sky-600 dark:text-sky-400">{peopleCount}명</span>
            </div>
            <input type="range" min="2" max="20" value={peopleCount} onChange={(e) => setPeopleCount(Number(e.target.value))} className="w-full accent-sky-600 cursor-pointer" />
          </div>

          <div className="rounded-2xl p-4 border border-sky-200 dark:border-sky-900 bg-sky-50/70 dark:bg-sky-950/30 space-y-2">
            <div className="text-xs text-sky-700 dark:text-sky-300 font-semibold">1인당 분담 금액</div>
            <div className="text-3xl font-black text-sky-900 dark:text-sky-100">{formatKrw(equalResult.perPerson)}</div>
            {equalResult.remainder > 0 && (
              <div className="text-xs text-sky-800 dark:text-sky-200">나머지 {formatKrw(equalResult.remainder)}은 한 명이 추가로 부담하거나 더치페이 앱 잔돈 처리로 나눠주세요.</div>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="space-y-2">
            {people.map((p, idx) => (
              <div key={p.id} className="flex items-center gap-2">
                <input
                  type="text"
                  value={p.name}
                  onChange={(e) => updatePerson(p.id, 'name', e.target.value)}
                  className="w-24 shrink-0 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-xs font-semibold text-slate-800 dark:text-slate-100"
                />
                <input
                  type="number"
                  value={p.paid || ''}
                  placeholder="결제금액"
                  onChange={(e) => updatePerson(p.id, 'paid', e.target.value)}
                  className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/60 p-2 text-xs font-bold text-slate-800 dark:text-slate-100"
                />
                <span className="text-[11px] text-slate-400 w-8">원</span>
                <button
                  onClick={() => removePerson(p.id)}
                  disabled={people.length <= 2}
                  className="shrink-0 w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold disabled:opacity-30"
                  aria-label={`${idx + 1}번 참가자 삭제`}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={addPerson}
            disabled={people.length >= 20}
            className="w-full py-2 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-500 dark:text-slate-400 disabled:opacity-40"
          >
            + 참가자 추가
          </button>

          <div className="rounded-2xl p-4 border border-sky-200 dark:border-sky-900 bg-sky-50/70 dark:bg-sky-950/30 space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-xs text-sky-700 dark:text-sky-300 font-semibold">총 결제액 {formatKrw(settleResult.total)} · 1인 평균 {formatKrw(settleResult.average)}</div>
            </div>
            <div className="space-y-1.5">
              {settleResult.balances.map((b) => (
                <div key={b.id} className="flex items-center justify-between rounded-xl bg-white/70 dark:bg-slate-900/40 p-2.5 border border-sky-100 dark:border-sky-900/60 text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{b.name}</span>
                  <span className={`font-bold ${b.balance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                    {b.balance >= 0 ? `+${formatNum(b.balance)}원 받을 돈` : `${formatNum(b.balance)}원 낼 돈`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {saved && <div className="text-xs font-semibold text-center text-sky-700 dark:text-sky-300 bg-sky-100/80 dark:bg-sky-950/60 rounded-lg p-2">히스토리에 저장되었습니다.</div>}
    </div>
  );
};
