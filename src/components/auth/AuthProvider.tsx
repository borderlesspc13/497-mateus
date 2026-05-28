"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import { getMyProfile } from "@/actions/auth";
import type { UserRole } from "@/lib/auth/roles";
import {
  establishServerSession,
  signOutUser,
  subscribeAuthState,
  type AuthUser,
} from "@/lib/firebase/auth-client";

export type AuthContextUser = AuthUser & {
  role: UserRole | null;
};

type AuthContextValue = {
  user: AuthContextUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthContextUser | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (baseUser: AuthUser) => {
    try {
      await establishServerSession();
      const profile = await getMyProfile();
      setUser({
        ...baseUser,
        role: profile?.role ?? null,
      });
    } catch {
      setUser({ ...baseUser, role: null });
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    const profile = await getMyProfile();
    setUser((prev) =>
      prev ? { ...prev, role: profile?.role ?? prev.role } : prev,
    );
  }, [user]);

  useEffect(() => {
    const unsubscribe = subscribeAuthState((nextUser) => {
      if (!nextUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      void loadProfile(nextUser).finally(() => setLoading(false));
    });

    return unsubscribe;
  }, [loadProfile]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      signOut: signOutUser,
      refreshProfile,
    }),
    [user, loading, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider.");
  }
  return context;
}
