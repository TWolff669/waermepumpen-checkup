import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { getTierLabel, getTierColor, type UserTier } from "@/lib/tier-guard";
import { toast } from "sonner";
import { Check, X, Star, Settings } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const TIERS = [
  {
    id: "free" as UserTier,
    name: "Free",
    description: "Kostenloser Einstieg für alle",
    priceMonthly: 0,
    priceYearly: 0,
    priceOnce: null as number | null,
    isSubscription: false,
    features: [
      "Effizienz-Check (Basic + Advanced)",
      "Ergebnisse mit Empfehlungen",
      "Szenario-Simulator",
      "PDF-Export der Ergebnisse",
    ],
    missing: [
      "Projekte speichern",
      "Adressfeld",
      "Eigene Kostenparameter",
      "Priority-Support",
    ],
    cta: "Kostenlos starten",
    popular: false,
  },
  {
    id: "einzel" as UserTier,
    name: "Einzel",
    description: "Für Ihr erstes Projekt",
    priceMonthly: null as number | null,
    priceYearly: null as number | null,
    priceOnce: 9.9,
    isSubscription: false,
    features: [
      "Alles aus Free",
      "1 Projekt speichern & verfolgen",
      "Projekthistorie mit Check-Verlauf",
      "Adressfeld für Gebäudezuordnung",
    ],
    missing: [
      "Eigene Kostenparameter",
      "Priority-Support",
    ],
    cta: "Einzel kaufen",
    popular: false,
  },
  {
    id: "starter" as UserTier,
    name: "Starter",
    description: "Für mehrere Projekte",
    priceMonthly: 4.9,
    priceYearly: 49,
    priceOnce: null as number | null,
    isSubscription: true,
    features: [
      "Alles aus Einzel",
      "Bis zu 3 Projekte parallel",
      "Eigene Kostenparameter definieren",
    ],
    missing: [
      "Priority-Support",
    ],
    cta: "Starter wählen",
    popular: true,
  },
  {
    id: "professional" as UserTier,
    name: "Professional",
    description: "Für Profis & Büros",
    priceMonthly: 14.9,
    priceYearly: 149,
    priceOnce: null as number | null,
    isSubscription: true,
    features: [
      "Alles aus Starter",
      "Bis zu 15 Projekte",
      "Priority-Support per E-Mail",
    ],
    missing: [],
    cta: "Professional wählen",
    popular: false,
  },
];

const COMPARISON_ROWS = [
  { label: "Effizienz-Check", values: ["✓", "✓", "✓", "✓"] },
  { label: "PDF-Export", values: ["✓", "✓", "✓", "✓"] },
  { label: "Szenario-Simulator", values: ["✓", "✓", "✓", "✓"] },
  { label: "Projekte speichern", values: ["✗", "✓", "✓", "✓"] },
  { label: "Anzahl Projekte", values: ["0", "1", "3", "15"] },
  { label: "Projekthistorie", values: ["✗", "✓", "✓", "✓"] },
  { label: "Adressfeld", values: ["✗", "✓", "✓", "✓"] },
  { label: "Eigene Kostenparameter", values: ["✗", "✗", "✓", "✓"] },
  { label: "Priority-Support", values: ["✗", "✗", "✗", "✓"] },
];

const FAQ_ITEMS = [
  {
    q: "Kann ich jederzeit upgraden?",
    a: "Ja, Sie können jederzeit auf einen höheren Plan wechseln. Der Unterschiedsbetrag wird anteilig berechnet.",
  },
  {
    q: "Was passiert mit meinen Daten beim Downgrade?",
    a: "Nach einem Downgrade haben Sie eine 30-tägige Übergangsfrist (Grace Period). In dieser Zeit bleiben Ihre Projekte lesbar. Danach werden überzählige Projekte auf Read-Only gesetzt.",
  },
  {
    q: "Gibt es eine Testphase?",
    a: "Der Free-Plan ist dauerhaft kostenlos und ohne Einschränkung nutzbar. Sie können alle Analyse-Features unbegrenzt testen.",
  },
  {
    q: "Welche Zahlungsmethoden werden akzeptiert?",
    a: "Wir akzeptieren Kreditkarte, SEPA-Lastschrift und PayPal. Weitere Methoden sind in Vorbereitung.",
  },
  {
    q: "Kann ich den Einzel-Plan auf Starter upgraden?",
    a: "Ja, der einmalig gezahlte Betrag für den Einzel-Plan wird beim Upgrade auf Starter oder Professional angerechnet.",
  },
  {
    q: "Bekomme ich eine Rechnung?",
    a: "Ja, nach jedem Zahlungsvorgang erhalten Sie automatisch eine Rechnung per E-Mail.",
  },
];

const TIER_ORDER: Record<UserTier, number> = { free: 0, einzel: 1, starter: 2, professional: 3 };

