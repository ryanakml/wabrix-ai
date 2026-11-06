import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowUpRight, Check, Info } from "lucide-react";
import { Button } from "@flowdesk/ui";
import { Card } from "../../components/ui/card.js";

const steps = [
  {
    id: "meta-app",
    title: "Open your Meta app",
    description:
      "Sign in to Meta for Developers and choose the app used for your Wabrix AI WhatsApp connection. Open the WhatsApp setup area; Meta may label it API Setup or Getting Started.",
    detail:
      "Use the same app your workspace administrator configured for the Wabrix AI webhook. If you do not have app or business access, ask the administrator to grant it before continuing."
  },
  {
    id: "phone-number",
    title: "Copy the Phone Number ID",
    description:
      "Select the business phone number you want to connect in the WhatsApp setup area. Copy its Phone Number ID into the matching Wabrix AI field.",
    detail:
      "This is a numeric identifier, not the phone number customers dial. Check that you selected the intended business number, especially if the app also has a test number."
  },
  {
    id: "business-account",
    title: "Copy the WhatsApp Business Account ID",
    description:
      "Find the WhatsApp Business Account ID for that number in the app setup area or WhatsApp Manager. Paste it into WABA ID in Wabrix AI.",
    detail:
      "The WABA ID and Phone Number ID must belong together. Your Meta business portfolio ID and app ID are different identifiers; do not paste either of those here."
  },
  {
    id: "access-token",
    title: "Prepare an access token",
    description:
      "For testing, use the temporary token available in the app dashboard. For an ongoing connection, ask your business administrator to generate a system user token for this app and grant access to the intended WhatsApp account.",
    detail:
      "The token needs whatsapp_business_management and whatsapp_business_messaging permissions. Temporary tokens expire; check the token's expiry and asset access before using it for your live channel. Paste the token only into the Access token field."
  },
  {
    id: "verify",
    title: "Verify and connect in Wabrix AI",
    description:
      "Return to the connection dialog, choose a recognizable channel name such as Customer Support, and fill all four fields. Select Verify and connect.",
    detail:
      "Wabrix AI checks the token and account, subscribes the app to the WABA, and stores the credential encrypted. After the channel appears, use Test connection to check API access. Send a real message from another WhatsApp number to confirm it reaches your Inbox."
  }
];

export function WhatsAppGuide() {
  return (
    <div className="mx-auto max-w-5xl space-y-7 p-4 md:p-8" data-testid="whatsapp-guide">
      <Button asChild variant="ghost" size="sm" className="-ml-2 text-muted-foreground">
        <Link to="/channels">
          <ArrowLeft className="size-4" />
          Back to WhatsApp Channels
        </Link>
      </Button>
      <header className="max-w-2xl space-y-2">
        <p className="text-xs font-medium uppercase tracking-wider text-primary">
          WhatsApp setup guide
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Connect your WhatsApp Business account
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Find the credentials for your account, then bring them back to Wabrix AI. Keep the
          connection dialog open in your other tab while you follow these steps.
        </p>
      </header>
      <Card className="gap-4 rounded-lg p-5 shadow-none">
        <h2 className="text-sm font-semibold">Before you start</h2>
        <ul className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
          {[
            "Access to your Meta app and business portfolio",
            "A WhatsApp Business Account and business phone number",
            "Permission to manage channels in Wabrix AI",
            "Your workspace's WhatsApp webhook already configured"
          ].map((text) => (
            <li key={text} className="flex items-start gap-2">
              <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
              {text}
            </li>
          ))}
        </ul>
      </Card>
      <div className="grid items-start gap-6 lg:grid-cols-[180px_minmax(0,1fr)]">
        <nav
          aria-label="Guide steps"
          className="flex flex-wrap gap-2 lg:sticky lg:top-5 lg:flex-col"
        >
          {steps.map((step, i) => (
            <a
              key={step.id}
              href={`#${step.id}`}
              className="rounded-md px-2 py-2 text-xs leading-relaxed text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {i + 1}. {step.title}
            </a>
          ))}
        </nav>
        <div className="min-w-0 space-y-4">
          {steps.map((step, i) => (
            <Card
              key={step.id}
              id={step.id}
              className="scroll-mt-5 gap-3 rounded-lg p-5 shadow-none sm:p-6"
            >
              <div className="flex items-center gap-3">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {i + 1}
                </span>
                <h2 className="text-base font-semibold text-foreground">{step.title}</h2>
              </div>
              <p className="text-sm leading-7 text-foreground">{step.description}</p>
              <p className="break-words text-sm leading-7 text-muted-foreground">{step.detail}</p>
            </Card>
          ))}
        </div>
      </div>
      <section className="space-y-4 rounded-lg border border-warning/25 bg-warning/5 p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Info className="size-4 text-primary" />
          If the connection does not work
        </h2>
        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="font-medium text-foreground">Invalid or expired token</dt>
            <dd className="mt-1 leading-relaxed text-muted-foreground">
              Generate a new token for the correct app, check its permissions, then reconnect from
              the channel's three-dot menu.
            </dd>
          </div>
          <div>
            <dt className="font-medium text-foreground">Account or phone number mismatch</dt>
            <dd className="mt-1 leading-relaxed text-muted-foreground">
              Recheck the selected number and WABA. Make sure the token can access both assets.
            </dd>
          </div>
          <div>
            <dt className="font-medium text-foreground">Connected, but no incoming messages</dt>
            <dd className="mt-1 leading-relaxed text-muted-foreground">
              Ask your workspace administrator to check the configured webhook and app subscription.
              A successful API test alone does not confirm incoming delivery.
            </dd>
          </div>
          <div>
            <dt className="font-medium text-foreground">Prefer the guided Meta flow?</dt>
            <dd className="mt-1 leading-relaxed text-muted-foreground">
              Use Connect with Meta Signup from the connection dialog. Finish authorization and
              account selection in Meta.
            </dd>
          </div>
        </dl>
      </section>
      <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-5 text-xs text-muted-foreground">
        <span>Meta's screen labels may change. Keep tokens out of screenshots and messages.</span>
        <a
          href="https://www.postman.com/meta/whatsapp-business-platform/documentation/wlk6lh4/whatsapp-cloud-api"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 rounded-sm text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Meta's Cloud API documentation
          <ArrowUpRight className="size-3.5" />
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      </footer>
    </div>
  );
}
