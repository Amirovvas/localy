// Страницы, доступные без авторизации — вход и регистрация. Всё остальное —
// закрытая часть приложения (чат и т. д.).
export const PUBLIC_ROUTES = ["/login", "/register"];

// куда попадает пользователь после успешного входа
export const HOME_AFTER_LOGIN = "/";

export const isPublicRoute = (pathname: string | null | undefined) =>
  !!pathname &&
  PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
