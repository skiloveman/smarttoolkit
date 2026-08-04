import React, { useState } from 'react';
import { GuideArticle } from '../data/calculatorInfo';
import { BookOpen, ChevronDown, ChevronUp, HelpCircle, CheckCircle2, ShieldAlert } from 'lucide-react';

interface Props {
  guide: GuideArticle;
}

export const CalculatorGuideCard: React.FC<Props> = ({ guide }) => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="mt-8 rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xs">
      <div className="flex items-center gap-2 mb-4 text-gray-800 dark:text-slate-100 font-bold text-lg border-b border-gray-100 dark:border-slate-800 pb-3">
        <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        <span>{guide.title}</span>
      </div>

      <p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed mb-6">
        {guide.summary}
      </p>

      {/* 공식 바 */}
      <div className="mb-6 rounded-lg bg-blue-50/80 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/60 p-4">
        <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">
          계산 산출 공식
        </div>
        <div className="text-sm font-medium text-gray-800 dark:text-slate-200 font-mono">
          {guide.formulaText}
        </div>
      </div>

      {/* 주요 포인트 */}
      <div className="mb-8">
        <h4 className="text-xs font-bold text-gray-800 dark:text-slate-200 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>핵심 공제 및 산정 포인트</span>
        </h4>
        <ul className="space-y-2">
          {guide.keyPoints.map((point, idx) => (
            <li key={idx} className="flex items-start gap-2 text-xs text-gray-600 dark:text-slate-300 leading-normal">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* 자주 묻는 질문 FAQ */}
      {guide.faqs && guide.faqs.length > 0 && (
        <div className="mb-6">
          <h4 className="text-xs font-bold text-gray-800 dark:text-slate-200 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-purple-500" />
            <span>자주 묻는 질문 (FAQ)</span>
          </h4>
          <div className="space-y-2">
            {guide.faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-lg border border-gray-200 dark:border-slate-800 overflow-hidden transition-colors"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between p-3.5 text-left text-xs font-semibold text-gray-800 dark:text-slate-200 bg-gray-50/50 dark:bg-slate-800/30 hover:bg-gray-100/60 dark:hover:bg-slate-800/60 transition-colors"
                  >
                    <span className="pr-2">Q. {faq.question}</span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="p-3.5 text-xs text-gray-600 dark:text-slate-300 bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800/80 leading-relaxed">
                      A. {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 법적 고지 안내 */}
      <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50/80 dark:bg-amber-950/30 text-[11px] text-amber-800 dark:text-amber-300 border border-amber-200/60 dark:border-amber-900/40">
        <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <span>
          본 계산기의 산출 결과는 표준 법령 및 고지 요율 기준 모의 계산용이며, 개인의 비과세 항목, 수당, 사규 및 구체적 계약조건에 따라 실제 금액과 차이가 발생할 수 있습니다.
        </span>
      </div>
    </div>
  );
};
