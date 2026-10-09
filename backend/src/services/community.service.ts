import { pool } from "../plugins/pg";
import { apiErrors } from "../utils/apiErrors";
import { getIO } from "../plugins/socket";

interface ICreateBody {
  name: string;
  category: string;
  city: string;
  description?: string;
  status?: string;
  lat?: number | null;
  lng?: number | null;
}

interface IUpdateBody {
  name?: string;
  category?: string;
  city?: string;
  description?: string;
  status?: string;
  lat?: number | null;
  lng?: number | null;
}

export const listCommunitiesService = async () => {
  const result = await pool.query(
    `
    select id, name, category, city, description, lat, lng
    from communities
    where status = 'active' and category != 'city'
    order by category, name
    `,
  );
  return result.rows;
};

export const getPublicStatsService = async () => {
  const result = await pool.query(
    `select count(*)::int as communities from communities where status = 'active' and category != 'city'`,
  );
  const io = getIO();
  const online = io
    ? new Set([...io.sockets.sockets.values()].map((socket) => socket.data.user?.id)).size
    : 0;
  return { ...result.rows[0], online };
};

export const listMyCommunitiesService = async (userId: number) => {
  const result = await pool.query(
    `
    select c.id, c.name, c.category, c.city, c.description,
      (select count(*) from community_members cm2 where cm2.community_id = c.id) as members
    from communities c
    join community_members cm on cm.community_id = c.id
    where cm.user_id = $1
    order by c.name
    `,
    [userId],
  );
  return result.rows;
};

export const discoverCommunitiesService = async (
  userId: number,
  search?: string,
  category?: string,
) => {
  const params: any[] = [userId];
  let where = `c.status = 'active' and not exists (
    select 1 from community_members cm where cm.community_id = c.id and cm.user_id = $1
  )`;

  if (search) {
    params.push(`%${search.replace(/[\\%_]/g, "\\$&")}%`);
    where += ` and (c.name ilike $${params.length} or c.description ilike $${params.length})`;
  }
  if (category) {
    params.push(category);
    where += ` and c.category = $${params.length}`;
  }

  const result = await pool.query(
    `
    select c.id, c.name, c.category, c.city, c.description, c.lat, c.lng,
      (select count(*) from community_members cm2 where cm2.community_id = c.id) as members
    from communities c
    where ${where}
    order by c.category, c.name
    limit 1000
    `,
    params,
  );
  return result.rows;
};

const SINGLE_CHOICE_CATEGORIES: Record<string, string> = {
  university: "университет, институт или колледж",
  district: "район",
  residential: "жилой комплекс",
};

export const assertSingleChoiceCategories = async (communityIds: number[]) => {
  const result = await pool.query(
    `
    select category from communities
    where id = any($1) and category = any($2)
    group by category having count(*) > 1
    `,
    [communityIds, Object.keys(SINGLE_CHOICE_CATEGORIES)],
  );
  const category: string | undefined = result.rows[0]?.category;
  if (category) {
    throw apiErrors.badRequest(
      `Можно выбрать только один вариант: ${SINGLE_CHOICE_CATEGORIES[category]}`,
    );
  }
};

export const joinCommunityService = async (communityId: number, userId: number) => {
  const exists = await pool.query(`select id, category from communities where id = $1`, [
    communityId,
  ]);
  if (!exists.rows[0]) throw apiErrors.notFound("Сообщество не найдено");

  const category: string = exists.rows[0].category;
  if (SINGLE_CHOICE_CATEGORIES[category]) {
    const other = await pool.query(
      `
      select 1 from community_members cm
      join communities c on c.id = cm.community_id
      where cm.user_id = $1 and c.category = $2 and c.id <> $3
      limit 1
      `,
      [userId, category, communityId],
    );
    if (other.rows[0]) {
      throw apiErrors.badRequest(
        `Вы уже состоите в сообществе этой категории (${SINGLE_CHOICE_CATEGORIES[category]}) — сначала покиньте его`,
      );
    }
  }

  await pool.query(
    `
    insert into community_members (user_id, community_id)
    values ($1, $2)
    on conflict (user_id, community_id) do nothing
    `,
    [userId, communityId],
  );

  const result = await pool.query(
    `
    select c.id, c.name, c.category, c.city, c.description,
      (select count(*) from community_members cm2 where cm2.community_id = c.id) as members
    from communities c
    where c.id = $1
    `,
    [communityId],
  );
  return result.rows[0];
};

