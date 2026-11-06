import { useState } from "react";
import {
  ArrowRight,
  BarChart3,
  Check,
  ChevronDown,
  Inbox,
  Menu,
  MessageSquare,
  Moon,
  ShieldCheck,
  Sparkles,
  Sun,
  Users,
  X,
  Zap
} from "lucide-react";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Separator } from "@flowdesk/ui";
import { WabrixIcon } from "../../components/layout/AppSidebar.js";
import { useTheme } from "../../components/theme-provider.js";

const navItems = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#workflow" },
  { label: "Security", href: "#security" },
  { label: "FAQ", href: "#faq" }
];

const featureCards = [
  {
    icon: Inbox,
    title: "Shared WhatsApp inbox",
    description: "Give every customer conversation a clear owner, status, queue, and next action."
  },
  {
    icon: Sparkles,
    title: "Grounded AI copilot",
    description:
      "Draft replies from your approved knowledge with citations and human approval before send."
  },
  {
    icon: Zap,
    title: "Reliable automation",
    description: "Route and assign conversations, then send approved templates when needed."
  },
  {
    icon: BarChart3,
    title: "Team analytics",
    description: "See throughput, SLA pressure, bot assistance, and workload from one workspace."
  }
];

const loginHref = "/api/v1/auth/login?returnTo=/inbox";

