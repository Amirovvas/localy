"use client";
import { useEffect, useState } from "react";
import { Hash, MapPin, Users } from "lucide-react";
import styles from "../adminTable.module.css";
import css from "./communityOverview.module.css";
import { CommunityIcon } from "@/components/layout/CommunityIcon";
import SearchSelect from "@/components/ui/SearchSelect";
import { COMMUNITY_CATEGORY_LABELS } from "@/lib/mockData";
import { COMMUNITY_STATUS_LABELS } from "@/lib/admin";
import { useAdminCommunities } from "@/hooks/admin/useAdminCommunities";

const fmt = (value: number) => value.toLocaleString("ru-RU");

const CommunityOverview = () => {
  const { data: communities, isLoading } = useAdminCommunities();
  const [selectedId, setSelectedId] = useState<string[]>([]);

  // SearchSelect работает со строковыми id — как только список сообществ
  // загрузился, выбираем первое по умолчанию
  useEffect(() => {
    if (communities && communities.length > 0 && selectedId.length === 0) {
      setSelectedId([String(communities[0].id)]);
    }
  }, [communities, selectedId]);

  if (isLoading) {
    return <p className={css.emptyHint}>Загрузка...</p>;
  }

  if (!communities || communities.length === 0) {
    return <p className={css.emptyHint}>Сообществ пока нет.</p>;
  }

  const communityOptions = communities.map((c) => ({ id: String(c.id), label: c.name }));
  const community =
    communities.find((c) => String(c.id) === selectedId[0]) ?? communities[0];

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Сообщество</h1>
          <p className={styles.pageSubtitle}>
            Подробная информация о выбранном сообществе платформы.
          </p>
        </div>

        <div className={css.switcher}>
          <SearchSelect
            options={communityOptions}
            value={selectedId}
            onChange={(ids) => setSelectedId(ids.length ? ids : [String(communities[0].id)])}
            multiple={false}
            placeholder="Выберите сообщество"
          />
        </div>
      </div>

      <div className={css.summaryCard}>
        <div className={css.summaryHead}>
          <span className={css.communityIcon}>
            <CommunityIcon category={community.category} size={22} />
          </span>

          <div className={css.summaryTitleBlock}>
            <h2 className={css.communityName}>{community.name}</h2>
            <div className={css.summaryTags}>
              <span className={`${styles.badge} ${styles.badgeAccent}`}>
                {COMMUNITY_CATEGORY_LABELS[community.category]}
              </span>
              <span className={`${styles.badge} ${styles.badgeNeutral}`}>
                <MapPin size={11} />
                {community.city}
              </span>
              <span
                className={`${styles.badge} ${
                  community.status === "active"
                    ? styles.badgeSuccess
                    : community.status === "pending"
                      ? styles.badgeWarning
                      : styles.badgeNeutral
                }`}
              >
                {COMMUNITY_STATUS_LABELS[community.status]}
              </span>
            </div>
          </div>
        </div>

        <p className={css.description}>{community.description}</p>

        <div className={css.statsGrid}>
          <div className={css.stat}>
            <Users size={16} className={css.statIcon} />
            <span className={css.statValue}>{fmt(community.members)}</span>
            <span className={css.statLabel}>участников</span>
          </div>
          <div className={css.stat}>
            <Hash size={16} className={css.statIcon} />
            <span className={css.statValue}>{community.rooms.length}</span>
            <span className={css.statLabel}>комнат</span>
          </div>
        </div>
      </div>

      <div className={styles.card}>
        <div className={css.columnHeader}>
          <Hash size={14} />
          Комнаты
        </div>
        <div className={css.columnBody}>
          {community.rooms.map((room) => (
            <div key={room.id} className={styles.listRow}>
              <span># {room.name}</span>
            </div>
          ))}
          {community.rooms.length === 0 && (
            <p className={css.emptyHint}>Комнат пока нет.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommunityOverview;
