"use client";
import { Lock, LogOut, MapPin, Users, X } from "lucide-react";
import css from "./infoPanel.module.css";
import { CommunityIcon } from "@/components/layout/CommunityIcon";
import type { ChatCommunityDetail, ChatEvent } from "@/lib/chat";

interface IProps {
  community: ChatCommunityDetail;
  events: ChatEvent[];
  isOpen: boolean;
  onClose: () => void;
  onLeave: () => void;
}

const fmt = (value: number) => value.toLocaleString("ru-RU");

const InfoPanel = ({ community, events, isOpen, onClose, onLeave }: IProps) => {
  return (
    <aside className={css.info} data-open={isOpen}>
      <div className={css.header}>
        <button type="button" className={css.closeBtn} onClick={onClose} aria-label="Закрыть панель">
          <X size={18} />
        </button>

        <span className={css.communityIcon}>
          <CommunityIcon category={community.category} size={20} />
        </span>

        <h3 className={css.communityName}>{community.name}</h3>
        <span className={css.communityKind}>Сообщество</span>

        <div className={css.stats}>
          <div className={css.stat}>
            <Users size={14} className={css.statIcon} />
            <span className={css.statValue}>{fmt(community.members)}</span>
            <span className={css.statLabel}>участников</span>
          </div>
        </div>

        <p className={css.communityDescription}>{community.description}</p>
      </div>

      <div className={css.section}>
        <div className={css.sectionHead}>
          <span className={css.sectionLabel}>Предстоящие события</span>
          <button type="button" className={css.viewAll}>
            Показать все
          </button>
        </div>
        <div className={css.eventList}>
          {events.map((event) => (
            <div key={event.id} className={css.eventCard}>
              <div className={css.eventDate}>
                <span className={css.eventDay}>{event.day}</span>
                <span className={css.eventMonth}>{event.month}</span>
              </div>

              <div className={css.eventBody}>
                <span className={css.eventTitle}>{event.title}</span>
                <span className={css.eventMeta}>
                  <MapPin size={12} />
                  {event.place}
                </span>
                <span className={css.eventMeta}>{event.when}</span>
              </div>
            </div>
          ))}
          {events.length === 0 && (
            <span className={css.emptyHint}>
              У вас пока нет событий. Отметьте сообщение в чате кнопкой «Отметить как
              событие».
            </span>
          )}
        </div>
      </div>

      <button type="button" className={css.leaveBtn} onClick={onLeave}>
        <LogOut size={14} />
        Покинуть сообщество
      </button>

      <div className={css.privacyNote}>
        <Lock size={14} className={css.privacyIcon} />
        <p className={css.privacyText}>
          Ваша личность скрыта от всех участников сообщества.
        </p>
      </div>
    </aside>
  );
};

export default InfoPanel;
