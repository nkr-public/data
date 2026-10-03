import React from "react";
import {
  Link as WouterLink,
  useLocation as useWouterLocation,
  useParams as useWouterParams,
} from "wouter";

/**
 * Petite couche de compatibilité au-dessus de wouter afin de conserver une
 * API proche de react-router-dom (Link `to`, useNavigate, useLocation en
 * objet, useParams) et limiter les changements dans les composants métier.
 */

interface LinkProps extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  to: string;
  children?: React.ReactNode;
}

export function Link({ to, children, ...rest }: LinkProps) {
  return (
    <WouterLink href={to} {...rest}>
      {children}
    </WouterLink>
  );
}

export function useNavigate() {
  const [, navigate] = useWouterLocation();
  return (to: string, options?: { replace?: boolean }) =>
    navigate(to, { replace: options?.replace });
}

export function useLocation(): { pathname: string } {
  const [pathname] = useWouterLocation();
  return { pathname };
}

export function useParams<T extends Record<string, string | undefined>>(): T {
  return useWouterParams() as T;
}
