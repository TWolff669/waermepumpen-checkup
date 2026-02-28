import { motion } from "framer-motion";
import { CheckCircle, AlertTriangle, ArrowRight, RotateCcw, Download, Settings2, Thermometer, Droplets, Zap, Home, ChevronDown, ListChecks, Save, Info, Sun, Euro, Award, ExternalLink } from "lucide-react";
import ScenarioSimulator from "@/components/ScenarioSimulator";
import { Button } from "@/components/ui/button";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { runSimulation, type SimulationResult, type SimulationInput } from "@/lib/simulation";
import { exportResultsPDF } from "@/lib/pdf-export";
import InfoTooltip from "@/components/InfoTooltip";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useAuth } from "@/hooks/useAuth";
import SaveProjectDialog from "@/components/SaveProjectDialog";
import { supabase } from "@/integrations/supabase/client";

const ResultsPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [inputData, setInputData] = useState<SimulationInput | null>(null);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [historicBanner, setHistoricBanner] = useState<{ date: string; period: string; projectId: string } | null>(null);
  const [linkedProjectId, setLinkedProjectId] = useState<string | null>(null);
  const [linkedProjectName, setLinkedProjectName] = useState<string | null>(null);

  useEffect(() => {
    const checkId = searchParams.get("check");
    if (checkId) {
      // Load from checks table
      supabase.from("checks").select("input_data, result_data, check_date, heating_period, project_id").eq("id", checkId).single().then(({ data }) => {
        if (data) {
          setInputData(data.input_data as any);
          setResult(data.result_data as any);
          setHistoricBanner({ date: new Date(data.check_date).toLocaleDateString("de-DE"), period: data.heating_period || "", projectId: data.project_id });
        }
      });
      return;
    }

    const storedResult = sessionStorage.getItem("wp-check-result");
    const stored = sessionStorage.getItem("wp-check-data");
    const storedProjectId = sessionStorage.getItem("wp-check-project-id");
    const storedProjectName = sessionStorage.getItem("wp-check-project-name");

    if (storedProjectId) {
      setLinkedProjectId(storedProjectId);
      setLinkedProjectName(storedProjectName);
      sessionStorage.removeItem("wp-check-project-id");
      sessionStorage.removeItem("wp-check-project-name");
    }

    if (storedResult && stored) {
      setInputData(JSON.parse(stored) as SimulationInput);
      setResult(JSON.parse(storedResult) as SimulationResult);
      sessionStorage.removeItem("wp-check-result");
      return;
    }

    if (!stored) { navigate("/efficiency-check"); return; }
    const data = JSON.parse(stored) as SimulationInput;
    setInputData(data);
    setResult(runSimulation(data));
  }, [navigate, searchParams]);

  if (!result) return null;

  const hasComparison = result.score !== -1;
  const isGood = hasComparison && result.score >= 70;
  const isOk = hasComparison && result.score >= 40 && result.score < 70;

  return (
    <div className="min-h-screen gradient-subtle py-10">
      <div className="container max-w-2xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>

          {/* Historic banner */}
          {historicBanner && (
            <div className="mb-4 p-3 bg-info/10 border border-info/20 rounded-lg flex items-center justify-between">
              <p className="text-sm text-foreground">
                <strong>Historischer Check</strong> vom {historicBanner.date}{historicBanner.period && ` – Heizperiode ${historicBanner.period}`}
              </p>
              <Button variant="outline" size="sm" onClick={() => navigate(`/projekt/${historicBanner.projectId}/verlauf`)}>
                Zurück zum Verlauf
              </Button>
            </div>
          )}

          {/* Badge */}
          {result.isAdvanced && (
            <div className="mb-4 text-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                <Settings2 className="h-3 w-3" /> Erweiterter Check
              </span>
            </div>
          )}

          {/* Score Card or No-Comparison Info */}
          {hasComparison ? (
            <div className="bg-card rounded-xl shadow-elevated border border-border p-8 mb-8 text-center">
              <h1 className="text-2xl font-bold text-card-foreground mb-6">Ihr Effizienz-Ergebnis</h1>
              <div className="relative inline-flex items-center justify-center mb-6">
                <svg className="w-40 h-40" viewBox="0 0 160 160">
                  <circle cx="80" cy="80" r="70" fill="none" stroke="hsl(var(--muted))" strokeWidth="12" />
                  <motion.circle cx="80" cy="80" r="70" fill="none"
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
          ) : (
            <div className="bg-info/10 border border-info/20 rounded-xl p-6 mb-8">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-info flex-shrink-0 mt-0.5" />
                <div>
                  <h2 className="text-lg font-semibold text-foreground mb-2">Kein Verbrauchsvergleich möglich</h2>
                  <p className="text-sm text-muted-foreground mb-4">Geben Sie Ihre tatsächlichen Verbrauchsdaten ein, um Ihre WP-Effizienz bewerten zu können.</p>
                  <Button variant="default" size="sm" onClick={() => navigate("/efficiency-check")}>
                    Verbrauchsdaten nachtragen <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">Klimaregion: {result.climateRegion}</p>
            </div>
          )}

          {/* Kostenanalyse Card */}
          {result.kostenAnalyse && (
            <div className="bg-card rounded-xl shadow-elevated border border-border p-6 mb-8">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10">
                  <Euro className="h-4 w-4 text-accent-foreground" />
                </div>
                <h2 className="text-lg font-semibold text-card-foreground">Ihr Einsparpotenzial</h2>
              </div>
              {hasComparison && result.kostenAnalyse.einsparpotenzialJahr > 0 ? (
                <>
                  <div className="text-center mb-4">
                    <span className="text-3xl font-bold font-mono text-success">{result.kostenAnalyse.einsparpotenzialJahr}€</span>
                    <span className="text-muted-foreground text-sm">/Jahr Einsparpotenzial</span>
                    <p className="text-xs text-muted-foreground mt-1">Auf 5 Jahre: {result.kostenAnalyse.einsparpotenzial5Jahre}€</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-3 bg-destructive/5 rounded-lg">
                      <p className="text-xs text-muted-foreground">Aktuelle Kosten</p>
                      <p className="text-lg font-bold font-mono text-foreground">{result.kostenAnalyse.istKostenJahr}€<span className="text-xs text-muted-foreground">/Jahr</span></p>
                    </div>
                    <div className="text-center p-3 bg-success/5 rounded-lg">
                      <p className="text-xs text-muted-foreground">Optimum</p>
                      <p className="text-lg font-bold font-mono text-foreground">{result.kostenAnalyse.sollKostenJahr}€<span className="text-xs text-muted-foreground">/Jahr</span></p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Geschätzte Stromkosten bei optimaler Einstellung:</p>
                  <span className="text-2xl font-bold font-mono text-foreground">{result.kostenAnalyse.sollKostenJahr}€<span className="text-sm text-muted-foreground">/Jahr</span></span>
                  <p className="text-xs text-muted-foreground mt-2">Geben Sie Ihren tatsächlichen Verbrauch ein, um Ihr persönliches Einsparpotenzial zu sehen.</p>
                </div>
              )}
              <p className="text-[10px] text-muted-foreground mt-3 text-center">Strompreis: {result.kostenAnalyse.strompreis} ct/kWh</p>
            </div>
          )}

          {/* Technical Details with Gauge Bars */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {(() => {
              const jaz = result.jaz ?? 0;
              const jazWW = result.jazWarmwasser ?? 0;
              const vorlauf = result.vorlauftemperatur ?? 0;
              const spezBedarf = result.specificHeatDemand ?? 0;
              const metrics = [
                { icon: Zap, label: "JAZ Heizung", value: jaz.toFixed(2), unit: "", percent: Math.min(100, Math.max(0, ((jaz - 2.0) / (5.0 - 2.0)) * 100)), color: jaz >= 4.0 ? "bg-success" : jaz >= 3.0 ? "bg-warning" : "bg-destructive", rating: jaz >= 4.0 ? "Sehr gut" : jaz >= 3.5 ? "Gut" : jaz >= 3.0 ? "Befriedigend" : "Verbesserungsbedürftig", reference: "Zielwert ≥ 3,5 · Optimal ≥ 4,0" },
                { icon: Droplets, label: "JAZ Warmwasser", value: jazWW.toFixed(2), unit: "", percent: Math.min(100, Math.max(0, ((jazWW - 1.5) / (3.5 - 1.5)) * 100)), color: jazWW >= 3.0 ? "bg-success" : jazWW >= 2.5 ? "bg-warning" : "bg-destructive", rating: jazWW >= 3.0 ? "Sehr gut" : jazWW >= 2.5 ? "Gut" : jazWW >= 2.0 ? "Befriedigend" : "Niedrig", reference: "Zielwert ≥ 2,5 · Optimal ≥ 3,0" },
                { icon: Thermometer, label: "Vorlauftemperatur", value: `${vorlauf}`, unit: "°C", percent: Math.min(100, Math.max(0, ((60 - vorlauf) / (60 - 30)) * 100)), color: vorlauf <= 35 ? "bg-success" : vorlauf <= 45 ? "bg-warning" : "bg-destructive", rating: vorlauf <= 35 ? "Optimal" : vorlauf <= 42 ? "Gut" : vorlauf <= 50 ? "Erhöht" : "Zu hoch", reference: "Fußboden ≤ 35°C · WP-HK ≤ 42°C · Bestand ≤ 55°C" },
                { icon: Home, label: "Heizwärmebedarf", value: `${spezBedarf}`, unit: "kWh/m²", percent: Math.min(100, Math.max(0, ((160 - spezBedarf) / (160 - 30)) * 100)), color: spezBedarf <= 50 ? "bg-success" : spezBedarf <= 100 ? "bg-warning" : "bg-destructive", rating: spezBedarf <= 50 ? "Effizient (Neubau)" : spezBedarf <= 80 ? "Gut saniert" : spezBedarf <= 120 ? "Teilsaniert" : "Unsaniert", reference: "Neubau ≤ 50 · Saniert ≤ 80 · Altbau 100-150" },
              ];
              return metrics.map((m) => (
                <div key={m.label} className="bg-card rounded-xl border border-border p-5 shadow-card">
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10"><m.icon className="h-4 w-4 text-primary" /></div>
                    <div>
                      <p className="text-xs text-muted-foreground"><InfoTooltip term={m.label}>{m.label}</InfoTooltip></p>
                      <p className="text-xl font-bold font-mono text-foreground leading-tight">{m.value}<span className="text-sm text-muted-foreground ml-0.5">{m.unit}</span></p>
                    </div>
                    <span className={`ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full ${m.color === "bg-success" ? "bg-success/10 text-success" : m.color === "bg-warning" ? "bg-warning/10 text-warning" : "bg-destructive/10 text-destructive"}`}>{m.rating}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden mb-2">
                    <motion.div className={`h-full rounded-full ${m.color}`} initial={{ width: 0 }} animate={{ width: `${m.percent}%` }} transition={{ duration: 0.8, delay: 0.3 }} />
                  </div>
                  <p className="text-[10px] text-muted-foreground">{m.reference}</p>
                </div>
              ));
            })()}
          </div>

          {/* Heizstab-Analyse Card */}
          {result.heizstabAnalyse && (
            <div className="bg-card rounded-xl shadow-card border border-border p-6 mb-8">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-destructive/10"><Zap className="h-4 w-4 text-destructive" /></div>
                <h2 className="text-lg font-semibold text-card-foreground"><InfoTooltip term="Heizstab">Heizstab-Analyse</InfoTooltip></h2>
                <span className={`ml-auto text-xs font-semibold px-2.5 py-1 rounded-full ${
                  result.heizstabAnalyse.bewertung === 'gut' ? 'bg-success/10 text-success' :
                  result.heizstabAnalyse.bewertung === 'auffaellig' ? 'bg-warning/10 text-warning' :
                  'bg-destructive/10 text-destructive'
                }`}>
                  {result.heizstabAnalyse.bewertung === 'gut' ? 'Gut' : result.heizstabAnalyse.bewertung === 'auffaellig' ? 'Auffällig' : 'Kritisch'}
                </span>
              </div>
              {/* Status bar */}
              <div className="h-2 bg-muted rounded-full overflow-hidden mb-4">
                <motion.div
                  className={`h-full rounded-full ${result.heizstabAnalyse.bewertung === 'gut' ? 'bg-success' : result.heizstabAnalyse.bewertung === 'auffaellig' ? 'bg-warning' : 'bg-destructive'}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, result.heizstabAnalyse.anteilAmGesamtverbrauch * 3)}%` }}
                  transition={{ duration: 0.8 }}
                />
              </div>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="text-center p-2 bg-muted rounded-lg">
                  <p className="text-[10px] text-muted-foreground">Heizstab-Verbrauch</p>
                  <p className="text-sm font-bold font-mono text-foreground">{result.heizstabAnalyse.stromverbrauchHeizstab.toLocaleString()} kWh/a</p>
                </div>
                <div className="text-center p-2 bg-muted rounded-lg">
                  <p className="text-[10px] text-muted-foreground">Anteil</p>
                  <p className="text-sm font-bold font-mono text-foreground">{result.heizstabAnalyse.anteilAmGesamtverbrauch}%</p>
                </div>
                <div className="text-center p-2 bg-muted rounded-lg">
                  <p className="text-[10px] text-muted-foreground">Mehrkosten</p>
                  <p className="text-sm font-bold font-mono text-foreground">{result.heizstabAnalyse.mehrkostenProJahr}€/a</p>
                </div>
              </div>
              {/* JAZ comparison */}
              <ResponsiveContainer width="100%" height={100}>
                <BarChart data={[
                  { name: "Mit Heizstab", jaz: result.heizstabAnalyse.jazMitHeizstab },
                  { name: "Ohne Heizstab", jaz: result.heizstabAnalyse.jazOhneHeizstab },
                ]} layout="vertical" margin={{ top: 5, right: 30, left: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                  <XAxis type="number" domain={[0, 5.5]} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11, fill: "hsl(var(--foreground))" }} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} formatter={(v: number) => [v.toFixed(2), "JAZ"]} />
                  <Bar dataKey="jaz" radius={[0, 4, 4, 0]} barSize={18}>
                    <Cell fill="hsl(var(--destructive))" />
                    <Cell fill="hsl(var(--success))" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Charts */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <div className="bg-card rounded-xl shadow-card border border-border p-6">
              <h2 className="text-lg font-semibold text-card-foreground mb-4">Energiebilanz</h2>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={[{ name: "Heizung", value: result.heatingDemand }, { name: "Warmwasser", value: result.hotWaterDemand }]} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    <Cell fill="hsl(var(--primary))" />
                    <Cell fill="hsl(var(--accent))" />
                  </Pie>
                  <Tooltip formatter={(value: number) => `${value.toLocaleString()} kWh`} contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-6 text-xs text-muted-foreground mt-2">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-primary inline-block" /> Heizung</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-accent inline-block" /> Warmwasser</span>
              </div>
            </div>
            <div className="bg-card rounded-xl shadow-card border border-border p-6">
              <h2 className="text-lg font-semibold text-card-foreground mb-4">JAZ-Vergleich</h2>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={[{ name: "Heizung", jaz: result.jaz, ziel: 3.5 }, { name: "Warmwasser", jaz: result.jazWarmwasser, ziel: 2.5 }]} layout="vertical" margin={{ top: 5, right: 30, left: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                  <XAxis type="number" domain={[0, 5.5]} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis type="category" dataKey="name" width={85} tick={{ fontSize: 12, fill: "hsl(var(--foreground))" }} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} formatter={(value: number, name: string) => [value.toFixed(2), name === "jaz" ? "Ihr Wert" : "Zielwert"]} />
                  <Legend formatter={(value) => value === "jaz" ? "Ihr Wert" : "Zielwert"} />
                  <Bar dataKey="jaz" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={20} />
                  <Bar dataKey="ziel" fill="hsl(var(--muted-foreground) / 0.3)" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Consumption Comparison */}
          {hasComparison && (
            <div className="bg-card rounded-xl shadow-card border border-border p-6 mb-8">
              <h2 className="text-lg font-semibold text-card-foreground mb-4">Stromverbrauch WP</h2>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={[{ name: "Simuliert (Optimum)", value: result.simulatedConsumption }, { name: "Tatsächlich", value: result.actualConsumption }]} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip formatter={(value: number) => [`${value.toLocaleString()} kWh`, "Verbrauch"]} contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={50}>
                    <Cell fill="hsl(var(--primary))" />
                    <Cell fill={result.deviation > 0 ? "hsl(var(--destructive))" : "hsl(var(--success))"} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-3 text-center space-y-1">
                <span className={`text-sm font-medium ${result.deviation > 0 ? "text-destructive" : "text-success"}`}>
                  {result.deviation > 0 ? "+" : ""}{result.deviation}% Abweichung
                </span>
                {result.isPartialPeriod && (
                  <p className="text-[10px] text-muted-foreground">⚠ Verbrauchsdaten aus {result.measurementDays} Tagen auf 12 Monate hochgerechnet (HGT-gewichtet)</p>
                )}
              </div>
            </div>
          )}

          {/* PV + Wärmepumpe Card */}
          {result.pvAnalyse && (
            <div className="bg-card rounded-xl shadow-card border border-border p-6 mb-8">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-warning/10"><Sun className="h-4 w-4 text-warning" /></div>
                <h2 className="text-lg font-semibold text-card-foreground"><InfoTooltip term="PV-Eigenverbrauch">PV + Wärmepumpe</InfoTooltip></h2>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="text-center p-3 bg-warning/5 rounded-lg">
                  <p className="text-xs text-muted-foreground">WP-Strom durch PV gedeckt</p>
                  <p className="text-2xl font-bold font-mono text-foreground">{result.pvAnalyse.eigenverbrauchAnteil}%</p>
                </div>
                <div className="text-center p-3 bg-success/5 rounded-lg">
                  <p className="text-xs text-muted-foreground">Stromkostenersparnis</p>
                  <p className="text-2xl font-bold font-mono text-success">{result.pvAnalyse.einsparungProJahr}€<span className="text-xs text-muted-foreground">/Jahr</span></p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={result.pvAnalyse.monatsdaten} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="monat" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} formatter={(v: number, name: string) => [`${v} kWh`, name === "wpBedarf" ? "WP-Bedarf" : name === "eigenverbrauch" ? "PV-Eigenverbrauch" : "PV-Ertrag"]} />
                  <Legend formatter={(v) => v === "wpBedarf" ? "WP-Bedarf" : v === "eigenverbrauch" ? "PV-Eigenverbrauch" : "PV-Ertrag"} />
                  <Bar dataKey="wpBedarf" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} barSize={14} />
                  <Bar dataKey="eigenverbrauch" fill="hsl(var(--warning))" radius={[2, 2, 0, 0]} barSize={14} />
                </BarChart>
              </ResponsiveContainer>
              <p className="text-[10px] text-muted-foreground mt-3 text-center">Die größte Überlappung findet in der Übergangszeit (März–April, September–Oktober) statt, wenn sowohl PV-Ertrag als auch Heizbedarf moderat sind.</p>
            </div>
          )}

          {/* Recommendations */}
          <div className="bg-card rounded-xl shadow-card border border-border p-6 mb-8">
            <h2 className="text-lg font-semibold text-card-foreground mb-4">Empfehlungen</h2>
            <div className="space-y-3">
              {result.recommendations.map((rec, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + i * 0.1 }} className="bg-muted rounded-lg overflow-hidden">
                  <Collapsible>
                    <CollapsibleTrigger className="w-full text-left p-4 flex items-start gap-3 hover:bg-muted/80 transition-colors group">
                      <div className="flex flex-col items-center gap-1 flex-shrink-0">
                        <span className="text-xs font-semibold px-2 py-1 rounded bg-primary/10 text-primary whitespace-nowrap">{rec.category}</span>
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${rec.priority === "high" ? "bg-destructive/10 text-destructive" : rec.priority === "medium" ? "bg-warning/10 text-warning" : "bg-muted-foreground/10 text-muted-foreground"}`}>
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
                          {rec.context && <p className="text-xs text-muted-foreground mt-3 leading-relaxed whitespace-pre-line">{rec.context}</p>}
                          {rec.prerequisites && rec.prerequisites.length > 0 && (
                            <div className="mt-3">
                              <div className="flex items-center gap-1.5 mb-2">
                                <ListChecks className="h-3.5 w-3.5 text-primary" />
                                <p className="text-xs font-semibold text-foreground">Voraussetzungen / nächste Schritte:</p>
                              </div>
                              <ol className="space-y-1.5 ml-5">
                                {rec.prerequisites.map((step, j) => (
                                  <li key={j} className="text-xs text-muted-foreground list-decimal leading-relaxed">{step}</li>
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

          {/* Maßnahmen-Szenario Simulator */}
          <ScenarioSimulator
            recommendations={result.recommendations}
            strompreis={result.kostenAnalyse.strompreis / 100}
            aktuellerVerbrauch={result.actualConsumption || result.simulatedConsumption}
            aktuelleJAZ={result.jaz}
            flaecheM2={inputData ? Number(inputData.beheizteFlaeche) || 120 : 120}
            personenAnzahl={inputData ? Number(inputData.personenAnzahl) || 4 : 4}
            plz={inputData?.postleitzahl || ""}
            foerderungenBund={result.foerderungen}
          />

          {/* Fördermöglichkeiten */}
          {result.foerderungen && result.foerderungen.length > 0 && (
            <div className="bg-card rounded-xl shadow-card border border-border p-6 mb-8">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-success/10"><Award className="h-4 w-4 text-success" /></div>
                <h2 className="text-lg font-semibold text-card-foreground"><InfoTooltip term="BEG Einzelmaßnahmen">Fördermöglichkeiten</InfoTooltip></h2>
              </div>
              <div className="space-y-3">
                {result.foerderungen.map((f, i) => (
                  <div key={i} className="p-3 bg-muted rounded-lg flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{f.massnahme}</p>
                      <p className="text-xs text-muted-foreground">{f.programm} · {f.foerderquote}% Zuschuss{f.isfpBonus ? " (+5% iSFP-Bonus)" : ""}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">{f.hinweis}</p>
                    </div>
                    <a href={f.link} target="_blank" rel="noopener noreferrer" className="flex-shrink-0">
                      <Button variant="outline" size="sm"><ExternalLink className="h-3 w-3 mr-1" /> Zum Antrag</Button>
                    </a>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground mt-3">
                Mit einem individuellen Sanierungsfahrplan (iSFP) erhalten Sie zusätzlich 5% Förderung auf Gebäudehüllen-Maßnahmen.
              </p>
              <p className="text-[10px] text-muted-foreground mt-1 italic">
                Angaben ohne Gewähr. Aktuelle Förderbedingungen vor Antragstellung prüfen. Förderkonditionen können sich ändern – aktuelle Bedingungen unter energie-effizienz-experten.de.
              </p>
            </div>
          )}

          {/* Upselling: Vertiefte Analyse + Speichern */}
          {!result.isAdvanced && (
            <div className="bg-gradient-to-br from-primary/5 via-card to-success/5 rounded-xl border border-primary/20 p-6 mb-8">
              <div className="flex items-start gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 flex-shrink-0">
                  <Settings2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground">Vertiefte Analyse verfügbar</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Optimieren Sie Ihr Ergebnis mit zusätzlichen Parametern für eine genauere Bewertung.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                <div className="flex items-start gap-2 p-2.5 bg-card/80 rounded-lg">
                  <Thermometer className="h-3.5 w-3.5 text-primary flex-shrink-0 mt-0.5" />
                  <p className="text-[11px] text-foreground">Vorlauftemperatur, Raumregelung & Heizkörper-Analyse</p>
                </div>
                <div className="flex items-start gap-2 p-2.5 bg-card/80 rounded-lg">
                  <Droplets className="h-3.5 w-3.5 text-primary flex-shrink-0 mt-0.5" />
                  <p className="text-[11px] text-foreground">Warmwasser-Verbrauch & Duschverhalten</p>
                </div>
                <div className="flex items-start gap-2 p-2.5 bg-card/80 rounded-lg">
                  <Zap className="h-3.5 w-3.5 text-primary flex-shrink-0 mt-0.5" />
                  <p className="text-[11px] text-foreground">Heizstab-Analyse mit Leistung & Betriebsstunden</p>
                </div>
                <div className="flex items-start gap-2 p-2.5 bg-card/80 rounded-lg">
                  <Sun className="h-3.5 w-3.5 text-primary flex-shrink-0 mt-0.5" />
                  <p className="text-[11px] text-foreground">PV-Anlage & Batteriespeicher Einbindung</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button variant="hero" className="flex-1" asChild>
                  <Link to="/advanced-check">
                    <Settings2 className="mr-1.5 h-4 w-4" /> Vertiefte Analyse starten
                  </Link>
                </Button>
                {!user && (
                  <Button variant="outline" className="flex-1" asChild>
                    <Link to="/auth">
                      <Save className="mr-1.5 h-4 w-4" /> Kostenlos anmelden & speichern
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Disclaimer */}
          <p className="text-xs text-muted-foreground text-center mb-6">
            Hinweis: Diese Ergebnisse basieren auf einer vereinfachten Simulation nach VDI 4650 / DIN V 18599 und ersetzen keine professionelle Beratung durch einen Energieberater oder Fachplaner.
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="outline" asChild>
              <Link to="/efficiency-check"><RotateCcw className="mr-1 h-4 w-4" /> Neuen Check starten</Link>
            </Button>
            {user && inputData && (
              <Button variant="default" onClick={() => setSaveDialogOpen(true)}>
                <Save className="mr-1 h-4 w-4" />
                {linkedProjectId ? `Check zu "${linkedProjectName}" hinzufügen` : "Projekt speichern"}
              </Button>
            )}
            <Button variant="hero" onClick={() => exportResultsPDF(result, inputData ?? undefined)}>
              <Download className="mr-1 h-4 w-4" /> Als PDF herunterladen
            </Button>
          </div>

          {/* Save Project Dialog */}
          {user && inputData && (
            <SaveProjectDialog
              open={saveDialogOpen}
              onOpenChange={setSaveDialogOpen}
              inputData={inputData}
              resultData={result}
              preselectedProjectId={linkedProjectId}
              preselectedProjectName={linkedProjectName}
            />
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default ResultsPage;
