import { pool } from "../plugins/pg";
import { apiErrors } from "../utils/apiErrors";
import { getIO, roomChannel, userChannel } from "../plugins/socket";
import { reactionsSelect } from "./reaction.service";
import { assertOwnAttachment, removeImageByUrl } from "../plugins/storage";
import { assertNoBannedWords } from "../utils/bannedWords";
import { assertMessageRate } from "../utils/rateLimit";

interface ICreateBody {
  roomId: number;
  userId: number;
  text: string;
  attachment?: string;
  isAnnouncement?: boolean;
  replyToId?: number;
}

const selectMessage = (userParam: string) => `
  select
    m.id, m.text, m.attachment, m.is_announcement, m.created_at, m.edited_at, m.pinned_at, u.anon_id,
    m.reply_to_id,
    coalesce(nullif(left(rm.text, 200), ''), case when rm.attachment is not null then '📷 Фото' end) as reply_text,
    ru.anon_id as reply_anon_id,
    ${reactionsSelect(userParam)}
  from messages m
  join users u on u.id = m.user_id
  left join messages rm on rm.id = m.reply_to_id
  left join users ru on ru.id = rm.user_id
`;

export const listMessagesService = async (
  roomId: number,
  userId: number,
  limit: number,
  before?: string,
) => {
  const params: any[] = [roomId, userId];
  let query = `
    ${selectMessage("$2")}
    where m.room_id = $1
      and m.created_at > coalesce(
        (select cleared_at from message_clears where user_id = $2 and room_id = $1),
        '-infinity'
      )
  `;

  if (before) {
    params.push(before);
    query += ` and m.created_at < $${params.length}`;
  }

  params.push(limit);
  query += ` order by m.created_at desc limit $${params.length}`;

  const result = await pool.query(query, params);
  return result.rows.reverse();
};

export const listUnreadCountsService = async (userId: number) => {
  const result = await pool.query(
    `
    select r.id as room_id, r.community_id, u.unread
    from rooms r
    join community_members cm on cm.community_id = r.community_id and cm.user_id = $1
    left join room_reads rr on rr.user_id = $1 and rr.room_id = r.id
    cross join lateral (
      select count(*)::int as unread from (
        select 1 from messages m
        where m.room_id = r.id
          and m.user_id <> $1
          and m.id > coalesce(rr.last_read_message_id, 0)
          and m.created_at > case when rr.last_read_message_id is null then cm.joined_at else '-infinity'::timestamptz end
          and m.created_at > coalesce(
            (select cleared_at from message_clears mc where mc.user_id = $1 and mc.room_id = r.id),
            '-infinity'
          )
        limit 100
      ) counted
    ) u
    where u.unread > 0
    `,
    [userId],
  );
  return result.rows;
};

const notifyRoomMembers = async (roomId: number, senderId: number) => {
  const io = getIO();
  if (!io) return;
  const members = await pool.query(
    `
    select cm.user_id from rooms r
    join community_members cm on cm.community_id = r.community_id
    where r.id = $1 and cm.user_id <> $2
    `,
    [roomId, senderId],
  );
  for (const member of members.rows) {
    io.to(userChannel(member.user_id)).emit("room:unread", { roomId });
  }
};

export const clearRoomMessagesService = async (roomId: number, userId: number) => {
  await pool.query(
    `
    insert into message_clears (user_id, room_id, cleared_at)
    values ($1, $2, now())
    on conflict (user_id, room_id) do update set cleared_at = now()
    `,
    [userId, roomId],
  );
};

export const getReadStateService = async (roomId: number, userId: number) => {
  const result = await pool.query(
    `select last_read_message_id from room_reads where user_id = $1 and room_id = $2`,
    [userId, roomId],
  );
  return result.rows[0]?.last_read_message_id ?? null;
};

export const markRoomReadService = async (roomId: number, userId: number) => {
  await pool.query(
    `
    insert into room_reads (user_id, room_id, last_read_message_id)
    select $1, $2, coalesce(max(id), 0) from messages where room_id = $2
    on conflict (user_id, room_id) do update
      set last_read_message_id = excluded.last_read_message_id
      where excluded.last_read_message_id > room_reads.last_read_message_id
    `,
    [userId, roomId],
  );
};

