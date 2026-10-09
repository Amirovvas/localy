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
import { useClearChat } from "@/hooks/messages/useClearChat";
import { useUnreadSummary } from "@/hooks/messages/useUnreadSummary";
import { formatUnread } from "@/lib/format";
import { saveLandingHint } from "@/lib/landingHint";

const Chat = () => {
  const { data: profile } = useProfile();
  const { data: myCommunities, isLoading: communitiesLoading } = useGetMyCommunities();

  const [communityId, setCommunityId] = useState<number | null>(null);
  const [roomId, setRoomId] = useState<number | null>(null);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isInfoOpen, setInfoOpen] = useState(false);
  const [isLeaveOpen, setLeaveOpen] = useState(false);
  const [isClearOpen, setClearOpen] = useState(false);
  const [isJoinOpen, setJoinOpen] = useState(false);
  const leaveCommunity = useLeaveCommunity();
  const clearChat = useClearChat();
  const unreadTotal = useUnreadSummary(roomId).total;

  useEffect(() => {
    const base = "Localy — чат сообщества";
    document.title = unreadTotal > 0 ? `(${formatUnread(unreadTotal)}) ${base}` : base;
    return () => {
      document.title = base;
    };
  }, [unreadTotal]);

  useEffect(() => {
    if (communityId === null && myCommunities && myCommunities.length > 0) {
      setCommunityId(myCommunities[0].id);
    }
  }, [myCommunities, communityId]);

  const { data: community, isLoading: communityLoading } = useGetCommunity(communityId);

  useEffect(() => {
    if (!community) return;
    setRoomId((prev) => {
      if (prev && community.rooms.some((r) => r.id === prev)) return prev;
      return community.rooms[0]?.id ?? null;
    });
  }, [community]);

  useEffect(() => {
    const firstRoom = community?.rooms[0];
    if (community && firstRoom && myCommunities?.[0]?.id === community.id) {
      saveLandingHint({ communityId: community.id, roomId: firstRoom.id });
    }
  }, [community, myCommunities]);

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
        const remaining = (myCommunities ?? []).filter((item) => item.id !== communityId);
        setCommunityId(remaining[0]?.id ?? null);
        setRoomId(null);
        setLeaveOpen(false);
        setInfoOpen(false);
      },
    });
  };

  const handleClearChat = () => {
    if (roomId === null) return;

    clearChat.mutate(roomId, {
      onSuccess: () => setClearOpen(false),
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
        onClearChat={() => setClearOpen(true)}
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

      {isClearOpen && (
        <ConfirmDialog
          title="Очистить чат?"
          message={`История комнаты «${room.name}» исчезнет только у вас. Остальные участники продолжат видеть все сообщения как раньше. Отменить это действие нельзя.`}
          confirmLabel={clearChat.isPending ? "Очищаем..." : "Очистить"}
          onConfirm={handleClearChat}
          onCancel={() => setClearOpen(false)}
        />
      )}
    </div>
  );
};

export default Chat;
