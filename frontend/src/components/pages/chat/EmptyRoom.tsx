"use client";
import { MessageCircle, Paperclip, Reply, ShieldCheck } from "lucide-react";
import css from "./emptyRoom.module.css";
import { getRoomStarters } from "@/lib/roomStarters";

interface IProps {
  roomName: string;
  anonId: number;
  onPick: (text: string) => void;
}

const EmptyRoom = ({ roomName, anonId, onPick }: IProps) => {
  const starters = getRoomStarters(roomName);

  return (
    <div className={css.wrap}>
      <span className={css.icon}>
        <MessageCircle size={26} />
      </span>
      <h3 className={css.title}>Здесь пока тихо</h3>
      <p className={css.text}>
        Станьте первым в # {roomName}. Выберите подсказку или напишите своё.
      </p>

      <div className={css.starters}>
        {starters.map((starter) => (
          <button key={starter} type="button" className={css.starter} onClick={() => onPick(starter)}>
            {starter}
          </button>
        ))}
      </div>

      <ul className={css.tips}>
        <li>
          <ShieldCheck size={15} />
          <span>В чатах вы Аноним #{anonId}: имя и почту никто не видит.</span>
        </li>
        <li>
          <Reply size={15} />
          <span>Наведите на сообщение, чтобы ответить, поставить реакцию или закрепить.</span>
        </li>
        <li>
          <Paperclip size={15} />
          <span>Фото прикрепляется скрепкой рядом с полем ввода.</span>
        </li>
      </ul>
    </div>
  );
};

export default EmptyRoom;
