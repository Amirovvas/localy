import { pool } from "../plugins/pg";
import { apiErrors } from "../utils/apiErrors";
import { getIO, roomChannel } from "../plugins/socket";
import { reactionsSelect } from "./reaction.service";
import { assertOwnAttachment } from "../plugins/storage";

interface ICreateBody {
  roomId: number;
  userId: number;
  text: string;
  attachment?: string;
  isAnnouncement?: boolean;
  replyToId?: number;
}

// автор (и автор цитируемого сообщения) виден другим только как anon_id —
// реальные имя/почта сюда не попадают. Цитата обрезается до 200 символов,
// чтобы не раздувать каждое сообщение полным текстом оригинала
// userParam — плейсхолдер с id читающего пользователя, нужен для флага reactions[].mine
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
  // сообщения, очищенные этим пользователем у себя, не отдаём — у остальных
  // участников комнаты они остаются видны как обычно
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
  // отдаём хронологически (старые -> новые), как отображается в чате
  return result.rows.reverse();
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

export const createMessageService = async (body: ICreateBody) => {
  assertOwnAttachment(body.attachment);

  // отвечать можно только на сообщение из этой же комнаты
  if (body.replyToId) {
    const target = await pool.query(`select room_id from messages where id = $1`, [
      body.replyToId,
    ]);
    if (!target.rows[0] || target.rows[0].room_id !== body.roomId) {
      throw apiErrors.badRequest("Сообщение, на которое вы отвечаете, не найдено");
    }
  }

  try {
    const inserted = await pool.query(
      `
      insert into messages (room_id, user_id, text, attachment, is_announcement, reply_to_id)
      values ($1, $2, $3, $4, $5, $6)
      returning id
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

    const full = await pool.query(`${selectMessage("$2")} where m.id = $1`, [
      inserted.rows[0].id,
      body.userId,
    ]);
    const fullMessage = full.rows[0];

    // живой пуш всем, кто сейчас открыл эту комнату
    getIO()
      ?.to(roomChannel(body.roomId))
      .emit("message:new", { ...fullMessage, room_id: body.roomId });

    return fullMessage;
  } catch (error: any) {
    if (error.code === "23503") throw apiErrors.badRequest("Комната не найдена");
    throw error;
  }
};

export const editMessageService = async (id: number, userId: number, text: string) => {
  // пока разрешаем редактировать только своё сообщение, как и удаление
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

// закреплённые сообщения видны всем участникам комнаты независимо от того,
// очищал ли кто-то историю у себя — это отдельная, "поверх" обычного списка
export const listPinnedMessagesService = async (roomId: number, userId: number) => {
  const result = await pool.query(
    `${selectMessage("$2")} where m.room_id = $1 and m.pinned_at is not null order by m.pinned_at desc`,
    [roomId, userId],
  );
  return result.rows;
};

export const searchMessagesService = async (roomId: number, userId: number, query: string) => {
  // экранируем спецсимволы ilike, чтобы "%" и "_" в поиске искались буквально
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
  // пока разрешаем удалять только своё сообщение — модерация чужих сообщений
  // (через Admin Panel / роль admin) уже есть отдельно, в report.service.ts
  const result = await pool.query(
    `delete from messages where id = $1 and user_id = $2 returning id, room_id`,
    [id, userId],
  );
  if (!result.rows[0]) {
    throw apiErrors.notFound("Сообщение не найдено или у вас нет прав на удаление");
  }

  // остальным участникам комнаты — живым пушем, чтобы сообщение пропало у
  // всех сразу, а не только после перезагрузки
  const { room_id: roomId } = result.rows[0];
  getIO()?.to(roomChannel(roomId)).emit("message:deleted", { room_id: roomId, id });

  return result.rows[0];
};
