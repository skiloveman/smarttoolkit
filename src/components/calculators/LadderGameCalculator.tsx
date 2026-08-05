import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, RefreshCw, BookmarkPlus } from 'lucide-react';

interface Props {
  onSaveHistory: (title: string, summary: string, details: Record<string, string | number>) => void;
}

interface Point {
  x: number;
  y: number;
}

interface RunData {
  laneCount: number;
  rowCount: number;
  rows: boolean[][];
  paths: Point[][];
  finalLaneByStart: number[];
}

const LADDER_HEIGHT = 420;
const LADDER_WIDTH = 720;
const TOP_PADDING = 28;
const BOTTOM_PADDING = 28;
const ANIMATION_DURATION_MS = 5600;

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const getHorizontalPadding = (laneCount: number) => {
  const basePadding = 34 - (laneCount - 4) * 2.8;
  if (laneCount >= 8) {
    const extraTightening = (laneCount - 7) * 1.4;
    return clamp(basePadding - extraTightening, 7, 34);
  }
  return clamp(basePadding, 12, 34);
};

const createDefaultNames = (count: number) =>
  Array.from({ length: count }, (_, i) => `참가자 ${i + 1}`);

const createDefaultResults = (count: number) =>
  Array.from({ length: count }, (_, i) => `결과 ${i + 1}`);

const getDefaultNameLabel = (index: number) => `참가자 ${index + 1}`;
const getDefaultResultLabel = (index: number) => `결과 ${index + 1}`;

const syncLength = (arr: string[], count: number, fallbackPrefix: string): string[] => {
  const next = [...arr];
  if (next.length < count) {
    for (let i = next.length; i < count; i++) {
      next.push(`${fallbackPrefix} ${i + 1}`);
    }
  }
  return next.slice(0, count);
};

const getRowCount = (laneCount: number) => clamp(14 + laneCount * 2, 14, 34);

const pickRandom = (arr: number[]) => arr[Math.floor(Math.random() * arr.length)];

const createRows = (laneCount: number, rowCount: number): boolean[][] => {
  const rows: boolean[][] = Array.from({ length: rowCount }, () =>
    Array.from({ length: laneCount - 1 }, () => false)
  );
  const bridgeCounts = Array.from({ length: laneCount - 1 }, () => 0);

  for (let r = 0; r < rowCount; r++) {
    let added = 0;
    const wave = 0.44 + 0.16 * Math.sin((r / Math.max(1, rowCount - 1)) * Math.PI * 2);

    for (let i = 0; i < laneCount - 1; i++) {
      if (i > 0 && rows[r][i - 1]) {
        continue;
      }

      const prevRowSame = r > 0 && rows[r - 1][i];
      const needBonus = bridgeCounts[i] < Math.floor(r / 3) ? 0.13 : 0;
      const chance = clamp(wave + needBonus - (prevRowSame ? 0.14 : 0), 0.18, 0.8);

      if (Math.random() < chance) {
        rows[r][i] = true;
        bridgeCounts[i] += 1;
        added += 1;
      }
    }

    const minPerRow = laneCount >= 7 ? 2 : 1;
    if (added < minPerRow) {
      const candidates: number[] = [];
      for (let i = 0; i < laneCount - 1; i++) {
        if (rows[r][i]) {
          continue;
        }
        if (i > 0 && rows[r][i - 1]) {
          continue;
        }
        if (i < laneCount - 2 && rows[r][i + 1]) {
          continue;
        }
        candidates.push(i);
      }

      if (candidates.length > 0) {
        const sorted = [...candidates].sort((a, b) => bridgeCounts[a] - bridgeCounts[b]);
        const forced = sorted[0];
        rows[r][forced] = true;
        bridgeCounts[forced] += 1;
      }
    }
  }

  const laneTouches = Array.from({ length: laneCount }, () => 0);
  for (let r = 0; r < rowCount; r++) {
    for (let i = 0; i < laneCount - 1; i++) {
      if (rows[r][i]) {
        laneTouches[i] += 1;
        laneTouches[i + 1] += 1;
      }
    }
  }

  for (let lane = 0; lane < laneCount; lane++) {
    if (laneTouches[lane] > 0) {
      continue;
    }

    for (let attempt = 0; attempt < rowCount * 2; attempt++) {
      const r = Math.floor(Math.random() * rowCount);
      const options: number[] = [];

      if (lane > 0) {
        options.push(lane - 1);
      }
      if (lane < laneCount - 1) {
        options.push(lane);
      }

      const bridgeIdx = pickRandom(options);
      if (rows[r][bridgeIdx]) {
        continue;
      }
      if (bridgeIdx > 0 && rows[r][bridgeIdx - 1]) {
        continue;
      }
      if (bridgeIdx < laneCount - 2 && rows[r][bridgeIdx + 1]) {
        continue;
      }

      rows[r][bridgeIdx] = true;
      laneTouches[bridgeIdx] += 1;
      laneTouches[bridgeIdx + 1] += 1;
      break;
    }
  }

  return rows;
};

