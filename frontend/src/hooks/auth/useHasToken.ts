import { useSyncExternalStore } from "react";

const subscribeToken = (onChange: () => void) => {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
};

export type AuthStatus = "unknown" | "in" | "out";

const getStatus = (): AuthStatus =>
  localStorage.getItem("accessToken") ? "in" : "out";

const getServerStatus = (): AuthStatus => "unknown";

export const useAuthStatus = () =>
  useSyncExternalStore(subscribeToken, getStatus, getServerStatus);

export const useHasToken = () => useAuthStatus() === "in";
