import React, { useEffect, useState } from "react";
import {
  type DeveloperApiKeyRecord,
  type WebhookDeliveryClientRecord,
  type WebhookSubscriptionClientRecord,
  type WebhookVerificationStatus,
  createApiKeyApi,
  createWebhookApi,
  deleteWebhookApi,
  listApiKeysApi,
  listWebhookDeliveriesApi,
  listWebhooksApi,
  revokeApiKeyApi,
  testWebhookApi
} from "./api.js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/card.js";
import { Badge, Button } from "@flowdesk/ui";
import { Key, Webhook, Copy, Trash2 } from "lucide-react";
import { ConfirmDialog } from "./components/ConfirmDialog.js";

export interface DeveloperSettingsViewProps {
  orgId: string;
  canManage: boolean;
  showToast?: (message: string, type: "success" | "error" | "info") => void;
  initialTab?: "keys" | "webhooks";
  onTabChange?: (tab: "keys" | "webhooks") => void;
}

type UiWebhookRecord = WebhookSubscriptionClientRecord & {
  verificationStatus?: WebhookVerificationStatus;
  updatedAt?: string;
};

const CANONICAL_KEY_SCOPES = ["conversation:read", "message:write"] as const;
const DEFAULT_WEBHOOK_EVENTS = ["conversation.created", "message.received"];

function verificationBadgeClass(status: WebhookVerificationStatus): string {
  if (status === "verified") return "bg-success/15 text-success";
  if (status === "failed") return "bg-destructive/15 text-destructive";
  return "bg-warning/15 text-warning-foreground";
}

function deliveryBadgeClass(status: WebhookDeliveryClientRecord["status"]): string {
  if (status === "delivered") return "bg-success/15 text-success";
  if (status === "dead_letter") return "bg-destructive/15 text-destructive";
  if (status === "failed") return "bg-warning/15 text-warning-foreground";
  return "bg-muted text-muted-foreground";
}

