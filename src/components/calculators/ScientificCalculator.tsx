import React, { useMemo, useState } from 'react';
import { Sigma, Copy, Check, BookmarkPlus, RotateCcw, Delete } from 'lucide-react';

interface Props {
  onSaveHistory: (title: string, summary: string, details: Record<string, string | number>) => void;
}

type AngleMode = 'deg' | 'rad';

type TokenType = 'number' | 'operator' | 'paren' | 'func' | 'comma' | 'constant';

interface Token {
  type: TokenType;
  value: string;
}

const ONE_ARG_FUNCTIONS = new Set([
  'sin',
  'cos',
  'tan',
  'asin',
  'acos',
  'atan',
  'sinh',
  'cosh',
  'tanh',
  'sqrt',
  'cbrt',
  'ln',
  'log',
  'abs',
  'exp',
  'floor',
  'ceil',
  'round',
]);

const TWO_ARG_FUNCTIONS = new Set(['pow', 'max', 'min', 'mod', 'ncr', 'npr']);

const OP_PRECEDENCE: Record<string, number> = {
  '!': 5,
  '%': 5,
  '^': 4,
  'u-': 3,
  '*': 2,
  '/': 2,
  '+': 1,
  '-': 1,
};

const RIGHT_ASSOCIATIVE = new Set(['^', 'u-']);
const POSTFIX_OPS = new Set(['!', '%']);

function factorial(n: number): number {
  if (!Number.isFinite(n) || n < 0 || !Number.isInteger(n)) {
    throw new Error('팩토리얼은 0 이상의 정수에만 사용할 수 있습니다.');
  }
  if (n > 170) {
    throw new Error('팩토리얼 입력이 너무 큽니다. (170 이하)');
  }
  let result = 1;
  for (let i = 2; i <= n; i += 1) {
    result *= i;
  }
  return result;
}

function nPr(n: number, r: number): number {
  if (!Number.isInteger(n) || !Number.isInteger(r) || n < 0 || r < 0 || r > n) {
    throw new Error('nPr은 0 이상의 정수 n, r (r <= n)만 허용합니다.');
  }
  let result = 1;
  for (let i = 0; i < r; i += 1) {
    result *= n - i;
  }
  return result;
}

function nCr(n: number, r: number): number {
  if (!Number.isInteger(n) || !Number.isInteger(r) || n < 0 || r < 0 || r > n) {
    throw new Error('nCr은 0 이상의 정수 n, r (r <= n)만 허용합니다.');
  }
  const rr = Math.min(r, n - r);
  let numerator = 1;
  let denominator = 1;
  for (let i = 1; i <= rr; i += 1) {
    numerator *= n - (rr - i);
    denominator *= i;
  }
  return numerator / denominator;
}

function formatResult(value: number): string {
  if (!Number.isFinite(value)) {
    return '오류';
  }
  const abs = Math.abs(value);
  if (abs !== 0 && (abs >= 1e12 || abs < 1e-8)) {
    return value.toExponential(10).replace(/0+e/, 'e').replace(/\.e/, 'e');
  }
  const fixed = value.toFixed(12);
  return fixed.replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1');
}

function tokenize(raw: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < raw.length) {
    const ch = raw[i];

    if (/\s/.test(ch)) {
      i += 1;
      continue;
    }

    if (/\d|\./.test(ch)) {
      let j = i;
      let dotCount = 0;
      while (j < raw.length && /[\d.]/.test(raw[j])) {
        if (raw[j] === '.') {
          dotCount += 1;
        }
        j += 1;
      }
      if (dotCount > 1) {
        throw new Error('잘못된 숫자 형식입니다.');
      }
      const numText = raw.slice(i, j);
      if (numText === '.') {
        throw new Error('잘못된 숫자 형식입니다.');
      }
      tokens.push({ type: 'number', value: numText });
      i = j;
      continue;
    }

    if (/[a-zA-Z]/.test(ch)) {
      let j = i;
      while (j < raw.length && /[a-zA-Z]/.test(raw[j])) {
        j += 1;
      }
      const ident = raw.slice(i, j).toLowerCase();
      if (ident === 'pi' || ident === 'e' || ident === 'ans') {
        tokens.push({ type: 'constant', value: ident });
      } else {
        tokens.push({ type: 'func', value: ident });
      }
      i = j;
      continue;
    }

    if ('+-*/^!%(),'.includes(ch)) {
      if (ch === '(' || ch === ')') {
        tokens.push({ type: 'paren', value: ch });
      } else if (ch === ',') {
        tokens.push({ type: 'comma', value: ch });
      } else {
        tokens.push({ type: 'operator', value: ch });
      }
      i += 1;
      continue;
    }

    throw new Error(`지원하지 않는 문자입니다: ${ch}`);
  }

  const withImplicitMultiply: Token[] = [];
  for (let idx = 0; idx < tokens.length; idx += 1) {
    const curr = tokens[idx];
    const prev = withImplicitMultiply[withImplicitMultiply.length - 1];

    if (prev) {
      const prevIsValue =
        prev.type === 'number' ||
        prev.type === 'constant' ||
        (prev.type === 'paren' && prev.value === ')') ||
        (prev.type === 'operator' && POSTFIX_OPS.has(prev.value));

      const currStartsValue =
        curr.type === 'number' ||
        curr.type === 'constant' ||
        curr.type === 'func' ||
        (curr.type === 'paren' && curr.value === '(');

      if (prevIsValue && currStartsValue) {
        withImplicitMultiply.push({ type: 'operator', value: '*' });
      }
    }

    withImplicitMultiply.push(curr);
  }

  return withImplicitMultiply;
}