export const createMessageService = async (body: ICreateBody) => {
  assertMessageRate(body.userId);
  assertNoBannedWords(body.text);
  assertOwnAttachment(body.attachment);

  if (body.replyToId) {
    const target = await pool.query(`select room_id from messages where id = $1`, [
      body.replyToId,
    ]);
    if (!target.rows[0] || target.rows[0].room_id !== body.roomId) {
      throw apiErrors.badRequest("Сообщение, на которое вы отвечаете, не найдено");
    }
  }

  try {
    const full = await pool.query(
      `
      with inserted as (
        insert into messages (room_id, user_id, text, attachment, is_announcement, reply_to_id)
        values ($1, $2, $3, $4, $5, $6)
        returning *
      )
      select
        m.id, m.text, m.attachment, m.is_announcement, m.created_at, m.edited_at, m.pinned_at,
        u.anon_id, m.reply_to_id,
        coalesce(nullif(left(rm.text, 200), ''), case when rm.attachment is not null then '📷 Фото' end) as reply_text,
        ru.anon_id as reply_anon_id,
        '[]'::json as reactions
      from inserted m
      join users u on u.id = m.user_id
      left join messages rm on rm.id = m.reply_to_id
      left join users ru on ru.id = rm.user_id
      `,
      [
        body.roomId,
        body.userId,
        body.text,
        body.attachment ?? null,
        body.isAnnouncement ?? false,
        body.replyToId ?? null,
      ],
    );
    const fullMessage = full.rows[0];

    getIO()
      ?.to(roomChannel(body.roomId))
      .emit("message:new", { ...fullMessage, room_id: body.roomId });

    notifyRoomMembers(body.roomId, body.userId).catch(() => undefined);

    return fullMessage;
  } catch (error: any) {
    if (error.code === "23503") throw apiErrors.badRequest("Комната не найдена");
    throw error;
  }
};

export const editMessageService = async (id: number, userId: number, text: string) => {
  assertNoBannedWords(text);
  const updated = await pool.query(
    `update messages set text = $1, edited_at = now() where id = $2 and user_id = $3 returning room_id`,
    [text, id, userId],
  );
  if (!updated.rows[0]) {
    throw apiErrors.notFound("Сообщение не найдено или у вас нет прав на редактирование");
  }
  const { room_id: roomId } = updated.rows[0];

  const full = await pool.query(`${selectMessage("$2")} where m.id = $1`, [id, userId]);
  const fullMessage = full.rows[0];

  getIO()?.to(roomChannel(roomId)).emit("message:edited", { ...fullMessage, room_id: roomId });

  return fullMessage;
};

export const togglePinMessageService = async (id: number, userId: number) => {
  const message = await pool.query(`select room_id, pinned_at from messages where id = $1`, [id]);
  if (!message.rows[0]) throw apiErrors.notFound("Сообщение не найдено");
  const { room_id: roomId, pinned_at: pinnedAt } = message.rows[0];

  await pool.query(`update messages set pinned_at = $1 where id = $2`, [
    pinnedAt ? null : new Date(),
    id,
  ]);

  const full = await pool.query(`${selectMessage("$2")} where m.id = $1`, [id, userId]);
  const fullMessage = full.rows[0];

  getIO()?.to(roomChannel(roomId)).emit("message:pin", { ...fullMessage, room_id: roomId });

  return fullMessage;
};

export const listPinnedMessagesService = async (roomId: number, userId: number) => {
  const result = await pool.query(
    `${selectMessage("$2")} where m.room_id = $1 and m.pinned_at is not null order by m.pinned_at desc`,
    [roomId, userId],
  );
  return result.rows;
};

export const searchMessagesService = async (roomId: number, userId: number, query: string) => {
  const escaped = query.replace(/[\\%_]/g, "\\$&");
  const result = await pool.query(
    `
    ${selectMessage("$2")}
    where m.room_id = $1
      and m.created_at > coalesce(
        (select cleared_at from message_clears where user_id = $2 and room_id = $1),
        '-infinity'
      )
      and m.text ilike $3
    order by m.created_at desc
    limit 50
    `,
    [roomId, userId, `%${escaped}%`],
  );
  return result.rows;
};

export const deleteMessageService = async (id: number, userId: number) => {
  const result = await pool.query(
    `delete from messages where id = $1 and user_id = $2 returning id, room_id, attachment`,
    [id, userId],
  );
  if (!result.rows[0]) {
    throw apiErrors.notFound("Сообщение не найдено или у вас нет прав на удаление");
  }

  const { room_id: roomId } = result.rows[0];
  getIO()?.to(roomChannel(roomId)).emit("message:deleted", { room_id: roomId, id });

  const { attachment } = result.rows[0];
  if (attachment) {
    const stillUsed = await pool.query(`select 1 from messages where attachment = $1 limit 1`, [
      attachment,
    ]);
    if (!stillUsed.rows[0]) await removeImageByUrl(attachment);
  }

  return result.rows[0];
};
