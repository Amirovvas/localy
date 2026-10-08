"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Ban,
  Building2,
  LocateFixed,
  LogIn,
  Mail,
  MessageCircle,
  ShieldCheck,
  UserCheck,
  VenetianMask,
} from "lucide-react";
import css from "./landing.module.css";
import { LogoMark } from "@/components/layout/Logo";
import { useAuthStatus } from "@/hooks/auth/useHasToken";
import { useCommunityStats } from "@/hooks/communities/useCommunityStats";
import { pluralCommunities } from "@/lib/format";

interface DemoMessage {
  author: string;
  text: string;
  own?: boolean;
}

const DEMO_MESSAGES: DemoMessage[] = [
  { author: "Аноним #214", text: "Кто идёт на ярмарку вакансий в пятницу?" },
  { author: "Аноним #5871", text: "Я! Встретимся у главного входа" },
  { author: "Вы", text: "Тогда до встречи там", own: true },
  { author: "Аноним #3302", text: "Потерял ключи у 3 корпуса, видел кто-нибудь?" },
];

const STEP_MS = 1700;
const PAUSE_MS = 4500;

const FEATURES = [
  {
    icon: VenetianMask,
    title: "Анонимно",
    text: "Тебя видят только как Аноним #N. Имя и почту в чате никто не узнает.",
  },
  {
    icon: Building2,
    title: "Твои места",
    text: "Вуз, школа, район, микрорайон и ЖК: все твои сообщества в одном приложении.",
  },
  {
    icon: LocateFixed,
    title: "Рядом с тобой",
    text: "Разреши геолокацию, и мы сами найдём ближайшие сообщества и покажем расстояние.",
  },
];

