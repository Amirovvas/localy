"use client";
import { useState } from "react";
import { Check, Hash } from "lucide-react";
import css from "./forwardModal.module.css";
import Modal from "@/components/ui/Modal";
import { useGetCommunity } from "@/hooks/communities/useGetCommunity";
import { useGetMyCommunities } from "@/hooks/communities/useGetMyCommunities";
import { useForwardMessage } from "@/hooks/messages/useForwardMessage";
import { getApiErrorMessage } from "@/lib/apiError";
import type { ChatMessage } from "@/lib/chat";

interface IProps {
  message: ChatMessage;
  currentCommunityId: number;
  onClose: () => void;
}

const ForwardModal = ({ message, currentCommunityId, onClose }: IProps) => {
  const { data: communities = [] } = useGetMyCommunities();
  const forwardMessage = useForwardMessage();

  const [communityId, setCommunityId] = useState(currentCommunityId);
  const [roomId, setRoomId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [doneLabel, setDoneLabel] = useState<string | null>(null);

  const { data: community, isLoading } = useGetCommunity(communityId);
  const rooms = community && community.id === communityId ? community.rooms : [];

  const preview = message.text || "📷 Фото";

  const handleCommunity = (id: number) => {
    setCommunityId(id);
    setRoomId(null);
    setError(null);
  };

  const handleSubmit = () => {
    if (roomId === null) return;
    const room = rooms.find((item) => item.id === roomId);

    setError(null);
    forwardMessage.mutate(
      { messageId: message.id, roomId },
      {
        onSuccess: () => setDoneLabel(`# ${room?.name ?? ""} · ${community?.name ?? ""}`),
        onError: (err) => setError(getApiErrorMessage(err) ?? "Не удалось переслать сообщение"),
      },
    );
  };

  return (
    <Modal
      title="Переслать сообщение"
      subtitle={preview.length > 90 ? `${preview.slice(0, 90)}...` : preview}
      onClose={onClose}
      width={440}
    >
      {doneLabel ? (
        <div className={css.done}>
          <span className={css.doneIcon}>
            <Check size={22} />
          </span>
          <p className={css.doneTitle}>Сообщение переслано</p>
          <p className={css.doneText}>{doneLabel}</p>
          <button type="button" className={css.primaryBtn} onClick={onClose}>
            Закрыть
          </button>
        </div>
      ) : (
        <>
          <span className={css.label}>Сообщество</span>
          <div className={css.chips}>
            {communities.map((item) => (
              <button
                key={item.id}
                type="button"
                className={css.chip}
                data-active={item.id === communityId}
                onClick={() => handleCommunity(item.id)}
              >
                {item.name}
              </button>
            ))}
          </div>

          <span className={css.label}>Комната</span>
          <div className={css.rooms}>
            {isLoading && rooms.length === 0 && <p className={css.hint}>Загрузка...</p>}
            {rooms.map((room) => (
              <button
                key={room.id}
                type="button"
                className={css.room}
                data-active={room.id === roomId}
                onClick={() => setRoomId(room.id)}
              >
                <Hash size={15} />
                <span>{room.name}</span>
                {room.id === roomId && <Check size={15} className={css.roomCheck} />}
              </button>
            ))}
          </div>

          {error && <p className={css.error}>{error}</p>}

          <div className={css.actions}>
            <button type="button" className={css.cancelBtn} onClick={onClose}>
              Отмена
            </button>
            <button
              type="button"
              className={css.primaryBtn}
              onClick={handleSubmit}
              disabled={roomId === null || forwardMessage.isPending}
            >
              {forwardMessage.isPending ? "Пересылаем..." : "Переслать"}
            </button>
          </div>
        </>
      )}
    </Modal>
  );
};

export default ForwardModal;
