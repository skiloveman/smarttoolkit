import React, { useMemo, useState } from 'react';
import { BookmarkPlus, RefreshCw } from 'lucide-react';
import { SaveHistoryFn } from '../../types';
import { usePendingHistoryRestore } from '../../utils/historyRestore';

interface Props {
  onSaveHistory: (title: string, summary: string, details: Record<string, string | number>) => void;
}

const COLS = 6;
const ROWS = 9;
const EMPTY = -1;
const MAX_LEVEL = 10;

type Board = number[][];
type Cell = { row: number; col: number };

type FruitInfo = {
  name: string;
  emoji: string;
  points: number;
};

const FRUITS: FruitInfo[] = [
  { name: '체리', emoji: '🍒', points: 8 },
  { name: '딸기', emoji: '🍓', points: 12 },
  { name: '포도', emoji: '🍇', points: 18 },
  { name: '귤', emoji: '🍊', points: 26 },
  { name: '사과', emoji: '🍎', points: 38 },
  { name: '배', emoji: '🍐', points: 52 },
  { name: '복숭아', emoji: '🍑', points: 70 },
  { name: '멜론', emoji: '🍈', points: 92 },
  { name: '파인애플', emoji: '🍍', points: 120 },
  { name: '코코넛', emoji: '🥥', points: 156 },
  { name: '수박', emoji: '🍉', points: 220 },
];

const makeEmptyBoard = (): Board =>
  Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => EMPTY));

const inRange = (row: number, col: number) => row >= 0 && row < ROWS && col >= 0 && col < COLS;

const randomSpawnLevel = () => {
  const roll = Math.random();
  if (roll < 0.55) return 0;
  if (roll < 0.82) return 1;
  if (roll < 0.95) return 2;
  return 3;
};

const cloneBoard = (board: Board): Board => board.map((row) => [...row]);

const serializeBoard = (board: Board) => JSON.stringify(board);

const normalizeBoard = (raw: unknown): Board => {
  if (!Array.isArray(raw) || raw.length !== ROWS) {
    return makeEmptyBoard();
  }

  return raw.map((row) => {
    if (!Array.isArray(row) || row.length !== COLS) {
      return Array.from({ length: COLS }, () => EMPTY);
    }

    return row.map((cell) => {
      if (typeof cell !== 'number' || !Number.isInteger(cell)) return EMPTY;
      if (cell < EMPTY || cell > MAX_LEVEL) return EMPTY;
      return cell;
    });
  });
};

const applyGravity = (board: Board): Board => {
  const next = makeEmptyBoard();

  for (let col = 0; col < COLS; col += 1) {
    const stack: number[] = [];
    for (let row = ROWS - 1; row >= 0; row -= 1) {
      const value = board[row][col];
      if (value !== EMPTY) {
        stack.push(value);
      }
    }

    for (let i = 0; i < stack.length; i += 1) {
      next[ROWS - 1 - i][col] = stack[i];
    }
  }

  return next;
};

const findFirstMergeCluster = (board: Board): Cell[] | null => {
  const visited = Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => false));
  const dirs = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ];

  for (let row = ROWS - 1; row >= 0; row -= 1) {
    for (let col = 0; col < COLS; col += 1) {
      const level = board[row][col];
      if (level === EMPTY || level === MAX_LEVEL || visited[row][col]) {
        continue;
      }

      const queue: Cell[] = [{ row, col }];
      const cluster: Cell[] = [];
      visited[row][col] = true;

      while (queue.length > 0) {
        const current = queue.shift() as Cell;
        cluster.push(current);

        for (const [dr, dc] of dirs) {
          const nr = current.row + dr;
          const nc = current.col + dc;
          if (!inRange(nr, nc) || visited[nr][nc] || board[nr][nc] !== level) {
            continue;
          }
          visited[nr][nc] = true;
          queue.push({ row: nr, col: nc });
        }
      }

      if (cluster.length >= 2) {
        return cluster;
      }
    }
  }

  return null;
};

