import { motion } from "framer-motion";
import { Folder, Trash2, Calendar, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Header from "@/components/Header";
import { useToast } from "@/hooks/use-toast";

interface Project {
  id: string;
  name: string;
  address: string | null;
  is_advanced: boolean;
  created_at: string;
  result_data: any;
}

const Projekte = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: projects, isLoading } = useQuery({
    queryKey: ["projects", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, name, address, is_advanced, created_at, result_data")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Project[];
    },
    enabled: !!user,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("projects").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast({ title: "Projekt gelöscht" });
    },
  });

  const loadProject = async (project: Project) => {
    const { data } = await supabase.from("projects").select("input_data, result_data").eq("id", project.id).single();
    if (data) {
      sessionStorage.setItem("wp-check-data", JSON.stringify(data.input_data));
      sessionStorage.setItem("wp-check-result", JSON.stringify(data.result_data));
      navigate("/results");
    }
  };

  if (!user) {
    navigate("/auth");
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container max-w-2xl py-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-foreground mb-8">Meine Projekte</h1>

          {isLoading ? (
            <div className="text-center text-muted-foreground py-12">Laden...</div>
          ) : !projects || projects.length === 0 ? (
            <div className="bg-card rounded-xl shadow-card border border-border p-12 text-center">
              <Folder className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-card-foreground mb-2">Keine Projekte</h2>
              <p className="text-muted-foreground mb-6">Starten Sie einen Effizienz-Check und speichern Sie die Ergebnisse.</p>
              <Button variant="hero" onClick={() => navigate("/efficiency-check")}>
                Jetzt Check starten <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {projects.map((project) => {
                const score = project.result_data?.score ?? null;
                const scoreDisplay = score === -1 ? "–" : score;
                return (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-card rounded-xl shadow-card border border-border p-5 flex items-center gap-4 hover:shadow-elevated transition-shadow cursor-pointer"
                    onClick={() => loadProject(project)}
                  >
                    <div className="flex-shrink-0">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-lg font-mono font-bold text-lg ${
                        score === null || score === -1 ? "bg-muted text-muted-foreground" :
                        score >= 70 ? "bg-success/10 text-success" :
                        score >= 40 ? "bg-warning/10 text-warning" :
                        "bg-destructive/10 text-destructive"
                      }`}>
                        {scoreDisplay}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate">{project.name}</h3>
                      {project.address && (
                        <p className="text-sm text-muted-foreground truncate">{project.address}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {new Date(project.created_at).toLocaleDateString("de-DE")}
                        </span>
                        {project.is_advanced && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary">Erweitert</span>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteMutation.mutate(project.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Projekte;
