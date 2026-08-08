import React, { useEffect, useMemo, useState } from 'react';
import { BookmarkPlus, RefreshCw, Undo2 } from 'lucide-react';
import { SaveHistoryFn } from '../../types';
import { usePendingHistoryRestore } from '../../utils/historyRestore';

interface Props {
  onSaveHistory: (title: string, summary: string, details: Record<string, string | number>) => void;
}

type Player = 0 | 1 | 2;
type GameWinner = 0 | 1 | 2 | 3;

interface Move {
  row: number;
  col: number;
  player: 1 | 2;
}

interface Coord {
  row: number;
  col: number;
}

type ForbiddenType = 'none' | 'doubleThree' | 'doubleFour' | 'overline';

interface DirectionInfo {
  length: number;
  openEnds: number;
}

const encodeMove = (move: Move) => `${move.row},${move.col},${move.player}`;
const decodeMove = (raw: string): Move | null => {
  const [rowStr, colStr, playerStr] = raw.split(',');
  const row = Number(rowStr);
  const col = Number(colStr);
  const player = Number(playerStr);

  if (!Number.isInteger(row) || !Number.isInteger(col) || (player !== 1 && player !== 2)) {
    return null;
  }

  return { row, col, player: player as 1 | 2 };
};

const encodeCoord = (coord: Coord) => `${coord.row},${coord.col}`;
const decodeCoord = (raw: string): Coord | null => {
  const [rowStr, colStr] = raw.split(',');
  const row = Number(rowStr);
  const col = Number(colStr);

  if (!Number.isInteger(row) || !Number.isInteger(col)) {
    return null;
  }

  return { row, col };
};

const BOARD_SIZE = 15;
const EMPTY_BOARD = () => Array.from({ length: BOARD_SIZE }, () => Array.from({ length: BOARD_SIZE }, () => 0 as Player));
const DIRECTIONS: Array<[number, number]> = [
  [1, 0],
  [0, 1],
  [1, 1],
  [1, -1],
];
const COL_LABELS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.slice(0, BOARD_SIZE).split('');
const CENTER = Math.floor(BOARD_SIZE / 2);

const inRange = (value: number) => value >= 0 && value < BOARD_SIZE;

const normalizeBoard = (raw: unknown): Player[][] => {
  if (!Array.isArray(raw) || raw.length !== BOARD_SIZE) {
    return EMPTY_BOARD();
  }

  return raw.map((row) => {
    if (!Array.isArray(row) || row.length !== BOARD_SIZE) {
      return Array.from({ length: BOARD_SIZE }, () => 0 as Player);
    }

    return row.map((cell) => {
      if (cell === 1 || cell === 2) {
        return cell;
      }
      return 0;
    });
  });
};

const coordLabel = (row: number, col: number) => `${COL_LABELS[col]}${row + 1}`;

const analyzeDirection = (board: Player[][], row: number, col: number, player: 1 | 2, dr: number, dc: number): DirectionInfo => {
  let length = 1;
  let minR = row;
  let minC = col;
  let maxR = row;
  let maxC = col;

  let nr = row - dr;
  let nc = col - dc;
  while (inRange(nr) && inRange(nc) && board[nr][nc] === player) {
    length += 1;
    minR = nr;
    minC = nc;
    nr -= dr;
    nc -= dc;
  }

  nr = row + dr;
  nc = col + dc;
  while (inRange(nr) && inRange(nc) && board[nr][nc] === player) {
    length += 1;
    maxR = nr;
    maxC = nc;
    nr += dr;
    nc += dc;
  }

  const prevR = minR - dr;
  const prevC = minC - dc;
  const nextR = maxR + dr;
  const nextC = maxC + dc;

  const openBefore = inRange(prevR) && inRange(prevC) && board[prevR][prevC] === 0;
  const openAfter = inRange(nextR) && inRange(nextC) && board[nextR][nextC] === 0;

  return {
    length,
    openEnds: Number(openBefore) + Number(openAfter),
  };
};

