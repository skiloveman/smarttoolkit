import React from 'react';
import { X, ShieldCheck, FileText, AlertTriangle, Mail } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'terms' | 'privacy' | 'disclaimer' | 'contact' | null;
}

export const LegalModals: React.FC<ModalProps> = ({ isOpen, onClose, type }) => {
  if (!isOpen || !type) return null;

  const getContent = () => {
    switch (type) {
      case 'terms':
        return {
          title: '이용약관 (Terms of Service)',
          icon: <FileText className="w-5 h-5 text-blue-500" />,
          body: (
            <div className="space-y-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <p>
                <strong>제 1 조 (목적)</strong><br />
                본 약관은 "생활 계산기, 필요한 도구들"(이하 "서비스")이 제공하는 인터넷 모의 계산 및 정보 서비스의 이용 조건 및 절차를 규정함을 목적으로 합니다.
              </p>
              <p>
                <strong>제 2 조 (서비스의 내용)</strong><br />
                서비스는 연봉 실수령액, BMI 체질량지수, 퇴직금, 부가가치세, 주택용 전기요금, 환율, D-Day, 단위 및 퍼센트 계산 도구를 무료로 제공합니다.
              </p>
              <p>
                <strong>제 3 조 (책임 한계 및 면책)</strong><br />
                본 서비스에서 제공하는 모든 계산 결과는 관계 법령 및 표준 요율에 기반한 모의 산출 수치입니다. 실제 세금, 급여, 전기요금, 퇴직금은 개인의 계약 조건 및 기관 사정에 따라 다를 수 있으며, 회사는 이에 대한 직접적인 법적 책임을 지지 않습니다.
              </p>
            </div>
          ),
        };

      case 'privacy':
        return {
          title: '개인정보처리방침 (Privacy Policy)',
          icon: <ShieldCheck className="w-5 h-5 text-emerald-500" />,
          body: (
            <div className="space-y-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <p>
                <strong>1. 수집하는 개인정보 항목</strong><br />
                본 서비스는 별도의 회원가입 없이 이용할 수 있으며, 서버상에 사용자의 이름, 주민등록번호, 계좌번호 등 어떠한 개인식별정보도 수집 및 저장하지 않습니다.
              </p>
              <p>
                <strong>2. 계산 기록의 저장</strong><br />
                사용자가 입력한 정보 및 계산 결과 히스토리는 사용자의 웹브라우저 기기 내부 저장소(LocalStorage)에만 저장되며, 브라우저 삭제 시 언제든지 초기화할 수 있습니다.
              </p>
              <p>
                <strong>3. Google AdSense 및 쿠키 사용</strong><br />
                본 사이트는 웹 브라우징 경험 향상 및 맞춤형 광고 제공을 위해 제3자 광고 네트워크(Google AdSense) 쿠키를 사용할 수 있습니다. 사용자는 브라우저 설정에서 쿠키 수집을 거부할 수 있습니다.
              </p>
            </div>
          ),
        };

      case 'disclaimer':
        return {
          title: '법적고지 및 면책사항 (Legal Disclaimer)',
          icon: <AlertTriangle className="w-5 h-5 text-amber-500" />,
          body: (
            <div className="space-y-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <p>
                "생활 계산기"에서 산출되는 모든 계산 결과 및 가이드 정보는 참고요 자료로만 사용되어야 합니다.
              </p>
              <p>
                본 사이트의 산출 로직은 국세청, 근로복지공단, 한국전력공사, 대한비만학회 및 금융권의 공시 요율을 준수하여 작성되었으나, 개별 법령 개정 및 사규에 따라 실제와 차이가 발생할 수 있습니다.
              </p>
              <p>
                정확한 세금 및 금융 처리는 담당 전문 세무사, 노무사 또는 해당 기관에 직접 확인하시기 바랍니다.
              </p>
            </div>
          ),
        };

      case 'contact':
        return {
          title: '문의하기 & 피드백 (Contact Us)',
          icon: <Mail className="w-5 h-5 text-purple-500" />,
          body: (
            <div className="space-y-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <p>
                서비스 이용 중 요율 오류 제보, 신규 계산기 기능 요청, 제휴 및 기타 문의 사항이 있으시면 아래로 연락해 주시기 바랍니다.
              </p>
              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 font-mono text-slate-800 dark:text-slate-200">
                • 이메일: skiloveman@gmail.com<br />
                • 운영시간: 평일 09:00 ~ 18:00
              </div>
            </div>
          ),
        };

      default:
        return { title: '', icon: null, body: null };
    }
  };

  const current = getContent();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100">
            {current.icon}
            <span>{current.title}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">{current.body}</div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold hover:bg-slate-800 transition-colors"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
};
