import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import {
  completeWhatsAppEmbeddedSignupApi,
  connectWhatsAppWithTokenApi,
  deleteChannelApi,
  listChannelsApi,
  startWhatsAppEmbeddedSignupApi,
  verifyChannelApi,
  type ChannelClientRecord
} from "./api.js";
import { Card, CardDescription, CardTitle } from "./components/ui/card.js";
import { Button } from "@flowdesk/ui";
import { Plus, Zap, RefreshCw } from "lucide-react";
import { ConfirmDialog } from "./components/ConfirmDialog.js";
import { ChannelCard } from "./features/channels/ChannelCard.js";
import { ConnectWhatsAppDialog } from "./features/channels/ConnectWhatsAppDialog.js";
import { WhatsAppIcon } from "./features/channels/WhatsAppIcon.js";

interface FacebookSdk {
  init(config: { appId: string; cookie: boolean; xfbml: boolean; version: string }): void;
  login(
    callback: (response: { authResponse?: { code?: string } }) => void,
    options: Record<string, unknown>
  ): void;
}

declare global {
  interface Window {
    FB?: FacebookSdk;
  }
}

const META_SDK_URL = "https://connect.facebook.net/en_US/sdk.js";
const META_MESSAGE_ORIGINS = new Set(["https://www.facebook.com", "https://web.facebook.com"]);

function loadMetaSdk(appId: string): Promise<FacebookSdk> {
  if (window.FB) {
    window.FB.init({ appId, cookie: true, xfbml: false, version: "v25.0" });
    return Promise.resolve(window.FB);
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.async = true;
    script.defer = true;
    script.src = META_SDK_URL;
    script.onload = () => {
      if (!window.FB) {
        reject(new Error("Meta login SDK did not load."));
        return;
      }
      window.FB.init({ appId, cookie: true, xfbml: false, version: "v25.0" });
      resolve(window.FB);
    };
    script.onerror = () => reject(new Error("Meta login SDK could not be loaded."));
    document.head.appendChild(script);
  });
}

type PendingSignup = {
  attemptId: string;
  state: string;
  code?: string;
  phoneNumberId?: string;
  wabaId?: string;
  completing?: boolean;
};

export interface ChannelsViewProps {
  orgId: string;
  canManage: boolean;
  showToast: (msg: string, isError?: boolean) => void;
}

