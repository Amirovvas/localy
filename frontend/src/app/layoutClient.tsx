"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuthStatus } from "@/hooks/auth/useHasToken";
import { useProfile } from "@/hooks/auth/useProfile";
import { isPublicRoute } from "@/lib/routes";

interface IProps {
  children: React.ReactNode;
}

const ADMIN_ROUTE = "/admin";

// Защита маршрутов: без accessToken любая страница, кроме входа/регистрации,
// сразу отправляет на /login. Пока проверка не завершилась ("unknown" — первый
// гидратационный рендер), закрытые страницы не рендерятся вовсе — иначе их
// содержимое мигнуло бы перед редиректом.
//
// Аккаунт администратора закрыт от остального сайта целиком: он видит только
// /admin, даже если зайти по прямой ссылке на /. Это не "запасной" вариант —
// админ-эндпоинты и так защищены на бэкенде, но пускать администратора в чат
// незачем: у Localy это разные роли, не один пользователь с расширенными правами
const AuthGate = ({ children }: IProps) => {
  const pathname = usePathname();
  const { replace } = useRouter();
  const isPublic = isPublicRoute(pathname);
  const authStatus = useAuthStatus();
  const isAuthorized = authStatus === "in";
  const { data: profile, isLoading: profileLoading } = useProfile();
  const isAdminRoute = pathname === ADMIN_ROUTE || !!pathname?.startsWith(`${ADMIN_ROUTE}/`);
  const mustRedirectToAdmin = isAuthorized && !!profile?.is_admin && !isAdminRoute && !isPublic;

  useEffect(() => {
    if (authStatus === "out" && !isPublic) {
      replace("/login");
    }
  }, [authStatus, isPublic, replace]);

  useEffect(() => {
    if (mustRedirectToAdmin) {
      replace(ADMIN_ROUTE);
    }
  }, [mustRedirectToAdmin, replace]);

  if (isPublic) return <>{children}</>;
  if (!isAuthorized) return null;
  // роль ещё не пришла с сервера — не показываем чат, пока не убедимся,
  // что это не аккаунт администратора
  if (profileLoading) return null;
  if (mustRedirectToAdmin) return null;

  return <>{children}</>;
};

const LayoutClient = ({ children }: IProps) => {
  // без staleTime каждый заход/возврат на страницу заново дёргает API, даже
  // если данные только что были получены
  const [qc] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={qc}>
      <AuthGate>{children}</AuthGate>
    </QueryClientProvider>
  );
};

export default LayoutClient;