const resolveMerges = (inputBoard: Board) => {
  let board = cloneBoard(inputBoard);
  let gainedScore = 0;
  let merged = false;

  while (true) {
    const cluster = findFirstMergeCluster(board);
    if (!cluster) {
      break;
    }

    const level = board[cluster[0].row][cluster[0].col];
    const promotedLevel = Math.min(level + 1, MAX_LEVEL);

    // Prefer the lowest and then leftmost cell as the merge anchor.
    const anchor = cluster.reduce((best, curr) => {
      if (curr.row > best.row) return curr;
      if (curr.row === best.row && curr.col < best.col) return curr;
      return best;
    }, cluster[0]);

    for (const cell of cluster) {
      board[cell.row][cell.col] = EMPTY;
    }
    board[anchor.row][anchor.col] = promotedLevel;

    const points = FRUITS[level].points * cluster.length + FRUITS[promotedLevel].points;
    gainedScore += points;
    merged = true;

    board = applyGravity(board);
  }

  return { board, gainedScore, merged };
};

const getTopOccupiedCount = (board: Board) => board[0].filter((cell) => cell !== EMPTY).length;

const boardHasWatermelon = (board: Board) =>
  board.some((row) => row.some((cell) => cell === MAX_LEVEL));

export const WatermelonGameCalculator: React.FC<Props> = ({ onSaveHistory }) => {
  const saveHistory = onSaveHistory as SaveHistoryFn;
  const [board, setBoard] = useState<Board>(makeEmptyBoard);
  const [nextLevel, setNextLevel] = useState<number>(randomSpawnLevel);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [moveCount, setMoveCount] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [message, setMessage] = useState('같은 과일을 붙이면 더 큰 과일로 합쳐집니다.');
  const [saved, setSaved] = useState(false);

  usePendingHistoryRestore<{
    board: number[][];
    nextLevel: number;
    score: number;
    bestScore: number;
    moveCount: number;
    gameOver: boolean;
  }>('watermelonGame', (restored) => {
    const restoredBoard = normalizeBoard(restored.board);
    setBoard(restoredBoard);
    setNextLevel(
      Number.isInteger(restored.nextLevel) && restored.nextLevel >= 0 && restored.nextLevel <= 3
        ? restored.nextLevel
        : randomSpawnLevel()
    );
    setScore(Number.isFinite(restored.score) ? Math.max(0, restored.score) : 0);
    setBestScore(Number.isFinite(restored.bestScore) ? Math.max(0, restored.bestScore) : 0);
    setMoveCount(Number.isFinite(restored.moveCount) ? Math.max(0, restored.moveCount) : 0);
    setGameOver(Boolean(restored.gameOver));
    setMessage('저장된 수박게임 상태를 불러왔습니다.');
  });

  const isBoardEmpty = useMemo(
    () => board.every((row) => row.every((cell) => cell === EMPTY)),
    [board]
  );

  const nextFruit = FRUITS[nextLevel];

  const resetGame = () => {
    setBoard(makeEmptyBoard());
    setNextLevel(randomSpawnLevel());
    setScore(0);
    setMoveCount(0);
    setGameOver(false);
    setMessage('새 게임을 시작합니다.');
  };

  const dropAtColumn = (col: number) => {
    if (gameOver) {
      return;
    }

    let targetRow = -1;
    for (let row = ROWS - 1; row >= 0; row -= 1) {
      if (board[row][col] === EMPTY) {
        targetRow = row;
        break;
      }
    }

    if (targetRow === -1) {
      setMessage('해당 열이 가득 찼습니다. 다른 열을 선택하세요.');
      return;
    }

    const placedBoard = cloneBoard(board);
    placedBoard[targetRow][col] = nextLevel;

    const { board: resolvedBoard, gainedScore, merged } = resolveMerges(placedBoard);
    const totalScore = score + FRUITS[nextLevel].points + gainedScore;
    const over = getTopOccupiedCount(resolvedBoard) === COLS;
    const hasWatermelon = boardHasWatermelon(resolvedBoard);

    setBoard(resolvedBoard);
    setScore(totalScore);
    setBestScore((prev) => Math.max(prev, totalScore));
    setMoveCount((prev) => prev + 1);
    setNextLevel(randomSpawnLevel());

    if (over) {
      setGameOver(true);
      setMessage('게임 오버! 보드가 가득 찼습니다.');
      return;
    }

    if (hasWatermelon) {
      setMessage('수박 완성! 계속해서 더 높은 점수에 도전하세요.');
      return;
    }

    if (merged) {
      setMessage('합치기 성공! 연쇄를 노려보세요.');
    } else {
      setMessage('좋아요! 같은 과일을 모아 붙여보세요.');
    }
  };

  const handleSave = () => {
    saveHistory(
      '수박게임',
      `점수 ${score.toLocaleString()}점 · ${moveCount}수 진행`,
      {
        점수: score.toLocaleString(),
        최고점수: Math.max(bestScore, score).toLocaleString(),
        진행수: moveCount,
        상태: gameOver ? '게임오버' : '진행중',
      },
      {
        board,
        nextLevel,
        score,
        bestScore: Math.max(bestScore, score),
        moveCount,
        gameOver,
      }
    );
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">수박게임</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            열을 선택해 과일을 떨어뜨리고, 같은 과일을 합쳐 수박까지 만드세요.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={resetGame}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            새 게임
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors"
          >
            <BookmarkPlus className="w-3.5 h-3.5" />
            {saved ? '저장됨' : '기록 저장'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 bg-slate-50/60 dark:bg-slate-800/40 space-y-2">
          <p className="text-xs text-slate-500 dark:text-slate-400">다음 과일</p>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-2xl">
              {nextFruit.emoji}
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{nextFruit.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">기본 점수 +{nextFruit.points}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 bg-slate-50/60 dark:bg-slate-800/40 grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">현재 점수</p>
            <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">{score.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">최고 점수</p>
            <p className="text-lg font-black text-indigo-600 dark:text-indigo-400">{Math.max(bestScore, score).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">진행 수</p>
            <p className="text-lg font-black text-amber-600 dark:text-amber-400">{moveCount}</p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="mx-auto w-full max-w-[16rem] [@media(orientation:landscape)_and_(max-width:767px)]:max-w-[18.5rem] sm:max-w-[22rem] grid grid-cols-6 gap-0.5 sm:gap-1">
          {Array.from({ length: COLS }, (_, col) => (
            <button
              key={col}
              type="button"
              onClick={() => dropAtColumn(col)}
              disabled={gameOver}
              className="rounded-md border border-blue-200 dark:border-blue-900/60 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 py-0.5 [@media(orientation:landscape)_and_(max-width:767px)]:py-1.5 text-[10px] [@media(orientation:landscape)_and_(max-width:767px)]:text-[11px] sm:text-xs font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {col + 1}열
            </button>
          ))}
        </div>

        <div className="mx-auto w-full max-w-[16rem] [@media(orientation:landscape)_and_(max-width:767px)]:max-w-[18.5rem] sm:max-w-[22rem] rounded-xl border border-slate-200 dark:border-slate-700 p-1 sm:p-2 bg-white dark:bg-slate-900">
          <div className="grid grid-cols-6 gap-0.5 sm:gap-1">
            {board.map((row, rowIndex) =>
              row.map((cell, colIndex) => (
                <button
                  key={`${rowIndex}-${colIndex}`}
                  type="button"
                  onClick={() => dropAtColumn(colIndex)}
                  disabled={gameOver}
                  className="aspect-square rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:cursor-not-allowed"
                  title={cell === EMPTY ? '비어 있음' : FRUITS[cell].name}
                >
                  <span className="text-[15px] [@media(orientation:landscape)_and_(max-width:767px)]:text-lg sm:text-xl leading-none">{cell === EMPTY ? '' : FRUITS[cell].emoji}</span>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-amber-200 dark:border-amber-900/50 bg-amber-50/80 dark:bg-amber-950/40 px-4 py-3">
        <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">{message}</p>
        <p className="mt-1 text-xs text-amber-700 dark:text-amber-200">
          {isBoardEmpty
            ? '시작하려면 위의 열 버튼을 눌러 과일을 떨어뜨리세요.'
            : gameOver
              ? '새 게임 버튼으로 다시 시작할 수 있습니다.'
              : '같은 과일이 상하좌우로 붙으면 자동으로 합쳐집니다.'}
        </p>
      </div>

      <div className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
        점수 규칙: 과일 배치 기본점수 + 합치기 시 클러스터 크기 보너스가 누적됩니다.
        수박(🍉)을 만들면 게임은 계속되며, 더 높은 점수를 노릴 수 있습니다.
      </div>
    </div>
  );
};