const getForbiddenType = (board: Player[][], row: number, col: number, player: 1 | 2): ForbiddenType => {
  if (player !== 1) {
    return 'none';
  }

  const lines = DIRECTIONS.map(([dr, dc]) => analyzeDirection(board, row, col, player, dr, dc));
  const hasOverline = lines.some((line) => line.length >= 6);
  if (hasOverline) {
    return 'overline';
  }

  const openThreeCount = lines.filter((line) => line.length === 3 && line.openEnds === 2).length;
  if (openThreeCount >= 2) {
    return 'doubleThree';
  }

  const fourCount = lines.filter((line) => line.length === 4 && line.openEnds >= 1).length;
  if (fourCount >= 2) {
    return 'doubleFour';
  }

  return 'none';
};

const wouldWinByMove = (board: Player[][], row: number, col: number, player: 1 | 2) => {
  const nextBoard = board.map((r) => [...r]);
  nextBoard[row][col] = player;
  return findWinningLine(nextBoard, row, col, player) !== null;
};

const scoreMove = (board: Player[][], row: number, col: number, player: 1 | 2) => {
  if (board[row][col] !== 0) {
    return -1;
  }

  const nextBoard = board.map((r) => [...r]);
  nextBoard[row][col] = player;

  if (findWinningLine(nextBoard, row, col, player)) {
    return 1_000_000;
  }

  let score = 0;
  for (const [dr, dc] of DIRECTIONS) {
    const { length, openEnds } = analyzeDirection(nextBoard, row, col, player, dr, dc);

    if (length >= 5) {
      score += 500_000;
    } else if (length === 4 && openEnds === 2) {
      score += 70_000;
    } else if (length === 4 && openEnds === 1) {
      score += 25_000;
    } else if (length === 3 && openEnds === 2) {
      score += 8_000;
    } else if (length === 3 && openEnds === 1) {
      score += 2_000;
    } else if (length === 2 && openEnds === 2) {
      score += 700;
    } else if (length === 2 && openEnds === 1) {
      score += 180;
    }
  }

  const centerBias = BOARD_SIZE - (Math.abs(row - CENTER) + Math.abs(col - CENTER));
  return score + centerBias * 3;
};

const chooseAiMove = (board: Player[][]): Coord | null => {
  const empties: Coord[] = [];
  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      if (board[row][col] === 0) {
        empties.push({ row, col });
      }
    }
  }

  if (empties.length === 0) {
    return null;
  }

  if (board[CENTER][CENTER] === 0) {
    return { row: CENTER, col: CENTER };
  }

  for (const cell of empties) {
    if (wouldWinByMove(board, cell.row, cell.col, 2)) {
      return cell;
    }
  }

  const blockMoves = empties.filter((cell) => wouldWinByMove(board, cell.row, cell.col, 1));
  if (blockMoves.length > 0) {
    return blockMoves.sort((a, b) => scoreMove(board, b.row, b.col, 2) - scoreMove(board, a.row, a.col, 2))[0];
  }

  let bestCell = empties[0];
  let bestScore = -Infinity;

  for (const cell of empties) {
    const attack = scoreMove(board, cell.row, cell.col, 2);
    const defend = scoreMove(board, cell.row, cell.col, 1);
    const total = attack * 1.15 + defend * 0.9;
    if (total > bestScore) {
      bestScore = total;
      bestCell = cell;
    }
  }

  return bestCell;
};

const findWinningLine = (board: Player[][], row: number, col: number, player: 1 | 2): Coord[] | null => {
  for (const [dr, dc] of DIRECTIONS) {
    const line: Coord[] = [{ row, col }];

    let nr = row - dr;
    let nc = col - dc;
    while (inRange(nr) && inRange(nc) && board[nr][nc] === player) {
      line.unshift({ row: nr, col: nc });
      nr -= dr;
      nc -= dc;
    }

    nr = row + dr;
    nc = col + dc;
    while (inRange(nr) && inRange(nc) && board[nr][nc] === player) {
      line.push({ row: nr, col: nc });
      nr += dr;
      nc += dc;
    }

    if (line.length >= 5) {
      return line.slice(0, 5);
    }
  }

  return null;
};

const playerLabel = (player: Player) => {
  if (player === 1) return '흑';
  if (player === 2) return '백';
  return '-';
};

