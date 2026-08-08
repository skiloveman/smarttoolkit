import React, { useEffect, useRef, useState } from 'react';
import { Sparkles, Copy, Check, RefreshCw, Dices, SlidersHorizontal, Trash2 } from 'lucide-react';
import { SaveHistoryFn } from '../../types';
import { usePendingHistoryRestore } from '../../utils/historyRestore';

interface Props {
  onSaveHistory: (title: string, summary: string, details: Record<string, string | number>) => void;
}

const BALL_SIZE = 40;
const BALL_GAP = 8;
const BALLS_PER_ROW = 6;
const BALL_CANVAS_W = BALLS_PER_ROW * BALL_SIZE + (BALLS_PER_ROW - 1) * BALL_GAP;
const BALL_CANVAS_H = BALL_SIZE + 16;

// Official Korean Lotto 6/45 ball color bands, rendered as a glossy sphere.
const getBallColors = (num: number) => {
  if (num >= 1 && num <= 10) {
    return { light: '#fff3b8', mid: '#f4c430', dark: '#c99a10', text: '#4a3300' };
  } else if (num >= 11 && num <= 20) {
    return { light: '#9dcdf7', mid: '#4a90e2', dark: '#2f5fa8', text: '#ffffff' };
  } else if (num >= 21 && num <= 30) {
    return { light: '#f6ada1', mid: '#e2574c', dark: '#a8362c', text: '#ffffff' };
  } else if (num >= 31 && num <= 40) {
    return { light: '#c2c2c2', mid: '#8a8a8a', dark: '#565656', text: '#ffffff' };
  }
  return { light: '#a3e3a7', mid: '#4caf50', dark: '#2e7d32', text: '#ffffff' };
};

