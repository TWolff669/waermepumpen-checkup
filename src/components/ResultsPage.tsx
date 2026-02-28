import { motion } from "framer-motion";
import { CheckCircle, AlertTriangle, ArrowRight, RotateCcw, Download, Settings2, Thermometer, Droplets, Zap, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { runSimulation, type SimulationResult, type SimulationInput } from "@/lib/simulation";

const ResultsPage = () => {
  const navigate = useNavigate();
  const [result, setResult] = useState<SimulationResult | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("wp-check-data");
    if (!stored) { navigate("/efficiency-check"); return; }
    const data = JSON.parse(stored) as SimulationInput;
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

          {/* Technical Details */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            {[
              { icon: Zap, label: "JAZ Heizung", value: (result.jaz ?? 0).toFixed(2), unit: "" },
              { icon: Droplets, label: "JAZ Warmwasser", value: (result.jazWarmwasser ?? 0).toFixed(2), unit: "" },
              { icon: Thermometer, label: "Vorlauftemp.", value: `${result.vorlauftemperatur ?? 0}`, unit: "°C" },
              { icon: Home, label: "Heizwärmebedarf", value: `${result.specificHeatDemand ?? 0}`, unit: "kWh/m²" },
            ].map((item) => (
              <div key={item.label} className="bg-card rounded-lg border border-border p-4 text-center shadow-card">
                <item.icon className="h-4 w-4 text-primary mx-auto mb-1.5" />
                <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
                <p className="text-lg font-bold font-mono text-foreground">
                  {item.value}<span className="text-xs text-muted-foreground ml-0.5">{item.unit}</span>
                </p>
              </div>
            ))}
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
            <div className="mt-4 text-center">
              <span className={`text-sm font-medium ${result.deviation > 0 ? "text-destructive" : "text-success"}`}>
                {result.deviation > 0 ? "+" : ""}{result.deviation}% Abweichung
              </span>
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
                  className="flex items-start gap-3 p-4 bg-muted rounded-lg"
                >
                  <div className="flex flex-col items-center gap-1">
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
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{rec.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{rec.impact}</p>
                  </div>
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
            <Button variant="hero" onClick={() => window.print()}>
              <Download className="mr-1 h-4 w-4" /> Ergebnis speichern
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ResultsPage;
