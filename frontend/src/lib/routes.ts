export const PUBLIC_ROUTES = ["/welcome", "/login", "/register"];

export const HOME_AFTER_LOGIN = "/";

export const isPublicRoute = (pathname: string | null | undefined) =>
  !!pathname &&
  PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
