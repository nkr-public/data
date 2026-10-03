import { Switch, Route } from "wouter";
import { initI18n } from "@app/i18n";
import { ToastProvider } from "@app/ui";
import { AppProviders } from "@app/api-client";
import AppLayout from "./app/layout";
import HomePage from "./app/page";
import LoginPage from "./app/login/page";
import "./app/globals.css";

initI18n();

function NotFound() {
  return <p className="p-8 text-center text-foreground-muted text-sm">Page introuvable.</p>;
}

export default function App() {
  return (
    <AppProviders queryStaleTime={5_000}>
      <AppLayout>
        <Switch>
          <Route path="/" component={HomePage} />
          <Route path="/login" component={LoginPage} />
          <Route component={NotFound} />
        </Switch>
      </AppLayout>
      <ToastProvider />
    </AppProviders>
  );
}
