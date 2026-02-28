import { motion } from "framer-motion";
import { CheckCircle, AlertTriangle, ArrowRight, RotateCcw, Download, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

interface ResultData {
  score: number;
  deviation: number;
  simulatedConsumption: number;
  actualConsumption: number;
  isAdvanced: boolean;
  recommendations: { category: string; title: string; impact: string }[];
}

const generateMockResults = (data: Record<string, unknown>): ResultData => {
  const flaeche = Number(data.beheizteFlaeche) || 150;
  const personen = Number(data.personenAnzahl) || 3;
  const actualVerbrauch = Number(data.gesamtverbrauch) || 0;
  const isAdvanced = Boolean(data.isAdvanced);

  let baseConsumption = flaeche * 28;
  const personFactor = 1 + (personen - 2) * 0.05;
  baseConsumption = baseConsumption * personFactor;

  // Advanced adjustments
  if (isAdvanced) {
    const vorlauf = Number(data.vorlauftemperatur) || 42;
    if (vorlauf > 45) baseConsumption *= 1.12;
    else if (vorlauf <= 35) baseConsumption *= 0.92;

    const duschen = Number(data.duschenProTag) || 2;
    baseConsumption += duschen * 350;

    const raumtemp = Number(data.raumtemperatur) || 21;
    baseConsumption *= 1 + (raumtemp - 21) * 0.06;

    if (data.automatischeRaumregler === "ja") baseConsumption *= 0.95;
    if (data.wpHeizkoerper === "ja") baseConsumption *= 0.93;
  }

  const simulatedConsumption = Math.round(baseConsumption);
  const actual = actualVerbrauch || simulatedConsumption * (1 + (Math.random() * 0.4 - 0.1));
  const deviation = actual > 0 ? Math.round(((actual - simulatedConsumption) / simulatedConsumption) * 100) : 0;
  const score = Math.max(0, Math.min(100, 100 - Math.abs(deviation) * 2));

  const recommendations: { category: string; title: string; impact: string }[] = [];

  if (isAdvanced) {
    const vorlauf = Number(data.vorlauftemperatur) || 42;
    if (vorlauf > 45) {
      recommendations.push({ category: "Einstellungen", title: "Vorlauftemperatur auf max. 42°C senken", impact: "Bis zu 12% Einsparung möglich" });
    }
    if (data.automatischeRaumregler === "nein") {
      recommendations.push({ category: "Investition", title: "Smarte Thermostate nachrüsten", impact: "5% Effizienzgewinn durch raumweise Regelung" });
    }
    const raumtemp = Number(data.raumtemperatur) || 21;
    if (raumtemp > 21) {
      recommendations.push({ category: "Verhalten", title: `Raumtemperatur von ${raumtemp}°C auf 21°C senken`, impact: `Ca. ${Math.round((raumtemp - 21) * 6)}% Einsparung` });
    }
    const duschen = Number(data.duschenProTag) || 2;
    if (duschen > 3) {
      recommendations.push({ category: "Warmwasser", title: "Warmwasserbedarf optimieren", impact: "Hoher WW-Verbrauch erhöht Stromkosten deutlich" });
    }
    if (data.wpHeizkoerper === "nein") {
      recommendations.push({ category: "Investition", title: "Wärmepumpenheizkörper in Betracht ziehen", impact: "Bis zu 7% Effizienzsteigerung" });
    }
  } else {
    recommendations.push(
      { category: "Einstellungen", title: "Vorlauftemperatur senken", impact: "Bis zu 10% Einsparung" },
      { category: "Wartung", title: "Regelmäßige Filterkontrolle", impact: "3-5% Effizienzgewinn" },
      { category: "Verhalten", title: "Nachtabsenkung optimieren", impact: "5-8% Einsparung" },
    );
  }

  if (data.hydraulischerAbgleich === "nein") {
    recommendations.unshift({ category: "Empfehlung", title: "Hydraulischen Abgleich durchführen lassen", impact: "Bis zu 15% Effizienzsteigerung" });
  }

  if (Math.abs(deviation) > 25) {
    recommendations.push({ category: "Fachplaner", title: "Fachplaner hinzuziehen", impact: "Professionelle Analyse empfohlen" });
  }

  return { score, deviation, simulatedConsumption, actualConsumption: Math.round(actual), isAdvanced, recommendations };
};

const ResultsPage = () => {
  const navigate = useNavigate();
  const [result, setResult] = useState<ResultData | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("wp-check-data");
    if (!stored) { navigate("/efficiency-check"); return; }
    setResult(generateMockResults(JSON.parse(stored)));
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
          </div>

          {/* Comparison */}
          <div className="bg-card rounded-xl shadow-card border border-border p-6 mb-8">
            <h2 className="text-lg font-semibold text-card-foreground mb-4">Verbrauchsvergleich</h2>
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
                  <span className="text-xs font-semibold px-2 py-1 rounded bg-primary/10 text-primary whitespace-nowrap">
                    {rec.category}
                  </span>
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
            Hinweis: Diese Ergebnisse basieren auf einer vereinfachten Simulation und ersetzen keine professionelle Beratung durch einen Fachplaner.
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
