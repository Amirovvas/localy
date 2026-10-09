const KEY = "localy:landing";

interface LandingHint {
  communityId: number;
  roomId: number;
}

export const readLandingHint = (): LandingHint | null => {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<LandingHint>;
    if (typeof parsed.communityId === "number" && typeof parsed.roomId === "number") {
      return { communityId: parsed.communityId, roomId: parsed.roomId };
    }
  } catch {
    return null;
  }
  return null;
};

export const saveLandingHint = (hint: LandingHint) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(hint));
  } catch {
    return;
  }
};