const drawLottoBall = (ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, num: number) => {
  const { light, mid, dark, text } = getBallColors(num);

  // Soft drop shadow so the ball reads as sitting on a surface.
  ctx.beginPath();
  ctx.ellipse(cx + r * 0.14, cy + r * 0.22, r * 0.92, r * 0.78, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
  ctx.fill();

  // Sphere body with an offset light source for a glossy plastic look.
  const grad = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.4, r * 0.08, cx, cy, r);
  grad.addColorStop(0, light);
  grad.addColorStop(0.55, mid);
  grad.addColorStop(1, dark);
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.18)';
  ctx.stroke();

  // Glossy highlight streak.
  ctx.beginPath();
  ctx.ellipse(cx - r * 0.32, cy - r * 0.42, r * 0.34, r * 0.2, -0.5, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.fill();

  ctx.fillStyle = text;
  ctx.font = `800 ${Math.round(r * 1.02)}px "Pretendard", "Apple SD Gothic Neo", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(num), cx, cy + r * 0.04);
};

const drawBallRow = (canvas: HTMLCanvasElement, game: number[]) => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, BALL_CANVAS_W, BALL_CANVAS_H);
  const r = (BALL_SIZE / 2) * 0.92;
  const cy = BALL_CANVAS_H / 2 - 1;
  game.forEach((num, i) => {
    const cx = BALL_SIZE / 2 + i * (BALL_SIZE + BALL_GAP);
    drawLottoBall(ctx, cx, cy, r, num);
  });
};

export const LottoCalculator: React.FC<Props> = ({ onSaveHistory }) => {
  const saveHistory = onSaveHistory as SaveHistoryFn;
  const [gameCount, setGameCount] = useState<number>(5);
  const [fixedNumbers, setFixedNumbers] = useState<number[]>([]);
  const [excludedNumbers, setExcludedNumbers] = useState<number[]>([]);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [games, setGames] = useState<number[][]>([
    [3, 12, 24, 33, 39, 42],
    [7, 18, 22, 29, 31, 45],
    [2, 11, 15, 27, 38, 41],
    [5, 14, 21, 35, 36, 44],
    [8, 19, 25, 30, 37, 43],
  ]);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [saved, setSaved] = useState<boolean>(false);
  const ballCanvasRefs = useRef<Array<HTMLCanvasElement | null>>([]);

  usePendingHistoryRestore<{
    gameCount: number;
    fixedNumbers: number[];
    excludedNumbers: number[];
    showSettings: boolean;
    games: number[][];
  }>('lotto', (restored) => {
    setGameCount(restored.gameCount);
    setFixedNumbers(restored.fixedNumbers);
    setExcludedNumbers(restored.excludedNumbers);
    setShowSettings(restored.showSettings);
    setGames(restored.games);
  });

  useEffect(() => {
    games.slice(0, gameCount).forEach((game, idx) => {
      const canvas = ballCanvasRefs.current[idx];
      if (canvas) drawBallRow(canvas, game);
    });
  }, [games, gameCount]);

  // Helper to generate a single valid game array (sorted ascending)
  const generateSingleGame = (fixed: number[], excluded: number[]): number[] => {
    const available = Array.from({ length: 45 }, (_, i) => i + 1).filter(
      (n) => !excluded.includes(n) && !fixed.includes(n)
    );

    const needed = 6 - fixed.length;
    const selected: number[] = [...fixed];

    // Shuffle available array
    const shuffled = [...available];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    selected.push(...shuffled.slice(0, needed));
    return selected.sort((a, b) => a - b);
  };

  const handleGenerate = () => {
    setIsGenerating(true);
    let iterations = 0;
    const interval = setInterval(() => {
      iterations++;
      const tempGames: number[][] = [];
      for (let i = 0; i < gameCount; i++) {
        tempGames.push(generateSingleGame(fixedNumbers, excludedNumbers));
      }
      setGames(tempGames);

      if (iterations >= 8) {
        clearInterval(interval);
        setIsGenerating(false);
      }
    }, 80);
  };

  const toggleFixed = (num: number) => {
    if (fixedNumbers.includes(num)) {
      setFixedNumbers(fixedNumbers.filter((n) => n !== num));
    } else {
      if (fixedNumbers.length >= 5) {
        alert('고정수는 최대 5개까지 지정 가능합니다.');
        return;
      }
      setExcludedNumbers(excludedNumbers.filter((n) => n !== num));
      setFixedNumbers([...fixedNumbers, num]);
    }
  };

  const toggleExcluded = (num: number) => {
    if (excludedNumbers.includes(num)) {
      setExcludedNumbers(excludedNumbers.filter((n) => n !== num));
    } else {
      if (excludedNumbers.length >= 35) {
        alert('제외수가 너무 많습니다.');
        return;
      }
      setFixedNumbers(fixedNumbers.filter((n) => n !== num));
      setExcludedNumbers([...excludedNumbers, num]);
    }
  };

  const handleCopy = () => {
    const labels = ['A', 'B', 'C', 'D', 'E'];
    const lines = games
      .slice(0, gameCount)
      .map((g, idx) => `[${labels[idx]}조합] ${g.map((n) => (n < 10 ? `0${n}` : `${n}`)).join(', ')}`);
    const text = `[로또6/45 자동추출 번호]\n${lines.join('\n')}\n- 생활 계산기 (https://www.smart-toolkit.com)`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    const labels = ['A', 'B', 'C', 'D', 'E'];
    const detailsObj: Record<string, string> = {};
    games.slice(0, gameCount).forEach((g, idx) => {
      detailsObj[`${labels[idx]}게임`] = g.join(', ');
    });

    saveHistory('로또 번호 자동 추출', `${gameCount}게임 로또 번호 생성 완료`, detailsObj, {
      gameCount,
      fixedNumbers,
      excludedNumbers,
      showSettings,
      games,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const labels = ['A', 'B', 'C', 'D', 'E'];

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <span>로또6/45 번호 자동 추출기</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            실제 추첨 공 색상 규정 적용 및 고정수/제외수 커스텀 필터링 지원
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Settings Toggle */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 border transition-all ${
              showSettings
                ? 'bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-950 dark:border-blue-900 dark:text-blue-300'
                : 'bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>필터 조건 설정 {fixedNumbers.length + excludedNumbers.length > 0 && `(${fixedNumbers.length + excludedNumbers.length})`}</span>
          </button>

          {/* Game Count Selector */}
          <div className="flex rounded-lg bg-slate-100 dark:bg-slate-800 p-1 text-xs font-semibold">
            {[1, 2, 3, 4, 5].map((cnt) => (
              <button
                key={cnt}
                onClick={() => setGameCount(cnt)}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  gameCount === cnt
                    ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 font-bold shadow-2xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                }`}
              >
                {cnt}게임
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Advanced Settings Drawer (Fixed & Excluded numbers) */}
      {showSettings && (
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <span>고정수 / 제외수 지정</span>
              <span className="text-[10px] text-slate-400 font-normal">
                (클릭1회: 고정수 🟢, 클릭2회: 제외수 🔴)
              </span>
            </h4>
            <button
              onClick={() => {
                setFixedNumbers([]);
                setExcludedNumbers([]);
              }}
              className="text-[11px] text-rose-500 hover:underline flex items-center gap-1 font-medium"
            >
              <Trash2 className="w-3 h-3" />
              <span>조건 초기화</span>
            </button>
          </div>

          {/* 1 ~ 45 Number Selector Grid */}
          <div className="grid grid-cols-9 sm:grid-cols-15 gap-1.5 pt-1">
            {Array.from({ length: 45 }, (_, i) => i + 1).map((num) => {
              const isFixed = fixedNumbers.includes(num);
              const isExcluded = excludedNumbers.includes(num);

              let bgClass = 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
              if (isFixed) {
                bgClass = 'bg-emerald-500 text-white font-bold border-emerald-600 shadow-2xs';
              } else if (isExcluded) {
                bgClass = 'bg-rose-500 text-white font-bold border-rose-600 line-through opacity-70';
              }

              return (
                <button
                  key={num}
                  onClick={() => {
                    if (isFixed) {
                      toggleExcluded(num);
                    } else if (isExcluded) {
                      setExcludedNumbers(excludedNumbers.filter((n) => n !== num));
                    } else {
                      toggleFixed(num);
                    }
                  }}
                  className={`h-7 rounded-md text-xs border flex items-center justify-center transition-all ${bgClass}`}
                >
                  {num}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs pt-1 border-t border-slate-200/60 dark:border-slate-700/60 text-slate-600 dark:text-slate-400">
            <div>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">고정수({fixedNumbers.length}): </span>
              <span>{fixedNumbers.length > 0 ? fixedNumbers.join(', ') : '없음'}</span>
            </div>
            <div>
              <span className="font-semibold text-rose-600 dark:text-rose-400">제외수({excludedNumbers.length}): </span>
              <span>{excludedNumbers.length > 0 ? excludedNumbers.join(', ') : '없음'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Generation & Ball Display Section */}
      <div className="space-y-4">
        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="flex-1 min-w-[200px] bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-white py-3.5 px-6 rounded-xl font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition-all active:scale-98 disabled:opacity-70"
          >
            <Dices className={`w-5 h-5 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>{isGenerating ? '행운의 번호 추첨 중...' : `${gameCount}게임 로또 번호 자동 추출`}</span>
          </button>

          <button
            onClick={handleCopy}
            className="px-4 py-3.5 bg-slate-900 hover:bg-black dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? '복사완료' : '전체 복사'}</span>
          </button>

          <button
            onClick={handleSave}
            className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-100 transition-colors text-xs font-semibold whitespace-nowrap"
            title="계산기록에서 다시 가져올 수 있습니다."
          >기록저장</button>
        </div>

        {/* Display Generated Lotto Games (1 to 5 games) */}
        <div className="space-y-3 pt-2">
          {games.slice(0, gameCount).map((game, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-amber-300 dark:hover:border-amber-800/60 transition-all"
            >
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400 font-black text-xs flex items-center justify-center border border-amber-200 dark:border-amber-900 shrink-0">
                  {labels[idx]}
                </span>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider shrink-0">
                  자동선택
                </span>

                {/* 6 Lotto Balls (HTML canvas, rendered as glossy spheres) */}
                <canvas
                  ref={(el) => {
                    ballCanvasRefs.current[idx] = el;
                  }}
                  width={BALL_CANVAS_W}
                  height={BALL_CANVAS_H}
                  className={`transition-all duration-150 ${isGenerating ? 'scale-90 opacity-70' : 'scale-100 opacity-100'}`}
                  style={{ maxWidth: '100%', height: 'auto' }}
                />
              </div>

              {/* Copy Single Game */}
              <button
                onClick={() => {
                  const text = `[${labels[idx]}게임] ${game.join(', ')}`;
                  navigator.clipboard.writeText(text);
                  alert(`${labels[idx]}게임 번호가 복사되었습니다.`);
                }}
                className="text-[11px] font-medium text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 self-end sm:self-center transition-colors"
              >
                조합 복사
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Official Color Legend & Tip */}
      <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
        <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
          공식 로또6/45 번호대별 색상 안내
        </div>
        <div className="flex flex-wrap gap-3 text-[11px] text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-full bg-amber-400 border border-amber-500 inline-block" />
            <span>1~10번 (노랑)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-full bg-blue-500 border border-blue-600 inline-block" />
            <span>11~20번 (파랑)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-full bg-rose-500 border border-rose-600 inline-block" />
            <span>21~30번 (빨강)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-full bg-slate-600 border border-slate-700 inline-block" />
            <span>31~40번 (회색)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 border border-emerald-600 inline-block" />
            <span>41~45번 (초록)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
