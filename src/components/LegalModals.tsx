import React, { FormEvent, useEffect, useState } from 'react';
import { X, ShieldCheck, FileText, AlertTriangle, Mail } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'terms' | 'privacy' | 'disclaimer' | 'contact' | null;
}

export const LegalModals: React.FC<ModalProps> = ({ isOpen, onClose, type }) => {
  const [nameOrNickname, setNameOrNickname] = useState('');
  const [replyEmail, setReplyEmail] = useState('');
  const [inquiryType, setInquiryType] = useState('오류 제보');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [submitPopup, setSubmitPopup] = useState<{ ok: boolean; message: string } | null>(null);

  const getSuccessMessageByInquiryType = (inquiryTypeValue: string) => {
    switch (inquiryTypeValue) {
      case '오류 제보':
        return '오류 제보가 접수되었습니다. 재현 확인 후 수정이 필요한 경우 빠르게 반영하겠습니다.';
      case '기능 제안':
        return '기능 제안이 접수되었습니다. 내부 검토 후 업데이트 계획에 반영하겠습니다.';
      case '이용 문의':
        return '이용 문의가 접수되었습니다. 확인 후 남겨주신 이메일로 답변드리겠습니다.';
      case '제휴 문의':
        return '제휴 문의가 접수되었습니다. 담당자가 확인 후 회신드리겠습니다.';
      default:
        return '문의가 정상 접수되었습니다. 빠르게 확인 후 답변드리겠습니다.';
    }
  };

  useEffect(() => {
    if (!isOpen || type !== 'contact') {
      setNameOrNickname('');
      setReplyEmail('');
      setInquiryType('오류 제보');
      setDetails('');
      setIsSubmitting(false);
      setSubmitResult(null);
      setSubmitPopup(null);
    }
  }, [isOpen, type]);

  if (!isOpen || !type) return null;

  const handleContactSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const trimmedName = nameOrNickname.trim();
    const trimmedEmail = replyEmail.trim();
    const trimmedDetails = details.trim();

    if (!trimmedName || !trimmedEmail || !trimmedDetails) {
      setSubmitResult({ ok: false, message: '모든 항목을 입력해 주세요.' });
      return;
    }

    setIsSubmitting(true);
    setSubmitResult(null);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nameOrNickname: trimmedName,
          replyEmail: trimmedEmail,
          inquiryType,
          details: trimmedDetails,
        }),
      });

      const payload = await res.json().catch(() => ({ message: '응답 처리 중 오류가 발생했습니다.' }));

      if (!res.ok) {
        throw new Error(payload?.message || '문의 접수에 실패했습니다.');
      }

      const successMessage = getSuccessMessageByInquiryType(inquiryType);
      setSubmitResult({ ok: true, message: successMessage });
      setSubmitPopup({ ok: true, message: successMessage });
      setNameOrNickname('');
      setReplyEmail('');
      setInquiryType('오류 제보');
      setDetails('');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '문의 전송 중 오류가 발생했습니다.';
      setSubmitResult({
        ok: false,
        message: errorMessage,
      });
      setSubmitPopup({ ok: false, message: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

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
                본 약관은 "Smart ToolKit, 필요한 도구들"(이하 "서비스")이 제공하는 인터넷 모의 계산 및 정보 서비스의 이용 조건 및 절차를 규정함을 목적으로 합니다.
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
                "Smart ToolKit"에서 산출되는 모든 계산 결과 및 가이드 정보는 참고요 자료로만 사용되어야 합니다.
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
          title: '1:1문의 및 제보하기',
          icon: <Mail className="w-5 h-5 text-purple-500" />,
          body: (
            <form onSubmit={handleContactSubmit} className="space-y-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <p>
                성함/닉네임, 답변받을 이메일, 문의 유형, 상세 내용을 작성해 주시면
                skiloveman@naver.com 으로 접수됩니다.
              </p>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 dark:text-slate-200">성함/닉네임</label>
                <input
                  type="text"
                  value={nameOrNickname}
                  onChange={(e) => setNameOrNickname(e.target.value)}
                  maxLength={60}
                  required
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-800 dark:text-slate-100"
                  placeholder="예: 홍길동 또는 toolkit-user"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 dark:text-slate-200">답변받을 이메일</label>
                <input
                  type="email"
                  value={replyEmail}
                  onChange={(e) => setReplyEmail(e.target.value)}
                  maxLength={120}
                  required
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-800 dark:text-slate-100"
                  placeholder="예: yourname@example.com"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 dark:text-slate-200">문의 유형</label>
                <select
                  value={inquiryType}
                  onChange={(e) => setInquiryType(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-800 dark:text-slate-100"
                >
                  <option>오류 제보</option>
                  <option>기능 제안</option>
                  <option>이용 문의</option>
                  <option>제휴 문의</option>
                  <option>기타</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 dark:text-slate-200">상세 내용</label>
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  maxLength={3000}
                  required
                  rows={6}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-800 dark:text-slate-100"
                  placeholder="문의 또는 제보 내용을 자세히 적어주세요."
                />
              </div>

              {submitResult && (
                <div
                  className={`rounded-xl px-3 py-2 text-xs font-semibold ${
                    submitResult.ok
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300'
                      : 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300'
                  }`}
                >
                  {submitResult.message}
                </div>
              )}

              <div className="pt-1 flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? '전송 중...' : '문의하기 제출'}
                </button>
              </div>
            </form>
          ),
        };

      default:
        return { title: '', icon: null, body: null };
    }
  };

  const current = getContent();

  const handleSubmitPopupConfirm = () => {
    const wasSuccess = submitPopup?.ok;
    setSubmitPopup(null);

    if (wasSuccess) {
      onClose();
    }
  };

  return (
    <>
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

      {submitPopup && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/70">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-5">
            <p className={`text-sm font-bold ${submitPopup.ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {submitPopup.ok ? '문의 접수 완료' : '문의 접수 실패'}
            </p>
            <p className="mt-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {submitPopup.message}
            </p>
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleSubmitPopupConfirm}
                className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold hover:bg-slate-800 transition-colors"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
