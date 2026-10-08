"use client";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Ban, Send, ShieldCheck } from "lucide-react";
import css from "./direct.module.css";
import { Avatar } from "@/components/layout/Avatar";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import type { Conversation } from "@/hooks/direct/types";
import { useConversationAction } from "@/hooks/direct/useConversationAction";
import { useDirectMessages } from "@/hooks/direct/useDirectMessages";
import { useMarkConversationRead } from "@/hooks/direct/useMarkConversationRead";
import { useSendDirectMessage } from "@/hooks/direct/useSendDirectMessage";
import { getApiErrorMessage } from "@/lib/apiError";
import { formatMessageTime } from "@/lib/format";

interface IProps {
  conversation: Conversation;
  onBack: () => void;
}

const DirectChat = ({ conversation, onBack }: IProps) => {
  const { data: messages = [], isLoading } = useDirectMessages(conversation.id);
  const sendMessage = useSendDirectMessage(conversation.id);
  const action = useConversationAction();
  const { mutate: markRead } = useMarkConversationRead();

  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [blockOpen, setBlockOpen] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const isRequestForMe = conversation.status === "pending" && !conversation.is_initiator;
  const isWaiting = conversation.status === "pending" && conversation.is_initiator;
  const isBlockedByMe = conversation.status === "blocked" && Boolean(conversation.blocked_by_me);
  const canWrite = conversation.status === "accepted";

  useEffect(() => {
    if (conversation.unread > 0) markRead(conversation.id);
  }, [conversation.unread, conversation.id, markRead]);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages.length]);

  const handleSend = (event: React.FormEvent) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text || sendMessage.isPending) return;

    setError(null);
    setDraft("");
    sendMessage.mutate(text, {
      onError: (err) => {
        setDraft((current) => current || text);
        setError(getApiErrorMessage(err) ?? "Не удалось отправить сообщение");
      },
    });
  };

  const runAction = (name: "accept" | "decline" | "block" | "unblock") => {
    setError(null);
    action.mutate(
      { id: conversation.id, action: name },
      {
        onSuccess: () => setBlockOpen(false),
        onError: (err) => {
          setBlockOpen(false);
          setError(getApiErrorMessage(err) ?? "Не удалось выполнить действие");
        },
      },
    );
  };

  return (
    <div className={css.chatWrap}>
      <header className={css.chatHead}>
        <button type="button" className={css.chatBack} onClick={onBack} aria-label="К списку диалогов">
          <ArrowLeft size={18} />
        </button>
        <Avatar size={36} />
        <span className={css.chatTitleBox}>
          <span className={css.chatTitle}>Аноним #{conversation.other_anon_id}</span>
          <span className={css.chatSub}>
            {conversation.community_name ? `из ${conversation.community_name}` : "Личный диалог"}
          </span>
        </span>
        {canWrite && (
          <button type="button" className={css.dangerBtn} onClick={() => setBlockOpen(true)}>
            <Ban size={14} />
            <span>Заблокировать</span>
          </button>
        )}
      </header>

      {isRequestForMe && (
        <div className={css.banner}>
          <p className={css.bannerText}>
            Аноним #{conversation.other_anon_id} хочет написать вам. Ваше имя и почта ему не
            видны.
          </p>
          <div className={css.bannerActions}>
            <button
              type="button"
              className={css.secondaryBtn}
              onClick={() => runAction("decline")}
              disabled={action.isPending}
            >
              Отклонить
            </button>
            <button
              type="button"
              className={css.primaryBtn}
              onClick={() => runAction("accept")}
              disabled={action.isPending}
            >
              Принять
            </button>
          </div>
        </div>
      )}

      {isWaiting && (
        <div className={css.banner}>
          <p className={css.bannerText}>
            Запрос отправлен. Пока собеседник не принял его, можно отправить только это
            сообщение.
          </p>
        </div>
      )}

      {isBlockedByMe && (
        <div className={css.banner}>
          <p className={css.bannerText}>Вы заблокировали этого собеседника.</p>
          <div className={css.bannerActions}>
            <button
              type="button"
              className={css.secondaryBtn}
              onClick={() => runAction("unblock")}
              disabled={action.isPending}
            >
              Разблокировать
            </button>
          </div>
        </div>
      )}

      <div className={css.messages} ref={listRef}>
        {isLoading && <p className={css.hint}>Загрузка...</p>}
        {!isLoading && messages.length === 0 && <p className={css.hint}>Сообщений пока нет.</p>}
        {messages.map((message) => (
          <div key={message.id} className={css.bubble} data-mine={message.mine}>
            <span className={css.bubbleText}>{message.text}</span>
            <span className={css.bubbleTime}>{formatMessageTime(message.created_at)}</span>
          </div>
        ))}
      </div>

      {error && <p className={css.error}>{error}</p>}

      {canWrite ? (
        <form className={css.composer} onSubmit={handleSend}>
          <input
            className={css.composerInput}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Напишите сообщение..."
            maxLength={4000}
          />
          <button
            type="submit"
            className={css.sendBtn}
            disabled={!draft.trim() || sendMessage.isPending}
            aria-label="Отправить"
          >
            <Send size={16} />
          </button>
        </form>
      ) : (
        <div className={css.composerNote}>
          <ShieldCheck size={14} />
          Переписка анонимна: собеседник видит только ваш номер.
        </div>
      )}

      {blockOpen && (
        <ConfirmDialog
          title="Заблокировать собеседника?"
          message="Он больше не сможет вам писать, а диалог исчезнет из его списка. Разблокировать можно в любой момент."
          confirmLabel={action.isPending ? "Блокируем..." : "Заблокировать"}
          onConfirm={() => runAction("block")}
          onCancel={() => setBlockOpen(false)}
        />
      )}
    </div>
  );
};

export default DirectChat;
