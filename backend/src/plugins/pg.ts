import { Pool } from "pg";
import { generateUniqueAnonId } from "../utils/anonId";
import { PLACES } from "../data/places";

const WARM_CONNECTIONS = 4;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,
  keepAlive: true,
  idleTimeoutMillis: 120_000,
});

const warmUpPool = () =>
  Promise.all(Array.from({ length: WARM_CONNECTIONS }, () => pool.query("select 1"))).catch(
    () => undefined,
  );

warmUpPool();
setInterval(warmUpPool, 20_000).unref();

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

  await pool.query(`
    alter table users add column if not exists anon_id integer
  `);
  await pool.query(`
    alter table users add column if not exists is_admin boolean not null default false
  `);
  await pool.query(`
    alter table users add column if not exists is_blocked boolean not null default false
  `);
  await pool.query(`
    create unique index if not exists users_anon_id_idx on users(anon_id)
  `);
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
  await pool.query(`
    alter table communities
      add column if not exists status text not null default 'active'
      check (status in ('active', 'pending', 'archived'))
  `);
  await pool.query(`alter table communities drop constraint if exists communities_category_check`);
  await pool.query(`
    alter table communities add constraint communities_category_check
      check (category in ('university', 'school', 'district', 'residential', 'city'))
  `);

  await pool.query(`
    create table if not exists community_members (
      id serial primary key,
      user_id integer not null references users(id) on delete cascade,
      community_id integer not null references communities(id) on delete cascade,
      joined_at timestamptz not null default now(),
      unique (user_id, community_id)
    )
  `);

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

  await pool.query(`
    alter table events
      add column if not exists created_by integer references users(id) on delete cascade
  `);

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
  await pool.query(`
    alter table messages
      add column if not exists reply_to_id integer references messages(id) on delete set null
  `);
  await pool.query(`
    alter table messages add column if not exists edited_at timestamptz
  `);
  await pool.query(`
    alter table messages add column if not exists pinned_at timestamptz
  `);
  await pool.query(`alter table messages add column if not exists forwarded_from text`);
  await pool.query(`
    create index if not exists messages_room_id_pinned_at_idx
      on messages(room_id, pinned_at) where pinned_at is not null
  `);

  await pool.query(`
    create table if not exists room_reads (
      user_id integer not null references users(id) on delete cascade,
      room_id integer not null references rooms(id) on delete cascade,
      last_read_message_id integer not null default 0,
      primary key (user_id, room_id)
    )
  `);

  await pool.query(`
    create table if not exists message_reactions (
      message_id integer not null references messages(id) on delete cascade,
      user_id integer not null references users(id) on delete cascade,
      emoji text not null,
      created_at timestamptz not null default now(),
      primary key (message_id, user_id, emoji)
    )
  `);
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
  await pool.query(`alter table reports drop constraint if exists reports_reporter_id_kind_message_id_key`);
  await pool.query(`alter table reports drop column if exists kind`);
  await pool.query(`
    create unique index if not exists reports_reporter_id_message_id_idx
      on reports(reporter_id, message_id)
  `);
  await pool.query(`alter table reports drop constraint if exists reports_status_check`);
  await pool.query(`
    update reports set status = 'dismissed' where status = 'rejected'
  `);
  await pool.query(`
    alter table reports add constraint reports_status_check
      check (status in ('pending', 'reviewing', 'resolved', 'dismissed'))
  `);
  await pool.query(`
    alter table reports add column if not exists room_id integer references rooms(id) on delete set null
  `);
  await pool.query(`
    alter table reports add column if not exists message_deleted boolean not null default false
  `);

  await pool.query(`
    create table if not exists report_events (
      id serial primary key,
      report_id integer not null references reports(id) on delete cascade,
      text text not null,
      created_at timestamptz not null default now()
    )
  `);

  await pool.query(`
    create table if not exists message_clears (
      user_id integer not null references users(id) on delete cascade,
      room_id integer not null references rooms(id) on delete cascade,
      cleared_at timestamptz not null default now(),
      primary key (user_id, room_id)
    )
  `);

  await pool.query(`
    create index if not exists community_members_community_id_idx on community_members(community_id)
  `);
  await pool.query(`
    create index if not exists messages_room_id_id_idx on messages(room_id, id)
  `);
  await pool.query(`
    create index if not exists messages_reply_to_id_idx on messages(reply_to_id) where reply_to_id is not null
  `);
  await pool.query(`
    create index if not exists messages_user_id_idx on messages(user_id)
  `);
  await pool.query(`
    create index if not exists messages_attachment_idx on messages(attachment) where attachment is not null
  `);
  await pool.query(`
    create index if not exists message_reactions_user_id_idx on message_reactions(user_id)
  `);

  await pool.query(`alter table users add column if not exists allow_dm boolean not null default true`);
  await pool.query(`
    create table if not exists conversations (
      id serial primary key,
      user_a integer not null references users(id) on delete cascade,
      user_b integer not null references users(id) on delete cascade,
      initiator_id integer not null references users(id) on delete cascade,
      status text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'blocked')),
      blocked_by integer references users(id) on delete set null,
      community_id integer references communities(id) on delete set null,
      user_a_read_id integer not null default 0,
      user_b_read_id integer not null default 0,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      check (user_a < user_b),
      unique (user_a, user_b)
    )
  `);
  await pool.query(`create index if not exists conversations_user_b_idx on conversations(user_b)`);
  await pool.query(`
    create table if not exists direct_messages (
      id serial primary key,
      conversation_id integer not null references conversations(id) on delete cascade,
      sender_id integer not null references users(id) on delete cascade,
      text text not null,
      created_at timestamptz not null default now()
    )
  `);
  await pool.query(`alter table direct_messages add column if not exists attachment text`);
  await pool.query(`
    create index if not exists direct_messages_conversation_id_id_idx
      on direct_messages(conversation_id, id)
  `);

  const dateColumns = [
    ["users", "created_at"],
    ["users", "updated_at"],
    ["communities", "created_at"],
    ["community_members", "joined_at"],
    ["rooms", "created_at"],
    ["events", "starts_at"],
    ["events", "created_at"],
    ["messages", "created_at"],
  ];
  const oldDateColumns = await pool.query(
    `
    select table_name, column_name from information_schema.columns
    where table_schema = 'public' and data_type = 'timestamp without time zone'
    `,
  );
  for (const [table, column] of dateColumns) {
    const isOld = oldDateColumns.rows.some(
      (row) => row.table_name === table && row.column_name === column,
    );
    if (isOld) {
      await pool.query(
        `alter table ${table} alter column ${column} type timestamptz using ${column} at time zone 'UTC'`,
      );
    }
  }
  await pool.query(`drop table if exists location_messages cascade`);
  await pool.query(`drop table if exists locations cascade`);

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

  await pool.query(`
    insert into communities (name, category, city, description) values
      ('КНУ им. Ж. Баласагына', 'university', 'Бишкек', 'Сообщество студентов и сотрудников Кыргызского национального университета им. Ж. Баласагына.'),
      ('КГТУ им. И. Раззакова', 'university', 'Бишкек', 'Сообщество студентов и сотрудников Кыргызского государственного технического университета им. И. Раззакова.'),
      ('КГМА им. И.К. Ахунбаева', 'university', 'Бишкек', 'Сообщество студентов и сотрудников Кыргызской государственной медицинской академии им. И.К. Ахунбаева.'),
      ('БГУ им. К. Карасаева', 'university', 'Бишкек', 'Сообщество студентов и сотрудников Бишкекского гуманитарного университета им. К. Карасаева.'),
      ('КЭУ им. М. Рыскулбекова', 'university', 'Бишкек', 'Сообщество студентов и сотрудников Кыргызского экономического университета им. М. Рыскулбекова.'),
      ('МУК', 'university', 'Бишкек', 'Сообщество студентов и сотрудников Международного университета Кыргызстана.'),
      ('КГЮА', 'university', 'Бишкек', 'Сообщество студентов и сотрудников Кыргызской государственной юридической академии.'),
      ('Кыргызско-Турецкий университет «Манас»', 'university', 'Бишкек', 'Сообщество студентов и сотрудников университета «Манас».'),
      ('Университет «Ала-Тоо»', 'university', 'Бишкек', 'Сообщество студентов и сотрудников университета «Ала-Тоо».'),
      ('Кыргызская национальная консерватория им. Т. Сатылганова', 'university', 'Бишкек', 'Сообщество студентов и сотрудников консерватории им. Т. Сатылганова.'),
      ('Финансово-экономический колледж при КЭУ', 'university', 'Бишкек', 'Сообщество студентов и сотрудников колледжа при КЭУ.'),
      ('Медицинский колледж КГМА', 'university', 'Бишкек', 'Сообщество студентов и сотрудников медицинского колледжа КГМА.'),
      ('Политехнический колледж КГТУ', 'university', 'Бишкек', 'Сообщество студентов и сотрудников политехнического колледжа КГТУ.'),

      ('Гимназия №5', 'school', 'Бишкек', 'Сообщество учеников, родителей и учителей гимназии №5.'),
      ('Гимназия №13', 'school', 'Бишкек', 'Сообщество учеников, родителей и учителей гимназии №13.'),
      ('Гимназия №24', 'school', 'Бишкек', 'Сообщество учеников, родителей и учителей гимназии №24.'),
      ('Гимназия №28', 'school', 'Бишкек', 'Сообщество учеников, родителей и учителей гимназии №28.'),
      ('Гимназия №1', 'school', 'Бишкек', 'Сообщество учеников, родителей и учителей гимназии №1.'),
      ('Кыргызско-турецкая гимназия «Сапат»', 'school', 'Бишкек', 'Сообщество учеников, родителей и учителей гимназии «Сапат».'),
      ('Английская гимназия №2', 'school', 'Бишкек', 'Сообщество учеников, родителей и учителей английской гимназии №2.'),
      ('Гимназия «Билим-Компьютер»', 'school', 'Бишкек', 'Сообщество учеников, родителей и учителей гимназии «Билим-Компьютер».'),
      ('Лицей-школа №61', 'school', 'Бишкек', 'Сообщество учеников, родителей и учителей лицея-школы №61.'),
      ('Silk Road International School', 'school', 'Бишкек', 'Сообщество учеников, родителей и учителей Silk Road International School.'),

      ('ЖК «Радуга»', 'residential', 'Бишкек', 'Сообщество жильцов жилого комплекса «Радуга».'),
      ('ЖК «Кристалл»', 'residential', 'Бишкек', 'Сообщество жильцов жилого комплекса «Кристалл».'),
      ('ЖК «Асман Парк»', 'residential', 'Бишкек', 'Сообщество жильцов жилого комплекса «Асман Парк».'),
      ('ЖК «Golden Park»', 'residential', 'Бишкек', 'Сообщество жильцов жилого комплекса «Golden Park».'),
      ('ЖК «Каскад»', 'residential', 'Бишкек', 'Сообщество жильцов жилого комплекса «Каскад».'),
      ('ЖК «Мегаполис»', 'residential', 'Бишкек', 'Сообщество жильцов жилого комплекса «Мегаполис».'),
      ('ЖК «Достук Резиденс»', 'residential', 'Бишкек', 'Сообщество жильцов жилого комплекса «Достук Резиденс».'),
      ('ЖК «Verona»', 'residential', 'Бишкек', 'Сообщество жильцов жилого комплекса «Verona».'),
      ('ЖК «Элит Хаус»', 'residential', 'Бишкек', 'Сообщество жильцов жилого комплекса «Элит Хаус».'),
      ('ЖК «Ынтымак»', 'residential', 'Бишкек', 'Сообщество жильцов жилого комплекса «Ынтымак».'),

      ('Свердловский район', 'district', 'Бишкек', 'Официальное сообщество для жителей Свердловского района.'),
      ('Ленинский район', 'district', 'Бишкек', 'Официальное сообщество для жителей Ленинского района.')
    on conflict (name) do nothing
  `);
  await pool.query(`alter table communities add column if not exists lat double precision`);
  await pool.query(`alter table communities add column if not exists lng double precision`);

  await pool.query(
    `
    insert into communities (name, category, city, description, lat, lng)
    select p.name, p.category, 'Бишкек',
      case p.category
        when 'school' then 'Сообщество учеников, родителей и учителей — ' || p.name || '.'
        when 'university' then 'Сообщество студентов и сотрудников — ' || p.name || '.'
        when 'district' then 'Сообщество жителей — ' || p.name || '.'
        else 'Сообщество жильцов — ' || p.name || '.'
      end,
      p.lat, p.lng
    from unnest($1::text[], $2::text[], $3::float8[], $4::float8[]) as p(name, category, lat, lng)
    on conflict (name) do nothing
    `,
    [PLACES.map((p) => p[0]), PLACES.map((p) => p[1]), PLACES.map((p) => p[2]), PLACES.map((p) => p[3])],
  );

  await pool.query(`
    insert into rooms (community_id, name, description, position)
    select c.id, r.name, r.description, r.position
    from communities c
    join (values
      ('общее', 'Общий чат. Будьте вежливы и уважайте других.', 0),
      ('объявления', 'Официальные объявления.', 1),
      ('события', 'Обсуждение мероприятий и планов.', 2),
      ('бюро находок', 'Нашли или потеряли вещь? Пишите здесь.', 3),
      ('мемы', 'Мемы и шутки.', 4)
    ) as r(name, description, position) on true
    where c.category != 'city'
    on conflict (community_id, name) do nothing
  `);

  await pool.query(`
    insert into communities (name, category, city, description) values
      ('Бишкек', 'city', 'Бишкек', 'Общий чат для всех жителей города Бишкек.'),
      ('Ош', 'city', 'Ош', 'Общий чат для всех жителей города Ош.'),
      ('Джалал-Абад', 'city', 'Джалал-Абад', 'Общий чат для всех жителей города Джалал-Абад.'),
      ('Каракол', 'city', 'Каракол', 'Общий чат для всех жителей города Каракол.'),
      ('Токмок', 'city', 'Токмок', 'Общий чат для всех жителей города Токмок.'),
      ('Кара-Балта', 'city', 'Кара-Балта', 'Общий чат для всех жителей города Кара-Балта.'),
      ('Нарын', 'city', 'Нарын', 'Общий чат для всех жителей города Нарын.'),
      ('Талас', 'city', 'Талас', 'Общий чат для всех жителей города Талас.'),
      ('Баткен', 'city', 'Баткен', 'Общий чат для всех жителей города Баткен.'),
      ('Кант', 'city', 'Кант', 'Общий чат для всех жителей города Кант.')
    on conflict (name) do nothing
  `);
  await pool.query(`
    insert into rooms (community_id, name, description, position)
    select c.id, r.name, replace(r.description, '{city}', c.name), r.position
    from communities c
    join (values
      ('общее', 'Общий чат для всех жителей города {city}.', 0),
      ('объявления', 'Официальные объявления и новости города {city}.', 1),
      ('события', 'Городские мероприятия, ярмарки и концерты — город {city}.', 2)
    ) as r(name, description, position) on true
    where c.category = 'city'
    on conflict (community_id, name) do nothing
  `);
  await pool.query(`
    insert into community_members (user_id, community_id)
    select u.id, c.id
    from users u
    join communities c on c.category = 'city' and c.name = u.city
    on conflict (user_id, community_id) do nothing
  `);

  await pool.query(`alter table communities add column if not exists lat double precision`);
  await pool.query(`alter table communities add column if not exists lng double precision`);
  await pool.query(`
    update communities c set lat = g.lat, lng = g.lng
    from (values
      ('AUCA', 42.81169, 74.62708),
      ('КРСУ', 42.87341, 74.61407),
      ('КНУ им. Ж. Баласагына', 42.88132, 74.58892),
      ('КГМА им. И.К. Ахунбаева', 42.84215, 74.60686),
      ('КЭУ им. М. Рыскулбекова', 42.82126, 74.62508),
      ('МУК', 42.87717, 74.58527),
      ('Кыргызско-Турецкий университет «Манас»', 42.83503, 74.57589),
      ('Университет «Ала-Тоо»', 42.85574, 74.67773),
      ('Кыргызская национальная консерватория им. Т. Сатылганова', 42.84579, 74.61283),
      ('Финансово-экономический колледж при КЭУ', 42.82126, 74.62508),
      ('Медицинский колледж КГМА', 42.84215, 74.60686),
      ('КГТУ им. И. Раззакова', 42.84423, 74.58905),
      ('Политехнический колледж КГТУ', 42.84423, 74.58905),
      ('БГУ им. К. Карасаева', 42.85035, 74.58508),
      ('КГЮА', 42.87636, 74.57977),
      ('Кыргызско-турецкая гимназия «Сапат»', 42.81552, 74.63876),
      ('Гимназия №1', 42.8745, 74.6020),
      ('Гимназия №13', 42.8560, 74.5920),
      ('Гимназия №28', 42.8830, 74.6100),
      ('Английская гимназия №2', 42.8690, 74.5990),
      ('Гимназия «Билим-Компьютер»', 42.8600, 74.6300),
      ('Лицей-школа №61', 42.8700, 74.5500),
      ('ЖК «Скай Парк»', 42.8350, 74.6050),
      ('ЖК «Гагарин Резиденс»', 42.8440, 74.6220),
      ('ЖК «Golden Park»', 42.8300, 74.5900),
      ('ЖК «Verona»', 42.8800, 74.5700),
      ('ЖК «Асман Парк»', 42.8200, 74.6100),
      ('ЖК «Достук Резиденс»', 42.8630, 74.6200),
      ('ЖК «Каскад»', 42.8530, 74.6050),
      ('ЖК «Кристалл»', 42.8750, 74.6150),
      ('ЖК «Радуга»', 42.8860, 74.5900),
      ('ЖК «Элит Хаус»', 42.8480, 74.5750),
      ('ЖК «Ынтымак»', 42.8250, 74.5800),
      ('Гимназия №70', 42.86814, 74.58910),
      ('Гимназия №5', 42.87098, 74.61397),
      ('Гимназия №24', 42.87392, 74.60850),
      ('Bishkek International School', 42.85389, 74.58041),
      ('Silk Road International School', 42.81727, 74.62989),
      ('Октябрьский район', 42.85116, 74.61548),
      ('Первомайский район', 42.89657, 74.58041),
      ('Свердловский район', 42.84000, 74.58000),
      ('Ленинский район', 42.87000, 74.57000),
      ('ЖК «Мегаполис»', 42.82199, 74.59586)
    ) as g(name, lat, lng)
    where c.name = g.name and c.lat is null
  `);

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
