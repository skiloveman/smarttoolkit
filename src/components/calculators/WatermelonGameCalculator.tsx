import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as Matter from 'matter-js';
import { BookmarkPlus, RefreshCw, Volume2, VolumeX } from 'lucide-react';
import { SaveHistoryFn } from '../../types';
import { usePendingHistoryRestore } from '../../utils/historyRestore';
import { SuikaSoundPlayer } from '../../utils/suikaSounds';

interface Props {
  onSaveHistory: (title: string, summary: string, details: Record<string, string | number>) => void;
}

type FruitInfo = {
  name: string;
  emoji: string;
  points: number;
};

type FruitPlugin = {
  level: number;
  merging: boolean;
  removed: boolean;
  spawnTime: number;
};

type FruitBody = Matter.Body & { plugin: FruitPlugin };

interface PopEffect {
  x: number;
  y: number;
  startTime: number;
  radius: number;
  color: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  emoji: string;
}

const FRUITS: FruitInfo[] = [
  { name: '체리', emoji: '🍒', points: 1 },
  { name: '딸기', emoji: '🍓', points: 3 },
  { name: '포도', emoji: '🍇', points: 6 },
  { name: '귤', emoji: '🍊', points: 10 },
  { name: '사과', emoji: '🍎', points: 15 },
  { name: '배', emoji: '🍐', points: 21 },
  { name: '복숭아', emoji: '🍑', points: 28 },
  { name: '멜론', emoji: '🍈', points: 36 },
  { name: '파인애플', emoji: '🍍', points: 45 },
  { name: '코코넛', emoji: '🥥', points: 55 },
  { name: '수박', emoji: '🍉', points: 66 },
];

const MAX_LEVEL = FRUITS.length - 1;

const BOARD_W = 300;
const BOARD_H = 420;
const WALL = 10;
const LINE_Y = 78;
const SPAWN_Y = 40;
const DROP_COOLDOWN_MS = 260;
const GAME_OVER_GRACE_MS = 1000;
const GROW_ANIM_MS = 380;
const POP_ANIM_MS = 420;

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const radiusForLevel = (level: number) => 10 + level * 5;

const popColorForLevel = (level: number) => `hsl(${(level * 37) % 360}, 82%, 62%)`;

// Springy overshoot so newly merged fruit "pops" bigger than its final size
// before settling back down — https://easings.net/#easeOutElastic
const easeOutElastic = (t: number) => {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  const c4 = (2 * Math.PI) / 3;
  return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
};

const randomSpawnLevel = () => {
  const roll = Math.random();
  if (roll < 0.55) return 0;
  if (roll < 0.82) return 1;
  if (roll < 0.95) return 2;
  return 3;
};

interface SavedFruit {
  level: number;
  x: number;
  y: number;
}

const normalizeSavedFruits = (raw: unknown): SavedFruit[] => {
  if (!Array.isArray(raw)) return [];

  const fruits: SavedFruit[] = [];
  for (const entry of raw) {
    if (!Array.isArray(entry) || entry.length !== 3) continue;
    const [level, x, y] = entry;
    if (
      typeof level !== 'number' ||
      typeof x !== 'number' ||
      typeof y !== 'number' ||
      !Number.isInteger(level) ||
      level < 0 ||
      level > MAX_LEVEL
    ) {
      continue;
    }
    fruits.push({ level, x: clamp(x, WALL, BOARD_W - WALL), y: clamp(y, 0, BOARD_H - WALL) });
  }
  return fruits;
};

