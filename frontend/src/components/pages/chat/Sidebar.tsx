"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Hash, MessageSquare, Plus, Settings, X } from "lucide-react";
import css from "./sidebar.module.css";
import { LogoMark } from "@/components/layout/Logo";
import { Avatar } from "@/components/layout/Avatar";
import { CommunityIcon } from "@/components/layout/CommunityIcon";
import JoinCommunityModal from "./JoinCommunityModal";
import { formatMembers, formatUnread } from "@/lib/format";
import { useUnreadSummary } from "@/hooks/messages/useUnreadSummary";
import { useUnreadSocket } from "@/hooks/messages/useUnreadSocket";
import { useDirectSocket } from "@/hooks/direct/useDirectSocket";
import type { ChatCommunity, ChatRoom } from "@/lib/chat";

interface IProps {
  community: ChatCommunity;
  communities: ChatCommunity[];
  rooms: ChatRoom[];
  activeRoomId: number;
  isOpen: boolean;
  isCollapsed: boolean;
  currentUserAnonId: number;
  onSelectCommunity: (id: number) => void;
  onSelectRoom: (id: number) => void;
  onClose: () => void;
}

const fmt = (value: number) => value.toLocaleString("ru-RU");

const Sidebar = ({
  community,
  communities,
  rooms,
  activeRoomId,
  isOpen,
  isCollapsed,
  currentUserAnonId,
  onSelectCommunity,
  onSelectRoom,
  onClose,
}: IProps) => {
  const [isSwitcherOpen, setSwitcherOpen] = useState(false);
  const [isJoinOpen, setJoinOpen] = useState(false);
  const { push } = useRouter();
  useDirectSocket();
  useUnreadSocket();
  const unread = useUnreadSummary(activeRoomId);
  const unreadElsewhere = communities.reduce(
    (sum, item) => (item.id === community.id ? sum : sum + (unread.communities[item.id] ?? 0)),
    0,
  );

  return (
    <aside className={css.sidebar} data-open={isOpen} data-collapsed={isCollapsed}>
      <div className={css.header}>
        <LogoMark size={16} />
        <span className={css.brand}>Localy</span>
        <button className={css.closeBtn} onClick={onClose} aria-label="Закрыть меню">
          <X size={18} />
        </button>
      </div>

      <div className={css.switcherWrap}>
        <button
          type="button"
          className={css.switcherBtn}
          onClick={() => setSwitcherOpen((open) => !open)}
        >
          <span className={css.switcherIcon}>
            <CommunityIcon category={community.category} />
          </span>
          <span className={css.switcherInfo}>
            <span className={css.switcherName}>{community.name}</span>
            <span className={css.switcherMeta}>{formatMembers(community.members)}</span>
          </span>
          {unreadElsewhere > 0 && <span className={css.badge}>{formatUnread(unreadElsewhere)}</span>}
          <ChevronDown size={16} className={css.chevron} data-open={isSwitcherOpen} />
        </button>

        {isSwitcherOpen && (
          <div className={css.switcherMenu}>
            <span className={css.switcherLabel}>Мои сообщества</span>
            {communities.map((item) => (
              <button
                key={item.id}
                type="button"
                className={css.switcherItem}
                data-active={item.id === community.id}
                onClick={() => {
                  onSelectCommunity(item.id);
                  setSwitcherOpen(false);
                }}
              >
                <span className={css.switcherItemIcon}>
                  <CommunityIcon category={item.category} size={15} />
                </span>
                <span className={css.switcherItemBody}>
                  <span className={css.switcherItemTop}>
                    <span className={css.switcherItemName}>{item.name}</span>
                    {item.id === community.id && (
                      <span className={css.activeTag}>Активно</span>
                    )}
                    {(unread.communities[item.id] ?? 0) > 0 && (
                      <span className={css.badge}>{formatUnread(unread.communities[item.id] ?? 0)}</span>
                    )}
                  </span>
                  <span className={css.switcherItemMeta}>
                    {formatMembers(item.members)}
                  </span>
                </span>
              </button>
            ))}
            <button
              type="button"
              className={css.joinBtn}
              onClick={() => {
                setSwitcherOpen(false);
                setJoinOpen(true);
              }}
            >
              <Plus size={14} />
              Присоединиться к другому сообществу
            </button>
          </div>
        )}
      </div>

      <nav className={css.section}>
        <span className={css.sectionLabel}>Комнаты</span>
        <div className={css.list}>
          {rooms.map((room) => (
            <button
              key={room.id}
              type="button"
              className={css.roomBtn}
              data-active={room.id === activeRoomId}
              onClick={() => onSelectRoom(room.id)}
            >
              <Hash size={16} className={css.roomIcon} />
              <span className={css.roomName}>{room.name}</span>
              {(unread.rooms[room.id] ?? 0) > 0 && (
                <span className={css.badge}>{formatUnread(unread.rooms[room.id] ?? 0)}</span>
              )}
            </button>
          ))}
          {rooms.length === 0 && <span className={css.emptyHint}>Комнат пока нет.</span>}
        </div>
      </nav>

      <nav className={css.section}>
        <span className={css.sectionLabel}>Личные</span>
        <div className={css.list}>
          <button type="button" className={css.roomBtn} onClick={() => push("/dm")}>
            <MessageSquare size={16} className={css.roomIcon} />
            <span className={css.roomName}>Личные сообщения</span>
            {unread.direct > 0 && <span className={css.badge}>{formatUnread(unread.direct)}</span>}
          </button>
        </div>
      </nav>

      <div className={css.footer}>
        <div className={css.userCard}>
          <Avatar size={34} online />
          <span className={css.userInfo}>
            <span className={css.userName}>Аноним #{currentUserAnonId}</span>
            <span className={css.userMeta}>
              <span className={css.userDot} />В сети
            </span>
          </span>
          <button
            type="button"
            className={css.settingsBtn}
            aria-label="Профиль"
            onClick={() => push("/profile")}
          >
            <Settings size={16} />
          </button>
        </div>
      </div>

      {isJoinOpen && (
        <JoinCommunityModal
          onClose={() => setJoinOpen(false)}
          onJoined={(id) => {
            setJoinOpen(false);
            onSelectCommunity(id);
          }}
        />
      )}

    </aside>
  );
};

export default Sidebar;
