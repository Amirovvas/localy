import { pool } from "../plugins/pg";
import { apiErrors } from "../utils/apiErrors";

interface IReportBody {
  reason: string;
  comment: string;
}

// короткая запись в историю действий модератора по жалобе
const addReportEvent = async (reportId: number, text: string) => {
  await pool.query(`insert into report_events (report_id, text) values ($1, $2)`, [
    reportId,
    text,
  ]);
};

export const reportMessageService = async (
  messageId: number,
  reporterId: number,
  body: IReportBody,
) => {
  const found = await pool.query(
    `
    select m.user_id, m.text, m.attachment, m.room_id, r.community_id
    from messages m
    join rooms r on r.id = m.room_id
    where m.id = $1
    `,
    [messageId],
  );
  const message = found.rows[0];
  if (!message) throw apiErrors.notFound("Сообщение не найдено");

  if (message.user_id === reporterId) {
    throw apiErrors.badRequest("Нельзя пожаловаться на своё сообщение");
  }

  // один пользователь — одна жалоба на сообщение (unique в таблице), повторный
  // клик не должен плодить дубликаты у модераторов
  const inserted = await pool.query(
    `
    insert into reports (
      message_id, room_id, community_id, reporter_id, reported_user_id,
      message_text, message_attachment, reason, comment
    )
    values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    on conflict (reporter_id, message_id) do nothing
    returning id
    `,
    [
      messageId,
      message.room_id,
      message.community_id,
      reporterId,
      message.user_id,
      message.text,
      message.attachment,
      body.reason,
      body.comment,
    ],
  );

  if (inserted.rowCount === 0) {
    throw apiErrors.conflict("Вы уже отправили жалобу на это сообщение");
  }

  const reportId = inserted.rows[0].id;
  await addReportEvent(reportId, "Жалоба создана");

  // reporter_id наружу не отдаём: жалоба анонимна и для автора сообщения
  return { id: reportId };
};

// ---- Admin Panel: модерация жалоб ----

const SELECT_REPORT = `
  select
    r.id, r.reason, r.comment, r.status, r.message_text, r.message_attachment,
    r.message_deleted, r.created_at,
    ru.anon_id as reporter_anon_id,
    au.anon_id as author_anon_id, au.is_blocked as author_blocked,
    r.reported_user_id,
    c.id as community_id, c.name as community_name,
    rm.id as room_id, rm.name as room_name
  from reports r
  left join users ru on ru.id = r.reporter_id
  left join users au on au.id = r.reported_user_id
  left join communities c on c.id = r.community_id
  left join rooms rm on rm.id = r.room_id
`;

export const listReportsService = async (status?: string) => {
  const params: any[] = [];
  let where = "";
  if (status) {
    params.push(status);
    where = `where r.status = $1`;
  }

  const result = await pool.query(
    `${SELECT_REPORT} ${where} order by r.created_at desc`,
    params,
  );
  return result.rows;
};

const getReportRow = async (id: number) => {
  const result = await pool.query(`${SELECT_REPORT} where r.id = $1`, [id]);
  if (!result.rows[0]) throw apiErrors.notFound("Жалоба не найдена");
  return result.rows[0];
};

// 1 сообщение до и 1 после — для блока "Контекст переписки". Сообщение из
// самой жалобы могло быть уже удалено, поэтому якорем служит время создания
// жалобы, а не самого сообщения
export const getReportContextService = async (id: number) => {
  const report = await getReportRow(id);
  if (!report.room_id) return { before: null, after: null };

  const anchor = report.created_at;
  const [before, after] = await Promise.all([
    pool.query(
      `
      select m.text, m.attachment, u.anon_id
      from messages m join users u on u.id = m.user_id
      where m.room_id = $1 and m.created_at < $2
      order by m.created_at desc limit 1
      `,
      [report.room_id, anchor],
    ),
    pool.query(
      `
      select m.text, m.attachment, u.anon_id
      from messages m join users u on u.id = m.user_id
      where m.room_id = $1 and m.created_at > $2
      order by m.created_at asc limit 1
      `,
      [report.room_id, anchor],
    ),
  ]);

  return { before: before.rows[0] ?? null, after: after.rows[0] ?? null };
};

export const listReportEventsService = async (reportId: number) => {
  const result = await pool.query(
    `select id, text, created_at from report_events where report_id = $1 order by created_at desc`,
    [reportId],
  );
  return result.rows;
};

const STATUS_EVENT_TEXT: Record<string, string> = {
  pending: "Жалоба возвращена в новые",
  reviewing: "Жалоба взята на рассмотрение",
  resolved: "Жалоба отмечена как рассмотренная",
  dismissed: "Жалоба отклонена",
};

export const updateReportStatusService = async (id: number, status: string) => {
  const result = await pool.query(
    `update reports set status = $2 where id = $1 returning id`,
    [id, status],
  );
  if (!result.rows[0]) throw apiErrors.notFound("Жалоба не найдена");

  await addReportEvent(id, STATUS_EVENT_TEXT[status] ?? `Статус изменён на «${status}»`);
  return getReportRow(id);
};

export const deleteReportService = async (id: number) => {
  // report_events удалится каскадом
  const result = await pool.query(`delete from reports where id = $1 returning id`, [id]);
  if (!result.rows[0]) throw apiErrors.notFound("Жалоба не найдена");
  return result.rows[0];
};

export const deleteReportedMessageService = async (id: number) => {
  const report = await pool.query(`select message_id from reports where id = $1`, [id]);
  if (!report.rows[0]) throw apiErrors.notFound("Жалоба не найдена");

  // сообщение могли уже удалить (сам автор, или по другой жалобе на него) —
  // это не ошибка, просто помечаем жалобу как есть
  await pool.query(`delete from messages where id = $1`, [report.rows[0].message_id]);
  await pool.query(`update reports set message_deleted = true where id = $1`, [id]);
  await addReportEvent(id, "Сообщение удалено администратором");

  return getReportRow(id);
};

export const blockReportAuthorService = async (id: number) => {
  const report = await getReportRow(id);
  if (!report.reported_user_id) {
    throw apiErrors.badRequest("Автор сообщения не найден (аккаунт уже удалён)");
  }

  await pool.query(`update users set is_blocked = true where id = $1`, [report.reported_user_id]);
  await addReportEvent(id, `Пользователь Аноним #${report.author_anon_id} заблокирован`);
  return getReportRow(id);
};

export const unblockReportAuthorService = async (id: number) => {
  const report = await getReportRow(id);
  if (!report.reported_user_id) {
    throw apiErrors.badRequest("Автор сообщения не найден (аккаунт уже удалён)");
  }

  await pool.query(`update users set is_blocked = false where id = $1`, [report.reported_user_id]);
  await addReportEvent(id, `Пользователь Аноним #${report.author_anon_id} разблокирован`);
  return getReportRow(id);
};
