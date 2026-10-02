"use client";
import { useState } from "react";
import type { Coords } from "@/lib/geo";

export type LocationStatus = "idle" | "loading" | "granted" | "denied" | "unsupported";

// определяет позицию пользователя через браузер (спросит разрешение).
// Координаты живут только в памяти этой страницы — на сервер не отправляются
// и нигде не сохраняются, расстояния считаются прямо в браузере
export const useUserLocation = () => {
  const [coords, setCoords] = useState<Coords | null>(null);
  const [status, setStatus] = useState<LocationStatus>("idle");

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setStatus("unsupported");
      return;
    }

    setStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
        setStatus("granted");
      },
      () => setStatus("denied"),
      { timeout: 10_000 },
    );
  };

  return { coords, status, requestLocation };
};