const Landing = () => {
  const authStatus = useAuthStatus();
  const isLoggedIn = authStatus === "in";
  const { data: stats } = useCommunityStats();
  const [visible, setVisible] = useState(DEMO_MESSAGES.length);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let timer: ReturnType<typeof setTimeout>;
    let shown = 0;
    setVisible(0);

    const next = () => {
      shown += 1;
      setVisible(shown);
      if (shown < DEMO_MESSAGES.length) {
        timer = setTimeout(next, STEP_MS);
      } else {
        timer = setTimeout(() => {
          shown = 0;
          setVisible(0);
          timer = setTimeout(next, STEP_MS);
        }, PAUSE_MS);
      }
    };
    timer = setTimeout(next, 600);

    return () => clearTimeout(timer);
  }, []);

  const primaryHref = isLoggedIn ? "/" : "/register";
  const primaryLabel = isLoggedIn ? "Открыть чат" : "Начать";

  return (
    <div className={css.page}>
      <header className={css.header}>
        <Link href="/welcome" className={css.brand}>
          <LogoMark size={16} />
          <span>Localy</span>
        </Link>
        <nav className={css.nav}>
          {!isLoggedIn && (
            <Link href="/login" className={css.navLink}>
              Войти
            </Link>
          )}
          <Link href={primaryHref} className={css.navButton}>
            {isLoggedIn ? "Открыть чат" : "Регистрация"}
          </Link>
        </nav>
      </header>

      <main>
        <section className={css.hero}>
          <div className={css.heroText}>
            <span className={css.badge}>
              <ShieldCheck size={14} />
              Полностью анонимно
            </span>
            <h1 className={css.title}>Чат твоего универа, района и дома</h1>
            <p className={css.lead}>
              Общайся с теми, кто рядом: соседи, однокурсники, одноклассники. Имя и почту никто не
              увидит, ты просто Аноним #1234.
            </p>
            <div className={css.actions}>
              <Link href={primaryHref} className={css.primaryBtn}>
                {primaryLabel}
                <ArrowRight size={16} />
              </Link>
              {!isLoggedIn && (
                <Link href="/login" className={css.secondaryBtn}>
                  <LogIn size={16} />
                  У меня есть аккаунт
                </Link>
              )}
            </div>
          </div>

          <div className={css.chatCard} aria-label="Пример чата">
            <div className={css.chatHead}>
              <span className={css.chatTitle}>
                AUCA <span className={css.chatRoom}>· #общее</span>
              </span>
              <span className={css.online}>
                <span className={css.onlineDot} />
                14 онлайн
              </span>
            </div>

            <div className={css.chatBody}>
              {DEMO_MESSAGES.slice(0, visible).map((message) => (
                <div
                  key={message.text}
                  className={`${css.bubble} ${message.own ? css.bubbleOwn : ""}`}
                >
                  {!message.own && <span className={css.bubbleAuthor}>{message.author}</span>}
                  <span className={css.bubbleText}>{message.text}</span>
                </div>
              ))}
            </div>

            <div className={css.typing}>
              {visible < DEMO_MESSAGES.length && (
                <>
                  <span className={css.typingDots} aria-hidden="true">
                    <span />
                    <span />
                    <span />
                  </span>
                  Аноним #771 печатает
                </>
              )}
            </div>
          </div>
        </section>

        <section className={css.stats}>
          <div className={css.stat}>
            <span className={css.statValue}>{stats ? stats.communities : "..."}</span>
            <span className={css.statLabel}>
              {stats ? pluralCommunities(stats.communities) : "сообществ"} в Бишкеке
            </span>
          </div>
          <div className={css.stat}>
            <span className={css.statValue}>5</span>
            <span className={css.statLabel}>комнат в каждом сообществе</span>
          </div>
          <div className={css.stat}>
            <span className={css.statValue}>0</span>
            <span className={css.statLabel}>имён и почт в чате</span>
          </div>
        </section>

        <section className={css.features}>
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <div key={title} className={css.feature}>
              <span className={css.featureIcon}>
                <Icon size={18} />
              </span>
              <h2 className={css.featureTitle}>{title}</h2>
              <p className={css.featureText}>{text}</p>
            </div>
          ))}
        </section>

        <section className={css.direct}>
          <div className={css.directText}>
            <span className={css.badge}>
              <Mail size={14} />
              Личные сообщения
            </span>
            <h2 className={css.directTitle}>Напишите лично, оставаясь анонимным</h2>
            <p className={css.directLead}>
              Понравилось сообщение или нужно обсудить что-то один на один? Начните приватную
              переписку прямо из чата.
            </p>
            <ul className={css.directList}>
              <li>
                <UserCheck size={16} />
                <span>Сначала запрос: собеседник сам решает, принять его или отклонить.</span>
              </li>
              <li>
                <ShieldCheck size={16} />
                <span>Вы видны только как Аноним #N. Имя и почта не раскрываются.</span>
              </li>
              <li>
                <Ban size={16} />
                <span>Заблокировать можно в один клик, а в профиле личные сообщения можно отключить.</span>
              </li>
            </ul>
          </div>

          <div className={css.requestCard} aria-label="Пример запроса на переписку">
            <div className={css.requestHead}>
              <span className={css.requestAvatar}>
                <Mail size={16} />
              </span>
              <span className={css.requestWho}>
                <span className={css.requestName}>Аноним #1873</span>
                <span className={css.requestFrom}>из AUCA</span>
              </span>
              <span className={css.requestTag}>Запрос</span>
            </div>
            <p className={css.requestText}>Привет! Видел твоё сообщение про ярмарку. Ты идёшь?</p>
            <div className={css.requestActions}>
              <span className={css.requestDecline}>Отклонить</span>
              <span className={css.requestAccept}>Принять</span>
            </div>
            <div className={css.requestReply}>
              <span className={css.requestBubble}>Привет! Да, иду</span>
            </div>
          </div>
        </section>

        <section className={css.cta}>
          <MessageCircle size={22} className={css.ctaIcon} />
          <h2 className={css.ctaTitle}>Твои соседи и однокурсники уже в чате</h2>
          <p className={css.ctaText}>Регистрация занимает меньше минуты.</p>
          <Link href={primaryHref} className={css.primaryBtn}>
            {primaryLabel}
            <ArrowRight size={16} />
          </Link>
        </section>
      </main>

      <footer className={css.footer}>Localy · анонимное общение рядом с тобой</footer>
    </div>
  );
};

export default Landing;
