"use client";
import { useEffect, useState } from "react";
import css from "./chat.module.css";
import Sidebar from "./Sidebar";
import ChatArea from "./ChatArea";
import InfoPanel from "./InfoPanel";
import JoinCommunityModal from "./JoinCommunityModal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useProfile } from "@/hooks/auth/useProfile";
import { useGetMyCommunities } from "@/hooks/communities/useGetMyCommunities";
import { useGetCommunity } from "@/hooks/communities/useGetCommunity";
import { useLeaveCommunity } from "@/hooks/communities/useLeaveCommunity";

const Chat = () => {
  const { data: profile } = useProfile();
  const { data: myCommunities, isLoading: communitiesLoading } = useGetMyCommunities();

  const [communityId, setCommunityId] = useState<number | null>(null);
  const [roomId, setRoomId] = useState<number | null>(null);
  // isSidebarOpen — выезжающая панель поверх чата на мобильном; isSidebarCollapsed —
  // схлопывание сайдбара на десктопе (просто освобождает ширину, без наплыва).
  // Обе кнопки-гамбургеры переключают их разом — на любой ширине экрана
  // реагирует только одна из них, вторая ни на что не влияет (см. media query)
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isInfoOpen, setInfoOpen] = useState(false);
  const [isLeaveOpen, setLeaveOpen] = useState(false);
  const [isJoinOpen, setJoinOpen] = useState(false);
  const leaveCommunity = useLeaveCommunity();

  // выбираем первое сообщество, как только пришёл список "моих"
  useEffect(() => {
    if (communityId === null && myCommunities && myCommunities.length > 0) {
      setCommunityId(myCommunities[0].id);
    }
  }, [myCommunities, communityId]);

  const { data: community, isLoading: communityLoading } = useGetCommunity(communityId);

  // выбираем первую комнату сообщества (или сохраняем текущий выбор, если он
  // всё ещё существует — например, после фонового обновления данных)
  useEffect(() => {
    if (!community) return;
    setRoomId((prev) => {
      if (prev && community.rooms.some((r) => r.id === prev)) return prev;
      return community.rooms[0]?.id ?? null;
    });
  }, [community]);

  const handleSelectCommunity = (id: number) => {
    setCommunityId(id);
    setSidebarOpen(false);
  };

  const handleSelectRoom = (id: number) => {
    setRoomId(id);
    setSidebarOpen(false);
  };

  const handleToggleSidebar = () => {
    setSidebarOpen((open) => !open);
    setSidebarCollapsed((collapsed) => !collapsed);
  };

  const handleCloseSidebar = () => {
    setSidebarOpen(false);
    setSidebarCollapsed(true);
  };

  const handleLeave = () => {
    if (communityId === null) return;

    leaveCommunity.mutate(communityId, {
      onSuccess: () => {
        // переходим в первое из оставшихся сообществ (список "моих" уже обновлён);
        // если их нет — Chat покажет экран "вы не состоите ни в одном"
        const remaining = (myCommunities ?? []).filter((item) => item.id !== communityId);
        setCommunityId(remaining[0]?.id ?? null);
        setRoomId(null);
        setLeaveOpen(false);
        setInfoOpen(false);
      },
    });
  };

  if (communitiesLoading) {
    return <div className={css.stateScreen}>Загрузка...</div>;
  }

  if (!myCommunities || myCommunities.length === 0) {
    return (
      <div className={css.stateScreen}>
        <p>Вы пока не состоите ни в одном сообществе.</p>
        <button type="button" className={css.stateBtn} onClick={() => setJoinOpen(true)}>
          Присоединиться к сообществу
        </button>
        {isJoinOpen && (
          <JoinCommunityModal
            onClose={() => setJoinOpen(false)}
            onJoined={(id) => {
              setJoinOpen(false);
              setCommunityId(id);
            }}
          />
        )}
      </div>
    );
  }

  if (communityLoading || !community) {
    return <div className={css.stateScreen}>Загрузка...</div>;
  }

  const room = community.rooms.find((r) => r.id === roomId);

  if (!room) {
    return <div className={css.stateScreen}>В этом сообществе пока нет комнат.</div>;
  }

  return (
    <div className={css.shell}>
      {(isSidebarOpen || isInfoOpen) && (
        <div
          className={css.scrim}
          onClick={() => {
            setSidebarOpen(false);
            setInfoOpen(false);
          }}
        />
      )}

      <Sidebar
        community={community}
        communities={myCommunities}
        rooms={community.rooms}
        activeRoomId={room.id}
        isOpen={isSidebarOpen}
        isCollapsed={isSidebarCollapsed}
        currentUserAnonId={profile?.anon_id ?? 0}
        onSelectCommunity={handleSelectCommunity}
        onSelectRoom={handleSelectRoom}
        onClose={handleCloseSidebar}
      />

      <ChatArea
        key={`${community.id}:${room.id}`}
        community={community}
        room={room}
        currentUserAnonId={profile?.anon_id ?? 0}
        onOpenSidebar={handleToggleSidebar}
        onOpenInfo={() => setInfoOpen(true)}
      />

      <InfoPanel
        community={community}
        events={community.events}
        isOpen={isInfoOpen}
        onClose={() => setInfoOpen(false)}
        onLeave={() => setLeaveOpen(true)}
      />

      {isLeaveOpen && (
        <ConfirmDialog
          title="Покинуть сообщество?"
          message={`Вы выйдете из «${community.name}» и перестанете видеть его чат и комнаты. Вернуться можно в любой момент через «Присоединиться к другому сообществу».`}
          confirmLabel={leaveCommunity.isPending ? "Выходим..." : "Покинуть"}
          onConfirm={handleLeave}
          onCancel={() => setLeaveOpen(false)}
        />
      )}
    </div>
  );
};

export default Chat;
