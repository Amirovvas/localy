import { useCallback, useEffect, useRef, useState } from "react";
import { getSocket } from "@/lib/socket";

interface TypingPayload {
  roomId: number;
  anon_id: number;
  isTyping: boolean;
}

const TYPING_TTL_MS = 5000;
const EMIT_INTERVAL_MS = 2000;
const IDLE_MS = 3000;

export const useTyping = (roomId: number) => {
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

  useEffect(() => stopTyping, [stopTyping]);

  return { typingIds: Object.keys(typers).map(Number), notifyTyping, stopTyping };
};
