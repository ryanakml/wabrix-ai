import { useState } from "react";
import { LogOut } from "lucide-react";
import { Button } from "@flowdesk/ui";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "../../components/ui/card.js";
import { ConfirmDialog } from "../../components/ConfirmDialog.js";
import { useAuth } from "../auth/context.js";

export function ProfileView() {
  const { sessionUser, currentRole, handleLogout } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  if (!sessionUser) return null;

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your account details and session controls.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>
            Identity and access information for your Wabrix AI account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <dl className="divide-y divide-border rounded-md border border-border">
            <div className="grid gap-1 px-4 py-3 sm:grid-cols-[120px_1fr] sm:gap-4">
              <dt className="text-sm text-muted-foreground">Name</dt>
              <dd className="text-sm font-medium text-foreground">{sessionUser.displayName}</dd>
            </div>
            <div className="grid gap-1 px-4 py-3 sm:grid-cols-[120px_1fr] sm:gap-4">
              <dt className="text-sm text-muted-foreground">Email</dt>
              <dd className="text-sm font-medium text-foreground">{sessionUser.email ?? "—"}</dd>
            </div>
            <div className="grid gap-1 px-4 py-3 sm:grid-cols-[120px_1fr] sm:gap-4">
              <dt className="text-sm text-muted-foreground">Role</dt>
              <dd className="text-sm font-medium capitalize text-foreground">
                {currentRole.replace("_", " ")}
              </dd>
            </div>
          </dl>
          <Button
            variant="destructive"
            onClick={() => setShowLogoutConfirm(true)}
            data-testid="profile-logout-button"
          >
            <LogOut className="size-4" />
            Logout
          </Button>
        </CardContent>
      </Card>
      <ConfirmDialog
        open={showLogoutConfirm}
        onOpenChange={setShowLogoutConfirm}
        title="Log out of Wabrix AI?"
        description="Your current session will end on this device. You can sign in again at any time."
        confirmLabel="Logout"
        pending={loggingOut}
        onConfirm={async () => {
          setLoggingOut(true);
          setShowLogoutConfirm(false);
          try {
            await handleLogout();
          } finally {
            setLoggingOut(false);
          }
        }}
      />
    </div>
  );
}
