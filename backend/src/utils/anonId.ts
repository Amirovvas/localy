import type { Pool, PoolClient } from "pg";

export const generateUniqueAnonId = async (
  db: Pool | PoolClient,
): Promise<number> => {
  for (let attempt = 0; attempt < 20; attempt++) {
    const candidate = Math.floor(1000 + Math.random() * 9000);
    const exists = await db.query(`select 1 from users where anon_id = $1`, [
      candidate,
    ]);
    if (exists.rowCount === 0) return candidate;
  }
  throw new Error("Could not generate a unique anon_id");
};