const buildPath = (startLane: number, rows: boolean[][]): { laneIndex: number; path: Point[] } => {
  let lane = startLane;
  const path: Point[] = [{ x: lane, y: 0 }];

  rows.forEach((row, rowIndex) => {
    const centerY = rowIndex + 0.5;
    path.push({ x: lane, y: centerY });

    if (lane > 0 && row[lane - 1]) {
      lane -= 1;
      path.push({ x: lane, y: centerY });
    } else if (lane < row.length && row[lane]) {
      lane += 1;
      path.push({ x: lane, y: centerY });
    }

    path.push({ x: lane, y: rowIndex + 1 });
  });

  return { laneIndex: lane, path };
};

const laneToX = (lane: number, laneCount: number, horizontalPadding: number) => {
  const usableWidth = LADDER_WIDTH - horizontalPadding * 2;
  if (laneCount === 1) {
    return horizontalPadding + usableWidth / 2;
  }
  return horizontalPadding + (lane / (laneCount - 1)) * usableWidth;
};

const rowToY = (row: number, rowCount: number) => {
  const usableHeight = LADDER_HEIGHT - TOP_PADDING - BOTTOM_PADDING;
  return TOP_PADDING + (row / rowCount) * usableHeight;
};

const toSvgPoint = (
  point: Point,
  laneCount: number,
  rowCount: number,
  horizontalPadding: number
): Point => ({
  x: laneToX(point.x, laneCount, horizontalPadding),
  y: rowToY(point.y, rowCount),
});

const getPolylineLength = (points: Point[]) => {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i - 1].x;
    const dy = points[i].y - points[i - 1].y;
    total += Math.hypot(dx, dy);
  }
  return total;
};

const getPointAtProgress = (points: Point[], progress: number): Point => {
  if (points.length === 0) {
    return { x: 0, y: 0 };
  }

  if (points.length === 1) {
    return points[0];
  }

  const p = clamp(progress, 0, 1);
  const totalLength = getPolylineLength(points);
  const target = totalLength * p;

  let walked = 0;

  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    const segLength = Math.hypot(b.x - a.x, b.y - a.y);

    if (walked + segLength >= target) {
      const remain = target - walked;
      const t = segLength === 0 ? 0 : remain / segLength;
      return {
        x: a.x + (b.x - a.x) * t,
        y: a.y + (b.y - a.y) * t,
      };
    }

    walked += segLength;
  }

  return points[points.length - 1];
};

const getPartialPolyline = (points: Point[], progress: number): Point[] => {
  if (points.length <= 1) {
    return points;
  }

  const p = clamp(progress, 0, 1);
  if (p <= 0) {
    return [points[0]];
  }
  if (p >= 1) {
    return points;
  }

  const totalLength = getPolylineLength(points);
  const target = totalLength * p;
  let walked = 0;
  const partial: Point[] = [points[0]];

  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    const segLength = Math.hypot(b.x - a.x, b.y - a.y);

    if (walked + segLength < target) {
      partial.push(b);
      walked += segLength;
      continue;
    }

    const remain = target - walked;
    const t = segLength === 0 ? 0 : remain / segLength;
    partial.push({
      x: a.x + (b.x - a.x) * t,
      y: a.y + (b.y - a.y) * t,
    });
    break;
  }

  return partial;
};

