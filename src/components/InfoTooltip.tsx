import { HelpCircle } from "lucide-react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

interface InfoTooltipProps {
  term: string;
  children: React.ReactNode;
}

const glossary: Record<string, { short: string; detail: string }> = {
  JAZ: {
    short: "Jahresarbeitszahl",
    detail:
      "Die JAZ beschreibt das Verhältnis von erzeugter Wärme zu verbrauchtem Strom über ein ganzes Jahr. Eine JAZ von 4 bedeutet: Aus 1 kWh Strom werden 4 kWh Wärme. Je höher die JAZ, desto effizienter arbeitet die Wärmepumpe. Gute Luft-WP erreichen eine JAZ von 3,5–4,5, Erdwärme-WP 4,0–5,5.",
  },
  "JAZ Warmwasser": {
    short: "Jahresarbeitszahl für Warmwasserbereitung",
    detail:
      "Die JAZ Warmwasser misst die Effizienz der Wärmepumpe speziell bei der Warmwasserbereitung. Sie ist meist niedriger als die Heiz-JAZ, da Warmwasser auf 50–60°C erhitzt werden muss (Legionellenschutz), während Heizwasser nur 30–45°C braucht. Typische Werte: 2,5–3,5.",
  },
  Vorlauftemperatur: {
    short: "Temperatur des Heizwassers, das zu den Heizkörpern fließt",
    detail:
      "Die Vorlauftemperatur ist die Temperatur, mit der das Heizwasser von der Wärmepumpe in die Heizkörper oder Fußbodenheizung gepumpt wird. Je niedriger die Vorlauftemperatur, desto effizienter arbeitet die WP. Fußbodenheizungen brauchen nur 30–35°C, Bestandsheizkörper oft 50–60°C. Der Unterschied kann 20–30% Effizienz ausmachen.",
  },
  Heizwärmebedarf: {
    short: "Wärmemenge, die ein Gebäude pro Jahr und m² benötigt",
    detail:
      "Der spezifische Heizwärmebedarf (kWh/m²·a) zeigt, wie viel Energie ein Gebäude zum Heizen braucht. Er hängt von Dämmung, Fenstern, Bauart und Klima ab. Neubauten liegen bei 30–50 kWh/m², gut sanierte Altbauten bei 60–80 kWh/m², unsanierte Altbauten bei 120–200 kWh/m². Ein niedriger Wert entlastet die Wärmepumpe erheblich.",
  },
  "Hydraulischer Abgleich": {
    short: "Optimierung der Wärmeverteilung im Heizsystem",
    detail:
      "Beim hydraulischen Abgleich wird die Wassermenge an jedem Heizkörper so eingestellt, dass jeder Raum genau die richtige Wärmemenge erhält. Ohne Abgleich werden nahe Heizkörper überversorgt und entfernte unterversorgt — die WP muss dann mit höherer Vorlauftemperatur arbeiten. Kosten: ca. 500–1.000€, spart 10–15% Energie. Seit 2023 bei WP-Förderung Pflicht.",
  },
  Pufferspeicher: {
    short: "Wassertank, der erzeugte Wärme zwischenspeichert",
    detail:
      "Ein Pufferspeicher speichert warmes Wasser, damit die Wärmepumpe nicht ständig an- und ausschalten muss (Taktung). Bei Fußbodenheizungen ist er oft unnötig, da der Estrich selbst als Wärme­speicher dient. Ein Pufferspeicher verursacht Wärmeverluste (1–3% des Bedarfs) und kann die Effizienz senken, wenn er falsch dimensioniert ist.",
  },
  Flächenheizung: {
    short: "Heizung in Boden, Wand oder Decke",
    detail:
      "Flächenheizungen (Fußboden-, Wand- oder Deckenheizung) verteilen Wärme über große Flächen und brauchen daher nur niedrige Vorlauftemperaturen (30–35°C). Das macht sie ideal für Wärmepumpen. Im Vergleich zu Heizkörpern steigern sie die JAZ um 20–40%. Sie sorgen zudem für gleichmäßigere Wärmeverteilung und höheren Komfort.",
  },
  "WP-Heizkörper": {
    short: "Speziell für Wärmepumpen konstruierte Heizkörper",
    detail:
      "WP-Heizkörper (z.B. Typ 33 Ventilheizkörper oder Niedertemperatur-Konvektoren) haben deutlich größere Übertragungsflächen als normale Heizkörper. Dadurch können sie mit nur 42°C Vorlauf­temperatur die gleiche Raumwärme liefern wie ein Standard-Heizkörper mit 55°C. Sie sind eine gute Alternative zur Fußbodenheizung bei Altbausanierungen.",
  },
  Heizkurve: {
    short: "Regelkurve der Vorlauftemperatur abhängig von der Außentemperatur",
    detail:
      "Die Heizkurve bestimmt, wie stark die Wärmepumpe das Heizwasser erwärmt — je kälter es draußen ist, desto wärmer das Heizwasser. Eine zu steil eingestellte Heizkurve verschwendet Energie, weil die Vorlauftemperatur unnötig hoch wird. Die optimale Einstellung hängt von Gebäudedämmung und Heizflächen ab. Steilheit und Parallelverschiebung sind die zwei Einstellparameter.",
  },
  "Automatische Raumregler": {
    short: "Smarte Thermostate mit programmierbarer Temperatursteuerung",
    detail:
      "Automatische Raumregler (smarte Thermostate) ermöglichen raumweise Zeitprogramme, automatische Nachtabsenkung und Absenkung bei Abwesenheit. Sie kommunizieren per Funk mit der Heizungssteuerung und sparen ca. 5–10% Energie. Kosten: 50–80€ pro Heizkörper. Bei Fußbodenheizung regeln sie einzelne Heizkreise.",
  },
  Abrechnungszeitraum: {
    short: "Zeitraum, auf den sich Ihre Verbrauchsdaten beziehen",
    detail:
      "Geben Sie den exakten Zeitraum Ihrer Stromabrechnung oder Ihres Zähler-Ablesezeitraums an. Bei weniger als 12 Monaten rechnet die Simulation den Verbrauch automatisch aufs Jahr hoch — gewichtet nach Heizgradtagen, damit Sommer- und Wintermonate korrekt berücksichtigt werden. Ein volles Jahr (z.B. Jan–Dez) liefert die genauesten Ergebnisse.",
  },
  Baujahr: {
    short: "Baujahr bestimmt den energetischen Standard des Gebäudes",
    detail:
      "Das Baujahr gibt Aufschluss über den ursprünglichen Dämmstandard. Vor 1978 gab es keine Wärmeschutz­verordnung — diese Gebäude haben typisch 150–200 kWh/m²·a Heizwärmebedarf. Mit jeder Verschärfung (1. WSchV 1978, EnEV 2002, GEG 2020) sank der Standard erheblich. Ein Neubau ab 2016 braucht nur noch ca. 35–50 kWh/m²·a. Das Baujahr beeinflusst direkt, wie effizient die Wärmepumpe arbeiten kann.",
  },
};

const InfoTooltip = ({ term, children }: InfoTooltipProps) => {
  const entry = glossary[term];
  if (!entry) return <>{children}</>;

  return (
    <span className="inline-flex items-center gap-1">
      {children}
      <HoverCard openDelay={200} closeDelay={100}>
        <HoverCardTrigger asChild>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors p-0.5 -my-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={`Was ist ${term}?`}
          >
            <HelpCircle className="h-3.5 w-3.5" />
          </button>
        </HoverCardTrigger>
        <HoverCardContent className="w-80 text-left" side="top" align="start">
          <div className="space-y-2">
            <div>
              <p className="text-sm font-semibold text-foreground">{term}</p>
              <p className="text-xs text-primary font-medium">{entry.short}</p>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {entry.detail}
            </p>
          </div>
        </HoverCardContent>
      </HoverCard>
    </span>
  );
};

export default InfoTooltip;
