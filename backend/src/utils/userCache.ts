import { pool } from "../plugins/pg";

interface UserAccess {
  exists: boolean;
  isBlocked: boolean;
  isAdmin: boolean;
  anonId: number | null;
}

const TTL_MS = 15_000;

const cache = new Map<number, { expiresAt: number; access: Promise<UserAccess> }>();

const loadUserAccess = async (userId: number): Promise<UserAccess> => {
  const result = await pool.query(
    `select is_blocked, is_admin, anon_id from users where id = $1`,
    [userId],
  );
  const row = result.rows[0];
  return {
    exists: Boolean(row),
    isBlocked: Boolean(row?.is_blocked),
    isAdmin: Boolean(row?.is_admin),
    anonId: row?.anon_id ?? null,
  };
};

export const getUserAccess = (userId: number): Promise<UserAccess> => {
  const hit = cache.get(userId);
  if (hit && hit.expiresAt > Date.now()) return hit.access;

  const access = loadUserAccess(userId);
  cache.set(userId, { expiresAt: Date.now() + TTL_MS, access });
  access.catch(() => cache.delete(userId));
  return access;
};

export const invalidateUserAccess = (userId: number) => {
  cache.delete(userId);
};

setInterval(() => {
  const now = Date.now();
  for (const [userId, entry] of cache) {
    if (entry.expiresAt <= now) cache.delete(userId);
  }
}, 5 * 60_000).unref();