function scrollToSection(event: React.MouseEvent<HTMLAnchorElement>, href: string) {
  if (!href.startsWith("#")) return;
  const target = document.querySelector(href);
  if (!target) return;
  event.preventDefault();
  target.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function LandingPage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const isDark =
    theme === "dark" || (theme === "system" && document.documentElement.classList.contains("dark"));

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <a
            href="#hero"
            onClick={(event) => scrollToSection(event, "#hero")}
            className="flex items-center gap-2 font-bold tracking-tight"
          >
            <span className="rounded-lg bg-primary/10 p-2">
              <WabrixIcon size={22} />
            </span>
            Wabrix AI
          </a>

          <nav className="hidden items-center gap-1 lg:flex">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={(event) => scrollToSection(event, item.href)}
                className="rounded-md px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-2 lg:flex">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Toggle theme"
              onClick={() => setTheme(isDark ? "light" : "dark")}
            >
              {isDark ? <Sun /> : <Moon />}
            </Button>
            <Button variant="ghost" asChild>
              <a href={loginHref}>Sign In</a>
            </Button>
            <Button asChild>
              <a href={loginHref}>
                Get Started <ArrowRight />
              </a>
            </Button>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label="Open menu"
            onClick={() => setMobileOpen(true)}
          >
            <Menu />
          </Button>
        </div>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-[60] bg-background lg:hidden">
          <div className="flex h-16 items-center justify-between border-b px-4">
            <span className="flex items-center gap-2 font-semibold">
              <WabrixIcon size={20} /> Wabrix AI
            </span>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Close menu"
              onClick={() => setMobileOpen(false)}
            >
              <X />
            </Button>
          </div>
          <nav className="flex flex-col gap-1 p-6">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={(event) => {
                  setMobileOpen(false);
                  scrollToSection(event, item.href);
                }}
                className="rounded-lg px-4 py-3 text-base font-medium hover:bg-accent"
              >
                {item.label}
              </a>
            ))}
          </nav>
          <div className="grid grid-cols-2 gap-3 border-t p-6">
            <Button variant="outline" asChild>
              <a href={loginHref}>Sign In</a>
            </Button>
            <Button asChild>
              <a href={loginHref}>Get Started</a>
            </Button>
          </div>
        </div>
      )}

      <main>
        <section
          id="hero"
          className="relative overflow-hidden bg-gradient-to-b from-background to-background/80 pb-16 pt-16 sm:pb-24 sm:pt-24"
        >
          <div className="pointer-events-none absolute inset-0 opacity-60 [background-image:radial-gradient(circle_at_1px_1px,hsl(var(--border))_1px,transparent_0)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-4xl text-center">
              <div className="mb-8 flex justify-center">
                <Badge variant="outline" className="gap-2 px-4 py-2">
                  <Sparkles className="size-3" /> AI customer operations for WhatsApp{" "}
                  <ArrowRight className="size-3" />
                </Badge>
              </div>
              <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
                Turn every customer message into a{" "}
                <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  better operation.
                </span>
              </h1>
              <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground sm:text-xl">
                Wabrix AI gives your team one calm place to manage WhatsApp conversations, use
                grounded AI assistance, and keep customer operations moving.
              </p>
              <div className="flex flex-col justify-center gap-4 sm:flex-row">
                <Button size="lg" className="text-base" asChild>
                  <a href={loginHref}>
                    Open Wabrix AI <ArrowRight />
                  </a>
                </Button>
                <Button variant="outline" size="lg" className="text-base" asChild>
                  <a href="#features" onClick={(event) => scrollToSection(event, "#features")}>
                    Explore the workspace
                  </a>
                </Button>
              </div>
            </div>

            <div className="mx-auto mt-16 max-w-6xl sm:mt-20">
              <div className="relative">
                <div className="absolute -top-8 left-1/2 h-48 w-4/5 -translate-x-1/2 rounded-full bg-primary/30 blur-3xl" />
                <div className="relative overflow-hidden rounded-xl border bg-card shadow-2xl">
                  <img
                    src="/landing-dashboard-dark.webp"
                    alt="Wabrix AI inbox with synthetic conversations"
                    className="block w-full object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-background sm:h-48" />
                </div>
                <p className="mt-3 text-center text-xs text-muted-foreground">
                  Inbox preview with synthetic conversations.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y bg-muted/30 py-8">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-10 gap-y-4 px-4 text-sm font-medium text-muted-foreground sm:px-6 lg:px-8">
            <span className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-primary" /> Tenant-isolated
            </span>
            <span className="flex items-center gap-2">
              <MessageSquare className="size-4 text-primary" /> WhatsApp-native
            </span>
            <span className="flex items-center gap-2">
              <Users className="size-4 text-primary" /> Built for teams
            </span>
            <span className="flex items-center gap-2">
              <Zap className="size-4 text-primary" /> Realtime operations
            </span>
          </div>
        </section>

        <section className="py-16 lg:py-24">
          <div className="mx-auto grid max-w-5xl gap-8 px-4 text-center sm:grid-cols-3 sm:px-6 lg:px-8">
            {["Shared inbox", "Grounded drafts", "Clear ownership"].map((label, index) => (
              <div key={label} className="space-y-2">
                <p className="text-3xl font-bold tracking-tight sm:text-4xl">
                  {["Inbox", "AI", "Team"][index]}
                </p>
                <p className="text-sm text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="features" className="scroll-mt-20 bg-muted/40 py-16 lg:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <Badge variant="outline" className="mb-4">
                One operational workspace
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight sm:text-5xl">
                Everything your support team needs to move with confidence.
              </h2>
              <p className="mt-4 text-muted-foreground sm:text-lg">
                Manage conversations, routing, AI drafts, and team workload from one workspace.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {featureCards.map((feature) => {
                const Icon = feature.icon;
                return (
                  <Card
                    key={feature.title}
                    className="border bg-background/70 shadow-sm transition-shadow hover:shadow-md"
                  >
                    <CardHeader>
                      <Icon className="mb-4 size-6 text-primary" />
                      <CardTitle className="text-lg">{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 text-sm leading-6 text-muted-foreground">
                      {feature.description}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        <section id="workflow" className="scroll-mt-20 py-16 lg:py-24">
          <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
            <div>
              <Badge variant="outline" className="mb-4">
                Designed for the handoff
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight sm:text-5xl">
                AI helps. Your team stays in control.
              </h2>
              <p className="mt-5 text-muted-foreground sm:text-lg">
                Messages arrive in the shared inbox, context is visible beside the thread, and AI
                drafts can be reviewed or edited before sending.
              </p>
              <div className="mt-8 space-y-4">
                {[
                  "Route conversations to the right queue",
                  "Ground drafts in approved knowledge",
                  "Approve, edit, or reject before delivery"
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <span className="mt-0.5 rounded-full bg-primary/10 p-1 text-primary">
                      <Check className="size-4" />
                    </span>
                    <span className="text-sm font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <Card className="overflow-hidden border bg-muted/30 shadow-xl">
              <CardContent className="p-0">
                <img
                  src="/landing-dashboard-dark-1.webp"
                  alt="Wabrix AI analytics dashboard with synthetic activity"
                  className="w-full object-cover"
                />
                <p className="px-4 py-3 text-xs text-muted-foreground">
                  Analytics preview with synthetic activity.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section id="security" className="scroll-mt-20 border-y bg-muted/80 py-16 lg:py-24">
          <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
            <Badge variant="outline" className="mb-6">
              Operational trust by default
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-5xl">
              Your customer data belongs in a system your team can explain.
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-muted-foreground sm:text-lg">
              Wabrix AI keeps workspace boundaries, permissions, delivery state, and human approval
              visible in the product.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3 text-sm text-muted-foreground">
              <span className="rounded-full border bg-background px-4 py-2">Role-based access</span>
              <span className="rounded-full border bg-background px-4 py-2">
                Audit-ready actions
              </span>
              <span className="rounded-full border bg-background px-4 py-2">
                WhatsApp policy aware
              </span>
            </div>
          </div>
        </section>

        <section id="faq" className="scroll-mt-20 py-16 lg:py-24">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-5xl">
                Questions, answered.
              </h2>
              <p className="mt-4 text-muted-foreground">
                A few things teams usually want to know before opening the workspace.
              </p>
            </div>
            <div className="mt-10 divide-y rounded-xl border">
              {[
                [
                  "Does AI send messages automatically?",
                  "Your team can review and edit AI drafts before sending. Optional automatic replies require a workspace policy and must pass safety checks."
                ],
                [
                  "Can the team keep using WhatsApp policy-safe templates?",
                  "Yes. The inbox preserves service-window restrictions and approved template flows."
                ],
                [
                  "Is Wabrix AI only for support?",
                  "No. It is a shared customer operations workspace for support, sales handoff, and follow-up workflows."
                ]
              ].map(([question, answer]) => (
                <details key={question} className="group p-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
                    {question}
                    <ChevronDown className="size-4 shrink-0 transition-transform group-open:rotate-180" />
                  </summary>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">{answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-muted/80 py-16 lg:py-24">
          <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
            <Badge variant="outline" className="mb-6 gap-2">
              <Zap className="size-3" /> Ready when your team is
            </Badge>
            <h2 className="text-4xl font-bold tracking-tight sm:text-6xl">
              Make every conversation easier to operate.
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-muted-foreground lg:text-xl">
              Open the workspace and give your team a clearer way to handle customer messages.
            </p>
            <Button size="lg" className="mt-8 px-8 text-base" asChild>
              <a href={loginHref}>
                Open Wabrix AI <ArrowRight />
              </a>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t bg-background">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <div className="sm:col-span-2">
              <div className="flex items-center gap-2 font-bold">
                <WabrixIcon size={24} /> Wabrix AI
              </div>
              <p className="mt-4 max-w-md text-sm leading-6 text-muted-foreground">
                AI customer operations for teams that run on WhatsApp.
              </p>
            </div>
            <div>
              <h3 className="font-semibold">Product</h3>
              <div className="mt-4 space-y-3 text-sm text-muted-foreground">
                <a className="block hover:text-foreground" href="#features">
                  Features
                </a>
                <a className="block hover:text-foreground" href="#workflow">
                  How it works
                </a>
                <a className="block hover:text-foreground" href={loginHref}>
                  Open workspace
                </a>
              </div>
            </div>
            <div>
              <h3 className="font-semibold">Company</h3>
              <div className="mt-4 space-y-3 text-sm text-muted-foreground">
                <a className="block hover:text-foreground" href="#security">
                  Security
                </a>
                <a className="block hover:text-foreground" href="#faq">
                  FAQ
                </a>
                <a className="block hover:text-foreground" href={loginHref}>
                  Sign in
                </a>
              </div>
            </div>
          </div>
          <Separator className="my-8" />
          <div className="flex flex-col justify-between gap-3 text-sm text-muted-foreground sm:flex-row">
            <span>© {new Date().getFullYear()} Wabrix AI</span>
            <span>Customer operations, made clearer.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
