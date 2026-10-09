import { pool } from "../plugins/pg";
import { getIO, userChannel } from "../plugins/socket";
import { apiErrors } from "../utils/apiErrors";
import { assertNoBannedWords } from "../utils/bannedWords";
import { assertMessageRate } from "../utils/rateLimit";
import { assertOwnAttachment } from "../plugins/storage";

interface IStartBody {
  userId: number;
  anonId: number;
  text: string;
  attachment?: string;
  communityId?: number;
}

const getConversation = async (conversationId: number, userId: number) => {
  const result = await pool.query(
    `select * from conversations where id = $1 and (user_a = $2 or user_b = $2)`,
    [conversationId, userId],
  );
  const conversation = result.rows[0];
  if (!conversation) throw apiErrors.notFound("Диалог не найден");
  return conversation;
};

const otherUserId = (conversation: { user_a: number; user_b: number }, userId: number) =>
  conversation.user_a === userId ? conversation.user_b : conversation.user_a;

const notifyUpdate = (conversation: { id: number; user_a: number; user_b: number }) => {
  const io = getIO();
  if (!io) return;
  const payload = { conversationId: conversation.id };
  io.to(userChannel(conversation.user_a)).emit("dm:update", payload);
  io.to(userChannel(conversation.user_b)).emit("dm:update", payload);
};

export const listConversationsService = async (userId: number) => {
  const result = await pool.query(
    `
    select
      c.id, c.status, c.initiator_id = $1 as is_initiator, (c.blocked_by = $1) as blocked_by_me,
      o.anon_id as other_anon_id, com.name as community_name,
      coalesce(nullif(lm.text, ''), case when lm.attachment is not null then '📷 Фото' end) as last_text, lm.created_at as last_at, (lm.sender_id = $1) as last_mine,
      c.created_at,
      (
        select count(*)::int from direct_messages dm
        where dm.conversation_id = c.id and dm.sender_id <> $1
          and dm.id > case when c.user_a = $1 then c.user_a_read_id else c.user_b_read_id end
      ) as unread
    from conversations c
    join users o on o.id = case when c.user_a = $1 then c.user_b else c.user_a end
    left join communities com on com.id = c.community_id
    left join lateral (
      select text, attachment, created_at, sender_id from direct_messages
      where conversation_id = c.id order by id desc limit 1
    ) lm on true
    where (c.user_a = $1 or c.user_b = $1)
      and c.status <> 'declined'
      and not (c.status = 'blocked' and c.blocked_by <> $1)
    order by coalesce(lm.created_at, c.created_at) desc
    `,
    [userId],
  );
  return result.rows;
};

export const startConversationService = async (body: IStartBody) => {
  assertMessageRate(body.userId);
  assertNoBannedWords(body.text);
  assertOwnAttachment(body.attachment);

  const targetResult = await pool.query(
    `select id, allow_dm, is_blocked from users where anon_id = $1`,
    [body.anonId],
  );
  const target = targetResult.rows[0];
  if (!target || target.is_blocked) throw apiErrors.notFound("Пользователь не найден");
  if (target.id === body.userId) throw apiErrors.badRequest("Нельзя написать самому себе");

  const seen = await pool.query(
    `
    select 1 from messages m
    join rooms r on r.id = m.room_id
    join community_members cm on cm.community_id = r.community_id and cm.user_id = $1
    where m.user_id = $2
    limit 1
    `,
    [body.userId, target.id],
  );
  if (!seen.rows[0]) {
    throw apiErrors.forbidden("Написать можно только тем, кто писал в чатах ваших сообществ");
  }

  const userA = Math.min(body.userId, target.id);
  const userB = Math.max(body.userId, target.id);

  const existing = await pool.query(
    `select id, status from conversations where user_a = $1 and user_b = $2`,
    [userA, userB],
  );
  if (existing.rows[0]) {
    const { id, status } = existing.rows[0];
    if (status === "declined") throw apiErrors.badRequest("Диалог с этим пользователем закрыт");
    if (status === "blocked") throw apiErrors.forbidden("Диалог недоступен");
    return { id };
  }

  if (!target.allow_dm) throw apiErrors.forbidden("Пользователь не принимает личные сообщения");

  let communityId: number | null = null;
  if (body.communityId) {
    const both = await pool.query(
      `select count(*)::int as members from community_members
       where community_id = $1 and user_id = any($2)`,
      [body.communityId, [body.userId, target.id]],
    );
    if (both.rows[0].members === 2) communityId = body.communityId;
  }

  const created = await pool.query(
    `
    insert into conversations (user_a, user_b, initiator_id, community_id)
    values ($1, $2, $3, $4)
    on conflict (user_a, user_b) do nothing
    returning *
    `,
    [userA, userB, body.userId, communityId],
  );
  const conversation = created.rows[0];
  if (!conversation) {
    const again = await pool.query(`select id from conversations where user_a = $1 and user_b = $2`, [userA, userB]);
    return { id: again.rows[0].id };
  }

  await pool.query(
    `insert into direct_messages (conversation_id, sender_id, text, attachment) values ($1, $2, $3, $4)`,
    [conversation.id, body.userId, body.text, body.attachment ?? null],
  );

  notifyUpdate(conversation);
  return { id: conversation.id };
};

