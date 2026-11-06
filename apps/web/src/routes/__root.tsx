import * as React from "react";
import { useEffect } from "react";
import { createRootRoute, Outlet, Link, useRouterState } from "@tanstack/react-router";
import { useAuth } from "../features/auth/context.js";
import { AppShell } from "../components/layout/AppShell.js";
import { LoginView } from "../features/auth/LoginView.js";
import { OnboardingView } from "../features/onboarding/OnboardingView.js";
import { InvitationView } from "../features/invitations/InvitationView.js";

import { Card } from "../components/ui/card.js";
import { Button } from "@flowdesk/ui";
import { AlertCircle, FileQuestion, RefreshCw } from "lucide-react";

export const Route = createRootRoute({
  component: RootComponent,
  notFoundComponent: RootNotFoundComponent,
  errorComponent: RootErrorComponent
});

function RootNotFoundComponent() {
  return (
    <div className="mx-auto flex min-h-[70vh] flex-col items-center justify-center p-6 text-center">
      <Card className="max-w-md border-border p-8 text-center shadow-lg">
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-muted">
          <FileQuestion className="size-7 text-muted-foreground" />
        </div>
        <h2 className="text-3xl font-bold tracking-tight text-foreground mb-1">
          404 — Page Not Found
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          The page you requested could not be found or has been moved to another location.
        </p>
        <Button asChild className="w-full cursor-pointer">
          <Link to="/inbox">Return to Inbox</Link>
        </Button>
      </Card>
    </div>
  );
}

function RootErrorComponent({ error }: { error: unknown }) {
  if (process.env["NODE_ENV"] !== "production") {
    console.error("Router error:", error);
  }
  return (
    <div className="mx-auto flex min-h-[70vh] flex-col items-center justify-center p-6 text-center">
      <Card className="max-w-md border-destructive/30 bg-destructive/5 p-8 text-center shadow-lg">
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertCircle className="size-7" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground mb-1">
          An unexpected error occurred
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          A client application error occurred. Please reload or return to the inbox.
        </p>
        <div className="flex flex-col gap-2">
          <Button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="size-4" />
            Reload Application
          </Button>
          <Button asChild variant="outline" className="cursor-pointer">
            <Link to="/inbox">Return to Inbox</Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}

function RootComponent() {
  const { sessionUser, loading, organizations, inviteToken } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // Synchronize document title on route transitions
  useEffect(() => {
    let title = "Wabrix AI";
    if (pathname.startsWith("/inbox")) title = "Wabrix AI — Inbox";
    else if (pathname.startsWith("/analytics")) title = "Wabrix AI — Analytics";
    else if (pathname.startsWith("/knowledge")) title = "Wabrix AI — AI Knowledge";
    else if (pathname === "/channels/guide") title = "Wabrix AI — WhatsApp Setup Guide";
    else if (pathname.startsWith("/channels")) title = "Wabrix AI — WhatsApp Channels";
    else if (pathname.startsWith("/developer")) title = "Wabrix AI — Developer APIs";
    else if (pathname.startsWith("/team")) title = "Wabrix AI — Team Settings";
    else if (pathname.startsWith("/audit")) title = "Wabrix AI — Audit Log";
    else if (pathname.startsWith("/profile")) title = "Wabrix AI — Profile";
    else if (pathname.startsWith("/settings/workspace")) title = "Wabrix AI — Workspace";
    document.title = title;
  }, [pathname]);

  // 1. Loading State
  if (loading) {
    return (
      <div className="login-wrap">
        <div className="glass-card login-card" role="status" aria-live="polite">
          <div className="login-icon">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="16" />
            </svg>
          </div>
          <h2 className="login-title">Loading Wabrix AI…</h2>
          <p className="login-subtitle">Verifying secure tenant session</p>
        </div>
      </div>
    );
  }

  // The root route is public. Protected routes continue through the existing
  // session gate below, so landing-page visitors never get bounced to SSO.
  if (pathname === "/" && !inviteToken) {
    return <Outlet />;
  }

  // 2. Unauthenticated Login Screen
  if (!sessionUser) {
    return <LoginView />;
  }

  // 3. Pending Invitation State
  if (inviteToken) {
    return <InvitationView />;
  }

  // 4. Onboarding / Bootstrap Screen (Zero Organizations)
  if (organizations.length === 0) {
    return <OnboardingView />;
  }

  // 5. Authenticated Enterprise AppShell
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