export default function Pricing() {
  const [yearly, setYearly] = useState(false);
  const { user, tierProfile } = useAuth();
  const navigate = useNavigate();
  const currentTier = tierProfile?.tier ?? "free";

  const handleCta = (tierId: UserTier) => {
    if (tierId === "free") {
      navigate(user ? "/efficiency-check" : "/auth");
      return;
    }
    toast.info("Zahlung wird in Kürze verfügbar. Kontaktieren Sie uns unter info@tga-wolff.de");
  };

  const getCtaState = (tierId: UserTier) => {
    if (!user) return { label: TIERS.find((t) => t.id === tierId)!.cta, disabled: false };
    if (tierId === currentTier) return { label: "Aktueller Plan", disabled: true };
    if (TIER_ORDER[tierId] < TIER_ORDER[currentTier]) return { label: "Enthaltener Plan", disabled: true };
    return { label: TIERS.find((t) => t.id === tierId)!.cta, disabled: false };
  };

  const formatPrice = (tier: (typeof TIERS)[number]) => {
    if (tier.priceOnce !== null) return `${tier.priceOnce.toFixed(2).replace(".", ",")} €`;
    if (!tier.isSubscription) return "0 €";
    const price = yearly ? tier.priceYearly! : tier.priceMonthly!;
    return `${price.toFixed(2).replace(".", ",")} €`;
  };

  const priceSuffix = (tier: (typeof TIERS)[number]) => {
    if (tier.priceOnce !== null) return "einmalig";
    if (!tier.isSubscription) return "für immer";
    return yearly ? "/ Jahr" : "/ Monat";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden py-16 md:py-24">
        <div className="absolute inset-0 bg-[image:var(--gradient-hero)] opacity-[0.06]" />
        <div className="container relative mx-auto px-4 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-5xl">
            Finden Sie den passenden Plan
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Starten Sie kostenlos — upgraden Sie, wenn Sie mehr brauchen.
          </p>

          {/* Toggle */}
          <div className="mt-8 flex items-center justify-center gap-3">
            <span className={`text-sm font-medium ${!yearly ? "text-foreground" : "text-muted-foreground"}`}>Monatlich</span>
            <Switch checked={yearly} onCheckedChange={setYearly} />
            <span className={`text-sm font-medium ${yearly ? "text-foreground" : "text-muted-foreground"}`}>
              Jährlich
              <Badge variant="secondary" className="ml-2 text-xs">17% sparen</Badge>
            </span>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="container mx-auto -mt-4 px-4 pb-16">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {TIERS.map((tier) => {
            const { label: ctaLabel, disabled: ctaDisabled } = getCtaState(tier.id);
            const isCurrent = user && tier.id === currentTier;
            return (
              <Card
                key={tier.id}
                className={`relative flex flex-col transition-shadow duration-300 hover:shadow-lg ${
                  tier.popular ? "ring-2 ring-primary" : ""
                } ${isCurrent ? "border-primary" : ""}`}
              >
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="gap-1 bg-primary text-primary-foreground"><Star className="h-3 w-3" /> Beliebt</Badge>
                  </div>
                )}
                {isCurrent && (
                  <div className="absolute -top-3 right-4">
                    <Badge className={getTierColor(currentTier)}>Ihr aktueller Plan</Badge>
                  </div>
                )}

                <CardHeader className="pt-8">
                  <CardTitle className="text-xl">{tier.name}</CardTitle>
                  <CardDescription>{tier.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-3xl font-bold text-foreground">{formatPrice(tier)}</span>
                    <span className="ml-1 text-sm text-muted-foreground">{priceSuffix(tier)}</span>
                  </div>
                  {tier.isSubscription && yearly && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      entspricht {((tier.priceYearly ?? 0) / 12).toFixed(2).replace(".", ",")} € / Monat
                    </p>
                  )}
                </CardHeader>

                <CardContent className="flex-1">
                  <ul className="space-y-2 text-sm">
                    {tier.features.map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span>{f}</span>
                      </li>
                    ))}
                    {tier.missing.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-muted-foreground">
                        <X className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter>
                  <Button
                    className="w-full"
                    variant={tier.popular ? "hero" : "default"}
                    disabled={ctaDisabled}
                    onClick={() => handleCta(tier.id)}
                  >
                    {ctaLabel}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Comparison Table */}
      <section className="container mx-auto px-4 pb-16">
        <h2 className="mb-6 text-center text-2xl font-bold text-foreground">Feature-Vergleich</h2>
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[160px]">Feature</TableHead>
                {TIERS.map((t) => (
                  <TableHead key={t.id} className="text-center">{t.name}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {COMPARISON_ROWS.map((row) => (
                <TableRow key={row.label}>
                  <TableCell className="font-medium">{row.label}</TableCell>
                  {row.values.map((v, i) => (
                    <TableCell key={i} className="text-center">
                      {v === "✓" ? (
                        <Check className="mx-auto h-4 w-4 text-primary" />
                      ) : v === "✗" ? (
                        <X className="mx-auto h-4 w-4 text-muted-foreground/50" />
                      ) : (
                        <span className="font-mono text-sm font-semibold">{v}</span>
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      {/* FAQ */}
      <section className="container mx-auto px-4 pb-20">
        <h2 className="mb-6 text-center text-2xl font-bold text-foreground">Häufige Fragen</h2>
        <div className="mx-auto max-w-2xl">
          <Accordion type="single" collapsible>
            {FAQ_ITEMS.map((item, i) => (
              <AccordionItem key={i} value={`faq-${i}`}>
                <AccordionTrigger>{item.q}</AccordionTrigger>
                <AccordionContent>{item.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>
    </div>
  );
}
