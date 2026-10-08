"use client";
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import {
  CalendarPlus,
  ChevronDown,
  CornerUpLeft,
  Flag,
  Mail,
  Info,
  Menu,
  Loader2,
  Paperclip,
  Pencil,
  Pin,
  PinOff,
  Reply,
  Search,
  Send,
  Smile,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import css from "./chatArea.module.css";
import { Avatar } from "@/components/layout/Avatar";
import { CommunityIcon } from "@/components/layout/CommunityIcon";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import StartDirectModal from "./StartDirectModal";
import EmptyRoom from "./EmptyRoom";
import { useGetMessages } from "@/hooks/messages/useGetMessages";
import { useSendMessage } from "@/hooks/messages/useSendMessage";
import { useDeleteMessage } from "@/hooks/messages/useDeleteMessage";
import { useEditMessage } from "@/hooks/messages/useEditMessage";
import { useRoomSocket } from "@/hooks/messages/useRoomSocket";
import { useToggleReaction } from "@/hooks/messages/useToggleReaction";
import { useTogglePin } from "@/hooks/messages/useTogglePin";
import { usePinnedMessages } from "@/hooks/messages/usePinnedMessages";
import { useSearchMessages } from "@/hooks/messages/useSearchMessages";
import { useReadState } from "@/hooks/messages/useReadState";
import { useUnreadSummary } from "@/hooks/messages/useUnreadSummary";
import { formatUnread } from "@/lib/format";
import { useMarkRoomRead } from "@/hooks/messages/useMarkRoomRead";
import {
  ACCEPTED_IMAGE_TYPES,
  MAX_IMAGE_SIZE,
  useUploadImage,
} from "@/hooks/uploads/useUploadImage";
import { useReportMessage, type ReportReason } from "@/hooks/reports/useReportMessage";
import { useSummary } from "@/hooks/summary/useSummary";
import { useTyping } from "@/hooks/chat/useTyping";
import { useCreateEvent } from "@/hooks/events/useCreateEvent";
import { useIsMobile } from "@/hooks/use-mobile";
import type { ChatCommunityDetail, ChatMessage, ChatRoom } from "@/lib/chat";
import { REACTION_EMOJIS } from "@/lib/chat";
import { formatMembers } from "@/lib/format";
import { getApiErrorMessage } from "@/lib/apiError";

const EmojiPickerPanel = dynamic(() => import("./EmojiPickerPanel"), {
  ssr: false,
  loading: () => <div className={css.emojiLoading}>Загрузка...</div>,
});

interface IProps {
  community: ChatCommunityDetail;
  room: ChatRoom;
  currentUserAnonId: number;
  onOpenSidebar: () => void;
  onOpenInfo: () => void;
}

const REPORT_REASONS: { value: ReportReason; label: string }[] = [
  { value: "spam", label: "Спам" },
  { value: "abuse", label: "Оскорбления" },
  { value: "inappropriate", label: "Неприемлемый контент" },
  { value: "other", label: "Другое" },
];

const ChatArea = ({ community, room, currentUserAnonId, onOpenSidebar, onOpenInfo }: IProps) => {
  const { data: messages = [], isLoading: messagesLoading } = useGetMessages(room.id);
  useRoomSocket(room.id);
  const isMobile = useIsMobile();
  const unreadTotal = useUnreadSummary(room.id).total;

  const {
    data: lastReadMessageId,
    isLoading: readStateLoading,
    isFetching: readStateFetching,
  } = useReadState(room.id);
  const markRoomRead = useMarkRoomRead();
  const [unreadDividerId, setUnreadDividerId] = useState<number | null>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const hasInitializedReadRef = useRef(false);

  const sendMessage = useSendMessage();
  const isSending = sendMessage.isPending;

  const { typingIds, notifyTyping, stopTyping } = useTyping(room.id);

  const [draft, setDraft] = useState("");
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [highlightedId, setHighlightedId] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);
  const [attachError, setAttachError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadImage = useUploadImage();
  const [emojiOpen, setEmojiOpen] = useState(false);
  const emojiWrapRef = useRef<HTMLDivElement>(null);
  const [reportTarget, setReportTarget] = useState<ChatMessage | null>(null);
  const [reportReason, setReportReason] = useState<ReportReason | null>(null);
  const [reportComment, setReportComment] = useState("");
  const [reportError, setReportError] = useState<string | null>(null);
  const [reportSent, setReportSent] = useState(false);
  const reportMessage = useReportMessage();
  const [summaryOpen, setSummaryOpen] = useState(false);
  const summary = useSummary();
  const [pickerFor, setPickerFor] = useState<number | null>(null);
  const toggleReaction = useToggleReaction();
  const [deleteTarget, setDeleteTarget] = useState<ChatMessage | null>(null);
  const [directTarget, setDirectTarget] = useState<number | null>(null);
  const deleteMessage = useDeleteMessage();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const editMessage = useEditMessage();

  const [pinnedOpen, setPinnedOpen] = useState(false);
  const { data: pinnedMessages = [] } = usePinnedMessages(room.id);
  const togglePin = useTogglePin();

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const searchWrapRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchQuery(searchQuery.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);
  const { data: searchResults = [], isLoading: searchLoading } = useSearchMessages(
    room.id,
    debouncedSearchQuery,
  );

  useEffect(() => {
    if (hasInitializedReadRef.current) return;
    if (messagesLoading || readStateLoading || readStateFetching) return;
    hasInitializedReadRef.current = true;

    const readMarker = lastReadMessageId ?? 0;
    const firstUnread = messages.find(
      (message) => message.id > readMarker && message.authorId !== currentUserAnonId,
    );
    setUnreadDividerId(firstUnread ? firstUnread.id : null);

    requestAnimationFrame(() => {
      if (firstUnread) {
        document.getElementById(`msg-${firstUnread.id}`)?.scrollIntoView({ block: "start" });
      } else if (messagesRef.current) {
        messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
      }
    });

    markRoomRead.mutate(room.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messagesLoading, readStateLoading, readStateFetching]);

  useEffect(() => {
    return () => {
      markRoomRead.mutate(room.id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room.id]);

  const [eventDraft, setEventDraft] = useState<{
    title: string;
    place: string;
    startsAt: string;
  } | null>(null);
  const createEvent = useCreateEvent();

  const title = `# ${room.name}`;

  const typingLabel =
    typingIds.length === 1
      ? `Аноним #${typingIds[0]} печатает`
      : typingIds.length === 2
        ? `Аноним #${typingIds[0]} и Аноним #${typingIds[1]} печатают`
        : "Несколько человек печатают";

  const handleSummaryClick = () => {
    if (summaryOpen) {
      setSummaryOpen(false);
      return;
    }

    setSummaryOpen(true);
    summary.mutate(room.id);
  };

  const summaryError =
    getApiErrorMessage(summary.error) ?? "Не удалось получить сводку. Попробуйте позже.";

  const handleSend = (event: React.FormEvent) => {
    event.preventDefault();
    const text = draft.trim();
    if ((!text && !attachmentUrl) || uploadImage.isPending) return;

    stopTyping();

    setSendError(null);
    sendMessage.mutate(
      {
        roomId: room.id,
        text,
        attachment: attachmentUrl ?? undefined,
        replyToId: replyTo?.id,
        authorId: currentUserAnonId,
        replyToPreview: replyTo ?? undefined,
      },
      {
        onError: (error) => {
          setSendError(getApiErrorMessage(error) ?? "Не удалось отправить сообщение");
          setDraft((current) => current || text);
        },
      },
    );
    setDraft("");
    setReplyTo(null);
    setAttachmentUrl(null);
    setAttachError(null);

    requestAnimationFrame(() => {
      if (messagesRef.current) {
        messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
      }
    });
  };

  const openReport = (message: ChatMessage) => {
    setReportTarget(message);
    setReportReason(null);
    setReportComment("");
    setReportError(null);
    setReportSent(false);
  };

  const closeReport = () => {
    setReportTarget(null);
    reportMessage.reset();
  };

  const handleReportSubmit = (formEvent: React.FormEvent) => {
    formEvent.preventDefault();
    if (!reportTarget || !reportReason) return;

    setReportError(null);
    reportMessage.mutate(
      {
        messageId: reportTarget.id,
        reason: reportReason,
        comment: reportComment.trim(),
      },
      {
        onSuccess: () => setReportSent(true),
        onError: (error) => {
          setReportError(
            getApiErrorMessage(error) ?? "Не удалось отправить жалобу. Попробуйте ещё раз.",
          );
        },
      },
    );
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setAttachError("Разрешены только JPG, PNG и WebP");
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setAttachError("Файл слишком большой (максимум 5 МБ)");
      return;
    }

    setAttachError(null);
    uploadImage.mutate(file, {
      onSuccess: (url) => setAttachmentUrl(url),
      onError: (error) => {
        setAttachError(getApiErrorMessage(error) ?? "Не удалось загрузить фото");
      },
    });
  };

  const insertEmoji = (emoji: string) => {
    const input = inputRef.current;
    const current = input?.value ?? draft;
    const start = input?.selectionStart ?? current.length;
    const end = input?.selectionEnd ?? current.length;
    setDraft(current.slice(0, start) + emoji + current.slice(end));
    notifyTyping();

    const caret = start + emoji.length;
    setTimeout(() => {
      input?.focus();
      input?.setSelectionRange(caret, caret);
    }, 0);
  };

  useEffect(() => {
    if (!emojiOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!emojiWrapRef.current?.contains(event.target as Node)) setEmojiOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setEmojiOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [emojiOpen]);

  useEffect(() => {
    if (!searchOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!searchWrapRef.current?.contains(event.target as Node)) setSearchOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSearchOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [searchOpen]);

  const handlePickStarter = (text: string) => {
    setDraft(text);
    setTimeout(() => {
      const input = inputRef.current;
      if (!input) return;
      input.focus();
      input.setSelectionRange(text.length, text.length);
    }, 0);
  };

  const startReply = (message: ChatMessage) => {
    setReplyTo(message);
    inputRef.current?.focus();
  };

  const jumpToMessage = (messageId: number) => {
    const element = document.getElementById(`msg-${messageId}`);
    if (!element) return;
    element.scrollIntoView({ behavior: "smooth", block: "center" });
    setHighlightedId(messageId);
    setTimeout(() => setHighlightedId(null), 1600);
  };

  const handleTogglePin = (message: ChatMessage) => {
    togglePin.mutate({ roomId: room.id, messageId: message.id });
  };

  const closeSearch = () => {
    setSearchOpen(false);
    setSearchQuery("");
  };

  const handleSearchResultClick = (messageId: number) => {
    closeSearch();
    jumpToMessage(messageId);
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;

    deleteMessage.mutate(
      { roomId: room.id, messageId: deleteTarget.id },
      {
        onSuccess: () => {
          setReplyTo((current) => (current?.id === deleteTarget.id ? null : current));
          setDeleteTarget(null);
        },
      },
    );
  };

  const startEdit = (message: ChatMessage) => {
    setEditingId(message.id);
    setEditDraft(message.text);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditDraft("");
  };

  const handleSaveEdit = () => {
    const text = editDraft.trim();
    if (!editingId || !text) return;

    editMessage.mutate(
      { roomId: room.id, messageId: editingId, text },
      { onSuccess: cancelEdit },
    );
  };

  const handleReact = (messageId: number, emoji: string) => {
    setPickerFor(null);
    toggleReaction.mutate({ roomId: room.id, messageId, emoji });
  };

  const handleCreateEvent = (formEvent: React.FormEvent) => {
    formEvent.preventDefault();
    if (!eventDraft || !eventDraft.title.trim() || !eventDraft.startsAt) return;

    createEvent.mutate(
      {
        communityId: community.id,
        title: eventDraft.title.trim(),
        place: eventDraft.place.trim(),
        startsAt: new Date(eventDraft.startsAt).toISOString(),
      },
      { onSuccess: () => setEventDraft(null) },
    );
  };

  return (
    <section className={css.chatArea}>
      <header className={css.topbar}>
        <button
          type="button"
          className={css.menuBtn}
          onClick={onOpenSidebar}
          aria-label="Открыть меню"
        >
          <Menu size={18} />
          {unreadTotal > 0 && <span className={css.menuBadge}>{formatUnread(unreadTotal)}</span>}
        </button>

        <span className={css.communityIcon}>
          <CommunityIcon category={community.category} size={16} />
        </span>

        <div className={css.communityInfo}>
          <span className={css.communityName}>{community.name}</span>
          <span className={css.communityMeta}>
            Сообщество · {formatMembers(community.members)}
          </span>
        </div>

        <div className={css.topbarActions}>
          <button
            type="button"
            className={css.summarizeBtn}
            onClick={handleSummaryClick}
          >
            <Sparkles size={14} />
            AI Summary
          </button>

          <div className={css.searchWrap} ref={searchWrapRef}>
            <button
              type="button"
              className={css.searchToggleBtn}
              onClick={() => setSearchOpen((open) => !open)}
              aria-label="Поиск по сообщениям"
              aria-expanded={searchOpen}
            >
              <Search size={18} />
            </button>

            {searchOpen && (
              <div className={css.searchPanel}>
                <div className={css.searchInputWrap}>
                  <Search size={14} className={css.searchInputIcon} />
                  <input
                    className={css.searchInput}
                    placeholder="Поиск по сообщениям в этой комнате..."
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    autoFocus
                  />
                </div>

                <div className={css.searchResults}>
                  {searchLoading && (
                    <p className={css.searchHint}>Ищем...</p>
                  )}
                  {!searchLoading && debouncedSearchQuery && searchResults.length === 0 && (
                    <p className={css.searchHint}>Ничего не найдено.</p>
                  )}
                  {!debouncedSearchQuery && (
                    <p className={css.searchHint}>Начните вводить текст сообщения.</p>
                  )}
                  {searchResults.map((result) => (
                    <button
                      key={result.id}
                      type="button"
                      className={css.searchResultRow}
                      onClick={() => handleSearchResultClick(result.id)}
                    >
                      <span className={css.searchResultAuthor}>
                        Аноним #{result.authorId} · {result.time}
                      </span>
                      <span className={css.searchResultText}>{result.text || "📷 Фото"}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            className={css.infoBtn}
            onClick={onOpenInfo}
            aria-label="Открыть информацию о сообществе"
          >
            <Info size={18} />
          </button>
        </div>
      </header>

      <div className={css.roomHead}>
        <h2 className={css.roomTitle}>{title}</h2>
        <p className={css.roomDescription}>{room.description}</p>
      </div>

      {pinnedMessages.length > 0 && (
        <div className={css.pinnedBar}>
          <button
            type="button"
            className={css.pinnedBarHead}
            onClick={() => setPinnedOpen((open) => !open)}
          >
            <Pin size={14} className={css.pinnedBarIcon} />
            <span>
              {pinnedMessages.length}{" "}
              {pinnedMessages.length === 1 ? "закреплённое сообщение" : "закреплённых сообщения"}
            </span>
            <ChevronDown size={14} className={css.pinnedBarChevron} data-open={pinnedOpen} />
          </button>

          {pinnedOpen && (
            <div className={css.pinnedList}>
              {pinnedMessages.map((message) => (
                <div key={message.id} className={css.pinnedRow}>
                  <button
                    type="button"
                    className={css.pinnedRowBody}
                    onClick={() => jumpToMessage(message.id)}
                  >
                    <span className={css.pinnedRowAuthor}>Аноним #{message.authorId}</span>
                    <span className={css.pinnedRowText}>{message.text || "📷 Фото"}</span>
                  </button>
                  <button
                    type="button"
                    className={css.pinnedRowUnpin}
                    title="Открепить"
                    onClick={() => handleTogglePin(message)}
                  >
                    <PinOff size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {summaryOpen && (
        <div className={css.summaryBanner}>
          <Sparkles size={14} className={css.summaryIcon} />
          <div className={css.summaryBody}>
            {summary.isPending && <p>Готовим сводку...</p>}
            {summary.isError && <p>{summaryError}</p>}
            {summary.data && (
              <>
                <p className={css.summaryText}>{summary.data.summary}</p>
                <span className={css.summaryMeta}>
                  Сводка по последним {summary.data.messageCount} сообщениям
                </span>
              </>
            )}
          </div>
          <button
            type="button"
            className={css.summaryClose}
            onClick={() => setSummaryOpen(false)}
          >
            Скрыть
          </button>
        </div>
      )}

      <div className={css.messages} ref={messagesRef}>
        {messagesLoading && messages.length === 0 && (
          <p className={css.emptyState}>Загрузка сообщений...</p>
        )}

        {!messagesLoading && messages.length === 0 && (
          <EmptyRoom roomName={room.name} anonId={currentUserAnonId} onPick={handlePickStarter} />
        )}

        {messages.map((message) => {
          const reactions = message.reactions ?? [];
          const isOwn = message.authorId === currentUserAnonId;
          return (
            <div key={message.id}>
              {unreadDividerId === message.id && (
                <div className={css.unreadDivider}>
                  <span>Непрочитанные сообщения</span>
                </div>
              )}

              <div
                id={`msg-${message.id}`}
                className={`${css.message} ${isOwn ? css.own : ""} ${
                  message.isAnnouncement ? css.announcement : ""
                } ${highlightedId === message.id ? css.highlighted : ""}`}
                onMouseLeave={() => setPickerFor((open) => (open === message.id ? null : open))}
              >
                <Avatar size={34} className={css.avatar} />

                <div className={css.body}>
                  <div className={css.head}>
                    <span className={css.author}>Аноним #{message.authorId}</span>
                    <span className={css.time}>{message.time}</span>
                    {message.isEdited && <span className={css.editedTag}>изменено</span>}
                    {message.isPinned && <Pin size={11} className={css.pinnedTag} />}
                    {message.isAnnouncement && (
                      <span className={css.announceTag}>Официально</span>
                    )}
                  </div>

                  {message.replyTo && (
                    <button
                      type="button"
                      className={css.replyQuote}
                      onClick={() => jumpToMessage(message.replyTo!.id)}
                    >
                      <CornerUpLeft size={12} className={css.replyQuoteIcon} />
                      <span className={css.replyQuoteAuthor}>
                        Аноним #{message.replyTo.authorId}
                      </span>
                      <span className={css.replyQuoteText}>{message.replyTo.text}</span>
                    </button>
                  )}

                  {message.attachment && (
                    <a
                      href={message.attachment}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={css.imageLink}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={message.attachment}
                        alt="Фото из чата"
                        className={css.messageImage}
                        loading="lazy"
                      />
                    </a>
                  )}

                  {editingId === message.id ? (
                    <div className={css.editBox}>
                      <textarea
                        className={css.editInput}
                        value={editDraft}
                        onChange={(event) => setEditDraft(event.target.value)}
                        rows={2}
                        autoFocus
                        onKeyDown={(event) => {
                          if (event.key === "Enter" && !event.shiftKey) {
                            event.preventDefault();
                            handleSaveEdit();
                          }
                          if (event.key === "Escape") cancelEdit();
                        }}
                      />
                      <div className={css.editActions}>
                        <button type="button" className={css.editCancel} onClick={cancelEdit}>
                          Отмена
                        </button>
                        <button
                          type="button"
                          className={css.editSave}
                          onClick={handleSaveEdit}
                          disabled={!editDraft.trim() || editMessage.isPending}
                        >
                          {editMessage.isPending ? "Сохраняем..." : "Сохранить"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    message.text && <p className={css.text}>{message.text}</p>
                  )}

                  {reactions.length > 0 && (
                    <div className={css.reactions}>
                      {reactions.map((reaction) => (
                        <button
                          key={reaction.emoji}
                          type="button"
                          className={`${css.reaction} ${reaction.mine ? css.reactionMine : ""}`}
                          onClick={() => handleReact(message.id, reaction.emoji)}
                        >
                          <span>{reaction.emoji}</span>
                          <span>{reaction.count}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div
                  className={`${css.hoverActions} ${
                    pickerFor === message.id ? css.hoverActionsOpen : ""
                  }`}
                >
                  <button
                    type="button"
                    className={css.hoverBtn}
                    title="Реакция"
                    onClick={() => setPickerFor((open) => (open === message.id ? null : message.id))}
                  >
                    <Smile size={14} />
                  </button>
                  <button
                    type="button"
                    className={css.hoverBtn}
                    title="Ответить"
                    onClick={() => startReply(message)}
                  >
                    <Reply size={14} />
                  </button>
                  <button
                    type="button"
                    className={css.hoverBtn}
                    title="Отметить как событие"
                    onClick={() =>
                      setEventDraft({ title: message.text, place: "", startsAt: "" })
                    }
                  >
                    <CalendarPlus size={14} />
                  </button>
                  <button
                    type="button"
                    className={css.hoverBtn}
                    data-active={message.isPinned}
                    title={message.isPinned ? "Открепить" : "Закрепить"}
                    onClick={() => handleTogglePin(message)}
                  >
                    {message.isPinned ? <PinOff size={14} /> : <Pin size={14} />}
                  </button>
                  {isOwn ? (
                    <>
                      <button
                        type="button"
                        className={css.hoverBtn}
                        title="Редактировать"
                        onClick={() => startEdit(message)}
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        className={css.hoverBtn}
                        title="Удалить"
                        onClick={() => setDeleteTarget(message)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        className={css.hoverBtn}
                        title="Написать лично"
                        onClick={() => setDirectTarget(message.authorId)}
                      >
                        <Mail size={14} />
                      </button>
                      <button
                        type="button"
                        className={css.hoverBtn}
                        title="Пожаловаться"
                        onClick={() => openReport(message)}
                      >
                        <Flag size={14} />
                      </button>
                    </>
                  )}

                  {pickerFor === message.id && (
                    <div className={css.reactionPicker}>
                      {REACTION_EMOJIS.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          className={css.reactionPickerBtn}
                          onClick={() => handleReact(message.id, emoji)}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className={css.typingBar} aria-live="polite">
        {typingIds.length > 0 && (
          <>
            <span className={css.typingDots} aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
            <span>{typingLabel}</span>
          </>
        )}
      </div>

      {replyTo && (
        <div className={css.replyBanner}>
          <CornerUpLeft size={14} className={css.replyBannerIcon} />
          <div className={css.replyBannerBody}>
            <span className={css.replyBannerTitle}>Ответ на Аноним #{replyTo.authorId}</span>
            <span className={css.replyBannerText}>{replyTo.text || "📷 Фото"}</span>
          </div>
          <button
            type="button"
            className={css.replyBannerClose}
            onClick={() => setReplyTo(null)}
            aria-label="Отменить ответ"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {(attachmentUrl || uploadImage.isPending || attachError || sendError) && (
        <div className={css.attachPreview}>
          {uploadImage.isPending && (
            <span className={css.attachStatus}>
              <Loader2 size={14} className={css.spin} />
              Загрузка фото...
            </span>
          )}

          {attachmentUrl && !uploadImage.isPending && (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={attachmentUrl} alt="Прикреплённое фото" className={css.attachThumb} />
              <span className={css.attachStatus}>Фото прикреплено</span>
              <button
                type="button"
                className={css.replyBannerClose}
                onClick={() => setAttachmentUrl(null)}
                aria-label="Убрать фото"
              >
                <X size={16} />
              </button>
            </>
          )}

          {attachError && !uploadImage.isPending && (
            <span className={css.attachError}>{attachError}</span>
          )}

          {sendError && <span className={css.attachError}>{sendError}</span>}
        </div>
      )}

      <form className={css.inputBar} onSubmit={handleSend}>
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_IMAGE_TYPES.join(",")}
          className={css.fileInput}
          onChange={handleFileChange}
        />
        <button
          type="button"
          className={css.attachBtn}
          aria-label="Прикрепить фото"
          disabled={uploadImage.isPending}
          onClick={() => fileInputRef.current?.click()}
        >
          <Paperclip size={18} />
        </button>

        <div className={css.inputWrap} ref={emojiWrapRef}>
          <input
            ref={inputRef}
            className={css.messageInput}
            placeholder="Напишите сообщение..."
            value={draft}
            onChange={(event) => {
              setDraft(event.target.value);
              if (event.target.value.trim()) notifyTyping();
              else stopTyping();
            }}
          />
          {!isMobile && (
            <>
              <button
                type="button"
                className={`${css.emojiBtn} ${emojiOpen ? css.emojiBtnActive : ""}`}
                aria-label="Смайлики"
                aria-expanded={emojiOpen}
                onClick={() => setEmojiOpen((open) => !open)}
              >
                <Smile size={18} />
              </button>

              {emojiOpen && (
                <div className={css.emojiPanel} role="dialog" aria-label="Выбор эмодзи">
                  <EmojiPickerPanel onSelect={insertEmoji} />
                </div>
              )}
            </>
          )}
        </div>

        <button type="submit" className={css.sendBtn} disabled={(!draft.trim() && !attachmentUrl) || isSending || uploadImage.isPending}>
          <Send size={16} />
        </button>
      </form>

      {directTarget !== null && (
        <StartDirectModal
          anonId={directTarget}
          communityId={community.id}
          onClose={() => setDirectTarget(null)}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Удалить сообщение?"
          message="Сообщение исчезнет у всех участников комнаты без возможности восстановления."
          confirmLabel={deleteMessage.isPending ? "Удаляем..." : "Удалить"}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {reportTarget !== null && (
        <div className={css.modalScrim} onClick={closeReport}>
          <div className={css.modal} onClick={(event) => event.stopPropagation()}>
            {reportSent ? (
              <>
                <h3 className={css.modalTitle}>Жалоба отправлена</h3>
                <p className={css.modalText}>
                  Спасибо! Модераторы сообщества рассмотрят её. Автор сообщения не узнает, кто
                  пожаловался.
                </p>
                <button type="button" className={css.modalCancel} onClick={closeReport}>
                  Закрыть
                </button>
              </>
            ) : (
              <form onSubmit={handleReportSubmit}>
                <h3 className={css.modalTitle}>Пожаловаться на сообщение</h3>
                <p className={css.modalText}>
                  Жалоба отправляется анонимно модераторам сообщества. Выберите причину:
                </p>

                <div className={css.reportQuote}>
                  <span className={css.reportQuoteAuthor}>Аноним #{reportTarget.authorId}</span>
                  <span className={css.reportQuoteText}>
                    {reportTarget.text || "📷 Фото"}
                  </span>
                </div>

                <div className={css.reasonList} role="radiogroup" aria-label="Причина жалобы">
                  {REPORT_REASONS.map((reason) => (
                    <button
                      key={reason.value}
                      type="button"
                      role="radio"
                      aria-checked={reportReason === reason.value}
                      className={css.reasonBtn}
                      data-active={reportReason === reason.value}
                      onClick={() => setReportReason(reason.value)}
                    >
                      {reason.label}
                    </button>
                  ))}
                </div>

                <textarea
                  className={css.reportComment}
                  placeholder={
                    reportReason === "other"
                      ? "Опишите, что не так (обязательно)"
                      : "Комментарий (необязательно)"
                  }
                  value={reportComment}
                  maxLength={500}
                  rows={3}
                  onChange={(event) => setReportComment(event.target.value)}
                />

                {reportError && <p className={css.reportError}>{reportError}</p>}

                <div className={css.eventActions}>
                  <button type="button" className={css.modalCancel} onClick={closeReport}>
                    Отмена
                  </button>
                  <button
                    type="submit"
                    className={css.reportSubmit}
                    disabled={
                      !reportReason ||
                      (reportReason === "other" && reportComment.trim().length < 3) ||
                      reportMessage.isPending
                    }
                  >
                    {reportMessage.isPending ? "Отправляем..." : "Отправить"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {eventDraft && (
        <div className={css.modalScrim} onClick={() => setEventDraft(null)}>
          <div className={css.modal} onClick={(event) => event.stopPropagation()}>
            <h3 className={css.modalTitle}>Отметить как событие</h3>
            <p className={css.modalText}>
              Событие появится у всех участников в «Предстоящие события».
            </p>

            <form className={css.eventForm} onSubmit={handleCreateEvent}>
              <div className={css.eventField}>
                <label htmlFor="event-title">Название</label>
                <input
                  id="event-title"
                  type="text"
                  value={eventDraft.title}
                  onChange={(event) =>
                    setEventDraft((prev) => (prev ? { ...prev, title: event.target.value } : prev))
                  }
                  required
                />
              </div>

              <div className={css.eventField}>
                <label htmlFor="event-starts-at">Дата и время</label>
                <input
                  id="event-starts-at"
                  type="datetime-local"
                  value={eventDraft.startsAt}
                  onChange={(event) =>
                    setEventDraft((prev) =>
                      prev ? { ...prev, startsAt: event.target.value } : prev,
                    )
                  }
                  required
                />
              </div>

              <div className={css.eventField}>
                <label htmlFor="event-place">Место (необязательно)</label>
                <input
                  id="event-place"
                  type="text"
                  placeholder="Например, Центральный стадион"
                  value={eventDraft.place}
                  onChange={(event) =>
                    setEventDraft((prev) => (prev ? { ...prev, place: event.target.value } : prev))
                  }
                />
              </div>

              <div className={css.eventActions}>
                <button
                  type="button"
                  className={css.modalCancel}
                  onClick={() => setEventDraft(null)}
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className={css.eventSubmit}
                  disabled={createEvent.isPending}
                >
                  {createEvent.isPending ? "Создаём..." : "Создать событие"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};

export default ChatArea;