function toRpn(tokens: Token[]): Token[] {
  const output: Token[] = [];
  const stack: Token[] = [];
  let prevToken: Token | null = null;

  for (const token of tokens) {
    if (token.type === 'number' || token.type === 'constant') {
      output.push(token);
      prevToken = token;
      continue;
    }

    if (token.type === 'func') {
      stack.push(token);
      prevToken = token;
      continue;
    }

    if (token.type === 'comma') {
      while (stack.length > 0 && !(stack[stack.length - 1].type === 'paren' && stack[stack.length - 1].value === '(')) {
        output.push(stack.pop() as Token);
      }
      if (stack.length === 0) {
        throw new Error('쉼표 위치가 올바르지 않습니다.');
      }
      prevToken = token;
      continue;
    }

    if (token.type === 'operator') {
      let op = token.value;
      const prevIsOperator = prevToken?.type === 'operator' && !POSTFIX_OPS.has(prevToken.value);
      const prevIsLeftParen = prevToken?.type === 'paren' && prevToken.value === '(';
      const prevIsComma = prevToken?.type === 'comma';

      if (op === '-' && (!prevToken || prevIsOperator || prevIsLeftParen || prevIsComma)) {
        op = 'u-';
      }

      while (stack.length > 0) {
        const top = stack[stack.length - 1];
        if (top.type !== 'operator') {
          break;
        }
        const topPrec = OP_PRECEDENCE[top.value];
        const currPrec = OP_PRECEDENCE[op];

        const shouldPop = RIGHT_ASSOCIATIVE.has(op) ? currPrec < topPrec : currPrec <= topPrec;
        if (!shouldPop) {
          break;
        }
        output.push(stack.pop() as Token);
      }

      stack.push({ type: 'operator', value: op });
      prevToken = { type: 'operator', value: op };
      continue;
    }

    if (token.type === 'paren' && token.value === '(') {
      stack.push(token);
      prevToken = token;
      continue;
    }

    if (token.type === 'paren' && token.value === ')') {
      while (stack.length > 0 && !(stack[stack.length - 1].type === 'paren' && stack[stack.length - 1].value === '(')) {
        output.push(stack.pop() as Token);
      }

      if (stack.length === 0) {
        throw new Error('괄호가 맞지 않습니다.');
      }

      stack.pop();

      if (stack.length > 0 && stack[stack.length - 1].type === 'func') {
        output.push(stack.pop() as Token);
      }

      prevToken = token;
      continue;
    }
  }

  while (stack.length > 0) {
    const top = stack.pop() as Token;
    if (top.type === 'paren') {
      throw new Error('괄호가 맞지 않습니다.');
    }
    output.push(top);
  }

  return output;
}

