import React from 'react';
import { CalculationHistoryItem } from '../types';
import { X, History, Trash2, Copy, Check } from 'lucide-react';
import { formatYmd } from '../utils/calculators';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  history: CalculationHistoryItem[];
  onClearHistory: () => void;
  onSelectHistory: (item: CalculationHistoryItem) => void;
  latestSavedHistoryId: string | null;
}

export const RecentHistoryModal: React.FC<Props> = ({ isOpen, onClose, history, onClearHistory, onSelectHistory, latestSavedHistoryId }) => {
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopyItem = (item: CalculationHistoryItem) => {
    let detailsText = Object.entries(item.details)
      .map(([k, v]) => `${k}: ${v}`)
      .join('\n');
    const text = `[${item.calculatorName} 계산 기록]\n${item.summary}\n${detailsText}`;

    navigator.clipboard.writeText(text);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100">
            <History className="w-5 h-5 text-blue-500" />
            <span>최근 계산 기록</span>
            <span className="text-xs font-normal text-slate-400">({history.length}건)</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1">
          {history.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              저장된 최근 계산 기록이 없습니다.<br />계산기 우측 상단의 북마크 버튼을 눌러 저장해보세요!
            </div>
          ) : (
            history.map((item) => {
              const isFreshlySaved = item.id === latestSavedHistoryId;

              return (
              <div
                key={item.id}
                role="button"
                tabIndex={0}
                onClick={() => onSelectHistory(item)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onSelectHistory(item);
                  }
                }}
                className={`w-full text-left p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border space-y-2 relative group hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-colors ${
                  isFreshlySaved
                    ? 'border-emerald-300 dark:border-emerald-700 shadow-lg shadow-emerald-500/10 animate-[historySavedPulse_1.2s_ease-out_2]'
                    : 'border-slate-200/80 dark:border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400 truncate">
                      {item.calculatorName}
                    </span>
                    {isFreshlySaved && (
                      <span className="shrink-0 rounded-full bg-emerald-100 dark:bg-emerald-950/70 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 animate-pulse">
                        저장됨
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {formatYmd(item.timestamp)}
                  </span>
                </div>

                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {item.summary}
                </p>

                <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900/60 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                  {Object.entries(item.details).map(([k, v]) => (
                    <div key={k}>
                      <span className="text-slate-400">{k}: </span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{v}</span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleCopyItem(item);
                    }}
                    className="text-[11px] font-semibold text-slate-500 hover:text-blue-600 flex items-center gap-1"
                  >
                    {copiedId === item.id ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-500" />
                        <span>복사됨</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>복사</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )})
          )}
        </div>

        {/* Footer */}
        {history.length > 0 && (
          <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <button
              onClick={onClearHistory}
              className="text-xs text-rose-600 hover:text-rose-700 flex items-center gap-1 font-semibold"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>전체 삭제</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold"
            >
              닫기
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
