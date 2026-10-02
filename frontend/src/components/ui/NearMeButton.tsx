"use client";
import { Loader2, LocateFixed } from "lucide-react";
import css from "./nearMeButton.module.css";
import type { LocationStatus } from "@/hooks/useUserLocation";

interface IProps {
  status: LocationStatus;
  onClick: () => void;
}

// кнопка "Найти рядом со мной" + пояснение под ней (используется при
// регистрации и в окне "Присоединиться к сообществу")
const NearMeButton = ({ status, onClick }: IProps) => (
  <div className={css.wrap}>
    <button
      type="button"
      className={css.button}
      onClick={onClick}
      disabled={status === "loading"}
    >
      {status === "loading" ? (
        <Loader2 size={14} className={css.spin} />
      ) : (
        <LocateFixed size={14} />
      )}
      {status === "granted" ? "Обновить местоположение" : "Найти рядом со мной"}
    </button>

    {status === "granted" && (
      <span className={css.hint}>Места отсортированы по расстоянию от вас.</span>
    )}
    {status === "denied" && (
      <span className={css.hint}>
        Нет доступа к геолокации. Разрешите её в настройках браузера или выберите места вручную.
      </span>
    )}
    {status === "unsupported" && (
      <span className={css.hint}>Ваш браузер не поддерживает геолокацию.</span>
    )}
    {status === "idle" && (
      <span className={css.hint}>
        Ваше местоположение не сохраняется и никому не передаётся.
      </span>
    )}
  </div>
);

export default NearMeButton;