export const GomokuCalculator: React.FC<Props> = ({ onSaveHistory }) => {
  const saveHistory = onSaveHistory as SaveHistoryFn;
  const [board, setBoard] = useState<Player[][]>(EMPTY_BOARD);
  const [currentPlayer, setCurrentPlayer] = useState<1 | 2>(1);
  const [winner, setWinner] = useState<GameWinner>(0);
  const [moveCount, setMoveCount] = useState(0);
  const [moves, setMoves] = useState<Move[]>([]);
  const [winningLine, setWinningLine] = useState<Coord[]>([]);
  const [lastMove, setLastMove] = useState<Coord | null>(null);
  const [forbiddenRules, setForbiddenRules] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(false);
  const [message, setMessage] = useState<string>('');
  const [saved, setSaved] = useState(false);

  usePendingHistoryRestore<{
    board: number[][];
    currentPlayer: number;
    winner: number;
    moveCount: number;
    moveStrings: string[];
    winningLineStrings: string[];
    lastMoveString?: string;
    forbiddenRules?: boolean;
    aiEnabled?: boolean;
  }>('gomoku', (restored) => {
    const normalized = normalizeBoard(restored.board);
    setBoard(normalized);
    setCurrentPlayer(restored.currentPlayer === 2 ? 2 : 1);
    setWinner(restored.winner === 1 || restored.winner === 2 || restored.winner === 3 ? restored.winner : 0);
    setMoveCount(Number.isFinite(restored.moveCount) ? Math.max(0, Math.min(BOARD_SIZE * BOARD_SIZE, restored.moveCount)) : 0);
    setForbiddenRules(Boolean(restored.forbiddenRules));
    setAiEnabled(Boolean(restored.aiEnabled));
    setMoves(
      Array.isArray(restored.moveStrings)
        ? restored.moveStrings
            .map(decodeMove)
            .filter((move): move is Move => move !== null && inRange(move.row) && inRange(move.col))
        : []
    );
    const restoredLastMove = typeof restored.lastMoveString === 'string' ? decodeCoord(restored.lastMoveString) : null;
    setLastMove(restoredLastMove && inRange(restoredLastMove.row) && inRange(restoredLastMove.col) ? restoredLastMove : null);
    setWinningLine(
      Array.isArray(restored.winningLineStrings)
        ? restored.winningLineStrings
            .map(decodeCoord)
            .filter((cell): cell is Coord => cell !== null && inRange(cell.row) && inRange(cell.col))
            .slice(0, 5)
        : []
    );
    setMessage('저장된 대국을 복원했습니다.');
  });

  const winningCellSet = useMemo(
    () => new Set(winningLine.map((cell) => `${cell.row}-${cell.col}`)),
    [winningLine]
  );

  const lastMoveKey = lastMove ? `${lastMove.row}-${lastMove.col}` : null;

  useEffect(() => {
    if (!aiEnabled || winner !== 0 || currentPlayer !== 2) {
      return;
    }

    const aiMove = chooseAiMove(board);
    if (!aiMove) {
      return;
    }

    const timer = window.setTimeout(() => {
      placeStone(aiMove.row, aiMove.col, { byAi: true });
    }, 220);

    return () => window.clearTimeout(timer);
  }, [aiEnabled, winner, currentPlayer, board]);

  const placeStone = (row: number, col: number, options?: { byAi?: boolean }) => {
    if (winner !== 0 || board[row][col] !== 0) {
      return;
    }

    const nextBoard = board.map((r) => [...r]);
    nextBoard[row][col] = currentPlayer;

    if (forbiddenRules && currentPlayer === 1) {
      const forbiddenType = getForbiddenType(nextBoard, row, col, currentPlayer);
      if (forbiddenType !== 'none') {
        if (forbiddenType === 'doubleThree') {
          setMessage('금수(33) 위치에는 착수할 수 없습니다.');
        } else if (forbiddenType === 'doubleFour') {
          setMessage('금수(44) 위치에는 착수할 수 없습니다.');
        } else {
          setMessage('금수(장목) 위치에는 착수할 수 없습니다.');
        }
        return;
      }
    }

    const nextMove: Move = { row, col, player: currentPlayer };
    const nextMoveCount = moveCount + 1;

    const line = findWinningLine(nextBoard, row, col, currentPlayer);

    setBoard(nextBoard);
    setMoves((prev) => [...prev, nextMove]);
    setMoveCount(nextMoveCount);
    setLastMove({ row, col });
    setMessage(
      options?.byAi
        ? `AI가 ${coordLabel(row, col)}에 착수했습니다.`
        : `${playerLabel(currentPlayer)}이(가) ${coordLabel(row, col)}에 착수했습니다.`
    );

    if (line) {
      setWinner(currentPlayer);
      setWinningLine(line);
      setMessage(`${playerLabel(currentPlayer)} 승리 (${coordLabel(row, col)})`);
      return;
    }

    if (nextMoveCount >= BOARD_SIZE * BOARD_SIZE) {
      setWinner(3);
      setWinningLine([]);
      setMessage('무승부입니다.');
      return;
    }

    setCurrentPlayer(currentPlayer === 1 ? 2 : 1);
  };

  const handleUndo = () => {
    if (moves.length === 0) {
      return;
    }

    const last = moves[moves.length - 1];
    const nextBoard = board.map((r) => [...r]);
    nextBoard[last.row][last.col] = 0;

    setBoard(nextBoard);
    setMoves((prev) => prev.slice(0, -1));
    setMoveCount((prev) => Math.max(0, prev - 1));
    setCurrentPlayer(last.player);
    setWinner(0);
    setWinningLine([]);
    const prevMove = moves.length >= 2 ? moves[moves.length - 2] : null;
    setLastMove(prevMove ? { row: prevMove.row, col: prevMove.col } : null);
    setMessage('한 수를 되돌렸습니다.');
  };

  const handleReset = () => {
    setBoard(EMPTY_BOARD());
    setCurrentPlayer(1);
    setWinner(0);
    setMoveCount(0);
    setMoves([]);
    setWinningLine([]);
    setLastMove(null);
    setMessage('새 판을 시작했습니다.');
    setSaved(false);
  };

  const handleSave = () => {
    if (moveCount === 0) {
      alert('먼저 돌을 두고 게임을 진행해 주세요.');
      return;
    }

    const statusText = winner === 3 ? '무승부' : winner === 0 ? `${playerLabel(currentPlayer)} 차례 진행 중` : `${playerLabel(winner)} 승리`;

    saveHistory('오목', `오목 대국 ${moveCount}수 저장`, {
      상태: statusText,
      총착수: moveCount,
      보드크기: `${BOARD_SIZE}x${BOARD_SIZE}`,
      대국모드: aiEnabled ? 'AI 대전' : '2인 대전',
      금수규칙: forbiddenRules ? '사용' : '미사용',
    }, {
      board,
      currentPlayer,
      winner,
      moveCount,
      moveStrings: moves.map(encodeMove),
      winningLineStrings: winningLine.map(encodeCoord),
      lastMoveString: lastMove ? encodeCoord(lastMove) : '',
      forbiddenRules,
      aiEnabled,
    });

    setSaved(true);
    window.setTimeout(() => setSaved(false), 1500);
    setMessage('현재 대국을 저장했습니다.');
  };

  const statusLabel =
    winner === 1 || winner === 2
      ? `${playerLabel(winner)} 승리`
      : winner === 3
      ? '무승부'
      : `${playerLabel(currentPlayer)} 차례`;

  const recentMoves = moves.slice(-6).reverse();

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">오목 대국</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            15x15 보드에서 흑과 백이 번갈아 돌을 두고 먼저 5개를 연결하면 승리합니다.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            {statusLabel}
          </span>
          <span className="px-2.5 py-1 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400">
            {moveCount}수
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <label className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center justify-between gap-3">
          <span>AI 대전 (백 자동)</span>
          <input
            type="checkbox"
            checked={aiEnabled}
            onChange={(e) => {
              setAiEnabled(e.target.checked);
              setMessage(e.target.checked ? 'AI 대전 모드를 켰습니다.' : '2인 대전 모드로 전환했습니다.');
            }}
            className="accent-blue-600"
          />
        </label>

        <label className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center justify-between gap-3">
          <span>흑 금수 규칙 (33/44/장목)</span>
          <input
            type="checkbox"
            checked={forbiddenRules}
            onChange={(e) => {
              setForbiddenRules(e.target.checked);
              setMessage(e.target.checked ? '금수 규칙을 적용합니다.' : '금수 규칙을 해제했습니다.');
            }}
            className="accent-amber-500"
          />
        </label>

        <div className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-600 dark:text-slate-400">
          최근 착수: <span className="font-semibold text-slate-800 dark:text-slate-200">{lastMove ? coordLabel(lastMove.row, lastMove.col) : '-'}</span>
        </div>
      </div>

      <div className="rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 px-3 py-2 text-xs text-slate-600 dark:text-slate-300">
        {message || '좌표를 클릭해 착수하세요.'}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleUndo}
          disabled={moves.length === 0}
          className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
        >
          <Undo2 className="w-3.5 h-3.5" />
          한 수 무르기
        </button>

        <button
          onClick={handleReset}
          className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          새 판 시작
        </button>

        <button
          onClick={handleSave}
          className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-1.5"
        >
          <BookmarkPlus className="w-3.5 h-3.5" />
          {saved ? '저장완료' : '대국 저장'}
        </button>
      </div>

      <div className="rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50/70 dark:bg-amber-900/10 p-3">
        <div className="w-full overflow-auto">
          <div className="mx-auto min-w-[340px] max-w-[760px] p-2">
            <div className="mb-1 flex pl-[24px]">
              {COL_LABELS.map((label) => (
                <div
                  key={label}
                  className="flex-1 text-center text-[10px] font-semibold text-amber-800 dark:text-amber-300"
                >
                  {label}
                </div>
              ))}
            </div>

            <div className="flex">
              <div className="flex flex-col w-[24px]">
                {Array.from({ length: BOARD_SIZE }, (_, rowIndex) => (
                  <div
                    key={`row-label-${rowIndex}`}
                    className="flex-1 flex items-center justify-center text-[10px] font-semibold text-amber-800 dark:text-amber-300"
                  >
                    {rowIndex + 1}
                  </div>
                ))}
              </div>

              <div className="relative flex-1 aspect-square rounded-md bg-amber-100 dark:bg-amber-900/30">
                {Array.from({ length: BOARD_SIZE }, (_, i) => {
                  const pct = (i / (BOARD_SIZE - 1)) * 100;
                  return (
                    <React.Fragment key={`grid-line-${i}`}>
                      <div
                        className="absolute bg-amber-800/45 dark:bg-amber-700/60"
                        style={{ left: `${pct}%`, top: 0, bottom: 0, width: 1 }}
                      />
                      <div
                        className="absolute bg-amber-800/45 dark:bg-amber-700/60"
                        style={{ top: `${pct}%`, left: 0, right: 0, height: 1 }}
                      />
                    </React.Fragment>
                  );
                })}

                {board.map((row, rowIndex) =>
                  row.map((cell, colIndex) => {
                    const key = `${rowIndex}-${colIndex}`;
                    const isWinningCell = winningCellSet.has(key);
                    const isLastMove = lastMoveKey === key;
                    const leftPct = (colIndex / (BOARD_SIZE - 1)) * 100;
                    const topPct = (rowIndex / (BOARD_SIZE - 1)) * 100;

                    return (
                      <button
                        key={key}
                        onClick={() => placeStone(rowIndex, colIndex)}
                        disabled={winner !== 0 || cell !== 0 || (aiEnabled && currentPlayer === 2)}
                        aria-label={`${rowIndex + 1}행 ${colIndex + 1}열`}
                        className="absolute flex items-center justify-center disabled:cursor-default group"
                        style={{
                          left: `${leftPct}%`,
                          top: `${topPct}%`,
                          width: `${100 / (BOARD_SIZE - 1)}%`,
                          height: `${100 / (BOARD_SIZE - 1)}%`,
                          transform: 'translate(-50%, -50%)',
                        }}
                      >
                        {cell !== 0 ? (
                          <span
                            className={`w-[78%] h-[78%] rounded-full border shadow-sm ${
                              cell === 1
                                ? 'bg-slate-900 border-slate-800'
                                : 'bg-slate-50 border-slate-300'
                            } ${isWinningCell ? 'ring-2 ring-emerald-500' : ''} ${isLastMove ? 'ring-2 ring-blue-500/20' : ''}`}
                          />
                        ) : (
                          <span className="w-[42%] h-[42%] rounded-full group-hover:bg-amber-300/50 dark:group-hover:bg-amber-600/25 transition-colors" />
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 p-3">
        <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">최근 착수 로그</div>
        <div className="flex flex-wrap gap-1.5">
          {recentMoves.length === 0 && (
            <span className="text-xs text-slate-500 dark:text-slate-400">아직 착수 기록이 없습니다.</span>
          )}
          {recentMoves.map((move, idx) => (
            <span
              key={`${move.row}-${move.col}-${idx}`}
              className="px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-300"
            >
              {playerLabel(move.player)} {coordLabel(move.row, move.col)}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
