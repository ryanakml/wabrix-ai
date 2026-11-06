import {
  CalendarDays,
  Check,
  Clock3,
  Copy,
  MessageSquare,
  MoreHorizontal,
  RotateCw,
  ShieldCheck
} from "lucide-react";
import { useState } from "react";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@flowdesk/ui";
import { Card } from "../../components/ui/card.js";
import type { ChannelClientRecord } from "../../api.js";
import { WhatsAppIcon } from "./WhatsAppIcon.js";

interface Props {
  channel: ChannelClientRecord;
  canManage: boolean;
  busy: boolean;
  verifying: boolean;
  onReconnect: () => void;
  onVerify: () => void;
  onDisconnect: () => void;
  showToast: (message: string, isError?: boolean) => void;
}

function CopyId({
  label,
  value,
  showToast
}: {
  label: string;
  value: string;
  showToast: Props["showToast"];
}) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="min-w-0 space-y-1">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="flex min-w-0 items-center gap-1.5 text-sm">
        <span className="break-all font-mono text-foreground">{value || "—"}</span>
        <Button
          variant="ghost"
          size="icon"
          className="size-7 shrink-0 text-muted-foreground"
          disabled={!value}
          aria-label={`Copy ${label}`}
          onBlur={() => setCopied(false)}
          onClick={() => {
            if (!navigator.clipboard?.writeText) {
              showToast(`Could not copy ${label}. Select and copy it manually.`, true);
              return;
            }
            void navigator.clipboard
              .writeText(value)
              .then(() => {
                setCopied(true);
                showToast(`${label} copied.`);
              })
              .catch(() =>
                showToast(`Could not copy ${label}. Select and copy it manually.`, true)
              );
          }}
        >
          {copied ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
        </Button>
      </dd>
    </div>
  );
}

export function ChannelCard({
  channel,
  canManage,
  busy,
  verifying,
  onReconnect,
  onVerify,
  onDisconnect,
  showToast
}: Props) {
  const state = channel.status.toLowerCase();
  const healthy = state === "active";
  const warning = state === "degraded" || state === "pending";
  const color = healthy
    ? "text-success"
    : warning
      ? "text-warning"
      : state === "disconnected"
        ? "text-destructive"
        : "text-muted-foreground";
  const surface = healthy
    ? "bg-success/10"
    : warning
      ? "bg-warning/10"
      : state === "disconnected"
        ? "bg-destructive/10"
        : "bg-muted";
  const date = new Date(channel.createdAt);
  return (
    <Card
      className="@container relative gap-0 rounded-lg p-4 shadow-none sm:p-5"
      data-testid="channel-card"
    >
      <div className="grid min-w-0 gap-5 @min-[860px]:grid-cols-[minmax(180px,1fr)_minmax(360px,1.4fr)_auto]">
        <div className="flex min-w-0 items-start gap-4 pr-8 @min-[860px]:border-r @min-[860px]:border-border/60 @min-[860px]:pr-5">
          <div
            className={`flex size-12 shrink-0 items-center justify-center rounded-xl ${surface} ${color}`}
          >
            <WhatsAppIcon className="size-7" />
          </div>
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="break-words text-sm font-semibold text-foreground">{channel.name}</h3>
              <span
                className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium ${surface} ${color}`}
              >
                <Clock3 className="size-3" aria-hidden="true" />
                {healthy
                  ? "Connected"
                  : warning
                    ? "Reconnect needed"
                    : state === "disconnected"
                      ? "Disconnected"
                      : "Inactive"}
              </span>
            </div>
            <span className="inline-flex rounded bg-muted px-2 py-0.5 text-[10px] font-medium text-foreground">
              WhatsApp Cloud
            </span>
          </div>
        </div>
        <div className="min-w-0 space-y-4">
          <dl className="grid gap-x-5 gap-y-3 sm:grid-cols-2">
            <CopyId label="Phone Number ID" value={channel.phoneNumberId} showToast={showToast} />
            <CopyId label="WABA ID" value={channel.wabaId} showToast={showToast} />
          </dl>
          <dl className="flex flex-wrap gap-x-6 gap-y-3 text-xs">
            <div className="flex items-start gap-2">
              <CalendarDays
                className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
              <div>
                <dt className="text-[10px] text-muted-foreground">Connected on</dt>
                <dd
                  className="mt-1 text-foreground"
                  title="Date this channel was added to Wabrix AI"
                >
                  {Number.isNaN(date.getTime()) ? (
                    "—"
                  ) : (
                    <time dateTime={channel.createdAt}>
                      {date.toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "numeric",
                        minute: "2-digit"
                      })}
                    </time>
                  )}
                </dd>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <ShieldCheck className={`mt-0.5 size-4 shrink-0 ${color}`} aria-hidden="true" />
              <div>
                <dt className="text-[10px] text-muted-foreground">Status</dt>
                <dd className={`mt-1 capitalize ${color}`}>{state}</dd>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <MessageSquare
                className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
              <div>
                <dt className="text-[10px] text-muted-foreground">Messages</dt>
                <dd className="mt-1 text-foreground">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="rounded-sm text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          aria-label="Messages in the last 7 days: unavailable"
                        >
                          — <span className="text-muted-foreground">(last 7 days)</span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        Per-channel message counts are not available yet.
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </dd>
              </div>
            </div>
          </dl>
          {channel.statusReason && (
            <p className={`break-words text-xs ${color}`}>{channel.statusReason}</p>
          )}
        </div>
        {canManage && (
          <div className="flex flex-col items-end justify-end @min-[860px]:pt-10">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute right-4 top-4 size-7 text-muted-foreground sm:right-5 sm:top-5"
                  aria-label={`More actions for ${channel.name}`}
                  disabled={busy}
                >
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={onReconnect}>
                  <RotateCw className="mr-2 size-4" />
                  Reconnect with token
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                disabled={busy || verifying}
                onClick={onVerify}
              >
                {verifying ? "Checking..." : "Test connection"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-destructive/70 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                disabled={busy || verifying || state === "disconnected"}
                onClick={onDisconnect}
              >
                Disconnect
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
