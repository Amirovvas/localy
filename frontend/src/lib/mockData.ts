export type CommunityId = "auca" | "oktyabrsky";
export type CommunityCategory = "university" | "school" | "district" | "residential" | "city";

export const COMMUNITY_CATEGORY_LABELS: Record<CommunityCategory, string> = {
  university: "Университеты, институты и колледжи",
  school: "Школы",
  district: "Районы",
  residential: "Жилые комплексы",
  city: "Города",
};

export interface Community {
  id: CommunityId;
  name: string;
  category: CommunityCategory;
  members: number;
  online: number;
  description: string;
}

export interface Room {
  id: string;
  name: string;
  description: string;
  unread?: number;
}

export interface LocationSpot {
  id: string;
  name: string;
  active: number;
}

export interface EventItem {
  id: string;
  title: string;
  day: number;
  month: string;
  when: string;
  place: string;
}

export interface Reaction {
  emoji: string;
  count: number;
}

export interface ChatMessage {
  id: string;
  authorId: number;
  text: string;
  time: string;
  reactions?: Reaction[];
  isAnnouncement?: boolean;
  attachment?: string;
}

export const CURRENT_USER_ID = 4821;

export const communities: Community[] = [
  {
    id: "auca",
    name: "AUCA",
    category: "university",
    members: 1240,
    online: 324,
    description:
      "Официальное сообщество студентов и сотрудников Американского университета Центральной Азии. Учёба, мероприятия и студенческая жизнь в одном месте.",
  },
  {
    id: "oktyabrsky",
    name: "Октябрьский район",
    category: "district",
    members: 8420,
    online: 1052,
    description:
      "Официальное сообщество для жителей Октябрьского района. Местные новости, события, возможности и многое другое.",
  },
];

export const roomsByCommunity: Record<CommunityId, Room[]> = {
  auca: [
    {
      id: "general",
      name: "общее",
      description: "Общий чат для всех участников AUCA. Будьте вежливы и уважайте других.",
    },
    {
      id: "announcements",
      name: "объявления",
      description: "Официальные объявления от администрации AUCA.",
      unread: 1,
    },
    {
      id: "events",
      name: "события",
      description: "Обсуждение мероприятий и планов внутри университета.",
    },
    {
      id: "lost-and-found",
      name: "бюро находок",
      description: "Нашли или потеряли вещь? Пишите здесь.",
      unread: 2,
    },
    {
      id: "memes",
      name: "мемы",
      description: "Мемы и шутки про студенческую жизнь.",
    },
  ],
  oktyabrsky: [
    {
      id: "general",
      name: "общее",
      description:
        "Общий чат для всех жителей Октябрьского района. Будьте вежливы и уважайте других.",
    },
    {
      id: "announcements",
      name: "объявления",
      description: "Официальные объявления администрации района.",
      unread: 3,
    },
    {
      id: "marketplace",
      name: "барахолка",
      description: "Покупка, продажа и обмен вещей внутри района.",
    },
    {
      id: "events",
      name: "события",
      description: "События и мероприятия района.",
    },
    {
      id: "neighbors-watch",
      name: "соседский дозор",
      description: "Безопасность и взаимопомощь соседей.",
    },
  ],
};

export const locationsByCommunity: Record<CommunityId, LocationSpot[]> = {
  auca: [
    { id: "library", name: "Библиотека", active: 42 },
    { id: "campus", name: "Кампус", active: 87 },
    { id: "cafeteria", name: "Столовая", active: 31 },
  ],
  oktyabrsky: [
    { id: "central-park", name: "Центральный парк", active: 56 },
    { id: "metro-station", name: "Станция метро", active: 120 },
    { id: "local-market", name: "Рынок", active: 34 },
  ],
};

