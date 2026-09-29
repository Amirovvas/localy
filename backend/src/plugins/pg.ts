import { Pool } from "pg";
import { generateUniqueAnonId } from "../utils/anonId";

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

pool.connect().then(async () => {
  console.log(`DB connected`);

  await pool.query(`
    create table if not exists users (
      id serial primary key,
      name varchar(100) not null,
      email varchar(255) unique not null,
      password text not null,
      city text not null,
      avatar text default '',
      refresh_token text,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `);

  // анонимный номер — виден другим участникам чата вместо имени/почты
  await pool.query(`
    alter table users add column if not exists anon_id integer
  `);
  // is_admin — доступ к Admin Panel; is_blocked — забанен модератором и не
  // может логиниться / писать сообщения (проверяется в authMiddleware)
  await pool.query(`
    alter table users add column if not exists is_admin boolean not null default false
  `);
  await pool.query(`
    alter table users add column if not exists is_blocked boolean not null default false
  `);
  await pool.query(`
    create unique index if not exists users_anon_id_idx on users(anon_id)
  `);
  // бэкфилл для пользователей, заведённых до этой миграции
  const usersWithoutAnonId = await pool.query(
    `select id from users where anon_id is null`,
  );
  for (const row of usersWithoutAnonId.rows) {
    const anonId = await generateUniqueAnonId(pool);
    await pool.query(`update users set anon_id = $1 where id = $2`, [
      anonId,
      row.id,
    ]);
  }

  // 4 категории сообществ Localy — совпадают с CommunityCategory на фронте
  await pool.query(`
    create table if not exists communities (
      id serial primary key,
      name text not null unique,
      category text not null check (category in ('university', 'school', 'district', 'residential')),
      city text not null,
      description text default '',
      created_at timestamptz not null default now()
    )
  `);
  // модерация сообществ в Admin Panel: pending — новое, ждёт проверки,
  // active — видно всем при регистрации/поиске, archived — скрыто
  await pool.query(`
    alter table communities
      add column if not exists status text not null default 'active'
      check (status in ('active', 'pending', 'archived'))
  `);

  // связь пользователь <-> сообщество, на которое он подписан при регистрации
  await pool.query(`
    create table if not exists community_members (
      id serial primary key,
      user_id integer not null references users(id) on delete cascade,
      community_id integer not null references communities(id) on delete cascade,
      joined_at timestamptz not null default now(),
      unique (user_id, community_id)
    )
  `);

  // комнаты внутри сообщества ("# общее", "# объявления"...)
  await pool.query(`
    create table if not exists rooms (
      id serial primary key,
      community_id integer not null references communities(id) on delete cascade,
      name text not null,
      description text default '',
      position integer not null default 0,
      created_at timestamptz not null default now(),
      unique (community_id, name)
    )
  `);

  // события сообщества
  await pool.query(`
    create table if not exists events (
      id serial primary key,
      community_id integer not null references communities(id) on delete cascade,
      title text not null,
      place text default '',
      starts_at timestamptz not null,
      joining_count integer not null default 0,
      created_at timestamptz not null default now(),
      unique (community_id, title)
    )
  `);

  // кто создал событие: в "Предстоящие события" каждый видит только свои
  await pool.query(`
    alter table events
      add column if not exists created_by integer references users(id) on delete cascade
  `);

  // сообщения в комнатах — автор виден другим только как anon_id (users.anon_id),
  // реальные имя/почта в API сообщений не отдаются
  await pool.query(`
    create table if not exists messages (
      id serial primary key,
      room_id integer not null references rooms(id) on delete cascade,
      user_id integer not null references users(id) on delete cascade,
      text text not null,
      attachment text,
      is_announcement boolean not null default false,
      created_at timestamptz not null default now()
    )
  `);
  await pool.query(`
    create index if not exists messages_room_id_created_at_idx
      on messages(room_id, created_at)
  `);
  // ответ на конкретное сообщение; при удалении оригинала ответ остаётся,
  // просто без цитаты (on delete set null)
  await pool.query(`
    alter table messages
      add column if not exists reply_to_id integer references messages(id) on delete set null
  `);

  // реакции: один пользователь — одна запись на (сообщение, эмодзи), повторный
  // клик снимает реакцию
  await pool.query(`
    create table if not exists message_reactions (
      message_id integer not null references messages(id) on delete cascade,
      user_id integer not null references users(id) on delete cascade,
      emoji text not null,
      created_at timestamptz not null default now(),
      primary key (message_id, user_id, emoji)
    )
  `);
  // жалобы на сообщения. message_id намеренно БЕЗ внешнего ключа: если автор
  // удалит сообщение, модератор всё равно должен видеть, на что жаловались —
  // поэтому текст сообщения и автор сохраняются снимком в момент жалобы
  await pool.query(`
    create table if not exists reports (
      id serial primary key,
      message_id integer not null,
      community_id integer references communities(id) on delete cascade,
      reporter_id integer not null references users(id) on delete cascade,
      reported_user_id integer references users(id) on delete set null,
      message_text text not null default '',
      message_attachment text,
      reason text not null check (reason in ('spam', 'abuse', 'inappropriate', 'other')),
      comment text not null default '',
      status text not null default 'pending' check (status in ('pending', 'reviewing', 'resolved', 'dismissed')),
      created_at timestamptz not null default now()
    )
  `);
  await pool.query(`
    create index if not exists reports_status_created_at_idx
      on reports(status, created_at desc)
  `);
  // раньше жалобы были и на сообщения локаций — колонка kind и старый
  // составной unique больше не нужны, один пользователь — одна жалоба на сообщение
  await pool.query(`alter table reports drop constraint if exists reports_reporter_id_kind_message_id_key`);
  await pool.query(`alter table reports drop column if exists kind`);
  await pool.query(`
    create unique index if not exists reports_reporter_id_message_id_idx
      on reports(reporter_id, message_id)
  `);
  // старые статусы 'rejected' были переименованы в 'dismissed', 'new' в мок-панели
  // соответствует 'pending' здесь; расширяем check под "взять на рассмотрение"
  await pool.query(`alter table reports drop constraint if exists reports_status_check`);
  await pool.query(`
    update reports set status = 'dismissed' where status = 'rejected'
  `);
  await pool.query(`
    alter table reports add constraint reports_status_check
      check (status in ('pending', 'reviewing', 'resolved', 'dismissed'))
  `);
  // room_id — снимок на момент жалобы: если сообщение потом удалят (сам автор
  // или админ), мы всё равно знаем, в какой комнате была переписка
  await pool.query(`
    alter table reports add column if not exists room_id integer references rooms(id) on delete set null
  `);
  // помечаем, что сообщение удалено из этой жалобы — сам текст остаётся в
  // message_text как снимок, но показывается с пометкой "удалено"
  await pool.query(`
    alter table reports add column if not exists message_deleted boolean not null default false
  `);

  // история действий модератора по жалобе — короткий лог для панели "Жалобы"
  await pool.query(`
    create table if not exists report_events (
      id serial primary key,
      report_id integer not null references reports(id) on delete cascade,
      text text not null,
      created_at timestamptz not null default now()
    )
  `);

  // "очистить чат у себя": для каждого (пользователь, комната) запоминаем
  // момент очистки — при загрузке сообщений всё, что было до него, этому
  // пользователю не отдаём. У остальных участников комнаты ничего не меняется
  await pool.query(`
    create table if not exists message_clears (
      user_id integer not null references users(id) on delete cascade,
      room_id integer not null references rooms(id) on delete cascade,
      cleared_at timestamptz not null default now(),
      primary key (user_id, room_id)
    )
  `);

  // "timestamp without time zone" хранит наивное значение: при записи оно
  // молча приводится к wall-clock текущей сессии (у нас UTC), а вот
  // node-postgres при ЧТЕНИИ такой колонки интерпретирует её как локальное
  // время ПРОЦЕССА Node.js, а не UTC. Если процесс запущен не в UTC (как
  // здесь), даты на фронте уезжают на разницу поясов. timestamptz хранит и
  // передаёт абсолютный instant, такой проблемы не создаёт — конвертируем
  // все datetime-колонки один раз; для уже timestamptz-колонок операция
  // идемпotентна (AT TIME ZONE 'UTC' на timestamptz -> naive UTC -> обратно
  // в timestamptz даёт тот же instant)
  await pool.query(`
    alter table users
      alter column created_at type timestamptz using created_at at time zone 'UTC',
      alter column updated_at type timestamptz using updated_at at time zone 'UTC'
  `);
  await pool.query(`
    alter table communities
      alter column created_at type timestamptz using created_at at time zone 'UTC'
  `);
  await pool.query(`
    alter table community_members
      alter column joined_at type timestamptz using joined_at at time zone 'UTC'
  `);
  await pool.query(`
    alter table rooms
      alter column created_at type timestamptz using created_at at time zone 'UTC'
  `);
  await pool.query(`
    alter table events
      alter column starts_at type timestamptz using starts_at at time zone 'UTC',
      alter column created_at type timestamptz using created_at at time zone 'UTC'
  `);
  await pool.query(`
    alter table messages
      alter column created_at type timestamptz using created_at at time zone 'UTC'
  `);
  // локации в чате больше не нужны — чистим таблицы, если они остались
  // с прошлой версии базы (cascade заодно удаляет их сообщения и реакции)
  await pool.query(`drop table if exists location_messages cascade`);
  await pool.query(`drop table if exists locations cascade`);

  // сидируем стартовый набор сообществ один раз — дальше их создают через
  // Admin Panel (Management -> Сообщества); on conflict do nothing делает
  // сид идемпотентным при каждом рестарте сервера
  await pool.query(`
    insert into communities (name, category, city, description) values
      ('AUCA', 'university', 'Бишкек', 'Официальное сообщество студентов и сотрудников Американского университета Центральной Азии.'),
      ('КРСУ', 'university', 'Бишкек', 'Сообщество студентов Кыргызско-Российского Славянского университета.'),
      ('Гимназия №70', 'school', 'Бишкек', 'Сообщество учеников, родителей и учителей гимназии №70.'),
      ('Bishkek International School', 'school', 'Бишкек', 'Сообщество Bishkek International School.'),
      ('Октябрьский район', 'district', 'Бишкек', 'Официальное сообщество для жителей Октябрьского района.'),
      ('Первомайский район', 'district', 'Бишкек', 'Официальное сообщество для жителей Первомайского района.'),
      ('ЖК «Скай Парк»', 'residential', 'Бишкек', 'Сообщество жильцов жилого комплекса «Скай Парк».'),
      ('ЖК «Гагарин Резиденс»', 'residential', 'Бишкек', 'Сообщество жильцов жилого комплекса «Гагарин Резиденс».')
    on conflict (name) do nothing
  `);

  // сид комнат — по названию сообщества, чтобы не зависеть от serial id
  await pool.query(`
    insert into rooms (community_id, name, description, position)
    select c.id, r.name, r.description, r.position
    from communities c
    join (values
      ('AUCA', 'общее', 'Общий чат для всех участников AUCA. Будьте вежливы и уважайте других.', 0),
      ('AUCA', 'объявления', 'Официальные объявления от администрации AUCA.', 1),
      ('AUCA', 'события', 'Обсуждение мероприятий и планов внутри университета.', 2),
      ('AUCA', 'бюро находок', 'Нашли или потеряли вещь? Пишите здесь.', 3),
      ('AUCA', 'мемы', 'Мемы и шутки про студенческую жизнь.', 4),
      ('КРСУ', 'общее', 'Общий чат для всех участников КРСУ.', 0),
      ('КРСУ', 'объявления', 'Официальные объявления от администрации КРСУ.', 1),
      ('Гимназия №70', 'общее', 'Общий чат для учеников, родителей и учителей.', 0),
      ('Гимназия №70', 'объявления', 'Официальные объявления школы.', 1),
      ('Bishkek International School', 'общее', 'Общий чат школы.', 0),
      ('Октябрьский район', 'общее', 'Общий чат для всех жителей Октябрьского района.', 0),
      ('Октябрьский район', 'объявления', 'Официальные объявления администрации района.', 1),
      ('Октябрьский район', 'барахолка', 'Покупка, продажа и обмен вещей внутри района.', 2),
      ('Октябрьский район', 'события', 'События и мероприятия района.', 3),
      ('Октябрьский район', 'соседский дозор', 'Безопасность и взаимопомощь соседей.', 4),
      ('Первомайский район', 'общее', 'Общий чат для всех жителей Первомайского района.', 0),
      ('Первомайский район', 'объявления', 'Официальные объявления администрации района.', 1),
      ('Первомайский район', 'барахолка', 'Покупка, продажа и обмен вещей внутри района.', 2),
      ('ЖК «Скай Парк»', 'общее', 'Общий чат жильцов ЖК «Скай Парк».', 0),
      ('ЖК «Скай Парк»', 'объявления', 'Объявления управляющей компании.', 1),
      ('ЖК «Гагарин Резиденс»', 'общее', 'Общий чат жильцов ЖК «Гагарин Резиденс».', 0)
    ) as r(community_name, name, description, position)
      on r.community_name = c.name
    on conflict (community_id, name) do nothing
  `);

  // сид событий — starts_at считается от полуночи (UTC) "сегодня" + смещение
  // в днях + фиксированное время суток (в UTC, чтобы на фронте в часовом
  // поясе Бишкека (+6) получались круглые 18:00 / 10:00 / 09:00 и т.д.).
  // on conflict делает update, а не nothing — даты пересчитываются от
  // текущего "сегодня" при каждом рестарте сервера, а не застывают навсегда
  // на моменте первого сидирования (иначе через несколько дней "предстоящие"
  // события оказались бы в прошлом)
  await pool.query(`
    insert into events (community_id, title, place, starts_at, joining_count)
    select c.id, e.title, e.place, date_trunc('day', now()) + e.offset, e.joining_count
    from communities c
    join (values
      ('AUCA', 'Футбольный матч', 'Спортплощадка AUCA', interval '1 day 12 hours', 24),
      ('AUCA', 'Ярмарка вакансий', 'Главный зал', interval '5 days 4 hours', 156),
      ('Октябрьский район', 'Блошиный рынок выходного дня', 'Центральный парк', interval '2 days 3 hours', 63),
      ('Первомайский район', 'Уборка двора', 'Двор, квартал 4', interval '4 days 5 hours', 19),
      ('Гимназия №70', 'Родительское собрание', 'Актовый зал', interval '3 days 11 hours 30 minutes', 40)
    ) as e(community_name, title, place, "offset", joining_count)
      on e.community_name = c.name
    on conflict (community_id, title) do update set starts_at = excluded.starts_at
  `);
});