function evalRpn(rpn: Token[], angleMode: AngleMode, ans: number): number {
  const stack: number[] = [];

  const toRadians = (v: number) => (angleMode === 'deg' ? (v * Math.PI) / 180 : v);
  const toDegrees = (v: number) => (angleMode === 'deg' ? (v * 180) / Math.PI : v);

  for (const token of rpn) {
    if (token.type === 'number') {
      stack.push(Number(token.value));
      continue;
    }

    if (token.type === 'constant') {
      if (token.value === 'pi') {
        stack.push(Math.PI);
      } else if (token.value === 'e') {
        stack.push(Math.E);
      } else {
        stack.push(ans);
      }
      continue;
    }

    if (token.type === 'operator') {
      if (token.value === 'u-') {
        const a = stack.pop();
        if (a === undefined) {
          throw new Error('수식이 올바르지 않습니다.');
        }
        stack.push(-a);
        continue;
      }

      if (token.value === '!') {
        const a = stack.pop();
        if (a === undefined) {
          throw new Error('수식이 올바르지 않습니다.');
        }
        stack.push(factorial(a));
        continue;
      }

      if (token.value === '%') {
        const a = stack.pop();
        if (a === undefined) {
          throw new Error('수식이 올바르지 않습니다.');
        }
        stack.push(a / 100);
        continue;
      }

      const b = stack.pop();
      const a = stack.pop();
      if (a === undefined || b === undefined) {
        throw new Error('수식이 올바르지 않습니다.');
      }

      switch (token.value) {
        case '+':
          stack.push(a + b);
          break;
        case '-':
          stack.push(a - b);
          break;
        case '*':
          stack.push(a * b);
          break;
        case '/':
          if (b === 0) {
            throw new Error('0으로 나눌 수 없습니다.');
          }
          stack.push(a / b);
          break;
        case '^':
          stack.push(a ** b);
          break;
        default:
          throw new Error(`지원하지 않는 연산자입니다: ${token.value}`);
      }
      continue;
    }

    if (token.type === 'func') {
      if (ONE_ARG_FUNCTIONS.has(token.value)) {
        const a = stack.pop();
        if (a === undefined) {
          throw new Error(`함수 ${token.value}의 인자가 부족합니다.`);
        }
        switch (token.value) {
          case 'sin':
            stack.push(Math.sin(toRadians(a)));
            break;
          case 'cos':
            stack.push(Math.cos(toRadians(a)));
            break;
          case 'tan':
            stack.push(Math.tan(toRadians(a)));
            break;
          case 'asin':
            stack.push(toDegrees(Math.asin(a)));
            break;
          case 'acos':
            stack.push(toDegrees(Math.acos(a)));
            break;
          case 'atan':
            stack.push(toDegrees(Math.atan(a)));
            break;
          case 'sinh':
            stack.push(Math.sinh(a));
            break;
          case 'cosh':
            stack.push(Math.cosh(a));
            break;
          case 'tanh':
            stack.push(Math.tanh(a));
            break;
          case 'sqrt':
            stack.push(Math.sqrt(a));
            break;
          case 'cbrt':
            stack.push(Math.cbrt(a));
            break;
          case 'ln':
            stack.push(Math.log(a));
            break;
          case 'log':
            stack.push(Math.log10(a));
            break;
          case 'abs':
            stack.push(Math.abs(a));
            break;
          case 'exp':
            stack.push(Math.exp(a));
            break;
          case 'floor':
            stack.push(Math.floor(a));
            break;
          case 'ceil':
            stack.push(Math.ceil(a));
            break;
          case 'round':
            stack.push(Math.round(a));
            break;
          default:
            throw new Error(`지원하지 않는 함수입니다: ${token.value}`);
        }
        continue;
      }

      if (TWO_ARG_FUNCTIONS.has(token.value)) {
        const b = stack.pop();
        const a = stack.pop();
        if (a === undefined || b === undefined) {
          throw new Error(`함수 ${token.value}의 인자가 부족합니다.`);
        }
        switch (token.value) {
          case 'pow':
            stack.push(a ** b);
            break;
          case 'max':
            stack.push(Math.max(a, b));
            break;
          case 'min':
            stack.push(Math.min(a, b));
            break;
          case 'mod':
            stack.push(a % b);
            break;
          case 'ncr':
            stack.push(nCr(a, b));
            break;
          case 'npr':
            stack.push(nPr(a, b));
            break;
          default:
            throw new Error(`지원하지 않는 함수입니다: ${token.value}`);
        }
        continue;
      }

      throw new Error(`지원하지 않는 함수입니다: ${token.value}`);
    }
  }

  if (stack.length !== 1) {
    throw new Error('수식을 해석할 수 없습니다.');
  }

  return stack[0];
}

