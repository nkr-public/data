import React, { useState } from "react";
import { AlertCircle, ArrowRight, Layers, Lock, User } from "lucide-react";
import { createApiClient, createAuthApi } from "@app/api-client";
import { translateApiError, useTranslation } from "@app/i18n";
import { Button, Input } from "@app/ui";
import { useNavigate } from "../../lib/router";
import { useRefreshCurrentUser } from "../../lib/useCurrentUser";

export default function LoginPage() {
  const { t } = useTranslation("app");
  const navigate = useNavigate();
  const refreshCurrentUser = useRefreshCurrentUser();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    try {
      // Le cookie HttpOnly de session est pose par le serveur ; aucun jeton
      // n'est manipule cote frontend.
      await createAuthApi(createApiClient()).login(username, password);
      // Actualise la query commune ["auth", "me"].
      await refreshCurrentUser();
      navigate("/");
    } catch (err: any) {
      setErrorMsg(err?.status === 401 ? translateApiError(err) : t("login.error"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex bg-primary text-primary-foreground p-3 rounded-2xl">
            <Layers className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">{t("login.title")}</h1>
          <p className="text-sm text-foreground-muted">{t("login.subtitle")}</p>
        </div>

        {errorMsg && (
          <div className="flex items-start gap-2 rounded-xl border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">
              {t("login.username")}
            </span>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted pointer-events-none" />
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                className="pl-10"
                required
              />
            </div>
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">
              {t("login.password")}
            </span>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted pointer-events-none" />
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="pl-10"
                required
              />
            </div>
          </label>

          <Button type="submit" className="w-full" disabled={isLoading}>
            <span>{isLoading ? t("login.submitting") : t("login.submit")}</span>
            {!isLoading && <ArrowRight className="w-4 h-4" />}
          </Button>
        </form>
      </div>
    </div>
  );
}
