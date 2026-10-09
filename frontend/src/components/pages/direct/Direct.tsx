"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, MessageSquare } from "lucide-react";
import css from "./direct.module.css";
import DirectChat from "./DirectChat";
import { Avatar } from "@/components/layout/Avatar";
import { useConversations } from "@/hooks/direct/useConversations";
import { useDirectSocket } from "@/hooks/direct/useDirectSocket";
import { formatMessageTime } from "@/lib/format";

const Direct = () => {
  const { push } = useRouter();
  useDirectSocket();
  const { data: conversations = [], isLoading } = useConversations();
  const [activeId, setActiveId] = useState<number | null>(() =>
    typeof window === "undefined"
      ? null
      : Number(new URLSearchParams(window.location.search).get("c")) || null,
  );

  const active = conversations.find((conversation) => conversation.id === activeId) ?? null;

  return (
    <div className={css.page}>
      <header className={css.topbar}>
        <button type="button" className={css.backBtn} onClick={() => push("/")}>
          <ArrowLeft size={18} />
          <span>К чату</span>
        </button>
        <h1 className={css.title}>Личные сообщения</h1>
      </header>

      <div className={css.layout} data-chat-open={active !== null}>
        <aside className={css.list}>
          {isLoading && <p className={css.hint}>Загрузка...</p>}

          {!isLoading && conversations.length === 0 && (
            <div className={css.emptyList}>
              <span className={css.emptyIcon}>
                <MessageSquare size={22} />
              </span>
              <p className={css.emptyTitle}>Пока нет диалогов</p>
              <p className={css.hint}>
                Наведите на сообщение в любом чате и нажмите «Написать лично», чтобы начать
                анонимную переписку.
              </p>
            </div>
          )}

          {conversations.map((conversation) => {
            const isRequest = conversation.status === "pending" && !conversation.is_initiator;
            const preview =
              conversation.status === "pending" && conversation.is_initiator
                ? "Ожидает ответа"
                : conversation.last_text
                  ? `${conversation.last_mine ? "Вы: " : ""}${conversation.last_text}`
                  : "Нет сообщений";

            return (
              <button
                key={conversation.id}
                type="button"
                className={css.item}
                data-active={conversation.id === activeId}
                onClick={() => setActiveId(conversation.id)}
              >
                <Avatar size={38} />
                <span className={css.itemBody}>
                  <span className={css.itemTop}>
                    <span className={css.itemName}>Аноним #{conversation.other_anon_id}</span>
                    {conversation.last_at && (
                      <span className={css.itemTime}>{formatMessageTime(conversation.last_at)}</span>
                    )}
                  </span>
                  <span className={css.itemBottom}>
                    <span className={css.itemPreview}>
                      {isRequest && <span className={css.requestTag}>Запрос</span>}
                      {preview}
                    </span>
                    {conversation.unread > 0 && (
                      <span className={css.unread}>{conversation.unread}</span>
                    )}
                  </span>
                </span>
              </button>
            );
          })}
        </aside>

        <section className={css.chat}>
          {active ? (
            <DirectChat key={active.id} conversation={active} onBack={() => setActiveId(null)} />
          ) : (
            <div className={css.placeholder}>
              <MessageSquare size={28} />
              <p>Выберите диалог слева</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Direct;
