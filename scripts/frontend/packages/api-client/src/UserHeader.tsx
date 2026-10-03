import React from "react";
import { useCurrentUser, useLogout } from "./useCurrentUser";
import {UserMenu} from "@app/ui";

interface UserHeaderProps {
  navigate: (to: string, options?: { replace?: boolean }) => void;
  loginPath?: string;
  getRoleLabel?: (roles: string[] | undefined) => string;
}

export function UserHeader({
  navigate,
  loginPath = "/login",
  getRoleLabel = (roles) => (roles?.includes("ROLE_ADMIN") ? "Admin" : "Utilisateur"),
}: UserHeaderProps) {
  const { user } = useCurrentUser();
  const logout = useLogout();

  const handleLogout = () => {
    logout().finally(() => {
      navigate(loginPath);
    });
  };

  if (!user) {
    return null;
  }

  return (
    <UserMenu
      user={{
        username: user.username,
        email: user.email,
        role: getRoleLabel(user.roles),
      }}
      onLogout={handleLogout}
    />
  );
}