export const eventsByCommunity: Record<CommunityId, EventItem[]> = {
  auca: [
    {
      id: "football",
      title: "Футбольный матч",
      day: 10,
      month: "апр",
      when: "Сегодня, 18:00",
      place: "Спортплощадка AUCA",
    },
    {
      id: "study-group",
      title: "Учебная группа: математика",
      day: 11,
      month: "апр",
      when: "Завтра, 14:00",
      place: "Библиотека, каб. 3",
    },
    {
      id: "career-fair",
      title: "Ярмарка вакансий",
      day: 14,
      month: "апр",
      when: "Пт, 10:00",
      place: "Главный зал",
    },
  ],
  oktyabrsky: [
    {
      id: "flea-market",
      title: "Блошиный рынок выходного дня",
      day: 12,
      month: "апр",
      when: "Сб, 09:00",
      place: "Центральный парк",
    },
    {
      id: "cleanup",
      title: "Уборка двора",
      day: 15,
      month: "апр",
      when: "Вс, 11:00",
      place: "Двор, квартал 4",
    },
  ],
};

export const messagesByRoom: Record<CommunityId, Record<string, ChatMessage[]>> = {
  auca: {
    general: [
      {
        id: "a1",
        authorId: 1937,
        text: "Доброе утро. Кто-нибудь знает, открывается ли библиотека пораньше сегодня?",
        time: "10:31",
      },
      {
        id: "a2",
        authorId: 7714,
        text: "Обычно в 8. Сверьтесь с доской объявлений, чтобы не ошибиться.",
        time: "10:32",
        reactions: [{ emoji: "🙏", count: 3 }],
      },
      {
        id: "a3",
        authorId: 4821,
        text: "Кто идёт сегодня на футбол?",
        time: "10:35",
        reactions: [
          { emoji: "❤️", count: 5 },
          { emoji: "👍", count: 3 },
        ],
      },
      {
        id: "a4",
        authorId: 1937,
        text: "Я иду. Во сколько?",
        time: "10:37",
      },
      {
        id: "a5",
        authorId: 4821,
        text: "В 18:00, на баскетбольной площадке.",
        time: "10:38",
        reactions: [{ emoji: "✅", count: 8 }],
      },
      {
        id: "a6",
        authorId: 3302,
        text: "Тоже иду!",
        time: "10:41",
      },
      {
        id: "a7",
        authorId: 9918,
        text: "Слышал, что профессор перенёс дедлайн по CS. Кто-нибудь подтвердит?",
        time: "10:44",
        reactions: [{ emoji: "😮", count: 4 }],
      },
      {
        id: "a8",
        authorId: 2255,
        text: "Да, подтверждаю. Теперь срок — четверг.",
        time: "10:46",
      },
      {
        id: "a9",
        authorId: 1937,
        text: "Спасибо, отлегло.",
        time: "10:47",
        reactions: [{ emoji: "🙌", count: 6 }],
      },
    ],
    announcements: [
      {
        id: "a10",
        authorId: 1001,
        text: "Напоминание: главная библиотека будет закрыта в эту субботу на техобслуживание. Читальные залы в Северном крыле работают как обычно.",
        time: "09:00",
        isAnnouncement: true,
      },
      {
        id: "a11",
        authorId: 1001,
        text: "Регистрация на курсы следующего семестра откроется в понедельник в 9:00. Слоты для консультаций уже доступны для записи.",
        time: "Вчера",
        isAnnouncement: true,
        reactions: [{ emoji: "👀", count: 12 }],
      },
    ],
    events: [
      {
        id: "a12",
        authorId: 4821,
        text: "Создал комнату для футбола — встречаемся все на площадке.",
        time: "10:39",
      },
      {
        id: "a13",
        authorId: 7714,
        text: "Ярмарка вакансий открыта для всех специальностей или только для бизнеса?",
        time: "11:02",
      },
      {
        id: "a14",
        authorId: 2255,
        text: "Для всех специальностей. Стоит взять с собой распечатанное резюме.",
        time: "11:05",
        reactions: [{ emoji: "👍", count: 2 }],
      },
    ],
    "lost-and-found": [
      {
        id: "a15",
        authorId: 3302,
        text: "Оставил синюю бутылку для воды в библиотеке, каб. 3, вчера. Кто-нибудь видел?",
        time: "08:12",
      },
      {
        id: "a16",
        authorId: 9918,
        text: "Нашёл связку ключей у входа в столовую, на брелоке лисичка.",
        time: "09:40",
        attachment: "ключи.jpg",
        reactions: [{ emoji: "🔑", count: 1 }],
      },
    ],
    memes: [
      {
        id: "a17",
        authorId: 1937,
        text: "Когда препод говорит «ещё один последний слайд» в пятый раз",
        time: "12:10",
        attachment: "мем.jpg",
        reactions: [
          { emoji: "😂", count: 21 },
          { emoji: "💀", count: 9 },
        ],
      },
      {
        id: "a18",
        authorId: 2255,
        text: "Уровень энергии на неделе перед сессией, по дням с понедельника по пятницу.",
        time: "12:14",
        reactions: [{ emoji: "😂", count: 14 }],
      },
    ],
  },
  oktyabrsky: {
    general: [
      {
        id: "o1",
        authorId: 3101,
        text: "Фонарь у входа в метро не работает уже несколько дней, сообщил в районную администрацию.",
        time: "20:40",
        reactions: [{ emoji: "👍", count: 3 }],
      },
      {
        id: "o2",
        authorId: 8123,
        text: "Хорошо, что сообщили. Там довольно темно вечером.",
        time: "20:52",
        reactions: [{ emoji: "❤️", count: 1 }],
      },
      {
        id: "o3",
        authorId: 6245,
        text: "Кто-нибудь знает, работает ли сегодня аптека на Токтогула? Нужно забрать лекарство.",
        time: "21:10",
      },
      {
        id: "o4",
        authorId: 7732,
        text: "Да, открыта до 22:00. Проходил мимо недавно.",
        time: "21:27",
      },
      {
        id: "o5",
        authorId: 9187,
        text: "Спасибо за информацию!",
        time: "21:45",
      },
      {
        id: "o6",
        authorId: 4821,
        text: "Кстати, в эти выходные у парка будет небольшой рынок. Свежие продукты и изделия ручной работы.",
        time: "22:03",
      },
      {
        id: "o7",
        authorId: 3650,
        text: "Отлично! Знаешь точное место?",
        time: "22:17",
      },
    ],
    announcements: [
      {
        id: "o8",
        authorId: 1002,
        text: "Уборка двора в это воскресенье в 11:00, сбор во дворе у 4 квартала. Перчатки и мешки выдадут.",
        time: "Вчера",
        isAnnouncement: true,
        reactions: [{ emoji: "🌱", count: 18 }],
      },
    ],
    marketplace: [
      {
        id: "o9",
        authorId: 8123,
        text: "Продаю почти новый велосипед, отлично подходит для передвижения по району. Пишите, если интересно.",
        time: "13:20",
        attachment: "велосипед.jpg",
      },
      {
        id: "o10",
        authorId: 3110,
        text: "Ещё актуально? Интересно!",
        time: "13:44",
      },
    ],
    events: [
      {
        id: "o11",
        authorId: 5540,
        text: "Блошиный рынок в эту субботу обещает хорошую погоду, жду не дождусь.",
        time: "09:15",
        reactions: [{ emoji: "🎉", count: 5 }],
      },
    ],
    "neighbors-watch": [
      {
        id: "o12",
        authorId: 3110,
        text: "Кто-нибудь видел собаку без ошейника у детской площадки? Кажется, потерялась.",
        time: "18:20",
      },
      {
        id: "o13",
        authorId: 8123,
        text: "Да, видел, она смирная. Лучше не подпускать детей близко, сообщили в приют.",
        time: "18:35",
        reactions: [{ emoji: "🙏", count: 4 }],
      },
    ],
  },
};
