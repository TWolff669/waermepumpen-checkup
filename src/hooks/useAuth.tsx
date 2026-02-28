import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import { type UserTier, type TierProfile, fetchTierProfile } from "@/lib/tier-guard";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  tierProfile: TierProfile | null;
  refreshTierProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  tierProfile: null,
  refreshTierProfile: async () => {},
  signOut: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [tierProfile, setTierProfile] = useState<TierProfile | null>(null);

  const loadTierProfile = useCallback(async (userId: string) => {
    const profile = await fetchTierProfile(userId);
    setTierProfile(profile);
  }, []);

  const refreshTierProfile = useCallback(async () => {
    if (user?.id) await loadTierProfile(user.id);
  }, [user?.id, loadTierProfile]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user?.id) {
        // Defer profile fetch to avoid Supabase deadlocks during auth callbacks
        setTimeout(() => loadTierProfile(session.user.id), 0);
      } else {
        setTierProfile(null);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user?.id) {
        loadTierProfile(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadTierProfile]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setTierProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, tierProfile, refreshTierProfile, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
