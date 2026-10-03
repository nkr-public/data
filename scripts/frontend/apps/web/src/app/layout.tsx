import type { ReactNode } from "react";
import { useEffect } from "react";
import { Layers } from "lucide-react";
import { AuthGuard, UserHeader, useCurrentUser } from "@app/api-client";
import { LanguageSwitcher, useTranslation } from "@app/i18n";
import { SettingsMenu, Titlebar, showToast } from "@app/ui";
import { Link, useLocation, useNavigate } from "@/lib/router";
import appPkg from "../../package.json";

const APP_NAME = "PTools";

export default function AppLayout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const pathname = useLocation().pathname;
  const { t } = useTranslation("common");
  const { isAuthenticated } = useCurrentUser();
  const isLoginPage = pathname === "/login";

  // Le client HTTP emet "app:forbidden" sur un 403 : on l'affiche en toast, sans deconnecter.
  useEffect(() => {
    const onForbidden = (event: Event) => {
      const detail = (event as CustomEvent<{ message?: string }>).detail;
      showToast({
        title: t("access.deniedTitle"),
        message: detail?.message ?? t("access.deniedMessage"),
        variant: "error",
      });
    };
    window.addEventListener("app:forbidden", onForbidden);
    return () => window.removeEventListener("app:forbidden", onForbidden);
  }, [t]);

  return (
    <AuthGuard pathname={pathname} navigate={navigate}>
      <Titlebar
        icon={
          <Link to="/" className="flex items-center gap-2">
            <span className="bg-primary text-primary-foreground p-1.5 rounded-xl">
              <Layers className="w-4 h-4" />
            </span>
          </Link>
        }
        appName={APP_NAME}
        forceShowControls={false}
        actions={
          <>
            <LanguageSwitcher className="text-xs font-semibold bg-transparent border border-border rounded-lg px-2 py-1" />
            <SettingsMenu
              info={{
                appName: APP_NAME,
                version: appPkg.version,
                environment: import.meta.env.MODE,
                apiUrl: import.meta.env.VITE_API_BASE_URL,
              }}
            />
            {isAuthenticated && !isLoginPage && <UserHeader navigate={navigate} />}
          </>
        }
      />
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8">{children}</main>
    </AuthGuard>
  );
}
