"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Check, Search, UserPlus } from "lucide-react";
import css from "./joinCommunityModal.module.css";
import Modal from "@/components/ui/Modal";
import { CommunityIcon } from "@/components/layout/CommunityIcon";
import { useDiscoverCommunities } from "@/hooks/communities/useDiscoverCommunities";
import { useJoinCommunity } from "@/hooks/communities/useJoinCommunity";
import { useUserLocation } from "@/hooks/useUserLocation";
import NearMeButton from "@/components/ui/NearMeButton";
import { formatMembers } from "@/lib/format";
import { formatDistance, sortByDistance } from "@/lib/geo";
import { getApiErrorMessage } from "@/lib/apiError";
import { COMMUNITY_CATEGORY_LABELS, type CommunityCategory } from "@/lib/mockData";

interface IProps {
  onClose: () => void;
  onJoined: (communityId: number) => void;
}

const CATEGORIES = Object.keys(COMMUNITY_CATEGORY_LABELS) as CommunityCategory[];

const JoinCommunityModal = ({ onClose, onJoined }: IProps) => {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState<CommunityCategory | null>(null);
  const [joiningId, setJoiningId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // не дёргаем API на каждую букву
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 250);
    return () => clearTimeout(timer);
  }, [search]);

  const {
    data: communities,
    isLoading,
    isError,
  } = useDiscoverCommunities(debouncedSearch, category);
  const joinCommunity = useJoinCommunity();

  // после разрешения геолокации список сортируется по расстоянию от пользователя
  const { coords, status: locationStatus, requestLocation } = useUserLocation();
  const sortedCommunities = communities ? sortByDistance(communities, coords) : undefined;

  const handleJoin = (communityId: number) => {
    setError(null);
    setJoiningId(communityId);
    joinCommunity.mutate(communityId, {
      onSuccess: () => onJoined(communityId),
      onError: (err) => {
        setJoiningId(null);
        setError(
          getApiErrorMessage(err) ?? "Не удалось вступить в сообщество. Попробуйте ещё раз.",
        );
      },
    });
  };

  // портал в body: у мобильного сайдбара есть transform, из-за которого fixed-окно
  // внутри него позиционировалось бы относительно сайдбара, а не экрана
  return createPortal(
    <Modal
      title="Присоединиться к сообществу"
      subtitle="Выберите сообщество, чтобы попасть в его чат, комнаты и локации."
      onClose={onClose}
      width={560}
    >
      <div className={css.searchWrap}>
        <Search size={15} className={css.searchIcon} />
        <input
          className={css.searchInput}
          placeholder="Поиск по названию или описанию"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          autoFocus
        />
      </div>

      <div className={css.nearMe}>
        <NearMeButton status={locationStatus} onClick={requestLocation} />
      </div>

      <div className={css.chips}>
        <button
          type="button"
          className={css.chip}
          data-active={category === null}
          onClick={() => setCategory(null)}
        >
          Все
        </button>
        {CATEGORIES.map((item) => (
          <button
            key={item}
            type="button"
            className={css.chip}
            data-active={category === item}
            onClick={() => setCategory(category === item ? null : item)}
          >
            {COMMUNITY_CATEGORY_LABELS[item]}
          </button>
        ))}
      </div>

      {error && <p className={css.error}>{error}</p>}

      <div className={css.list}>
        {isLoading && <p className={css.hint}>Загрузка...</p>}
        {isError && <p className={css.hint}>Не удалось загрузить список сообществ.</p>}

        {communities && communities.length === 0 && (
          <p className={css.hint}>
            {debouncedSearch || category
              ? "Ничего не найдено. Попробуйте изменить поиск или фильтр."
              : "Вы уже состоите во всех доступных сообществах."}
          </p>
        )}

        {sortedCommunities?.map((item) => (
          <div key={item.id} className={css.row}>
            <span className={css.rowIcon}>
              <CommunityIcon category={item.category} size={16} />
            </span>

            <div className={css.rowBody}>
              <span className={css.rowName}>{item.name}</span>
              <span className={css.rowMeta}>
                {COMMUNITY_CATEGORY_LABELS[item.category]} · {item.city} ·{" "}
                {formatMembers(item.members)}
                {item.distance !== null && ` · ${formatDistance(item.distance)} от вас`}
              </span>
              {item.description && <span className={css.rowDescription}>{item.description}</span>}
            </div>

            <button
              type="button"
              className={css.joinBtn}
              disabled={joiningId !== null}
              onClick={() => handleJoin(item.id)}
            >
              {joiningId === item.id ? (
                <>
                  <Check size={14} />
                  Вступаем...
                </>
              ) : (
                <>
                  <UserPlus size={14} />
                  Вступить
                </>
              )}
            </button>
          </div>
        ))}
      </div>
    </Modal>,
    document.body,
  );
};

export default JoinCommunityModal;
