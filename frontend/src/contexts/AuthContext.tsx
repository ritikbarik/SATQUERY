import React, { createContext, useContext, useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isConfigured: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithGitHub: () => Promise<void>;
  signInAsDemo: (name?: string, email?: string) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check local storage for demo session first
    const savedDemoUser = localStorage.getItem("satquery_demo_user");
    if (savedDemoUser) {
      try {
        const parsed = JSON.parse(savedDemoUser);
        setUser(parsed);
        setLoading(false);
        return;
      } catch (e) {
        localStorage.removeItem("satquery_demo_user");
      }
    }

    if (isSupabaseConfigured) {
      // Get initial session
      supabase.auth.getSession().then(({ data: { session: s } }) => {
        setSession(s);
        setUser(s?.user ?? null);
        setLoading(false);
      }).catch(() => {
        setLoading(false);
      });

      // Listen for auth state changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
        setSession(s);
        setUser(s?.user ?? null);
        setLoading(false);
      });

      return () => subscription.unsubscribe();
    } else {
      setLoading(false);
    }
  }, []);

  const signInWithGoogle = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin },
      });
    } else {
      // Graceful simulated Google OAuth
      const mockUser = {
        id: "demo-google-user",
        app_metadata: { provider: "google" },
        user_metadata: {
          full_name: "Ritik Barik",
          avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
          email: "ritikbarik@gmail.com",
        },
        aud: "authenticated",
        created_at: new Date().toISOString(),
        email: "ritikbarik@gmail.com",
      } as unknown as User;
      setUser(mockUser);
      localStorage.setItem("satquery_demo_user", JSON.stringify(mockUser));
    }
  };

  const signInWithGitHub = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signInWithOAuth({
        provider: "github",
        options: { redirectTo: window.location.origin },
      });
    } else {
      // Graceful simulated GitHub OAuth
      const mockUser = {
        id: "demo-github-user",
        app_metadata: { provider: "github" },
        user_metadata: {
          full_name: "Ritik Barik (GitHub)",
          avatar_url: "https://github.com/ritikbarik.png",
          email: "proffzavris@gmail.com",
        },
        aud: "authenticated",
        created_at: new Date().toISOString(),
        email: "proffzavris@gmail.com",
      } as unknown as User;
      setUser(mockUser);
      localStorage.setItem("satquery_demo_user", JSON.stringify(mockUser));
    }
  };

  const signInAsDemo = (name = "Satellite Geospatial Analyst", email = "analyst@satquery.ai") => {
    const mockUser = {
      id: "demo-analyst",
      app_metadata: { provider: "satquery" },
      user_metadata: {
        full_name: name,
        email: email,
      },
      aud: "authenticated",
      created_at: new Date().toISOString(),
      email: email,
    } as unknown as User;
    setUser(mockUser);
    localStorage.setItem("satquery_demo_user", JSON.stringify(mockUser));
  };

  const signOut = async () => {
    localStorage.removeItem("satquery_demo_user");
    setUser(null);
    setSession(null);
    if (isSupabaseConfigured) {
      await supabase.auth.signOut().catch(() => {});
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      isConfigured: isSupabaseConfigured,
      signInWithGoogle,
      signInWithGitHub,
      signInAsDemo,
      signOut
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