export const LadderGameCalculator: React.FC<Props> = ({ onSaveHistory }) => {
  const [laneCount, setLaneCount] = useState<number>(4);
  const [names, setNames] = useState<string[]>(createDefaultNames(4));
  const [results, setResults] = useState<string[]>(createDefaultResults(4));

  const [runData, setRunData] = useState<RunData | null>(null);
  const [progressByLane, setProgressByLane] = useState<number[]>([]);
  const [revealedStartLanes, setRevealedStartLanes] = useState<boolean[]>([]);
  const [activeStartLane, setActiveStartLane] = useState<number | null>(null);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [saved, setSaved] = useState<boolean>(false);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const previewRowCount = useMemo(() => getRowCount(laneCount), [laneCount]);
  const previewRows = useMemo(() => createRows(laneCount, previewRowCount), [laneCount, previewRowCount]);

  const ensureLength = (count: number) => {
    setNames((prev) => syncLength(prev, count, '참가자'));
    setResults((prev) => syncLength(prev, count, '결과'));
  };

  const handleLaneCountChange = (value: number) => {
    const next = clamp(value, 2, 12);
    setLaneCount(next);
    ensureLength(next);
    setRunData(null);
    setProgressByLane([]);
    setRevealedStartLanes([]);
    setActiveStartLane(null);
    setIsAnimating(false);
  };

  const updateName = (index: number, value: string) => {
    setNames((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const handleNameFocus = (index: number) => {
    const current = names[index] ?? '';
    if (current.trim() === getDefaultNameLabel(index)) {
      updateName(index, '');
    }
  };

  const handleNameBlur = (index: number) => {
    const current = (names[index] ?? '').trim();
    if (current.length === 0) {
      updateName(index, getDefaultNameLabel(index));
    }
  };

  const updateResult = (index: number, value: string) => {
    setResults((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const handleResultFocus = (index: number) => {
    const current = results[index] ?? '';
    if (current.trim() === getDefaultResultLabel(index)) {
      updateResult(index, '');
    }
  };

  const handleResultBlur = (index: number) => {
    const current = (results[index] ?? '').trim();
    if (current.length === 0) {
      updateResult(index, getDefaultResultLabel(index));
    }
  };

  const validateInput = () => {
    const visibleNames = names.slice(0, laneCount).map((v) => v.trim());
    const visibleResults = results.slice(0, laneCount).map((v) => v.trim());

    if (visibleNames.some((v) => v.length === 0)) {
      alert('상단 이름을 모두 입력해 주세요.');
      return false;
    }

    if (visibleResults.some((v) => v.length === 0)) {
      alert('하단 결과값을 모두 입력해 주세요.');
      return false;
    }

    return true;
  };

  const startSingleLaneAnimation = (startLane: number) => {
    if (!runData || isAnimating) {
      return;
    }
    if (revealedStartLanes[startLane]) {
      return;
    }

    setIsAnimating(true);
    setActiveStartLane(startLane);

    const startedAt = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startedAt;
      const progress = clamp(elapsed / ANIMATION_DURATION_MS, 0, 1);

      setProgressByLane((prev) => {
        const next = [...prev];
        next[startLane] = progress;
        return next;
      });

      if (progress >= 1) {
        setIsAnimating(false);
        setActiveStartLane(null);
        setRevealedStartLanes((prev) => {
          const next = [...prev];
          next[startLane] = true;
          return next;
        });
        rafRef.current = null;
        return;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
    }
    rafRef.current = requestAnimationFrame(tick);
  };

  const handleRun = () => {
    if (!validateInput()) {
      return;
    }

    const rowCount = getRowCount(laneCount);
    let rows = createRows(laneCount, rowCount);
    let paths: Point[][] = [];
    let finalLaneByStart: number[] = [];

    // Avoid flat outputs by retrying a few times until at least one lane changes.
    for (let attempt = 0; attempt < 7; attempt++) {
      paths = [];
      finalLaneByStart = [];

      for (let lane = 0; lane < laneCount; lane++) {
        const { laneIndex, path } = buildPath(lane, rows);
        finalLaneByStart.push(laneIndex);
        paths.push(path.map((p) => toSvgPoint(p, laneCount, rowCount, horizontalPadding)));
      }

      const movedCount = finalLaneByStart.filter((finalLane, startLane) => finalLane !== startLane).length;
      if (movedCount >= Math.max(1, Math.floor(laneCount / 3))) {
        break;
      }

      rows = createRows(laneCount, rowCount);
    }

    const nextRunData: RunData = {
      laneCount,
      rowCount,
      rows,
      paths,
      finalLaneByStart,
    };

    setRunData(nextRunData);
    setProgressByLane(Array.from({ length: laneCount }, () => 0));
    setRevealedStartLanes(Array.from({ length: laneCount }, () => false));
    setActiveStartLane(null);
    setIsAnimating(false);
    setSaved(false);
  };

  const handleReset = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    setLaneCount(4);
    setNames(createDefaultNames(4));
    setResults(createDefaultResults(4));
    setProgressByLane([]);
    setRevealedStartLanes([]);
    setActiveStartLane(null);
    setRunData(null);
    setIsAnimating(false);
    setSaved(false);
  };

  const handleSaveResult = () => {
    if (!runData) {
      alert('먼저 실행 버튼으로 사다리게임을 실행해 주세요.');
      return;
    }

    const detailObj: Record<string, string> = {};
    runData.finalLaneByStart.forEach((finalLane, startLane) => {
      const who = names[startLane]?.trim() || `참가자 ${startLane + 1}`;
      const what = results[finalLane]?.trim() || `결과 ${finalLane + 1}`;
      detailObj[who] = what;
    });

    onSaveHistory('사다리게임', `${runData.laneCount}인 사다리 결과 저장`, detailObj);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const activeRows = runData?.rows ?? previewRows;
  const activeRowCount = runData?.rowCount ?? previewRowCount;
  const horizontalPadding = useMemo(() => getHorizontalPadding(laneCount), [laneCount]);
  const laneLeftPercents = useMemo(
    () =>
      Array.from(
        { length: laneCount },
        (_, lane) => (laneToX(lane, laneCount, horizontalPadding) / LADDER_WIDTH) * 100
      ),
    [laneCount, horizontalPadding]
  );

  const allRevealed = runData ? revealedStartLanes.slice(0, laneCount).every(Boolean) : false;

  const revealByBottomLane = useMemo(() => {
    if (!runData) {
      return Array.from({ length: laneCount }, () => true);
    }

    const reveal = Array.from({ length: laneCount }, () => false);
    runData.finalLaneByStart.forEach((finalLane, startLane) => {
      reveal[finalLane] = revealedStartLanes[startLane] ?? false;
    });

    return reveal;
  }, [runData, laneCount, revealedStartLanes]);

  const bottomParticipantNames = useMemo(() => {
    if (!runData) {
      return names.slice(0, laneCount);
    }

    const mapped = Array.from({ length: laneCount }, () => '');
    runData.finalLaneByStart.forEach((finalLane, startLane) => {
      if (revealByBottomLane[finalLane]) {
        mapped[finalLane] = names[startLane] ?? `참가자 ${startLane + 1}`;
      }
    });

    if (activeStartLane !== null && !revealedStartLanes[activeStartLane]) {
      const movingTargetLane = runData.finalLaneByStart[activeStartLane];
      if (movingTargetLane !== undefined) {
        mapped[movingTargetLane] = names[activeStartLane] ?? `참가자 ${activeStartLane + 1}`;
      }
    }

    return mapped;
  }, [runData, names, laneCount, revealByBottomLane, activeStartLane, revealedStartLanes]);

  const tokenPositions = (runData?.paths ?? [])
    .map((path, idx) => {
      const isVisible = activeStartLane === idx || (revealedStartLanes[idx] ?? false);
      if (!isVisible) {
        return null;
      }

      const progress = activeStartLane === idx ? progressByLane[idx] ?? 0 : 1;
      return {
        laneIndex: idx,
        point: getPointAtProgress(path, progress),
      };
    })
    .filter((v): v is { laneIndex: number; point: Point } => v !== null);

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">사다리게임</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            기본 4명으로 시작하고, 인원은 2명 이상으로 설정할 수 있습니다.
          </p>
        </div>

        <div className="flex items-end gap-2">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
              사다리 수
            </label>
            <input
              type="number"
              min={2}
              max={12}
              value={laneCount}
              onChange={(e) => handleLaneCountChange(Number(e.target.value))}
              className="w-24 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 px-3 py-2 text-sm font-bold text-slate-800 dark:text-slate-200"
            />
          </div>

          <button
            onClick={handleReset}
            className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            초기화
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">상단 이름 입력</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {Array.from({ length: laneCount }, (_, i) => (
                <input
                  key={`name-${i}`}
                  type="text"
                  value={names[i] ?? ''}
                  onChange={(e) => updateName(i, e.target.value)}
                  onFocus={() => handleNameFocus(i)}
                  onBlur={() => handleNameBlur(i)}
                  placeholder={`참가자 ${i + 1}`}
                  className="rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-3 py-2 text-sm font-medium text-slate-800 dark:text-slate-200"
                />
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">하단 결과값 입력</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {Array.from({ length: laneCount }, (_, i) => (
                <input
                  key={`result-${i}`}
                  type="text"
                  value={results[i] ?? ''}
                  onChange={(e) => updateResult(i, e.target.value)}
                  onFocus={() => handleResultFocus(i)}
                  onBlur={() => handleResultBlur(i)}
                  placeholder={`결과 ${i + 1}`}
                  className="rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-3 py-2 text-sm font-medium text-slate-800 dark:text-slate-200"
                />
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              onClick={handleRun}
              disabled={isAnimating}
              className="flex-1 min-w-[190px] bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-3 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4" />
              {runData ? '사다리 다시 생성' : '사다리 생성'}
            </button>

            <button
              onClick={handleSaveResult}
              className="px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-1.5"
            >
              <BookmarkPlus className="w-4 h-4" />
              {saved ? '저장완료' : '결과 저장'}
            </button>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">참가자 선택</h4>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                {activeStartLane !== null
                  ? `${names[activeStartLane]} 진행 중...`
                  : runData
                  ? '원하는 참가자를 눌러 내려보세요'
                  : '먼저 사다리를 생성해 주세요'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Array.from({ length: laneCount }, (_, lane) => {
                const done = revealedStartLanes[lane] ?? false;
                const isActive = activeStartLane === lane;
                return (
                  <button
                    key={`select-lane-${lane}`}
                    disabled={!runData || isAnimating || done}
                    onClick={() => startSingleLaneAnimation(lane)}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                      isActive
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : done
                        ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 disabled:opacity-60'
                    }`}
                  >
                    {names[lane]} {done ? '완료' : ''}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40 p-4 overflow-x-hidden">
          <div className="w-full">
            <svg
              viewBox={`0 0 ${LADDER_WIDTH} ${LADDER_HEIGHT}`}
              className="w-full h-[400px] rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
            >
              {Array.from({ length: laneCount }, (_, lane) => {
                const x = laneToX(lane, laneCount, horizontalPadding);
                return (
                  <line
                    key={`vertical-${lane}`}
                    x1={x}
                    y1={rowToY(0, activeRowCount)}
                    x2={x}
                    y2={rowToY(activeRowCount, activeRowCount)}
                    stroke="#94a3b8"
                    strokeWidth={2.4}
                  />
                );
              })}

              {activeRows.map((row, rowIdx) =>
                row.map((hasBridge, laneIdx) => {
                  if (!hasBridge) {
                    return null;
                  }

                  const y = rowToY(rowIdx + 0.5, activeRowCount);
                  const x1 = laneToX(laneIdx, laneCount, horizontalPadding);
                  const x2 = laneToX(laneIdx + 1, laneCount, horizontalPadding);

                  return (
                    <line
                      key={`bridge-${rowIdx}-${laneIdx}`}
                      x1={x1}
                      y1={y}
                      x2={x2}
                      y2={y}
                      stroke="#3b82f6"
                      strokeWidth={4}
                      strokeLinecap="round"
                    />
                  );
                })
              )}

              {(runData?.paths ?? []).map((path, idx) => {
                const points = path.map((p) => `${p.x},${p.y}`).join(' ');
                return (
                  <polyline
                    key={`path-${idx}`}
                    points={points}
                    fill="none"
                    stroke="rgba(59,130,246,0.2)"
                    strokeWidth={7}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                );
              })}

              {(runData?.paths ?? []).map((path, idx) => {
                const isRevealed = revealedStartLanes[idx] ?? false;
                const isActive = activeStartLane === idx;
                const progress = isActive ? progressByLane[idx] ?? 0 : isRevealed ? 1 : 0;

                if (progress <= 0) {
                  return null;
                }

                const partialPath = getPartialPolyline(path, progress);
                const points = partialPath.map((p) => `${p.x},${p.y}`).join(' ');

                return (
                  <polyline
                    key={`traced-${idx}`}
                    points={points}
                    fill="none"
                    stroke={isRevealed ? '#22c55e' : '#f97316'}
                    strokeWidth={8}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                );
              })}

              {tokenPositions.map((token) => (
                <g key={`token-${token.laneIndex}`}>
                  <circle cx={token.point.x} cy={token.point.y} r={11} fill="#0f172a" />
                  <text
                    x={token.point.x}
                    y={token.point.y + 4}
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight="700"
                    fill="#ffffff"
                  >
                    {token.laneIndex + 1}
                  </text>
                </g>
              ))}
            </svg>

            <div className="relative mt-3 h-5 overflow-hidden">
              {Array.from({ length: laneCount }, (_, i) => (
                <div
                  key={`name-tag-${i}`}
                  className="absolute -translate-x-1/2 text-center text-xs font-bold text-slate-700 dark:text-slate-300 truncate"
                  style={{ left: `${laneLeftPercents[i]}%`, width: `${Math.max(36, Math.floor(500 / laneCount))}px` }}
                >
                  {bottomParticipantNames[i]}
                </div>
              ))}
            </div>

            <div className="relative mt-2 h-8 overflow-hidden">
              {Array.from({ length: laneCount }, (_, i) => (
                <div
                  key={`result-tag-${i}`}
                  className="absolute -translate-x-1/2 text-center text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-md px-1.5 py-0.5 truncate"
                  style={{ left: `${laneLeftPercents[i]}%`, width: `${Math.max(36, Math.floor(460 / laneCount))}px` }}
                >
                  {results[i]}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {runData && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 p-4">
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-2">추첨 결과</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {runData.finalLaneByStart.map((finalLane, startLane) => (
              <div
                key={`match-${startLane}`}
                className="text-xs font-medium text-slate-700 dark:text-slate-300 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-2"
              >
                {revealedStartLanes[startLane]
                  ? `${names[startLane]} → ${results[finalLane]}`
                  : `${names[startLane]} → 미공개`}
              </div>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
            {allRevealed ? '모든 참가자의 결과가 공개되었습니다.' : '선택한 참가자만 순차적으로 결과가 공개됩니다.'}
          </p>
        </div>
      )}
    </div>
  );
};
