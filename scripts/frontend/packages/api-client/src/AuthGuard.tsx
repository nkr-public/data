import React, { useEffect } from "react";
import { useCurrentUser } from "./useCurrentUser";

interface AuthGuardProps {
  children: React.ReactNode;
  pathname: string;
  navigate: (to: string, options?: { replace?: boolean }) => void;
  loginPath?: string;
}

export function AuthGuard({ children, pathname, navigate, loginPath = "/login" }: AuthGuardProps) {
  const { isLoading, isAuthenticated } = useCurrentUser();

  useEffect(() => {
    if (!isLoading && !isAuthenticated && pathname !== loginPath) {
      navigate(loginPath, { replace: true });
    }
  }, [isLoading, isAuthenticated, pathname, loginPath, navigate]);

  if (isLoading && pathname !== loginPath) return null;

  return <>{children}</>;
}
