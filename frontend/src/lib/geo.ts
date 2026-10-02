export interface Coords {
  lat: number;
  lng: number;
}

// у сообщества координаты необязательны — у части мест их ещё нет
interface HasCoords {
  lat?: number | null;
  lng?: number | null;
}

const toRad = (degrees: number) => (degrees * Math.PI) / 180;

// расстояние по прямой между двумя точками на Земле (формула гаверсинусов), в км
export const distanceKm = (from: Coords, to: Coords) => {
  const earthRadiusKm = 6371;
  const dLat = toRad(to.lat - from.lat);
  const dLng = toRad(to.lng - from.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(from.lat)) * Math.cos(toRad(to.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * earthRadiusKm * Math.asin(Math.sqrt(a));
};

// "350 м" или "1,2 км"
export const formatDistance = (km: number) =>
  km < 1 ? `${Math.round(km * 100) * 10} м` : `${km.toFixed(1).replace(".", ",")} км`;

// добавляет каждому месту поле distance (км) и сортирует: сначала ближайшие,
// места без координат — в конце в прежнем порядке. Без позиции пользователя
// список возвращается как есть
export const sortByDistance = <T extends HasCoords>(
  items: T[],
  from: Coords | null,
): (T & { distance: number | null })[] => {
  const withDistance = items.map((item) => ({
    ...item,
    distance:
      from && item.lat != null && item.lng != null
        ? distanceKm(from, { lat: item.lat, lng: item.lng })
        : null,
  }));
  if (!from) return withDistance;

  return withDistance.sort((a, b) => {
    if (a.distance === null && b.distance === null) return 0;
    if (a.distance === null) return 1;
    if (b.distance === null) return -1;
    return a.distance - b.distance;
  });
};