function evaluateScientificExpression(expression: string, angleMode: AngleMode, ans: number): number {
  const normalized = expression.trim();
  if (!normalized) {
    throw new Error('수식을 입력해 주세요.');
  }

  const tokens = tokenize(normalized);
  const rpn = toRpn(tokens);
  return evalRpn(rpn, angleMode, ans);
}

export const ScientificCalculator: React.FC<Props> = ({ onSaveHistory }) => {
  const [expression, setExpression] = useState<string>('sin(45)^2 + cos(45)^2');
  const [result, setResult] = useState<string>('1');
  const [ansValue, setAnsValue] = useState<number>(1);
  const [angleMode, setAngleMode] = useState<AngleMode>('deg');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  const quickFunctions = useMemo(
    () => [
      'sin(',
      'cos(',
      'tan(',
      'asin(',
      'acos(',
      'atan(',
      'ln(',
      'log(',
      'sqrt(',
      'pow(,)',
      'nCr(,)',
      'nPr(,)',
      'abs(',
      'mod(,)',
      'pi',
      'e',
      'ans',
    ],
    []
  );

  const pressToken = (token: string) => {
    setExpression((prev) => `${prev}${token}`);
  };

  const handleEvaluate = () => {
    try {
      const value = evaluateScientificExpression(expression, angleMode, ansValue);
      const formatted = formatResult(value);
      setResult(formatted);
      setAnsValue(value);
      setErrorMessage('');

      onSaveHistory('공학용 계산기', `${expression} = ${formatted}`, {
        수식: expression,
        결과: formatted,
        모드: angleMode.toUpperCase(),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : '계산 중 오류가 발생했습니다.');
    }
  };

  const handleCopy = () => {
    const text = `[공학용 계산기]\n${expression} = ${result} (${angleMode.toUpperCase()})`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleClear = () => {
    setExpression('');
    setErrorMessage('');
  };

  const keypadRows: string[][] = [
    ['7', '8', '9', '/', '('],
    ['4', '5', '6', '*', ')'],
    ['1', '2', '3', '-', '^'],
    ['0', '.', '%', '+', '!'],
  ];

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Sigma className="w-5 h-5 text-indigo-600" />
          <span>공학용 계산기</span>
        </h3>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setAngleMode('deg')}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
              angleMode === 'deg'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            DEG
          </button>
          <button
            onClick={() => setAngleMode('rad')}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
              angleMode === 'rad'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            RAD
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">수식 입력</label>
        <textarea
          value={expression}
          onChange={(e) => setExpression(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleEvaluate();
            }
          }}
          rows={3}
          placeholder="예: sin(45)^2 + cos(45)^2, nCr(10,3), log(1000), 3!(+2)"
          className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/60 p-3 text-sm font-semibold text-slate-800 dark:text-slate-100"
        />
      </div>

      <div className="p-4 rounded-2xl border border-indigo-100 dark:border-indigo-900 bg-indigo-50/70 dark:bg-indigo-950/30">
        <div className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">결과</div>
        <div className="text-3xl font-black text-indigo-900 dark:text-indigo-100 mt-1 break-all">{result}</div>
        {errorMessage && <div className="mt-2 text-xs font-semibold text-rose-600">{errorMessage}</div>}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {quickFunctions.map((fn) => (
          <button
            key={fn}
            onClick={() => pressToken(fn)}
            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700"
          >
            {fn}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-5 gap-2">
        {keypadRows.flat().map((key) => (
          <button
            key={key}
            onClick={() => pressToken(key)}
            className="py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
          >
            {key}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <div className="flex items-center gap-2">
          <button
            onClick={handleClear}
            className="px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            초기화
          </button>
          <button
            onClick={() => setExpression((prev) => prev.slice(0, -1))}
            className="px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1"
          >
            <Delete className="w-3.5 h-3.5" />
            DEL
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? '복사완료' : '결과 복사'}
          </button>
          <button
            onClick={handleEvaluate}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold"
          >
            계산
          </button>
          <button
            onClick={handleEvaluate}
            className="px-3 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold flex items-center gap-1"
          >
            <BookmarkPlus className="w-3.5 h-3.5" />
            {saved ? '저장완료' : '기록저장'}
          </button>
        </div>
      </div>

      <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
        지원 연산: +, -, *, /, ^, %, !, 괄호 / 함수: sin, cos, tan, asin, acos, atan, ln, log, sqrt, cbrt, abs, exp, floor, ceil, round, pow(a,b), mod(a,b), nCr(n,r), nPr(n,r), max(a,b), min(a,b)
      </div>
    </div>
  );
};
