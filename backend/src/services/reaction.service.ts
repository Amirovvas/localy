import { pool } from "../plugins/pg";
import { apiErrors } from "../utils/apiErrors";
import { getIO, roomChannel } from "../plugins/socket";

// SQL-фрагмент для selectMessage в message.service.ts: сгруппированные
// реакции сообщения. userParam — плейсхолдер с id текущего пользователя
// ("$2"), от него зависит флаг mine (моя реакция подсвечивается на фронтенде)
export const reactionsSelect = (userParam: string, messageAlias = "m") => `
  coalesce((
    select json_agg(
      json_build_object('emoji', x.emoji, 'count', x.cnt, 'mine', x.mine)
      order by x.first_at
    )
    from (
      select
        emoji,
        count(*)::int as cnt,
        bool_or(user_id = ${userParam}) as mine,
        min(created_at) as first_at
      from message_reactions
      where message_id = ${messageAlias}.id
      group by emoji
    ) x
  ), '[]'::json) as reactions
`;

export const toggleMessageReactionService = async (
  messageId: number,
  userId: number,
  emoji: string,
) => {
  const message = await pool.query(`select room_id from messages where id = $1`, [messageId]);
  if (!message.rows[0]) throw apiErrors.notFound("Сообщение не найдено");
  const roomId: number = message.rows[0].room_id;

  // insert ... on conflict do nothing не падает при гонке двух кликов:
  // если строка уже была (ничего не вставилось) — значит это снятие реакции
  const inserted = await pool.query(
    `
    insert into message_reactions (message_id, user_id, emoji)
    values ($1, $2, $3)
    on conflict do nothing
    returning message_id
    `,
    [messageId, userId, emoji],
  );
  if (inserted.rowCount === 0) {
    await pool.query(
      `delete from message_reactions where message_id = $1 and user_id = $2 and emoji = $3`,
      [messageId, userId, emoji],
    );
  }

  const counts = await pool.query(
    `
    select emoji, count(*)::int as count, bool_or(user_id = $2) as mine
    from message_reactions
    where message_id = $1
    group by emoji
    order by min(created_at)
    `,
    [messageId, userId],
  );
  const reactions = counts.rows as { emoji: string; count: number; mine: boolean }[];

  // остальным участникам уходят только счётчики: "mine" у каждого свой,
  // клиент сохраняет его из собственного кэша
  getIO()
    ?.to(roomChannel(roomId))
    .emit("reaction:update", {
      room_id: roomId,
      message_id: messageId,
      reactions: reactions.map(({ emoji, count }) => ({ emoji, count })),
    });

  return { message_id: messageId, reactions };
};
