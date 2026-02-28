import { motion } from "framer-motion";
import { ArrowRight, BarChart3, Shield, Lightbulb } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import heroBg from "@/assets/hero-bg.jpg";

const HeroSection = () => (
  <section className="relative overflow-hidden">
    <div className="absolute inset-0">
      <img src={heroBg} alt="Modernes Haus mit Wärmepumpe" className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-foreground/60" />
    </div>
    <div className="relative container py-24 md:py-36">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-2xl"
      >
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-primary-foreground mb-6 leading-tight">
          Läuft Ihre Wärmepumpe effizient?
        </h1>
        <p className="text-lg md:text-xl text-primary-foreground/80 mb-8 leading-relaxed">
          Prüfen Sie in wenigen Minuten, ob Ihre Wärmepumpe optimal arbeitet — und erhalten Sie konkrete Empfehlungen zur Verbesserung.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Button variant="hero" size="lg" asChild>
            <Link to="/efficiency-check">
              Jetzt Check starten <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </motion.div>
    </div>
  </section>
);

const features = [
  {
    icon: BarChart3,
    title: "Verbrauchsanalyse",
    description: "Vergleichen Sie Ihren tatsächlichen Verbrauch mit dem simulierten Optimum für Ihr Gebäude.",
  },
  {
    icon: Shield,
    title: "Herstellerunabhängig",
    description: "Unser Check funktioniert mit jeder Wärmepumpe — unabhängig von Hersteller oder Modell.",
  },
  {
    icon: Lightbulb,
    title: "Konkrete Empfehlungen",
    description: "Erhalten Sie sofort umsetzbare Tipps zur Optimierung und wissen Sie, wann ein Fachplaner sinnvoll ist.",
  },
];

const FeaturesSection = () => (
  <section className="py-20 gradient-subtle">
    <div className="container">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="text-center mb-14"
      >
        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
          So funktioniert der WP-Check
        </h2>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          In drei einfachen Schritten erfahren Sie, wie effizient Ihre Wärmepumpe arbeitet.
        </p>
      </motion.div>
      <div className="grid md:grid-cols-3 gap-8">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.1 }}
            className="bg-card rounded-xl p-8 shadow-card border border-border hover:shadow-elevated transition-shadow duration-300"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-5">
              <f.icon className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-card-foreground mb-3">{f.title}</h3>
            <p className="text-muted-foreground leading-relaxed">{f.description}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

const StepsSection = () => {
  const steps = [
    { number: "1", title: "Daten eingeben", desc: "Postleitzahl, Gebäudetyp, Wärmepumpen-Details und Verbrauch." },
    { number: "2", title: "Ergebnis erhalten", desc: "Sofortige Simulation und Vergleich mit Ihren tatsächlichen Werten." },
    { number: "3", title: "Optimieren", desc: "Personalisierte Empfehlungen oder Verweis an einen Fachplaner." },
  ];

  return (
    <section className="py-20">
      <div className="container">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Drei Schritte zum Ergebnis</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((s, i) => (
            <motion.div
              key={s.number}
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.12 }}
              className="flex gap-5"
            >
              <div className="flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-full gradient-hero font-mono font-bold text-primary-foreground text-lg">
                {s.number}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-1">{s.title}</h3>
                <p className="text-muted-foreground">{s.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const CTASection = () => (
  <section className="py-20 gradient-hero">
    <div className="container text-center">
      <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
        Bereit für den Check?
      </h2>
      <p className="text-primary-foreground/80 text-lg mb-8 max-w-xl mx-auto">
        Kostenlos, unverbindlich und in wenigen Minuten erledigt.
      </p>
      <Button variant="outline-hero" size="lg" asChild className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
        <Link to="/efficiency-check">
          Check starten <ArrowRight className="ml-1 h-4 w-4" />
        </Link>
      </Button>
    </div>
  </section>
);

const Footer = () => (
  <footer className="border-t border-border py-10">
    <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
      <p className="text-sm text-muted-foreground">© 2026 WP-Check. Alle Rechte vorbehalten.</p>
      <div className="flex gap-6">
        <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Datenschutz</a>
        <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Impressum</a>
      </div>
    </div>
  </footer>
);

const LandingPage = () => (
  <>
    <HeroSection />
    <FeaturesSection />
    <StepsSection />
    <CTASection />
    <Footer />
  </>
);

export default LandingPage;
