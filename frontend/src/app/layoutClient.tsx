"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { useAuthStatus } from "@/hooks/auth/useHasToken";
import { useProfile } from "@/hooks/auth/useProfile";
import { useGetMyCommunities } from "@/hooks/communities/useGetMyCommunities";
import { fetchCommunity } from "@/hooks/communities/useGetCommunity";
import { fetchMessages } from "@/hooks/messages/useGetMessages";
import { readLandingHint } from "@/lib/landingHint";
import { isPublicRoute } from "@/lib/routes";

interface IProps {
  children: React.ReactNode;
}

const ADMIN_ROUTE = "/admin";

const AuthGate = ({ children }: IProps) => {
  const pathname = usePathname();
  const { replace } = useRouter();
  const isPublic = isPublicRoute(pathname);
  const authStatus = useAuthStatus();
  const isAuthorized = authStatus === "in";
  const { data: profile, isLoading: profileLoading } = useProfile();
  useGetMyCommunities();
  const queryClient = useQueryClient();
  const isAdminRoute = pathname === ADMIN_ROUTE || !!pathname?.startsWith(`${ADMIN_ROUTE}/`);
  const mustRedirectToAdmin = isAuthorized && !!profile?.is_admin && !isAdminRoute && !isPublic;

  useEffect(() => {
    if (authStatus === "out" && !isPublic) {
      replace("/welcome");
    }
  }, [authStatus, isPublic, replace]);

  useEffect(() => {
    if (!isAuthorized || pathname !== "/") return;
    const hint = readLandingHint();
    if (!hint) return;

    queryClient.prefetchQuery({
      queryKey: ["communities", hint.communityId],
      queryFn: () => fetchCommunity(hint.communityId),
    });
    queryClient.prefetchQuery({
      queryKey: ["messages", hint.roomId],
      queryFn: () => fetchMessages(hint.roomId),
    });
  }, [isAuthorized, pathname, queryClient]);

  useEffect(() => {
    if (mustRedirectToAdmin) {
      replace(ADMIN_ROUTE);
    }
  }, [mustRedirectToAdmin, replace]);

  if (isPublic) return <>{children}</>;
  if (!isAuthorized) return null;
  if (profileLoading) return null;
  if (mustRedirectToAdmin) return null;

  return <>{children}</>;
};

const LayoutClient = ({ children }: IProps) => {
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
