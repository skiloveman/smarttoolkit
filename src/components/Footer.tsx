import React from 'react';
import { Calculator } from 'lucide-react';

interface FooterProps {
  onOpenModal: (type: 'terms' | 'privacy' | 'disclaimer' | 'contact') => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenModal }) => {
  return (
    <footer className="mt-16 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-8">
          {/* Col 1: Brand & Desc */}
          <div className="md:col-span-5 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">
                <Calculator className="w-4 h-4" />
              </div>
              <span className="text-base font-bold text-gray-900 dark:text-white tracking-tight">
                Smart ToolKit, 필요한 도구들
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed max-w-sm">
              연봉 실수령액, 4대보험, BMI 체질량지수, 퇴직금, 부가가치세, 주택용 전기요금 누진세 및 실시간 환율을 한 곳에서 스마트하고 정확하게 모의 계산하세요.
            </p>
          </div>

          {/* Col 2: Quick Tool Links */}
          <div className="md:col-span-4">
            <h4 className="text-xs font-bold text-gray-900 dark:text-slate-100 uppercase tracking-widest mb-3">
              제공 계산기 목록
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 dark:text-slate-400">
              <span>• 연봉 실수령액 계산기</span>
              <span>• BMI 체질량 계산기</span>
              <span>• 퇴직금 예상 계산기</span>
              <span>• 부가가치세(VAT) 계산기</span>
              <span>• 주택용 전기요금 계산기</span>
              <span>• 주요 통화 환율 계산기</span>
              <span>• D-Day & 날짜 계산기</span>
              <span>• 아파트 평수/단위 변환기</span>
            </div>
          </div>

          {/* Col 3: Compliance & AdSense Required Links */}
          <div className="md:col-span-3">
            <h4 className="text-xs font-bold text-gray-900 dark:text-slate-100 uppercase tracking-widest mb-3">
              이용 안내 & 법적 고지
            </h4>
            <ul className="space-y-2 text-xs text-gray-500 dark:text-slate-400 uppercase tracking-wider">
              <li>
                <button
                  onClick={() => onOpenModal('terms')}
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  이용약관 (Terms)
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenModal('privacy')}
                  className="hover:text-blue-600 dark:hover:text-blue-400 font-semibold text-gray-800 dark:text-slate-200 transition-colors"
                >
                  개인정보처리방침 (Privacy)
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenModal('disclaimer')}
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  법적고지 및 면책사항
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenModal('contact')}
                  className="font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 transition-colors"
                >
                  1:1문의 및 제보
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-gray-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-gray-400 dark:text-slate-500 uppercase tracking-widest">
          <div>
            © 2026 Smart ToolKit. ALL RIGHTS RESERVED.
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={() => onOpenModal('contact')}
              className="px-3 py-1.5 rounded-full bg-rose-600 text-white text-[10px] font-bold tracking-wide hover:bg-rose-700 transition-colors"
            >
              1:1 문의/제보
            </button>
            <div className="text-[10px] normal-case tracking-normal">
              본 사이트의 산출 결과는 모의 산출 참고용이며, 정확한 적용은 관련 정식 기관에 문의하세요.
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
