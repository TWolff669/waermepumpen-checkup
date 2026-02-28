import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, Trash2, CheckCircle, AlertTriangle } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ComposedChart } from "recharts";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";

interface Check {
  id: string;
  check_date: string;
  heating_period: string | null;
  is_advanced: boolean;
  created_at: string;
  result_data: any;
  input_data: any;
}

const ProjectHistory = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Load project
  const { data: project } = useQuery({
    queryKey: ["project", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, name, address, user_id")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id && !!user,
  });

  // Redirect if not owner
  useEffect(() => {
    if (project && user && project.user_id !== user.id) navigate("/projekte");
  }, [project, user, navigate]);

  // Load checks
  const { data: checks, isLoading } = useQuery({
    queryKey: ["checks", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("checks")
        .select("*")
        .eq("project_id", id!)
        .order("check_date", { ascending: true });
      if (error) throw error;
      return data as Check[];
    },
    enabled: !!id && !!user,
  });

  const deleteMutation = useMutation({
    mutationFn: async (checkId: string) => {
      const { error } = await supabase.from("checks").delete().eq("id", checkId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checks", id] });
      toast({ title: "Check gelöscht" });
    },
  });

  const loadCheck = (check: Check) => {
    navigate(`/results?check=${check.id}`);
  };

  if (!user) { navigate("/auth"); return null; }

  // Trend chart data
  const trendData = (checks || []).map((c) => {
    const score = c.result_data?.score ?? null;
    const jaz = c.result_data?.jaz ?? null;
    return {
      date: new Date(c.check_date).toLocaleDateString("de-DE", { month: "short", year: "numeric" }),
      score: score === -1 ? null : score,
      jaz: jaz ? parseFloat(jaz.toFixed(2)) : null,
      period: c.heating_period || "",
      consumption: c.result_data?.actualConsumption || null,
    };
  });

  // Consumption comparison data (only checks with actual consumption)
  const consumptionData = (checks || [])
    .filter((c) => c.result_data?.score !== -1 && c.result_data?.actualConsumption)
    .map((c) => ({
      period: c.heating_period || new Date(c.check_date).toLocaleDateString("de-DE", { month: "short", year: "numeric" }),
      simuliert: c.result_data?.simulatedConsumption || 0,
      tatsaechlich: c.result_data?.actualConsumption || 0,
    }));

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-3xl py-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Button variant="ghost" size="sm" onClick={() => navigate("/projekte")} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-1" /> Zurück
          </Button>

          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">{project?.name || "Projektverlauf"}</h1>
              {project?.address && <p className="text-muted-foreground mt-1">{project.address}</p>}
            </div>
            <Button variant="hero" size="sm" onClick={() => navigate(`/efficiency-check?project=${id}`)}>
              <Plus className="h-4 w-4 mr-1" /> Neuer Check
            </Button>
          </div>

          {isLoading ? (
            <p className="text-muted-foreground text-center py-12">Laden...</p>
          ) : !checks || checks.length === 0 ? (
            <div className="bg-card rounded-xl shadow-card border border-border p-12 text-center">
              <p className="text-muted-foreground mb-4">Noch keine Checks für dieses Projekt.</p>
              <Button variant="hero" onClick={() => navigate(`/efficiency-check?project=${id}`)}>
                <Plus className="h-4 w-4 mr-1" /> Ersten Check durchführen
              </Button>
            </div>
          ) : (
            <>
              {/* Trend Chart */}
              {trendData.some((d) => d.score !== null) && (
                <div className="bg-card rounded-xl shadow-card border border-border p-6 mb-6">
                  <h2 className="text-lg font-semibold text-card-foreground mb-4">Effizienz-Trend</h2>
                  <ResponsiveContainer width="100%" height={250}>
                    <ComposedChart data={trendData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis yAxisId="score" domain={[0, 100]} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} label={{ value: "Score", angle: -90, position: "insideLeft", style: { fontSize: 11, fill: "hsl(var(--muted-foreground))" } }} />
                      <YAxis yAxisId="jaz" orientation="right" domain={[0, 6]} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} label={{ value: "JAZ", angle: 90, position: "insideRight", style: { fontSize: 11, fill: "hsl(var(--muted-foreground))" } }} />
                      <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
                      <Legend />
                      <Line yAxisId="score" type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 5, fill: "hsl(var(--primary))" }} name="Score" connectNulls />
                      <Line yAxisId="jaz" type="monotone" dataKey="jaz" stroke="hsl(var(--accent))" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 4, fill: "hsl(var(--accent))" }} name="JAZ" connectNulls />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Consumption Comparison */}
              {consumptionData.length > 0 && (
                <div className="bg-card rounded-xl shadow-card border border-border p-6 mb-6">
                  <h2 className="text-lg font-semibold text-card-foreground mb-4">Verbrauch pro Heizperiode</h2>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={consumptionData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="period" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                      <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} formatter={(v: number) => [`${v.toLocaleString()} kWh`, ""]} />
                      <Legend />
                      <Bar dataKey="simuliert" name="Simuliert (Optimum)" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={24} />
                      <Bar dataKey="tatsaechlich" name="Tatsächlich" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} barSize={24} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Checks Table */}
              <div className="bg-card rounded-xl shadow-card border border-border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="text-left p-3 font-medium text-muted-foreground">Datum</th>
                        <th className="text-left p-3 font-medium text-muted-foreground">Heizperiode</th>
                        <th className="text-center p-3 font-medium text-muted-foreground">Score</th>
                        <th className="text-center p-3 font-medium text-muted-foreground">JAZ</th>
                        <th className="text-right p-3 font-medium text-muted-foreground">Verbrauch</th>
                        <th className="text-center p-3 font-medium text-muted-foreground">Abw.</th>
                        <th className="text-center p-3 font-medium text-muted-foreground">Erw.</th>
                        <th className="p-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {(checks || []).slice().reverse().map((check) => {
                        const score = check.result_data?.score ?? null;
                        const jaz = check.result_data?.jaz ?? null;
                        const consumption = check.result_data?.actualConsumption ?? null;
                        const deviation = check.result_data?.deviation ?? null;
                        return (
                          <tr key={check.id} className="border-b border-border/50 hover:bg-muted/30 cursor-pointer transition-colors" onClick={() => loadCheck(check)}>
                            <td className="p-3">{new Date(check.check_date).toLocaleDateString("de-DE")}</td>
                            <td className="p-3">{check.heating_period || "–"}</td>
                            <td className="p-3 text-center">
                              {score === null || score === -1 ? (
                                <span className="text-muted-foreground">–</span>
                              ) : (
                                <span className={`font-mono font-bold ${score >= 70 ? "text-success" : score >= 40 ? "text-warning" : "text-destructive"}`}>{score}</span>
                              )}
                            </td>
                            <td className="p-3 text-center font-mono">{jaz ? jaz.toFixed(2) : "–"}</td>
                            <td className="p-3 text-right font-mono">{consumption ? `${consumption.toLocaleString()} kWh` : "–"}</td>
                            <td className="p-3 text-center">
                              {deviation !== null && score !== -1 ? (
                                <span className={`text-xs font-medium ${deviation > 0 ? "text-destructive" : "text-success"}`}>
                                  {deviation > 0 ? "+" : ""}{deviation}%
                                </span>
                              ) : "–"}
                            </td>
                            <td className="p-3 text-center">{check.is_advanced ? "✓" : "✗"}</td>
                            <td className="p-3">
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Check löschen?</AlertDialogTitle>
                                    <AlertDialogDescription>Dieser Check wird unwiderruflich gelöscht.</AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => deleteMutation.mutate(check.id)}>Löschen</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default ProjectHistory;
