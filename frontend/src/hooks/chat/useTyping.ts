import { useCallback, useEffect, useRef, useState } from "react";
import { getSocket } from "@/lib/socket";

interface TypingPayload {
  roomId: number;
  anon_id: number;
  isTyping: boolean;
}

// пока от человека не приходит новых "печатает", считаем что он замолчал:
// защита на случай, если событие "перестал" потерялось (обрыв сети, закрыли вкладку)
const TYPING_TTL_MS = 5000;
// повторно отправляем "печатает" не чаще раза в 2 секунды, а не на каждую букву
const EMIT_INTERVAL_MS = 2000;
// после паузы в наборе шлём "перестал"
const IDLE_MS = 3000;

// "кто сейчас печатает" в текущей комнате
export const useTyping = (roomId: number) => {
  // anon_id -> момент, когда запись протухнет
  const [typers, setTypers] = useState<Record<number, number>>({});
  const lastEmitRef = useRef(0);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const socket = getSocket();

    const handleTyping = (payload: TypingPayload) => {
      if (payload.roomId !== roomId) return;

      setTypers((prev) => {
        const next = { ...prev };
        if (payload.isTyping) next[payload.anon_id] = Date.now() + TYPING_TTL_MS;
        else delete next[payload.anon_id];
        return next;
      });
    };

    socket.on("typing", handleTyping);
    return () => {
      socket.off("typing", handleTyping);
    };
  }, [roomId]);

  // убираем протухшие записи
  useEffect(() => {
    if (Object.keys(typers).length === 0) return;

    const timer = setInterval(() => {
      const now = Date.now();
      setTypers((prev) => {
        const entries = Object.entries(prev).filter(([, expiresAt]) => expiresAt > now);
        return entries.length === Object.keys(prev).length
          ? prev
          : Object.fromEntries(entries);
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [typers]);

  const emit = useCallback(
    (isTyping: boolean) => {
      const socket = getSocket();
      if (socket.connected) socket.emit("typing", { roomId, isTyping });
    },
    [roomId],
  );

  const stopTyping = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
    if (lastEmitRef.current !== 0) {
      emit(false);
      lastEmitRef.current = 0;
    }
  }, [emit]);

  const notifyTyping = useCallback(() => {
    const now = Date.now();
    if (now - lastEmitRef.current > EMIT_INTERVAL_MS) {
      emit(true);
      lastEmitRef.current = now;
    }

    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(stopTyping, IDLE_MS);
  }, [emit, stopTyping]);

  // ушли из комнаты — сообщаем, что перестали печатать
  useEffect(() => stopTyping, [stopTyping]);

  return { typingIds: Object.keys(typers).map(Number), notifyTyping, stopTyping };
};