export const listDirectMessagesService = async (conversationId: number, userId: number) => {
  await getConversation(conversationId, userId);
  const result = await pool.query(
    `
    select
      dm.id, dm.text, dm.attachment, dm.created_at, (dm.sender_id = $2) as mine,
      (
        dm.sender_id = $2
        and dm.id <= case when c.user_a = $2 then c.user_b_read_id else c.user_a_read_id end
      ) as read
    from (
      select * from direct_messages where conversation_id = $1 order by id desc limit 200
    ) dm
    join conversations c on c.id = $1
    order by dm.id asc
    `,
    [conversationId, userId],
  );
  return result.rows;
};

export const sendDirectMessageService = async (
  conversationId: number,
  userId: number,
  text: string,
  attachment?: string,
) => {
  assertMessageRate(userId);
  assertNoBannedWords(text);
  assertOwnAttachment(attachment);

  const conversation = await getConversation(conversationId, userId);

  if (conversation.status === "declined") throw apiErrors.badRequest("Диалог закрыт");
  if (conversation.status === "blocked") {
    throw apiErrors.forbidden(
      conversation.blocked_by === userId
        ? "Сначала разблокируйте собеседника"
        : "Диалог недоступен",
    );
  }
  if (conversation.status === "pending") {
    if (conversation.initiator_id !== userId) {
      throw apiErrors.forbidden("Сначала примите запрос на переписку");
    }
    throw apiErrors.forbidden("Дождитесь ответа: собеседник ещё не принял запрос");
  }

  const inserted = await pool.query(
    `
    insert into direct_messages (conversation_id, sender_id, text, attachment)
    values ($1, $2, $3, $4)
    returning id, text, attachment, created_at
    `,
    [conversationId, userId, text, attachment ?? null],
  );
  await pool.query(`update conversations set updated_at = now() where id = $1`, [conversationId]);

  const message = inserted.rows[0];
  const io = getIO();
  if (io) {
    io.to(userChannel(userId)).emit("dm:message", { conversationId, ...message, mine: true, read: false });
    io.to(userChannel(otherUserId(conversation, userId))).emit("dm:message", {
      conversationId,
      ...message,
      mine: false,
      read: false,
    });
  }

  return { ...message, mine: true, read: false };
};

export const acceptConversationService = async (conversationId: number, userId: number) => {
  const conversation = await getConversation(conversationId, userId);
  if (conversation.status !== "pending" || conversation.initiator_id === userId) {
    throw apiErrors.badRequest("Запрос нельзя принять");
  }
  await pool.query(
    `update conversations set status = 'accepted', updated_at = now() where id = $1`,
    [conversationId],
  );
  notifyUpdate(conversation);
};

export const declineConversationService = async (conversationId: number, userId: number) => {
  const conversation = await getConversation(conversationId, userId);
  if (conversation.status !== "pending" || conversation.initiator_id === userId) {
    throw apiErrors.badRequest("Запрос нельзя отклонить");
  }
  await pool.query(
    `update conversations set status = 'declined', updated_at = now() where id = $1`,
    [conversationId],
  );
  notifyUpdate(conversation);
};

export const blockConversationService = async (conversationId: number, userId: number) => {
  const conversation = await getConversation(conversationId, userId);
  if (conversation.status !== "accepted") {
    throw apiErrors.badRequest("Заблокировать можно только начатый диалог");
  }
  await pool.query(
    `update conversations set status = 'blocked', blocked_by = $2, updated_at = now() where id = $1`,
    [conversationId, userId],
  );
  notifyUpdate(conversation);
};

export const unblockConversationService = async (conversationId: number, userId: number) => {
  const conversation = await getConversation(conversationId, userId);
  if (conversation.status !== "blocked" || conversation.blocked_by !== userId) {
    throw apiErrors.badRequest("Диалог не заблокирован вами");
  }
  await pool.query(
    `update conversations set status = 'accepted', blocked_by = null, updated_at = now() where id = $1`,
    [conversationId],
  );
  notifyUpdate(conversation);
};

export const markConversationReadService = async (conversationId: number, userId: number) => {
  const conversation = await getConversation(conversationId, userId);
  await pool.query(
    `
    update conversations c set
      user_a_read_id = case when c.user_a = $2 then m.last_id else c.user_a_read_id end,
      user_b_read_id = case when c.user_b = $2 then m.last_id else c.user_b_read_id end
    from (
      select coalesce(max(id), 0) as last_id from direct_messages where conversation_id = $1
    ) m
    where c.id = $1
    `,
    [conversationId, userId],
  );

  getIO()
    ?.to(userChannel(otherUserId(conversation, userId)))
    .emit("dm:read", { conversationId });
};
