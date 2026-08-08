import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BookmarkPlus, RefreshCw, Undo2, Volume2, VolumeX } from 'lucide-react';
import { SaveHistoryFn } from '../../types';
import { usePendingHistoryRestore } from '../../utils/historyRestore';
import { StoneSoundPlayer } from '../../utils/gomokuSounds';

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

const BOARD_PX = 600;
const BOARD_PADDING = 28;
const CELL_PX = (BOARD_PX - BOARD_PADDING * 2) / (BOARD_SIZE - 1);
const HOSHI_LINES = [3, 7, 11];
const HOSHI_POINTS: Coord[] = HOSHI_LINES.flatMap((row) => HOSHI_LINES.map((col) => ({ row, col })));
const STONE_ANIM_MS = 240;

const toPx = (index: number) => BOARD_PADDING + index * CELL_PX;
const nearestIndex = (px: number) => clamp(Math.round((px - BOARD_PADDING) / CELL_PX), 0, BOARD_SIZE - 1);
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

// Small overshoot pop so a newly placed stone settles like it was set down
// by hand — https://easings.net/#easeOutBack
const easeOutBack = (t: number) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

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
  const [saved, setSaved] = useState(false);
  const [hoverCell, setHoverCell] = useState<Coord | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const placedAtRef = useRef<Map<string, number>>(new Map());
  const drawRef = useRef<() => boolean | undefined>(() => undefined);
  const soundRef = useRef<StoneSoundPlayer | null>(null);
  if (!soundRef.current) {
    soundRef.current = new StoneSoundPlayer();
  }

  useEffect(() => {
    try {
      const savedPref = localStorage.getItem('gomoku_sound_enabled');
      if (savedPref !== null) {
        setSoundEnabled(savedPref === 'true');
      }
    } catch {
      // Ignore unavailable localStorage.
    }
  }, []);

  useEffect(() => {
    soundRef.current?.setEnabled(soundEnabled);
  }, [soundEnabled]);

  useEffect(() => {
    return () => {
      soundRef.current?.close();
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const toggleSound = () => {
    setSoundEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('gomoku_sound_enabled', String(next));
      } catch {
        // Ignore write failures.
      }
      return next;
    });
  };

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
      placeStone(aiMove.row, aiMove.col);
    }, 220);

    return () => window.clearTimeout(timer);
  }, [aiEnabled, winner, currentPlayer, board]);

  const placeStone = (row: number, col: number) => {
    if (winner !== 0 || board[row][col] !== 0) {
      return;
    }

    const nextBoard = board.map((r) => [...r]);
    nextBoard[row][col] = currentPlayer;

    if (forbiddenRules && currentPlayer === 1) {
      const forbiddenType = getForbiddenType(nextBoard, row, col, currentPlayer);
      if (forbiddenType !== 'none') {
        if (forbiddenType === 'doubleThree') {
          alert('금수(33) 위치에는 착수할 수 없습니다.');
        } else if (forbiddenType === 'doubleFour') {
          alert('금수(44) 위치에는 착수할 수 없습니다.');
        } else {
          alert('금수(장목) 위치에는 착수할 수 없습니다.');
        }
        return;
      }
    }

    const nextMove: Move = { row, col, player: currentPlayer };
    const nextMoveCount = moveCount + 1;

    const line = findWinningLine(nextBoard, row, col, currentPlayer);

    placedAtRef.current.set(`${row}-${col}`, performance.now());
    soundRef.current?.playPlace();
    startPlacementAnimation();

    setBoard(nextBoard);
    setMoves((prev) => [...prev, nextMove]);
    setMoveCount(nextMoveCount);
    setLastMove({ row, col });

    if (line) {
      setWinner(currentPlayer);
      setWinningLine(line);
      return;
    }

    if (nextMoveCount >= BOARD_SIZE * BOARD_SIZE) {
      setWinner(3);
      setWinningLine([]);
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
  };

  const handleReset = () => {
    setBoard(EMPTY_BOARD());
    setCurrentPlayer(1);
    setWinner(0);
    setMoveCount(0);
    setMoves([]);
    setWinningLine([]);
    setLastMove(null);
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
  };

  const statusLabel =
    winner === 1 || winner === 2
      ? `${playerLabel(winner)} 승리`
      : winner === 3
      ? '무승부'
      : `${playerLabel(currentPlayer)} 차례`;

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const now = performance.now();

    ctx.clearRect(0, 0, BOARD_PX, BOARD_PX);

    // Pale honey-toned "kaya" wood base with a soft lighting vignette,
    // like a real Go board photographed under a lamp rather than a flat tint.
    const bgGrad = ctx.createRadialGradient(
      BOARD_PX * 0.4,
      BOARD_PX * 0.35,
      BOARD_PX * 0.12,
      BOARD_PX * 0.5,
      BOARD_PX * 0.5,
      BOARD_PX * 0.78
    );
    bgGrad.addColorStop(0, '#f5d998');
    bgGrad.addColorStop(0.45, '#e8c078');
    bgGrad.addColorStop(0.78, '#d3a35c');
    bgGrad.addColorStop(1, '#b9853f');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, BOARD_PX, BOARD_PX);

    // Layered vertical wood-grain fibers (real kaya grain runs top-to-bottom).
    const grainTones = ['rgba(133, 88, 30, 0.11)', 'rgba(96, 62, 18, 0.08)', 'rgba(190, 142, 68, 0.10)'];
    for (let i = 0; i < 46; i += 1) {
      const x = (i / 46) * BOARD_PX + Math.sin(i * 7.3) * 5;
      ctx.strokeStyle = grainTones[i % grainTones.length];
      ctx.lineWidth = i % 3 === 0 ? 1.6 : 1;
      ctx.beginPath();
      ctx.moveTo(x, -4);
      ctx.bezierCurveTo(x + 10, BOARD_PX * 0.3, x - 8, BOARD_PX * 0.7, x + 4, BOARD_PX + 4);
      ctx.stroke();
    }

    // Darker knot-like streaks for extra grain irregularity.
    ctx.strokeStyle = 'rgba(80, 52, 16, 0.06)';
    ctx.lineWidth = 3;
    for (let i = 0; i < 6; i += 1) {
      const x = (i / 6) * BOARD_PX + 40;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.quadraticCurveTo(x + 18, BOARD_PX * 0.5, x - 6, BOARD_PX);
      ctx.stroke();
    }

    // Solid wooden bezel frame around the playing field, like the raised
    // edge of a real board block, with a warm inner highlight line.
    ctx.lineWidth = 10;
    ctx.strokeStyle = '#7a4d1f';
    ctx.strokeRect(6, 6, BOARD_PX - 12, BOARD_PX - 12);
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(255, 226, 163, 0.55)';
    ctx.strokeRect(12, 12, BOARD_PX - 24, BOARD_PX - 24);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = 'rgba(74, 46, 14, 0.4)';
    ctx.strokeRect(2, 2, BOARD_PX - 4, BOARD_PX - 4);

    ctx.strokeStyle = 'rgba(43, 26, 8, 0.9)';
    ctx.lineWidth = 1.4;
    for (let i = 0; i < BOARD_SIZE; i += 1) {
      const p = toPx(i);
      ctx.beginPath();
      ctx.moveTo(toPx(0), p);
      ctx.lineTo(toPx(BOARD_SIZE - 1), p);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(p, toPx(0));
      ctx.lineTo(p, toPx(BOARD_SIZE - 1));
      ctx.stroke();
    }

    ctx.fillStyle = 'rgba(43, 26, 8, 0.92)';
    HOSHI_POINTS.forEach((pt) => {
      ctx.beginPath();
      ctx.arc(toPx(pt.col), toPx(pt.row), 3.2, 0, Math.PI * 2);
      ctx.fill();
    });

    const canPlace = winner === 0 && !(aiEnabled && currentPlayer === 2);
    if (hoverCell && canPlace && board[hoverCell.row][hoverCell.col] === 0) {
      ctx.beginPath();
      ctx.arc(toPx(hoverCell.col), toPx(hoverCell.row), CELL_PX * 0.42, 0, Math.PI * 2);
      ctx.fillStyle = currentPlayer === 1 ? 'rgba(15,15,15,0.32)' : 'rgba(255,255,255,0.5)';
      ctx.fill();
    }

    let stillAnimating = false;

    for (let row = 0; row < BOARD_SIZE; row += 1) {
      for (let col = 0; col < BOARD_SIZE; col += 1) {
        const cell = board[row][col];
        if (cell === 0) continue;

        const key = `${row}-${col}`;
        const x = toPx(col);
        const y = toPx(row);
        const placedAt = placedAtRef.current.get(key);
        const age = placedAt !== undefined ? now - placedAt : STONE_ANIM_MS + 1;
        const baseR = CELL_PX * 0.44;
        let r = baseR;
        if (age < STONE_ANIM_MS) {
          stillAnimating = true;
          const t = clamp(age / STONE_ANIM_MS, 0, 1);
          r = Math.max(0, baseR * easeOutBack(t));
        }
        if (r <= 0) continue;

        ctx.beginPath();
        ctx.ellipse(x + r * 0.16, y + r * 0.22, r * 0.94, r * 0.82, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
        ctx.fill();

        const grad = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r);
        if (cell === 1) {
          grad.addColorStop(0, '#5c5c5c');
          grad.addColorStop(0.55, '#222222');
          grad.addColorStop(1, '#000000');
        } else {
          grad.addColorStop(0, '#ffffff');
          grad.addColorStop(0.6, '#e8e4da');
          grad.addColorStop(1, '#bdb8ac');
        }
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        if (cell === 2) {
          ctx.lineWidth = 1;
          ctx.strokeStyle = 'rgba(120, 110, 90, 0.6)';
          ctx.stroke();
        }

        const isWinningCell = winningCellSet.has(key);
        const isLastMove = lastMoveKey === key;
        if (isWinningCell) {
          ctx.beginPath();
          ctx.arc(x, y, r * 0.95, 0, Math.PI * 2);
          ctx.lineWidth = 2.5;
          ctx.strokeStyle = '#22c55e';
          ctx.stroke();
        } else if (isLastMove) {
          ctx.beginPath();
          ctx.arc(x, y, r * 0.3, 0, Math.PI * 2);
          ctx.fillStyle = cell === 1 ? 'rgba(255,255,255,0.85)' : 'rgba(59,130,246,0.85)';
          ctx.fill();
        }
      }
    }

    return stillAnimating;
  };

  // Always points at the current render's draw() so the rAF animation loop
  // below never keeps redrawing with a stale board/winner closure from the
  // render that kicked it off.
  drawRef.current = draw;

  useEffect(() => {
    draw();
  });

  const startPlacementAnimation = () => {
    if (rafRef.current !== null) return;
    const tick = () => {
      const stillAnimating = drawRef.current();
      if (stillAnimating) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        rafRef.current = null;
      }
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  const getCellFromEvent = (e: React.PointerEvent<HTMLCanvasElement>): Coord | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;
    const scaleX = BOARD_PX / rect.width;
    const scaleY = BOARD_PX / rect.height;
    const px = (e.clientX - rect.left) * scaleX;
    const py = (e.clientY - rect.top) * scaleY;
    return { row: nearestIndex(py), col: nearestIndex(px) };
  };

  const handleBoardPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    setHoverCell(getCellFromEvent(e));
  };

  const handleBoardPointerLeave = () => setHoverCell(null);

  const handleBoardClick = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (winner !== 0 || (aiEnabled && currentPlayer === 2)) return;
    const cell = getCellFromEvent(e);
    if (!cell) return;
    placeStone(cell.row, cell.col);
  };

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
        <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-1 flex items-center gap-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setAiEnabled(false)}
            className={`flex-1 px-2 py-1.5 rounded-md transition-colors ${
              !aiEnabled
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            2인 대국
          </button>
          <button
            type="button"
            onClick={() => setAiEnabled(true)}
            className={`flex-1 px-2 py-1.5 rounded-md transition-colors ${
              aiEnabled
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            인공지능 대국(VS AI)
          </button>
        </div>

        <label className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center justify-between gap-3">
          <span>흑 금수 규칙 (33/44/장목)</span>
          <input
            type="checkbox"
            checked={forbiddenRules}
            onChange={(e) => setForbiddenRules(e.target.checked)}
            className="accent-amber-500"
          />
        </label>

        <div className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-600 dark:text-slate-400">
          최근 착수: <span className="font-semibold text-slate-800 dark:text-slate-200">{lastMove ? coordLabel(lastMove.row, lastMove.col) : '-'}</span>
        </div>
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

      <div className="rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50/70 dark:bg-amber-900/10 p-2 sm:p-3">
        <div className="flex items-center justify-end mb-1 px-1">
          <button
            type="button"
            onClick={toggleSound}
            title={soundEnabled ? '효과음 끄기' : '효과음 켜기'}
            aria-label={soundEnabled ? '효과음 끄기' : '효과음 켜기'}
            className="inline-flex items-center justify-center p-1.5 rounded-lg bg-white/60 dark:bg-black/20 text-amber-800 dark:text-amber-300 hover:bg-white dark:hover:bg-black/40 transition-colors"
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>
        </div>
        <div className="w-full max-w-[640px] mx-auto p-1 sm:p-2">
          <div className="mb-1 flex pl-[20px] sm:pl-[24px]">
            {COL_LABELS.map((label) => (
              <div
                key={label}
                className="flex-1 text-center text-[9px] sm:text-[10px] font-semibold text-amber-800 dark:text-amber-300"
              >
                {label}
              </div>
            ))}
          </div>

          <div className="flex">
            <div className="flex flex-col w-[20px] sm:w-[24px]">
              {Array.from({ length: BOARD_SIZE }, (_, rowIndex) => (
                <div
                  key={`row-label-${rowIndex}`}
                  className="flex-1 flex items-center justify-center text-[9px] sm:text-[10px] font-semibold text-amber-800 dark:text-amber-300"
                >
                  {rowIndex + 1}
                </div>
              ))}
            </div>

            <canvas
              ref={canvasRef}
              width={BOARD_PX}
              height={BOARD_PX}
              onPointerMove={handleBoardPointerMove}
              onPointerLeave={handleBoardPointerLeave}
              onPointerDown={handleBoardClick}
              className="flex-1 min-w-0 w-full h-auto rounded-md shadow-[0_10px_22px_-8px_rgba(90,55,15,0.5)] touch-none cursor-pointer"
              style={{ touchAction: 'none' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