export const WatermelonGameCalculator: React.FC<Props> = ({ onSaveHistory }) => {
  const saveHistory = onSaveHistory as SaveHistoryFn;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const fruitsRef = useRef<FruitBody[]>([]);
  const pendingMergesRef = useRef<{ a: FruitBody; b: FruitBody; isFinal: boolean }[]>([]);
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const dangerSinceRef = useRef<number | null>(null);
  const dropXRef = useRef(BOARD_W / 2);
  const nextLevelRef = useRef(randomSpawnLevel());
  const canDropRef = useRef(true);
  const gameOverRef = useRef(false);
  const pendingRestoreRef = useRef<SavedFruit[] | null>(null);
  const popEffectsRef = useRef<PopEffect[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const soundRef = useRef<SuikaSoundPlayer | null>(null);
  if (!soundRef.current) {
    soundRef.current = new SuikaSoundPlayer();
  }

  const [nextLevel, setNextLevel] = useState(nextLevelRef.current);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [moveCount, setMoveCount] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [hasFruits, setHasFruits] = useState(false);
  const [message, setMessage] = useState('포인터를 움직여 조준하고, 클릭(탭)해서 과일을 떨어뜨리세요.');
  const [saved, setSaved] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    try {
      const savedPref = localStorage.getItem('suika_sound_enabled');
      if (savedPref !== null) {
        setSoundEnabled(savedPref === 'true');
      }
    } catch {
      // Ignore unavailable localStorage (private browsing, etc.)
    }
  }, []);

  useEffect(() => {
    soundRef.current?.setEnabled(soundEnabled);
  }, [soundEnabled]);

  const toggleSound = () => {
    setSoundEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('suika_sound_enabled', String(next));
      } catch {
        // Ignore write failures.
      }
      return next;
    });
  };

  const nextFruit = FRUITS[nextLevel];

  const clearWorld = () => {
    const engine = engineRef.current;
    if (!engine) return;
    Matter.World.clear(engine.world, false);
    addWalls(engine);
    fruitsRef.current = [];
    pendingMergesRef.current = [];
    setHasFruits(false);
  };

  const addWalls = (engine: Matter.Engine) => {
    const floor = Matter.Bodies.rectangle(BOARD_W / 2, BOARD_H - WALL / 2, BOARD_W, WALL, {
      isStatic: true,
      label: 'wall',
    });
    const left = Matter.Bodies.rectangle(WALL / 2, BOARD_H / 2, WALL, BOARD_H, {
      isStatic: true,
      label: 'wall',
    });
    const right = Matter.Bodies.rectangle(BOARD_W - WALL / 2, BOARD_H / 2, WALL, BOARD_H, {
      isStatic: true,
      label: 'wall',
    });
    Matter.World.add(engine.world, [floor, left, right]);
  };

  const spawnFruit = (x: number, y: number, level: number): FruitBody => {
    const radius = radiusForLevel(level);
    const body = Matter.Bodies.circle(x, y, radius, {
      restitution: 0.15,
      friction: 0.2,
      frictionStatic: 0.4,
      frictionAir: 0.001,
      density: 0.0018,
      label: 'fruit',
    }) as FruitBody;
    body.plugin = { level, merging: false, removed: false, spawnTime: performance.now() };
    return body;
  };

  const triggerGameOver = () => {
    gameOverRef.current = true;
    setGameOver(true);
    setMessage('게임 오버! 과일이 빨간 선을 넘었습니다.');
  };

  const spawnPop = (x: number, y: number, radius: number, color: string) => {
    popEffectsRef.current.push({ x, y, startTime: performance.now(), radius, color });
  };

  const spawnConfetti = (x: number, y: number) => {
    const emojis = ['🎉', '✨', '⭐', '🍉', '💫'];
    for (let i = 0; i < 20; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.2 + Math.random() * 2.4;
      const maxLife = 800 + Math.random() * 500;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.8,
        life: maxLife,
        maxLife,
        emoji: emojis[Math.floor(Math.random() * emojis.length)],
      });
    }
  };

  const processMerges = () => {
    const queue = pendingMergesRef.current;
    if (queue.length === 0) return;
    pendingMergesRef.current = [];

    const engine = engineRef.current;
    if (!engine) return;

    let addedScore = 0;
    let watermelonMade = false;

    queue.forEach(({ a, b, isFinal }) => {
      if (a.plugin.removed || b.plugin.removed) return;
      a.plugin.removed = true;
      b.plugin.removed = true;

      const midX = (a.position.x + b.position.x) / 2;
      const midY = (a.position.y + b.position.y) / 2;

      Matter.World.remove(engine.world, [a, b]);
      fruitsRef.current = fruitsRef.current.filter((f) => f !== a && f !== b);

      if (isFinal) {
        addedScore += FRUITS[MAX_LEVEL].points * 2;
        spawnPop(midX, midY, radiusForLevel(MAX_LEVEL) * 1.4, '#f472b6');
        spawnConfetti(midX, midY);
        soundRef.current?.playBigPop();
        window.setTimeout(() => soundRef.current?.playFanfare(), 160);
        return;
      }

      const newLevel = a.plugin.level + 1;
      const newBody = spawnFruit(midX, midY, newLevel);
      Matter.World.add(engine.world, newBody);
      fruitsRef.current.push(newBody);
      addedScore += FRUITS[newLevel].points;

      spawnPop(midX, midY, radiusForLevel(newLevel), popColorForLevel(newLevel));
      soundRef.current?.playMerge(newLevel);

      if (newLevel === MAX_LEVEL) {
        watermelonMade = true;
        spawnConfetti(midX, midY);
        soundRef.current?.playFanfare();
      }
    });

    if (addedScore > 0) {
      setScore((prev) => {
        const total = prev + addedScore;
        setBestScore((best) => Math.max(best, total));
        return total;
      });
      setMessage(watermelonMade ? '수박 완성! 계속해서 더 높은 점수에 도전하세요.' : '합치기 성공! 연쇄를 노려보세요.');
    }
  };

  const checkGameOver = (now: number) => {
    const anyDanger = fruitsRef.current.some((body) => {
      if (body.plugin.removed) return false;
      if (now - body.plugin.spawnTime < 500) return false;
      const speed = Math.hypot(body.velocity.x, body.velocity.y);
      if (speed > 0.3) return false;
      return body.position.y - body.circleRadius < LINE_Y;
    });

    if (anyDanger) {
      if (dangerSinceRef.current === null) {
        dangerSinceRef.current = now;
      } else if (now - dangerSinceRef.current > GAME_OVER_GRACE_MS) {
        triggerGameOver();
      }
    } else {
      dangerSinceRef.current = null;
    }
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const isDark = document.documentElement.classList.contains('dark');

    ctx.clearRect(0, 0, BOARD_W, BOARD_H);
    ctx.fillStyle = isDark ? '#0f172a' : '#eff6ff';
    ctx.fillRect(0, 0, BOARD_W, BOARD_H);

    ctx.setLineDash([6, 4]);
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.55)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(WALL, LINE_Y);
    ctx.lineTo(BOARD_W - WALL, LINE_Y);
    ctx.stroke();
    ctx.setLineDash([]);

    const now = performance.now();

    fruitsRef.current.forEach((body) => {
      if (body.plugin.removed) return;
      const { x, y } = body.position;
      const r = body.circleRadius ?? radiusForLevel(body.plugin.level);
      const fruit = FRUITS[body.plugin.level];

      // Cute "jelly pop" bounce whenever a fruit appears (dropped or merged):
      // an elastic overshoot on scale plus a decaying squash/stretch wobble.
      const age = now - body.plugin.spawnTime;
      let scaleX = 1;
      let scaleY = 1;
      let wobbleRot = 0;
      if (age < GROW_ANIM_MS) {
        const t = age / GROW_ANIM_MS;
        const overshoot = easeOutElastic(t);
        const decay = 1 - t;
        const squish = Math.sin(t * Math.PI * 3) * 0.22 * decay;
        scaleX = overshoot * (1 + squish);
        scaleY = overshoot * (1 - squish);
        wobbleRot = Math.sin(t * Math.PI * 4) * 0.14 * decay;
      }

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(body.angle + wobbleRot);
      ctx.scale(scaleX, scaleY);
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fillStyle = isDark ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.95)';
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = isDark ? 'rgba(148, 163, 184, 0.35)' : 'rgba(100, 116, 139, 0.35)';
      ctx.stroke();
      ctx.font = `${Math.max(10, r * 1.3)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(fruit.emoji, 0, 1);
      ctx.restore();
    });

    ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
    ctx.fillRect(0, BOARD_H - WALL, BOARD_W, WALL);
    ctx.fillRect(0, 0, WALL, BOARD_H);
    ctx.fillRect(BOARD_W - WALL, 0, WALL, BOARD_H);

    popEffectsRef.current = popEffectsRef.current.filter((p) => now - p.startTime < POP_ANIM_MS);
    popEffectsRef.current.forEach((p) => {
      const t = (now - p.startTime) / POP_ANIM_MS;
      const ringRadius = p.radius * (1 + t * 1.3);
      ctx.beginPath();
      ctx.arc(p.x, p.y, ringRadius, 0, Math.PI * 2);
      ctx.strokeStyle = p.color;
      ctx.globalAlpha = 1 - t;
      ctx.lineWidth = 3 * (1 - t) + 1;
      ctx.stroke();
      ctx.globalAlpha = 1;
    });

    particlesRef.current = particlesRef.current.filter((p) => p.life > 0);
    particlesRef.current.forEach((p) => {
      p.x += p.vx * 1.6;
      p.y += p.vy * 1.6;
      p.vy += 0.12;
      p.life -= 16;
      const alpha = clamp(p.life / p.maxLife, 0, 1);
      ctx.globalAlpha = alpha;
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(p.emoji, p.x, p.y);
      ctx.globalAlpha = 1;
    });

    if (!gameOverRef.current) {
      const r = radiusForLevel(nextLevelRef.current);
      const x = dropXRef.current;
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = isDark ? 'rgba(96, 165, 250, 0.35)' : 'rgba(59, 130, 246, 0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, SPAWN_Y + r);
      ctx.lineTo(x, BOARD_H - WALL);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.beginPath();
      ctx.arc(x, SPAWN_Y, r, 0, Math.PI * 2);
      ctx.fillStyle = isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.98)';
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#3b82f6';
      ctx.stroke();
      ctx.font = `${Math.max(10, r * 1.3)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(FRUITS[nextLevelRef.current].emoji, x, SPAWN_Y + 1);
    } else {
      ctx.fillStyle = isDark ? 'rgba(15, 23, 42, 0.6)' : 'rgba(15, 23, 42, 0.35)';
      ctx.fillRect(0, 0, BOARD_W, BOARD_H);
    }
  };

  useEffect(() => {
    const engine = Matter.Engine.create();
    engine.gravity.y = 1;
    engineRef.current = engine;
    addWalls(engine);

    const handleCollision = (evt: Matter.IEventCollision<Matter.Engine>) => {
      evt.pairs.forEach((pair) => {
        const bodyA = pair.bodyA as FruitBody;
        const bodyB = pair.bodyB as FruitBody;
        if (bodyA.label !== 'fruit' || bodyB.label !== 'fruit') return;
        if (bodyA.plugin.merging || bodyB.plugin.merging || bodyA.plugin.removed || bodyB.plugin.removed) return;
        if (bodyA.plugin.level !== bodyB.plugin.level) return;

        const isFinal = bodyA.plugin.level === MAX_LEVEL;
        if (!isFinal && bodyA.plugin.level >= MAX_LEVEL) return;

        bodyA.plugin.merging = true;
        bodyB.plugin.merging = true;
        pendingMergesRef.current.push({ a: bodyA, b: bodyB, isFinal });
      });
    };
    Matter.Events.on(engine, 'collisionStart', handleCollision);

    const loop = (time: number) => {
      if (lastTimeRef.current === null) {
        lastTimeRef.current = time;
      }
      const delta = Math.min(time - lastTimeRef.current, 1000 / 30);
      lastTimeRef.current = time;

      if (!gameOverRef.current) {
        Matter.Engine.update(engine, delta);
        processMerges();
        checkGameOver(time);
      }

      draw();
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      Matter.Events.off(engine, 'collisionStart', handleCollision);
      Matter.World.clear(engine.world, false);
      Matter.Engine.clear(engine);
      engineRef.current = null;
      soundRef.current?.close();
    };
  }, []);

  usePendingHistoryRestore<{
    fruits: number[][];
    nextLevel: number;
    score: number;
    bestScore: number;
    moveCount: number;
    gameOver: boolean;
  }>('watermelonGame', (restored) => {
    const fruits = normalizeSavedFruits(restored.fruits);
    pendingRestoreRef.current = fruits;

    const engine = engineRef.current;
    if (engine) {
      Matter.World.clear(engine.world, false);
      addWalls(engine);
      fruitsRef.current = [];
      pendingMergesRef.current = [];
      fruits.forEach((f) => {
        const body = spawnFruit(f.x, f.y, f.level);
        Matter.World.add(engine.world, body);
        fruitsRef.current.push(body);
      });
      setHasFruits(fruits.length > 0);
    }

    const restoredNextLevel =
      Number.isInteger(restored.nextLevel) && restored.nextLevel >= 0 && restored.nextLevel <= MAX_LEVEL
        ? restored.nextLevel
        : randomSpawnLevel();
    nextLevelRef.current = restoredNextLevel;
    setNextLevel(restoredNextLevel);
    setScore(Number.isFinite(restored.score) ? Math.max(0, restored.score) : 0);
    setBestScore(Number.isFinite(restored.bestScore) ? Math.max(0, restored.bestScore) : 0);
    setMoveCount(Number.isFinite(restored.moveCount) ? Math.max(0, restored.moveCount) : 0);
    const restoredGameOver = Boolean(restored.gameOver);
    gameOverRef.current = restoredGameOver;
    setGameOver(restoredGameOver);
    setMessage('저장된 수박게임 상태를 불러왔습니다.');
  });

  const resetGame = () => {
    clearWorld();
    dangerSinceRef.current = null;
    const level = randomSpawnLevel();
    nextLevelRef.current = level;
    setNextLevel(level);
    setScore(0);
    setMoveCount(0);
    gameOverRef.current = false;
    setGameOver(false);
    setMessage('새 게임을 시작합니다. 포인터로 조준하고 클릭(탭)해서 떨어뜨리세요.');
  };

  const getLocalX = (clientX: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return BOARD_W / 2;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0) return BOARD_W / 2;
    const scale = BOARD_W / rect.width;
    return (clientX - rect.left) * scale;
  };

  const updateAim = (clientX: number) => {
    const r = radiusForLevel(nextLevelRef.current);
    const x = clamp(getLocalX(clientX), WALL + r, BOARD_W - WALL - r);
    dropXRef.current = x;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (gameOverRef.current) return;
    updateAim(e.clientX);
  };

  const handleDrop = (clientX: number) => {
    if (gameOverRef.current || !canDropRef.current) return;
    const engine = engineRef.current;
    if (!engine) return;

    updateAim(clientX);
    canDropRef.current = false;

    const level = nextLevelRef.current;
    const body = spawnFruit(dropXRef.current, SPAWN_Y, level);
    Matter.World.add(engine.world, body);
    fruitsRef.current.push(body);
    setHasFruits(true);
    soundRef.current?.playDrop();

    const upcoming = randomSpawnLevel();
    nextLevelRef.current = upcoming;
    setNextLevel(upcoming);
    setMoveCount((prev) => prev + 1);
    setMessage('좋아요! 같은 과일을 붙여서 더 큰 과일로 합쳐보세요.');

    window.setTimeout(() => {
      canDropRef.current = true;
    }, DROP_COOLDOWN_MS);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    handleDrop(e.clientX);
  };

  const collectFruitsForSave = (): number[][] =>
    fruitsRef.current
      .filter((f) => !f.plugin.removed)
      .map((f) => [f.plugin.level, Math.round(f.position.x), Math.round(f.position.y)]);

  const handleSave = () => {
    const savedFruits = collectFruitsForSave();
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
        fruits: savedFruits,
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

  const isBoardEmpty = useMemo(() => !hasFruits, [hasFruits]);

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">수박게임</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            같은 과일끼리 맞닿으면 합쳐집니다. 빨간 선을 넘기지 않고 수박을 만들어보세요.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleSound}
            title={soundEnabled ? '효과음 끄기' : '효과음 켜기'}
            aria-label={soundEnabled ? '효과음 끄기' : '효과음 켜기'}
            className="inline-flex items-center justify-center p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>
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
              <p className="text-xs text-slate-500 dark:text-slate-400">합체 점수 +{nextFruit.points}</p>
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

      <div className="mx-auto w-full max-w-[300px]">
        <canvas
          ref={canvasRef}
          width={BOARD_W}
          height={BOARD_H}
          onPointerMove={handlePointerMove}
          onPointerDown={handlePointerDown}
          className="w-full h-auto rounded-xl border border-slate-200 dark:border-slate-700 touch-none cursor-crosshair"
          style={{ touchAction: 'none' }}
        />
      </div>

      <div className="rounded-lg border border-amber-200 dark:border-amber-900/50 bg-amber-50/80 dark:bg-amber-950/40 px-4 py-3">
        <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">{message}</p>
        <p className="mt-1 text-xs text-amber-700 dark:text-amber-200">
          {isBoardEmpty
            ? '박스 위에서 포인터를 좌우로 움직여 조준한 뒤 클릭(탭)하면 과일이 떨어집니다.'
            : gameOver
              ? '새 게임 버튼으로 다시 시작할 수 있습니다.'
              : '같은 과일이 서로 맞닿으면 자동으로 합쳐지고, 빨간 선을 넘긴 채 멈추면 게임이 끝납니다.'}
        </p>
      </div>

      <div className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
        점수 규칙: 두 과일이 합쳐질 때마다 결과 과일의 점수가 누적됩니다. 수박(🍉)끼리 합치면 큰 보너스 점수와 함께 사라집니다.
      </div>
    </div>
  );
};