export function DeveloperSettingsView({
  orgId,
  canManage,
  showToast,
  initialTab = "keys",
  onTabChange
}: DeveloperSettingsViewProps): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<"keys" | "webhooks">(initialTab);

  useEffect(() => {
    if (initialTab && initialTab !== activeTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const [keys, setKeys] = useState<DeveloperApiKeyRecord[]>([]);
  const [loadingKeys, setLoadingKeys] = useState(true);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [keyName, setKeyName] = useState("");
  const [keyScopes, setKeyScopes] = useState<string[]>([...CANONICAL_KEY_SCOPES]);
  const [generatedRawKey, setGeneratedRawKey] = useState<string | null>(null);

  const [webhooks, setWebhooks] = useState<UiWebhookRecord[]>([]);
  const [loadingWebhooks, setLoadingWebhooks] = useState(true);
  const [showWebhookModal, setShowWebhookModal] = useState(false);
  const [webhookName, setWebhookName] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookEvents, setWebhookEvents] = useState<string[]>([...DEFAULT_WEBHOOK_EVENTS]);
  const [generatedWebhookSecret, setGeneratedWebhookSecret] = useState<{
    name: string;
    secret: string;
  } | null>(null);
  const [testingWebhookId, setTestingWebhookId] = useState<string | null>(null);
  const [expandedWebhookId, setExpandedWebhookId] = useState<string | null>(null);
  const [loadingDeliveriesWebhookId, setLoadingDeliveriesWebhookId] = useState<string | null>(null);
  const [deliveriesByWebhook, setDeliveriesByWebhook] = useState<
    Record<string, WebhookDeliveryClientRecord[]>
  >({});

  const [submitting, setSubmitting] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    type: "revoke" | "clear-key" | "delete-webhook";
    id: string;
  } | null>(null);
  const [pendingActionLoading, setPendingActionLoading] = useState(false);

  const fetchKeys = async (): Promise<DeveloperApiKeyRecord[]> => {
    try {
      setLoadingKeys(true);
      const data = await listApiKeysApi(orgId);
      const safeData = Array.isArray(data) ? data : [];
      setKeys(safeData);
      return safeData;
    } catch (err) {
      showToast?.(err instanceof Error ? err.message : "Failed to load API keys", "error");
      setKeys([]);
      return [];
    } finally {
      setLoadingKeys(false);
    }
  };

  const fetchWebhooks = async (): Promise<UiWebhookRecord[]> => {
    try {
      setLoadingWebhooks(true);
      const data = (await listWebhooksApi(orgId)) as UiWebhookRecord[];
      const safeData = Array.isArray(data) ? data : [];
      setWebhooks(safeData);
      return safeData;
    } catch (err) {
      showToast?.(err instanceof Error ? err.message : "Failed to load webhooks", "error");
      setWebhooks([]);
      return [];
    } finally {
      setLoadingWebhooks(false);
    }
  };

  const fetchDeliveries = async (webhookId: string): Promise<void> => {
    try {
      setLoadingDeliveriesWebhookId(webhookId);
      const deliveries = await listWebhookDeliveriesApi(orgId, webhookId);
      setDeliveriesByWebhook((current) => ({ ...current, [webhookId]: deliveries }));
    } catch (err) {
      showToast?.(
        err instanceof Error ? err.message : "Failed to load webhook deliveries",
        "error"
      );
    } finally {
      setLoadingDeliveriesWebhookId(null);
    }
  };

  useEffect(() => {
    void fetchKeys();
    void fetchWebhooks();
  }, [orgId]);

  const handleCreateKey = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!keyName.trim()) return;

    try {
      setSubmitting(true);
      const created = await createApiKeyApi(orgId, {
        name: keyName.trim(),
        scopes: keyScopes
      });
      if (created.rawKey) setGeneratedRawKey(created.rawKey);
      showToast?.("API Key generated successfully", "success");
      setKeyName("");
      setShowKeyModal(false);
      await fetchKeys();
    } catch (err) {
      showToast?.(err instanceof Error ? err.message : "Failed to create API key", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevokeKey = async (keyId: string) => {
    try {
      await revokeApiKeyApi(orgId, keyId);
      showToast?.("API Key revoked", "info");
      await fetchKeys();
    } catch (err) {
      showToast?.(err instanceof Error ? err.message : "Failed to revoke API key", "error");
    }
  };

  const handleClearRevokedKey = (keyId: string) => {
    setKeys((current) => current.filter((key) => key.id !== keyId));
    showToast?.("Revoked API key cleared from this view", "info");
  };

  const handleCreateWebhook = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!webhookName.trim() || !webhookUrl.trim()) return;

    try {
      setSubmitting(true);
      const created = await createWebhookApi(orgId, {
        name: webhookName.trim(),
        url: webhookUrl.trim(),
        events: webhookEvents
      });
      setGeneratedWebhookSecret({ name: created.name, secret: created.secret });
      showToast?.("Webhook registered. Send a test to verify the endpoint.", "success");
      setWebhookName("");
      setWebhookUrl("");
      setWebhookEvents([...DEFAULT_WEBHOOK_EVENTS]);
      setShowWebhookModal(false);
      await fetchWebhooks();
    } catch (err) {
      showToast?.(err instanceof Error ? err.message : "Failed to register webhook", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleTestWebhook = async (webhookId: string) => {
    try {
      setTestingWebhookId(webhookId);
      const result = await testWebhookApi(orgId, webhookId);
      showToast?.(`Webhook test queued (${result.eventId}). Waiting for verification…`, "info");

      let verified = false;
      for (let attempt = 0; attempt < 6; attempt += 1) {
        await new Promise((resolve) => setTimeout(resolve, attempt === 0 ? 250 : 750));
        const refreshed = await fetchWebhooks();
        const current = refreshed.find((webhook) => webhook.id === webhookId);
        if (current?.verificationStatus === "verified") {
          verified = true;
          break;
        }
        if (current?.verificationStatus === "failed") break;
      }

      await fetchDeliveries(webhookId);
      if (verified) {
        showToast?.("Webhook endpoint verified successfully", "success");
      } else {
        showToast?.("Test queued. Check delivery history for the latest result.", "info");
      }
    } catch (err) {
      showToast?.(err instanceof Error ? err.message : "Failed to test webhook", "error");
    } finally {
      setTestingWebhookId(null);
    }
  };

  const handleToggleDeliveries = async (webhookId: string) => {
    if (expandedWebhookId === webhookId) {
      setExpandedWebhookId(null);
      return;
    }
    setExpandedWebhookId(webhookId);
    await fetchDeliveries(webhookId);
  };

  const handleDeleteWebhook = async (webhookId: string) => {
    try {
      await deleteWebhookApi(orgId, webhookId);
      showToast?.("Webhook subscription deleted", "info");
      setExpandedWebhookId((current) => (current === webhookId ? null : current));
      await fetchWebhooks();
    } catch (err) {
      showToast?.(err instanceof Error ? err.message : "Failed to delete webhook", "error");
    }
  };

  const confirmPendingAction = async () => {
    if (!pendingAction) return;
    setPendingActionLoading(true);
    try {
      if (pendingAction.type === "revoke") await handleRevokeKey(pendingAction.id);
      if (pendingAction.type === "clear-key") handleClearRevokedKey(pendingAction.id);
      if (pendingAction.type === "delete-webhook") await handleDeleteWebhook(pendingAction.id);
      setPendingAction(null);
    } finally {
      setPendingActionLoading(false);
    }
  };

  const toggleScope = (scope: string, checked: boolean) => {
    setKeyScopes((current) =>
      checked ? Array.from(new Set([...current, scope])) : current.filter((item) => item !== scope)
    );
  };

  const toggleWebhookEvent = (eventName: string, checked: boolean) => {
    setWebhookEvents((current) =>
      checked
        ? Array.from(new Set([...current, eventName]))
        : current.filter((item) => item !== eventName)
    );
  };

  return (
    <div
      className="developer-settings-container mx-auto min-w-0 max-w-6xl space-y-6 overflow-hidden p-4 md:p-8"
      data-testid="developer-settings-view"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            Developer Integrations
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage scoped API keys and outbound webhook subscriptions for programmatic integrations.
          </p>
        </div>
        <div className="flex w-full gap-2 sm:w-auto">
          <Button
            type="button"
            variant={activeTab === "keys" ? "default" : "outline"}
            className="inline-flex flex-1 cursor-pointer items-center justify-center gap-1.5 sm:flex-none"
            onClick={() => {
              setActiveTab("keys");
              onTabChange?.("keys");
            }}
          >
            <Key className="size-4" />
            API Keys
          </Button>
          <Button
            type="button"
            variant={activeTab === "webhooks" ? "default" : "outline"}
            className="inline-flex flex-1 cursor-pointer items-center justify-center gap-1.5 sm:flex-none"
            onClick={() => {
              setActiveTab("webhooks");
              onTabChange?.("webhooks");
            }}
          >
            <Webhook className="size-4" />
            Webhooks
          </Button>
        </div>
      </div>

      {generatedRawKey && (
        <Card className="border-warning/40 bg-warning/10 text-foreground">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <CardTitle className="text-base font-semibold">
                Save Your New Secret API Key
              </CardTitle>
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground text-sm cursor-pointer"
                onClick={() => setGeneratedRawKey(null)}
              >
                Close ✕
              </button>
            </div>
            <CardDescription className="text-xs text-warning-foreground">
              Copy this key now. It will never be displayed again.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex min-w-0 flex-col items-stretch gap-2 sm:flex-row sm:items-center">
              <code className="min-w-0 flex-1 break-all rounded-md border bg-background p-2.5 font-mono text-xs text-foreground shadow-xs">
                {generatedRawKey}
              </code>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="inline-flex shrink-0 items-center justify-center gap-1 cursor-pointer"
                onClick={() => {
                  void navigator.clipboard.writeText(generatedRawKey);
                  showToast?.("Copied to clipboard!", "info");
                }}
              >
                <Copy className="size-3.5" />
                Copy
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {generatedWebhookSecret && (
        <Card className="border-warning/40 bg-warning/10 text-foreground">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <CardTitle className="text-base font-semibold">
                Save Your Webhook Signing Secret
              </CardTitle>
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground text-sm cursor-pointer"
                onClick={() => setGeneratedWebhookSecret(null)}
              >
                Close ✕
              </button>
            </div>
            <CardDescription className="text-xs text-warning-foreground">
              Signing secret for {generatedWebhookSecret.name}. Copy it now; Wabrix AI will only
              show the masked value later.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex min-w-0 flex-col items-stretch gap-2 sm:flex-row sm:items-center">
              <code className="min-w-0 flex-1 break-all rounded-md border bg-background p-2.5 font-mono text-xs text-foreground shadow-xs">
                {generatedWebhookSecret.secret}
              </code>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="inline-flex shrink-0 items-center justify-center gap-1 cursor-pointer"
                onClick={() => {
                  void navigator.clipboard.writeText(generatedWebhookSecret.secret);
                  showToast?.("Webhook signing secret copied", "info");
                }}
              >
                <Copy className="size-3.5" />
                Copy
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "keys" && (
        <div className="space-y-4">
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-lg font-semibold text-foreground">Scoped API Keys</h3>
            {canManage && (
              <Button
                type="button"
                size="sm"
                className="inline-flex items-center gap-1 cursor-pointer"
                onClick={() => setShowKeyModal(true)}
              >
                + Generate New API Key
              </Button>
            )}
          </div>

          {loadingKeys ? (
            <Card className="p-8 text-center text-muted-foreground">Loading API keys...</Card>
          ) : keys.length === 0 ? (
            <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed">
              <CardTitle className="text-base mb-1">No API keys yet</CardTitle>
              <span className="sr-only">No API keys created yet.</span>
              <CardDescription className="mb-4">
                Create a scoped API key to access Wabrix AI programmatically.
              </CardDescription>
              {canManage && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="cursor-pointer"
                  onClick={() => setShowKeyModal(true)}
                >
                  Create your first API key
                </Button>
              )}
            </Card>
          ) : (
            <div className="space-y-3">
              {keys.map((key) => (
                <Card key={key.id} className="min-w-0 overflow-hidden border-border p-4">
                  <div className="flex min-w-0 flex-col items-stretch gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1 overflow-hidden">
                      <div className="mb-1 flex items-center gap-2">
                        <h4 className="min-w-0 break-words font-semibold text-foreground">
                          {key.name}
                        </h4>
                        <span
                          className={
                            key.revokedAt
                              ? "text-xs font-medium text-destructive"
                              : "text-xs font-medium text-success"
                          }
                        >
                          {key.revokedAt ? "Revoked" : "Active"}
                        </span>
                      </div>
                      <p className="mb-2 text-xs text-muted-foreground">
                        Prefix:{" "}
                        <code className="break-all font-mono bg-muted px-1.5 py-0.5 rounded">
                          {key.keyPrefix}••••••••
                        </code>
                      </p>
                      <div className="space-y-2">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Access
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {key.scopes.map((scope) => (
                            <Badge
                              key={scope}
                              variant="outline"
                              className="text-xs font-mono bg-primary/5 text-primary border-primary/20"
                            >
                              <span className="break-all">{scope}</span>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end lg:max-w-[46%]">
                      {canManage && !key.revokedAt && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:bg-destructive/10 cursor-pointer"
                          onClick={() => setPendingAction({ type: "revoke", id: key.id })}
                        >
                          Revoke
                        </Button>
                      )}
                      {key.revokedAt && (
                        <button
                          type="button"
                          className="rounded-md p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          onClick={() => setPendingAction({ type: "clear-key", id: key.id })}
                          aria-label={`Clear revoked key ${key.name}`}
                        >
                          <Trash2 className="size-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "webhooks" && (
        <div className="space-y-4">
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-lg font-semibold text-foreground">
              Outbound Webhook Subscriptions
            </h3>
            {canManage && (
              <Button
                type="button"
                size="sm"
                className="inline-flex items-center gap-1 cursor-pointer"
                onClick={() => setShowWebhookModal(true)}
              >
                + Register Webhook
              </Button>
            )}
          </div>

          {loadingWebhooks ? (
            <Card className="p-8 text-center text-muted-foreground">Loading webhooks...</Card>
          ) : webhooks.length === 0 ? (
            <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed">
              <div className="rounded-full bg-muted p-3 mb-3">
                <Webhook className="size-6 text-muted-foreground" />
              </div>
              <CardTitle className="text-base mb-1">
                No outbound webhook subscriptions registered yet.
              </CardTitle>
              <CardDescription className="mb-4">
                Receive instant HTTP POST callbacks when messages or conversations are created in
                Wabrix AI.
              </CardDescription>
              {canManage && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="cursor-pointer"
                  onClick={() => setShowWebhookModal(true)}
                >
                  Register your first webhook
                </Button>
              )}
            </Card>
          ) : (
            <div className="space-y-3">
              {webhooks.map((webhook) => {
                const verificationStatus = webhook.verificationStatus ?? "unverified";
                const deliveries = deliveriesByWebhook[webhook.id] ?? [];
                const expanded = expandedWebhookId === webhook.id;
                return (
                  <Card key={webhook.id} className="min-w-0 overflow-hidden border-border p-4">
                    <div className="flex min-w-0 flex-col items-stretch gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1 overflow-hidden">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="min-w-0 break-words font-semibold text-foreground">
                            {webhook.name}
                          </h4>
                          <span
                            className={`px-2 py-0.5 text-xs font-medium rounded-full ${verificationBadgeClass(
                              verificationStatus
                            )}`}
                          >
                            {verificationStatus.toUpperCase()}
                          </span>
                        </div>
                        <p className="mb-1 break-all text-xs font-mono text-muted-foreground">
                          {webhook.url}
                        </p>
                        <p className="text-xs text-muted-foreground mb-2">
                          Secret:{" "}
                          <code className="font-mono bg-muted px-1.5 py-0.5 rounded">
                            {webhook.secret}
                          </code>
                        </p>
                        <div className="flex gap-1.5 flex-wrap">
                          {webhook.events.map((eventName) => (
                            <Badge
                              key={eventName}
                              variant="outline"
                              className="text-xs font-mono bg-primary/5 text-primary border-primary/20"
                            >
                              <span className="break-all">{eventName}</span>
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end lg:max-w-[46%]">
                        {canManage && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="cursor-pointer"
                            disabled={testingWebhookId === webhook.id}
                            onClick={() => void handleTestWebhook(webhook.id)}
                          >
                            {testingWebhookId === webhook.id ? "Testing…" : "Send Test / Verify"}
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="cursor-pointer"
                          onClick={() => void handleToggleDeliveries(webhook.id)}
                        >
                          {expanded ? "Hide Deliveries" : "View Deliveries"}
                        </Button>
                        {canManage && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:bg-destructive/10 cursor-pointer"
                            onClick={() =>
                              setPendingAction({ type: "delete-webhook", id: webhook.id })
                            }
                          >
                            Delete
                          </Button>
                        )}
                      </div>
                    </div>

                    {expanded && (
                      <div
                        className="mt-4 border-t pt-3"
                        data-testid={`webhook-deliveries-${webhook.id}`}
                      >
                        <h5 className="text-sm font-semibold text-foreground mb-2">
                          Delivery History
                        </h5>
                        {loadingDeliveriesWebhookId === webhook.id ? (
                          <p className="text-xs text-muted-foreground">Loading deliveries...</p>
                        ) : deliveries.length === 0 ? (
                          <p className="text-xs text-muted-foreground">No delivery attempts yet.</p>
                        ) : (
                          <div className="min-w-0 space-y-2">
                            {deliveries.map((delivery) => (
                              <div
                                key={delivery.id}
                                className="flex min-w-0 flex-col justify-between gap-3 overflow-hidden rounded border border-border bg-muted/20 p-2.5 text-xs sm:flex-row"
                              >
                                <div className="min-w-0 break-all">
                                  <div className="break-all font-mono font-medium text-foreground">
                                    {delivery.eventType}
                                  </div>
                                  <div className="break-all font-mono text-muted-foreground">
                                    {delivery.eventId}
                                  </div>
                                  {delivery.lastError && (
                                    <div className="mt-0.5 break-words font-mono text-destructive">
                                      {delivery.lastError}
                                    </div>
                                  )}
                                </div>
                                <div className="shrink-0 text-left sm:text-right">
                                  <span
                                    className={`px-2 py-0.5 rounded-full font-medium ${deliveryBadgeClass(
                                      delivery.status
                                    )}`}
                                  >
                                    {delivery.status}
                                  </span>
                                  <div className="mt-1 text-muted-foreground">
                                    HTTP {delivery.responseStatusCode ?? "—"} · attempts{" "}
                                    {delivery.attemptCount}/{delivery.maxAttempts}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {showKeyModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-card text-card-foreground rounded-lg p-6 max-w-md w-full shadow-xl border border-border">
            <h3 className="text-lg font-bold text-foreground mb-4">Generate Developer API Key</h3>
            <form onSubmit={(event) => void handleCreateKey(event)}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-foreground mb-1">Key Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Production Automation Bot"
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={keyName}
                  onChange={(event) => setKeyName(event.target.value)}
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-foreground mb-1">
                  Permissions / Scopes
                </label>
                <div className="space-y-1 text-sm">
                  {CANONICAL_KEY_SCOPES.map((scope) => (
                    <label key={scope} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={keyScopes.includes(scope)}
                        onChange={(event) => toggleScope(scope, event.target.checked)}
                      />
                      <span>{scope}</span>
                    </label>
                  ))}
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={keyScopes.includes("admin")}
                      onChange={(event) => toggleScope("admin", event.target.checked)}
                    />
                    <span>admin (Full Access)</span>
                  </label>
                </div>
              </div>
              <div className="flex justify-end gap-2 border-t border-border pt-4">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="cursor-pointer"
                  onClick={() => setShowKeyModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={submitting} className="cursor-pointer">
                  {submitting ? "Generating..." : "Generate Key"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showWebhookModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-card text-card-foreground rounded-lg p-6 max-w-md w-full shadow-xl border border-border">
            <h3 className="text-lg font-bold text-foreground mb-4">Register Outbound Webhook</h3>
            <form onSubmit={(event) => void handleCreateWebhook(event)}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-foreground mb-1">Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CRM Sync Handler"
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={webhookName}
                  onChange={(event) => setWebhookName(event.target.value)}
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-foreground mb-1">
                  Payload URL
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://your-domain.com/webhooks/flowdesk"
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={webhookUrl}
                  onChange={(event) => setWebhookUrl(event.target.value)}
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-foreground mb-1">
                  Subscribed Events
                </label>
                <div className="space-y-1 text-sm">
                  {["conversation.created", "message.received", "message.sent"].map((eventName) => (
                    <label key={eventName} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={webhookEvents.includes(eventName)}
                        onChange={(event) => toggleWebhookEvent(eventName, event.target.checked)}
                      />
                      <span>{eventName}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2 border-t border-border pt-4">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="cursor-pointer"
                  onClick={() => setShowWebhookModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={submitting} className="cursor-pointer">
                  {submitting ? "Registering..." : "Register Webhook"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={pendingAction !== null}
        onOpenChange={(open) => {
          if (!open && !pendingActionLoading) setPendingAction(null);
        }}
        title={
          pendingAction?.type === "revoke"
            ? "Revoke API key?"
            : pendingAction?.type === "clear-key"
              ? "Remove revoked API key?"
              : "Delete webhook subscription?"
        }
        description={
          pendingAction?.type === "revoke"
            ? "Requests using this key will immediately stop working."
            : pendingAction?.type === "clear-key"
              ? "This only clears the revoked key from the current view."
              : "Future deliveries to this endpoint will stop and the subscription will be deleted."
        }
        confirmLabel={pendingAction?.type === "revoke" ? "Revoke Key" : "Confirm"}
        pending={pendingActionLoading}
        onConfirm={confirmPendingAction}
      />
    </div>
  );
}
