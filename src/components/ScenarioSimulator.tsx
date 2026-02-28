import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Calculator, TrendingUp, Clock, Euro, Award, ExternalLink, ChevronDown, Info } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { type Recommendation } from "@/lib/simulation";
import { matchMassnahmeToRecommendation, berechneSzenario, getMassnahmeBlockedBy, type MassnahmeKosten, type SzenarioErgebnis } from "@/lib/massnahmen-kosten";
import { getRegionaleFoerderung, getRelevanteFoerderung, type Foerdermittel } from "@/lib/foerderung";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface ScenarioSimulatorProps {
  recommendations: Recommendation[];
  strompreis: number; // €/kWh
  aktuellerVerbrauch: number;
  aktuelleJAZ: number;
  flaecheM2: number;
  personenAnzahl: number;
  plz: string;
  foerderungenBund: Foerdermittel[];
}

const ScenarioSimulator = ({
  recommendations,
  strompreis,
  aktuellerVerbrauch,
  aktuelleJAZ,
  flaecheM2,
  personenAnzahl,
  plz,
  foerderungenBund,
}: ScenarioSimulatorProps) => {
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [showResults, setShowResults] = useState(false);

  // Map recommendations to cost data
  const recWithCosts = useMemo(() => {
    return recommendations.map((rec, i) => ({
      rec,
      index: i,
      kosten: matchMassnahmeToRecommendation(rec.category, rec.title),
    }));
  }, [recommendations]);

  const simulierbareMassnahmen = recWithCosts.filter(r => r.kosten && (r.kosten.stromersparnisKwhBasis > 0 || r.kosten.kostenMax > 0));

  const toggleSelection = (idx: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
    setShowResults(false);
  };

  const selectedMassnahmen: MassnahmeKosten[] = useMemo(() => {
    return Array.from(selected)
      .map(idx => recWithCosts.find(r => r.index === idx)?.kosten)
      .filter((k): k is MassnahmeKosten => !!k);
  }, [selected, recWithCosts]);

  // IDs of currently selected measures (for exclusion checks)
  const selectedIds = useMemo(() => selectedMassnahmen.map(m => m.id), [selectedMassnahmen]);

  const szenario: SzenarioErgebnis | null = useMemo(() => {
    if (!showResults || selectedMassnahmen.length === 0) return null;
    return berechneSzenario(selectedMassnahmen, strompreis, aktuellerVerbrauch, aktuelleJAZ, flaecheM2, personenAnzahl);
  }, [showResults, selectedMassnahmen, strompreis, aktuellerVerbrauch, aktuelleJAZ, flaecheM2, personenAnzahl]);

  // Regional funding for selected measures
  const regionaleFoerderungen = useMemo(() => {
    if (!showResults || selectedMassnahmen.length === 0) return [];
    return getRegionaleFoerderung(plz, selectedMassnahmen.map(m => m.id));
  }, [showResults, selectedMassnahmen, plz]);

  // Filter Bund-Förderungen relevant to selected measures
  const relevantesBundesFoerderungen = useMemo(() => {
    if (!showResults) return [];
    const selectedIds = new Set(selectedMassnahmen.map(m => m.kategorie.toLowerCase()));
    return foerderungenBund.filter(f => {
      const m = f.massnahme.toLowerCase();
      if (selectedIds.has("maßnahme") && m.includes("hydraulisch")) return true;
      if ((selectedIds.has("investition") || selectedIds.has("gebäude") || selectedIds.has("gebaeude")) && (m.includes("heizkörper") || m.includes("gebäude"))) return true;
      if (selectedIds.has("fachplaner") && m.includes("energieberatung")) return true;
      return false;
    });
  }, [showResults, selectedMassnahmen, foerderungenBund]);

  const alleFoerderungen = [...relevantesBundesFoerderungen, ...regionaleFoerderungen];

  return (
    <div className="bg-card rounded-xl shadow-card border border-border p-6 mb-8">
      <div className="flex items-center gap-2.5 mb-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
          <Calculator className="h-4 w-4 text-primary" />
        </div>
        <h2 className="text-lg font-semibold text-card-foreground">Maßnahmen-Szenario</h2>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        Wählen Sie die Empfehlungen aus, die Sie umsetzen möchten. Wir berechnen Kosten, Effizienzsteigerung und Amortisation.
      </p>

      {/* Checkboxes */}
      <div className="space-y-2 mb-4">
        {simulierbareMassnahmen.map(({ rec, index, kosten }) => {
          const blockedBy = kosten ? getMassnahmeBlockedBy(kosten.id, selectedIds.filter(id => id !== kosten.id)) : undefined;
          const isBlocked = !!blockedBy && !selected.has(index);
          return (
            <label
              key={index}
              className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                isBlocked
                  ? "border-border bg-muted/30 opacity-50 cursor-not-allowed"
                  : selected.has(index)
                    ? "border-primary bg-primary/5"
                    : "border-border bg-muted/50 hover:bg-muted"
              }`}
            >
              <Checkbox
                checked={selected.has(index)}
                onCheckedChange={() => !isBlocked && toggleSelection(index)}
                disabled={isBlocked}
                className="mt-0.5"
              />
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${isBlocked ? "text-muted-foreground line-through" : "text-foreground"}`}>{rec.title}</p>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary">{rec.category}</span>
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                    rec.priority === "high" ? "bg-destructive/10 text-destructive" :
                    rec.priority === "medium" ? "bg-warning/10 text-warning" :
                    "bg-muted-foreground/10 text-muted-foreground"
                  }`}>
                    {rec.priority === "high" ? "Hoch" : rec.priority === "medium" ? "Mittel" : "Niedrig"}
                  </span>
                  {kosten && (
                    <span className="text-[10px] text-muted-foreground">
                      {kosten.kostenMin === 0 && kosten.kostenMax === 0
                        ? "Kostenlos"
                        : kosten.kostenMin === 0
                          ? `bis ${kosten.kostenMax.toLocaleString()}€`
                          : `${kosten.kostenMin.toLocaleString()}–${kosten.kostenMax.toLocaleString()}€`
                      }
                      {kosten.einheit !== "pauschal" && ` (${kosten.einheit})`}
                    </span>
                  )}
                </div>
                {isBlocked && (
                  <p className="text-[10px] text-warning mt-1">
                    ⚠ Bereits enthalten in: {blockedBy}
                  </p>
                )}
              </div>
            </label>
          );
        })}
      </div>

      {/* Simulate button */}
      <Button
        variant="hero"
        className="w-full"
        disabled={selected.size === 0}
        onClick={() => setShowResults(true)}
      >
        <Calculator className="mr-2 h-4 w-4" />
        Jetzt simulieren ({selected.size} {selected.size === 1 ? "Maßnahme" : "Maßnahmen"})
      </Button>

      {/* Results */}
      <AnimatePresence>
        {szenario && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4 }}
            className="overflow-hidden"
          >
            <div className="mt-6 pt-6 border-t border-border">
              <h3 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-success" /> Szenario-Ergebnis
              </h3>

              {/* Overview cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                <div className="text-center p-3 bg-muted rounded-lg">
                  <p className="text-[10px] text-muted-foreground">Investition</p>
                  <p className="text-sm font-bold font-mono text-foreground">
                    {szenario.gesamtkostenMin.toLocaleString()}–{szenario.gesamtkostenMax.toLocaleString()}€
                  </p>
                </div>
                <div className="text-center p-3 bg-success/5 rounded-lg">
                  <p className="text-[10px] text-muted-foreground">Ersparnis/Jahr</p>
                  <p className="text-sm font-bold font-mono text-success">{szenario.kostenersparnisJahr.toLocaleString()}€</p>
                </div>
                <div className="text-center p-3 bg-primary/5 rounded-lg">
                  <p className="text-[10px] text-muted-foreground">Effizienz +</p>
                  <p className="text-sm font-bold font-mono text-primary">{szenario.effizienzgewinnGesamt}%</p>
                </div>
                <div className="text-center p-3 bg-warning/5 rounded-lg">
                  <p className="text-[10px] text-muted-foreground">Neue JAZ</p>
                  <p className="text-sm font-bold font-mono text-warning">{szenario.neueJAZ.toFixed(2)}</p>
                </div>
              </div>

              {/* Cost breakdown chart */}
              {szenario.ausgewaehlteMassnahmen.length > 1 && (
                <div className="mb-6">
                  <p className="text-xs font-semibold text-foreground mb-1">Kostenverteilung (Mittelwert)</p>
                  <p className="text-[10px] text-muted-foreground mb-3">
                    Vergleich der geschätzten Investitionskosten (Mittelwert aus Min/Max) mit der jährlichen Stromkostenersparnis je Maßnahme.
                  </p>
                  <ResponsiveContainer width="100%" height={Math.max(120, szenario.ausgewaehlteMassnahmen.length * 36)}>
                    <BarChart
                      data={szenario.ausgewaehlteMassnahmen.map(m => ({
                        name: m.label.length > 30 ? m.label.substring(0, 28) + "…" : m.label,
                        kosten: Math.round((m.kostenMin + m.kostenMax) / 2),
                        ersparnis: m.kostenersparnisEuro,
                      }))}
                      layout="vertical"
                      margin={{ top: 0, right: 10, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                      <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 9, fill: "hsl(var(--foreground))" }} />
                      <Tooltip
                        contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", fontSize: 12 }}
                        formatter={(v: number, name: string) => [`${v.toLocaleString()}€`, name === "kosten" ? "Investition (einmalig)" : "Ersparnis (pro Jahr)"]}
                      />
                      <Bar dataKey="kosten" fill="hsl(var(--primary))" radius={[0, 3, 3, 0]} barSize={14} name="kosten" />
                      <Bar dataKey="ersparnis" fill="hsl(var(--success))" radius={[0, 3, 3, 0]} barSize={14} name="ersparnis" />
                    </BarChart>
                  </ResponsiveContainer>
                  {/* Legende */}
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-1.5">
                      <span className="inline-block w-3 h-3 rounded-sm bg-primary" />
                      <span className="text-[10px] text-muted-foreground">Investition (einmalig)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="inline-block w-3 h-3 rounded-sm bg-success" />
                      <span className="text-[10px] text-muted-foreground">Ersparnis (pro Jahr)</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Detail table */}
              <Collapsible>
                <CollapsibleTrigger className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors mb-2 group">
                  <span className="text-xs font-semibold text-foreground">Detailaufstellung</span>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="space-y-2 mb-4">
                    {szenario.ausgewaehlteMassnahmen.map((m, i) => (
                      <div key={i} className="p-3 bg-muted rounded-lg">
                        <p className="text-xs font-medium text-foreground">{m.label}</p>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-[10px] text-muted-foreground">
                          <span>💰 {m.kostenMin.toLocaleString()}–{m.kostenMax.toLocaleString()}€ ({m.einheit})</span>
                          <span>⚡ −{m.stromersparnisKwh.toLocaleString()} kWh/a</span>
                          <span>💶 −{m.kostenersparnisEuro.toLocaleString()}€/a</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Amortization */}
              <div className="bg-gradient-to-r from-success/10 to-primary/10 rounded-xl p-5 mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="h-4 w-4 text-success" />
                  <h4 className="text-sm font-semibold text-foreground">Amortisationsrechnung</h4>
                </div>
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div className="text-center">
                    <p className="text-[10px] text-muted-foreground">Investition (Mittel)</p>
                    <p className="text-lg font-bold font-mono text-foreground">{szenario.gesamtkostenMittel.toLocaleString()}€</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-muted-foreground">Ersparnis/Jahr</p>
                    <p className="text-lg font-bold font-mono text-success">{szenario.kostenersparnisJahr.toLocaleString()}€</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-muted-foreground">Amortisation</p>
                    <p className="text-lg font-bold font-mono text-primary">
                      {szenario.amortisationJahre > 0 ? `~${szenario.amortisationJahre} Jahre` : "sofort"}
                    </p>
                  </div>
                </div>

                {/* Amortisation visual */}
                {szenario.amortisationJahre > 0 && szenario.amortisationJahre <= 30 && (
                  <div className="mb-3">
                    <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                      <span>0 Jahre</span>
                      <span>{Math.min(Math.ceil(szenario.amortisationJahre * 1.5), 30)} Jahre</span>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden relative">
                      <motion.div
                        className="h-full bg-gradient-to-r from-destructive via-warning to-success rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, (szenario.amortisationJahre / Math.min(Math.ceil(szenario.amortisationJahre * 1.5), 30)) * 100)}%` }}
                        transition={{ duration: 1, delay: 0.3 }}
                      />
                      <div
                        className="absolute top-0 h-full w-0.5 bg-foreground"
                        style={{ left: `${Math.min(100, (szenario.amortisationJahre / Math.min(Math.ceil(szenario.amortisationJahre * 1.5), 30)) * 100)}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-center text-muted-foreground mt-1">
                      Ab Jahr {Math.ceil(szenario.amortisationJahre)} sparen Sie netto {szenario.kostenersparnisJahr.toLocaleString()}€/Jahr
                    </p>
                  </div>
                )}

                <div className="flex items-start gap-2 p-3 bg-card/60 rounded-lg">
                  <Info className="h-3.5 w-3.5 text-primary flex-shrink-0 mt-0.5" />
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    Durch Fördermittel kann sich diese Summe weiter verringern. Möglichkeiten dazu werden nachfolgend aufgezeigt.
                  </p>
                </div>
                <div className="flex items-start gap-2 p-3 bg-warning/5 border border-warning/20 rounded-lg mt-2">
                  <Info className="h-3.5 w-3.5 text-warning flex-shrink-0 mt-0.5" />
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    Die Berechnung der Kosten ist als Richtpreis anzusehen und soll Ihnen ein ungefähres Budget aufzeigen. Fragen Sie beim Handwerker Ihres Vertrauens ein Angebot an.
                  </p>
                </div>
              </div>

              {/* Fördermöglichkeiten for selected measures */}
              {alleFoerderungen.length > 0 && (
                <div className="mt-4">
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-success/10">
                      <Award className="h-4 w-4 text-success" />
                    </div>
                    <h4 className="text-sm font-semibold text-foreground">Fördermöglichkeiten für Ihre Auswahl</h4>
                  </div>

                  {/* Bundesförderungen */}
                  {relevantesBundesFoerderungen.length > 0 && (
                    <div className="mb-3">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Bundesförderung</p>
                      <div className="space-y-2">
                        {relevantesBundesFoerderungen.map((f, i) => (
                          <div key={`bund-${i}`} className="p-3 bg-muted rounded-lg flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-foreground">{f.massnahme}</p>
                              <p className="text-[10px] text-muted-foreground">
                                {f.programm} · {f.foerderquote}% Zuschuss{f.isfpBonus ? " (+5% iSFP-Bonus)" : ""}
                                {f.maxBetrag ? ` · max. ${f.maxBetrag.toLocaleString()}€` : ""}
                              </p>
                              <p className="text-[10px] text-muted-foreground mt-0.5">{f.hinweis}</p>
                            </div>
                            <a href={f.link} target="_blank" rel="noopener noreferrer" className="flex-shrink-0">
                              <Button variant="outline" size="sm" className="text-[10px] h-7 px-2">
                                <ExternalLink className="h-2.5 w-2.5 mr-1" /> Info
                              </Button>
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Regionale Förderungen */}
                  {regionaleFoerderungen.length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                        Regionale Förderung (PLZ {plz})
                      </p>
                      <div className="space-y-2">
                        {regionaleFoerderungen.map((f, i) => (
                          <div key={`reg-${i}`} className="p-3 bg-success/5 border border-success/10 rounded-lg flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-foreground">{f.massnahme}</p>
                              <p className="text-[10px] text-muted-foreground">
                                {f.programm}
                                {f.foerderquote > 0 ? ` · ${f.foerderquote}% Zuschuss` : ""}
                                {f.maxBetrag ? ` · max. ${f.maxBetrag.toLocaleString()}€` : ""}
                              </p>
                              <p className="text-[10px] text-muted-foreground mt-0.5">{f.hinweis}</p>
                            </div>
                            <a href={f.link} target="_blank" rel="noopener noreferrer" className="flex-shrink-0">
                              <Button variant="outline" size="sm" className="text-[10px] h-7 px-2">
                                <ExternalLink className="h-2.5 w-2.5 mr-1" /> Info
                              </Button>
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <p className="text-[10px] text-muted-foreground mt-3 italic">
                    Angaben ohne Gewähr. Förderkonditionen vor Antragstellung prüfen. Antrag immer vor Maßnahmenbeginn stellen.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ScenarioSimulator;
