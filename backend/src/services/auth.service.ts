import { pool } from "../plugins/pg";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { generateTokens, refresh_secret } from "../utils/generateTokens";
import { apiErrors } from "../utils/apiErrors";
import { generateUniqueAnonId } from "../utils/anonId";
import { assertSingleChoiceCategories } from "./community.service";

interface IRegisterBody {
  name: string;
  email: string;
  password: string;
  city: string;
  communityIds: number[];
}

interface ILoginBody {
  email: string;
  password: string;
}

export const registerService = async (body: IRegisterBody) => {
  await assertSingleChoiceCategories(body.communityIds);
  const hashedPassword = await bcrypt.hash(body.password, 9);

  const client = await pool.connect();
  try {
    await client.query("begin");

    const anonId = await generateUniqueAnonId(client);
    const userResult = await client.query(
      `
      insert into users (name, email, password, city, anon_id)
      values ($1, $2, $3, $4, $5)
      returning id, name, email, city, avatar, anon_id, created_at
      `,
      [body.name, body.email, hashedPassword, body.city, anonId],
    );
    const user = userResult.rows[0];

    const cityCommunity = await client.query(
      `select id from communities where category = 'city' and name = $1`,
      [body.city],
    );
    const cityCommunityId: number | undefined = cityCommunity.rows[0]?.id;
    const allCommunityIds = Array.from(
      new Set([...body.communityIds, ...(cityCommunityId ? [cityCommunityId] : [])]),
    );

    const values = allCommunityIds
      .map((_, index) => `($1, $${index + 2})`)
      .join(", ");
    await client.query(
      `
      insert into community_members (user_id, community_id)
      values ${values}
      `,
      [user.id, ...allCommunityIds],
    );

    await client.query("commit");
    return user;
  } catch (error: any) {
    await client.query("rollback");
    if (error.code === "23505") {
      if (error.constraint === "users_anon_id_idx") {
        throw apiErrors.conflict("Не удалось создать аккаунт, попробуйте ещё раз");
      }
      throw apiErrors.conflict("Этот email уже зарегистрирован");
    }
    if (error.code === "23503") {
      throw apiErrors.badRequest("Одно из выбранных сообществ не найдено");
    }
    throw error;
  } finally {
    client.release();
  }
};

export const loginService = async (body: ILoginBody) => {
  const result = await pool.query(`select * from users where email = $1`, [
    body.email,
  ]);

  const user = result.rows[0];
  if (!user) throw apiErrors.notFound("Email не зарегистрирован");

  const isMatchedPassword = await bcrypt.compare(body.password, user.password);
  if (!isMatchedPassword) throw apiErrors.badRequest("Неверный пароль");

  if (user.is_blocked) throw apiErrors.forbidden("Аккаунт заблокирован");

  const tokens = generateTokens({
    id: user.id,
    email: user.email,
    name: user.name,
  });

  await pool.query(`update users set refresh_token = $1 where email = $2`, [
    tokens.refreshToken,
    body.email,
  ]);

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      city: user.city,
      avatar: user.avatar,
      anonId: user.anon_id,
    },
    tokens,
  };
};

export const refreshService = async (refreshToken: string) => {
  if (!refreshToken) throw apiErrors.unauthorized("unauthorized");

  let decoded: any;
  try {
    decoded = jwt.verify(refreshToken, refresh_secret);
  } catch {
    throw apiErrors.unauthorized("unauthorized");
  }

  const result = await pool.query(`select * from users where email = $1`, [
    decoded.email,
  ]);

  if (!result.rows[0] || result.rows[0].refresh_token !== refreshToken) {
    throw apiErrors.unauthorized("unauthorized");
  }

  const tokens = generateTokens({
    id: result.rows[0].id,
    email: result.rows[0].email,
    name: result.rows[0].name,
  });
  await pool.query(`update users set refresh_token = $1 where email = $2`, [
    tokens.refreshToken,
    decoded.email,
  ]);

  return tokens;
};

export const logoutService = async (refreshToken: string) => {
  const result = await pool.query(
    `
    update users
    set refresh_token = null
    where refresh_token = $1
    returning *
    `,
    [refreshToken],
  );
  return result.rows[0];
};

export const profileService = async (userId: number) => {
  const [userResult, communitiesResult] = await Promise.all([
    pool.query(
      `select id, name, email, city, avatar, anon_id, is_admin, allow_dm, created_at from users where id = $1`,
      [userId],
    ),
    pool.query(
      `
      select c.id, c.name, c.category, c.city
      from communities c
      join community_members cm on cm.community_id = c.id
      where cm.user_id = $1
      order by c.name
      `,
      [userId],
    ),
  ]);

  const user = userResult.rows[0];
  if (!user) return null;

  return { ...user, communities: communitiesResult.rows };
};

export const updateProfileService = async (
  userId: number,
  changes: { name?: string; allowDm?: boolean },
) => {
  const result = await pool.query(
    `
    update users set
      name = coalesce($1, name),
      allow_dm = coalesce($2, allow_dm),
      updated_at = now()
    where id = $3
    returning id, name, allow_dm
    `,
    [changes.name ?? null, changes.allowDm ?? null, userId],
  );
  if (!result.rows[0]) throw apiErrors.notFound("Пользователь не найден");
  return result.rows[0];
};

export const listUsersService = async (search?: string) => {
  const params: any[] = [];
  let where = "where not u.is_admin";
  if (search) {
    params.push(`%${search.replace(/[\\%_]/g, "\\$&")}%`);
    where += ` and (u.name ilike $1 or u.email ilike $1)`;
  }

  const result = await pool.query(
    `
    select u.id, u.name, u.email, u.city, u.anon_id, u.is_admin, u.is_blocked, u.created_at,
      coalesce((
        select json_agg(c.name order by c.name)
        from community_members cm
        join communities c on c.id = cm.community_id
        where cm.user_id = u.id
      ), '[]') as communities
    from users u
    ${where}
    order by u.created_at desc
    `,
    params,
  );
  return result.rows;
};

export const getUserService = async (id: number) => {
  const result = await pool.query(
    `
    select u.id, u.name, u.email, u.city, u.anon_id, u.is_admin, u.is_blocked, u.created_at,
      coalesce((
        select json_agg(c.name order by c.name)
        from community_members cm
        join communities c on c.id = cm.community_id
        where cm.user_id = u.id
      ), '[]') as communities
    from users u
    where u.id = $1
    `,
    [id],
  );
  if (!result.rows[0]) throw apiErrors.notFound("Пользователь не найден");
  return result.rows[0];
};

export const deleteUserService = async (id: number) => {
  const result = await pool.query(`delete from users where id = $1 returning id`, [id]);
  if (!result.rows[0]) throw apiErrors.notFound("Пользователь не найден");
  return result.rows[0];
};
