"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import css from "./startDirectModal.module.css";
import Modal from "@/components/ui/Modal";
import { useStartConversation } from "@/hooks/direct/useStartConversation";
import { getApiErrorMessage } from "@/lib/apiError";

interface IProps {
  anonId: number;
  communityId: number;
  onClose: () => void;
}

const StartDirectModal = ({ anonId, communityId, onClose }: IProps) => {
  const { push } = useRouter();
  const startConversation = useStartConversation();
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) {
      setError("Напишите первое сообщение");
      return;
    }

    setError(null);
    startConversation.mutate(
      { anonId, text: trimmed, communityId },
      {
        onSuccess: ({ id }) => push(`/dm?c=${id}`),
        onError: (err) => setError(getApiErrorMessage(err) ?? "Не удалось отправить запрос"),
      },
    );
  };

  return (
    <Modal
      title={`Написать Аноним #${anonId}`}
      subtitle="Собеседник увидит запрос и сможет принять или отклонить его. Ваше имя и почта ему не видны."
      onClose={onClose}
      width={460}
    >
      <form className={css.form} onSubmit={handleSubmit}>
        <textarea
          className={css.textarea}
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Например: привет, видел твоё сообщение про ярмарку, ты идёшь?"
          rows={4}
          maxLength={4000}
          autoFocus
        />

        {error && <p className={css.error}>{error}</p>}

        <div className={css.actions}>
          <button type="button" className={css.cancelBtn} onClick={onClose}>
            Отмена
          </button>
          <button type="submit" className={css.sendBtn} disabled={startConversation.isPending}>
            {startConversation.isPending ? "Отправляем..." : "Отправить запрос"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default StartDirectModal;