export const leaveCommunityService = async (communityId: number, userId: number) => {
  const result = await pool.query(
    `delete from community_members where community_id = $1 and user_id = $2 returning id`,
    [communityId, userId],
  );
  if (!result.rows[0]) throw apiErrors.notFound("Вы не состоите в этом сообществе");
  return { id: communityId };
};

export const getCommunityService = async (id: number, userId: number) => {
  const [communityResult, rooms, events] = await Promise.all([
    pool.query(
      `
      select
        c.id, c.name, c.category, c.city, c.description, c.created_at,
        (select count(*) from community_members cm where cm.community_id = c.id) as members
      from communities c
      where c.id = $1
      `,
      [id],
    ),
    pool.query(
      `select id, name, description from rooms where community_id = $1 order by position, name`,
      [id],
    ),
    pool.query(
      `select id, title, place, starts_at, joining_count
       from events
       where community_id = $1 and created_by = $2
       order by starts_at`,
      [id, userId],
    ),
  ]);

  const community = communityResult.rows[0];
  if (!community) throw apiErrors.notFound("Сообщество не найдено");

  return {
    ...community,
    rooms: rooms.rows,
    events: events.rows,
  };
};

export const listAdminCommunitiesService = async () => {
  const result = await pool.query(
    `
    select
      c.id, c.name, c.category, c.city, c.description, c.status, c.lat, c.lng, c.created_at,
      (select count(*) from community_members cm where cm.community_id = c.id) as members,
      coalesce((
        select json_agg(json_build_object('id', r.id, 'name', r.name) order by r.position, r.name)
        from rooms r
        where r.community_id = c.id
      ), '[]') as rooms
    from communities c
    order by c.name
    `,
  );
  return result.rows;
};

export const createCommunityService = async (body: ICreateBody) => {
  try {
    const result = await pool.query(
      `
      insert into communities (name, category, city, description, status, lat, lng)
      values ($1, $2, $3, $4, coalesce($5, 'pending'), $6, $7)
      returning id, name, category, city, description, status, lat, lng, created_at
      `,
      [
        body.name,
        body.category,
        body.city,
        body.description ?? "",
        body.status,
        body.lat ?? null,
        body.lng ?? null,
      ],
    );
    return result.rows[0];
  } catch (error: any) {
    if (error.code === "23505") {
      throw apiErrors.conflict("Сообщество с таким названием уже существует");
    }
    throw error;
  }
};

export const updateCommunityService = async (id: number, body: IUpdateBody) => {
  const fields = Object.keys(body) as (keyof IUpdateBody)[];
  if (fields.length === 0) throw apiErrors.badRequest("Nothing to update");

  const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(", ");
  const values = fields.map((field) => body[field]);

  try {
    const result = await pool.query(
      `
      update communities
      set ${setClause}
      where id = $1
      returning id, name, category, city, description, status, lat, lng, created_at
      `,
      [id, ...values],
    );
    if (!result.rows[0]) throw apiErrors.notFound("Сообщество не найдено");
    return result.rows[0];
  } catch (error: any) {
    if (error.code === "23505") {
      throw apiErrors.conflict("Сообщество с таким названием уже существует");
    }
    throw error;
  }
};

export const deleteCommunityService = async (id: number) => {
  const result = await pool.query(`delete from communities where id = $1 returning id`, [id]);
  if (!result.rows[0]) throw apiErrors.notFound("Сообщество не найдено");
  return result.rows[0];
};
