import React from 'react';
import { Info, Sparkles } from 'lucide-react';

interface AdSenseBannerProps {
  slotType?: 'header' | 'sidebar' | 'inline' | 'footer';
  className?: string;
}

export const AdSenseBanner: React.FC<AdSenseBannerProps> = ({
  slotType = 'inline',
  className = '',
}) => {
  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/50 p-4 text-center transition-all ${className}`}
    >
      <div className="flex flex-col items-center justify-center gap-1.5 py-2">
        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
          <Sparkles className="w-3.5 h-3.5 text-blue-500" />
          <span>Google AdSense 광고 영역</span>
          <span className="rounded bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:text-slate-300">
            {slotType === 'header' ? '728x90 반응형' : slotType === 'sidebar' ? '300x250 사이드바' : '반응형 디스플레이'}
          </span>
        </div>
        <p className="text-[11px] text-slate-400 dark:text-slate-500 max-w-md">
          사이트 승인 후 AdSense 스크립트 코드가 자동으로 적용되는 구역입니다.
        </p>
      </div>
      <div className="absolute top-2 right-2 text-[10px] text-slate-400 flex items-center gap-1">
        <Info className="w-3 h-3" />
        <span>AD</span>
      </div>
    </div>
  );
};
