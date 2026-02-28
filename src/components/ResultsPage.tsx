import { motion } from "framer-motion";
import { CheckCircle, AlertTriangle, ArrowRight, RotateCcw, Download, Settings2, Thermometer, Droplets, Zap, Home, ChevronDown, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { runSimulation, type SimulationResult, type SimulationInput } from "@/lib/simulation";
import { exportResultsPDF } from "@/lib/pdf-export";
import InfoTooltip from "@/components/InfoTooltip";

const ResultsPage = () => {
  const navigate = useNavigate();
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [inputData, setInputData] = useState<SimulationInput | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("wp-check-data");
    if (!stored) { navigate("/efficiency-check"); return; }
    const data = JSON.parse(stored) as SimulationInput;
    setInputData(data);
    setResult(runSimulation(data));
  }, [navigate]);

  if (!result) return null;

  const isGood = result.score >= 70;
  const isOk = result.score >= 40 && result.score < 70;

  return (
    <div className="min-h-screen gradient-subtle py-10">
      <div className="container max-w-2xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          {/* Badge */}
          {result.isAdvanced && (
            <div className="mb-4 text-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                <Settings2 className="h-3 w-3" /> Erweiterter Check
              </span>
            </div>
          )}

          {/* Score Card */}
          <div className="bg-card rounded-xl shadow-elevated border border-border p-8 mb-8 text-center">
            <h1 className="text-2xl font-bold text-card-foreground mb-6">Ihr Effizienz-Ergebnis</h1>
            <div className="relative inline-flex items-center justify-center mb-6">
              <svg className="w-40 h-40" viewBox="0 0 160 160">
                <circle cx="80" cy="80" r="70" fill="none" stroke="hsl(var(--muted))" strokeWidth="12" />
                <motion.circle
                  cx="80" cy="80" r="70" fill="none"
                  stroke={isGood ? "hsl(var(--success))" : isOk ? "hsl(var(--warning))" : "hsl(var(--destructive))"}
                  strokeWidth="12" strokeLinecap="round" strokeDasharray={440}
                  initial={{ strokeDashoffset: 440 }}
                  animate={{ strokeDashoffset: 440 - (440 * result.score) / 100 }}
                  transition={{ duration: 1, delay: 0.3 }}
                  transform="rotate(-90 80 80)"
                />
              </svg>
              <div className="absolute">
                <span className="text-4xl font-bold font-mono text-foreground">{result.score}</span>
                <span className="text-lg text-muted-foreground">/100</span>
              </div>
            </div>
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
              isGood ? "bg-success/10 text-success" : isOk ? "bg-warning/10 text-warning" : "bg-destructive/10 text-destructive"
            }`}>
              {isGood ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
              {isGood ? "Gute Effizienz" : isOk ? "Verbesserungspotenzial" : "Deutliches Verbesserungspotenzial"}
            </div>
            <p className="text-xs text-muted-foreground mt-3">Klimaregion: {result.climateRegion}</p>
          </div>

          {/* Technical Details with Gauge Bars */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {(() => {
              const jaz = result.jaz ?? 0;
              const jazWW = result.jazWarmwasser ?? 0;
              const vorlauf = result.vorlauftemperatur ?? 0;
              const spezBedarf = result.specificHeatDemand ?? 0;

              const metrics = [
                {
                  icon: Zap,
                  label: "JAZ Heizung",
                  value: jaz.toFixed(2),
                  unit: "",
                  // Reference: 2.5 = schlecht, 3.5 = okay, 4.5+ = sehr gut
                  percent: Math.min(100, Math.max(0, ((jaz - 2.0) / (5.0 - 2.0)) * 100)),
                  color: jaz >= 4.0 ? "bg-success" : jaz >= 3.0 ? "bg-warning" : "bg-destructive",
                  rating: jaz >= 4.0 ? "Sehr gut" : jaz >= 3.5 ? "Gut" : jaz >= 3.0 ? "Befriedigend" : "Verbesserungsbedürftig",
                  reference: "Zielwert ≥ 3,5 · Optimal ≥ 4,0",
                },
                {
                  icon: Droplets,
                  label: "JAZ Warmwasser",
                  value: jazWW.toFixed(2),
                  unit: "",
                  percent: Math.min(100, Math.max(0, ((jazWW - 1.5) / (3.5 - 1.5)) * 100)),
                  color: jazWW >= 3.0 ? "bg-success" : jazWW >= 2.5 ? "bg-warning" : "bg-destructive",
                  rating: jazWW >= 3.0 ? "Sehr gut" : jazWW >= 2.5 ? "Gut" : jazWW >= 2.0 ? "Befriedigend" : "Niedrig",
                  reference: "Zielwert ≥ 2,5 · Optimal ≥ 3,0",
                },
                {
                  icon: Thermometer,
                  label: "Vorlauftemperatur",
                  value: `${vorlauf}`,
                  unit: "°C",
                  // Lower is better: 30°C = 100%, 60°C = 0%
                  percent: Math.min(100, Math.max(0, ((60 - vorlauf) / (60 - 30)) * 100)),
                  color: vorlauf <= 35 ? "bg-success" : vorlauf <= 45 ? "bg-warning" : "bg-destructive",
                  rating: vorlauf <= 35 ? "Optimal" : vorlauf <= 42 ? "Gut" : vorlauf <= 50 ? "Erhöht" : "Zu hoch",
                  reference: "Fußboden ≤ 35°C · WP-HK ≤ 42°C · Bestand ≤ 55°C",
                },
                {
                  icon: Home,
                  label: "Heizwärmebedarf",
                  value: `${spezBedarf}`,
                  unit: "kWh/m²",
                  // Lower is better: 30 = 100%, 160 = 0%
                  percent: Math.min(100, Math.max(0, ((160 - spezBedarf) / (160 - 30)) * 100)),
                  color: spezBedarf <= 50 ? "bg-success" : spezBedarf <= 100 ? "bg-warning" : "bg-destructive",
                  rating: spezBedarf <= 50 ? "Effizient (Neubau)" : spezBedarf <= 80 ? "Gut saniert" : spezBedarf <= 120 ? "Teilsaniert" : "Unsaniert",
                  reference: "Neubau ≤ 50 · Saniert ≤ 80 · Altbau 100-150",
                },
              ];

              return metrics.map((m) => (
                <div key={m.label} className="bg-card rounded-xl border border-border p-5 shadow-card">
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                      <m.icon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground"><InfoTooltip term={m.label}>{m.label}</InfoTooltip></p>
                      <p className="text-xl font-bold font-mono text-foreground leading-tight">
                        {m.value}<span className="text-sm text-muted-foreground ml-0.5">{m.unit}</span>
                      </p>
                    </div>
                    <span className={`ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      m.color === "bg-success" ? "bg-success/10 text-success" :
                      m.color === "bg-warning" ? "bg-warning/10 text-warning" :
                      "bg-destructive/10 text-destructive"
                    }`}>
                      {m.rating}
                    </span>
                  </div>
                  {/* Gauge bar */}
                  <div className="h-2 bg-muted rounded-full overflow-hidden mb-2">
                    <motion.div
                      className={`h-full rounded-full ${m.color}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${m.percent}%` }}
                      transition={{ duration: 0.8, delay: 0.3 }}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground">{m.reference}</p>
                </div>
              ));
            })()}
          </div>

          {/* Energy Breakdown */}
          <div className="bg-card rounded-xl shadow-card border border-border p-6 mb-8">
            <h2 className="text-lg font-semibold text-card-foreground mb-4">Energiebilanz</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Heizwärmebedarf</span>
                  <span className="font-mono font-medium text-foreground">{result.heatingDemand.toLocaleString()} kWh</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${(result.heatingDemand / (result.heatingDemand + result.hotWaterDemand)) * 100}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Warmwasserbedarf</span>
                  <span className="font-mono font-medium text-foreground">{result.hotWaterDemand.toLocaleString()} kWh</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent rounded-full"
                    style={{ width: `${(result.hotWaterDemand / (result.heatingDemand + result.hotWaterDemand)) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Consumption Comparison */}
          <div className="bg-card rounded-xl shadow-card border border-border p-6 mb-8">
            <h2 className="text-lg font-semibold text-card-foreground mb-4">Stromverbrauch WP</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-muted rounded-lg text-center">
                <p className="text-sm text-muted-foreground mb-1">Simuliert (Optimum)</p>
                <p className="text-2xl font-bold font-mono text-foreground">{result.simulatedConsumption.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">kWh/Jahr</p>
              </div>
              <div className="p-4 bg-muted rounded-lg text-center">
                <p className="text-sm text-muted-foreground mb-1">Tatsächlich</p>
                <p className="text-2xl font-bold font-mono text-foreground">{result.actualConsumption.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">kWh/Jahr</p>
              </div>
            </div>
            <div className="mt-4 text-center space-y-1">
              <span className={`text-sm font-medium ${result.deviation > 0 ? "text-destructive" : "text-success"}`}>
                {result.deviation > 0 ? "+" : ""}{result.deviation}% Abweichung
              </span>
              {result.isPartialPeriod && (
                <p className="text-[10px] text-muted-foreground">
                  ⚠ Verbrauchsdaten aus {result.measurementDays} Tagen auf 12 Monate hochgerechnet (HGT-gewichtet)
                </p>
              )}
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-card rounded-xl shadow-card border border-border p-6 mb-8">
            <h2 className="text-lg font-semibold text-card-foreground mb-4">Empfehlungen</h2>
            <div className="space-y-3">
              {result.recommendations.map((rec, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  className="bg-muted rounded-lg overflow-hidden"
                >
                  <Collapsible>
                    <CollapsibleTrigger className="w-full text-left p-4 flex items-start gap-3 hover:bg-muted/80 transition-colors group">
                      <div className="flex flex-col items-center gap-1 flex-shrink-0">
                        <span className="text-xs font-semibold px-2 py-1 rounded bg-primary/10 text-primary whitespace-nowrap">
                          {rec.category}
                        </span>
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                          rec.priority === "high" ? "bg-destructive/10 text-destructive" :
                          rec.priority === "medium" ? "bg-warning/10 text-warning" :
                          "bg-muted-foreground/10 text-muted-foreground"
                        }`}>
                          {rec.priority === "high" ? "Hoch" : rec.priority === "medium" ? "Mittel" : "Niedrig"}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{rec.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{rec.impact}</p>
                      </div>
                      {(rec.context || (rec.prerequisites && rec.prerequisites.length > 0)) && (
                        <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5 transition-transform group-data-[state=open]:rotate-180" />
                      )}
                    </CollapsibleTrigger>
                    {(rec.context || (rec.prerequisites && rec.prerequisites.length > 0)) && (
                      <CollapsibleContent>
                        <div className="px-4 pb-4 pt-0 border-t border-border/50 mt-0">
                          {rec.context && (
                            <p className="text-xs text-muted-foreground mt-3 leading-relaxed whitespace-pre-line">
                              {rec.context}
                            </p>
                          )}
                          {rec.prerequisites && rec.prerequisites.length > 0 && (
                            <div className="mt-3">
                              <div className="flex items-center gap-1.5 mb-2">
                                <ListChecks className="h-3.5 w-3.5 text-primary" />
                                <p className="text-xs font-semibold text-foreground">Voraussetzungen / nächste Schritte:</p>
                              </div>
                              <ol className="space-y-1.5 ml-5">
                                {rec.prerequisites.map((step, j) => (
                                  <li key={j} className="text-xs text-muted-foreground list-decimal leading-relaxed">
                                    {step}
                                  </li>
                                ))}
                              </ol>
                            </div>
                          )}
                        </div>
                      </CollapsibleContent>
                    )}
                  </Collapsible>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Disclaimer */}
          <p className="text-xs text-muted-foreground text-center mb-6">
            Hinweis: Diese Ergebnisse basieren auf einer vereinfachten Simulation nach VDI 4650 / DIN V 18599 und ersetzen keine professionelle Beratung durch einen Energieberater oder Fachplaner.
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="outline" asChild>
              <Link to="/efficiency-check"><RotateCcw className="mr-1 h-4 w-4" /> Neuen Check starten</Link>
            </Button>
            {!result.isAdvanced && Math.abs(result.deviation) > 10 && (
              <Button variant="default" asChild>
                <Link to="/advanced-check"><Settings2 className="mr-1 h-4 w-4" /> Check verfeinern</Link>
              </Button>
            )}
            <Button variant="hero" onClick={() => exportResultsPDF(result, inputData ?? undefined)}>
              <Download className="mr-1 h-4 w-4" /> Als PDF herunterladen
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ResultsPage;
