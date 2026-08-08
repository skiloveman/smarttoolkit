interface D1PreparedStatement {
  bind: (...args: unknown[]) => D1PreparedStatement;
  all: <T = unknown>() => Promise<{ results: T[] }>;
  run: () => Promise<unknown>;
}

interface D1Db {
  prepare: (query: string) => D1PreparedStatement;
}

interface Env {
  LEADERBOARD_DB: D1Db;
}

interface LeaderboardRow {
  id: number;
  name: string;
  comment: string;
  score: number;
  created_at: string;
}

const MAX_ENTRIES = 10;
const MAX_NAME_LEN = 40;
const MAX_EMAIL_LEN = 120;
const MAX_COMMENT_LEN = 300;
const MAX_SCORE = 100_000_000;

function stripControlChars(value: string): string {
  let cleaned = '';
  for (let i = 0; i < value.length; i += 1) {
    const code = value.charCodeAt(i);
    if (code === 0) continue;
    cleaned += value[i];
  }
  return cleaned;
}

function toSafeText(value: unknown, max: number): string {
  if (typeof value !== 'string') return '';
  return stripControlChars(value).trim().slice(0, max);
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function fetchTop10(db: D1Db): Promise<LeaderboardRow[]> {
  const { results } = await db
    .prepare('SELECT id, name, comment, score, created_at FROM watermelon_leaderboard ORDER BY score DESC, created_at ASC LIMIT ?1')
    .bind(MAX_ENTRIES)
    .all<LeaderboardRow>();
  return results ?? [];
}

export const onRequestGet = async (context: { env: Env }) => {
  try {
    const top10 = await fetchTop10(context.env.LEADERBOARD_DB);
    return Response.json({ ok: true, entries: top10 });
  } catch (err) {
    return Response.json(
      { ok: false, message: err instanceof Error ? err.message : '순위 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
};

export const onRequestPost = async (context: { request: Request; env: Env }) => {
  try {
    const body = (await context.request.json()) as {
      name?: string;
      email?: string;
      comment?: string;
      score?: number;
    };

    const name = toSafeText(body.name, MAX_NAME_LEN);
    const email = toSafeText(body.email, MAX_EMAIL_LEN);
    const comment = toSafeText(body.comment, MAX_COMMENT_LEN);
    const score = Math.trunc(Number(body.score));

    if (!name || !email || !comment) {
      return Response.json({ ok: false, message: '이름, 이메일, 소감을 모두 입력해 주세요.' }, { status: 400 });
    }
    if (!isValidEmail(email)) {
      return Response.json({ ok: false, message: '이메일 형식이 올바르지 않습니다.' }, { status: 400 });
    }
    if (!Number.isFinite(score) || score <= 0 || score > MAX_SCORE) {
      return Response.json({ ok: false, message: '점수 값이 올바르지 않습니다.' }, { status: 400 });
    }

    const db = context.env.LEADERBOARD_DB;

    await db
      .prepare('INSERT INTO watermelon_leaderboard (name, email, comment, score) VALUES (?1, ?2, ?3, ?4)')
      .bind(name, email, comment, score)
      .run();

    // Keep the table trimmed to the top 10 so it never grows unbounded.
    await db
      .prepare(
        `DELETE FROM watermelon_leaderboard
         WHERE id NOT IN (
           SELECT id FROM watermelon_leaderboard ORDER BY score DESC, created_at ASC LIMIT ?1
         )`
      )
      .bind(MAX_ENTRIES)
      .run();

    const top10 = await fetchTop10(db);
    const rank = top10.findIndex((row) => row.name === name && row.comment === comment && row.score === score) + 1;

    return Response.json({ ok: true, entries: top10, rank: rank > 0 ? rank : null });
  } catch (err) {
    return Response.json(
      { ok: false, message: err instanceof Error ? err.message : '등록 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
};
