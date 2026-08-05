interface ContactPayload {
  nameOrNickname?: string;
  replyEmail?: string;
  inquiryType?: string;
  details?: string;
}

const DEFAULT_TARGET_EMAIL = 'skiloveman@naver.com';

function toSafeText(value: unknown, max = 4000): string {
  if (typeof value !== 'string') return '';
  return value.trim().replace(/\u0000/g, '').slice(0, max);
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export const onRequestPost = async (context: { request: Request }) => {
  try {
    const body = (await context.request.json()) as ContactPayload;

    const nameOrNickname = toSafeText(body.nameOrNickname, 60);
    const replyEmail = toSafeText(body.replyEmail, 120);
    const inquiryType = toSafeText(body.inquiryType, 50) || '기타';
    const details = toSafeText(body.details, 3000);

    if (!nameOrNickname || !replyEmail || !details) {
      return Response.json(
        { ok: false, message: '필수 항목이 누락되었습니다.' },
        { status: 400 }
      );
    }

    if (!isValidEmail(replyEmail)) {
      return Response.json(
        { ok: false, message: '이메일 형식이 올바르지 않습니다.' },
        { status: 400 }
      );
    }

    const targetEmail = DEFAULT_TARGET_EMAIL;
    const fromEmail = 'noreply@smarttoolkit.pages.dev';

    const mailPayload = {
      personalizations: [
        {
          to: [{ email: targetEmail, name: 'Smart ToolKit 운영자' }],
        },
      ],
      from: {
        email: fromEmail,
        name: 'Smart ToolKit 문의봇',
      },
      reply_to: {
        email: replyEmail,
        name: nameOrNickname,
      },
      subject: `[Smart ToolKit] 1:1 문의/제보 - ${inquiryType}`,
      content: [
        {
          type: 'text/plain',
          value: [
            'Smart ToolKit 1:1 문의 및 제보 접수',
            '',
            `성함/닉네임: ${nameOrNickname}`,
            `답변 이메일: ${replyEmail}`,
            `문의 유형: ${inquiryType}`,
            '',
            '[상세 내용]',
            details,
          ].join('\n'),
        },
      ],
    };

    const resendApiKey = ((context as unknown as { env?: Record<string, string> }).env?.RESEND_API_KEY || '').trim();

    let resendFailureReason = '';

    if (resendApiKey) {
      const resendResult = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Smart ToolKit <onboarding@resend.dev>',
          to: [targetEmail],
          reply_to: replyEmail,
          subject: `[Smart ToolKit] 1:1 문의/제보 - ${inquiryType}`,
          text: [
            'Smart ToolKit 1:1 문의 및 제보 접수',
            '',
            `성함/닉네임: ${nameOrNickname}`,
            `답변 이메일: ${replyEmail}`,
            `문의 유형: ${inquiryType}`,
            '',
            '[상세 내용]',
            details,
          ].join('\n'),
        }),
      });

      if (resendResult.ok) {
        return Response.json({ ok: true, message: '문의가 접수되었습니다.' }, { status: 200 });
      }

      const resendBody = await resendResult.text();
      resendFailureReason = `Resend 실패(${resendResult.status}): ${resendBody || resendResult.statusText}`;
    }

    const sendResult = await fetch('https://api.mailchannels.net/tx/v1/send', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(mailPayload),
    });

    if (!sendResult.ok) {
      const fallbackRes = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(targetEmail)}`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          _subject: `[Smart ToolKit] 1:1 문의/제보 - ${inquiryType}`,
          _captcha: 'false',
          nameOrNickname,
          replyEmail,
          inquiryType,
          details,
        }),
      });

      if (!fallbackRes.ok) {
        const failText = await sendResult.text();
        const fallbackText = await fallbackRes.text();
        return Response.json(
          {
            ok: false,
            message: `${resendFailureReason ? `${resendFailureReason} / ` : ''}메일 전송 실패: ${failText || sendResult.statusText} / 대체 전송 실패: ${fallbackText || fallbackRes.statusText}`,
          },
          { status: 502 }
        );
      }
    }

    return Response.json({ ok: true, message: '문의가 접수되었습니다.' }, { status: 200 });
  } catch (err) {
    return Response.json(
      {
        ok: false,
        message: err instanceof Error ? err.message : '문의 처리 중 알 수 없는 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
};
