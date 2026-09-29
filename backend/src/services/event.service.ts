import { pool } from "../plugins/pg";
import { apiErrors } from "../utils/apiErrors";

interface ICreateBody {
  communityId: number;
  title: string;
  place?: string;
  startsAt: string;
}

interface IUpdateBody {
  title?: string;
  place?: string;
  startsAt?: string;
  joiningCount?: number;
}

const COLUMN_MAP: Record<string, string> = {
  startsAt: "starts_at",
  joiningCount: "joining_count",
};
const toColumn = (field: string) => COLUMN_MAP[field] ?? field;

export const listEventsService = async (communityId: number) => {
  const result = await pool.query(
    `select id, community_id, title, place, starts_at, joining_count from events where community_id = $1 order by starts_at`,
    [communityId],
  );
  return result.rows;
};

export const createEventService = async (body: ICreateBody, userId: number) => {
  try {
    const result = await pool.query(
      `
      insert into events (community_id, title, place, starts_at, created_by)
      values ($1, $2, $3, $4, $5)
      returning id, community_id, title, place, starts_at, joining_count
      `,
      [body.communityId, body.title, body.place ?? "", body.startsAt, userId],
    );
    return result.rows[0];
  } catch (error: any) {
    if (error.code === "23505") throw apiErrors.conflict("Событие с таким названием уже есть");
    if (error.code === "23503") throw apiErrors.badRequest("Сообщество не найдено");
    throw error;
  }
};

export const updateEventService = async (id: number, body: IUpdateBody) => {
  const fields = Object.keys(body) as (keyof IUpdateBody)[];
  if (fields.length === 0) throw apiErrors.badRequest("Nothing to update");

  const setClause = fields
    .map((field, index) => `${toColumn(field)} = $${index + 2}`)
    .join(", ");
  const values = fields.map((field) => body[field]);

  try {
    const result = await pool.query(
      `update events set ${setClause} where id = $1 returning id, community_id, title, place, starts_at, joining_count`,
      [id, ...values],
    );
    if (!result.rows[0]) throw apiErrors.notFound("Событие не найдено");
    return result.rows[0];
  } catch (error: any) {
    if (error.code === "23505") throw apiErrors.conflict("Событие с таким названием уже есть");
    throw error;
  }
};

export const deleteEventService = async (id: number) => {
  const result = await pool.query(`delete from events where id = $1 returning id`, [id]);
  if (!result.rows[0]) throw apiErrors.notFound("Событие не найдено");
  return result.rows[0];
};
