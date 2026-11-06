import { useAuth } from "../auth/context.js";
import { Link } from "@tanstack/react-router";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "../../components/ui/card.js";
import { Badge, Button } from "@flowdesk/ui";
import { Building2, ShieldCheck, UserCheck, Users, Inbox } from "lucide-react";

export function WorkspaceView() {
  const { activeOrg, currentRole, checkPermission } = useAuth();
  const canInvite = checkPermission("membership:invite");

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-8" data-testid="workspace-view">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Building2 className="size-6 text-primary" />
          Workspace Settings
        </h2>
        <p className="text-sm text-muted-foreground">
          View your organization profile, multi-tenant isolation status, and role privileges.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Tenant Overview</CardTitle>
              <Badge
                variant="outline"
                className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 inline-flex items-center gap-1"
              >
                <ShieldCheck className="size-3.5" />
                Isolated Tenant
              </Badge>
            </div>
            <CardDescription>Verified workspace boundary within Wabrix AI.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">Organization Name</span>
              <p className="font-medium text-foreground">{activeOrg?.name ?? "—"}</p>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">Organization ID</span>
              <p className="font-mono text-xs text-foreground bg-muted/40 p-1.5 rounded border border-border">
                {activeOrg?.id ?? "—"}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">Your Active Role</span>
              <p className="font-medium text-foreground capitalize flex items-center gap-1.5">
                <UserCheck className="size-4 text-primary" />
                {currentRole}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border flex flex-col justify-between">
          <div>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Team & Collaboration</CardTitle>
                <Users className="size-5 text-muted-foreground" />
              </div>
              <CardDescription>Manage agents, team roles, and pending invitations.</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>
                Team members can collaborate on WhatsApp inbox conversations, train AI knowledge
                policies, and manage developer keys according to their RBAC role.
              </p>
            </CardContent>
          </div>
          <CardFooter className="border-t pt-4">
            {canInvite ? (
              <Button
                asChild
                id="workspace-invite-team-btn"
                className="cursor-pointer inline-flex items-center gap-1.5"
              >
                <Link to="/team" search={{ openInvite: true }}>
                  <Users className="size-4" />
                  Invite team members
                </Link>
              </Button>
            ) : (
              <p className="text-xs text-muted-foreground">
                Only Owners and Admins have permission to invite new members.
              </p>
            )}
          </CardFooter>
        </Card>
      </div>

      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center p-8 text-center">
          <div className="rounded-full bg-muted p-3 mb-3">
            <Inbox className="size-6 text-muted-foreground" />
          </div>
          <CardTitle className="text-base mb-1">Inbox is clear</CardTitle>
          <CardDescription className="max-w-md">
            No active conversations or tickets yet. Your secure tenant boundary in{" "}
            <strong className="text-foreground">{activeOrg?.name}</strong> is verified and ready.
          </CardDescription>
        </CardContent>
      </Card>
    </div>
  );
}
