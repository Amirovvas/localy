import { pool } from "../plugins/pg";
import { apiErrors } from "../utils/apiErrors";

interface ICreateBody {
  communityId: number;
  name: string;
  description?: string;
}

interface IUpdateBody {
  name?: string;
  description?: string;
}

export const listRoomsService = async (communityId: number) => {
  const result = await pool.query(
    `select id, community_id, name, description, position from rooms where community_id = $1 order by position, name`,
    [communityId],
  );
  return result.rows;
};

export const createRoomService = async (body: ICreateBody) => {
  try {
    const result = await pool.query(
      `
      insert into rooms (community_id, name, description)
      values ($1, $2, $3)
      returning id, community_id, name, description, position
      `,
      [body.communityId, body.name, body.description ?? ""],
    );
    return result.rows[0];
  } catch (error: any) {
    if (error.code === "23505") throw apiErrors.conflict("Комната с таким названием уже есть");
    if (error.code === "23503") throw apiErrors.badRequest("Сообщество не найдено");
    throw error;
  }
};

export const updateRoomService = async (id: number, body: IUpdateBody) => {
  const fields = Object.keys(body) as (keyof IUpdateBody)[];
  if (fields.length === 0) throw apiErrors.badRequest("Nothing to update");

  const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(", ");
  const values = fields.map((field) => body[field]);

  try {
    const result = await pool.query(
      `update rooms set ${setClause} where id = $1 returning id, community_id, name, description, position`,
      [id, ...values],
    );
    if (!result.rows[0]) throw apiErrors.notFound("Комната не найдена");
    return result.rows[0];
  } catch (error: any) {
    if (error.code === "23505") throw apiErrors.conflict("Комната с таким названием уже есть");
    throw error;
  }
};

export const deleteRoomService = async (id: number) => {
  const result = await pool.query(`delete from rooms where id = $1 returning id`, [id]);
  if (!result.rows[0]) throw apiErrors.notFound("Комната не найдена");
  return result.rows[0];
};