export function ChannelsView({ orgId, canManage, showToast }: ChannelsViewProps) {
  const [channels, setChannels] = useState<ChannelClientRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [showManualConnect, setShowManualConnect] = useState(false);
  const [manualConnection, setManualConnection] = useState({
    name: "",
    phoneNumberId: "",
    wabaId: "",
    accessToken: ""
  });
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [disconnectId, setDisconnectId] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);
  const pendingSignup = useRef<PendingSignup | null>(null);

  const loadChannels = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(null);
      setChannels(await listChannelsApi(orgId));
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to load channels");
    } finally {
      setLoading(false);
    }
  }, [orgId, showToast]);

  useEffect(() => {
    void loadChannels();
  }, [loadChannels]);

  const completePendingSignup = useCallback(async () => {
    const pending = pendingSignup.current;
    if (
      !pending ||
      pending.completing ||
      !pending.code ||
      !pending.phoneNumberId ||
      !pending.wabaId
    ) {
      return;
    }
    pending.completing = true;
    setConnecting(true);
    try {
      const result = await completeWhatsAppEmbeddedSignupApi(orgId, {
        attemptId: pending.attemptId,
        state: pending.state,
        code: pending.code,
        phoneNumberId: pending.phoneNumberId,
        wabaId: pending.wabaId
      });
      showToast(`WhatsApp channel connected: ${result.channel.name}`);
      pendingSignup.current = null;
      await loadChannels();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Meta connection could not be completed.",
        true
      );
    } finally {
      const current = pendingSignup.current;
      if (current) current.completing = false;
      setConnecting(false);
    }
  }, [loadChannels, orgId, showToast]);

  useEffect(() => {
    const receiveMetaSignupEvent = (event: MessageEvent<unknown>) => {
      if (!META_MESSAGE_ORIGINS.has(event.origin) || typeof event.data !== "string") return;
      let payload: unknown;
      try {
        payload = JSON.parse(event.data);
      } catch {
        return;
      }
      if (
        typeof payload !== "object" ||
        payload === null ||
        !("type" in payload) ||
        payload.type !== "WA_EMBEDDED_SIGNUP" ||
        !("event" in payload) ||
        payload.event !== "FINISH" ||
        !("data" in payload) ||
        typeof payload.data !== "object" ||
        payload.data === null
      ) {
        return;
      }
      const data = payload.data as Record<string, unknown>;
      const pending = pendingSignup.current;
      if (
        !pending ||
        typeof data["phone_number_id"] !== "string" ||
        typeof data["waba_id"] !== "string"
      ) {
        return;
      }
      pending.phoneNumberId = data["phone_number_id"];
      pending.wabaId = data["waba_id"];
      void completePendingSignup();
    };
    window.addEventListener("message", receiveMetaSignupEvent);
    return () => window.removeEventListener("message", receiveMetaSignupEvent);
  }, [completePendingSignup]);

  const handleConnect = async () => {
    if (!canManage || connecting) return;
    try {
      setConnecting(true);
      const setup = await startWhatsAppEmbeddedSignupApi(orgId);
      pendingSignup.current = { attemptId: setup.attemptId, state: setup.state };
      const sdk = await loadMetaSdk(setup.appId);
      sdk.login(
        (loginResponse) => {
          const pending = pendingSignup.current;
          const code = loginResponse.authResponse?.code;
          if (!pending || !code) {
            pendingSignup.current = null;
            setConnecting(false);
            showToast("Meta connection was cancelled before authorization completed.", true);
            return;
          }
          pending.code = code;
          void completePendingSignup();
        },
        {
          config_id: setup.configId,
          response_type: "code",
          override_default_response_type: true,
          extras: { setup: {} }
        }
      );
    } catch (err) {
      pendingSignup.current = null;
      setConnecting(false);
      showToast(err instanceof Error ? err.message : "Unable to start Meta connection.", true);
    }
  };

  const handleManualConnect = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canManage || connecting) return;
    try {
      setConnectionError(null);
      setConnecting(true);
      const result = await connectWhatsAppWithTokenApi(orgId, manualConnection);
      showToast(`WhatsApp channel connected and verified: ${result.channel.name}`);
      setManualConnection({ name: "", phoneNumberId: "", wabaId: "", accessToken: "" });
      setShowManualConnect(false);
      await loadChannels();
    } catch (err) {
      setConnectionError(err instanceof Error ? err.message : "WhatsApp connection failed.");
    } finally {
      setConnecting(false);
    }
  };

  const openManualConnect = (channel?: ChannelClientRecord) => {
    setConnectionError(null);
    setManualConnection({
      name: channel?.name ?? "",
      phoneNumberId: channel?.phoneNumberId ?? "",
      wabaId: channel?.wabaId ?? "",
      accessToken: ""
    });
    setShowManualConnect(true);
  };

  const handleVerify = async (channelId: string) => {
    try {
      setVerifyingId(channelId);
      const result = await verifyChannelApi(orgId, channelId);
      showToast(
        result.verified
          ? "WhatsApp API connection is healthy."
          : `Verification failed: ${result.message}`,
        !result.verified
      );
      await loadChannels();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Verification error", true);
    } finally {
      setVerifyingId(null);
    }
  };

  const handleDelete = async () => {
    if (!disconnectId) return;
    try {
      setDisconnecting(true);
      await deleteChannelApi(orgId, disconnectId);
      showToast("Channel disconnected successfully.");
      setDisconnectId(null);
      await loadChannels();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to disconnect channel", true);
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <div
      className="channels-container mx-auto max-w-7xl space-y-6 p-4 md:p-8"
      data-testid="channels-view"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">WhatsApp Channels</h2>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            Connect your WhatsApp Business account to receive and send messages in Wabrix AI.
          </p>
        </div>
        {canManage && (
          <div className="flex shrink-0 flex-wrap gap-2">
            <Button
              type="button"
              onClick={() => openManualConnect()}
              className="gap-1.5"
              id="connect-channel-btn"
              disabled={connecting}
            >
              <Plus className="size-4" />
              {connecting ? "Connecting..." : "Connect WhatsApp"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => void handleConnect()}
              className="gap-1.5"
              disabled={connecting}
            >
              <Zap className="size-4" />
              Connect with Meta Signup
            </Button>
          </div>
        )}
      </div>
      {canManage && (
        <ConnectWhatsAppDialog
          open={showManualConnect}
          onOpenChange={setShowManualConnect}
          pending={connecting}
          error={connectionError}
          values={manualConnection}
          onChange={setManualConnection}
          onSubmit={(event) => void handleManualConnect(event)}
          onMetaSignup={() => {
            setShowManualConnect(false);
            void handleConnect();
          }}
        />
      )}
      {loading ? (
        <Card
          className="gap-3 rounded-lg p-6"
          role="status"
          aria-label="Loading connected channels"
        >
          <div className="h-4 w-40 animate-pulse rounded bg-muted" />
          <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
          <span className="sr-only">Loading connected channels...</span>
        </Card>
      ) : loadError ? (
        <Card className="items-start gap-3 rounded-lg p-6" role="alert">
          <p className="text-sm text-destructive">{loadError}</p>
          <Button variant="outline" size="sm" onClick={() => void loadChannels()}>
            <RefreshCw className="size-4" />
            Try again
          </Button>
        </Card>
      ) : channels.length === 0 ? (
        <Card
          className="flex min-h-60 flex-col items-center justify-center gap-0 rounded-lg border-dashed px-5 py-7 text-center shadow-none"
          data-testid="channels-empty-state"
        >
          <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <WhatsAppIcon className="size-7" />
          </div>
          <CardTitle className="text-base leading-normal">
            No WhatsApp channels connected yet.
          </CardTitle>
          <CardDescription className="mt-1.5 text-xs leading-relaxed">
            Connect a WhatsApp business account to start receiving and sending customer messages.
          </CardDescription>
          {canManage && (
            <Button
              type="button"
              size="sm"
              onClick={() => openManualConnect()}
              className="mt-4 gap-1.5 text-xs"
              disabled={connecting}
            >
              <Plus className="size-3.5" />
              Connect your first channel
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid gap-4">
          {channels.map((channel) => (
            <ChannelCard
              key={channel.id}
              channel={channel}
              canManage={canManage}
              busy={connecting || disconnecting}
              verifying={verifyingId === channel.id}
              onReconnect={() => openManualConnect(channel)}
              onVerify={() => void handleVerify(channel.id)}
              onDisconnect={() => setDisconnectId(channel.id)}
              showToast={showToast}
            />
          ))}
        </div>
      )}
      <ConfirmDialog
        open={disconnectId !== null}
        onOpenChange={(open) => {
          if (!open && !disconnecting) setDisconnectId(null);
        }}
        title="Disconnect WhatsApp channel?"
        description="Existing conversation history will remain, but this channel will stop receiving and sending messages until it is connected again."
        confirmLabel="Disconnect"
        pending={disconnecting}
        onConfirm={handleDelete}
      />
    </div>
  );
}
