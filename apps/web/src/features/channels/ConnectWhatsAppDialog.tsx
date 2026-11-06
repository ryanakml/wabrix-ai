import { useState, type FormEvent } from "react";
import { ArrowRight, BookOpen, ExternalLink, Eye, EyeOff, Info } from "lucide-react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Input
} from "@flowdesk/ui";

export type ConnectionFields = {
  name: string;
  phoneNumberId: string;
  wabaId: string;
  accessToken: string;
};
interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pending: boolean;
  error: string | null;
  values: ConnectionFields;
  onChange: (values: ConnectionFields) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onMetaSignup: () => void;
}

export function ConnectWhatsAppDialog({
  open,
  onOpenChange,
  pending,
  error,
  values,
  onChange,
  onSubmit,
  onMetaSignup
}: Props) {
  const [showToken, setShowToken] = useState(false);
  const changeOpen = (next: boolean) => {
    if (!pending) {
      setShowToken(false);
      onOpenChange(next);
    }
  };
  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogContent className="gap-5 rounded-lg p-5 sm:max-w-xl">
        <DialogHeader className="space-y-1 text-left">
          <DialogTitle className="text-base">Connect WhatsApp</DialogTitle>
          <DialogDescription className="pr-3 text-xs leading-relaxed">
            Use credentials from the same Meta App configured for the Wabrix AI webhook. The access
            token is never returned by the API.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-3 rounded-md border border-warning/25 bg-warning/5 px-3 py-2.5 text-xs">
          <Info className="size-4 shrink-0 text-primary" aria-hidden="true" />
          <div className="min-w-0 flex-1 space-y-1">
            <p className="font-medium text-foreground">Where to get these credentials?</p>
            <p className="text-muted-foreground">
              You can find them in your Meta Business App.{" "}
              <a
                href="/channels/guide"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                View guide <ArrowRight className="size-3" />
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            </p>
          </div>
          <BookOpen className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        </div>
        <form
          onSubmit={(event) => {
            setShowToken(false);
            onSubmit(event);
          }}
          className="space-y-5"
          aria-label="Connect WhatsApp with access token"
        >
          {error && (
            <p
              role="alert"
              className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-xs leading-relaxed text-destructive"
            >
              {error}
            </p>
          )}
          <fieldset disabled={pending} className="grid min-w-0 gap-4 sm:grid-cols-2">
            {(
              [
                ["name", "Channel name", "e.g. Customer Support"],
                ["phoneNumberId", "Phone Number ID", "e.g. 1100041206524835"],
                ["wabaId", "WABA ID", "e.g. 2088901722795472"]
              ] as const
            ).map(([key, label, placeholder]) => (
              <div key={key} className="min-w-0 space-y-1.5">
                <label htmlFor={`wa-${key}`} className="text-xs font-medium text-foreground">
                  {label}
                </label>
                <Input
                  id={`wa-${key}`}
                  required
                  maxLength={key === "name" ? 100 : undefined}
                  inputMode={key === "name" ? "text" : "numeric"}
                  placeholder={placeholder}
                  className="h-9 text-base sm:text-xs md:text-xs"
                  value={values[key]}
                  onChange={(event) => onChange({ ...values, [key]: event.target.value })}
                />
              </div>
            ))}
            <div className="min-w-0 space-y-1.5">
              <label htmlFor="wa-access-token" className="text-xs font-medium text-foreground">
                Access token
              </label>
              <div className="relative">
                <Input
                  id="wa-access-token"
                  required
                  type={showToken ? "text" : "password"}
                  autoComplete="off"
                  placeholder="Paste your access token"
                  className="h-9 pr-10 text-base sm:text-xs md:text-xs"
                  value={values.accessToken}
                  onChange={(event) => onChange({ ...values, accessToken: event.target.value })}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0.5 top-0.5 size-8 text-muted-foreground"
                  aria-label={showToken ? "Hide access token" : "Show access token"}
                  aria-pressed={showToken}
                  onClick={() => setShowToken(!showToken)}
                >
                  {showToken ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </Button>
              </div>
            </div>
          </fieldset>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                setShowToken(false);
                onMetaSignup();
              }}
              className="inline-flex items-center gap-2 rounded-sm text-left text-[10px] text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
            >
              <ExternalLink className="size-3.5 shrink-0" aria-hidden="true" />
              <span>
                Prefer a guided setup?{" "}
                <span className="text-foreground underline underline-offset-2">
                  Connect with Meta Signup
                </span>
              </span>
            </button>
            <div className="flex shrink-0 justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs"
                disabled={pending}
                onClick={() => changeOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" className="text-xs" disabled={pending}>
                {pending ? "Verifying and connecting..." : "Verify and connect"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
